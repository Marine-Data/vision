// Matelas de sécurité (6 × salaire) et passage de l'épargne au PEA.
// Même source que Budget mois, l'Accueil, les Graphiques et l'export.
import {
  budgetDuMois,
  calcsDesPoches,
  estLignePEA,
  getCible,
  ligneBudgetId,
  montantSigne,
  planDisponible,
  planEpargne,
} from "./calculs.js";
import { num, param } from "./format.js";
import { MOIS, anneeMoisDe, moisNow } from "./mois.js";

export const estLivretLigne = (w) => w.kind === "epargne" && w.line_key !== "e_vacances" && !estLignePEA(w);

export function etatMatelas({ items, params, budget, budgetMois, poches, transactions, pea }) {
  const n = MOIS.length,
    M = moisNow(),
    calcs = calcsDesPoches(poches, items, params, n),
    plan = planEpargne(items, params, n),
    serie = Array.from({ length: n }, (_, i) => planDisponible(plan, calcs, i)),
    cible = getCible(params, budget),
    salaire = cible / 6,
    dispo = serie[M],
    atteintA = serie.findIndex((v, i) => i >= M && v >= cible),
    suivant = Math.min(n - 1, M + 1),
    lignesSuivant = budgetDuMois(budgetMois, budget, suivant),
    livrets = lignesSuivant.filter(estLivretLigne),
    peaLignes = lignesSuivant.filter(estLignePEA),
    versLivrets = livrets.reduce((s, w) => s + num(w.montant), 0),
    versPEA = peaLignes.reduce((s, w) => s + num(w.montant), 0),
    idsPEA = new Set((budget || []).filter(estLignePEA).map((b) => b.id)),
    peaVerse = (transactions || [])
      .filter((x) => idsPEA.has(x.budget_line_id) && x.statut !== "prevu")
      .reduce((s, x) => s + montantSigne(x), 0),
    valeurs = [...(pea || [])].sort((a, b) => (a.date < b.date ? -1 : 1)),
    derniere = valeurs.length ? valeurs[valeurs.length - 1] : null,
    plusTard = param(params, "matelas_plus_tard", -1) === M;
  let proposition = null;
  if (!plusTard && dispo >= cible && versLivrets > 0) proposition = "basculer";
  if (!plusTard && dispo < cible && versPEA > 0) proposition = "recompleter";
  // « Et si j'épargne X € de plus par mois » : date d'arrivée simulée.
  const simuler = (extra) => {
    if (dispo >= cible) return M;
    let v = dispo;
    for (let i = M + 1; i < M + 240; i++) {
      v += (i < n ? serie[i] - serie[i - 1] : versLivrets) + extra;
      if (v >= cible) return i;
    }
    return null;
  };
  return {
    M,
    cible,
    salaire,
    serie,
    dispo,
    pct: cible ? (dispo / cible) * 100 : 0,
    moisCouverts: salaire ? dispo / salaire : 0,
    atteintA: atteintA >= 0 ? atteintA : null,
    proposition,
    suivant,
    livrets: livrets.map((w) => ({
      lid: ligneBudgetId(w),
      poste: w.poste,
      montant: num(w.montant),
      line_key: w.line_key,
    })),
    peaLignes: peaLignes.map((w) => ({ lid: ligneBudgetId(w), poste: w.poste, montant: num(w.montant) })),
    versLivrets,
    versPEA,
    peaVerse,
    peaValeur: derniere ? num(derniere.valeur) : null,
    peaDate: derniere ? derniere.date : null,
    simuler,
  };
}

// Nom d'un mois (au-delà de l'horizon de l'app aussi).
export function nomMoisLong(i) {
  const { annee, mois } = anneeMoisDe(i);
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
    new Date(annee, mois, 1),
  );
}
