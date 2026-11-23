import { evaluateChange } from "./ai.mjs";
import { mutate, finish, reserveRepair, problem } from "./state.mjs";
import {
  backgroundEnabled,
  keepAlive,
  dispatchPending,
} from "./background.mjs";

export async function startChange(
  reservation,
  {
    prompt = reservation.job.prompt,
    drawing,
    evaluate = evaluateChange,
    background = backgroundEnabled(),
    runInBackground = keepAlive,
    dispatch = dispatchPending,
  } = {},
) {
  if (reservation.duplicate) return reservation.job;
  const id = reservation.job.id;
  const work = async () => {
    let result;
    try {
      result = await evaluate({
        prompt,
        drawing,
        scene: reservation.scene,
        deadline: Date.now() + 120000,
        reserveRepair: () => reserveRepair(id),
        deferStages: true,
        deferRuntime: true,
      });
    } catch {
      result = { approved: false, reason: "technical" };
    }
    const job = await finish(id, result);
    if (job.background) await dispatch(job);
    return job;
  };
  if (!drawing && background) {
    const job = await mutate((state) => {
      const item = state.jobs[id];
      item.background = true;
      item.leaseAt = Date.now();
      return item;
    });
    runInBackground(work());
    return job;
  }
  return work();
}

// Browser-owned continuations and the server worker share the same atomic claim.
export async function continueChange(
  id,
  step,
  { owns = () => true, evaluate = evaluateChange } = {},
) {
  const claim = await mutate((state) => {
    const job = state.jobs[id];
    if (!job || !owns(job)) throw problem(404, "not_found");
    if (
      !job.pendingStep ||
      job.pendingStep !== step ||
      !job.status.startsWith("awaiting_")
    )
      return { claimed: false, job };
    if (
      state.active !== id ||
      state.revision !== job.base ||
      (!job.diagnostic && state.paused)
    ) {
      job.status = "failed";
      job.reason = "stale";
      delete job.pending;
      delete job.pendingStep;
      if (state.active === id) state.active = null;
      return { claimed: false, job };
    }
    const pending = job.pending;
    delete job.pending;
    delete job.pendingStep;
    job.status = "processing";
    job.queued = false;
    job.leaseAt = Date.now();
    return { claimed: true, job, pending, scene: state.scene };
  });
  if (!claim.claimed) return claim.job;
  const { job, pending } = claim;
  let result;
  try {
    const resume = { ...pending, usage: job.usage || [], checks: job.checks };
    if (pending.kind === "review")
      resume.previews = {
        ...pending.previews,
        images: pending.previews.images.map((bytes) =>
          Buffer.from(bytes, "base64"),
        ),
      };
    result = await evaluate({
      prompt: job.prompt,
      scene: claim.scene,
      drawing: pending.drawing || job.kind === "drawing" ? true : undefined,
      resume,
      deferStages: true,
      deferRuntime: true,
      deadline: Date.now() + 120000,
      reserveRepair: () => reserveRepair(id),
    });
  } catch {
    result = {
      approved: false,
      reason: "technical",
      usage: job.usage,
      cost: job.measuredCost,
      checks: job.checks,
    };
  }
  return finish(id, result);
}
