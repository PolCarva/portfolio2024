import { ensureDrawingTarget } from "../../server/community/drawing-targets.mjs";
import { z } from "zod";
import { drawingSchema, applyDrawing } from "../../shared/community-scene.mjs";
import { sameOrigin, validSession } from "../../server/auth.mjs";
import { body, json } from "../../server/http.mjs";
import { communityFailure } from "../community.js";
import {
  ready,
  participationCount,
  settingsFor,
  visitor,
  requestIP,
  digest,
  mutate,
  takeRate,
  reserve,
  readState,
  problem,
  jobResult,
} from "../../server/community/state.mjs";
import { verifyTurnstile } from "../../server/community/turnstile.mjs";
import { startChange } from "../../server/community/process.mjs";
import { evaluateChange } from "../../server/community/ai.mjs";
import {
  backgroundEnabled,
  keepAlive,
  dispatchPending,
} from "../../server/community/background.mjs";
const input = z
  .object({
    id: z.uuid(),
    prompt: z
      .string()
      .trim()
      .min(3)
      .max(500)
      .refine(
        (s) =>
          ![...s].some((c) => {
            const n = c.codePointAt(0);
            return (
              (n < 32 && ![9, 10, 13].includes(n)) ||
              (n >= 0x202a && n <= 0x202e) ||
              (n >= 0x2066 && n <= 0x2069)
            );
          }),
      ),
    token: z.string().min(1).max(2048),
    drawing: drawingSchema.optional(),
  })
  .strict();
export const config = { maxDuration: 150 };
export function createChangeHandler({
  verify = verifyTurnstile,
  evaluate = evaluateChange,
  background = backgroundEnabled,
  runInBackground = keepAlive,
  dispatch = dispatchPending,
} = {}) {
  return async function handler(req, res) {
    try {
      if (req.method !== "POST") throw problem(405, "method");
      if (!sameOrigin(req)) throw problem(403, "origin");
      if (!ready()) throw problem(503, "not_configured");
      const owner = visitor(req, res);
      if (!owner) throw problem(403, "visitor_required");
      const data = input.parse(await body(req, 50000)),
        ip = requestIP(req);
      const existing = (await readState()).jobs[data.id];
      if (existing) {
        if (existing.owner !== owner) throw problem(404, "not_found");
        return json(res, 200, jobResult(existing));
      }
      if (data.drawing) await ensureDrawingTarget(data.drawing.zone);
      await mutate((state) => {
        if (state.paused || (state.mode !== "public" && !validSession(req)))
          throw problem(503, "paused");
        if (
          participationCount(state, owner) >=
          settingsFor(state).publishedPerBrowser
        )
          throw problem(409, "used");
        if (data.drawing) {
          try {
            applyDrawing(state.scene, data.drawing);
          } catch {
            throw problem(409, "capacity");
          }
        }
        takeRate(state, "submit:" + ip, 30, 3600000);
      });
      await verify(data.token, req);
      const reservation = await reserve({
        id: data.id,
        owner,
        ip,
        prompt: data.prompt,
        tokenHash: digest("token:" + data.token),
        allowPrivate: validSession(req),
        kind: data.drawing ? "drawing" : "prompt",
      });
      if (reservation.duplicate)
        return json(res, 200, jobResult(reservation.job));
      const job = await startChange(reservation, {
        prompt: data.prompt,
        drawing: data.drawing,
        evaluate,
        background: background(),
        runInBackground,
        dispatch,
      });
      return json(res, job.background ? 202 : 200, jobResult(job));
    } catch (e) {
      return communityFailure(res, e);
    }
  };
}
export default createChangeHandler();
