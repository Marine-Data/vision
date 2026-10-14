// Profil de l'utilisateur (prénom, projet de l'année) et onglets affichés.
// Profil : une ligne de vision_contenu (type « note », groupe « profil »),
//   titre = projet, detail = prénom.
// Onglets : réglages « onglet_<id> » dans vision_params (0 = caché, 1 = affiché).
//   Sans réglage, l'onglet est affiché (comptes créés avant l'écran Bienvenue).

export const ONGLETS_TOUJOURS = ["apercu", "tresorerie", "historique", "reglages"];

// Onglets proposés à l'accueil et dans Réglages, dans cet ordre.
export const ONGLETS_AU_CHOIX = [
  ["planning", "📅", "Planning", "Ta semaine type, tes cours"],
  ["sport", "🤸", "Sport", "Séances, club, adhésion"],
  ["homework", "📚", "Devoirs / formation", "Ce qu'il y a à rendre et quand"],
  ["suivi", "🧭", "Un parcours avec étapes", "Inscription, dossier, échéances"],
  ["pieces", "📄", "Pièces à fournir", "Papiers à rassembler"],
  ["stats", "📈", "Graphiques", "Épargne et dépenses dans le temps"],
  ["budget", "🎓", "Formations", "Enveloppe formation et sport"],
];

export function lireProfil(contenu) {
  const p = (contenu || []).find((x) => x.type === "note" && x.groupe === "profil");
  return p ? { id: p.id, existe: true, prenom: p.detail || "", projet: p.titre || "" } : { existe: false, prenom: "", projet: "" };
}

// Année scolaire en cours : « 2026 – 2027 » de septembre à août.
export function anneeScolaire(d = new Date()) {
  const a = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return a + " – " + (a + 1);
}

export function entete(contenu) {
  const p = lireProfil(contenu);
  if (!p.existe) return { kicker: "Reconversion · 2026 – 2027", titre: "Juriste Data, IA & Cyber" };
  return { kicker: (p.prenom ? p.prenom + " · " : "") + anneeScolaire(), titre: p.projet || "Mon année" };
}

export function ongletVisible(params, id) {
  if (ONGLETS_TOUJOURS.includes(id)) return true;
  const p = (params || []).find((x) => x.param_key === "onglet_" + id);
  return !p || Number(p.montant) !== 0;
}
