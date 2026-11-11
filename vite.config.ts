import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  publicDir: false, // public フォルダの自動コピーを無効化
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        { src: "src/config/config.html", dest: "html" },
        { src: "src/manifest.json", dest: "" },
        { src: "public/icon.png", dest: "image" },
      ],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        config: resolve(__dirname, "src/config/config.tsx"),
        plugin: resolve(__dirname, "src/plugin/plugin.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "config") return "js/config.js";
          if (chunkInfo.name === "plugin") return "js/plugin.js";
          return "js/[name].js";
        },
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] || "";
          if (name === "config.css") return "css/[name][extname]";
          return "[name][extname]";
        },
      },
    },
    outDir: "dist/plugin",
    emptyOutDir: true,
  },
});
