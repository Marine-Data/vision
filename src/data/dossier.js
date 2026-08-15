export const chronologie = [
  { when: '17 août → 7 sept. 2026', what: 'Inscriptions SCAP semestre 1', det: "Ouverture le lundi 17 août à 10h. Anglais pro digital · Droit numérique au travail · IA pour la finance." },
  { when: 'Fin août / début sept. 2026', what: 'Inscription sport — En Avant! de Paris', det: 'Une fois les créneaux SCAP connus. Cotisation 2 cours (600 €, chèque) + certificat médical.' },
  { when: '1er sept. → 30 nov. 2026', what: 'Candidature DU Paris 1 sur eCandidat', det: 'Dossier complet (CV, diplômes, justificatifs d\u2019expérience).' },
  { when: '28 sept. 2026', what: 'Rentrée des cours SCAP (1er semestre)', det: "Cours du 1er semestre jusqu'au 6 février 2027." },
  { when: '15 janvier 2027', what: 'Rentrée du DU Data / IA – Droit du numérique', det: 'Paris 1 Panthéon-Sorbonne — 2 jours/mois jusqu\u2019au 4 juillet 2027.' },
  { when: 'Fév. 2027', what: 'SCAP semestre 2 — management (optionnel)', det: 'Cours du 2nd semestre du 22 février au 28 juin 2027.' },
  { when: 'Juillet 2027', what: 'Fin du DU Paris 1', det: 'Bilan de l\u2019année et démarrage de la recherche de poste.' },
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
  { key: 'suivi:1', etape: 'Inscriptions SCAP semestre 1', echeance: '17 août → 7 sept. 2026', action: 'Compte « Mon Paris » + pièce d\u2019identité. Max 3 formations : tu es pile à 3.' },
  { key: 'suivi:2', etape: 'Certificat médical (< 3 mois)', echeance: 'Avant l\u2019inscription sport', action: 'Prendre RDV médecin traitant.' },
  { key: 'suivi:3', etape: 'Inscription sport — En Avant! de Paris', echeance: 'Fin août / début sept. 2026', action: 'Chèque 600 € + certificat, après avoir vu les horaires SCAP.' },
  { key: 'suivi:4', etape: 'Candidature DU Paris 1 (eCandidat)', echeance: '1er sept. → 30 nov. 2026', action: 'CV, diplômes, justificatifs des 2 ans d\u2019expérience.' },
  { key: 'suivi:5', etape: 'Réponses candidatures SCAP', echeance: '8 → 25 sept. 2026', action: 'Régler en ligne (CB) avant le 2ᵉ cours.' },
  { key: 'suivi:6', etape: 'Rentrée des cours SCAP (S1)', echeance: '28 sept. 2026', action: '—' },
  { key: 'suivi:7', etape: 'Confirmer le règlement du DU', echeance: 'À l\u2019admission (déc. 2026)', action: 'Paiement en une fois, prélevé sur les livrets.' },
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

export const budgetRecap = [
  { poste: 'SCAP semestre 1 (3 modules)', montant: '390 €' },
  { poste: 'DU Paris 1 — Data/IA', montant: '5 660 €' },
  { poste: 'Sport — En Avant! de Paris', montant: '600 €' },
  { poste: 'Total engagé — autofinancement', montant: '≈ 6 650 €', total: true },
  { poste: 'Option — management (S2)', montant: '+ 130 €' },
  { poste: 'Total avec option', montant: '≈ 6 780 €', total: true },
]

export const sportSlots = [
  { di: 'JEU', nom: 'Free Style Gym adulte', quand: 'jeudi · 20h00 – 22h00' },
  { di: 'DIM', nom: 'Free Style Gym adulte', quand: 'dimanche · 14h00 – 16h00' },
  { di: 'LIB', nom: 'Entraînement libre', quand: 'le soir' },
]

export const pieces = [
  {
    titre: 'SCAP — Anglais, Droit numérique au travail, IA finance',
    items: [
      { key: 'piece:scap:0', label: 'Créer un compte « Mon Paris » / SCAP' },
      { key: 'piece:scap:1', label: 'Pièce d\u2019identité (CNI ou passeport)' },
      { key: 'piece:scap:2', label: 'Moyen de paiement CB (règlement avant le 2ᵉ cours)' },
    ],
  },
  {
    titre: 'DU Paris 1 — Data/IA',
    items: [
      { key: 'piece:du:0', label: 'CV à jour' },
      { key: 'piece:du:1', label: 'Lettre de motivation' },
      { key: 'piece:du:2', label: 'Copie des diplômes (Licence + Master en droit)' },
      { key: 'piece:du:3', label: 'Justificatifs des 2 ans d\u2019expérience' },
      { key: 'piece:du:4', label: 'Pièce d\u2019identité' },
      { key: 'piece:du:5', label: 'Dossier eCandidat complété' },
    ],
  },
  {
    titre: 'Sport — En Avant! de Paris',
    items: [
      { key: 'piece:sport:0', label: 'Inscription en ligne + formule « Free style gym 2 cours »' },
      { key: 'piece:sport:1', label: 'Certificat médical de moins de 3 mois' },
      { key: 'piece:sport:2', label: 'Chèque de 600 € à l\u2019ordre de « En avant de Paris »' },
      { key: 'piece:sport:3', label: 'Décharge de responsabilité' },
    ],
  },
]

/* ============================================================
   Onglets
   ============================================================ */
export const tabs = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'planning', label: 'Emploi du temps' },
  { id: 'suivi', label: 'Suivi' },
  { id: 'budget', label: 'Budget' },
  { id: 'tresorerie', label: 'Trésorerie' },
  { id: 'stats', label: 'Graphiques' },
  { id: 'sport', label: 'Sport' },
  { id: 'pieces', label: 'Pièces' },
]

