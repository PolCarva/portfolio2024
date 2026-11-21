import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export async function pageSource(content, scene) {
  const { renderPreview } = await import(
    pathToFileURL(resolve(".generated/community-preview.mjs")).href
  );
  const css = (
    await Promise.all(
      [
        "src/index.css",
        "src/project-artwork.css",
        "src/community/community.css",
      ].map((file) => readFile(resolve(file), "utf8")),
    )
  ).join("\n");
  return {
    html: renderPreview(content, { ...scene, program: null }, "es", {
      editableSource: true,
    }),
    css,
    runtime:
      "A real React portfolio, including its actual drawing controls, runs in one editable document. All selectors in this HTML are live. HTML is initial DOM context, not an image. Current program.css/javascript is reapplied after mounting. Use exact selectors from this source. community.React and community.createRoot support new React widgets without external imports. Public changes persist as the shared version and automatically load for every visitor.",
  };
}
