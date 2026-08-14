import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// GITHUB_PAGES=1 npm run build:demo → base /circahue/ for project Pages
const pages = process.env.GITHUB_PAGES === "1" || process.env.GITHUB_PAGES === "true";

export default defineConfig({
  root: "dev",
  base: pages ? "/circahue/" : "/",
  resolve: {
    alias: [
      {
        find: "@circahue/widget/sky.css",
        replacement: fileURLToPath(new URL("../circahue-widget/src/sky.css", import.meta.url)),
      },
      {
        find: "@circahue/widget",
        replacement: fileURLToPath(new URL("../circahue-widget/src/index.ts", import.meta.url)),
      },
    ],
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: "../site",
    emptyOutDir: true,
    sourcemap: true,
  },
});
