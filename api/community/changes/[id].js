import { z } from "zod";
import { json, body } from "../../../server/http.mjs";
import { sameOrigin, validSession } from "../../../server/auth.mjs";
import { communityFailure } from "../../community.js";
import { evaluateChange } from "../../../server/community/ai.mjs";
import {
  visitor,
  secret,
  readState,
  mutate,
  prune,
  problem,
  jobResult,
  finish,
  reserveRepair,
} from "../../../server/community/state.mjs";
const input = z.object({ step: z.uuid() }).strict();
export const config = { maxDuration: 60 };
export function createContinuationHandler({ evaluate = evaluateChange } = {}) {
  return async function handler(req, res) {
    try {
      if (!["GET", "POST"].includes(req.method)) throw problem(405, "method");
      if (!secret()) throw problem(503, "not_configured");
      const owner = visitor(req, res),
        admin = validSession(req);
      const id =
        req.query?.id ||
        new URL(req.url, "https://local").pathname.split("/").pop();
      const owns = (job) =>
        job && (job.owner === owner || (job.diagnostic && admin));
      if (req.method === "GET") {
        const state = await readState();
        prune(state);
        const job = state.jobs[id];
        if (!owns(job)) throw problem(404, "not_found");
        return json(res, 200, {
          ...jobResult(job),
          ...(job.diagnostic
            ? {
                ok:
                  job.status === "verified" ||
                  (job.status === "rejected" && job.reason === "unsafe"),
                usage: job.usage,
                checks: job.checks,
              }
            : {}),
        });
      }
      if (!sameOrigin(req)) throw problem(403, "origin");
      const { step } = input.parse(await body(req, 300));
      const claim = await mutate((state) => {
        const job = state.jobs[id];
        if (!owns(job)) throw problem(404, "not_found");
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
        job.leaseAt = Date.now();
        return { claimed: true, job, pending, scene: state.scene };
      });
      if (!claim.claimed) return json(res, 200, jobResult(claim.job));
      const { job, pending } = claim;
      let result;
      try {
        const resume = {
          ...pending,
          usage: job.usage || [],
          checks: job.checks,
        };
        if (pending.kind === "review")
          resume.previews = {
            ...pending.previews,
            images: pending.previews.images.map((data) =>
              Buffer.from(data, "base64"),
            ),
          };
        result = await evaluate({
          prompt: job.prompt,
          scene: claim.scene,
          drawing: job.kind === "drawing" ? true : undefined,
          resume,
          deferStages: true,
          deadline: Date.now() + 50000,
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
      const completed = await finish(id, result);
      return json(res, 200, {
        ...jobResult(completed),
        ...(completed.diagnostic
          ? {
              ok:
                completed.status === "verified" ||
                (completed.status === "rejected" &&
                  completed.reason === "unsafe"),
              usage: completed.usage,
              checks: completed.checks,
            }
          : {}),
      });
    } catch (error) {
      return communityFailure(res, error);
    }
  };
}
export default createContinuationHandler();
