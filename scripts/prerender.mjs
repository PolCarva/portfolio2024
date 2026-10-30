import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { render } from "../.prerender/entry-server.js";

const origin = "https://www.pablocarvalho.dev";
const template = await readFile("dist/index.html", "utf8");
const localized = {
  en: {
    title: "Pablo Carvalho — Full Stack & Creative Technology",
    description:
      "Full stack developer, Multimedia Design graduate and lecturer. Web and mobile products, applied AI and interactive experiments from Montevideo, Uruguay.",
    social:
      "Useful digital products. Unexpected ideas. Code, design and applied AI.",
    locale: "en_US",
    path: "/",
  },
  es: {
    title: "Pablo Carvalho — Desarrollo Full Stack y Tecnología Creativa",
    description:
      "Desarrollador full stack, licenciado en Diseño Multimedia y docente. Productos web y móviles, IA aplicada y experimentos interactivos desde Montevideo.",
    social:
      "Productos útiles. Ideas inesperadas. Código, diseño e IA aplicada.",
    locale: "es_UY",
    path: "/es/",
  },
};
const escape = (value) =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
for (const [language, data] of Object.entries(localized)) {
  const url = origin + data.path;
  const meta = [
    `<title>${escape(data.title)}</title>`,
    `<meta name="description" content="${escape(data.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" hreflang="en" href="${origin}/" />`,
    `<link rel="alternate" hreflang="es" href="${origin}/es/" />`,
    `<link rel="alternate" hreflang="x-default" href="${origin}/" />`,
    ...Object.entries({
      title: data.title,
      description: data.social,
      type: "website",
      url,
      image: origin + "/og/portfolio-v2.png",
      "image:secure_url": origin + "/og/portfolio-v2.png",
      "image:type": "image/png",
      "image:width": "1200",
      "image:height": "630",
      "image:alt":
        "Pablo Carvalho — Creative technology and useful digital products",
      site_name: "Pablo Carvalho",
      locale: data.locale,
      "locale:alternate": language === "en" ? "es_UY" : "en_US",
    }).map(
      ([key, value]) =>
        `<meta property="og:${key}" content="${escape(value)}" />`,
    ),
    ...Object.entries({
      card: "summary_large_image",
      title: data.title,
      description: data.social,
      image: origin + "/og/portfolio-v2.png",
      "image:alt":
        "Pablo Carvalho — Creative technology and useful digital products",
    }).map(
      ([key, value]) =>
        `<meta name="twitter:${key}" content="${escape(value)}" />`,
    ),
    `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "Person", name: "Pablo Carvalho", url: origin, jobTitle: "Full Stack Developer", description: data.description, sameAs: ["https://github.com/PolCarva", "https://www.linkedin.com/in/pablo-carvalho-gimenez/"], alumniOf: { "@type": "CollegeOrUniversity", name: "Universidad ORT Uruguay" } }).replaceAll("<", "\\u003c")}</script>`,
  ].join("\n");
  const html = template
    .replace('lang="en"', `lang="${language}"`)
    .replace(/<!-- SEO_START -->[\s\S]*?<!-- SEO_END -->/, meta)
    .replace("<!--app-html-->", render(language));
  const dir = language === "en" ? "dist" : "dist/es";
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/index.html`, html);
}
await rm(".prerender", { recursive: true });
console.log("Prerendered English and Spanish pages.");
