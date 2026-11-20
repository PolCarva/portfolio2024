import { readObject } from "../storage.mjs";
import { defaults } from "../schema.mjs";
import { problem } from "./state.mjs";
export async function ensureDrawingTarget(zone) {
  if (!zone?.startsWith("project:")) return;
  const object = await readObject("content/current.json");
  const content = object ? JSON.parse(object.bytes).content : defaults;
  if (
    !content.projects.some(
      (project) => project.id === zone.slice(8) && !project.hidden,
    )
  )
    throw problem(400, "invalid");
}
