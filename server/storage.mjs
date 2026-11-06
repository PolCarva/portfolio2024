import { get, put } from "@vercel/blob";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createHash, randomUUID } from "node:crypto";
const local = () => process.env.PORTFOLIO_LOCAL_STORE;
export async function readObject(path) {
  if (local()) {
    try {
      const bytes = await readFile(resolve(local(), path));
      return { bytes, etag: createHash("sha256").update(bytes).digest("hex") };
    } catch (e) {
      if (e.code === "ENOENT") return null;
      throw e;
    }
  }
  const blob = await get(path, { access: "private", useCache: false });
  return blob
    ? {
        bytes: Buffer.from(await new Response(blob.stream).arrayBuffer()),
        etag: blob.blob.etag,
        type: blob.blob.contentType,
      }
    : null;
}
export async function writeObject(
  path,
  bytes,
  { etag, type = "application/json", overwrite = false } = {},
) {
  if (local()) {
    const target = resolve(local(), path);
    await mkdir(dirname(target), { recursive: true });
    const current = await readObject(path);
    if ((etag && current?.etag !== etag) || (!etag && !overwrite && current)) {
      const e = new Error("Conflict");
      e.status = 409;
      throw e;
    }
    const temporary = target + "." + randomUUID() + ".tmp";
    await writeFile(temporary, bytes);
    await rename(temporary, target);
    return;
  }
  await put(path, bytes, {
    access: "private",
    contentType: type,
    addRandomSuffix: false,
    allowOverwrite: overwrite || !!etag,
    ...(etag ? { ifMatch: etag } : {}),
  });
}
