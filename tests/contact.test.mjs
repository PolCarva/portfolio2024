import { test } from "node:test";
import assert from "node:assert/strict";
import { contactPayload, deliverContact } from "../src/contact.mjs";
test("editable-page contact bridge only forwards bounded known fields to the original endpoint without cookies", async () => {
  const fetch = globalThis.fetch;
  let received;
  try {
    globalThis.fetch = async (url, options) => {
      received = { url, options };
      return { ok: true };
    };
    const data = contactPayload({
      name: "Visitor",
      email: "visitor@example.test",
      message: "A contact form test.",
      url: "https://other.invalid",
      secret: "ignored",
    });
    await deliverContact(data, new AbortController().signal);
    assert.equal(received.url, "https://formspree.io/f/xpzedzvr");
    assert.equal(received.options.credentials, "omit");
    assert.equal(received.options.referrerPolicy, "no-referrer");
    assert.equal(data.has("secret"), false);
    assert.equal(data.has("url"), false);
    assert.equal(data.get("message"), "A contact form test.");
  } finally {
    globalThis.fetch = fetch;
  }
  for (const bad of [
    {},
    { name: "x", email: "x", message: "too short" },
    { name: "x", email: "x@y.test", message: "x".repeat(5001) },
  ])
    assert.throws(() => contactPayload(bad));
});
