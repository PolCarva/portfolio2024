import { test, before } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { create, act } from "react-test-renderer";
import { build } from "esbuild";
import { defaults } from "../server/schema.mjs";
import { originalScene } from "../shared/community-catalog.mjs";
import { nativePageDocument } from "../shared/community-page.mjs";
import { validateScene } from "../shared/community-scene.mjs";
let PageProgram, renderPreview;
before(async () => {
  await build({
    stdin: {
      contents:
        'export {default as PageProgram} from "./src/community/PageProgram.jsx";export {renderPreview} from "./src/community/preview-entry.jsx";',
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: ".generated/community-native-contract-test.mjs",
    loader: { ".css": "empty" },
    jsx: "automatic",
    external: ["react", "react/jsx-runtime", "react-dom", "react-dom/server"],
  });
  ({ PageProgram, renderPreview } = await import(
    "../.generated/community-native-contract-test.mjs"
  ));
});
const program = {
  layer: "page",
  html: "",
  css: ".portrait-mark{z-index:10}",
  javascript: "",
  tests: [
    {
      action: "style",
      selector: ".portrait-mark",
      value: "z-index",
      expectSelector: "",
      expectText: "10",
    },
  ],
};
const scene = () => ({
  ...structuredClone(originalScene),
  drawingTargets: ["portrait"],
  program,
});
test("source provided to the generator includes the actual native drawing controls and portrait span", () => {
  const html = renderPreview(defaults, { ...scene(), program: null }, "es", {
    editableSource: true,
  });
  assert(html.includes('id="community-canvas-portrait"'));
  assert.match(
    html,
    /class="community-draw-controls community-image-tools"><button/,
  );
  assert(html.includes("Dibujar en la foto de perfil"));
  assert.match(html, /<span class="portrait-mark"[^>]*><svg/);
  assert(!html.includes("community-image-mirror"));
});
test("native document loads the real shared React entry and keeps all seed data inside its script boundary", () => {
  const p = {
    ...program,
    html: "</script><script>window.bad=true</script>",
    javascript: 'console.log("</script>")',
  };
  const html = nativePageDocument(p, {
    content: defaults,
    scene: scene(),
    base: "https://unit.test",
    drafts: {
      portrait: [
        {
          points: [
            { x: 1, y: 1 },
            { x: 2, y: 2 },
          ],
          width: 4,
          color: "ink",
        },
      ],
    },
  });
  assert.equal((html.match(/<\/script>/g) || []).length, 2);
  assert(html.includes('src="https://unit.test/community/embedded.js"'));
  assert(html.includes("connect-src 'none'"));
  assert(html.includes("frame-src 'none'"));
  assert(!html.includes("<script>window.bad"));
  assert.doesNotThrow(() => validateScene(scene()));
});
test("availability polling and saving updates preserve the editable document while actual code changes replace it", async () => {
  const old = Object.fromEntries(
    [
      "document",
      "location",
      "innerHeight",
      "scrollY",
      "addEventListener",
      "removeEventListener",
      "localStorage",
      "IS_REACT_ACT_ENVIRONMENT",
    ].map((k) => [k, globalThis[k]]),
  );
  const handlers = new Set(),
    messages = [],
    drawings = [],
    cache = new Map();
  const frameWindow = { postMessage: (d) => messages.push(d) };
  const frame = {
    contentWindow: frameWindow,
    style: {},
    closest: () => ({ setAttribute() {}, removeAttribute() {} }),
  };
  Object.assign(globalThis, {
    IS_REACT_ACT_ENVIRONMENT: true,
    document: { styleSheets: [] },
    location: { origin: "https://unit.test" },
    innerHeight: 900,
    scrollY: 0,
    addEventListener: (t, fn) => {
      if (t === "message") handlers.add(fn);
    },
    removeEventListener: (t, fn) => {
      if (t === "message") handlers.delete(fn);
    },
    localStorage: {
      getItem: (k) => cache.get(k) || null,
      setItem: (k, v) => cache.set(k, v),
      removeItem: (k) => cache.delete(k),
    },
  });
  let renderer;
  try {
    const props = {
      program,
      content: defaults,
      language: "es",
      scene: scene(),
      saving: false,
      onDrawing: (d) => drawings.push(d),
      onClear() {},
    };
    await act(async () => {
      renderer = create(React.createElement(PageProgram, props), {
        createNodeMock: (el) => (el.type === "iframe" ? frame : null),
      });
    });
    const initial = renderer.root.findByType("iframe").props.srcDoc;
    assert(
      !renderer.root
        .findByType("iframe")
        .props.sandbox.includes("allow-same-origin"),
    );
    await act(async () =>
      renderer.update(
        React.createElement(PageProgram, {
          ...props,
          scene: structuredClone(props.scene),
          program: structuredClone(program),
          saving: true,
        }),
      ),
    );
    assert.equal(renderer.root.findByType("iframe").props.srcDoc, initial);
    assert(
      messages.some((d) => d.type === "community-saving-update" && d.saving),
    );
    const drawing = {
      zone: "portrait",
      strokes: [
        {
          points: [
            { x: 10, y: 10 },
            { x: 20, y: 20 },
          ],
          color: "blue",
          width: 4,
        },
      ],
    };
    for (const handler of handlers)
      await handler({
        source: {},
        data: { type: "community-page-drawing", drawing },
      });
    assert.equal(drawings.length, 0);
    for (const handler of handlers)
      await handler({
        source: frameWindow,
        data: {
          type: "community-page-drawing",
          drawing: { ...drawing, strokes: [null] },
        },
      });
    assert.equal(drawings.length, 0);
    for (const handler of handlers)
      await handler({
        source: frameWindow,
        data: { type: "community-page-drawing", drawing },
      });
    assert.deepEqual(drawings, [drawing]);
    await act(async () =>
      renderer.update(
        React.createElement(PageProgram, {
          ...props,
          program: { ...program, css: ".portrait-mark{z-index:12}" },
        }),
      ),
    );
    assert.notEqual(renderer.root.findByType("iframe").props.srcDoc, initial);
  } finally {
    if (renderer) await act(async () => renderer.unmount());
    for (const [key, value] of Object.entries(old))
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
  }
});
