import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID, randomBytes, scryptSync } from "node:crypto";
import {
  sceneSchema,
  validateScene,
  originalScene,
  palettes,
} from "../shared/community-scene.mjs";
import {
  mutate,
  readState,
  reserve,
  finish,
  digest,
  prune,
  freshState,
  visitor,
  RESERVATION,
  MONTHLY_MICRODOLLARS,
} from "../server/community/state.mjs";
import { createApiServer } from "../server/dev-server.mjs";
import { createChangeHandler } from "../api/community/changes.js";
import { verifyTurnstile } from "../server/community/turnstile.mjs";
let directory, server, base, adminCookie;
const password = randomBytes(20).toString("hex");
const scene = () => ({
  ...structuredClone(originalScene),
  palette: "forest",
  nodes: [
    {
      id: "leaf",
      zone: "hero",
      shape: "circle",
      x: 40,
      y: 40,
      size: 24,
      rotation: 0,
      color: "accent",
      opacity: 0.8,
      motion: "float",
      points: [],
    },
  ],
});
before(async () => {
  directory = await mkdtemp(join(tmpdir(), "portfolio-community-"));
  process.env.PORTFOLIO_LOCAL_STORE = directory;
  process.env.ADMIN_SESSION_SECRET = randomBytes(32).toString("hex");
  process.env.ADMIN_PASSWORD_HASH =
    "salt:" + scryptSync(password, "salt", 64).toString("hex");
  process.env.ANTHROPIC_API_KEY = "unit-test-not-a-real-key";
  process.env.TURNSTILE_SECRET_KEY = "unit-test-secret";
  process.env.TURNSTILE_SITE_KEY = "unit-test-site-key";
  server = createApiServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + server.address().port;
  const response = await call("/api/session", "POST", { password });
  adminCookie = response.headers.get("set-cookie").split(";")[0];
});
after(async () => {
  await new Promise((r) => server.close(r));
  await rm(directory, { recursive: true, force: true });
});
async function call(path, method = "GET", data, cookie, origin = base) {
  return fetch(base + path, {
    method,
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
}
async function cookie() {
  const r = await call("/api/community");
  return r.headers.get("set-cookie").split(";")[0];
}
function identity(c) {
  return visitor({ headers: { cookie: c } }, {}, false);
}
async function reset() {
  await mutate((s) => {
    Object.assign(s, freshState());
    s.settings = { publishedPerBrowser: 1, attemptsPerDay: 3 };
    s.paused = false;
    s.mode = "public";
  });
}
async function direct(handler, data, c, extraHeaders = {}) {
  let status = 200,
    payload;
  await handler(
    {
      method: "POST",
      url: "/api/community/changes",
      headers: {
        host: new URL(base).host,
        origin: base,
        "content-type": "application/json",
        cookie: c,
        ...extraHeaders,
      },
      body: data,
    },
    {
      setHeader() {},
      status(n) {
        status = n;
        return this;
      },
      json(d) {
        payload = d;
      },
    },
  );
  return { status, payload };
}
const request = (token = randomUUID()) => ({
  id: randomUUID(),
  prompt: "Tonos verdes y estrellas que flotan",
  token,
});
test("scene rejects executable capabilities, arbitrary properties, excessive geometry and motion", () => {
  assert.doesNotThrow(() => validateScene(scene()));
  const attacks = [
    (s) => (s.html = "<script>alert(1)</script>"),
    (s) => (s.palette = "url(https://evil.test)"),
    (s) => (s.nodes[0].onClick = "fetch(secret)"),
    (s) => (s.nodes[0].shape = "image"),
    (s) => (s.nodes[0].x = Infinity),
    (s) =>
      (s.nodes[0].points = Array.from({ length: 17 }, () => ({ x: 1, y: 2 }))),
    (s) =>
      (s.nodes = Array.from({ length: 201 }, (_, i) => ({
        ...s.nodes[0],
        id: "n" + i,
        motion: "none",
      }))),
    (s) =>
      (s.nodes = Array.from({ length: 21 }, (_, i) => ({
        ...s.nodes[0],
        id: "n" + i,
      }))),
    (s) => s.nodes.push({ ...s.nodes[0] }),
    (s) => (s.nodes[0].shape = "curve"),
  ];
  for (const attack of attacks) {
    const s = scene();
    attack(s);
    assert.throws(() => validateScene(s));
  }
  assert.equal(
    sceneSchema.safeParse({ ...originalScene, identity: "Fake name" }).success,
    false,
  );
});
test("all catalog palettes keep text and muted text readable on their intended surfaces", () => {
  function luminance(hex) {
    const c = hex
      .slice(1)
      .match(/../g)
      .map((v) => parseInt(v, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
  }
  const contrast = (a, b) => {
    const x = luminance(a),
      y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  for (const p of Object.values(palettes)) {
    assert(contrast(p.ink, p.paper) >= 4.5);
    assert(contrast(p.muted, p.paper) >= 4.5);
    assert(contrast(p.paper, p.dark) >= 4.5);
    assert(contrast(p.ink, p.accent) >= 4.5);
  }
});
test("public state sets HttpOnly cookie and never exposes prompts or administration records", async () => {
  const r = await call("/api/community");
  assert.equal(r.status, 200);
  assert.match(r.headers.get("set-cookie"), /HttpOnly/);
  assert.match(r.headers.get("set-cookie"), /SameSite=Strict/);
  const d = await r.json();
  assert.equal(d.reason, "paused");
  assert.equal(d.jobs, undefined);
  assert.equal(d.budgets, undefined);
  assert.equal((await call("/api/community?admin=1")).status, 401);
  assert.equal(
    (await call("/api/community", "POST", { action: "resume" })).status,
    401,
  );
  assert.equal(
    (
      await call(
        "/api/community",
        "POST",
        { action: "resume" },
        adminCookie,
        "https://evil.test",
      )
    ).status,
    403,
  );
});
test("missing configuration fails closed and no generation is called", async () => {
  const c = await cookie();
  let calls = 0;
  const handler = createChangeHandler({
    verify: async () => {},
    evaluate: async () => {
      calls++;
    },
  });
  const key = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  const r = await direct(handler, request(), c);
  assert.equal(r.status, 503);
  assert.equal(calls, 0);
  process.env.ANTHROPIC_API_KEY = key;
});
test("input bounds and origin are enforced before antibot or AI calls", async () => {
  const c = await cookie();
  let calls = 0;
  const handler = createChangeHandler({
    verify: async () => {
      calls++;
    },
    evaluate: async () => {
      calls++;
    },
  });
  for (const prompt of ["", "x".repeat(501), "hello\u202eignored"])
    assert.equal(
      (await direct(handler, { ...request(), prompt }, c)).status,
      400,
    );
  assert.equal(
    (await direct(handler, request(), c, { origin: "https://evil.test" }))
      .status,
    403,
  );
  assert.equal(
    (await direct(handler, request(), "community_visitor=forged")).status,
    403,
  );
  assert.equal(calls, 0);
});
test("Turnstile checks success, action and hostname, and never accepts a reused token locally", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const data of [
      { success: false, hostname: "127.0.0.1", action: "portfolio-change" },
      { success: true, hostname: "evil.test", action: "portfolio-change" },
      { success: true, hostname: "127.0.0.1", action: "other" },
    ]) {
      globalThis.fetch = async () => ({ ok: true, json: async () => data });
      await assert.rejects(
        verifyTurnstile("token", { headers: { origin: base } }),
      );
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
  await reset();
  const c = await cookie(),
    owner = identity(c);
  const first = await reserve({
    id: randomUUID(),
    owner,
    ip: "ip",
    prompt: "test",
    tokenHash: "same",
  });
  await finish(first.job.id, { approved: false, reason: "unsafe" });
  await assert.rejects(
    reserve({
      id: randomUUID(),
      owner,
      ip: "ip",
      prompt: "test",
      tokenHash: "same",
    }),
    (e) => e.code === "verification",
  );
});
test("approval publishes atomically once, consumes one browser turn and separates professional content", async () => {
  await reset();
  const c = await cookie(),
    r = request();
  let calls = 0;
  const handler = createChangeHandler({
    verify: async () => {},
    evaluate: async () => {
      calls++;
      return { approved: true, scene: scene(), usage: [], cost: 100 };
    },
  });
  const [a, b] = await Promise.all([
    direct(handler, r, c),
    direct(handler, r, c),
  ]);
  assert.equal(calls, 1);
  assert([a, b].every((x) => x.status === 200));
  const state = await readState();
  assert.equal(state.scene.palette, "forest");
  assert.equal(Object.keys(state.visitors).length, 1);
  assert.equal(
    state.budgets[new Date().toISOString().slice(0, 7)].reserved,
    RESERVATION,
  );
  assert.equal((await direct(handler, request(), c)).payload.error, "used");
  const same = await direct(handler, r, c);
  assert.equal(same.payload.status, "published");
  assert.equal(calls, 1);
  const content = await (await call("/api/content")).json();
  assert.equal(content.content.copy.es.hero[0], "Productos útiles.");
  const other = await cookie();
  assert.equal(
    (await call("/api/community/changes/" + r.id, "GET", null, other)).status,
    404,
  );
});
test("rejection and provider failures preserve the scene and turn but still reserve spending", async () => {
  for (const reason of ["unsafe", "unsupported", "technical", "timeout"]) {
    await reset();
    const c = await cookie();
    const handler = createChangeHandler({
      verify: async () => {},
      evaluate: async () => ({ approved: false, reason }),
    });
    const r = await direct(handler, request(), c);
    assert.equal(r.status, 200);
    assert.equal(r.payload.reason, reason);
    const state = await readState();
    assert.equal(state.revision, "original");
    assert.equal(Object.keys(state.visitors).length, 0);
    assert.equal(
      state.budgets[new Date().toISOString().slice(0, 7)].reserved,
      RESERVATION,
    );
  }
});
test("global lease prevents simultaneous different generations and reserves budget only once", async () => {
  await reset();
  const a = await cookie(),
    b = await cookie();
  let release, started;
  const start = new Promise((r) => (started = r)),
    wait = new Promise((r) => (release = r));
  let calls = 0;
  const handler = createChangeHandler({
    verify: async () => {},
    evaluate: async () => {
      calls++;
      started();
      await wait;
      return { approved: true, scene: scene() };
    },
  });
  const pending = direct(handler, request(), a);
  await start;
  const second = await direct(handler, request(), b);
  assert.equal(second.payload.error, "busy");
  release();
  await pending;
  assert.equal(calls, 1);
});
test("administrative pause and restore invalidate work without restoring turns or budget", async () => {
  await reset();
  const c = await cookie(),
    owner = identity(c);
  const job = await reserve({
    id: randomUUID(),
    owner,
    ip: "x",
    prompt: "test",
    tokenHash: randomUUID(),
  });
  assert.equal(
    (await call("/api/community", "POST", { action: "pause" }, adminCookie))
      .status,
    200,
  );
  const result = await finish(job.job.id, { approved: true, scene: scene() });
  assert.equal(result.status, "failed");
  assert.equal((await readState()).revision, "original");
  await call("/api/community", "POST", { action: "resume" }, adminCookie);
  const next = await reserve({
    id: randomUUID(),
    owner,
    ip: "x",
    prompt: "test",
    tokenHash: randomUUID(),
  });
  await finish(next.job.id, { approved: true, scene: scene() });
  await call("/api/community", "POST", { action: "reset" }, adminCookie);
  const state = await readState();
  assert.equal(state.paused, true);
  assert.deepEqual(state.scene, originalScene);
  assert(state.visitors[owner]);
  assert.equal(
    state.budgets[new Date().toISOString().slice(0, 7)].reserved,
    RESERVATION * 2,
  );
});
test("daily generation limit, monthly reservation cap and stale base all fail closed", async () => {
  await reset();
  const c = await cookie(),
    owner = identity(c),
    month = new Date().toISOString().slice(0, 7);
  for (let i = 0; i < 3; i++) {
    const r = await reserve({
      id: randomUUID(),
      owner,
      ip: "limited",
      prompt: "test",
      tokenHash: randomUUID(),
    });
    await finish(r.job.id, { approved: false, reason: "unsafe" });
  }
  await assert.rejects(
    reserve({
      id: randomUUID(),
      owner,
      ip: "limited",
      prompt: "test",
      tokenHash: randomUUID(),
    }),
    (e) => e.code === "rate_limited",
  );
  await reset();
  await mutate((s) => {
    s.budgets[month] = {
      reserved: MONTHLY_MICRODOLLARS - RESERVATION + 1,
      measured: 0,
    };
  });
  await assert.rejects(
    reserve({
      id: randomUUID(),
      owner,
      ip: "budget",
      prompt: "test",
      tokenHash: randomUUID(),
    }),
    (e) => e.code === "budget",
  );
  await reset();
  const r = await reserve({
    id: randomUUID(),
    owner,
    ip: "base",
    prompt: "test",
    tokenHash: randomUUID(),
  });
  await mutate((s) => {
    s.revision = "changed-by-owner";
  });
  const done = await finish(r.job.id, { approved: true, scene: scene() });
  assert.equal(done.reason, "stale");
  assert.equal((await readState()).scene.palette, "original");
});
test("retention and expired leases remove prompts, release locks and keep spent reservations", () => {
  const s = freshState(),
    old = Date.now() - 31 * 86400000;
  s.jobs.old = {
    id: "old",
    createdAt: old,
    prompt: "private",
    status: "processing",
  };
  s.active = "old";
  s.visitors.kept = old;
  s.budgets.month = { reserved: RESERVATION, measured: 0 };
  prune(s);
  assert.equal(s.jobs.old, undefined);
  assert.equal(s.active, null);
  assert(s.visitors.kept);
  assert.equal(s.budgets.month.reserved, RESERVATION);
});
test("review exceptions never publish or consume participation", async () => {
  await reset();
  const c = await cookie();
  const handler = createChangeHandler({
    verify: async () => {},
    evaluate: async () => {
      throw new Error("reviewer unavailable");
    },
  });
  const r = await direct(handler, request(), c);
  assert.equal(r.payload.status, "failed");
  assert.equal((await readState()).revision, "original");
});

test("independent review is mandatory and must pass every check after actual scene validation", async () => {
  const { createEvaluator } = await import("../server/community/ai.mjs");
  const allowed = {
    accepted: true,
    reason: "ok",
    changedFields: ["palette", "nodes"],
    scene: scene(),
  };
  const good = {
    approved: true,
    identityIntact: true,
    readable: true,
    safeVisuals: true,
    requestFulfilled: true,
    animationStable: true,
    qualityIssues: [],
    reason: "ok",
  };
  for (const verdict of [
    good,
    { ...good, approved: false },
    { ...good, identityIntact: false },
    { ...good, readable: false },
    { ...good, safeVisuals: false },
    { ...good, animationStable: false },
    { ...good, reason: "unsafe" },
  ]) {
    let calls = 0,
      renders = 0;
    const evaluate = createEvaluator({
      respond: async (model) => {
        calls++;
        return {
          value: model === "claude-haiku-5-5" ? allowed : verdict,
          usage: { model, input: 100, output: 100 },
        };
      },
      render: async () => {
        renders++;
        return {
          images: [Buffer.from("safe-test-image")],
          contentRevision: "initial",
        };
      },
      readContent: async () => null,
    });
    const result = await evaluate({
      prompt: "garden",
      scene: originalScene,
      deadline: Date.now() + 10000,
    });
    assert.equal(result.approved, verdict === good);
    assert.equal(calls, 2);
    assert.equal(renders, 1);
  }
  for (const failure of [
    "renderer",
    "reviewer",
    "unsafe-scene",
    "changed-content",
  ]) {
    const evaluate = createEvaluator({
      respond: async (model) => {
        if (model === "claude-sonnet-5-5" && failure === "reviewer")
          throw new Error("timeout");
        return {
          value:
            model === "claude-haiku-5-5"
              ? failure === "unsafe-scene"
                ? { ...allowed, scene: { ...scene(), html: "<script>" } }
                : allowed
              : good,
          usage: { model, input: 1, output: 1 },
        };
      },
      render: async () => {
        if (failure === "renderer") throw new Error("unavailable");
        return { images: [], contentRevision: "initial" };
      },
      readContent: async () =>
        failure === "changed-content"
          ? { bytes: JSON.stringify({ revision: "new-owner-content" }) }
          : null,
    });
    assert.equal(
      (
        await evaluate({
          prompt: "garden",
          scene: originalScene,
          deadline: Date.now() + 10000,
        })
      ).approved,
      false,
    );
  }
});

test("private diagnostics reserve the same budget but can never publish or consume a visitor turn", async () => {
  await reset();
  await mutate((s) => {
    s.paused = true;
  });
  const r = await reserve({
    id: randomUUID(),
    owner: digest("diagnostic"),
    ip: "admin",
    prompt: "test",
    tokenHash: randomUUID(),
    diagnostic: true,
  });
  const job = await finish(r.job.id, {
    approved: true,
    scene: scene(),
    cost: 20,
  });
  const s = await readState();
  assert.equal(job.status, "verified");
  assert.equal(s.paused, true);
  assert.equal(s.revision, "original");
  assert.equal(Object.keys(s.visitors).length, 0);
  assert.equal(
    s.budgets[new Date().toISOString().slice(0, 7)].reserved,
    RESERVATION,
  );
});

test("Anthropic transport counts tokens, constrains JSON, and rejects incomplete or over-budget replies", async () => {
  const { createEvaluator, providerSchema } = await import(
    "../server/community/ai.mjs"
  );
  const transformed = providerSchema(sceneSchema);
  assert(!JSON.stringify(transformed).includes("maxItems"));
  assert.equal(transformed.additionalProperties, false);
  const originalFetch = globalThis.fetch;
  try {
    for (const scenario of [
      "approved",
      "over-budget",
      "refused",
      "provider-down",
    ]) {
      let paid = 0,
        counted = 0;
      globalThis.fetch = async (url, options) => {
        const body = JSON.parse(options.body);
        assert(!body.tools);
        assert.equal(body.messages.length, 1);
        assert.equal(
          options.headers["x-api-key"],
          process.env.ANTHROPIC_API_KEY,
        );
        if (url.endsWith("count_tokens")) {
          counted++;
          return {
            ok: true,
            json: async () => ({
              input_tokens: scenario === "over-budget" ? 100000 : 100,
            }),
          };
        }
        paid++;
        assert(body.output_config.format.schema);
        assert.equal(body.output_config.format.type, "json_schema");
        assert(body.max_tokens <= 8000);
        const value =
          body.model === "claude-haiku-5-5"
            ? {
                accepted: true,
                reason: "ok",
                changedFields: ["palette", "nodes"],
                scene: scene(),
              }
            : {
                approved: true,
                identityIntact: true,
                readable: true,
                safeVisuals: true,
                requestFulfilled: true,
                animationStable: true,
                qualityIssues: [],
                reason: "ok",
              };
        return {
          ok: scenario !== "provider-down",
          status: 503,
          json: async () => ({
            stop_reason: scenario === "refused" ? "refusal" : "end_turn",
            content: [{ type: "text", text: JSON.stringify(value) }],
            usage: { input_tokens: 100, output_tokens: 100 },
          }),
        };
      };
      const result = await createEvaluator({
        render: async () => ({
          images: [Buffer.from("test")],
          contentRevision: "initial",
        }),
        readContent: async () => null,
      })({
        prompt: "garden",
        scene: originalScene,
        deadline: Date.now() + 10000,
      });
      assert.equal(result.approved, scenario === "approved");
      assert(counted > 0);
      if (scenario === "over-budget") assert.equal(paid, 0);
      if (scenario === "approved") assert.equal(paid, 2);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("private mode hides draft designs and does not let visitors reach Turnstile or generation", async () => {
  await reset();
  await mutate((s) => {
    s.mode = "private";
    s.paused = false;
    s.scene = scene();
    s.revision = "private-draft";
  });
  const c = await cookie(),
    publicView = await (await call("/api/community", "GET", null, c)).json();
  assert.equal(publicView.available, false);
  assert.equal(publicView.reason, "paused");
  assert.equal(publicView.revision, "original");
  assert.equal(publicView.scene.palette, "original");
  const adminView = await (
    await call("/api/community?admin=1", "GET", null, adminCookie)
  ).json();
  assert.equal(adminView.scene.palette, "forest");
  let calls = 0;
  const h = createChangeHandler({
    verify: async () => {
      calls++;
    },
    evaluate: async () => {
      calls++;
    },
  });
  assert.equal((await direct(h, request(), c)).status, 503);
  assert.equal(calls, 0);
});

test("generated labels cannot become arbitrary public text through visual identifiers", () => {
  const input = scene();
  input.nodes[0].id = "untrusted-label";
  assert.equal(validateScene(input).nodes[0].id, "n0");
});

test("shared drawings accept only bounded numeric strokes and preserve prior content", async () => {
  const { drawingSchema, applyDrawing } = await import(
    "../shared/community-scene.mjs"
  );
  const drawing = {
    zone: "hero",
    strokes: [
      {
        color: "blue",
        width: 4,
        points: [
          { x: 10, y: 20 },
          { x: 40, y: 50 },
          { x: 60, y: 20 },
        ],
      },
    ],
  };
  const next = applyDrawing(scene(), drawing);
  assert.equal(next.nodes.length, 2);
  assert.equal(next.nodes[1].shape, "stroke");
  assert.equal(next.nodes[1].strokeWidth, 4);
  assert.equal(next.drawing, true);
  assert.equal(next.nodes[0].shape, "circle");
  for (const attack of [
    (d) => (d.strokes[0].points[0].x = -1),
    (d) =>
      (d.strokes[0].points = Array.from({ length: 65 }, () => ({
        x: 1,
        y: 2,
      }))),
    (d) => (d.strokes[0].width = 200),
    (d) => (d.strokes[0].color = "url(https://evil.test)"),
    (d) => (d.strokes[0].onload = "steal()"),
    (d) => (d.zone = "identity"),
    (d) => (d.strokes = Array.from({ length: 13 }, () => d.strokes[0])),
  ]) {
    const bad = structuredClone(drawing);
    attack(bad);
    assert.equal(drawingSchema.safeParse(bad).success, false);
  }
  await reset();
  const c = await cookie();
  let received;
  const h = createChangeHandler({
    verify: async () => {},
    evaluate: async ({ scene, drawing }) => {
      received = drawing;
      return { approved: true, scene: applyDrawing(scene, drawing) };
    },
  });
  const data = { ...request(), prompt: "Mi dibujo compartido", drawing };
  const result = await direct(h, data, c);
  assert.equal(result.payload.status, "published");
  assert.deepEqual(received, drawing);
  const visible = await (
    await call("/api/community", "GET", null, await cookie())
  ).json();
  assert.equal(visible.scene.nodes[0].shape, "stroke");
  assert.deepEqual(visible.scene.nodes[0].points, drawing.strokes[0].points);
  assert.equal(
    (await direct(h, { ...request(), drawing }, c)).payload.error,
    "used",
  );
});

test("drawing images must pass two independent visual reviewers before saving", async () => {
  const { createEvaluator } = await import("../server/community/ai.mjs");
  const drawing = {
    zone: "work",
    strokes: [
      {
        color: "red",
        width: 2,
        points: [
          { x: 10, y: 20 },
          { x: 80, y: 60 },
        ],
      },
    ],
  };
  for (const deny of ["none", "first", "second"]) {
    const calls = [];
    let renders = 0;
    const evaluate = createEvaluator({
      respond: async (model, schema, system, user) => {
        assert(system.includes("Do not reject taste"));
        calls.push(model);
        assert(Array.isArray(user));
        assert(user.some((x) => x.type === "image"));
        return {
          value:
            model === "claude-haiku-5-5"
              ? {
                  accepted: deny !== "first",
                  reason: deny === "first" ? "unsafe" : "ok",
                }
              : {
                  accepted: deny !== "second",
                  approved: deny !== "second",
                  identityIntact: true,
                  readable: true,
                  safeVisuals: deny !== "second",
                  requestFulfilled: true,
                  animationStable: true,
                  qualityIssues: [],
                  reason: deny === "second" ? "unsafe" : "ok",
                },
          usage: { model, input: 10, output: 10 },
        };
      },
      render: async (candidate, options) => {
        assert.equal(options.drawingOnly, true);
        renders++;
        assert(candidate.nodes.some((n) => n.shape === "stroke"));
        return {
          images: [Buffer.from("drawing-preview")],
          contentRevision: "initial",
        };
      },
      readContent: async () => null,
    });
    const result = await evaluate({
      prompt: "Una línea",
      scene: originalScene,
      drawing,
      deadline: Date.now() + 10000,
    });
    assert.equal(result.approved, deny === "none");
    assert.equal(renders, 1);
    assert.equal(calls.length, deny === "first" ? 1 : 2);
  }
});

test("admin can see requests privately and selectively undo one without refunding turns or spending", async () => {
  await reset();
  const c = await cookie(),
    d = await cookie(),
    a = request(),
    b = request();
  const ha = createChangeHandler({
    verify: async () => {},
    evaluate: async () => ({ approved: true, scene: scene() }),
  });
  await direct(ha, a, c);
  const current = (await readState()).scene;
  const later = {
    ...current,
    font: "editorial",
    nodes: [
      ...current.nodes,
      {
        ...current.nodes[0],
        id: "second",
        x: 70,
        shape: "ring",
        motion: "none",
      },
    ],
  };
  const hb = createChangeHandler({
    verify: async () => {},
    evaluate: async () => ({ approved: true, scene: later }),
  });
  await direct(hb, b, d);
  const admin = await (
    await call("/api/community?admin=1", "GET", null, adminCookie)
  ).json();
  assert.equal(admin.jobs.find((j) => j.id === a.id).prompt, a.prompt);
  assert.equal(admin.jobs.find((j) => j.id === a.id).canUndo, true);
  const publicView = await (
    await call("/api/community", "GET", null, c)
  ).json();
  assert.equal(publicView.jobs, undefined);
  assert(!JSON.stringify(publicView).includes(a.prompt));
  assert.equal(
    (
      await call(
        "/api/community",
        "POST",
        { action: "undo", requestId: a.id },
        c,
      )
    ).status,
    401,
  );
  const response = await call(
    "/api/community",
    "POST",
    { action: "undo", requestId: a.id },
    adminCookie,
  );
  assert.equal(response.status, 200);
  const state = await readState();
  assert.equal(state.scene.palette, "original");
  assert.equal(state.scene.font, "editorial");
  assert.equal(state.scene.nodes.length, 1);
  assert.equal(state.scene.nodes[0].shape, "ring");
  assert.equal(state.paused, true);
  assert.equal(state.jobs[a.id].status, "reverted");
  assert.equal(Object.keys(state.visitors).length, 2);
  assert.equal(
    state.budgets[new Date().toISOString().slice(0, 7)].reserved,
    2 * RESERVATION,
  );
  assert.equal(
    (
      await call(
        "/api/community",
        "POST",
        { action: "undo", requestId: a.id },
        adminCookie,
      )
    ).status,
    409,
  );
});

test("selective undo preserves a later conflicting style and reports the skipped field", async () => {
  const { undoRequest } = await import("../server/community/undo.mjs");
  const s = freshState();
  s.mode = "public";
  s.paused = false;
  const first = { ...originalScene, palette: "forest" },
    latest = { ...first, palette: "cherry", font: "mono" };
  s.scene = latest;
  s.revision = "latest";
  s.history = [
    { revision: "original", scene: originalScene },
    { revision: "first", scene: first },
  ];
  s.jobs.a = {
    id: "a",
    base: "original",
    revision: "first",
    status: "published",
  };
  const result = undoRequest(s, "a");
  assert.equal(s.scene.palette, "cherry");
  assert.equal(s.scene.font, "mono");
  assert.deepEqual(result.skippedFields, ["palette"]);
});

test("free visual colors and composition preserve readable text without accepting code", async () => {
  const { sceneColors, contrast, sceneAttributes } = await import(
    "../shared/community-catalog.mjs"
  );
  const composition = {
    hero: "portrait-first",
    columns: 3,
    align: "center",
    gap: 96,
    sectionSpace: 160,
    mediaRatio: "portrait",
    button: "pill",
    borderWidth: 4,
  };
  for (const paper of ["#000000", "#ffffff", "#777777", "#ff00cc", "#22ffff"]) {
    const next = validateScene({
      ...originalScene,
      font: "rounded",
      theme: { paper, dark: paper, accent: paper, ink: paper },
      composition,
    });
    const colors = sceneColors(next);
    assert(contrast(colors.ink, colors.paper) >= 4.5);
    assert(contrast(colors.onDark, colors.dark) >= 4.5);
    assert(contrast(colors.onAccent, colors.accent) >= 4.5);
    assert.equal(sceneAttributes(next)["data-c-hero"], "portrait-first");
    assert.equal(sceneAttributes(next).style["--community-columns"], 3);
  }
  assert.throws(() =>
    validateScene({
      ...originalScene,
      theme: {
        paper: "url(https://evil.test)",
        dark: "#ffffff",
        accent: "#ffffff",
        ink: "#000000",
      },
    }),
  );
  assert.throws(() =>
    validateScene({
      ...originalScene,
      composition: { ...composition, columns: 0 },
    }),
  );
  assert.throws(() =>
    validateScene({
      ...originalScene,
      composition: { ...composition, display: "none" },
    }),
  );
  assert.throws(() =>
    validateScene({ ...originalScene, biography: "replacement" }),
  );
});

test("selective undo compares visual theme data by value", async () => {
  const { undoRequest } = await import("../server/community/undo.mjs");
  const s = freshState(),
    theme = {
      paper: "#111111",
      dark: "#000000",
      accent: "#ff00cc",
      ink: "#ffffff",
    };
  const first = { ...originalScene, theme };
  s.scene = structuredClone({ ...first, font: "mono" });
  s.revision = "latest";
  s.history = [
    { revision: "original", scene: originalScene },
    { revision: "first", scene: first },
  ];
  s.jobs.a = {
    id: "a",
    base: "original",
    revision: "first",
    status: "published",
  };
  undoRequest(s, "a");
  assert.equal(s.scene.theme, null);
  assert.equal(s.scene.font, "mono");
});

test("undo during private testing also removes the original public contribution", async () => {
  const { undoRequest } = await import("../server/community/undo.mjs");
  const s = freshState(),
    publicScene = { ...originalScene, palette: "forest" };
  s.mode = "private";
  s.scene = { ...publicScene, font: "mono" };
  s.revision = "private";
  s.history = [
    { revision: "original", scene: originalScene },
    { revision: "public", scene: publicScene },
  ];
  s.publicSnapshot = {
    scene: structuredClone(publicScene),
    revision: "public",
    appliedRequestIds: ["a"],
  };
  s.jobs.a = {
    id: "a",
    status: "published",
    base: "original",
    revision: "public",
  };
  undoRequest(s, "a");
  assert.equal(s.publicSnapshot.scene.palette, "original");
  assert.equal(s.publicSnapshot.scene.font, "original");
  assert.equal(s.scene.font, "mono");
  assert.equal(s.paused, true);
});

test("admin configures publication and attempt limits, legacy participation counts once", async () => {
  await reset();
  const c = await cookie(),
    owner = identity(c);
  const settings = { publishedPerBrowser: 3, attemptsPerDay: 10 };
  assert.equal(
    (await call("/api/community", "POST", { action: "settings", settings }, c))
      .status,
    401,
  );
  assert.equal(
    (
      await call(
        "/api/community",
        "POST",
        {
          action: "settings",
          settings: { ...settings, publishedPerBrowser: 0 },
        },
        adminCookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await call(
        "/api/community",
        "POST",
        { action: "settings", settings },
        adminCookie,
      )
    ).status,
    200,
  );
  await mutate((s) => {
    s.visitors[owner] = Date.now();
  });
  let d = await (await call("/api/community", "GET", null, c)).json();
  assert.equal(d.available, true);
  assert.deepEqual(d.participation, {
    published: 1,
    limit: 3,
    remaining: 2,
    attemptsPerDay: 10,
  });
  const handler = createChangeHandler({
    verify: async () => {},
    evaluate: async () => ({ approved: true, scene: scene() }),
  });
  const first = request();
  await Promise.all([direct(handler, first, c), direct(handler, first, c)]);
  assert.equal((await readState()).visitors[owner].count, 2);
  assert.equal(
    (await direct(handler, request(), c)).payload.status,
    "published",
  );
  assert.equal((await direct(handler, request(), c)).payload.error, "used");
  assert.equal((await readState()).visitors[owner].count, 3);
  d = await (await call("/api/community", "GET", null, c)).json();
  assert.equal(d.participation.remaining, 0);
  assert.equal(d.available, false);
  await call(
    "/api/community",
    "POST",
    { action: "settings", settings: { ...settings, publishedPerBrowser: 5 } },
    adminCookie,
  );
  assert.equal(
    (await (await call("/api/community", "GET", null, c)).json()).available,
    true,
  );
});

test("cursor requests cannot recolor or rearrange the site and require the requested effect", async () => {
  const { scopedProposal } = await import("../server/community/proposal.mjs");
  const base = validateScene(scene());
  const program = {
    html: "",
    css: "",
    javascript:
      "function render({ctx,pointer}){ctx.beginPath();ctx.arc(pointer.x,pointer.y,12,0,Math.PI*2);ctx.stroke();}",
    layer: "foreground",
  };
  const proposal = {
    changedFields: ["program", "palette", "nodes"],
    scene: { ...base, palette: "cherry", nodes: [], program },
  };
  const result = scopedProposal(
    base,
    proposal,
    "haz un cursor que cuando lo vas moviendo salen burbujas",
  );
  assert.deepEqual(result.program, program);
  assert.equal(result.palette, base.palette);
  assert.deepEqual(result.nodes, base.nodes);
  assert.throws(
    () =>
      scopedProposal(
        base,
        { ...proposal, scene: { ...proposal.scene, program: null } },
        "Un cursor de burbujas",
      ),
    (e) => e.code === "unsupported",
  );
  const narrow = scopedProposal(
    base,
    { ...proposal, changedFields: ["palette"] },
    "Cambiá la paleta",
  );
  assert.equal(narrow.palette, "cherry");
  assert.deepEqual(narrow.nodes, base.nodes);
  assert.equal(narrow.program, null);
  assert.throws(() =>
    validateScene({
      ...base,
      program: { ...program, javascript: "x".repeat(24001) },
    }),
  );
  const { validateProgram } = await import("../server/community/program.mjs");
  assert.doesNotThrow(() => validateProgram(program));
  assert.throws(() =>
    validateProgram({ ...program, javascript: "function render( {" }),
  );
});

test("program documents keep source inert in parent markup and use strict isolated capabilities", async () => {
  const { programDocument } = await import("../shared/community-program.mjs");
  const doc = programDocument({
    html: "</script><script>alert(1)</script>",
    css: "body{color:red}",
    javascript: 'function render(){const data="</script>";}',
    layer: "foreground",
  });
  assert.equal((doc.match(/<script /g) || []).length, 1);
  assert.equal((doc.match(/<\/script>/g) || []).length, 1);
  assert(doc.includes("connect-src 'none'"));
  assert(doc.includes("frame-src 'none'"));
  assert(doc.includes("worker?.terminate()"));
  assert(doc.includes("data-status") || doc.includes("dataset.status"));
  const { exclusionPath } = await import("../shared/community-protection.mjs");
  const path = exclusionPath(
    [
      { left: 10, top: 10, right: 50, bottom: 30, width: 40, height: 20 },
      { left: 30, top: 15, right: 70, bottom: 35, width: 40, height: 20 },
    ],
    100,
    100,
  );
  assert.equal(
    (path.match(/M/g) || []).length,
    2,
    "overlapping protected regions remain a single exclusion",
  );
});

test("lowering the publication limit during generation prevents publication above the new limit", async () => {
  await reset();
  const c = await cookie(),
    owner = identity(c);
  await mutate((s) => {
    s.settings = { publishedPerBrowser: 3, attemptsPerDay: 10 };
    s.visitors[owner] = { count: 1, lastPublishedAt: Date.now() };
  });
  const r = await reserve({
    id: randomUUID(),
    owner,
    ip: "quota-race",
    prompt: "effect",
    tokenHash: randomUUID(),
  });
  await call(
    "/api/community",
    "POST",
    {
      action: "settings",
      settings: { publishedPerBrowser: 1, attemptsPerDay: 10 },
    },
    adminCookie,
  );
  const job = await finish(r.job.id, { approved: true, scene: scene() });
  assert.equal(job.status, "rejected");
  assert.equal(job.reason, "used");
  assert.equal((await readState()).visitors[owner].count, 1);
});

test("quality feedback gets one budgeted correction and a complete independent recheck", async () => {
  const { createEvaluator } = await import("../server/community/ai.mjs");
  let generations = 0,
    renders = 0,
    reviews = 0,
    reservations = 0;
  const evaluate = createEvaluator({
    respond: async (
      model,
      schema,
      system,
      user,
      deadline,
      maxOutput,
      maxInput,
      effort,
    ) => {
      if (model === "claude-haiku-5-5") {
        generations++;
        assert.equal(effort, "high");
        if (generations === 2) {
          const input = JSON.parse(user);
          assert.deepEqual(input.validationFeedback.issues, [
            "intermittent_blank_frames",
          ]);
          assert(input.failedCandidate);
        }
        return {
          value: {
            accepted: true,
            reason: "ok",
            changedFields: ["palette", "nodes"],
            scene: scene(),
          },
          usage: { model, input: 10, output: 10 },
        };
      }
      reviews++;
      assert.equal(effort, "medium");
      return {
        value: {
          approved: true,
          identityIntact: true,
          readable: true,
          safeVisuals: true,
          requestFulfilled: true,
          animationStable: true,
          qualityIssues: [],
          reason: "ok",
        },
        usage: { model, input: 10, output: 10 },
      };
    },
    render: async () => {
      renders++;
      if (renders === 1)
        throw Object.assign(new Error("motion"), {
          code: "quality",
          issues: ["intermittent_blank_frames"],
        });
      return { images: [], contentRevision: "initial" };
    },
    readContent: async () => null,
  });
  const result = await evaluate({
    prompt: "estilo nuevo",
    scene: originalScene,
    deadline: Date.now() + 50000,
    reserveRepair: async () => {
      reservations++;
      return true;
    },
  });
  assert.equal(result.approved, true);
  assert.equal(generations, 2);
  assert.equal(renders, 2);
  assert.equal(reviews, 1);
  assert.equal(reservations, 1);
  assert.equal(result.checks.repairAttempts, 1);
});

test("a failed second quality check never publishes and has no further correction", async () => {
  const { createEvaluator } = await import("../server/community/ai.mjs");
  let generated = 0,
    repairs = 0;
  const evaluate = createEvaluator({
    respond: async (model) => {
      generated++;
      return {
        value: {
          accepted: true,
          reason: "ok",
          changedFields: ["palette"],
          scene: scene(),
        },
        usage: { model, input: 1, output: 1 },
      };
    },
    render: async () => {
      throw Object.assign(new Error("runtime"), { code: "quality" });
    },
  });
  const result = await evaluate({
    prompt: "garden",
    scene: originalScene,
    deadline: Date.now() + 50000,
    reserveRepair: async () => {
      repairs++;
      return true;
    },
  });
  assert.equal(result.approved, false);
  assert.equal(result.reason, "quality");
  assert.equal(generated, 2);
  assert.equal(repairs, 1);
});

test("repair budget reservations are atomic, idempotent and do not spend a second participation", async () => {
  const { reserveRepair } = await import("../server/community/state.mjs");
  await reset();
  const c = await cookie(),
    owner = identity(c),
    r = await reserve({
      id: randomUUID(),
      owner,
      ip: "repair",
      prompt: "fix",
      tokenHash: randomUUID(),
    });
  const results = await Promise.all([
    reserveRepair(r.job.id),
    reserveRepair(r.job.id),
  ]);
  assert(results.every(Boolean));
  const s = await readState();
  assert.equal(s.jobs[r.job.id].reserved, 2 * RESERVATION);
  assert.equal(s.budgets[r.job.month].reserved, 2 * RESERVATION);
  await finish(r.job.id, {
    approved: true,
    scene: scene(),
    checks: { repairAttempts: 1 },
  });
  const final = await readState();
  assert.equal(final.visitors[owner].count, 1);
  assert.equal(final.jobs[r.job.id].checks.repairAttempts, 1);
  assert.equal(await reserveRepair(r.job.id), false);
  await reset();
  const b = await reserve({
    id: randomUUID(),
    owner,
    ip: "repair",
    prompt: "fix",
    tokenHash: randomUUID(),
  });
  await mutate((s) => {
    s.budgets[b.job.month].reserved = MONTHLY_MICRODOLLARS;
  });
  assert.equal(await reserveRepair(b.job.id), false);
});

test("staged review is owner-bound, idempotent, private and publishes once after approval", async () => {
  const { createContinuationHandler } = await import(
    "../api/community/changes/[id].js"
  );
  await reset();
  const c = await cookie(),
    other = await cookie(),
    owner = identity(c);
  const r = await reserve({
    id: randomUUID(),
    owner,
    ip: "staged",
    prompt: "garden",
    tokenHash: randomUUID(),
  });
  await finish(r.job.id, {
    approved: false,
    reason: null,
    cost: 7,
    usage: [{ model: "claude-haiku-5-5", input: 10, output: 12 }],
    checks: { generationAttempts: 1 },
    pending: {
      kind: "review",
      candidate: scene(),
      previews: {
        images: [Buffer.from("image").toString("base64")],
        contentRevision: "initial",
      },
    },
  });
  let s = await readState();
  assert.equal(s.scene.palette, "original");
  assert.equal(Object.keys(s.visitors).length, 0);
  const view = await (
    await call("/api/community/changes/" + r.job.id, "GET", null, c)
  ).json();
  assert.equal(view.status, "processing");
  assert.equal(view.continueRequired, true);
  assert(!JSON.stringify(view).includes("candidate"));
  assert.equal(
    (await call("/api/community/changes/" + r.job.id, "GET", null, other))
      .status,
    404,
  );
  assert.equal(
    (
      await call(
        "/api/community/changes/" + r.job.id,
        "POST",
        { step: view.step },
        c,
        "https://evil.test",
      )
    ).status,
    403,
  );
  let calls = 0;
  const handler = createContinuationHandler({
    evaluate: async (args) => {
      calls++;
      assert.equal(args.resume.kind, "review");
      assert(Buffer.isBuffer(args.resume.previews.images[0]));
      return {
        approved: true,
        scene: args.resume.candidate,
        cost: 20,
        usage: args.resume.usage,
        checks: { generationAttempts: 1 },
      };
    },
  });
  async function directContinue(step) {
    let status = 200,
      payload;
    await handler(
      {
        method: "POST",
        url: "/api/community/changes/" + r.job.id,
        headers: {
          host: new URL(base).host,
          origin: base,
          cookie: c,
          "content-type": "application/json",
        },
        body: { step },
      },
      {
        setHeader() {},
        status(n) {
          status = n;
          return this;
        },
        json(d) {
          payload = d;
        },
      },
    );
    return { status, payload };
  }
  await Promise.all([directContinue(view.step), directContinue(view.step)]);
  assert.equal(calls, 1);
  s = await readState();
  assert.equal(s.scene.palette, "forest");
  assert.equal(s.visitors[owner].count, 1);
  assert.equal(s.budgets[r.job.month].measured, 20);
  assert.equal(s.jobs[r.job.id].pending, undefined);
  assert.equal((await directContinue(view.step)).payload.status, "published");
  assert.equal(calls, 1);
});

test("staged evaluation can correct once across separate invocations and still requires review", async () => {
  const { createEvaluator } = await import("../server/community/ai.mjs");
  let generators = 0,
    reviews = 0,
    renders = 0;
  const evaluate = createEvaluator({
    respond: async (model) => {
      if (model === "claude-haiku-5-5") {
        generators++;
        return {
          value: {
            accepted: true,
            reason: "ok",
            changedFields: ["palette"],
            scene: scene(),
          },
          usage: { model, input: 1, output: 1 },
        };
      }
      reviews++;
      return {
        value: {
          approved: true,
          identityIntact: true,
          readable: true,
          safeVisuals: true,
          requestFulfilled: true,
          animationStable: true,
          qualityIssues: [],
          reason: "ok",
        },
        usage: { model, input: 1, output: 1 },
      };
    },
    render: async () => {
      renders++;
      if (renders === 1)
        throw Object.assign(new Error("quality"), {
          code: "quality",
          issues: ["test_failure"],
        });
      return { images: [Buffer.from("image")], contentRevision: "initial" };
    },
    readContent: async () => null,
  });
  const args = {
    prompt: "garden",
    scene: originalScene,
    deferStages: true,
    deadline: Date.now() + 5000,
    reserveRepair: async () => true,
  };
  const first = await evaluate(args);
  assert.equal(first.pending.kind, "repair");
  assert.equal(reviews, 0);
  const second = await evaluate({
    ...args,
    deadline: Date.now() + 50000,
    resume: { ...first.pending, usage: first.usage, checks: first.checks },
  });
  assert.equal(second.pending.kind, "review");
  assert.equal(reviews, 0);
  assert.equal(second.checks.generationAttempts, 2);
  const pending = second.pending;
  pending.previews.images = pending.previews.images.map((x) =>
    Buffer.from(x, "base64"),
  );
  const final = await evaluate({
    ...args,
    deadline: Date.now() + 50000,
    resume: { ...pending, usage: second.usage, checks: second.checks },
  });
  assert.equal(final.approved, true);
  assert.equal(final.checks.repairAttempts, 1);
  assert.equal(generators, 2);
  assert.equal(reviews, 1);
});

test("image drawing persists against the exact portrait or project surface without changing the photo/content", async () => {
  const { applyDrawing } = await import("../shared/community-scene.mjs");
  const { drawingEnabled } = await import("../shared/community-catalog.mjs");
  const stroke = {
    points: [
      { x: 20, y: 30 },
      { x: 50, y: 60 },
    ],
    color: "blue",
    width: 4,
  };
  let s = applyDrawing(originalScene, { zone: "portrait", strokes: [stroke] });
  assert.equal(drawingEnabled(s, "portrait"), true);
  assert.equal(drawingEnabled(s, "hero"), false);
  assert.equal(s.nodes[0].zone, "portrait");
  s = applyDrawing(s, { zone: "project:teclado-tv", strokes: [stroke] });
  assert.equal(s.nodes.length, 2);
  assert.equal(s.nodes[1].zone, "project:teclado-tv");
  assert.equal(drawingEnabled(s, "project:teclado-tv"), true);
  assert.throws(() =>
    applyDrawing(s, { zone: "project:<script>", strokes: [stroke] }),
  );
  assert.equal(s.photo, undefined);
  assert.equal(s.name, undefined);
});

test("image-drawing requests cannot be satisfied by the existing bands-only canvas", async () => {
  const { scopedProposal } = await import("../server/community/proposal.mjs");
  const base = { ...originalScene, drawing: true };
  assert.throws(
    () =>
      scopedProposal(
        base,
        { changedFields: ["drawing"], scene: base },
        "que en la imagen de perfil se pueda dibujar",
      ),
    (e) => e.code === "quality",
  );
  const next = { ...base, drawing: false, drawingTargets: ["portrait"] };
  const result = scopedProposal(
    base,
    {
      changedFields: ["drawing", "drawingTargets", "palette"],
      scene: { ...next, palette: "cherry" },
    },
    "dibujar solo en la foto del hero, que con el mouse se pueda y que todos vean los aportes",
  );
  assert.equal(result.drawing, false);
  assert.deepEqual(result.drawingTargets, ["portrait"]);
  assert.equal(result.palette, base.palette);
});

test("pause cancels private staged artifacts and stale continuation tokens never execute AI", async () => {
  const { createContinuationHandler } = await import(
    "../api/community/changes/[id].js"
  );
  await reset();
  const c = await cookie(),
    r = await reserve({
      id: randomUUID(),
      owner: identity(c),
      ip: "pause-stage",
      prompt: "test",
      tokenHash: randomUUID(),
    });
  const pending = await finish(r.job.id, {
    approved: false,
    reason: null,
    cost: 0,
    pending: {
      kind: "review",
      candidate: scene(),
      previews: { images: [], contentRevision: "initial" },
    },
  });
  const step = pending.pendingStep;
  await call("/api/community", "POST", { action: "pause" }, adminCookie);
  const s = await readState();
  assert.equal(s.jobs[r.job.id].pending, undefined);
  assert.equal(s.jobs[r.job.id].status, "failed");
  let calls = 0;
  const handler = createContinuationHandler({
    evaluate: async () => {
      calls++;
      throw Error("must not execute");
    },
  });
  let result;
  await handler(
    {
      method: "POST",
      url: "/api/community/changes/" + r.job.id,
      headers: {
        host: new URL(base).host,
        origin: base,
        cookie: c,
        "content-type": "application/json",
      },
      body: { step },
    },
    {
      setHeader() {},
      status() {
        return this;
      },
      json(d) {
        result = d;
      },
    },
  );
  assert.equal(result.reason, "stale");
  assert.equal(calls, 0);
});

test("manual strokes review only their surface, not unchanged generated motion, across invocations", async () => {
  const { createEvaluator } = await import("../server/community/ai.mjs");
  const drawing = {
    zone: "portrait",
    strokes: [
      {
        points: [
          { x: 10, y: 20 },
          { x: 20, y: 30 },
        ],
        color: "blue",
        width: 4,
      },
    ],
  };
  const base = {
    ...originalScene,
    program: {
      html: "",
      css: "",
      javascript: "function render() {}",
      layer: "foreground",
    },
  };
  let calls = 0;
  const evaluate = createEvaluator({
    respond: async (model, schema, system, user) => {
      calls++;
      assert(!JSON.stringify(user).includes("function render"));
      return {
        value: { accepted: true, reason: "ok" },
        usage: { model, input: 30, output: 10 },
      };
    },
    render: async (candidate, options) => {
      assert.equal(options.drawingOnly, true);
      assert.equal(options.drawingZone, "portrait");
      return {
        images: [Buffer.from("photo")],
        quality: null,
        contentRevision: "initial",
      };
    },
    readContent: async () => null,
  });
  const pending = await evaluate({
    scene: base,
    prompt: "my doodle",
    drawing,
    deferStages: true,
    deadline: Date.now() + 10000,
  });
  assert.equal(pending.pending.kind, "review");
  assert.equal(calls, 1);
  const result = await evaluate({
    scene: base,
    prompt: "my doodle",
    drawing: true,
    deferStages: true,
    resume: {
      ...pending.pending,
      usage: pending.usage,
      previews: { ...pending.pending.previews, images: [Buffer.from("photo")] },
    },
    deadline: Date.now() + 10000,
  });
  assert.equal(result.approved, true);
  assert.equal(calls, 2);
  assert.deepEqual(result.scene.program, base.program);
});
