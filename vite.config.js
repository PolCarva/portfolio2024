import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2022",
    modulePreload: { polyfill: false },
    minify: "terser",
    terserOptions: {
      ecma: 2022,
      safari10: false,
      compress: { passes: 5 },
      format: {
        comments: /Third-party licenses/,
      },
    },
    rollupOptions: {
      output: {
        banner: (chunk) =>
          Object.keys(chunk.modules).some((id) =>
            /node_modules\/(react|react-dom|scheduler)\//.test(id),
          )
            ? "/*! Third-party licenses: /THIRD_PARTY_LICENSES.txt */"
            : "",
      },
    },
  },
  server: { proxy: { "/api": "http://127.0.0.1:4317" } },
});
