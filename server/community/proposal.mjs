import { validateScene } from "../../shared/community-scene.mjs";
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
    generated = validateScene(proposal.scene);
  const next = { ...base };
  for (const field of proposal.changedFields)
    if (visualFields.includes(field)) next[field] = generated[field];
  void prompt;
  return validateScene(next);
}
