import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Local: sibling ../circahue-widget. CI: checked out at ./circahue-widget.
function widgetRoot(): string {
  const candidates = [
    fileURLToPath(new URL("./circahue-widget", import.meta.url)),
    fileURLToPath(new URL("../circahue-widget", import.meta.url)),
  ];
  const found = candidates.find((dir) => existsSync(dir));
  if (!found) {
    throw new Error(
      "circahue-widget not found. Clone https://github.com/circahue/widget next to this repo (or into ./circahue-widget).",
    );
  }
  return found;
}

const widget = widgetRoot();

// GITHUB_PAGES=1 npm run build:demo → base /circahue/ for project Pages
const pages = process.env.GITHUB_PAGES === "1" || process.env.GITHUB_PAGES === "true";

export default defineConfig({
  root: "dev",
  base: pages ? "/circahue/" : "/",
  resolve: {
    alias: [
      { find: "@circahue/widget/sky.css", replacement: `${widget}/src/sky.css` },
      { find: "@circahue/widget", replacement: `${widget}/src/index.ts` },
      {
        find: "@igrs/circahue",
        replacement: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
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
