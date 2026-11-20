import { test, before } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { create, act } from "react-test-renderer";
import { build } from "esbuild";
import { originalScene } from "../shared/community-catalog.mjs";
let Canvas;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
before(async () => {
  await build({
    entryPoints: ["src/community/Artwork.jsx"],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: ".generated/community-canvas-test.mjs",
    jsx: "automatic",
    external: ["react", "react/jsx-runtime"],
  });
  Canvas = (await import("../.generated/community-canvas-test.mjs")).default;
});
const options = {
  unstable_isConcurrent: true,
  createNodeMock: (element) =>
    element.props.className === "community-drawing-area"
      ? {
          setPointerCapture() {},
          getBoundingClientRect() {
            return { left: 0, top: 0, width: 1000, height: 240 };
          },
          style: { setProperty() {} },
        }
      : null,
};
const page = (scene) =>
  React.createElement(
    "div",
    {},
    React.createElement("h1", {}, "Información profesional intacta"),
    React.createElement(Canvas, { scene, zone: "hero", language: "es" }),
  );
const event = (x = 100, y = 80) => ({
  button: 0,
  pointerId: 1,
  clientX: x,
  clientY: y,
});
test("a click without dragging never inserts a null stroke under React concurrent batching", async () => {
  let renderer;
  await act(async () => {
    renderer = create(page({ ...originalScene, drawing: true }), options);
  });
  await act(async () => {
    renderer.root
      .findAllByType("button")
      .find((b) => b.children.join("") === "Dibujar acá")
      .props.onClick();
  });
  let area = renderer.root.findByProps({ className: "community-drawing-area" });
  await act(async () => {
    area.props.onPointerDown(event());
    area.props.onPointerUp(event());
  });
  assert.equal(renderer.root.findAllByProps({ role: "alert" }).length, 0);
  assert.equal(
    renderer.root.findByType("h1").children[0],
    "Información profesional intacta",
  );
  let lines = renderer.root.findAllByType("polyline");
  assert.equal(lines.length, 1);
  const dot = lines[0].props.points
    .split(" ")
    .map((p) => p.split(",").map(Number));
  assert.deepEqual(dot[0], dot[1]);
  assert(Math.abs(dot[0][0] - 100) < 0.02 && Math.abs(dot[0][1] - 80) < 0.02);
  area = renderer.root.findByProps({ className: "community-drawing-area" });
  await act(async () => {
    area.props.onPointerDown(event(200, 90));
    area.props.onPointerMove(event(250, 100));
    area.props.onPointerCancel(event());
  });
  lines = renderer.root.findAllByType("polyline");
  assert.equal(lines.length, 2);
  const drag = lines[1].props.points
    .split(" ")
    .map((p) => p.split(",").map(Number));
  assert.equal(drag.length, 2);
  assert(
    Math.abs(drag[1][0] - 250) < 0.02 && Math.abs(drag[1][1] - 100) < 0.02,
  );
  await act(async () => {
    renderer.unmount();
  });
});

test("a canvas render failure is isolated and can be reset without losing the profile", async () => {
  const previous = console.error;
  console.error = () => {};
  let renderer;
  try {
    await act(async () => {
      renderer = create(page({ ...originalScene, nodes: [null] }), options);
    });
    assert.equal(renderer.root.findAllByProps({ role: "alert" }).length, 1);
    assert.equal(
      renderer.root.findByType("h1").children[0],
      "Información profesional intacta",
    );
    await act(async () => {
      renderer.update(page({ ...originalScene, drawing: true }));
    });
    await act(async () => {
      renderer.root
        .findAllByType("button")
        .find((b) => b.children.join("") === "Restablecer lienzo")
        .props.onClick();
    });
    assert.equal(renderer.root.findAllByProps({ role: "alert" }).length, 0);
    await act(async () => {
      renderer.unmount();
    });
  } finally {
    console.error = previous;
  }
});
