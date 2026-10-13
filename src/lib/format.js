import { VISION_CONFIG } from "../config.js";
import { CAT_ICONES, PARAMS_DEFAUT } from "../data/contenu.js";
import { statutLibelle } from "./calculs.js";
import { MOIS } from "./mois.js";

export const num = (t) => Number(t) || 0;

export const param = (t, e, r = 0) => {
  const n = (t || []).find((s) => s.param_key === e);
  return n ? num(n.montant) : r;
};

export const paramDefaut = (t) => {
  const e = PARAMS_DEFAUT.find((r) => r.param_key === t);
  return e ? e.montant : 0;
};

export const paramOuDefaut = (t, e) => param(t, e, paramDefaut(e));

export const totalParType = (t, e) =>
  (t || []).filter((r) => r.kind === e).reduce((r, n) => r + num(n.montant), 0);

export const estLigneVacances = (t) => t.line_key === "e_vacances" || /vacances/i.test(t.poste || "");

export const epargneHorsVacances = (t) =>
  (t || [])
    .filter((e) => e.kind === "epargne" && !estLigneVacances(e))
    .reduce((e, r) => e + num(r.montant), 0);

export const montantVacances = (t) => {
  const e = (t || []).find(estLigneVacances);
  return e ? num(e.montant) : 0;
};

export function relevesLivrets(t, e = MOIS.length) {
  return Array.from(
    {
      length: e,
    },
    (r, n) => {
      const s = (t || []).find((i) => i.param_key === "reel_" + n);
      return s && s.montant !== "" && s.montant != null ? Number(s.montant) : null;
    },
  );
}

export const releveDuMois = (t, e) => {
  const r = (t || []).find((n) => n.param_key === "reel_" + e);
  return r && r.montant != null ? r.montant : "";
};

export const eurosCourt = (t) =>
  new Intl.NumberFormat(VISION_CONFIG.locale, {
    maximumFractionDigits: 0,
  }).format(Math.round(t)) +
  " " +
  VISION_CONFIG.devise;

export const fonctionZv = (t) => {
  const e = PARAMS_DEFAUT.find((r) => r.param_key === t);
  return e ? e.montant : 0;
};
// Contenu de départ d'un nouvel utilisateur : recopié depuis les listes
// historiques. Une fois en base, c'est la base qui fait foi et l'utilisateur
// peut tout modifier depuis l'app.

export const eurosEntiers = (t) =>
  new Intl.NumberFormat(VISION_CONFIG.locale, {
    maximumFractionDigits: 0,
  }).format(Math.round(t)) +
  " " +
  VISION_CONFIG.devise;

export const nombreEntier = (t) =>
  new Intl.NumberFormat(VISION_CONFIG.locale, {
    maximumFractionDigits: 0,
  }).format(Math.round(t));

// Icône d'un poste : celle choisie par l'utilisatrice (vision_budget.icone), sinon déduite du nom.
let ICONES_CHOISIES = new Map();
export function set_ICONES(budget) {
  ICONES_CHOISIES = new Map((budget || []).filter((b) => b.icone).map((b) => [b.poste, b.icone]));
}
export function catIcone(poste) {
  if (ICONES_CHOISIES.has(poste)) return ICONES_CHOISIES.get(poste);
  const t = CAT_ICONES.find(([r]) => r.test(poste || ""));
  return t ? t[1] : "•";
}

export function euros(n) {
  return (
    (Math.round(Number(n) * 100) / 100).toLocaleString(VISION_CONFIG.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) +
    " " +
    VISION_CONFIG.devise
  );
}

export function auditValeur(champ, v) {
  if (v == null || v === "") return "—";
  if (champ === "statut") return statutLibelle(v);
  if (champ === "paid") return v === "true" ? "payé" : "non payé";
  if (champ === "mois_index") return MOIS[num(v)] || v;
  if (champ === "montant_prevu" || champ === "montant_reel" || champ === "montant") return eurosCourt(num(v));
  return v;
}

export function hwkFmt(d) {
  if (!d) return "—";
  const p = String(d).split("-");
  return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : d;
}

export function hwkLate(d, st) {
  if (!d || st === "Fait" || st === "Corrigé") return !1;
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  return new Date(d + "T00:00:00") < n;
}

// Coche / décoche un devoir (utilisé par l'Aperçu ET l'onglet Devoirs → même état, même sauvegarde)
