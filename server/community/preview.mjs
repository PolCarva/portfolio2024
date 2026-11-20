import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { pathToFileURL } from "node:url";
import chromium from "@sparticuz/chromium";
import { chromium as browserType } from "playwright-core";
import { defaults, validateContent } from "../schema.mjs";
import { readObject } from "../storage.mjs";
const root = process.cwd();
const mime = {
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
};
export async function renderReview(
  scene,
  { deadline = Date.now() + 90000 } = {},
) {
  const { renderPreview } = await import(
    pathToFileURL(resolve(root, ".generated/community-preview.mjs")).href
  );
  const current = await readObject("content/current.json");
  const content = validateContent(
    current ? JSON.parse(current.bytes).content : defaults,
  );
  const css = (
    await Promise.all(
      [
        "src/index.css",
        "src/project-artwork.css",
        "src/community/community.css",
      ].map((p) => readFile(resolve(root, p), "utf8")),
    )
  ).join("\n");
  const browser = await browserType.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
    timeout: Math.min(25000, Math.max(1, deadline - Date.now())),
  });
  const images = [];
  try {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      reducedMotion: "reduce",
      deviceScaleFactor: 1,
    });
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname !== "portfolio-preview.invalid") return route.abort();
      try {
        if (url.pathname === "/api/media") {
          const name = url.searchParams.get("file");
          if (!/^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(name || ""))
            return route.abort();
          const media = await readObject("media/" + name);
          if (!media) return route.abort();
          return route.fulfill({
            status: 200,
            contentType: mime[extname(name)],
            body: media.bytes,
          });
        }
        if (!/^\/(fonts|images|img)\/[a-zA-Z0-9_.-]+$/.test(url.pathname))
          return route.abort();
        const bytes = await readFile(resolve(root, "public" + url.pathname));
        return route.fulfill({
          status: 200,
          contentType:
            mime[extname(url.pathname)] || "application/octet-stream",
          body: bytes,
        });
      } catch {
        return route.abort();
      }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    for (const [width, height] of [
      [1280, 900],
      [390, 844],
    ]) {
      if (Date.now() > deadline) throw new Error("Preview deadline");
      await page.setViewportSize({ width, height });
      const markup = renderPreview(content, scene, "es");
      await page.setContent(
        `<!doctype html><html lang="es"><head><base href="https://portfolio-preview.invalid/"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${markup}</body></html>`,
        { waitUntil: "load", timeout: 15000 },
      );
      await page.evaluate(() => document.fonts.ready);
      const integrity = await page.evaluate(() => ({
        heading: document.querySelectorAll("h1").length,
        overflow: document.documentElement.scrollWidth > innerWidth + 2,
        canvases: document.querySelectorAll(".community-canvas").length,
        links: [...document.querySelectorAll("a")].filter((a) =>
          a.getAttribute("href")?.startsWith("javascript:"),
        ).length,
      }));
      if (
        integrity.heading !== 1 ||
        integrity.overflow ||
        integrity.canvases !== 3 ||
        integrity.links
      )
        throw new Error("Preview integrity failed");
      images.push(
        await page.screenshot({
          fullPage: true,
          type: "jpeg",
          quality: 70,
          timeout: 15000,
        }),
      );
      // Sample fixed phases of the only three allowed motion functions. No user code executes.
      for (const phase of [0, 0.25, 0.5]) {
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await page.addStyleTag({
          content: `.community-node{animation-play-state:paused!important}.community-motion-float{animation-delay:-${7 * phase}s!important}.community-motion-orbit{animation-delay:-${12 * phase}s!important}.community-motion-bounce{animation-delay:-${4 * phase}s!important}`,
        });
        const zones =
          phase === 0
            ? ["hero", "work", "contact"]
            : [
                ...new Set(
                  scene.nodes
                    .filter((n) => n.motion !== "none")
                    .map((n) => n.zone),
                ),
              ];
        for (const zone of zones) {
          const index = ["hero", "work", "contact"].indexOf(zone);
          images.push(
            await page
              .locator(".community-canvas")
              .nth(index)
              .screenshot({ type: "jpeg", quality: 75 }),
          );
        }
      }
      await page.emulateMedia({ reducedMotion: "reduce" });
    }
    if (
      images.length > 20 ||
      images.reduce((sum, b) => sum + b.length, 0) > 16_000_000
    )
      throw new Error("Preview image limit");
    return {
      images,
      contentRevision: current ? JSON.parse(current.bytes).revision : "initial",
    };
  } finally {
    await browser.close();
  }
}
