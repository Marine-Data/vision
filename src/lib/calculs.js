import { VISION_CONFIG } from "../config.js";
import { num, param, paramOuDefaut, totalParType } from "./format.js";
import { MOIS, anneeMoisDe } from "./mois.js";

export function margeMensuelle(t) {
  return totalParType(t, "revenu") - totalParType(t, "charge") - totalParType(t, "epargne");
}

export const ITEM_STATUTS = [
  ["actif", "Actif"],
  ["termine", "Terminé"],
  ["abandonne", "Abandonné"],
  ["reporte", "Reporté"],
];

// Un poste abandonné ou reporté ne fait plus partie du plan : il n'est ni
// provisionné ni compté. Terminé reste dans le plan — c'est une dépense menée
// à son terme, pas une dépense annulée.

export // Un poste abandonné ou reporté ne fait plus partie du plan : il n'est ni
// provisionné ni compté. Terminé reste dans le plan — c'est une dépense menée
// à son terme, pas une dépense annulée.
function itemCompte(it) {
  const s = (it && it.statut) || "actif";
  return s === "actif" || s === "termine";
}

export function statutLibelle(s) {
  const t = ITEM_STATUTS.find(([k]) => k === (s || "actif"));
  return t ? t[1] : s;
}

export function pocketCalc(items, pocket, monthlyRate, r = MOIS.length, totalMode) {
  const list = (items || []).filter((x) => x.pocket === pocket && itemCompte(x));
  const prevu = [],
    reel = [],
    solde = [];
  const totalPrevu = totalMode ? list.reduce((s, it) => s + num(it.montant_prevu), 0) : 0;
  let pc = 0,
    rc = 0;
  for (let i = 0; i < r; i++) {
    for (const it of list)
      if (num(it.mois_index) === i) {
        if (monthlyRate === 0 && !totalMode) pc += num(it.montant_prevu);
        if (it.paid) rc += it.montant_reel != null ? num(it.montant_reel) : num(it.montant_prevu);
      }
    pocket === "vacances" && (rc -= num(VISION_DEFICITS[i]));
    pc += monthlyRate;
    prevu.push(totalMode ? totalPrevu : pc), reel.push(rc), solde.push((totalMode ? totalPrevu : pc) - rc);
  }
  return {
    prevu,
    reel,
    solde,
  };
}

// Dépassement du salaire, mois par mois : si le SOLDE réalisé (dépenses courantes
// + épargne programmée versée) dépasse le salaire réel, la différence est retirée
// de la provision vacances. Rien n'est ajouté quand on reste en dessous. Comme l'Excel.

export // Dépassement du salaire, mois par mois : si le SOLDE réalisé (dépenses courantes
// + épargne programmée versée) dépasse le salaire réel, la différence est retirée
// de la provision vacances. Rien n'est ajouté quand on reste en dessous. Comme l'Excel.
let VISION_DEFICITS = [];
// Alerte salaire : même calcul que le tableau Excel (salaire − dépenses − épargne).
// Salaire réel s'il est saisi, sinon salaire prévu. Seuil d'alerte orange : 50 €.

export function deficitsParMois(modele, bmRows, tx, n = MOIS.length) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const lignes = budgetDuMois(bmRows, modele, i),
      idsDe = (k) => lignes.filter((w) => w.kind === k).map(ligneBudgetId),
      txi = (tx || []).filter((x) => num(x.mois_index) === i),
      somme = (ids) =>
        txi
          .filter((x) => ids.includes(x.budget_line_id))
          .reduce((s, x) => s + (x.type === "remboursement" ? -num(x.montant) : num(x.montant)), 0),
      idsRev = idsDe("revenu"),
      aSalaire = txi.some((x) => idsRev.includes(x.budget_line_id));
    out.push(aSalaire ? Math.min(0, somme(idsRev) - somme(idsDe("charge")) - somme(idsDe("epargne"))) : 0);
  }
  return out;
}

export function planEpargne(items, e, r = MOIS.length) {
  // Calcule le solde des livrets PRÉVU mois par mois (avant déduction des provisions)
  // Formule : plan_baseline + (epargne_mensuelle × mois) - items épargne prévus
  const base = paramOuDefaut(e, "plan_baseline"),
    s = paramOuDefaut(e, "epargne_mensuelle"),
    du = (items || []).filter((x) => x.pocket === "epargne" && itemCompte(x));
  const a = [];
  let cur = base,
    cost = 0;
  for (let i = 0; i < r; i++) {
    if (i > 0) cur += s;
    for (const it of du) if (num(it.mois_index) === i) cost += num(it.montant_prevu);
    a.push(cur - cost);
  }
  return a;
}

// Les provisions sont désormais une liste, pas trois noms. Chaque entrée est
// le résultat de pocketCalc pour une poche. Une poche archivée reste comptée
// tant qu'elle a des postes actifs : archiver masque, ça ne solde pas.

export // Les provisions sont désormais une liste, pas trois noms. Chaque entrée est
// le résultat de pocketCalc pour une poche. Une poche archivée reste comptée
// tant qu'elle a des postes actifs : archiver masque, ça ne solde pas.
function totalReserve(calcs, i) {
  // Comme l'Excel : on retire ce qui reste dans chaque poche (provision − dépenses déjà payées).
  return (calcs || []).reduce((s, c) => s + (c && c.solde ? num(c.solde[i]) : 0), 0);
}

export function reelDisponible(rawReel, calcs, i) {
  // Épargne RÉELLE disponible au mois i APRÈS déduction des provisions.
  // On soustrait les provisions PRÉVUES, même non encore versées.
  if (rawReel[i] == null) return null;
  return rawReel[i] - totalReserve(calcs, i);
}

