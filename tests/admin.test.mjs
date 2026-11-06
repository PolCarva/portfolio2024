import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scryptSync, randomBytes } from "node:crypto";
import { createApiServer } from "../server/dev-server.mjs";
import { defaults, validateContent } from "../server/schema.mjs";
import { validSession } from "../server/auth.mjs";
let directory, server, base, cookie;
const password = randomBytes(20).toString("hex");
before(async () => {
  directory = await mkdtemp(join(tmpdir(), "portfolio-admin-"));
  process.env.PORTFOLIO_LOCAL_STORE = directory;
  process.env.ADMIN_PASSWORD_HASH =
    "test-salt:" + scryptSync(password, "test-salt", 64).toString("hex");
  process.env.ADMIN_SESSION_SECRET = randomBytes(48).toString("hex");
  server = createApiServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = "http://127.0.0.1:" + server.address().port;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(directory, { recursive: true, force: true });
});
async function call(path, method = "GET", data, options = {}) {
  return fetch(base + path, {
    method,
    headers: {
      Origin: base,
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...options.headers,
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
}
test("schema rejects unsafe URLs, duplicate anchors and malformed display arrays", () => {
  assert.doesNotThrow(() => validateContent(defaults));
  for (const change of [
    (d) => (d.projects[0].href = "javascript:alert(1)"),
    (d) => (d.projects[1].anchor = d.projects[0].anchor),
    (d) => (d.copy.es.hero = ["broken"]),
  ]) {
    const doc = structuredClone(defaults);
    change(doc);
    assert.throws(() => validateContent(doc));
  }
  assert.deepEqual(
    defaults.projects.map((p) => p.id),
    ["tv", "youtube", "impostor", "wordle"],
  );
});
test("public reads are available but writes require authentication", async () => {
  const response = await call("/api/content");
  const doc = await response.json();
  assert.equal(doc.revision, "initial");
  assert.equal(
    (
      await call("/api/content", "PUT", {
        revision: "initial",
        content: defaults,
      })
    ).status,
    401,
  );
  assert.equal(
    (await call("/api/upload", "POST", { data: "invalid" })).status,
    401,
  );
});
test("login rejects cross-origin and wrong passwords; session is HttpOnly", async () => {
  assert.equal(
    (
      await call(
        "/api/session",
        "POST",
        { password },
        { headers: { Origin: "https://attacker.example" } },
      )
    ).status,
    403,
  );
  assert.equal(
    (await call("/api/session", "POST", { password: "wrong" })).status,
    401,
  );
  const response = await call("/api/session", "POST", { password });
  assert.equal(response.status, 200);
  const header = response.headers.get("set-cookie");
  assert.match(header, /HttpOnly/);
  assert.match(header, /SameSite=Strict/);
  cookie = header.split(";")[0];
  assert.equal((await (await call("/api/session")).json()).authenticated, true);
  assert.equal(
    validSession({ headers: { cookie: cookie + "tampered" } }),
    false,
  );
});
test("authenticated save persists and prevents stale overwrites", async () => {
  const content = structuredClone(defaults);
  content.projects[0].es.title = "Título editado";
  assert.equal(
    (
      await call(
        "/api/content",
        "PUT",
        { revision: "initial", content },
        { headers: { Origin: "https://attacker.example" } },
      )
    ).status,
    403,
  );
  const response = await call("/api/content", "PUT", {
    revision: "initial",
    content,
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.notEqual(result.revision, "initial");
  const persisted = await (await call("/api/content")).json();
  assert.equal(persisted.content.projects[0].es.title, "Título editado");
  assert.equal(
    (
      await call("/api/content", "PUT", {
        revision: "initial",
        content: defaults,
      })
    ).status,
    409,
  );
  const malicious = structuredClone(content);
  malicious.projects[0].href = "javascript:alert(1)";
  assert.equal(
    (
      await call("/api/content", "PUT", {
        revision: result.revision,
        content: malicious,
      })
    ).status,
    400,
  );
});
test("upload validates file signatures and exposes only media files", async () => {
  assert.equal(
    (
      await call("/api/upload", "POST", {
        data:
          "data:image/png;base64," +
          Buffer.from("not an image").toString("base64"),
      })
    ).status,
    400,
  );
  const pdf = Buffer.from("%PDF-1.4\nTest");
  const response = await call("/api/upload", "POST", {
    data: "data:application/pdf;base64," + pdf.toString("base64"),
  });
  assert.equal(response.status, 201);
  const { url } = await response.json();
  const media = await call(url);
  assert.equal(media.status, 200);
  assert.equal(media.headers.get("content-type"), "application/pdf");
  assert.deepEqual(Buffer.from(await media.arrayBuffer()), pdf);
  assert.equal(
    (await call("/api/media?file=../content/current.json")).status,
    404,
  );
});
test("logout clears cookie; persistent limiter blocks repeated login attempts", async () => {
  const response = await call("/api/session", "DELETE");
  assert.match(response.headers.get("set-cookie"), /Max-Age=0/);
  cookie = "";
  assert.equal(
    (await (await call("/api/session")).json()).authenticated,
    false,
  );
  let status;
  for (let i = 0; i < 9; i++)
    status = (await call("/api/session", "POST", { password: "wrong" })).status;
  assert.equal(status, 429);
});

test("Blob compressed-read ETags remain usable for conditional writes", async () => {
  const { storageEtag, isStorageConflict } = await import(
    "../server/storage.mjs"
  );
  const { BlobPreconditionFailedError } = await import("@vercel/blob");
  assert.equal(storageEtag('W/"object-version"'), '"object-version"');
  assert.equal(storageEtag('"object-version"'), '"object-version"');
  assert.equal(isStorageConflict(new BlobPreconditionFailedError()), true);
  assert.equal(isStorageConflict(new Error("connection failed")), false);
});
