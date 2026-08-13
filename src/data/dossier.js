// ============================================================
// À COLLER À LA FIN DE src/data/dossier.js
// Source unique des chiffres pour l'onglet Graphiques.
// ============================================================
export const stats = {
  livretsDepart: 13321.59,   // solde livrets mi-août 2026
  epargneMensuelle: 500,     // Livret A 250 + LDD 250
  coutDU: 5660,              // DU Paris 1, payé en une fois (décembre 2026)
  duMoisIndex: 4,            // décembre (0 = août 2026)
  cible: 12900,              // matelas = 6 mois de salaire, avant bascule PEA
  moisLabels: ['Août 26', 'Sep', 'Oct', 'Nov', 'Déc', 'Jan 27', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil'],
  // Charges de vie mensuelles (hors épargne) — total 1 214 €
  charges: [
    { nom: 'Alimentation',        montant: 410, couleur: '#2e6b4f' },
    { nom: 'Logement & énergie',  montant: 142, couleur: '#8a2f2c' },
    { nom: 'Matériel & high-tech',montant: 130, couleur: '#946517' },
    { nom: 'Impôts (DGFIP)',      montant: 115, couleur: '#b5654d' },
    { nom: 'Santé',               montant: 100, couleur: '#5b8c6e' },
    { nom: 'Transports',          montant: 80,  couleur: '#4a7a8c' },
    { nom: 'Plaisir / sorties',   montant: 80,  couleur: '#a88b3f' },
    { nom: 'Vêtements',           montant: 70,  couleur: '#c08a5e' },
    { nom: 'Abonnements',         montant: 57,  couleur: '#7d5a86' },
    { nom: 'Argent liquide',      montant: 30,  couleur: '#6f665c' },
  ],
}
