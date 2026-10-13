import { joursAvant } from "./mois.js";

export function prochainesEcheances(t = 3, rows) {
  // Prochaines échéances : lues dans vision_contenu (type chrono), plus en dur.
  return chronoTriee(rows)
    .filter((e) => e.date_iso)
    .map((e) => ({
      date: e.date_iso,
      titre: e.titre,
      detail: e.detail,
      j: joursAvant(e.date_iso),
    }))
    .filter((e) => e.j >= 0)
    .sort((e, r) => e.j - r.j)
    .slice(0, t);
}

export function contenuDe(rows, type) {
  return (rows || []).filter((x) => x.type === type).sort((a, b) => (a.sort || 0) - (b.sort || 0));
}

// La chronologie se lit dans l'ordre du temps, pas dans l'ordre de saisie :
// un jalon ajouté après coup avec une date ancienne doit se replacer tout seul.
// Les jalons sans date restent à la fin, dans leur ordre d'origine.

export // La chronologie se lit dans l'ordre du temps, pas dans l'ordre de saisie :
// un jalon ajouté après coup avec une date ancienne doit se replacer tout seul.
// Les jalons sans date restent à la fin, dans leur ordre d'origine.
function chronoTriee(rows) {
  return contenuDe(rows, "chrono").sort((a, b) =>
    a.date_iso && b.date_iso ? a.date_iso.localeCompare(b.date_iso) : a.date_iso ? -1 : b.date_iso ? 1 : 0,
  );
}
