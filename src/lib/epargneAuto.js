export // Épargne programmée automatique : jour du virement et premier mois concerné
// (index 3 = novembre 2026 ; septembre et octobre sont déjà saisis à la main).
const EP_AUTO_JOUR = 3;

export const EP_AUTO_DEBUT = 3;

export const EP_AUTO_NOTE = "Virement automatique";

export const epAutoCle = (lid, m) => "ep_auto_off_" + lid + "_" + m;
