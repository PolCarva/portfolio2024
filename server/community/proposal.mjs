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
  const drawingRequest = /dibuj|draw|pint|sketch/i.test(prompt);
  const cursorRequest =
    !drawingRequest &&
    (/\b(cursor|puntero)\b/i.test(prompt) ||
      (/\b(mouse|ratón|raton)\b/i.test(prompt) &&
        /burbuj|bubble|rastro|trail|part[ií]cul|efecto|effect|seguir|follow/i.test(
          prompt,
        )));
  const otherDesign =
    /(paleta|fondo|background|tipograf|tarjeta|layout|column|rediseñ|estética|whole|theme)/i.test(
      prompt,
    );
  const imageToolRequest =
    drawingRequest &&
    /perfil|profile|portrait|hero|im[aá]gen|image|foto|photo/i.test(prompt) &&
    /se pued|permit|habilit|activ|enable|allow|can draw/i.test(prompt);
  const fields =
    cursorRequest && !otherDesign
      ? ["program"]
      : imageToolRequest && !otherDesign
        ? ["drawing", "drawingTargets"]
        : proposal.changedFields;
  const next = { ...base };
  for (const field of fields)
    if (visualFields.includes(field)) next[field] = generated[field];
  const result = validateScene(next);
  // An unrelated restyle must never masquerade as implementing a cursor request.
  if (cursorRequest && !result.program)
    throw Object.assign(new Error("Unsupported interactive change"), {
      code: "unsupported",
    });
  const wantsDrawing = /dibuj|draw/i.test(prompt),
    portrait = /perfil|profile|portrait|hero/i.test(prompt),
    images = /im[aá]gen|image|foto|photo/i.test(prompt);
  if (wantsDrawing && (portrait || images)) {
    const targets = result.drawingTargets || [];
    const missing = portrait
      ? !targets.includes("portrait")
      : !targets.includes("portrait") || !targets.includes("projects");
    if (missing)
      throw Object.assign(
        new Error("Requested image drawing surface is not enabled"),
        {
          code: "quality",
          issues: [
            portrait
              ? "enable_portrait_drawing_target"
              : "enable_portrait_and_project_drawing_targets",
          ],
        },
      );
    if (
      portrait &&
      /solo|only/i.test(prompt) &&
      (result.drawing || targets.some((t) => t !== "portrait"))
    )
      throw Object.assign(new Error("Only the portrait was requested"), {
        code: "quality",
        issues: ["enable_only_portrait_drawing_disable_band_controls"],
      });
  }
  return result;
}
