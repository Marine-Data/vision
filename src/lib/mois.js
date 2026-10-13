import { VISION_CONFIG } from "../config.js";
import { num } from "./format.js";

export const // ---------------------------------------------------------------
  // Horizon des mois (ve) — généré, plus écrit en dur.
  // ANCRE = mois 0 = mois_index 0 dans Supabase. NE JAMAIS LA CHANGER :
  // tous les mois_index enregistrés (dépenses, items, clôtures) sont
  // comptés à partir d'elle. La changer décalerait tout l'historique.
  // L'horizon s'étend tout seul pour garder au moins HORIZON_AVANCE
  // mois devant le mois courant, donc l'app ne "sort pas du tableau"
  // en janvier 2028 comme avec l'ancienne liste figée de 17 mois.
  // ---------------------------------------------------------------
  VISION_ANCRE = VISION_CONFIG.ancre;

export const VISION_HORIZON_MIN = VISION_CONFIG.horizon.min;

export const VISION_HORIZON_AVANCE = VISION_CONFIG.horizon.avance;

export const VISION_HORIZON_MAX = VISION_CONFIG.horizon.max;

export const VISION_MOIS_COURTS = [
  "Jan",
  "Fév",
  "Mars",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

export const moisDepuisAncre = (dt) =>
  (dt.getFullYear() - VISION_ANCRE.annee) * 12 + (dt.getMonth() - VISION_ANCRE.mois);

export const MOIS = (() => {
  const ecoule = moisDepuisAncre(new Date());
  let n = Math.max(VISION_HORIZON_MIN, ecoule + VISION_HORIZON_AVANCE + 1);
  n = Math.min(VISION_HORIZON_MAX, Math.max(1, n));
  const out = [],
    vus = {};
  for (let i = 0; i < n; i++) {
    const m = (VISION_ANCRE.mois + i) % 12,
      an = VISION_ANCRE.annee + Math.floor((VISION_ANCRE.mois + i) / 12),
      nom = VISION_MOIS_COURTS[m],
      // année affichée au 1er mois, en janvier, et dès qu'un nom de
      // mois se répète — c'est la règle de l'ancienne liste figée
      avecAnnee = i === 0 || m === 0 || vus[nom];
    (vus[nom] = !0), out.push(avecAnnee ? nom + " " + String(an).slice(-2) : nom);
  }
  return out;
})();

export function moisNow() {
  // Index du mois courant dans ve, borné au tableau (jamais hors limites).
  return Math.min(MOIS.length - 1, Math.max(0, moisDepuisAncre(new Date())));
}

export function joursAvant(t) {
  const e = new Date(t + "T00:00:00"),
    r = new Date();
  return r.setHours(0, 0, 0, 0), Math.round((e - r) / 864e5);
}

export function libelleDelai(t) {
  return t === 0
    ? "aujourd'hui"
    : t === 1
      ? "demain"
      : t < 30
        ? `dans ${t} jours`
        : `dans ~${Math.round(t / 30)} mois`;
}

export // mois_index (ancre) <-> mois calendaire. L'ancre reste définie une seule fois,
// dans VISION_CONFIG : rien n'est recopié en base.
function anneeMoisDe(i) {
  const m = VISION_ANCRE.mois + num(i);
  return {
    annee: VISION_ANCRE.annee + Math.floor(m / 12),
    mois: ((m % 12) + 12) % 12,
  };
}

// Budget applicable à un mois. Lit d'abord vision_budget_mois ; à défaut, le
// modèle vision_budget, en lecture seule (source "modele"). Jamais d'écriture
// ici : l'initialisation se fait au démarrage, donc pas de course entre onglets.

export function isoAujourdhui() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
}

// Panneau de saisie rapide. Sert aussi bien à créer une dépense qu'à corriger
// une dépense existante : dans ce cas `initial` est la transaction à modifier.
// Éditeur du budget d'un mois donné. N'écrit jamais dans vision_budget :
// le modèle reste la référence qu'on copie pour initialiser un mois.
// Journal des décisions. Lit vision_audit, rempli par trigger : rien n'est
// recalculé ici, on ne fait que relire ce qui s'est réellement passé.
