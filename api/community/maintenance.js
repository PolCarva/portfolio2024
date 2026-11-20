import { timingSafeEqual } from "node:crypto";
import { json } from "../../server/http.mjs";
import { mutate } from "../../server/community/state.mjs";
export default async function handler(req, res) {
  const expected = "Bearer " + process.env.CRON_SECRET,
    provided = req.headers.authorization || "";
  if (
    !process.env.CRON_SECRET ||
    provided.length !== expected.length ||
    !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  )
    return json(res, 401, { error: "unauthorized" });
  if (req.method !== "GET") return json(res, 405, { error: "method" });
  await mutate(() => {});
  return json(res, 200, { ok: true });
}
