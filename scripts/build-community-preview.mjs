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
await build({
  entryPoints: ["src/community/embedded-main.jsx"],
  bundle: true,
  platform: "browser",
  format: "esm",
  target: "es2022",
  outfile: ".generated/community-embedded.js",
  loader: { ".css": "empty" },
  jsx: "automatic",
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
});
