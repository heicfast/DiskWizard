import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  // DiskGenie parity: fixed port, strict, and HMR websocket over the same
  // port so the Tauri devUrl contract stays stable.
  server: {
    port: 1430,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    target: "chrome105",
    minify: "esbuild",
    sourcemap: false,
  },
  envPrefix: ["VITE_", "TAURI_ENV_"],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
