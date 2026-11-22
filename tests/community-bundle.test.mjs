import { test, before } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { minify } from "terser";
import { Script, runInNewContext } from "node:vm";
import { writeFile } from "node:fs/promises";
let programDocument, pageDocument;
before(async () => {
  const bundled = await build({
    stdin: {
      contents:
        'export {programDocument} from "./shared/community-program.mjs";export {pageDocument} from "./shared/community-page.mjs";',
      resolveDir: process.cwd(),
    },
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    target: "es2022",
  });
  const compressed = await minify(bundled.outputFiles[0].text, {
    module: true,
    ecma: 2022,
    compress: { passes: 5 },
    mangle: true,
  });
  await writeFile(
    ".generated/minified-community-runtime-test.mjs",
    compressed.code,
  );
  ({ programDocument, pageDocument } =
    await import("../.generated/minified-community-runtime-test.mjs"));
});
function bootstrap(html, nonce) {
  const start =
    html.indexOf(`<script nonce="${nonce}">`) +
    `<script nonce="${nonce}">`.length;
  return html.slice(start, html.lastIndexOf("</script>"));
}
const program = {
  html: "<span>prueba</span>",
  css: "span{color:red}",
  javascript: 'function render(){const text="</script>";}',
  layer: "foreground",
};
test("both minified runtime documents preserve HTML boundaries and valid bootstrap syntax", () => {
  for (const [html, nonce] of [
    [programDocument(program), "community-runtime"],
    [
      pageDocument(
        { ...program, layer: "page" },
        { html: "<h1>Original</h1>" },
      ),
      "community-page",
    ],
  ]) {
    assert.equal((html.match(/<\/script>/g) || []).length, 1);
    assert.doesNotThrow(() => new Script(bootstrap(html, nonce)));
    assert(html.includes("connect-src 'none'"));
    assert(html.includes("frame-src 'none'"));
  }
});
function environment() {
  const nodes = [],
    handlers = {},
    calls = [];
  const context = {
    console: { error() {} },
    performance: { now: () => 0 },
    requestAnimationFrame: (fn) => calls.push(fn),
    innerWidth: 1280,
    innerHeight: 900,
    scrollY: 0,
    addEventListener: (type, fn) => {
      handlers[type] = fn;
    },
    parent: { postMessage() {} },
    ResizeObserver: class {
      observe() {}
    },
    setTimeout: () => 1,
    clearTimeout() {},
    matchMedia: () => ({ matches: false }),
  };
  const node = (tag) => ({
    tagName: tag,
    style: { setProperty() {} },
    content: { children: [] },
    getContext: () => ({ reset() {} }),
    append() {},
    getBoundingClientRect: () => ({ width: 1280, height: 900 }),
  });
  context.document = {
    hidden: false,
    documentElement: { dataset: {}, style: { setProperty() {} } },
    body: {
      append: (n) => nodes.push(n),
      insertAdjacentHTML: (_where, html) =>
        nodes.push({ tagName: "extra", innerHTML: html }),
      scrollHeight: 900,
    },
    head: { append: (n) => nodes.push(n) },
    createElement: (tag) => node(tag),
    getElementById: () => node("art"),
    querySelector: () => node("surface"),
    addEventListener() {},
  };
  context.window = context;
  return { context, nodes, handlers, calls };
}
test("minified page bootstrap runs without module closures and preserves generated source verbatim", () => {
  const { context, nodes } = environment();
  const html = pageDocument(
    { ...program, layer: "page" },
    { html: "<h1>Original</h1>", viewportHeight: 844 },
  );
  runInNewContext(bootstrap(html, "community-page"), context);
  const script = nodes.find((n) => n.tagName === "script");
  assert.equal(script.textContent, program.javascript);
  assert.equal(script.nonce, "community-page");
  assert.equal(context.community.viewport.height, 844);
});
test("minified canvas bootstrap starts its isolated worker and still sends a frame without clearing the surface", () => {
  const { context, calls } = environment();
  let workerSource, frame;
  context.Blob = class {
    constructor(parts) {
      workerSource = parts.join("");
    }
  };
  context.URL = { createObjectURL: () => "blob:unit-test" };
  context.Worker = class {
    postMessage(data) {
      frame = data;
    }
    terminate() {}
  };
  runInNewContext(
    bootstrap(programDocument(program), "community-runtime"),
    context,
  );
  assert(workerSource.includes(program.javascript));
  assert.doesNotThrow(() => new Script(workerSource));
  assert.equal(calls.length, 1);
  calls[0](100);
  assert.equal(frame.width, 1280);
  assert.equal(frame.height, 900);
});

test("page asset policy permits the configured local origin without opening runtime connections", () => {
  const html = pageDocument(
    { ...program, layer: "page" },
    { html: "<h1>Original</h1>", base: "http://127.0.0.1:4190/path?x=unsafe" },
  );
  assert(html.includes("img-src https: data: blob: http://127.0.0.1:4190;"));
  assert(html.includes("font-src https: data: http://127.0.0.1:4190;"));
  assert(html.includes('<base href="http://127.0.0.1:4190/">'));
  assert(!html.includes("/path?x=unsafe"));
  assert(html.includes("connect-src 'none'"));
  assert(html.includes("frame-src 'none'"));
});

test("page Canvas input follows the visible viewport after scrolling and pressing without moving", () => {
  const { context, handlers, calls } = environment();
  let received;
  context.render = (input) => {
    received = input;
  };
  runInNewContext(
    bootstrap(
      pageDocument(
        { ...program, layer: "page" },
        { html: "<h1>Original</h1>" },
      ),
      "community-page",
    ),
    context,
  );
  handlers.message({
    source: context.parent,
    data: { type: "community-page-viewport", height: 844, scrollY: 1200 },
  });
  handlers.pointerdown({ clientX: 150, clientY: 1400, buttons: 1 });
  calls[0](100);
  assert.equal(received.pointer.x, 150);
  assert.equal(received.pointer.y, 200);
  assert.equal(received.pointer.down, true);
  assert.equal(received.scrollY, 1200);
  assert.equal(received.height, 844);
  handlers.pointerup({ clientX: 150, clientY: 1400, buttons: 0 });
  calls.at(-1)(140);
  assert.equal(received.pointer.down, false);
});

test("editable page height can shrink after deleting content despite the previous iframe viewport floor", () => {
  const { context, calls, handlers } = environment();
  const heights = [];
  let height = 6000;
  context.document.body.getBoundingClientRect = () => ({ height });
  context.document.body.scrollHeight = 9000;
  context.document.documentElement.scrollHeight = 9000;
  context.parent.postMessage = (d) => {
    if (d.type === "community-page-size") heights.push(d.height);
  };
  runInNewContext(
    bootstrap(
      pageDocument(
        { ...program, layer: "page" },
        { html: "<h1>Original</h1>", viewportHeight: 844 },
      ),
      "community-page",
    ),
    context,
  );
  calls.shift()(100);
  calls.shift()(200);
  assert.equal(heights.at(-1), 6000);
  height = 2300;
  handlers.message({
    source: context.parent,
    data: { type: "community-page-viewport", height: 844, scrollY: 0 },
  });
  assert.equal(heights.at(-1), 2300);
  height = 100;
  handlers.message({
    source: context.parent,
    data: { type: "community-page-viewport", height: 844, scrollY: 0 },
  });
  assert.equal(heights.at(-1), 844);
});
