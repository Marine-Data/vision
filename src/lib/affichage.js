// Taille du texte et thème (clair / sombre / auto).
// Réglages enregistrés dans le compte (vision_params, valeurs numériques) :
//   affichage_taille : 1 petit · 2 normal · 3 grand
//   affichage_theme  : 1 clair · 2 sombre · 3 auto (suit le téléphone)
// Copie dans le navigateur pour appliquer dès l'ouverture, sans flash.

export const TAILLES = [
  [1, "Petit", 0.9],
  [2, "Normal", 1],
  [3, "Grand", 1.15],
];
export const THEMES = [
  [1, "☀️ Clair"],
  [2, "🌙 Sombre"],
  [3, "Auto"],
];
const CLE = "vision_affichage";
let courant = { taille: 2, theme: 1 };
let ecoute = null;

function sombreSysteme() {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch (e) {
    return false;
  }
}

function poser() {
  const html = document.documentElement;
  const sombre = courant.theme === 2 || (courant.theme === 3 && sombreSysteme());
  html.dataset.theme = sombre ? "sombre" : "clair";
  html.style.background = "";
  const z = (TAILLES.find((t) => t[0] === courant.taille) || TAILLES[1])[2];
  html.style.zoom = z === 1 ? "" : String(z);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", sombre ? "#0b5f6a" : "#0e3a42");
}

export function appliquerAffichage(taille, theme) {
  courant = {
    taille: [1, 2, 3].includes(Number(taille)) ? Number(taille) : 2,
    theme: [1, 2, 3].includes(Number(theme)) ? Number(theme) : 1,
  };
  try {
    localStorage.setItem(CLE, JSON.stringify(courant));
  } catch (e) {}
  if (!ecoute) {
    try {
      ecoute = window.matchMedia("(prefers-color-scheme: dark)");
      ecoute.addEventListener("change", () => courant.theme === 3 && poser());
    } catch (e) {}
  }
  poser();
}

// Au démarrage : reprend la dernière valeur connue sur ce téléphone.
export function affichageDemarrage() {
  let v = null;
  try {
    v = JSON.parse(localStorage.getItem(CLE) || "null");
  } catch (e) {}
  appliquerAffichage(v && v.taille, v && v.theme);
}

// Depuis les réglages du compte (prioritaires sur la copie locale).
export function affichageDepuisParams(params) {
  const lire = (k) => {
    const p = (params || []).find((x) => x.param_key === k);
    return p ? Number(p.montant) : null;
  };
  const t = lire("affichage_taille"),
    th = lire("affichage_theme");
  if (t == null && th == null) return;
  appliquerAffichage(t ?? courant.taille, th ?? courant.theme);
}
