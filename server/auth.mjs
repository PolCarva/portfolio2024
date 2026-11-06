import {
  createHmac,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { readObject, writeObject } from "./storage.mjs";
const cookie = "portfolio_admin";
export function configured() {
  return (
    !!process.env.ADMIN_PASSWORD_HASH && !!process.env.ADMIN_SESSION_SECRET
  );
}
const secret = () => process.env.ADMIN_SESSION_SECRET;
const mac = (v) => createHmac("sha256", secret()).update(v).digest("base64url");
function equal(a, b) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function validPassword(password) {
  const [salt, hash] = process.env.ADMIN_PASSWORD_HASH.split(":");
  return (
    typeof password === "string" &&
    password.length <= 256 &&
    equal(scryptSync(password, salt, 64).toString("hex"), hash)
  );
}
export function validSession(req) {
  if (!configured()) return false;
  const value = (req.headers.cookie || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(cookie + "="))
    ?.slice(cookie.length + 1);
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !equal(signature, mac(payload))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return (
      data.exp > Date.now() &&
      data.version === process.env.ADMIN_PASSWORD_HASH.slice(-16)
    );
  } catch {
    return false;
  }
}
export function sessionCookie(clear = false) {
  const payload = Buffer.from(
    JSON.stringify({
      exp: Date.now() + 8 * 3600000,
      nonce: randomUUID(),
      version: process.env.ADMIN_PASSWORD_HASH.slice(-16),
    }),
  ).toString("base64url");
  const value = clear ? "" : payload + "." + mac(payload);
  return `${cookie}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : 28800}${process.env.PORTFOLIO_LOCAL_STORE ? "" : "; Secure"}`;
}
export function sameOrigin(req) {
  try {
    const origin = new URL(req.headers.origin);
    const hostAllowed =
      origin.host === req.headers.host ||
      (process.env.PORTFOLIO_LOCAL_STORE &&
        ["127.0.0.1", "localhost"].includes(origin.hostname));
    return (
      !!hostAllowed &&
      !!req.headers["content-type"]?.startsWith("application/json")
    );
  } catch {
    return false;
  }
}
// Private, persistent counters shared between all serverless instances. Never trust browser-supplied IP headers.
export async function limitLogin(req) {
  const ip = process.env.PORTFOLIO_LOCAL_STORE
    ? "local"
    : req.headers["x-vercel-forwarded-for"];
  if (!ip && !process.env.PORTFOLIO_LOCAL_STORE)
    throw Object.assign(
      new Error("No se pudo verificar el origen de la solicitud."),
      { status: 503 },
    );
  const id = mac(String(ip));
  const bucket = Math.floor(Date.now() / 900000);
  const path = `auth-attempts/${bucket}/${id}.json`;
  for (let retry = 0; retry < 4; retry++) {
    const current = await readObject(path);
    const count = current ? JSON.parse(current.bytes).count : 0;
    if (count >= 8)
      throw Object.assign(
        new Error(
          "Demasiados intentos. Esperá 15 minutos para volver a intentar.",
        ),
        { status: 429 },
      );
    try {
      await writeObject(path, JSON.stringify({ count: count + 1 }), {
        etag: current?.etag,
      });
      return;
    } catch (e) {
      if (
        e.name === "BlobPreconditionFailedError" ||
        e.name === "BlobAlreadyExistsError" ||
        e.status === 409
      )
        continue;
      throw e;
    }
  }
  throw Object.assign(new Error("Volvé a intentar en unos segundos."), {
    status: 429,
  });
}
