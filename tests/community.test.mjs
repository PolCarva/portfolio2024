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
  const allowed = { accepted: true, reason: "ok", scene: scene() };
  const good = {
    approved: true,
    identityIntact: true,
    readable: true,
    safeVisuals: true,
    reason: "ok",
  };
  for (const verdict of [
    good,
    { ...good, approved: false },
    { ...good, identityIntact: false },
    { ...good, readable: false },
    { ...good, safeVisuals: false },
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
            ? { accepted: true, reason: "ok", scene: scene() }
            : {
                approved: true,
                identityIntact: true,
                readable: true,
                safeVisuals: true,
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
