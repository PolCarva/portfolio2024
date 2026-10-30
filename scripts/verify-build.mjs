import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";

for (const [path, language, heading] of [
  ["dist/index.html", "en", "Useful products."],
  ["dist/es/index.html", "es", "Productos útiles."],
]) {
  const html = await readFile(path, "utf8");
  assert(
    html.includes(`lang="${language}"`),
    `Wrong document language in ${path}`,
  );
  assert(
    html.includes(heading) &&
      html.includes("GoPersonal") &&
      html.includes("Universidad ORT Uruguay"),
    `Missing prerendered content in ${path}`,
  );
  assert.equal(
    (html.match(/<h1[ >]/g) || []).length,
    1,
    "A page must have exactly one h1",
  );
  assert(
    html.includes("https://www.pablocarvalho.dev/og/portfolio-v2.png"),
    "OG image must be hosted on the portfolio",
  );
  assert(
    html.includes("og:image:width") &&
      html.includes("og:image:height") &&
      html.includes("twitter:card"),
    "Social metadata is incomplete",
  );
  assert(
    html.includes('hreflang="es"') && html.includes('hreflang="en"'),
    "Missing alternate language pages",
  );
  assert(
    !html.includes("opengraph.b-cdn.net") &&
      !html.includes("pablocarvalho.vercel.app"),
    "Stale preview URL",
  );
  assert(
    !html.includes("<!--app-html-->"),
    "Server-render placeholder remains",
  );
  assert(
    html.includes("/cv/Pablo_Carvalho_EN.pdf") &&
      html.includes("/cv/Pablo_Carvalho_ES.pdf"),
    "Both CVs must be downloadable",
  );
  const paths = [
    ...html.matchAll(
      /(?:src|href)="(\/(?:images|fonts|cv|og|assets)\/[^"?#]+)"/g,
    ),
  ].map((match) => match[1]);
  for (const asset of new Set(paths)) await stat(`dist${asset}`);
}
const png = await readFile("dist/og/portfolio-v2.png");
assert.equal(png.readUInt32BE(16), 1200, "OG width");
assert.equal(png.readUInt32BE(20), 630, "OG height");
for (const language of ["EN", "ES"]) {
  const pdf = await readFile(`dist/cv/Pablo_Carvalho_${language}.pdf`);
  assert(pdf.subarray(0, 5).toString() === "%PDF-", "Invalid resume file");
}
const javascript = (await readdir("dist/assets")).filter((file) =>
  file.endsWith(".js"),
);
let total = 0;
for (const file of javascript) {
  const bytes = await readFile(`dist/assets/${file}`);
  total += bytes.length;
  console.log(
    `${file}: ${bytes.length.toLocaleString()} bytes / gzip ${gzipSync(bytes).length.toLocaleString()} bytes`,
  );
}
assert(total < 230000, `JavaScript budget exceeded: ${total}`);
console.log(
  "Build verified: prerendered EN/ES, local assets, social metadata, OG dimensions and both CVs.",
);
