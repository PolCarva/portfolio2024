import { evaluateChange } from "./ai.mjs";
import { mutate, finish, reserveRepair, problem } from "./state.mjs";

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
