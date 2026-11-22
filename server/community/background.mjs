import { createHmac, timingSafeEqual } from "node:crypto";
import { waitUntil } from "@vercel/functions";
import { secret, mutate } from "./state.mjs";

export const backgroundEnabled = () =>
  Boolean(process.env.VERCEL && !process.env.PORTFOLIO_LOCAL_STORE);
const signature = (id, step, expires) =>
  createHmac("sha256", secret())
    .update(`community-worker:${id}:${step}:${expires}`)
    .digest("hex");
export function workerToken(id, step, now = Date.now()) {
  const expires = now + 120000;
  return `${expires}.${signature(id, step, expires)}`;
}
export function validWorkerToken(token, id, step, now = Date.now()) {
  if (!secret() || typeof token !== "string") return false;
  const [time, mac, extra] = token.split("."),
    expires = Number(time);
  if (
    extra !== undefined ||
    !Number.isSafeInteger(expires) ||
    expires < now ||
    expires > now + 120000 ||
    !/^[a-f0-9]{64}$/.test(mac || "")
  )
    return false;
  const expected = signature(id, step, expires);
  return timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
}
export async function dispatchPending(
  job,
  {
    fetcher = fetch,
    origin = process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://www.pablocarvalho.dev",
  } = {},
) {
  if (
    !job?.background ||
    !job.pendingStep ||
    !job.status.startsWith("awaiting_")
  )
    return;
  let error;
  // Delivery may be retried. The nonce claim prevents repeating a paid provider call.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetcher(origin + "/api/community/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Community-Worker": workerToken(job.id, job.pendingStep),
        },
        body: JSON.stringify({ id: job.id, step: job.pendingStep }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw Error("worker_delivery_" + response.status);
      return;
    } catch (caught) {
      error = caught;
    }
  }
  console.error("community_worker_delivery", error.message);
}
export function keepAlive(task) {
  waitUntil(
    task.catch((error) =>
      console.error("community_background_error", error.code || error.name),
    ),
  );
}
export async function recoverQueued(state) {
  const pending = state.jobs[state.active];
  if (
    !backgroundEnabled() ||
    !pending?.background ||
    !pending.queued ||
    !pending.pendingStep ||
    Date.now() - (pending.dispatchedAt || 0) < 15000
  )
    return;
  const job = await mutate((current) => {
    const item = current.jobs[current.active];
    if (
      !item?.queued ||
      !item.background ||
      !item.pendingStep ||
      current.paused ||
      Date.now() - (item.dispatchedAt || 0) < 15000
    )
      return null;
    item.dispatchedAt = Date.now();
    return item;
  });
  if (job) keepAlive(dispatchPending(job));
}
