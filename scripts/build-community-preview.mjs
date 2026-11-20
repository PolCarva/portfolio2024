import { build } from "esbuild";
await build({
  entryPoints: ["src/community/preview-entry.jsx"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: ".generated/community-preview.mjs",
  loader: { ".css": "empty" },
  jsx: "automatic",
  external: ["react", "react-dom", "react-dom/server"],
});
