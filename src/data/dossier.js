// Tout le contenu du dossier, sous forme de données.
// Les "key" des étapes de suivi et des pièces servent à sauvegarder
// l'état des cases cochées dans Supabase (table "progress").

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

export const budgetMensuel = [
  { poste: 'Revenus', detail: 'Salaire ADEDOM (net)', montant: '+ 2 150 €', pos: true },
  { poste: '1 · Logement & énergie', detail: 'EDF 28 · ENGIE gaz 98 · chaudière 16', montant: '142 €' },
  { poste: '2 · Alimentation', detail: 'La Belle Vie 200 · supermarchés 170 · Amazon 40', montant: '410 €' },
  { poste: '3 · Santé', detail: 'Pharmacies 30 · compléments 30 · actes médicaux 40', montant: '100 €' },
  { poste: '4 · Vêtements', detail: 'Vinted 40 · provision vacances 30', montant: '70 €' },
  { poste: '5 · Matériel & high-tech', detail: 'IT 50 · électroménager 50 · bricolage 30', montant: '130 €' },
  { poste: '6 · Transports', detail: 'Navigo / RATP', montant: '80 €' },
  { poste: '7 · Impôts (DGFIP)', detail: 'Rattrapage N-1 (dès sept.)', montant: '115 €' },
  { poste: '8 · Abonnements', detail: 'YouTube · Claude · Mediapart (Deezer résilié)', montant: '57 €' },
  { poste: '9 · Argent liquide', detail: 'Retraits rares', montant: '30 €' },
  { poste: '10 · Plaisir / sorties', detail: 'Revolut', montant: '80 €' },
  { poste: 'Total charges de vie', detail: '', montant: '1 214 €', total: true },
  { poste: '12 · Épargne obligatoire', detail: 'Livret A 250 · LDD 250 · vacances 430', montant: '930 €' },
  { poste: 'Total dépenses + épargne', detail: '', montant: '2 144 €', total: true },
  { poste: 'Marge de sécurité', detail: 'budget à l\u2019équilibre', montant: '≈ 6 €', total: true, pos: true },
]

export const epargneProjection = [
  { mois: 'Mi-août 2026', ep: '+ 250 €', evt: '—', solde: '13 321,59 €' },
  { mois: 'Septembre 2026', ep: '+ 500 €', evt: '—', solde: '13 821,59 €' },
  { mois: 'Octobre 2026', ep: '+ 500 €', evt: '—', solde: '14 321,59 €' },
  { mois: 'Novembre 2026', ep: '+ 500 €', evt: '—', solde: '14 821,59 €' },
  { mois: 'Décembre 2026', ep: '+ 500 €', evt: '− 5 660 € (DU)', solde: '9 661,59 €', low: true },
  { mois: 'Janvier 2027', ep: '+ 500 €', evt: '—', solde: '10 161,59 €' },
  { mois: 'Février 2027', ep: '+ 500 €', evt: '—', solde: '10 661,59 €' },
  { mois: 'Mars → juin 2027', ep: '+ 500 €/mois', evt: '—', solde: 'jusqu\u2019à 12 661,59 €' },
  { mois: 'Juillet 2027', ep: '+ 500 €', evt: 'objectif repassé', solde: '13 161,59 €', ok: true },
]

export const vacances = [
  { mois: 'Août 2026', v: '+ 430 €', dep: '—', solde: '430 €' },
  { mois: 'Sept. 2026', v: '+ 430 €', dep: '− 200 € (avion Lisbonne)', solde: '660 €' },
  { mois: 'Oct. 2026', v: '+ 430 €', dep: '− 230 € (hôtel Lisbonne)', solde: '860 €' },
  { mois: 'Nov. 2026', v: '+ 430 €', dep: '− 920 € (grand voyage)', solde: '370 €' },
  { mois: 'Déc. 2026', v: '+ 430 €', dep: '—', solde: '800 €' },
  { mois: 'Janv. → juil. 2027', v: '+ 430 €/mois', dep: '—', solde: 'jusqu\u2019à 3 810 €' },
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

export const tabs = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'planning', label: 'Emploi du temps' },
  { id: 'suivi', label: 'Suivi' },
  { id: 'budget', label: 'Budget' },
  { id: 'tresorerie', label: 'Trésorerie' },
  { id: 'sport', label: 'Sport' },
  { id: 'pieces', label: 'Pièces' },
]
