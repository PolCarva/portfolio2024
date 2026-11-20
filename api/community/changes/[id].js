import { json } from "../../../server/http.mjs";
import { communityFailure } from "../../community.js";
import {
  visitor,
  secret,
  readState,
  problem,
  jobResult,
} from "../../../server/community/state.mjs";
export default async function handler(req, res) {
  try {
    if (req.method !== "GET") throw problem(405, "method");
    if (!secret()) throw problem(503, "not_configured");
    const owner = visitor(req, res);
    if (!owner) throw problem(404, "not_found");
    const id =
      req.query?.id ||
      new URL(req.url, "https://local").pathname.split("/").pop();
    const job = (await readState()).jobs[id];
    if (!job || job.owner !== owner) throw problem(404, "not_found");
    if (job.status === "processing" && Date.now() - job.createdAt > 290000)
      return json(res, 200, {
        id: job.id,
        status: "failed",
        reason: "timeout",
        revision: null,
      });
    return json(res, 200, jobResult(job));
  } catch (e) {
    return communityFailure(res, e);
  }
}