export function planDisponible(planArr, calcs, i) {
  // Épargne prévue = épargne de départ (fin août, hors enveloppe et hors provision
  // vacances) + épargne mensuelle × mois. Enveloppe et provision vivent à part.
  // L'ÉCART = reelDisponible - planDisponible
  return planArr[i];
}

export function salaireMensuel(budget) {
  return (budget || []).filter((x) => x.kind === "revenu").reduce((s, x) => s + (Number(x.montant) || 0), 0);
}

export function getCible(e, budget) {
  const ov = param(e, "cible_override", 0);
  if (ov > 0) return ov;
  const sal = salaireMensuel(budget);
  return sal > 0 ? sal * VISION_CONFIG.matelas.multiplicateurSalaire : VISION_CONFIG.matelas.fallback;
}

export function seuilEpargne(e) {
  return paramOuDefaut(e, "seuil_ecart_epargne") || 300;
}

export function seuilPoche(e) {
  return paramOuDefaut(e, "seuil_poche_min") || VISION_CONFIG.seuilPocheDefaut;
}

export function depasseCategorie(reel, budget) {
  return reel > budget + Math.max(20, budget * 0.1);
}

export function creuxEtReprise(t, e) {
  const r = t.indexOf(Math.min(...t));
  let n = -1;
  for (let s = r; s < t.length; s++)
    if (t[s] >= e) {
      n = s;
      break;
    }
  return {
    troughIdx: r,
    recIdx: n,
  };
}

export // Budget applicable à un mois. Lit d'abord vision_budget_mois ; à défaut, le
// modèle vision_budget, en lecture seule (source "modele"). Jamais d'écriture
// ici : l'initialisation se fait au démarrage, donc pas de course entre onglets.
function budgetDuMois(bmRows, modele, moisIndex) {
  const { annee, mois } = anneeMoisDe(moisIndex),
    lignes = (bmRows || []).filter((x) => x.annee === annee && x.mois === mois);
  return lignes.length
    ? [...lignes]
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map((x) => ({
          id: x.id,
          line_key: x.line_key,
          kind: x.kind,
          poste: x.poste,
          detail: x.detail,
          montant: x.montant,
          sort: x.sort,
          type: x.type,
          budget_line_id: x.budget_line_id,
          est_override: x.est_override,
          source: "mois",
        }))
    : (modele || []).map((b) => ({
        id: b.id,
        line_key: b.line_key,
        kind: b.kind,
        poste: b.poste,
        detail: b.detail,
        montant: b.montant,
        sort: b.sort,
        type: b.type,
        budget_line_id: b.id,
        est_override: !1,
        source: "modele",
      }));
}

// Identifiant de rattachement aux dépenses : toujours celui du modèle.

export // Identifiant de rattachement aux dépenses : toujours celui du modèle.
function ligneBudgetId(w) {
  return w && (w.budget_line_id || w.id);
}

// Flèches de réordonnancement : pas de glisser-déposer, qui est pénible au
// doigt sur téléphone et inaccessible au clavier.

export // Une poche archivée sort de l'affichage mais reste comptée tant qu'elle a des
// postes actifs : archiver masque, ça ne solde pas — sinon ce serait une porte
// dérobée pour faire remonter l'épargne sans rien changer à la réalité.
function pocheAffichee(p) {
  return (p.statut || "actif") === "actif";
}

export function pocheComptee(p, items) {
  return pocheAffichee(p) || (items || []).some((x) => x.pocket === p.cle && itemCompte(x));
}

export function calcsDesPoches(poches, items, params, n) {
  // Le sport est une dépense courante (ligne Sport du budget), comme dans l'Excel : il ne réduit pas l'épargne.
  return (poches || [])
    .filter((p) => p.cle !== "sport" && pocheComptee(p, items))
    .map((p) => pocheCalcDe(p, items, params, n));
}

// Enveloppe (formation) : montant total fixe, jamais réalimenté. Chaque paiement
// la diminue ; un poste annulé laisse son montant dans l'enveloppe.

export // Enveloppe (formation) : montant total fixe, jamais réalimenté. Chaque paiement
// la diminue ; un poste annulé laisse son montant dans l'enveloppe.
function enveloppeCalc(items, cle, total, n = MOIS.length) {
  const cles = cle === "formation" ? ["formation", "sport"] : [cle],
    list = (items || []).filter((x) => cles.includes(x.pocket) && x.paid),
    prevu = [],
    reel = [],
    solde = [];
  let rc = 0;
  for (let i = 0; i < n; i++) {
    for (const it of list)
      num(it.mois_index) === i &&
        (rc += it.montant_reel != null ? num(it.montant_reel) : num(it.montant_prevu));
    prevu.push(total), reel.push(rc), solde.push(total - rc);
  }
  return {
    prevu,
    reel,
    solde,
  };
}

export function formationCalc(items, params, n = MOIS.length) {
  const tot = param(params, "enveloppe_formation", 0);
  return tot > 0 ? enveloppeCalc(items, "formation", tot, n) : pocketCalc(items, "formation", 0, n, !0);
}

export function pocheCalcDe(p, items, params, n) {
  if (p.regime === "postes_dates" && p.param_key && param(params, p.param_key, 0) > 0)
    return enveloppeCalc(items, p.cle, param(params, p.param_key, 0), n);
  const taux = p.regime === "provision_mensuelle" && p.param_key ? paramOuDefaut(params, p.param_key) : 0;
  return pocketCalc(items, p.cle, taux, n, p.regime === "postes_dates");
}

export function set_VISION_DEFICITS(v) {
  VISION_DEFICITS = v;
}
