import { VISION_CONFIG } from "../config.js";

export const PLANNING_ETAPES = [
  {
    when: "17 août → 7 sept. 2026",
    what: "Inscriptions SCAP semestre 1",
    det: "Candidature confirmée. 3 modules : Excel (160 €), Anglais pro digital (130 €), Droit numérique au travail (130 €).",
  },
  {
    when: "Fin août / début sept. 2026",
    what: "Inscription sport — En Avant! de Paris",
    det: "Une fois les créneaux SCAP connus. Cotisation 2 cours (600 €, chèque) + certificat médical.",
  },
  {
    when: "1er sept. → 30 nov. 2026",
    what: "Candidature DU Paris 1 sur eCandidat",
    det: "Dossier complet (CV, diplômes, justificatifs d’expérience).",
  },
  {
    when: "29 sept. → 15 déc. 2026",
    what: "Cours SCAP",
    det: "Rentrées : Excel 29/09, Anglais 30/09, Droit num. 03/10. Fins : 15/12, 09/12, 14/11.",
  },
  {
    when: "15 janvier 2027",
    what: "Rentrée du DU Data / IA – Droit du numérique",
    det: "Paris 1 Panthéon-Sorbonne — 2 jours/mois jusqu’au 4 juillet 2027.",
  },
  {
    when: "Fév. 2027",
    what: "SCAP semestre 2 — management (optionnel)",
    det: "Cours du 2nd semestre du 22 février au 28 juin 2027.",
  },
  {
    when: "Juillet 2027",
    what: "Fin du DU Paris 1",
    det: "Bilan de l’année et démarrage de la recherche de poste.",
  },
];

export const SEMAINE_TYPE = [
  {
    jour: "Lundi",
    journee: "Travail (ADEDOM)",
    soir: "—",
    fixe: !1,
  },
  {
    jour: "Mardi",
    journee: "Travail (ADEDOM)",
    soir: "Excel 18h30–21h30 · Fagon (13e)",
    fixe: !0,
  },
  {
    jour: "Mercredi",
    journee: "Travail (ADEDOM)",
    soir: "Anglais pro 18h30–21h30 · Guillaume Tirel",
    fixe: !0,
  },
  {
    jour: "Jeudi",
    journee: "Travail (ADEDOM)",
    soir: "—",
    fixe: !1,
  },
  {
    jour: "Vendredi",
    journee: "Travail (ADEDOM) · 2×/mois DU (dès janv. 2027)",
    soir: "Sport 19h30–21h00 — Free Style Tricks",
    fixe: !0,
  },
  {
    jour: "Samedi",
    journee: "Droit numérique 9h–12h (distanciel) · 2×/mois DU",
    soir: "—",
    fixe: !0,
  },
  {
    jour: "Dimanche",
    journee: "Sport 14h–16h — Free Style Gym",
    soir: "Repos",
    fixe: !0,
  },
];

export const NOTES_PLANNING = [
  "Période SCAP (fin sept. → déc. 2026) : Excel mardi soir (Fagon 13e), Anglais pro mercredi soir (Guillaume Tirel), Droit numérique samedi matin (distanciel).",
  "Sport : Free Style Tricks vendredi 19h30–21h00, Free Style Gym dimanche 14h–16h. Aucun conflit avec les cours SCAP (mar./mer./sam.).",
  "Vendredi soir : dès janv. 2027, le sport (19h30) chevauche les vendredis de DU (2×/mois). Solution à voir avec le club — à aborder en décembre.",
];

