import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Le modèle de page est dans page/index.html, le code dans src/.
// « npm run build » produit tout le site en un seul fichier : dist/index.html
// (recopié ensuite à la racine du dépôt par la publication automatique).
// Version de la page = commit publié (GitHub Actions) ; l'app compare la sienne à celle
// en ligne pour proposer de recharger quand une nouvelle version est sortie.
const VERSION = (process.env.GITHUB_SHA || "dev").slice(0, 7);
const metaVersion = {
  name: "vision-version",
  transformIndexHtml: (html) =>
    html.replace("</head>", `  <meta name="vision-version" content="${VERSION}" />\n  </head>`),
};

export default defineConfig({
  root: "page",
  base: "./",
  publicDir: false,
  plugins: [react(), viteSingleFile(), metaVersion],
  define: { __VISION_VERSION__: JSON.stringify(VERSION) },
  server: { fs: { allow: [".."] } },
  build: { outDir: "../dist", emptyOutDir: true, chunkSizeWarningLimit: 4000 },
});
