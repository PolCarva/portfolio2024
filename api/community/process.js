import { z } from "zod";
import { body, json } from "../../server/http.mjs";
import {
  validWorkerToken,
  dispatchPending,
  keepAlive,
} from "../../server/community/background.mjs";
import { continueChange } from "../../server/community/process.mjs";
const input = z.object({ id: z.uuid(), step: z.uuid() }).strict();
export const config = { maxDuration: 150 };
export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  try {
    const { id, step } = input.parse(await body(req, 300));
    if (!validWorkerToken(req.headers["x-community-worker"], id, step))
      return json(res, 401, { error: "unauthorized" });
    keepAlive(
      continueChange(id, step, { owns: (job) => job.background === true }).then(
        dispatchPending,
      ),
    );
    return json(res, 202, { accepted: true });
  } catch {
    return json(res, 400, { error: "invalid" });
  }
}