export const SUIVI_DEFAUT = [
  {
    key: "suivi:1",
    etape: "Candidature SCAP confirmée (Excel, Anglais, Droit num.)",
    echeance: "Traitement ville de Paris : 8 → 25 sept. 2026",
    action: "Régler avant le 2e cours. Total 420 €.",
  },
  {
    key: "suivi:2",
    etape: "Certificat médical (< 3 mois)",
    echeance: "Avant l’inscription sport",
    action: "Prendre RDV médecin traitant.",
  },
  {
    key: "suivi:3",
    etape: "Adhésion sport — En Avant! de Paris",
    echeance: "Payée · expire le 31/08/2027",
    action: "Prélèvement SEPA 3×200 €/mois. Certificat médical à jour.",
  },
  {
    key: "suivi:4",
    etape: "Candidature DU Paris 1 (eCandidat)",
    echeance: "1er sept. → 30 nov. 2026",
    action: "CV, diplômes, justificatifs des 2 ans d’expérience.",
  },
  {
    key: "suivi:5",
    etape: "Réponses candidatures SCAP",
    echeance: "8 → 25 sept. 2026",
    action: "Régler en ligne (CB) avant le 2ᵉ cours.",
  },
  {
    key: "suivi:6",
    etape: "Rentrée des cours SCAP (S1)",
    echeance: "28 sept. 2026",
    action: "—",
  },
  {
    key: "suivi:7",
    etape: "Confirmer le règlement du DU",
    echeance: "À l’admission (déc. 2026)",
    action: "Paiement en une fois, prélevé sur les livrets.",
  },
  {
    key: "suivi:8",
    etape: "Rentrée du DU Paris 1",
    echeance: "15 janv. 2027",
    action: "—",
  },
  {
    key: "suivi:9",
    etape: "Inscriptions SCAP semestre 2 (si management)",
    echeance: "5 → 25 janv. 2027",
    action: "Seulement si une soirée reste libre.",
  },
  {
    key: "suivi:10",
    etape: "Fin du DU",
    echeance: "4 juil. 2027",
    action: "Lancer la recherche active de poste.",
  },
];

export const PIECES_DEFAUT = [
  {
    titre: "SCAP — Anglais, Droit numérique au travail, IA finance",
    items: [
      {
        key: "piece:scap:0",
        label: "Créer un compte « Mon Paris » / SCAP",
      },
      {
        key: "piece:scap:1",
        label: "Pièce d’identité (CNI ou passeport)",
      },
      {
        key: "piece:scap:2",
        label: "Moyen de paiement CB (règlement avant le 2ᵉ cours)",
      },
    ],
  },
  {
    titre: "DU Paris 1 — Data/IA",
    items: [
      {
        key: "piece:du:0",
        label: "CV à jour",
      },
      {
        key: "piece:du:1",
        label: "Lettre de motivation",
      },
      {
        key: "piece:du:2",
        label: "Copie des diplômes (Licence + Master en droit)",
      },
      {
        key: "piece:du:3",
        label: "Justificatifs des 2 ans d’expérience",
      },
      {
        key: "piece:du:4",
        label: "Pièce d’identité",
      },
      {
        key: "piece:du:5",
        label: "Dossier eCandidat complété",
      },
    ],
  },
  {
    titre: "Sport — En Avant! de Paris",
    items: [
      {
        key: "piece:sport:0",
        label: "Inscription en ligne + formule « Free style gym 2 cours »",
      },
      {
        key: "piece:sport:1",
        label: "Certificat médical de moins de 3 mois",
      },
      {
        key: "piece:sport:2",
        label: "Chèque de 600 € à l’ordre de « En avant de Paris »",
      },
      {
        key: "piece:sport:3",
        label: "Décharge de responsabilité",
      },
    ],
  },
];

