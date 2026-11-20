import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { readObject, writeObject, isStorageConflict } from "../storage.mjs";
import { originalScene, validateScene } from "../../shared/community-scene.mjs";
export const MONTHLY_MICRODOLLARS = 10_000_000;
export const RESERVATION = 60_000;
export const LEASE_MS = 70_000;
const path = "community/state.json";
export const secret = () =>
  process.env.COMMUNITY_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
export const digest = (v) =>
  createHmac("sha256", secret()).update(v).digest("hex");
export const ready = () =>
  Boolean(
    process.env.ANTHROPIC_API_KEY &&
      process.env.TURNSTILE_SECRET_KEY &&
      process.env.TURNSTILE_SITE_KEY &&
      secret(),
  );
export function settingsFor(state) {
  return {
    publishedPerBrowser: state.settings?.publishedPerBrowser ?? 5,
    attemptsPerDay: state.settings?.attemptsPerDay ?? 10,
  };
}
export function participationCount(state, owner) {
  const record = state.visitors[owner];
  return record && typeof record === "object" ? record.count : record ? 1 : 0;
}
export const freshState = () => ({
  version: 1,
  paused: true,
  revision: "original",
  scene: originalScene,
  history: [],
  visitors: {},
  jobs: {},
  rates: {},
  tokens: {},
  budgets: {},
  active: null,
});
export function prune(state, now = Date.now()) {
  let changed = false;
  for (const job of Object.values(state.jobs)) {
    if (job.prompt && now - job.createdAt > 29 * 86400000) {
      delete job.prompt;
      changed = true;
    }
    if (job.status === "processing" && now - job.createdAt > LEASE_MS) {
      job.status = "failed";
      job.reason = "timeout";
      changed = true;
    }
  }
  if (state.active && state.jobs[state.active]?.status !== "processing") {
    state.active = null;
    changed = true;
  }
  for (const [key, value] of Object.entries(state.rates))
    if (value.until < now) {
      delete state.rates[key];
      changed = true;
    }
  for (const [key, time] of Object.entries(state.tokens))
    if (now - time > 86400000) {
      delete state.tokens[key];
      changed = true;
    }
  // Keep idempotency/status records 30 days, but successful participation forever.
  for (const [key, job] of Object.entries(state.jobs))
    if (
      now - job.createdAt > 30 * 86400000 &&
      !["published", "reverted"].includes(job.status)
    ) {
      delete state.jobs[key];
      changed = true;
    }
  return changed;
}
export async function readState() {
  const object = await readObject(path);
  return object ? JSON.parse(object.bytes) : freshState();
}
let localQueue = Promise.resolve();
async function transaction(fn) {
  for (let i = 0; i < 8; i++) {
    const object = await readObject(path),
      state = object ? JSON.parse(object.bytes) : freshState();
    prune(state);
    const result = await fn(state);
    try {
      await writeObject(path, JSON.stringify(state), { etag: object?.etag });
      return result;
    } catch (e) {
      if (!isStorageConflict(e)) throw e;
    }
  }
  throw problem(409, "busy");
}
export function mutate(fn) {
  if (!process.env.PORTFOLIO_LOCAL_STORE) return transaction(fn);
  const next = localQueue.then(() => transaction(fn));
  localQueue = next.catch(() => {});
  return next;
}
export function problem(status, code) {
  return Object.assign(new Error(code), { status, code });
}
const cookieName = () =>
  process.env.PORTFOLIO_LOCAL_STORE
    ? "community_visitor"
    : "__Host-community_visitor";
