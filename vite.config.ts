import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Local: sibling ../chronohue-widget. CI: checked out at ./chronohue-widget.
function widgetRoot(): string {
  const candidates = [
    fileURLToPath(new URL("./chronohue-widget", import.meta.url)),
    fileURLToPath(new URL("../chronohue-widget", import.meta.url)),
  ];
  const found = candidates.find((dir) => existsSync(dir));
  if (!found) {
    throw new Error(
      "chronohue-widget not found. Clone https://github.com/chronohue/widget next to this repo (or into ./chronohue-widget).",
    );
  }
  return found;
}

const widget = widgetRoot();

// GITHUB_PAGES=1 npm run build:demo → base /chronohue/ for project Pages
const pages = process.env.GITHUB_PAGES === "1" || process.env.GITHUB_PAGES === "true";

export default defineConfig({
  root: "dev",
  base: pages ? "/chronohue/" : "/",
  resolve: {
    alias: [
      { find: "@chronohue/widget/sky.css", replacement: `${widget}/src/sky.css` },
      { find: "@chronohue/widget", replacement: `${widget}/src/index.ts` },
      {
        find: "chronohue",
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