export const BUDGET_DEFAUT = [
  {
    line_key: "revenu_salaire",
    kind: "revenu",
    poste: "Salaire ADEDOM (net)",
    detail: "",
    montant: 2150,
    sort: 0,
  },
  {
    line_key: "c_logement",
    kind: "charge",
    poste: "Logement & énergie",
    detail: "EDF 28 · ENGIE 98 · chaudière 16",
    montant: 142,
    sort: 10,
  },
  {
    line_key: "c_alim",
    kind: "charge",
    poste: "Alimentation",
    detail: "La Belle Vie 200 · supermarchés 170 · Amazon 40",
    montant: 410,
    sort: 11,
  },
  {
    line_key: "c_sante",
    kind: "charge",
    poste: "Santé / pharmacie",
    detail: "Pharmacies · compléments · actes médicaux",
    montant: 100,
    sort: 12,
  },
  {
    line_key: "c_beaute",
    kind: "charge",
    poste: "Beauté & soins",
    detail: "Coiffeur 2×/an (~10€/mois) + manucure/pédicure/épilation visage ~1×/mois (~45€)",
    montant: 55,
    sort: 13,
  },
  {
    line_key: "c_vetements",
    kind: "charge",
    poste: "Vêtements",
    detail: "Vinted 40 · provision vacances 30",
    montant: 70,
    sort: 14,
  },
  {
    line_key: "c_materiel",
    kind: "charge",
    poste: "Matériel & high-tech",
    detail: "IT · électroménager · bricolage",
    montant: 130,
    sort: 15,
  },
  {
    line_key: "c_transports",
    kind: "charge",
    poste: "Transports",
    detail: "Navigo / RATP",
    montant: 80,
    sort: 16,
  },
  {
    line_key: "c_impots",
    kind: "charge",
    poste: "Impôts (DGFIP)",
    detail: "Rattrapage N-1 (dès sept.)",
    montant: 115,
    sort: 17,
  },
  {
    line_key: "c_abos",
    kind: "charge",
    poste: "Abonnements",
    detail: "YouTube · Claude · Mediapart",
    montant: 57,
    sort: 18,
  },
  {
    line_key: "c_liquide",
    kind: "charge",
    poste: "Argent liquide",
    detail: "Retraits rares",
    montant: 30,
    sort: 19,
  },
  {
    line_key: "c_plaisir",
    kind: "charge",
    poste: "Plaisir / sorties",
    detail: "Revolut",
    montant: 80,
    sort: 20,
  },
  {
    line_key: "e_livretA",
    kind: "epargne",
    poste: "Livret A",
    detail: "",
    montant: 250,
    sort: 40,
  },
  {
    line_key: "e_ldd",
    kind: "epargne",
    poste: "LDD",
    detail: "",
    montant: 250,
    sort: 41,
  },
  {
    line_key: "e_vacances",
    kind: "epargne",
    poste: "Provision vacances",
    detail: "fonds voyages",
    montant: 375,
    sort: 42,
  },
];

export const // Paramètres créés pour un compte neuf, uniquement si la table est vide.
  // Les trois premiers sont LUS par les calculs : sans eux la courbe d'épargne
  // démarre à zéro et la poche vacances ne se provisionne pas.
  // (« start_livrets » et « cible » ont été retirés : aucun calcul ne les lit.)
  PARAMS_DEFAUT = [
    {
      param_key: "plan_baseline",
      montant: 13321.59,
    },
    {
      param_key: "epargne_mensuelle",
      montant: 500,
    },
    {
      param_key: "provision_vacances_mensuelle",
      montant: 375,
    },
    {
      param_key: "seuil_ecart_epargne",
      montant: 300,
    },
    {
      param_key: "seuil_poche_min",
      montant: 200,
    },
    {
      param_key: "du_paiement",
      montant: 5660,
    },
    {
      param_key: "sport",
      montant: 600,
    },
    {
      param_key: "scap_s1",
      montant: 420,
    },
    {
      param_key: "enveloppe_formation",
      montant: 6210,
    },
  ];

export const VOYAGES_DEFAUT = [
  {
    line_key: "v_avion_lisbonne",
    mois_index: 1,
    label: "Avion Lisbonne",
    montant: 200,
    sort: 0,
  },
  {
    line_key: "v_hotel_lisbonne",
    mois_index: 2,
    label: "Hôtel Lisbonne",
    montant: 230,
    sort: 1,
  },
  {
    line_key: "v_grand_voyage",
    mois_index: 3,
    label: "Grand voyage",
    montant: 920,
    sort: 2,
  },
];

export const PARAMS_LIBELLES = {
  plan_baseline: "Épargne de départ (livrets, hors provisions)",
  epargne_mensuelle: "Épargne versée chaque mois sur les livrets",
  provision_vacances_mensuelle: "Provision vacances mise de côté chaque mois",
  seuil_ecart_epargne: "Seuil d'alerte sur l'écart d'épargne",
  seuil_poche_min: "Seuil d'alerte « poche basse »",
  cible_override: "Matelas cible imposé (0 = calculé sur 6 mois de salaire)",
  start_livrets: "Épargne de départ (ancienne clé, non utilisée)",
  du_paiement: "Coût du DU (payé en déc. 2026)",
  sport: "Sport — En Avant! (600 €, SEPA 3×200)",
  scap_s1: "SCAP semestre 1 (prévu, sept. 2026)",
  enveloppe_formation: "Enveloppe formation — montant total fixe",
  scap_s1_reel: "SCAP S1 — réellement payé à ce jour",
  cible: "Matelas cible (6 mois de salaire)",
};