function equal(a, b) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function visitor(req, res, create = false) {
  const value = (req.headers.cookie || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(cookieName() + "="))
    ?.slice(cookieName().length + 1);
  if (value) {
    const [id, mac] = value.split(".");
    if (
      /^[a-f0-9-]{36}$/.test(id || "") &&
      mac &&
      equal(digest("cookie:" + id), mac)
    )
      return digest("visitor:" + id);
  }
  if (!create) return null;
  const id = randomUUID(),
    signed = id + "." + digest("cookie:" + id);
  res.setHeader(
    "Set-Cookie",
    `${cookieName()}=${signed}; Path=/; HttpOnly; SameSite=Strict; Max-Age=157680000${process.env.PORTFOLIO_LOCAL_STORE ? "" : "; Secure"}`,
  );
  return digest("visitor:" + id);
}
export function requestIP(req) {
  const ip = process.env.PORTFOLIO_LOCAL_STORE
    ? "local"
    : req.headers["x-vercel-forwarded-for"];
  if (!ip || String(ip).length > 200) throw problem(503, "unavailable");
  return digest("ip:" + ip);
}
export function takeRate(state, key, max, windowMs, now = Date.now()) {
  const bucket = Math.floor(now / windowMs),
    id = key + ":" + bucket;
  const rate = state.rates[id] || { count: 0, until: (bucket + 1) * windowMs };
  if (rate.count >= max) throw problem(429, "rate_limited");
  rate.count++;
  state.rates[id] = rate;
}
export function publicState(state, id, admin = false) {
  const month = new Date().toISOString().slice(0, 7),
    spent = state.budgets[month]?.reserved || 0;
  const settings = settingsFor(state);
  const published = id ? participationCount(state, id) : 0;
  const used = published >= settings.publishedPerBrowser;
  const visible =
    state.mode !== "public" && !admin
      ? state.publicSnapshot || { revision: "original", scene: originalScene }
      : state;
  return {
    revision: visible.revision,
    scene: validateScene(visible.scene),
    modified:
      JSON.stringify(validateScene(visible.scene)) !==
      JSON.stringify(validateScene(originalScene)),
    available:
      ready() &&
      !state.paused &&
      (state.mode === "public" || admin) &&
      !used &&
      !state.active &&
      spent + RESERVATION <= MONTHLY_MICRODOLLARS,
    used,
    participation: {
      published,
      limit: settings.publishedPerBrowser,
      remaining: Math.max(0, settings.publishedPerBrowser - published),
      attemptsPerDay: settings.attemptsPerDay,
    },
    reason: !ready()
      ? "not_configured"
      : state.paused || (state.mode !== "public" && !admin)
        ? "paused"
        : used
          ? "used"
          : spent + RESERVATION > MONTHLY_MICRODOLLARS
            ? "budget"
            : state.active
              ? "busy"
              : null,
    siteKey: ready() ? process.env.TURNSTILE_SITE_KEY : null,
  };
}
export async function reserve({
  id,
  owner,
  ip,
  prompt,
  tokenHash,
  diagnostic = false,
  kind = "prompt",
  allowPrivate = false,
}) {
  return mutate((state) => {
    const duplicate = state.jobs[id];
    if (duplicate) {
      if (duplicate.owner !== owner) throw problem(404, "not_found");
      return { duplicate: true, job: duplicate };
    }
    if (
      (state.paused || (state.mode !== "public" && !allowPrivate)) &&
      !diagnostic
    )
      throw problem(503, "paused");
    const settings = settingsFor(state);
    if (
      participationCount(state, owner) >= settings.publishedPerBrowser &&
      !diagnostic
    )
      throw problem(409, "used");
    if (state.active) throw problem(409, "busy");
    if (state.tokens[tokenHash]) throw problem(403, "verification");
    const month = new Date().toISOString().slice(0, 7);
    const budget = state.budgets[month] || { reserved: 0, measured: 0 };
    if (budget.reserved + RESERVATION > MONTHLY_MICRODOLLARS)
      throw problem(429, "budget");
    if (!diagnostic) {
      takeRate(state, "visitor:" + owner, settings.attemptsPerDay, 86400000);
      takeRate(
        state,
        "generation-ip:" + ip,
        Math.max(10, settings.attemptsPerDay * 2),
        86400000,
      );
    }
    budget.reserved += RESERVATION;
    state.budgets[month] = budget;
    const job = {
      id,
      owner,
      diagnostic,
      kind: diagnostic ? "diagnostic" : kind,
      prompt,
      createdAt: Date.now(),
      status: "processing",
      reason: null,
      base: state.revision,
      month,
      reserved: RESERVATION,
      usage: [],
      revision: null,
    };
    state.jobs[id] = job;
    state.active = id;
    state.tokens[tokenHash] = Date.now();
    return { duplicate: false, job, scene: state.scene };
  });
}
export async function finish(id, result) {
  return mutate((state) => {
    const job = state.jobs[id];
    if (!job || job.status !== "processing") return job;
    job.usage = result.usage || [];
    state.budgets[job.month].measured += result.cost || 0;
    if (result.cost > job.reserved) {
      state.paused = true;
      result.approved = false;
      result.reason = "budget";
    }
    if (job.diagnostic) {
      job.status = result.approved
        ? "verified"
        : result.reason === "technical"
          ? "failed"
          : "rejected";
      job.reason = result.approved ? null : result.reason;
      if (state.active === id) state.active = null;
      return job;
    }
    if (
      result.approved &&
      participationCount(state, job.owner) >=
        settingsFor(state).publishedPerBrowser
    ) {
      result.approved = false;
      result.reason = "used";
    }
    if (
      result.approved &&
      (state.paused || state.active !== id || state.revision !== job.base)
    ) {
      result.approved = false;
      result.reason = "stale";
    }
    if (result.approved) {
      const scene = validateScene(result.scene),
        revision = randomUUID();
      state.history.push({
        revision: state.revision,
        at: Date.now(),
        scene: state.scene,
      });
      // Up to 100 private restore points. Participation and spending are never reset.
      state.history = state.history.slice(-100);
      state.scene = scene;
      state.revision = revision;
      state.visitors[job.owner] = {
        count: participationCount(state, job.owner) + 1,
        lastPublishedAt: Date.now(),
      };
      job.status = "published";
      job.revision = revision;
    } else
      job.status =
        result.reason === "technical" || result.reason === "timeout"
          ? "failed"
          : "rejected";
    job.reason = result.approved ? null : result.reason || "unsafe";
    if (state.active === id) state.active = null;
    return job;
  });
}
export const jobResult = (job) => ({
  id: job.id,
  status: job.status,
  reason: job.reason,
  revision: job.revision,
});
