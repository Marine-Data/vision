import { budgetDuMois, ligneBudgetId } from "./calculs.js";
import { num } from "./format.js";

export // Alerte salaire : même calcul que le tableau Excel (salaire − dépenses − épargne).
// Salaire réel s'il est saisi, sinon salaire prévu. Seuil d'alerte orange : 50 €.
const ALERTE_SEUIL = 50;

export function alerteSalaire(modele, bmRows, tx, m) {
  const lignes = budgetDuMois(bmRows, modele, m),
    idsDe = (k) => lignes.filter((w) => w.kind === k).map(ligneBudgetId),
    txi = (tx || []).filter((x) => num(x.mois_index) === m),
    somme = (ids) =>
      txi
        .filter((x) => ids.includes(x.budget_line_id))
        .reduce((s, x) => s + (x.type === "remboursement" ? -num(x.montant) : num(x.montant)), 0),
    budgetDe = (k) => lignes.filter((w) => w.kind === k).reduce((s, w) => s + num(w.montant), 0),
    idsRev = idsDe("revenu"),
    aSalaire = txi.some((x) => idsRev.includes(x.budget_line_id)),
    salairePrevu = budgetDe("revenu"),
    salaireReel = aSalaire ? somme(idsRev) : null,
    salaire = salaireReel != null ? salaireReel : salairePrevu,
    engage = somme(idsDe("charge")) + somme(idsDe("epargne")),
    reste = salaire - engage,
    budgetSorties = budgetDe("charge") + budgetDe("epargne"),
    ecartPrevu = salairePrevu - budgetSorties;
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