export const CHRONO_DEFAUT = [
  {
    date: "2026-08-17",
    titre: "Inscriptions SCAP S1",
    detail: "Ouverture — jusqu’au 7 sept.",
  },
  {
    date: "2026-08-24",
    titre: "Adhésion sport — En Avant!",
    detail: "Payée · SEPA 3×200 €/mois",
  },
  {
    date: "2026-09-01",
    titre: "Candidature DU sur eCandidat",
    detail: "Dépôt jusqu’au 1er déc.",
  },
  {
    date: "2026-09-08",
    titre: "Traitement candidatures SCAP",
    detail: "Réponse ville de Paris entre le 8 et le 25 sept.",
  },
  {
    date: "2026-09-29",
    titre: "Rentrée SCAP",
    detail: "Excel (mar.), Anglais (mer.), Droit num. (sam.)",
  },
  {
    date: "2026-12-01",
    titre: "Date limite dossier DU",
    detail: "Dernier jour eCandidat",
  },
  {
    date: "2027-01-15",
    titre: "Rentrée du DU",
    detail: "Panthéon-Sorbonne",
  },
  {
    date: "2027-07-04",
    titre: "Fin du DU",
    detail: "→ recherche de poste",
  },
  {
    date: "2027-09-01",
    titre: "Bascule PEA 🌊",
    detail: "Matelas reconstitué — cap sur la mer",
  },
];

export const LISTE_LV = [
  {
    nom: "Excel se perfectionner",
    quand: "Mardi 18h30–21h30",
    lieu: "Fagon (13e) · 13 rue Fagon, 75013 Paris",
    periode: "29/09 → 15/12/2026",
  },
  {
    nom: "Anglais pro — Speak Business",
    quand: "Mercredi 18h30–21h30",
    lieu: "Guillaume Tirel · 237 bd Raspail, 75014 Paris",
    periode: "30/09 → 09/12/2026",
  },
  {
    nom: "Droit numérique au travail",
    quand: "Samedi 09h00–12h00",
    lieu: "À distance (visio)",
    periode: "03/10 → 14/11/2026",
  },
  {
    nom: "Sport — Free Style Tricks",
    quand: "Vendredi 19h30–21h00",
    lieu: "10 rue Huyghens, 75014 Paris",
    periode: "saison (à confirmer)",
  },
  {
    nom: "Sport — Free Style Gym Adulte",
    quand: "Dimanche 14h00–16h00",
    lieu: "10 rue Huyghens, 75014 Paris",
    periode: "saison (à confirmer)",
  },
];

