export // Épargne programmée automatique : jour du virement et premier mois concerné
// (index 3 = novembre 2026 ; septembre et octobre sont déjà saisis à la main).
const EP_AUTO_JOUR = 3; // valeur par défaut ; le réglage « ep_auto_jour » la remplace

export const jourEpargneAuto = (params) => {
  const p = (params || []).find((x) => x.param_key === "ep_auto_jour"),
    v = p ? Math.round(Number(p.montant)) : EP_AUTO_JOUR;
  return v >= 1 && v <= 28 ? v : EP_AUTO_JOUR;
};

export const EP_AUTO_DEBUT = 3;

export const EP_AUTO_NOTE = "Virement automatique";

export const epAutoCle = (lid, m) => "ep_auto_off_" + lid + "_" + m;
