// Valeurs de secours de l'application. Aucune donnée personnelle ici :
// les montants réels de chaque utilisatrice sont dans Supabase (table vision_params),
// créés à l'inscription (src/lib/nouveauCompte.js) et modifiables dans l'app.
// Ces valeurs ne servent que si un paramètre manque en base.
export const PARAMS_DEFAUT = [
  { param_key: "plan_baseline", montant: 0 },
  { param_key: "epargne_mensuelle", montant: 0 },
  { param_key: "provision_vacances_mensuelle", montant: 0 },
  { param_key: "seuil_ecart_epargne", montant: 300 },
  { param_key: "seuil_poche_min", montant: 200 },
  { param_key: "du_paiement", montant: 0 },
  { param_key: "sport", montant: 0 },
  { param_key: "scap_s1", montant: 0 },
  { param_key: "enveloppe_formation", montant: 0 },
];

export const PARAMS_LIBELLES = {
  plan_baseline: "Épargne de départ (livrets, hors provisions)",
  epargne_mensuelle: "Épargne versée chaque mois sur les livrets",
  provision_vacances_mensuelle: "Provision vacances mise de côté chaque mois",
  seuil_ecart_epargne: "Seuil d'alerte sur l'écart d'épargne",
  seuil_poche_min: "Seuil d'alerte « poche basse »",
  cible_override: "Matelas cible imposé (0 = calculé sur 6 mois de salaire)",
  start_livrets: "Épargne de départ (ancienne clé, non utilisée)",
  du_paiement: "Coût du diplôme universitaire",
  sport: "Abonnement sport",
  scap_s1: "Formation — semestre 1 (prévu)",
  enveloppe_formation: "Enveloppe formation — montant total fixe",
  scap_s1_reel: "Formation semestre 1 — réellement payé à ce jour",
  cible: "Matelas cible (6 mois de salaire)",
};

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

// Journal des décisions. Lit vision_audit, rempli par trigger : rien n'est
// recalculé ici, on ne fait que relire ce qui s'est réellement passé.
export const AUDIT_GROUPES = [
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
