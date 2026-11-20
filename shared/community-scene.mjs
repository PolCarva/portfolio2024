import { z } from "zod";
import { originalScene, palettes } from "./community-catalog.mjs";
export {
  originalScene,
  palettes,
  sceneAttributes,
} from "./community-catalog.mjs";
const point = z
  .object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) })
  .strict();
export const nodeSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,24}$/),
    zone: z.enum(["hero", "work", "contact"]),
    shape: z.enum([
      "circle",
      "ellipse",
      "square",
      "star",
      "ring",
      "line",
      "curve",
    ]),
    x: z.number().min(5).max(95),
    y: z.number().min(10).max(90),
    size: z.number().min(4).max(80),
    rotation: z.number().min(-180).max(180),
    color: z.enum(["ink", "accent", "muted", "paper"]),
    opacity: z.number().min(0.15).max(1),
    motion: z.enum(["none", "float", "orbit", "bounce", "pointer"]),
    points: z.array(point).max(16),
  })
  .strict();
export const sceneSchema = z
  .object({
    version: z.literal(1),
    palette: z.enum(Object.keys(palettes)),
    font: z.enum(["original", "editorial", "mono"]),
    layout: z.enum(["original", "aligned", "gallery"]),
    spacing: z.enum(["original", "airy", "compact"]),
    corners: z.enum(["original", "rounded", "cut"]),
    background: z.enum(["plain", "grid", "dots", "stars"]),
    drawing: z.boolean(),
    nodes: z.array(nodeSchema).max(200),
  })
  .strict();
export function validateScene(input) {
  const scene = sceneSchema.parse(input);
  if (new Set(scene.nodes.map((n) => n.id)).size !== scene.nodes.length)
    throw new Error("Repeated visual identifiers");
  if (scene.nodes.filter((n) => n.motion !== "none").length > 20)
    throw new Error("Too many animated elements");
  if (scene.nodes.some((n) => n.shape === "curve" && n.points.length !== 4))
    throw new Error("Curves need four points");
  if (JSON.stringify(scene).length > 80000)
    throw new Error("Scene is too large");
  return scene;
}
