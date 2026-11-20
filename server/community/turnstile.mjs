import { problem } from "./state.mjs";
export async function verifyTurnstile(token, req) {
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    },
  );
  if (!response.ok) throw problem(503, "verification_unavailable");
  const result = await response.json();
  const expected = new URL(req.headers.origin).hostname;
  if (
    result.success !== true ||
    result.hostname !== expected ||
    result.action !== "portfolio-change"
  )
    throw problem(403, "verification");
}
