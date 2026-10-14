import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { IMG_ICONE } from "./assets/images.js";
import { GardeErreur } from "./components/GardeErreur.js";
import { enregistrerServiceWorker } from "./lib/notifications.js";
import { affichageDemarrage } from "./lib/affichage.js";

affichageDemarrage();

export function definirIcone(t) {
  let e = document.querySelector(`link[rel="${t}"]`);
  e || ((e = document.createElement("link")), (e.rel = t), document.head.appendChild(e)),
    (e.href = IMG_ICONE);
}

definirIcone("icon");

definirIcone("apple-touch-icon");

// Installation sur l'écran d'accueil + notifications (fichiers à la racine du site).
if (!document.querySelector('link[rel="manifest"]')) {
  const m = document.createElement("link");
  (m.rel = "manifest"), (m.href = "manifest.webmanifest"), document.head.appendChild(m);
}
[
  ["apple-mobile-web-app-capable", "yes"],
  ["mobile-web-app-capable", "yes"],
  ["apple-mobile-web-app-title", "Vision"],
].forEach(([n, c]) => {
  const e = document.createElement("meta");
  (e.name = n), (e.content = c), document.head.appendChild(e);
});
enregistrerServiceWorker();

createRoot(document.getElementById("root")).render(
  React.createElement(GardeErreur, null, React.createElement(App)),
);
