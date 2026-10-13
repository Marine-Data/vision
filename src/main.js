import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { IMG_ICONE } from "./assets/images.js";
import { GardeErreur } from "./components/GardeErreur.js";

export function definirIcone(t) {
  let e = document.querySelector(`link[rel="${t}"]`);
  e || ((e = document.createElement("link")), (e.rel = t), document.head.appendChild(e)),
    (e.href = IMG_ICONE);
}

definirIcone("icon");

definirIcone("apple-touch-icon");

createRoot(document.getElementById("root")).render(
  React.createElement(GardeErreur, null, React.createElement(App)),
);
