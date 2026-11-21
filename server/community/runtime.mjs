import { readObject, writeObject, isStorageConflict } from "../storage.mjs";
import { problem, takeRate } from "./state.mjs";
export const runtimePath = "community/runtime.json";
const fresh = () => ({ values: {}, receipts: {}, rates: {} });
export async function readRuntime() {
  const object = await readObject(runtimePath);
  return object ? JSON.parse(object.bytes) : fresh();
}
export function runtimeValue(state, key) {
  return Object.hasOwn(state.values, key)
    ? state.values[key]
    : { value: null, version: 0 };
}
export function applyRuntimeValue(current, op, value) {
  if (op === "set") return value;
  if (op === "increment") {
    const before = current === null ? 0 : current,
      delta = value ?? 1;
    if (
      !Number.isSafeInteger(before) ||
      !Number.isSafeInteger(delta) ||
      Math.abs(delta) > 1000000 ||
      !Number.isSafeInteger(before + delta)
    )
      throw problem(400, "invalid");
    return before + delta;
  }
  if (op === "append") {
    if (current !== null && !Array.isArray(current))
      throw problem(409, "conflict");
    if ((current?.length || 0) >= 1000) throw problem(409, "capacity");
    return [...(current || []), value];
  }
  throw problem(400, "invalid");
}
let queue = Promise.resolve();
async function transaction(input) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const object = await readObject(runtimePath),
      state = object ? JSON.parse(object.bytes) : fresh(),
      now = Date.now();
    for (const [id, receipt] of Object.entries(state.receipts))
      if (now - receipt.at > 600000) delete state.receipts[id];
    for (const [key, rate] of Object.entries(state.rates))
      if (rate.until < now) delete state.rates[key];
    const previous = state.receipts[input.id];
    if (previous) {
      if (previous.owner !== input.owner || previous.key !== input.key)
        throw problem(409, "conflict");
      return { ...runtimeValue(state, input.key), duplicate: true };
    }
    if (Object.keys(state.receipts).length >= 512)
      throw problem(429, "rate_limited");
    takeRate(state, "runtime-ip:" + input.ip, 120, 60000);
    takeRate(state, "runtime-owner:" + input.owner, 60, 60000);
    takeRate(state, "runtime-global", 300, 60000);
    const current = runtimeValue(state, input.key);
    if (
      input.expectedVersion !== undefined &&
      input.expectedVersion !== current.version
    )
      throw problem(409, "conflict");
    const value = applyRuntimeValue(current.value, input.op, input.value);
    if (Buffer.byteLength(JSON.stringify(value)) > 32000)
      throw problem(409, "capacity");
    const entry = { value, version: current.version + 1 };
    state.values[input.key] = entry;
    if (
      Object.keys(state.values).length > 100 ||
      Buffer.byteLength(JSON.stringify(state.values)) > 128000
    )
      throw problem(409, "capacity");
    state.receipts[input.id] = { owner: input.owner, key: input.key, at: now };
    try {
      await writeObject(runtimePath, JSON.stringify(state), {
        etag: object?.etag,
      });
      return entry;
    } catch (error) {
      if (!isStorageConflict(error)) throw error;
    }
  }
  throw problem(409, "busy");
}
export function updateRuntime(input) {
  if (!process.env.PORTFOLIO_LOCAL_STORE) return transaction(input);
  const next = queue.then(() => transaction(input));
  queue = next.catch(() => {});
  return next;
}
