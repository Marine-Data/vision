// « Vérifier mes soldes » : compare l'argent réellement possédé (tous comptes)
// au total que Vision attend. Pas d'affichage ici, seulement le calcul.
//
// Total attendu =
//     épargne disponible   (fin du mois précédent)
//   + enveloppe formation + sport (fin du mois précédent)
//   + provision vacances  (fin du mois précédent)
//   − paiements d'enveloppe / de vacances déjà faits ce mois-ci
//   − dépenses courantes déjà faites ce mois-ci (jusqu'à aujourd'hui)
//   + salaire arrivé sur le compte (si coché)
// Les virements entre comptes (épargne, provision vacances) ne changent pas le total.
import {
  budgetDuMois,
  calcsDesPoches,
  formationCalc,
  itemCompte,
  ligneBudgetId,
  montantSigne,
  planDisponible,
  planEpargne,
  pocketCalc,
  tauxVacances,
} from "./calculs.js";
import { num } from "./format.js";
import { MOIS } from "./mois.js";

export function totalAttendu(
  { items, params, poches, budget, budgetMois, transactions },
  M,
  aujourdhui,
  salaire,
) {
  const n = MOIS.length,
    p = Math.max(0, M - 1),
    calcs = calcsDesPoches(poches, items, params, n),
    epargne = planDisponible(planEpargne(items, params, n), calcs, p),
    enveloppe = formationCalc(items, params, n).solde[p],
    vacances = pocketCalc(items, "vacances", tauxVacances(params), n).solde[p],
    paiementsPoches = (items || [])
      .filter(
        (x) =>
          ["vacances", "formation", "sport"].includes(x.pocket) &&
          itemCompte(x) &&
          x.paid &&
          num(x.mois_index) === M,
      )
      .reduce((s, x) => s + (x.montant_reel != null ? num(x.montant_reel) : num(x.montant_prevu)), 0),
    idsCharges = new Set(
      budgetDuMois(budgetMois, budget, M)
        .filter((w) => w.kind === "charge")
        .map(ligneBudgetId),
    ),
    depensesMois = (transactions || [])
      .filter(
        (x) =>
          num(x.mois_index) === M &&
          idsCharges.has(x.budget_line_id) &&
          x.statut !== "prevu" &&
          (x.date_depense || "") <= aujourdhui,
      )
      .reduce((s, x) => s + montantSigne(x), 0),
    salaireRecu = num(salaire),
    total = epargne + enveloppe + vacances - paiementsPoches - depensesMois + salaireRecu;
  return { epargne, enveloppe, vacances, paiementsPoches, depensesMois, salaireRecu, total };
}

// Dépenses prévues (pas encore payées) qui dépasseront ce qui restera dans leur poche :
// provision vacances (alimentée chaque mois) et enveloppe formation + sport (fixe).
// Les dépenses à venir sont retirées dans l'ordre des mois ; on signale celles qui
// font passer la poche sous zéro, avec le montant manquant.
export function depassementsPoches(items, params, M) {
  const n = MOIS.length,
    poches = [
      {
        nom: "provision vacances",
        cles: ["vacances"],
        solde: pocketCalc(items, "vacances", tauxVacances(params), n).solde,
      },
      {
        nom: "enveloppe formation + sport",
        cles: ["formation", "sport"],
        solde: formationCalc(items, params, n).solde,
      },
    ],
    alertes = [];
  for (const p of poches) {
    const aVenir = (items || [])
      .filter((x) => p.cles.includes(x.pocket) && itemCompte(x) && !x.paid && num(x.mois_index) >= M)
      .sort((a, b) => num(a.mois_index) - num(b.mois_index) || (a.sort || 0) - (b.sort || 0));
    let cumul = 0;
    for (const x of aVenir) {
      const i = Math.min(n - 1, num(x.mois_index));
      cumul += num(x.montant_prevu);
      const reste = p.solde[i] - cumul;
      if (reste < 0)
        alertes.push({
          label: x.label,
          mois: i,
          montant: num(x.montant_prevu),
          poche: p.nom,
          manque: -reste,
        });
    }
  }
  return alertes;
}