/* ============================================================
   Données de départ (seed) — utilisées UNIQUEMENT au 1er login,
   quand la table Supabase correspondante est vide. Les valeurs
   réelles vivent ensuite dans vision_budget / vision_params / vision_voyages.
   ============================================================ */
export const defaultBudget = [
  { line_key: 'revenu_salaire', kind: 'revenu', poste: 'Salaire ADEDOM (net)', detail: '', montant: 2150, sort: 0 },
  { line_key: 'c_logement', kind: 'charge', poste: 'Logement & énergie', detail: 'EDF 28 · ENGIE 98 · chaudière 16', montant: 142, sort: 10 },
  { line_key: 'c_alim', kind: 'charge', poste: 'Alimentation', detail: 'La Belle Vie 200 · supermarchés 170 · Amazon 40', montant: 410, sort: 11 },
  { line_key: 'c_sante', kind: 'charge', poste: 'Santé / pharmacie', detail: 'Pharmacies · compléments · actes médicaux', montant: 100, sort: 12 },
  { line_key: 'c_beaute', kind: 'charge', poste: 'Beauté & soins', detail: 'Coiffeur 2×/an (~10€/mois) + manucure/pédicure/épilation visage ~1×/mois (~45€)', montant: 55, sort: 13 },
  { line_key: 'c_vetements', kind: 'charge', poste: 'Vêtements', detail: 'Vinted 40 · provision vacances 30', montant: 70, sort: 14 },
  { line_key: 'c_materiel', kind: 'charge', poste: 'Matériel & high-tech', detail: 'IT · électroménager · bricolage', montant: 130, sort: 15 },
  { line_key: 'c_transports', kind: 'charge', poste: 'Transports', detail: 'Navigo / RATP', montant: 80, sort: 16 },
  { line_key: 'c_impots', kind: 'charge', poste: 'Impôts (DGFIP)', detail: 'Rattrapage N-1 (dès sept.)', montant: 115, sort: 17 },
  { line_key: 'c_abos', kind: 'charge', poste: 'Abonnements', detail: 'YouTube · Claude · Mediapart', montant: 57, sort: 18 },
  { line_key: 'c_liquide', kind: 'charge', poste: 'Argent liquide', detail: 'Retraits rares', montant: 30, sort: 19 },
  { line_key: 'c_plaisir', kind: 'charge', poste: 'Plaisir / sorties', detail: 'Revolut', montant: 80, sort: 20 },
  { line_key: 'e_livretA', kind: 'epargne', poste: 'Livret A', detail: '', montant: 250, sort: 40 },
  { line_key: 'e_ldd', kind: 'epargne', poste: 'LDD', detail: '', montant: 250, sort: 41 },
  { line_key: 'e_vacances', kind: 'epargne', poste: 'Provision vacances', detail: 'fonds voyages', montant: 375, sort: 42 },
]

export const defaultParams = [
  { param_key: 'start_livrets', montant: 13321.59 },
  { param_key: 'du_paiement', montant: 5660 },
  { param_key: 'sport', montant: 600 },
  { param_key: 'scap_s1', montant: 390 },
  { param_key: 'cible', montant: 12900 },
]

export const defaultVoyages = [
  { line_key: 'v_avion_lisbonne', mois_index: 1, label: 'Avion Lisbonne', montant: 200, sort: 0 },
  { line_key: 'v_hotel_lisbonne', mois_index: 2, label: 'Hôtel Lisbonne', montant: 230, sort: 1 },
  { line_key: 'v_grand_voyage', mois_index: 3, label: 'Grand voyage', montant: 920, sort: 2 },
]

/* Libellés des paramètres éditables (Trésorerie) */
export const paramLabels = {
  start_livrets: 'Épargne de départ (livrets, mi-août 2026)',
  du_paiement: 'Coût du DU (payé en déc. 2026)',
  sport: 'Sport — En Avant! (août 2026)',
  scap_s1: 'SCAP semestre 1 (sept. 2026)',
  cible: 'Matelas cible (6 mois de salaire)',
}

