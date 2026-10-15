import { budgetDuMois, ligneBudgetId, montantSigne } from "./calculs.js";
import { num } from "./format.js";

export // Alerte salaire : même calcul que le tableau Excel (salaire − dépenses − épargne).
// Salaire réel s'il est saisi, sinon salaire prévu. Seuil d'alerte orange : 50 €.
let ALERTE_SEUIL = 50;

// Seuil réglable (Réglages) : l'app le déclare à chaque rendu.
export function set_ALERTE_SEUIL(v) {
  ALERTE_SEUIL = Number.isFinite(Number(v)) && v !== null && v !== "" ? Number(v) : 50;
}

export function alerteSalaire(modele, bmRows, tx, m) {
  const lignes = budgetDuMois(bmRows, modele, m),
    idsDe = (k) => lignes.filter((w) => w.kind === k).map(ligneBudgetId),
    txi = (tx || []).filter((x) => num(x.mois_index) === m),
    somme = (ids) =>
      txi.filter((x) => ids.includes(x.budget_line_id)).reduce((s, x) => s + montantSigne(x), 0),
    budgetDe = (k) => lignes.filter((w) => w.kind === k).reduce((s, w) => s + num(w.montant), 0),
    idsRev = idsDe("revenu"),
    aSalaire = txi.some((x) => idsRev.includes(x.budget_line_id)),
    salairePrevu = budgetDe("revenu"),
    salaireReel = aSalaire ? somme(idsRev) : null,
    salaire = salaireReel != null ? salaireReel : salairePrevu,
    engage = somme(idsDe("charge")) + somme(idsDe("epargne")),
    reste = salaire - engage,
    budgetSorties = budgetDe("charge") + budgetDe("epargne"),
    // Budget prévu comparé au salaire réel dès qu'il est saisi, sinon au salaire prévu.
    ecartPrevu = salaire - budgetSorties;
  return {
    salaire,
    salaireReel,
    salairePrevu,
    engage,
    reste,
    budgetSorties,
    ecartPrevu,
    niveau: salaire <= 0 ? null : reste < 0 ? "rouge" : reste < ALERTE_SEUIL ? "orange" : null,
    prevu: ecartPrevu < 0 ? "orange" : null,
  };
}

// Bandeau d'alerte (Budget mois) : un chiffre, une jauge, presque pas de mots.
