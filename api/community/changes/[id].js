import { z } from "zod";
import { json, body } from "../../../server/http.mjs";
import { sameOrigin, validSession } from "../../../server/auth.mjs";
import { communityFailure } from "../../community.js";
import { evaluateChange } from "../../../server/community/ai.mjs";
import { continueChange } from "../../../server/community/process.mjs";
import { recoverQueued } from "../../../server/community/background.mjs";
import {
  visitor,
  secret,
  readState,
  prune,
  problem,
  jobResult,
} from "../../../server/community/state.mjs";
const input = z.object({ step: z.uuid() }).strict();
export const config = { maxDuration: 150 };
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
      const owns = (job) => job && (job.owner === owner || admin);
      if (req.method === "GET") {
        const state = await readState();
        await recoverQueued(state);
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
      const completed = await continueChange(id, step, { owns, evaluate });
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
