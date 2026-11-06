export async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
      signal: options.signal || AbortSignal.timeout(30000),
    });
  } catch {
    throw new Error(
      "No se pudo conectar. Tus cambios siguen en pantalla; intentá de nuevo.",
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      [
        data.error || "No se pudo completar la operación.",
        ...(data.details || []),
      ].join("\n"),
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
export async function upload(file) {
  if (file.size > 3 * 1024 * 1024)
    throw new Error("El archivo debe pesar como máximo 3 MB.");
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
  return (
    await request("/api/upload", {
      method: "POST",
      body: JSON.stringify({ data }),
    })
  ).url;
}