export // Contenu de départ d'un nouvel utilisateur : recopié depuis les listes
// historiques. Une fois en base, c'est la base qui fait foi et l'utilisateur
// peut tout modifier depuis l'app.
function contenuDefauts(uid) {
  const out = [];
  SUIVI_DEFAUT.forEach((x, i) =>
    out.push({
      user_id: uid,
      type: "suivi",
      item_key: x.key,
      titre: x.etape,
      detail: x.echeance,
      extra: x.action,
      sort: i,
    }),
  );
  let p = 0;
  PIECES_DEFAUT.forEach((g) =>
    g.items.forEach((x) =>
      out.push({
        user_id: uid,
        type: "piece",
        item_key: x.key,
        groupe: g.titre,
        titre: x.label,
        sort: p++,
      }),
    ),
  );
  // Chronologie : Ev donne les dates, Av les libellés de période et les
  // descriptions. Les deux listes n'en font plus qu'une.
  const periodes = {};
  PLANNING_ETAPES.forEach((a) => {
    periodes[a.what] = {
      when: a.when,
      det: a.det,
    };
  });
  CHRONO_DEFAUT.forEach((x, i) => {
    const a = periodes[x.titre];
    out.push({
      user_id: uid,
      type: "chrono",
      item_key: "chrono:" + (i + 1),
      titre: x.titre,
      detail: a ? a.det : x.detail,
      complement: a ? a.when : null,
      date_iso: x.date,
      sort: i,
    });
  });
  PLANNING_ETAPES.filter((a) => !CHRONO_DEFAUT.some((x) => x.titre === a.what)).forEach((a, i) =>
    out.push({
      user_id: uid,
      type: "chrono",
      item_key: "chrono:av:" + (i + 1),
      titre: a.what,
      detail: a.det,
      complement: a.when,
      sort: CHRONO_DEFAUT.length + i,
    }),
  );
  // Détail des cours : une seule source, partagée avec l'onglet Sport.
  LISTE_LV.forEach((x, i) =>
    out.push({
      user_id: uid,
      type: "cours",
      item_key: "cours:" + (i + 1),
      groupe: /^Sport/i.test(x.nom) ? "sport" : "scap",
      titre: x.nom,
      detail: x.quand,
      extra: x.lieu,
      complement: x.periode,
      sort: i,
    }),
  );
  SEMAINE_TYPE.forEach((x, i) =>
    out.push({
      user_id: uid,
      type: "jour",
      item_key: "jour:" + (i + 1),
      groupe: x.fixe ? "fixe" : null,
      titre: x.jour,
      detail: x.journee,
      extra: x.soir,
      sort: i,
    }),
  );
  NOTES_PLANNING.forEach((x, i) =>
    out.push({
      user_id: uid,
      type: "note",
      item_key: "note:planning:" + i,
      groupe: "planning",
      titre: x,
      extra: i === 2 ? "red" : null,
      sort: i + 1,
    }),
  );
  out.push(
    {
      user_id: uid,
      type: "note",
      item_key: "note:planning:sub",
      groupe: "planning_sub",
      titre: "Deux points fixes : sport vendredi soir et dimanche après-midi.",
      sort: 0,
    },
    {
      user_id: uid,
      type: "note",
      item_key: "note:sport:sub",
      groupe: "sport_sub",
      titre: "En Avant! de Paris — Free Style Gym, cotisation 600 € (2 cours/semaine).",
      sort: 0,
    },
    {
      user_id: uid,
      type: "note",
      item_key: "note:sport:0",
      groupe: "sport",
      titre:
        "Cotisation payée · prélèvement SEPA 3×200 €/mois (août–oct). Expire le 31/08/2027. Certificat médical à garder à jour.",
      sort: 1,
    },
  );
  VISION_CONFIG.devoirs.matieres.forEach((x, i) =>
    out.push({
      user_id: uid,
      type: "matiere",
      item_key: "matiere:" + (i + 1),
      titre: x,
      sort: i,
    }),
  );
  return out;
}

// Sauvegarde différée : on attend que la frappe s'arrête avant d'écrire en base,
// au lieu d'attendre que l'utilisateur sorte du champ.

export const CAT_ICONES = [
  [/aliment|course/i, "🥗"],
  [/transport/i, "🚇"],
  [/logement|énergie|energie/i, "🏠"],
  [/santé|sante|pharmac/i, "💊"],
  [/beauté|beaute|soin/i, "🧴"],
  [/vêtement|vetement/i, "👕"],
  [/matériel|materiel|tech/i, "💻"],
  [/impôt|impot|dgfip/i, "🏛"],
  [/abonnement/i, "🔁"],
  [/liquide|espèce|espece/i, "💶"],
  [/plaisir|sortie/i, "🎉"],
];

export // Panneau de saisie rapide. Sert aussi bien à créer une dépense qu'à corriger
// une dépense existante : dans ce cas `initial` est la transaction à modifier.
// Éditeur du budget d'un mois donné. N'écrit jamais dans vision_budget :
// le modèle reste la référence qu'on copie pour initialiser un mois.
// Journal des décisions. Lit vision_audit, rempli par trigger : rien n'est
// recalculé ici, on ne fait que relire ce qui s'est réellement passé.
const AUDIT_GROUPES = [
  ["decision", "Décisions", ["statut", "date_effet", "raison"]],
  ["montant", "Montants", ["montant_prevu", "montant_reel", "paid"]],
  ["organisation", "Organisation", ["label", "detail", "pocket", "mois_index"]],
];

export const AUDIT_CHAMPS = {
  statut: "état",
  date_effet: "date d'effet",
  raison: "raison",
  detail: "détail",
  montant_prevu: "montant prévu",
  montant_reel: "montant réel",
  paid: "payé",
  label: "libellé",
  pocket: "poche",
  mois_index: "mois",
  montant: "montant",
};
