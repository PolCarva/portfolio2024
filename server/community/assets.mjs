import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { isIP } from "node:net";
import ipaddr from "ipaddr.js";

export function publicAddress(address) {
  try {
    let ip = ipaddr.parse(address);
    if (ip.kind() === "ipv6" && ip.isIPv4MappedAddress())
      ip = ip.toIPv4Address();
    return ip.range() === "unicast";
  } catch {
    return false;
  }
}
export async function assetTarget(
  value,
  resolve = (host) => lookup(host, { all: true }),
) {
  const url = new URL(value),
    host = url.hostname.replace(/^\[|\]$/g, "");
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    value.length > 4096
  )
    throw Error("unsupported_asset_url");
  if (
    !host ||
    /(^|\.)(localhost|local|internal|localhost\.localdomain)$/i.test(host)
  )
    throw Error("private_asset_address");
  const addresses = isIP(host)
    ? [{ address: host, family: isIP(host) }]
    : await Promise.race([
        resolve(host),
        new Promise((_, reject) => {
          const timer = setTimeout(
            () => reject(Error("asset_dns_timeout")),
            4000,
          );
          timer.unref?.();
        }),
      ]);
  if (
    !addresses.length ||
    addresses.some((item) => !publicAddress(item.address))
  )
    throw Error("private_asset_address");
  return { url, address: addresses[0].address, family: addresses[0].family };
}
export function requestAsset(
  target,
  { maxBytes, consume = () => {}, timeout = 8000 } = {},
) {
  return new Promise((resolve, reject) => {
    const req = request(
      target.url,
      {
        agent: false,
        headers: {
          Accept: "image/*,font/*;q=0.9,*/*;q=0.1",
          "User-Agent": "Mozilla/5.0 PortfolioPreview/1.0",
        },
        // Pin the checked public address; a second DNS answer cannot redirect us into a private network.
        lookup: (_host, options, callback) =>
          options.all
            ? callback(null, [
                { address: target.address, family: target.family },
              ])
            : callback(null, target.address, target.family),
      },
      (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          res.destroy();
          resolve({ redirect: res.headers.location });
          return;
        }
        if (res.statusCode !== 200) {
          res.destroy();
          reject(Error("asset_http_" + res.statusCode));
          return;
        }
        if (Number(res.headers["content-length"]) > maxBytes) {
          res.destroy();
          reject(Error("asset_too_large"));
          return;
        }
        const parts = [];
        let size = 0;
        res.on("data", (chunk) => {
          try {
            size += chunk.length;
            consume(chunk.length);
            if (size > maxBytes) throw Error("asset_too_large");
            parts.push(chunk);
          } catch (error) {
            res.destroy(error);
          }
        });
        res.on("error", reject);
        res.on("end", () =>
          resolve({
            bytes: Buffer.concat(parts),
            type: String(res.headers["content-type"] || "")
              .split(";")[0]
              .toLowerCase(),
          }),
        );
      },
    );
    const timer = setTimeout(
      () => req.destroy(Error("asset_timeout")),
      timeout,
    );
    req.on("close", () => clearTimeout(timer));
    req.on("error", reject);
    req.end();
  });
}
export function createAssetLoader({ resolve, transport = requestAsset } = {}) {
  const cache = new Map();
  let total = 0;
  const consume = (n) => {
    total += n;
    if (total > 10_000_000) throw Error("asset_budget");
  };
  return async function asset(value, kind = "image") {
    if (cache.has(value)) return cache.get(value);
    if (cache.size >= 12) throw Error("asset_count");
    const task = (async () => {
      let current = value;
      for (let redirects = 0; redirects < 4; redirects++) {
        const target = await assetTarget(current, resolve);
        const result = await transport(target, {
          maxBytes: kind === "font" ? 2_000_000 : 5_000_000,
          consume,
        });
        if (result.redirect) {
          current = new URL(result.redirect, current).href;
          continue;
        }
        if (
          !result.bytes?.length ||
          result.bytes.length > (kind === "font" ? 2_000_000 : 5_000_000)
        )
          throw Error("invalid_asset");
        const allowed =
          kind === "font"
            ? /^(font\/(woff2?|ttf|otf)|application\/(font-woff|x-font-ttf|vnd\.ms-fontobject))$/
            : /^image\/(png|jpeg|webp|gif|avif|svg\+xml)$/;
        if (!allowed.test(result.type)) throw Error("unsupported_asset_type");
        return result;
      }
      throw Error("asset_redirect_limit");
    })();
    cache.set(value, task);
    return task;
  };
}
