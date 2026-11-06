import { randomUUID } from "node:crypto";
import { configured, validSession, sameOrigin } from "../server/auth.mjs";
import { defaults, validateContent } from "../server/schema.mjs";
import { readObject, writeObject } from "../server/storage.mjs";
import { json, body, failure } from "../server/http.mjs";
export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const stored = await readObject("content/current.json");
      return json(
        res,
        200,
        stored
          ? JSON.parse(stored.bytes)
          : { revision: "initial", content: defaults },
      );
    }
    if (req.method !== "PUT")
      return json(res, 405, { error: "Método no permitido." });
    if (!configured() || !validSession(req))
      return json(res, 401, { error: "Iniciá sesión para guardar." });
    if (!sameOrigin(req))
      return json(res, 403, { error: "Solicitud no permitida." });
    const data = await body(req);
    const content = validateContent(data.content);
    const stored = await readObject("content/current.json");
    const previous = stored
      ? JSON.parse(stored.bytes)
      : { revision: "initial", content: defaults };
    if (data.revision !== previous.revision)
      return json(res, 409, {
        error:
          "Hay una versión más nueva. Exportá tu borrador y recargá para evitar perder cambios.",
      });
    const revision = randomUUID();
    const document = { revision, updatedAt: new Date().toISOString(), content };
    await writeObject(
      `content/history/${revision}.json`,
      JSON.stringify(previous),
    );
    await writeObject("content/current.json", JSON.stringify(document), {
      etag: stored?.etag,
    });
    return json(res, 200, document);
  } catch (error) {
    return failure(res, error);
  }
}
