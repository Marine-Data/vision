// Planning étape 2 : événements à certaines dates, pauses, repères du jour.
// Tout est calculé ici à partir des données ; les écrans ne font qu'afficher.

export const CATEGORIES = [
  ["rdv", "📌 Rendez-vous", "📌"],
  ["formation", "🎓 Formation", "🎓"],
  ["sport", "🤸 Sport", "🤸"],
  ["autre", "🎉 Autre", "🎉"],
];
export const MASQUES = [
  ["travail", "💼 Travail"],
  ["cours", "📘 Cours"],
  ["sport", "🤸 Sport"],
];

export const emojiDe = (ev) => ev.emoji || (CATEGORIES.find((c) => c[0] === ev.categorie) || CATEGORIES[0])[2];
export const listeDates = (ev) => [...(ev.dates || [])].map(String).sort();
export const estAnnulee = (ev, dIso) => (ev.annulees || []).map(String).includes(dIso);

// Horaires d'une date : ceux propres à la date s'il y en a, sinon ceux de la fiche.
export function horairesDe(ev, dIso) {
  const h = (ev.horaires || {})[dIso];
  return h && h[0] ? [h[0], h[1] || null] : [ev.heure_debut || null, ev.heure_fin || null];
}

export const evenementsLe = (evenements, dIso) =>
  (evenements || []).filter((e) => e.genre !== "pause" && listeDates(e).includes(dIso));

export const pausesLe = (evenements, dIso) =>
  (evenements || []).filter((e) => e.genre === "pause" && e.date_debut && String(e.date_debut) <= dIso && String(e.date_fin) >= dIso);

// Ce qui s'arrête ce jour-là : Set de "travail", "cours", "sport".
export function masqueLe(evenements, dIso) {
  const s = new Set();
  pausesLe(evenements, dIso).forEach((p) => (p.masque || []).forEach((m) => s.add(m)));
  return s;
}

// Un cours hebdomadaire est-il masqué par une pause ce jour-là ?
export const coursEnPause = (evenements, dIso, estSport) => masqueLe(evenements, dIso).has(estSport ? "sport" : "cours");

const h = (t) => (t ? Number(String(t).slice(0, 2)) + Number(String(t).slice(3, 5)) / 60 : null);
// Occupé par un événement (non annulé) entre de et a (heures décimales) ce jour-là ?
export function occupeLeJour(evenements, dIso, de, a) {
  return evenementsLe(evenements, dIso).some((e) => {
    if (estAnnulee(e, dIso)) return false;
    const [d1, f1] = horairesDe(e, dIso);
    if (!d1) return true;
    return h(d1) < a && (h(f1) || h(d1) + 1) > de;
  });
}

// Repères du jour : 📚 devoir à rendre, 💳 dépense prévue, 🧭 étape du parcours.
export function reperesDu(dIso, { homework, contenu, progress, transactions }) {
  const l = [];
  (homework || [])
    .filter((x) => x.deadline && String(x.deadline).slice(0, 10) === dIso && !["Fait", "Corrigé"].includes(x.status))
    .forEach((x) => l.push({ em: "📚", t: x.title || x.titre || "Devoir", s: (x.subject ? x.subject + " · " : "") + "à rendre", onglet: "homework", ou: "Devoirs" }));
  (transactions || [])
    .filter((x) => x.statut === "prevu" && String(x.date_depense || "").slice(0, 10) === dIso)
    .forEach((x) =>
      l.push({
        em: "💳",
        t: new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Math.abs(Number(x.montant) || 0)) + (x.note ? " · " + x.note : ""),
        s: "Dépense prévue",
        onglet: "tresorerie",
        ou: "Budget",
      }),
    );
  (contenu || [])
    .filter((c) => c.type === "suivi" && c.date_iso && String(c.date_iso).slice(0, 10) === dIso && !(progress || {})[c.item_key])
    .forEach((c) => l.push({ em: "🧭", t: c.titre, s: "Étape du parcours", onglet: "suivi", ou: "Parcours" }));
  return l;
}