/* ============================================================
   Calculs partagés — dérivent tout du budget/params/voyages LIVE.
   Trésorerie et Graphiques utilisent ces mêmes fonctions.
   ============================================================ */
export const MOIS = [
  'Août 26', 'Sep', 'Oct', 'Nov', 'Déc', 'Jan 27', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil',
  'Août 27', 'Sep 27', 'Oct 27', 'Nov 27', 'Déc 27',
]
// index de prélèvement des coûts de reconversion sur les livrets
export const SORTIE_MOIS = { sport: 0, scap_s1: 1, du_paiement: 4 } // août, sept, déc

const num = (v) => Number(v) || 0
export const getParam = (params, key, def = 0) => {
  const p = (params || []).find((x) => x.param_key === key)
  return p ? num(p.montant) : def
}
// valeur par défaut d'un paramètre du plan (utilisée quand la clé n'est pas encore en base)
export const paramDefault = (key) => { const d = defaultParams.find((p) => p.param_key === key); return d ? d.montant : 0 }
export const planParam = (params, key) => getParam(params, key, paramDefault(key))

export const sumKind = (budget, kind) => (budget || []).filter((b) => b.kind === kind).reduce((s, b) => s + num(b.montant), 0)
const isVacances = (b) => b.line_key === 'e_vacances' || /vacances/i.test(b.poste || '')
export const livretsMensuel = (budget) => (budget || []).filter((b) => b.kind === 'epargne' && !isVacances(b)).reduce((s, b) => s + num(b.montant), 0)
export const vacancesMensuel = (budget) => { const v = (budget || []).find(isVacances); return v ? num(v.montant) : 0 }

export function marge(budget) {
  return sumKind(budget, 'revenu') - sumKind(budget, 'charge') - sumKind(budget, 'epargne')
}

// Projection livrets (matelas), coûts de reconversion déduits
export function projLivrets(budget, params, horizon = MOIS.length) {
  const start = planParam(params, 'start_livrets')
  const mens = livretsMensuel(budget)
  const sorties = {}
  for (const [key, i] of Object.entries(SORTIE_MOIS)) sorties[i] = (sorties[i] || 0) + planParam(params, key)
  const pts = [start - (sorties[0] || 0)]
  for (let i = 1; i < horizon; i++) pts.push(pts[i - 1] + mens - (sorties[i] || 0))
  return pts
}

// Projection poche vacances, voyages déduits à leur mois
export function projVacances(budget, voyages, horizon = MOIS.length) {
  const mens = vacancesMensuel(budget)
  const dep = {}
  ;(voyages || []).forEach((v) => { dep[num(v.mois_index)] = (dep[num(v.mois_index)] || 0) + num(v.montant) })
  const pts = []; let bal = 0
  for (let i = 0; i < horizon; i++) { bal += mens - (dep[i] || 0); pts.push(bal) }
  return pts
}

export function jalons(pts, cible) {
  const troughIdx = pts.indexOf(Math.min(...pts))
  let recIdx = -1
  for (let i = troughIdx; i < pts.length; i++) { if (pts[i] >= cible) { recIdx = i; break } }
  return { troughIdx, recIdx }
}

/* ============================================================
   Échéances datées — alimentent les comptes à rebours (Aperçu).
   ============================================================ */
export const echeances = [
  { date: '2026-08-17', titre: 'Inscriptions SCAP S1', detail: 'Ouverture — jusqu\u2019au 7 sept.' },
  { date: '2026-08-24', titre: 'Inscription sport — En Avant!', detail: 'Chèque 600 € + certificat médical' },
  { date: '2026-09-01', titre: 'Candidature DU sur eCandidat', detail: 'Dépôt jusqu\u2019au 1er déc.' },
  { date: '2026-09-28', titre: 'Rentrée SCAP S1', detail: 'Début des cours' },
  { date: '2026-12-01', titre: 'Date limite dossier DU', detail: 'Dernier jour eCandidat' },
  { date: '2027-01-15', titre: 'Rentrée du DU', detail: 'Panthéon-Sorbonne' },
  { date: '2027-07-04', titre: 'Fin du DU', detail: '\u2192 recherche de poste' },
  { date: '2027-09-01', titre: 'Bascule PEA \ud83c\udf0a', detail: 'Matelas reconstitué — cap sur la mer' },
]

export function joursRestants(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.round((d - now) / 86400000)
}
export function prochainesEcheances(n = 3) {
  return echeances
    .map((e) => ({ ...e, j: joursRestants(e.date) }))
    .filter((e) => e.j >= 0)
    .sort((a, b) => a.j - b.j)
    .slice(0, n)
}
export function libelleJours(j) {
  if (j === 0) return "aujourd'hui"
  if (j === 1) return 'demain'
  if (j < 30) return `dans ${j} jours`
  const m = Math.round(j / 30)
  return `dans ~${m} mois`
}
