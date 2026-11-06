import {
  configured,
  validPassword,
  validSession,
  sessionCookie,
  sameOrigin,
  limitLogin,
} from "../server/auth.mjs";
import { json, body, failure } from "../server/http.mjs";
export default async function handler(req, res) {
  if (!configured())
    return json(res, 503, {
      error: "El administrador todavía no está configurado.",
    });
  if (req.method === "GET")
    return json(res, 200, { authenticated: validSession(req) });
  if (!["POST", "DELETE"].includes(req.method))
    return json(res, 405, { error: "Método no permitido." });
  if (!sameOrigin(req))
    return json(res, 403, { error: "Solicitud no permitida." });
  try {
    if (req.method === "DELETE") {
      res.setHeader("Set-Cookie", sessionCookie(true));
      return json(res, 200, { authenticated: false });
    }
    await limitLogin(req);
    const data = await body(req, 2000);
    if (!validPassword(data.password))
      return json(res, 401, { error: "Contraseña incorrecta." });
    res.setHeader("Set-Cookie", sessionCookie());
    return json(res, 200, { authenticated: true });
  } catch (error) {
    return failure(res, error);
  }
}
