import { validateScene } from "../../shared/community-scene.mjs";
export const visualFields = [
  "palette",
  "font",
  "layout",
  "spacing",
  "corners",
  "background",
  "drawing",
  "nodes",
  "theme",
  "composition",
  "program",
];
export function scopedProposal(current, proposal, prompt) {
  const base = validateScene(current),
    generated = validateScene(proposal.scene);
  const cursorRequest = /\b(cursor|mouse|puntero|ratón|raton)\b/i.test(prompt);
  const otherDesign =
    /(paleta|fondo|background|tipograf|tarjeta|layout|column|rediseñ|estética|whole|theme)/i.test(
      prompt,
    );
  const fields =
    cursorRequest && !otherDesign ? ["program"] : proposal.changedFields;
  const next = { ...base };
  for (const field of fields)
    if (visualFields.includes(field)) next[field] = generated[field];
  const result = validateScene(next);
  // An unrelated restyle must never masquerade as implementing a cursor request.
  if (cursorRequest && !result.program)
    throw Object.assign(new Error("Unsupported interactive change"), {
      code: "unsupported",
    });
  return result;
}
