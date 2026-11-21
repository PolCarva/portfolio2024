import { z } from "zod";
import { body, json } from "../../server/http.mjs";
import { sameOrigin, validSession } from "../../server/auth.mjs";
import {
  visitor,
  requestIP,
  readState,
  problem,
  secret,
} from "../../server/community/state.mjs";
import {
  readRuntime,
  runtimeValue,
  updateRuntime,
} from "../../server/community/runtime.mjs";
import { communityFailure } from "../community.js";
const key = z.string().regex(/^[a-z][a-z0-9_-]{0,47}$/);
const input = z
  .object({
    id: z.uuid(),
    key,
    op: z.enum(["set", "increment", "append"]),
    value: z.json().optional().default(null),
    expectedVersion: z.number().int().min(0).optional(),
  })
  .strict();
export default async function handler(req, res) {
  try {
    if (!["GET", "POST"].includes(req.method)) throw problem(405, "method");
    if (req.method === "GET") {
      const name = key.parse(
        req.query?.key ||
          new URL(req.url, "https://local").searchParams.get("key"),
      );
      return json(res, 200, runtimeValue(await readRuntime(), name));
    }
    if (!sameOrigin(req)) throw problem(403, "origin");
    if (!secret()) throw problem(503, "not_configured");
    const owner = visitor(req, res);
    if (!owner) throw problem(403, "visitor_required");
    const data = input.parse(await body(req, 34000)),
      state = await readState();
    if (state.paused || (state.mode !== "public" && !validSession(req)))
      throw problem(503, "paused");
    return json(
      res,
      200,
      await updateRuntime({ ...data, owner, ip: requestIP(req) }),
    );
  } catch (error) {
    return communityFailure(res, error);
  }
}
