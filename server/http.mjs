export function json(res, status, data) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.status(status).json(data);
}
export async function body(req, max = 750000) {
  if (req.body !== undefined) {
    const value =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (Buffer.byteLength(JSON.stringify(value)) > max)
      throw Object.assign(new Error("El contenido es demasiado grande."), {
        status: 413,
      });
    return value;
  }
  let result = "";
  for await (const chunk of req) {
    result += chunk;
    if (Buffer.byteLength(result) > max)
      throw Object.assign(new Error("El contenido es demasiado grande."), {
        status: 413,
      });
  }
  return JSON.parse(result || "{}");
}
export function failure(res, error) {
  if (error instanceof SyntaxError)
    return json(res, 400, { error: "La solicitud no contiene JSON válido." });
  if (error.name === "ZodError")
    return json(res, 400, {
      error: "Revisá los campos indicados.",
      details: error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .slice(0, 12),
    });
  if (
    error.name === "BlobPreconditionFailedError" ||
    error.name === "BlobAlreadyExistsError" ||
    error.status === 409
  )
    return json(res, 409, {
      error:
        "El contenido cambió en otra sesión. Exportá tu borrador y recargá antes de guardar.",
    });
  console.error(error.name, error.status || "server_error");
  return json(res, error.status || 503, {
    error: error.status
      ? error.message
      : "No se pudo completar la operación. Volvé a intentar; tus cambios no se descartaron.",
  });
}
