import {
  protectedVisualSelector,
  exclusionPath,
} from "../../shared/community-protection.mjs";
import { assessProgramQuality } from "./quality.mjs";
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
  { deadline = Date.now() + 45000, prompt: argumentsPrompt = "" } = {},
) {
  const started = Date.now(),
    mark = (stage) =>
      console.info("community_preview", stage, Date.now() - started);
  mark("start");
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
  mark("assets_ready");
  chromium.setGraphicsMode = false;
  const executablePath = await bounded(chromium.executablePath(), 15000);
  mark("binary_ready");
  const server = await browserType.launchServer({
    args: [
      ...chromium.args.filter((x) => x !== "--in-process-gpu"),
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
    executablePath,
    headless: true,
    timeout: Math.min(15000, Math.max(1, deadline - Date.now())),
  });
  try {
    const browser = await browserType.connect(server.wsEndpoint(), {
      timeout: 8000,
    });
    mark("browser_ready");
    return await bounded(
      (async () => {
        const context = await browser.newContext({
          javaScriptEnabled: Boolean(scene.program),
          reducedMotion: scene.program ? "no-preference" : "reduce",
          deviceScaleFactor: 1,
        });
        await context.route("**/*", async (route) => {
          const url = new URL(route.request().url());
          if (url.hostname !== "portfolio-preview.invalid")
            return route.abort();
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
            return route.fulfill({
              status: 200,
              contentType:
                mime[extname(url.pathname)] || "application/octet-stream",
              body: await readFile(resolve(root, "public" + url.pathname)),
            });
          } catch {
            return route.abort();
          }
        });
        const page = await context.newPage(),
          cdp = await context.newCDPSession(page),
          images = [],
          temporalReports = [];
        for (const [width, height] of [
          [1280, 900],
          [390, 844],
        ]) {
          if (Date.now() > deadline) throw new Error("Preview timeout");
          mark("viewport_" + width);
          await page.setViewportSize({ width, height });
          await page.emulateMedia({
            reducedMotion: scene.program ? "no-preference" : "reduce",
          });
          const markup = renderPreview(content, scene, "es");
          await page.setContent(
            `<!doctype html><html lang="es"><head><base href="https://portfolio-preview.invalid/"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css} html{scroll-behavior:auto!important} *:not(.community-node){animation:none!important;transition:none!important}.community-node{animation-play-state:paused!important}</style></head><body>${markup}</body></html>`,
            { waitUntil: "load", timeout: 10000 },
          );
          mark("html_ready");
          if (scene.program) {
            const frame = page.frames().find((frame) => frame.parentFrame());
            if (!frame) throw new Error("Program frame missing");
            try {
              await bounded(
                frame.waitForSelector('html[data-status="prepared"]', {
                  state: "attached",
                  timeout: 3000,
                }),
                3500,
              );
            } catch {
              const raw = await frame
                .locator("html")
                .getAttribute("data-program-probe")
                .catch(() => null);
              const detail = raw ? JSON.parse(raw).lastError : null;
              throw Object.assign(new Error("Program did not start"), {
                code: "quality",
                issues: [
                  detail ? "program_error: " + detail : "program_did_not_start",
                ],
              });
            }
            const rects = await page.evaluate(
              (selector) =>
                [...document.querySelectorAll(selector)].map((node) => {
                  const r = node.getBoundingClientRect();
                  return {
                    width: r.width,
                    height: r.height,
                    left: r.left,
                    top: r.top,
                    right: r.right,
                    bottom: r.bottom,
                  };
                }),
              protectedVisualSelector,
            );
            await page.locator("iframe.community-program").evaluate(
              (node, path) => {
                node.style.clipPath = path;
              },
              exclusionPath(rects, width, height),
            );
          }

          await bounded(
            page.evaluate(() => document.fonts.ready.then(() => true)),
            3000,
          );
          // CDP inspection/capture needs no page-side scripts or actionability polling.
          await cdp.send("DOM.enable");
          await cdp.send("CSS.enable");
          const { root: document } = await cdp.send("DOM.getDocument", {
            depth: 1,
          });
          const heading = await cdp.send("DOM.querySelectorAll", {
            nodeId: document.nodeId,
            selector: "h1",
          });
          const bands = await cdp.send("DOM.querySelectorAll", {
            nodeId: document.nodeId,
            selector: ".community-canvas",
          });
          const metrics = await cdp.send("Page.getLayoutMetrics");
          const size = metrics.cssContentSize;
          mark("layout_" + size.width + "x" + size.height);
          if (
            heading.nodeIds.length !== 1 ||
            bands.nodeIds.length !== 3 ||
            size.width > width + 2 ||
            size.height > 26000
          )
            throw new Error("Preview integrity failed");
          const shot = async (clip) => {
            if (Date.now() > deadline) throw new Error("Preview timeout");
            const { data } = await bounded(
              cdp.send("Page.captureScreenshot", {
                format: "jpeg",
                quality: 72,
                fromSurface: true,
                captureBeyondViewport: true,
                clip: {
                  ...clip,
                  scale: Math.min(1, 1568 / Math.max(clip.width, clip.height)),
                },
              }),
              5000,
            );
            images.push(Buffer.from(data, "base64"));
          };
          if (scene.program) {
            const frame = page.frames().find((frame) => frame.parentFrame());
            await page.evaluate(() =>
              document
                .querySelector("iframe.community-program")
                .contentWindow.postMessage(
                  { type: "portfolio-preview-start" },
                  "*",
                ),
            );
            for (const phase of ["moving", "paused", "resumed"]) {
              try {
                await bounded(
                  frame.waitForFunction(
                    (phase) => {
                      const raw = document.documentElement.dataset.programProbe;
                      if (!raw) return false;
                      const p = JSON.parse(raw),
                        samples = p.samples || [],
                        last = samples.at(-1);
                      if (document.documentElement.dataset.status === "error")
                        throw new Error("Program runtime failed");
                      if (phase === "moving")
                        return (
                          samples.filter((s) => s.phase === "moving").length >=
                          10
                        );
                      if (phase === "paused")
                        return (
                          samples.filter((s) => s.phase === "paused").length >=
                            3 && last.phase === "paused"
                        );
                      return (
                        samples.length >= 24 &&
                        samples.filter((s) => s.phase === "paused").length >=
                          3 &&
                        last?.phase === "moving" &&
                        samples.filter((s) => s.phase === "moving").length >= 14
                      );
                    },
                    phase,
                    { timeout: 3500 },
                  ),
                  4000,
                );
              } catch {
                const raw = await frame
                  .locator("html")
                  .getAttribute("data-program-probe")
                  .catch(() => null);
                const detail = raw ? JSON.parse(raw).lastError : null;
                throw Object.assign(new Error("Program motion probe failed"), {
                  code: "quality",
                  issues: [
                    detail
                      ? "program_error: " + detail
                      : "program_motion_or_pause_failed",
                  ],
                });
              }
              const data = await frame.evaluate(() => {
                const source = document.querySelector("body > canvas#surface"),
                  shot = document.createElement("canvas");
                const scale = Math.min(
                  1,
                  640 / source.width,
                  480 / source.height,
                );
                shot.width = Math.max(1, Math.round(source.width * scale));
                shot.height = Math.max(1, Math.round(source.height * scale));
                const ctx = shot.getContext("2d");
                ctx.fillStyle = "#f2f0e9";
                ctx.fillRect(0, 0, shot.width, shot.height);
                ctx.drawImage(source, 0, 0, shot.width, shot.height);
                return shot.toDataURL("image/jpeg", 0.75).split(",")[1];
              });
              images.push(Buffer.from(data, "base64"));
            }
            const report = await frame.evaluate(() => ({
              status: document.documentElement.dataset.status,
              ...JSON.parse(
                document.documentElement.dataset.programProbe || "{}",
              ),
            }));
            temporalReports.push({
              viewport: width < 800 ? "mobile" : "desktop",
              ...report,
            });
          }
          await shot({ x: 0, y: 0, width, height: Math.ceil(size.height) });
          mark("full_screenshot_done");

          const { frameTree } = await cdp.send("Page.getFrameTree");
          const { styleSheetId } = await cdp.send("CSS.createStyleSheet", {
            frameId: frameTree.frame.id,
          });
          for (const phase of [0]) {
            await page.emulateMedia({ reducedMotion: "no-preference" });
            await cdp.send("CSS.setStyleSheetText", {
              styleSheetId,
              text: `.community-node{animation-play-state:paused!important}.community-motion-float{animation-delay:-${7 * phase}s!important}.community-motion-orbit{animation-delay:-${12 * phase}s!important}.community-motion-bounce{animation-delay:-${4 * phase}s!important}`,
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
              const { model } = await cdp.send("DOM.getBoxModel", {
                nodeId:
                  bands.nodeIds[["hero", "work", "contact"].indexOf(zone)],
              });
              const xs = model.border.filter((_, i) => i % 2 === 0),
                ys = model.border.filter((_, i) => i % 2 === 1);
              await shot({
                x: Math.max(0, Math.min(...xs)),
                y: Math.max(0, Math.min(...ys)),
                width: Math.max(...xs) - Math.min(...xs),
                height: Math.max(...ys) - Math.min(...ys),
              });
            }
          }
        }
        if (
          images.length > 14 ||
          images.reduce((n, b) => n + b.length, 0) > 16_000_000
        )
          throw new Error("Preview image limit");
        mark("captured");
        return {
          images,
          quality: scene.program
            ? assessProgramQuality(temporalReports, argumentsPrompt, {
                canvasExpected: !scene.program.html.trim(),
              })
            : null,
          contentRevision: current
            ? JSON.parse(current.bytes).revision
            : "initial",
        };
      })(),
      Math.max(1, deadline - Date.now()),
    );
  } catch (error) {
    console.error(
      "community_preview_error",
      error.name,
      error.message.split("\n")[0].slice(0, 180),
    );
    throw error;
  } finally {
    await bounded(server.close(), 1500).catch(() => {});
    if (server.process().exitCode === null) server.process().kill("SIGKILL");
    mark("closed");
  }
}
async function bounded(promise, ms) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Preview timeout")), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
