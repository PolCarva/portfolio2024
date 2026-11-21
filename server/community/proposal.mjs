import { validateScene, sceneSchema } from "../../shared/community-scene.mjs";
export const visualFields = [
  "palette",
  "font",
  "layout",
  "spacing",
  "corners",
  "background",
  "drawing",
  "drawingTargets",
  "nodes",
  "theme",
  "composition",
  "program",
];
export function scopedProposal(current, proposal, prompt) {
  const base = validateScene(current),
    generated = sceneSchema.partial().parse(proposal.scene);
  const next = { ...base };
  for (const field of proposal.changedFields)
    if (visualFields.includes(field)) {
      if (!Object.hasOwn(proposal.scene, field))
        throw new Error("Missing modified field");
      next[field] = generated[field];
    }
  void prompt;
  return validateScene(next);
}
