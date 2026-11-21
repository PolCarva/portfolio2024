import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { create, act } from "react-test-renderer";
import { build } from "esbuild";
import { loadDraft, saveDraft, fingerprint } from "../src/community/draft.mjs";
const draft = {
  zone: "portrait",
  strokes: [
    {
      points: [
        { x: 20, y: 20 },
        { x: 40, y: 40 },
      ],
      color: "blue",
      width: 4,
    },
  ],
};
let Autosave,
  callback,
  store,
  originalFetch = globalThis.fetch;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
before(async () => {
  await build({
    entryPoints: ["src/community/DrawingAutosave.jsx"],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: ".generated/community-autosave-test.mjs",
    jsx: "automatic",
    external: ["react", "react/jsx-runtime"],
  });
  Autosave = (await import("../.generated/community-autosave-test.mjs"))
    .default;
  store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  };
  globalThis.window = {
    turnstile: {
      render: (node, options) => {
        callback = options.callback;
        return 1;
      },
      remove() {},
    },
  };
  globalThis.document = { querySelector: () => null };
});
after(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.localStorage;
});
const mount = async (saved = () => {}) => {
  let renderer;
  await act(async () => {
    renderer = create(
      React.createElement(Autosave, {
        draft,
        language: "es",
        data: { siteKey: "qa" },
        onSaved: saved,
      }),
      { createNodeMock: () => ({}) },
    );
  });
  return renderer;
};
test("numeric drawing drafts survive reload, expire, and corrupted storage is ignored", () => {
  saveDraft(draft.zone, draft.strokes);
  assert.deepEqual(loadDraft("portrait"), draft.strokes);
  assert.equal(
    fingerprint({
      zone: "portrait",
      strokes: [{ width: 4, color: "blue", points: draft.strokes[0].points }],
    }),
    fingerprint(draft),
  );
  localStorage.setItem(
    "community-drawing-draft-v1:portrait",
    JSON.stringify({ at: Date.now(), strokes: [null] }),
  );
  assert.deepEqual(loadDraft("portrait"), []);
  localStorage.setItem(
    "community-drawing-draft-v1:portrait",
    JSON.stringify({ at: Date.now() - 31 * 86400000, strokes: draft.strokes }),
  );
  assert.deepEqual(loadDraft("portrait"), []);
  saveDraft("portrait", draft.strokes);
  saveDraft("portrait", []);
  assert.deepEqual(loadDraft("portrait"), []);
});
test("autosave starts with antibot token, continues review, saves exactly once without a form", async () => {
  store.clear();
  let saved = 0,
    submissions = 0,
    reviews = 0;
  globalThis.fetch = async (path, options) => {
    if (path === "/api/community/changes") {
      submissions++;
      const body = JSON.parse(options.body);
      assert.deepEqual(body.drawing, draft);
      assert.equal(body.token, "verified");
      return Response.json({ id: body.id, status: "processing" });
    }
    if (options?.method === "POST") {
      reviews++;
      return Response.json({ status: "published" });
    }
    return Response.json({
      status: "processing",
      continueRequired: true,
      step: crypto.randomUUID(),
    });
  };
  const renderer = await mount(() => {
    saved++;
  });
  assert.equal(submissions, 0);
  await act(async () => {
    callback("verified");
    await new Promise((r) => setImmediate(r));
  });
  assert.equal(submissions, 1);
  assert.equal(reviews, 1);
  assert.equal(saved, 1);
  assert.equal(localStorage.getItem("community-drawing-pending-v1"), null);
  await act(async () => renderer.unmount());
});
test("reload resumes the same pending request instead of submitting the strokes twice", async () => {
  store.clear();
  const id = crypto.randomUUID();
  let posts = 0,
    saved = 0;
  localStorage.setItem(
    "community-drawing-pending-v1",
    JSON.stringify({
      id,
      fingerprint: fingerprint(draft),
      at: Date.now(),
      started: true,
      attempts: 0,
    }),
  );
  globalThis.fetch = async (path, options) => {
    assert.equal(path, "/api/community/changes/" + id);
    if (options?.method === "POST") posts++;
    return Response.json({ status: "published" });
  };
  const renderer = await mount(() => {
    saved++;
  });
  assert.equal(posts, 0);
  assert.equal(saved, 1);
  await act(async () => renderer.unmount());
});
test("a safety rejection keeps the local draft and does not start an automatic rejection loop", async () => {
  store.clear();
  saveDraft("portrait", draft.strokes);
  let posts = 0;
  globalThis.fetch = async () => {
    posts++;
    return Response.json({ status: "rejected", reason: "unsafe" });
  };
  const renderer = await mount(() => {
    throw Error("must not publish");
  });
  await act(async () => {
    callback("verified");
    await new Promise((r) => setImmediate(r));
  });
  assert.equal(posts, 1);
  assert.deepEqual(loadDraft("portrait"), draft.strokes);
  assert(JSON.stringify(renderer.toJSON()).includes("claramente ofensivos"));
  await act(async () => renderer.unmount());
});

test("a technical failure receives one automatic retry with a fresh token and request ID", async (t) => {
  store.clear();
  let saved = 0;
  const ids = [];
  globalThis.fetch = async (path, options) => {
    ids.push(JSON.parse(options.body).id);
    return Response.json(
      ids.length === 1
        ? { status: "failed", reason: "technical" }
        : { status: "published" },
    );
  };
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const renderer = await mount(() => {
    saved++;
  });
  await act(async () => {
    callback("verified");
    await new Promise((r) => setImmediate(r));
  });
  assert.equal(ids.length, 1);
  await act(async () => {
    t.mock.timers.tick(4001);
  });
  await act(async () => {
    callback("fresh-token");
    await new Promise((r) => setImmediate(r));
  });
  assert.equal(ids.length, 2);
  assert.notEqual(ids[0], ids[1]);
  assert.equal(saved, 1);
  await act(async () => renderer.unmount());
  t.mock.timers.reset();
});
