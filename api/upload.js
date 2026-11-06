import { randomUUID } from "node:crypto";
import { validSession, sameOrigin } from "../server/auth.mjs";
import { writeObject } from "../server/storage.mjs";
import { json, body, failure } from "../server/http.mjs";
export default async function handler(req, res) {
  if (req.method !== "POST")
    return json(res, 405, { error: "Método no permitido." });
  if (!validSession(req))
    return json(res, 401, { error: "Iniciá sesión para subir archivos." });
  if (!sameOrigin(req))
    return json(res, 403, { error: "Solicitud no permitida." });
  try {
    const { data } = await body(req, 4200000);
    if (
      typeof data !== "string" ||
      !/^data:(image\/(png|jpeg|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(
        data,
      )
    )
      return json(res, 400, {
        error: "Subí una imagen JPG, PNG, WebP o un PDF.",
      });
    const [prefix, base64] = data.split(",");
    const bytes = Buffer.from(base64, "base64");
    if (bytes.length > 3 * 1024 * 1024)
      return json(res, 413, {
        error: "El archivo debe pesar como máximo 3 MB.",
      });
    const types = [
      [
        "image/png",
        "png",
        (b) =>
          b
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      ],
      [
        "image/jpeg",
        "jpg",
        (b) => b[0] === 255 && b[1] === 216 && b[2] === 255,
      ],
      [
        "image/webp",
        "webp",
        (b) =>
          b.subarray(0, 4).toString() === "RIFF" &&
          b.subarray(8, 12).toString() === "WEBP",
      ],
      [
        "application/pdf",
        "pdf",
        (b) => b.subarray(0, 5).toString() === "%PDF-",
      ],
    ];
    const type = types.find(
      ([mime, , test]) => prefix === `data:${mime};base64` && test(bytes),
    );
    if (!type)
      return json(res, 400, {
        error: "El archivo no coincide con su formato.",
      });
    const name = randomUUID() + "." + type[1];
    await writeObject("media/" + name, bytes, { type: type[0] });
    return json(res, 201, { url: "/api/media?file=" + name });
  } catch (error) {
    return failure(res, error);
  }
}
