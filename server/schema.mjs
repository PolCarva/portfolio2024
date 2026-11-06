import { z } from "zod";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
export const defaults = require("../src/content-defaults.json");
const text = z.string().max(12000);
const url = z
  .string()
  .max(2048)
  .refine(
    (v) =>
      /^\/(?!\/)[^\s\\]*$/.test(v) ||
      (/^https:\/\//.test(v) &&
        (() => {
          try {
            const u = new URL(v);
            return !u.username && !u.password;
          } catch {
            return false;
          }
        })()),
    "Usá una URL https o una ruta del sitio.",
  );
const key = z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/);
function shape(value) {
  if (typeof value === "string") return text;
  if (Array.isArray(value)) return z.array(shape(value[0])).max(80);
  return z
    .object(
      Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)])),
    )
    .strict();
}
const localizedProject = z
  .object({ title: text.min(1), label: text, text, alt: text })
  .strict();
const download = z
  .object({ href: url, en: text.min(1), es: text.min(1) })
  .strict();
export const projectSchema = z
  .object({
    id: key,
    anchor: key.optional(),
    year: z.string().max(20),
    kind: z.enum(["image", "tv", "youtube"]),
    image: z.union([url, z.literal("")]).optional(),
    href: url,
    tags: z.array(z.string().max(100)).max(20),
    tagsEs: z.array(z.string().max(100)).max(20).optional(),
    downloads: z.array(download).max(10).optional(),
    en: localizedProject,
    es: localizedProject,
    hidden: z.boolean().optional(),
  })
  .strict()
  .refine((p) => p.kind !== "image" || !!p.image, {
    message: "El proyecto necesita una imagen.",
    path: ["image"],
  });
export const contentSchema = z
  .object({
    copy: z
      .object(
        Object.fromEntries(
          ["es", "en"].map((lang) => [
            lang,
            shape(defaults.copy[lang]).extend({
              nav: z.array(text).length(4),
              hero: z.array(text).length(2),
              aboutTitle: z.array(text).length(2),
              contactTitle: z.array(text).length(2),
              capabilities: z.array(z.tuple([text, text, text])).max(30),
            }),
          ]),
        ),
      )
      .strict(),
    links: z
      .object({
        email: z.email(),
        linkedin: url,
        github: url,
        whatsapp: url,
        tv: url,
        tvAppStore: url,
        tvApk: url,
        youtube: url,
      })
      .strict(),
    projects: z
      .array(projectSchema)
      .max(60)
      .refine(
        (p) => new Set(p.map((i) => i.id)).size === p.length,
        "Los identificadores deben ser únicos.",
      )
      .refine((p) => {
        const ids = p.map((i) => i.anchor || i.id);
        return (
          new Set(ids).size === ids.length &&
          !ids.some((id) =>
            [
              "top",
              "main",
              "work",
              "about",
              "experience",
              "contact",
              "navigation",
              "hero-title",
              "work-title",
              "about-title",
              "experience-title",
              "contact-title",
            ].includes(id),
          )
        );
      }, "Hay anclas repetidas o reservadas."),
    clientProjects: z
      .array(
        shape(defaults.clientProjects[0]).extend({ image: url, href: url }),
      )
      .max(60),
    media: z.object({ portrait: url, cvEN: url, cvES: url }).strict(),
  })
  .strict();
export function validateContent(input) {
  return contentSchema.parse(input);
}
