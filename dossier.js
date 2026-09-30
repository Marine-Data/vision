// Tout le contenu du dossier, sous forme de données.
// Les "key" des étapes de suivi et des pièces servent à sauvegarder
// l'état des cases cochées dans Supabase (table "progress").

export const chronologie = [
  { when: '17 août → 7 sept. 2026', what: 'Inscriptions SCAP semestre 1', det: "Ouverture le lundi 17 août à 10h. Anglais pro digital · Droit numérique au travail · IA pour la finance." },
  { when: 'Fin août / début sept. 2026', what: 'Inscription sport — En Avant! de Paris', det: 'Une fois les créneaux SCAP connus. Cotisation 2 cours (600 €, chèque) + certificat médical.' },
  { when: '1er sept. → 30 nov. 2026', what: 'Candidature DU Paris 1 sur eCandidat', det: 'Dossier complet (CV, diplômes, justificatifs d\'expérience).' },
  { when: '28 sept. 2026', what: 'Rentrée des cours SCAP (1er semestre)', det: "Cours du 1er semestre jusqu'au 6 février 2027." },
  { when: '15 janvier 2027', what: 'Rentrée du DU Data / IA – Droit du numérique', det: 'Paris 1 Panthéon-Sorbonne — 2 jours/mois jusqu\'au 4 juillet 2027.' },
  { when: 'Fév. 2027', what: 'SCAP semestre 2 — management (optionnel)', det: 'Cours du 2nd semestre du 22 février au 28 juin 2027.' },
  { when: 'Juillet 2027', what: 'Fin du DU Paris 1', det: 'Bilan de l\'année et démarrage de la recherche de poste.' },
]

export const semaine = [
  { jour: 'Lundi', journee: 'Travail (ADEDOM)', soir: 'Cours possible — à caler', fixe: false },
  { jour: 'Mardi', journee: 'Travail (ADEDOM)', soir: 'Cours possible — à caler', fixe: false },
  { jour: 'Mercredi', journee: 'Travail (ADEDOM)', soir: 'Cours possible — à caler', fixe: false },
  { jour: 'Jeudi', journee: 'Travail (ADEDOM)', soir: 'Sport 20h–22h — Free Style Gym', fixe: true },
  { jour: 'Vendredi', journee: 'Travail (ADEDOM) · 2×/mois DU', soir: 'Cours possible — à caler', fixe: false },
  { jour: 'Samedi', journee: 'Libre / révisions · 2×/mois DU', soir: '—', fixe: false },
  { jour: 'Dimanche', journee: 'Sport 14h–16h — Free Style Gym', soir: 'Repos', fixe: true },
]

export const semaineNotes = [
  'Cours SCAP = sessions intensives (dates publiées sur scap.paris.fr), pas des créneaux hebdo. 2 en distanciel, 2 en présentiel.',
  'Dès le 15 janvier 2027 : DU Paris 1 (2 jours/mois, ven. + sam.) + cours à distance 18h–21h certains soirs.',
  'Vigilance : le jeudi 20h–22h (sport) peut heurter une session SCAP puis une séance à distance du DU.',
]

export const suivi = [
  { key: 'suivi:1', etape: 'Inscriptions SCAP semestre 1', echeance: '17 août → 7 sept. 2026', action: 'Compte « Mon Paris » + pièce d\'identité. Max 3 formations : tu es pile à 3.' },
  { key: 'suivi:2', etape: 'Certificat médical (< 3 mois)', echeance: 'Avant l\'inscription sport', action: 'Prendre RDV médecin traitant.' },
  { key: 'suivi:3', etape: 'Inscription sport — En Avant! de Paris', echeance: 'Fin août / début sept. 2026', action: 'Chèque 600 € + certificat, après avoir vu les horaires SCAP.' },
  { key: 'suivi:4', etape: 'Candidature DU Paris 1 (eCandidat)', echeance: '1er sept. → 30 nov. 2026', action: 'CV, diplômes, justificatifs des 2 ans d\'expérience.' },
  { key: 'suivi:5', etape: 'Réponses candidatures SCAP', echeance: '8 → 25 sept. 2026', action: 'Régler en ligne (CB) avant le 2ᵉ cours.' },
  { key: 'suivi:6', etape: 'Rentrée des cours SCAP (S1)', echeance: '28 sept. 2026', action: '—' },
  { key: 'suivi:7', etape: 'Confirmer le règlement du DU', echeance: 'À l\'admission (déc. 2026)', action: 'Paiement en une fois, prélevé sur les livrets.' },
  { key: 'suivi:8', etape: 'Rentrée du DU Paris 1', echeance: '15 janv. 2027', action: '—' },
  { key: 'suivi:9', etape: 'Inscriptions SCAP semestre 2 (si management)', echeance: '5 → 25 janv. 2027', action: 'Seulement si une soirée reste libre.' },
  { key: 'suivi:10', etape: 'Fin du DU', echeance: '4 juil. 2027', action: 'Lancer la recherche active de poste.' },
]

export const budgetEcheancier = [
  { echeance: 'Fin août 2026', poste: 'Sport — En Avant! de Paris (2 cours)', montant: '600 €' },
  { echeance: 'Sept. 2026', poste: 'SCAP semestre 1 (3 modules)', montant: '390 €' },
  { echeance: 'Déc. 2026', poste: 'DU Paris 1 — Data/IA (payé en une fois)', montant: '5 660 €' },
  { echeance: 'Fév. 2027', poste: 'SCAP — management relationnel (optionnel)', montant: '130 €' },
]

export const tabs = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'planning', label: 'Emploi du temps' },
  { id: 'suivi', label: 'Suivi' },
  { id: 'budget', label: 'Budget' },
  { id: 'tresorerie', label: 'Trésorerie' },
  { id: 'stats', label: 'Graphiques' },
  { id: 'sport', label: 'Sport' },
  { id: 'pieces', label: 'Pièces' },
  { id: 'homework', label: 'Devoirs' },
]

// ============================================================
// Chiffres pour l'onglet Graphiques (source unique).
// `sorties` = dépenses de reconversion prélevées sur les livrets,
// positionnées par index de mois (0 = août 2026).
// ============================================================
export const stats = {
  livretsDepart: 13321.59,   // solde livrets mi-août 2026 (matelas déjà atteint)
  epargneMensuelle: 500,     // Livret A 250 + LDD 250
  cible: 12900,              // matelas = 6 mois de salaire, avant PEA
  moisLabels: ['Août 26', 'Sep', 'Oct', 'Nov', 'Déc', 'Jan 27', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août 27', 'Sep 27', 'Oct 27', 'Nov 27', 'Déc 27'],
  sorties: [
    { i: 0, montant: 600,  label: 'Sport' },
    { i: 1, montant: 390,  label: 'SCAP S1' },
    { i: 4, montant: 5660, label: 'DU Paris 1' },
    { i: 5, montant: 130,  label: 'SCAP S2 (optionnel)' },
  ],
  vacances: 150,                         // budget mensuel vacances SCAP
  vacancesStart: 8,                      // Jan 2027 (index)
}
