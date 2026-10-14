// Partager : liens de lecture (?voir=), invitations (?invite=), échange de plannings,
// résumé du budget envoyé aux personnes autorisées.
import {
  budgetDuMois,
  getCible,
  ligneBudgetId,
  montantSigne,
  pocketCalc,
  tauxVacances,
} from "./calculs.js";
import { catIcone, num } from "./format.js";
import { etatMatelas } from "./matelas.js";
import { MOIS, moisNow } from "./mois.js";
import { lireCreneau } from "../components/SportPage.jsx";

const parametresUrl = (() => {
  try {
    return new URLSearchParams(window.location.search);
  } catch (e) {
    return new URLSearchParams("");
  }
})();
export const JETON_VOIR = parametresUrl.get("voir") || null;
export const JETON_INVITE = parametresUrl.get("invite") || null;

export const SECTIONS_PARTAGE = [
  ["planning", "📅", "Planning"],
  ["suivi", "🧭", "Parcours"],
  ["sport", "🤸", "Sport"],
  ["homework", "📚", "Devoirs"],
  ["pieces", "📄", "Pièces"],
  ["budget", "💶", "Budget"],
];
// Onglet de l'app correspondant à chaque partie partagée.
export const ONGLET_DE_SECTION = { planning: "planning", suivi: "suivi", sport: "sport", homework: "homework", pieces: "pieces", budget: "tresorerie" };

export const FORMULES = [
  ["montrer", "👁 Montrer", "Elle voit ton app, sans rien modifier."],
  ["inviter", "✉️ Inviter", "Elle crée la sienne. Rien de toi n'est visible."],
  ["deux", "✨ Les deux", "Elle voit ton app + « Créer mon app »."],
];
export const DUREES = [
  ["sem", "1 sem.", 7],
  ["mois", "1 mois", 30],
  ["jamais", "Jamais", null],
];
export const RACCOURCIS = [
  ["famille", "👩 Famille", { formule: "montrer", sections: ["planning", "budget"], montants: false, adresses: false, code: false, duree: "jamais", echange: false }],
  ["sport", "🤸 Sport", { formule: "deux", sections: ["planning", "sport"], montants: false, adresses: true, code: false, duree: "mois", echange: true }],
  ["tout", "🔒 Tout", { formule: "montrer", sections: ["planning", "suivi", "sport", "homework", "pieces", "budget"], montants: true, adresses: true, code: true, duree: "sem", echange: false }],
];

export function expirationDe(duree, depuis = new Date()) {
  const d = (DUREES.find((x) => x[0] === duree) || [])[2];
  return d ? new Date(depuis.getTime() + d * 864e5).toISOString() : null;
}

export function adresseDuLien(L) {
  const base = window.location.origin + window.location.pathname;
  return base + (L.formule === "inviter" ? "?invite=" : "?voir=") + encodeURIComponent(L.jeton);
}

export const codeAuHasard = () => String(Math.floor(Math.random() * 10000)).padStart(4, "0");

// Résumé du budget du mois en cours : mêmes calculs que les cartes de Budget mois.
export function resumeBudget({ budget, budgetMois, transactions, params, items, poches, pea }) {
  if (!budget || !budget.length) return null;
  const M = moisNow(),
    lignes = budgetDuMois(budgetMois, budget, M),
    catDe = (w) => {
      const m = budget.find((b) => b.id === ligneBudgetId(w)),
        c = m ? m.categorie : null;
      return c != null ? c : w.kind === "charge" ? "courantes" : w.kind === "epargne" ? "epargne" : null;
    },
    txMois = (transactions || []).filter((x) => num(x.mois_index) === M),
    reelDe = (id) => txMois.filter((x) => x.budget_line_id === id).reduce((s, x) => s + montantSigne(x), 0),
    avecReel = (l) => l.map((w) => ({ poste: w.poste, b: num(w.montant), r: reelDe(ligneBudgetId(w)) })),
    courantes = avecReel(lignes.filter((w) => catDe(w) === "courantes" && w.line_key !== "c_sport")),
    epargne = avecReel(lignes.filter((w) => catDe(w) === "epargne")),
    revenus = lignes.filter((w) => w.kind === "revenu"),
    salaire = revenus.reduce((s, w) => s + num(w.montant), 0),
    aReel = revenus.some((w) => txMois.some((x) => x.budget_line_id === ligneBudgetId(w))),
    base = aReel ? revenus.reduce((s, w) => s + reelDe(ligneBudgetId(w)), 0) : salaire,
    depense = courantes.reduce((s, w) => s + w.r, 0),
    epB = epargne.reduce((s, w) => s + w.b, 0),
    epR = epargne.reduce((s, w) => s + w.r, 0),
    epCompte = Math.max(epB, epR),
    reste = base - depense - epCompte,
    mat = etatMatelas({ items, params, budget, budgetMois, poches, transactions, pea }),
    vac = pocketCalc(items, "vacances", tauxVacances(params), MOIS.length).solde[M],
    arrondi = (v) => Math.round(v * 100) / 100,
    pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : null),
    tri = [...courantes].sort((a, b) => (pct(b.r, b.b) ?? -1) - (pct(a.r, a.b) ?? -1) || a.poste.localeCompare(b.poste, "fr"));
  return {
    mois: MOIS[M],
    pct: {
      postes: tri.map((w) => ({ poste: w.poste, icone: catIcone(w.poste), pct: pct(w.r, w.b) })),
      depense: pct(depense, base),
      reste: pct(reste, base),
      objectif: Math.round(mat.pct),
    },
    eur: {
      salaire: arrondi(base),
      depense: arrondi(depense),
      epargne: arrondi(epCompte),
      reste: arrondi(reste),
      postes: tri.map((w) => ({ poste: w.poste, b: arrondi(w.b), r: arrondi(w.r) })),
      matelas: Math.round(mat.dispo),
      cible: Math.round(getCible(params, budget)),
      vacances: Math.round(vac || 0),
    },
  };
}

// Créneaux libres en commun : soirées de semaine (18h–22h), samedi et dimanche matin et après-midi.
const PLAGES = [
  ...[0, 1, 2, 3, 4].map((j) => [j, "18:00", "22:00", "soir"]),
  ...[5, 6].flatMap((j) => [
    [j, "09:00", "12:00", "matin"],
    [j, "14:00", "18:00", "aprem"],
  ]),
];
const COURTS = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."];
function occupe(cours, j, de, a) {
  const auj = new Date().toISOString().slice(0, 10);
  return (cours || []).some((c) => {
    const x = lireCreneau(c.detail);
    if (x.jour !== j) return false;
    const m = String(c.complement || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/);
    if (m && m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0") < auj) return false; // cours fini
    if (!x.debut) return true; // jour pris sans heure : on évite
    return x.debut < a && (x.fin || x.debut) > de;
  });
}
export function creneauxLibres(...listes) {
  return PLAGES.filter(([j, de, a]) => listes.every((l) => !occupe(l, j, de, a))).map(
    ([j, , , k]) => COURTS[j] + " " + k,
  );
}
