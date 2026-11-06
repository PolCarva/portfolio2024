import { readObject } from "../server/storage.mjs";
import { json, failure } from "../server/http.mjs";
export default async function handler(req, res) {
  if (!["GET", "HEAD"].includes(req.method))
    return json(res, 405, { error: "Método no permitido." });
  const name = new URL(req.url, "https://portfolio.local").searchParams.get(
    "file",
  );
  if (!/^[a-f0-9-]{36}\.(png|jpg|webp|pdf)$/.test(name || ""))
    return json(res, 404, { error: "Archivo no encontrado." });
  try {
    const stored = await readObject("media/" + name);
    if (!stored) return json(res, 404, { error: "Archivo no encontrado." });
    const types = {
      png: "image/png",
      jpg: "image/jpeg",
      webp: "image/webp",
      pdf: "application/pdf",
    };
    res.setHeader("Content-Type", types[name.split(".").pop()]);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    res.status(200).send(req.method === "HEAD" ? "" : stored.bytes);
  } catch (error) {
    return failure(res, error);
  }
}
