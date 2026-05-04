import { defineConfig } from "vite";
import path from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const SRC_ALIASES = ["core", "ui", "utils", "features", "theming"];

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: "src/main.ts",
      output: {
        entryFileNames: "module.js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) return "styles/components.css";
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
  resolve: {
    alias: Object.fromEntries(
      SRC_ALIASES.map((name) => [`@${name}`, path.resolve(__dirname, `src/${name}`)]),
    ),
  },
});
