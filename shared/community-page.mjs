import { serializeProgramData as literal } from "./community-program.mjs";
function pageRuntime(config) {
  "use strict";
  const { source, extra, viewportHeight, language } = config,
    send = parent.postMessage.bind(parent);
  const state = { errors: [], frames: 0, ready: false },
    originalError = console.error.bind(console);
  function report(error) {
    state.errors.push(String(error?.message || error).slice(0, 160));
    state.errors = state.errors.slice(-5);
    document.documentElement.dataset.pageProbe = JSON.stringify(state);
    originalError(error);
  }
  addEventListener("error", (e) => report(e.error || e.message));
  addEventListener("unhandledrejection", (e) => report(e.reason));
  window.community = {
    viewport: { width: innerWidth, height: viewportHeight },
    language: language,
    ready: () => {},
  };
  document.body.insertAdjacentHTML("beforeend", extra);
  // Preserve the baseline controls without granting the document host access.
  const menu = document.querySelector(".menu-toggle"),
    nav = document.getElementById("navigation");
  function closeMenu() {
    nav?.classList.remove("is-open");
    menu?.setAttribute("aria-expanded", "false");
  }
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented) return;
    if (event.target.closest(".menu-toggle")) {
      const open = nav?.classList.toggle("is-open");
      menu?.setAttribute("aria-expanded", String(Boolean(open)));
    }
    const a = event.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href");
    if (href?.startsWith("#")) {
      event.preventDefault();
      document
        .getElementById(href.slice(1))
        ?.scrollIntoView({ behavior: "smooth" });
      closeMenu();
    } else if (href === "/" || href === "/es/") {
      event.preventDefault();
      send({ type: "community-page-language", path: href }, "*");
    } else {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
  const contacts = new Map();
  community.sendContact = (data) =>
    new Promise((resolve) => {
      if (contacts.size >= 3) {
        resolve(false);
        return;
      }
      const id = crypto.randomUUID(),
        timer = setTimeout(() => {
          contacts.delete(id);
          resolve(false);
        }, 21000);
      contacts.set(id, { resolve, timer });
      send({ type: "community-page-contact", id, data }, "*");
    });
  addEventListener("message", (event) => {
    if (
      event.source !== parent ||
      event.data?.type !== "community-contact-result"
    )
      return;
    const entry = contacts.get(event.data.id);
    if (!entry) return;
    contacts.delete(event.data.id);
    clearTimeout(entry.timer);
    entry.resolve(event.data.ok === true);
  });
  const dataRequests = new Map();
  function dataRequest(op, key, value) {
    return new Promise((resolve, reject) => {
      if (dataRequests.size >= 16) {
        reject(new Error("busy"));
        return;
      }
      const id = crypto.randomUUID(),
        timer = setTimeout(() => {
          dataRequests.delete(id);
          reject(new Error("timeout"));
        }, 20000);
      dataRequests.set(id, { resolve, reject, timer });
      send({ type: "community-page-data", id, data: { op, key, value } }, "*");
    });
  }
  community.data = {
    get: (key) => dataRequest("get", key),
    set: (key, value) => dataRequest("set", key, value),
    increment: (key, value = 1) => dataRequest("increment", key, value),
    append: (key, value) => dataRequest("append", key, value),
  };
  addEventListener("message", (event) => {
    if (event.source !== parent || event.data?.type !== "community-data-result")
      return;
    const entry = dataRequests.get(event.data.id);
    if (!entry) return;
    dataRequests.delete(event.data.id);
    clearTimeout(entry.timer);
    event.data.error
      ? entry.reject(new Error(event.data.error))
      : entry.resolve(event.data.value);
  });
  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (event.defaultPrevented || !form.matches(".contact-form")) return;
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]'),
      status = form.querySelector(".form-status");
    if (button?.disabled) return;
    if (button) button.disabled = true;
    const ok = await community.sendContact(
      Object.fromEntries(new FormData(form)),
    );
    if (button) button.disabled = false;
    if (ok) form.reset();
    if (status)
      status.textContent = ok
        ? language === "es"
          ? "Mensaje enviado."
          : "Message sent."
        : language === "es"
          ? "No se pudo enviar. Probá otra vez."
          : "Could not send. Please try again.";
  });
  try {
    const script = document.createElement("script");
    script.nonce = "community-page";
    script.textContent = source;
    document.body.append(script);
  } catch (error) {
    report(error);
  }
  let lastSurfaces = "";
  function surfaces() {
    const list = [
      ...document.querySelectorAll(
        ".community-canvas--image .community-coordinate-plane",
      ),
    ]
      .slice(0, 20)
      .map((svg) => {
        const m = svg.getScreenCTM(),
          r = svg.getBoundingClientRect(),
          width = svg.clientWidth,
          height = svg.clientHeight;
        if (!m || !width || !height) return null;
        return {
          zone: svg
            .closest(".community-canvas")
            .id.slice("community-canvas-".length),
          width,
          height,
          a: (m.a * 1000) / width,
          b: (m.b * 1000) / width,
          c: (m.c * 240) / height,
          d: (m.d * 240) / height,
          e: m.e,
          f: m.f,
        };
      })
      .filter(Boolean);
    const value = JSON.stringify(list);
    if (value !== lastSurfaces) {
      lastSurfaces = value;
      send({ type: "community-page-surfaces", surfaces: list }, "*");
    }
  }
  let lastHeight = 0;
  function size() {
    const height = Math.min(
      30000,
      Math.max(
        400,
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
      ),
    );
    if (height !== lastHeight) {
      lastHeight = height;
      send({ type: "community-page-size", height }, "*");
    }
  }
  addEventListener("message", (event) => {
    if (event.source !== parent) return;
    if (event.data?.type === "community-page-viewport") {
      const d = event.data;
      community.viewport = {
        width: innerWidth,
        height: Math.min(2000, Math.max(200, d.height)),
      };
      community.scrollY = Math.max(0, Number(d.scrollY) || 0);
      document.documentElement.style.setProperty(
        "--community-vh",
        community.viewport.height / 100 + "px",
      );
      if (canvas) {
        canvas.style.top = community.scrollY + "px";
        canvas.style.height = community.viewport.height + "px";
      }
      size();
    }
    if (event.data?.type === "community-page-ping") {
      lastHeight = 0;
      size();
    }
  });
  new ResizeObserver(size).observe(document.body);
  let ctx,
    canvas,
    last = performance.now();
  if (typeof render === "function") {
    canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:absolute;top:0;left:0;pointer-events:none;width:100%;height:" +
      community.viewport.height +
      "px;z-index:90";
    document.body.append(canvas);
    ctx = canvas.getContext("2d");
  }
  const pointer = { x: 0, y: 0, down: false };
  for (const type of ["pointermove", "pointerdown", "pointerup"])
    addEventListener(type, (e) =>
      Object.assign(pointer, {
        x: e.clientX,
        y: e.clientY - (community.scrollY || 0),
        down: e.buttons > 0,
      }),
    );
  function tick(now) {
    try {
      if (ctx && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const width = innerWidth,
          height = community.viewport.height;
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
        ctx.reset();
        render({
          ctx,
          width,
          height,
          pointer,
          time: now / 1000,
          dt: Math.min(0.1, (now - last) / 1000),
          scrollY: community.scrollY || 0,
        });
      }
      state.frames++;
      if (state.frames % 3 === 0) surfaces();
      last = now;
      state.ready = true;
      document.documentElement.dataset.pageProbe = JSON.stringify(state);
      document.documentElement.dataset.status = state.errors.length
        ? "error"
        : "ready";
      if (state.frames === 2) size();
      requestAnimationFrame(tick);
    } catch (error) {
      report(error);
      document.documentElement.dataset.status = "error";
    }
  }
  requestAnimationFrame(tick);
}
export function pageDocument(
  program,
  {
    html,
    styles = "",
    base = "https://www.pablocarvalho.dev",
    viewportHeight = 900,
    language = "es",
  } = {},
) {
  // This document receives public page markup only, never cookies, credentials or admin UI.
  const origin = new URL(base).origin;
  const viewportCSS = (css) =>
    css.replace(/([\d.]+)(?:s|d)?vh\b/g, "calc(var(--community-vh) * $1)");
  const css = viewportCSS(styles + "\n" + program.css).replace(
    /<\/style/gi,
    "<\\/style",
  );
  return `<!doctype html><html lang="${language === "es" ? "es" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-community-page'; style-src 'unsafe-inline'; img-src https: data: blob: ${origin}; font-src https: data: ${origin}; connect-src 'none'; worker-src blob:; media-src https: blob: ${origin}; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri https: ${origin}"><base href="${origin}/"><style>:root{--community-vh:${Math.max(1, Math.min(20, viewportHeight / 100))}px}html,body{margin:0;height:auto;overflow-x:hidden}.reveal{opacity:1!important;transform:none!important} ${css}</style></head><body>${html || ""}<script nonce="community-page">(${pageRuntime.toString()})(${literal({ source: program.javascript, extra: program.html, viewportHeight: Math.round(viewportHeight), language })});
</script></body></html>`;
}
