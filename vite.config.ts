import { defineConfig } from "vite";

export default defineConfig({
  root: "dev",
  server: {
    port: 5173,
    open: true,
  },
  // resolve library sources from ../src during playground
  resolve: {
    alias: {
      // imports use relative ../src — no alias needed
    },
  },
});
