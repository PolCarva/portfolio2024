import { test } from "node:test";
import assert from "node:assert/strict";
import {
  publicAddress,
  assetTarget,
  createAssetLoader,
} from "../server/community/assets.mjs";
const resolve = async () => [{ address: "93.184.216.34", family: 4 }];
test("preview assets reject private, reserved, mapped and mixed DNS targets", async () => {
  for (const address of [
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "192.168.2.1",
    "100.64.0.1",
    "::1",
    "fc00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "224.0.0.1",
  ])
    assert.equal(publicAddress(address), false, address);
  assert.equal(publicAddress("8.8.8.8"), true);
  assert.equal(publicAddress("2606:4700:4700::1111"), true);
  for (const url of [
    "http://example.org/a.jpg",
    "https://user:password@example.org/a.jpg",
    "https://example.org:444/a.jpg",
    "https://localhost/a.jpg",
    "https://127.0.0.1/a.jpg",
    "https://[::1]/a.jpg",
  ])
    await assert.rejects(assetTarget(url, resolve));
  await assert.rejects(
    assetTarget("https://example.org/a.jpg", async () => [
      ...(await resolve()),
      { address: "10.0.0.1", family: 4 },
    ]),
  );
  const target = await assetTarget("https://example.org/a.jpg", resolve);
  assert.equal(target.address, "93.184.216.34");
  assert.equal(target.url.hostname, "example.org");
});
test("preview assets cache public images and recheck redirects before fetching", async () => {
  const calls = [];
  const asset = createAssetLoader({
    resolve,
    transport: async (target) => {
      calls.push(target);
      return { bytes: Buffer.from("image"), type: "image/jpeg" };
    },
  });
  const values = await Promise.all([
    asset("https://example.org/a.jpg"),
    asset("https://example.org/a.jpg"),
  ]);
  assert.equal(calls.length, 1);
  assert.equal(values[0], values[1]);
  let sent = 0;
  const redirect = createAssetLoader({
    resolve,
    transport: async () => {
      sent++;
      return { redirect: "https://169.254.169.254/secret" };
    },
  });
  await assert.rejects(redirect("https://example.org/a.jpg"), /private_asset/);
  assert.equal(sent, 1);
});
test("preview assets bound count, bytes, MIME type and redirect loops", async () => {
  const wrong = createAssetLoader({
    resolve,
    transport: async () => ({
      bytes: Buffer.from("script"),
      type: "text/javascript",
    }),
  });
  await assert.rejects(
    wrong("https://example.org/a.js"),
    /unsupported_asset_type/,
  );
  const big = createAssetLoader({
    resolve,
    transport: async () => ({
      bytes: Buffer.alloc(5_000_001),
      type: "image/jpeg",
    }),
  });
  await assert.rejects(big("https://example.org/a.jpg"), /invalid_asset/);
  const loops = createAssetLoader({
    resolve,
    transport: async () => ({ redirect: "/loop" }),
  });
  await assert.rejects(loops("https://example.org/a.jpg"), /redirect_limit/);
  const asset = createAssetLoader({
    resolve,
    transport: async (_target, { consume }) => {
      consume(1_000_000);
      return { bytes: Buffer.from("img"), type: "image/jpeg" };
    },
  });
  for (let i = 0; i < 10; i++) await asset("https://example.org/" + i + ".jpg");
  await assert.rejects(asset("https://example.org/11.jpg"), /asset_budget/);
});
