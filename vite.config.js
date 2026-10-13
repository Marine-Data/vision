import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Le modèle de page est dans page/index.html, le code dans src/.
// « npm run build » produit tout le site en un seul fichier : dist/index.html
// (recopié ensuite à la racine du dépôt par la publication automatique).
export default defineConfig({
  root: "page",
  base: "./",
  publicDir: false,
  plugins: [react(), viteSingleFile()],
  server: { fs: { allow: [".."] } },
  build: { outDir: "../dist", emptyOutDir: true, chunkSizeWarningLimit: 4000 },
});
