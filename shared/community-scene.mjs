import { z } from "zod";
import { originalScene, palettes, brushColors } from "./community-catalog.mjs";
export {
  originalScene,
  palettes,
  sceneAttributes,
} from "./community-catalog.mjs";
export const pointSchema = z
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
      "stroke",
    ]),
    x: z.number().min(5).max(95),
    y: z.number().min(10).max(90),
    size: z.number().min(4).max(80),
    rotation: z.number().min(-180).max(180),
    color: z.enum([
      "ink",
      "accent",
      "muted",
      "paper",
      "red",
      "blue",
      "green",
      "violet",
      "gold",
    ]),
    strokeWidth: z.number().min(1).max(12).default(3),
    opacity: z.number().min(0.15).max(1),
    motion: z.enum(["none", "float", "orbit", "bounce", "pointer"]),
    points: z.array(pointSchema).max(64),
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
  if (
    scene.nodes.some((n) =>
      n.shape === "stroke"
        ? n.points.length < 2
        : n.shape !== "curve" && n.points.length > 0,
    )
  )
    throw new Error("Invalid stroke geometry");
  if (JSON.stringify(scene).length > 80000)
    throw new Error("Scene is too large");
  // Public identifiers are assigned here, never authored by the visitor/model.
  return {
    ...scene,
    nodes: scene.nodes.map((node, index) => ({ ...node, id: "n" + index })),
  };
}

export const drawingSchema = z
  .object({
    zone: z.enum(["hero", "work", "contact"]),
    strokes: z
      .array(
        z
          .object({
            points: z.array(pointSchema).min(2).max(64),
            color: z.enum(Object.keys(brushColors)),
            width: z.number().int().min(1).max(12),
          })
          .strict(),
      )
      .min(1)
      .max(12),
  })
  .strict();
export function applyDrawing(scene, drawing) {
  const d = drawingSchema.parse(drawing);
  return validateScene({
    ...scene,
    drawing: true,
    nodes: [
      ...scene.nodes,
      ...d.strokes.map((s, i) => ({
        id: "drawing-" + i,
        zone: d.zone,
        shape: "stroke",
        x: 50,
        y: 50,
        size: 4,
        rotation: 0,
        color: s.color,
        strokeWidth: s.width,
        opacity: 1,
        motion: "none",
        points: s.points,
      })),
    ],
  });
}
