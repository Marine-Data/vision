// Planning étape 3 : prix d'un cours = liens vers les dépenses du Budget (une seule source).
// Un lien : { t: "item", id } (vision_items, enveloppe formation / sport) ou { t: "tx", id } (vision_transactions, dépense d'un poste).
import { num } from "./format.js";
import { MOIS } from "./mois.js";
import { periode } from "./periode.js";

const MOTS_VIDES = new Set(["sport", "cours", "free", "style", "pour", "avec", "dans", "adulte", "atelier", "les", "des", "une", "aux"]);
const sansAccent = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
// Mots qui portent le sens d'un nom : « Anglais pro — Speak Business » → anglais, speak, business.
export const motsCles = (s) =>
  sansAccent(s)
    .replace(/^sport\s*[—-]\s*/, "")
    .split(/[^a-z0-9]+/)
    .filter((m) => m.length >= 4 && !MOTS_VIDES.has(m));

export const liensDe = (x) => (Array.isArray(x && x.depenses) ? x.depenses : []);
const cle = (l) => l.t + ":" + l.id;

// Dépense du Budget sous une forme commune.
export function lireDepense(l, items, transactions, budget) {
  if (l.t === "item") {
    const x = (items || []).find((i) => i.id === l.id);
    if (!x) return { ...l, perdu: true, titre: "Dépense supprimée du Budget", montant: 0 };
    return {
      ...l,
      ref: x,
      titre: x.label || "Dépense",
      montant: num(x.montant_reel ?? x.montant_prevu) || num(x.montant_prevu),
      quand: MOIS[num(x.mois_index)] || "",
      ou: x.pocket === "sport" ? "Enveloppe sport" : x.pocket === "formation" ? "Enveloppe formation" : "Enveloppe " + (x.pocket || ""),
      paye: !!x.paid,
      abandonne: (x.statut || "actif") === "abandonne",
    };
  }
  const x = (transactions || []).find((t) => t.id === l.id);
  if (!x) return { ...l, perdu: true, titre: "Dépense supprimée du Budget", montant: 0 };
  const poste = ((budget || []).find((b) => b.id === x.budget_line_id) || {}).poste || "Poste";
  return {
    ...l,
    ref: x,
    titre: x.note || poste,
    montant: Math.abs(num(x.montant)),
    quand: x.date_depense ? Number(x.date_depense.slice(8, 10)) + "/" + x.date_depense.slice(5, 7) : "",
    ou: poste,
    paye: x.statut !== "prevu",
    abandonne: false,
  };
}

export function depensesDe(x, items, transactions, budget) {
  return liensDe(x).map((l) => lireDepense(l, items, transactions, budget));
}

// Dépenses reliées : toutes, toutes payées, total.
export function resumePrix(liste) {
  const ok = liste.filter((d) => !d.perdu);
  return {
    total: ok.reduce((s, d) => s + d.montant, 0),
    payees: ok.filter((d) => d.paye).length,
    nb: ok.length,
    abandon: ok.some((d) => d.abandonne),
  };
}

// Suggestions : dépenses non reliées à ce cours dont le nom ressemble ; pour le sport, l'enveloppe sport entière.
export function suggestions(x, items, transactions, budget) {
  const deja = new Set(liensDe(x).map(cle)),
    sport = x.groupe === "sport" || x.categorie === "sport",
    mots = motsCles(x.titre),
    ressemble = (t) => {
      const m = new Set(motsCles(t));
      return mots.some((w) => m.has(w));
    },
    l = [];
  (items || [])
    .filter((i) => !deja.has("item:" + i.id) && (sport ? i.pocket === "sport" : i.pocket !== "sport" && ressemble(i.label)))
    .forEach((i) => l.push({ t: "item", id: i.id }));
  if (!sport)
    (transactions || [])
      .filter((t) => !deja.has("tx:" + t.id) && t.note && ressemble(t.note))
      .forEach((t) => l.push({ t: "tx", id: t.id }));
  return l.map((k) => lireDepense(k, items, transactions, budget));
}

// Nombre de cours dans la période (jour de la semaine × semaines), sans les jours annulés.
export function nbCoursPeriode(c, jour, seances) {
  const p = periode(c);
  if (!p || jour < 0) return null;
  let n = 0;
  const d = new Date(p[0] + "T12:00:00"),
    fin = new Date(p[1] + "T12:00:00");
  while (d <= fin) {
    const iso = d.toISOString().slice(0, 10);
    if ((d.getDay() + 6) % 7 === jour && !(seances || []).some((s) => s.date === iso && s.cours_id === c.id && s.fait === false)) n++;
    d.setDate(d.getDate() + 1);
  }
  return n;
}

// Cours reliés à une même dépense (pour « partagée avec » et le prix par séance du sport).
export function coursRelies(dep, contenu) {
  return (contenu || []).filter((c) => c.type === "cours" && liensDe(c).some((l) => l.t === dep.t && l.id === dep.id));
}

// Nom court des cours reliés à une dépense : « Anglais pro », « Tricks + Gym ».
export function nomsRelies(dep, contenu, evenements) {
  const n = [
    ...coursRelies(dep, contenu).filter((c) => !c.origine).map((c) => String(c.titre || "").replace(/^Sport\s*[—-]\s*/, "").replace(/^Free Style\s+/i, "").split(/\s+[—-]\s+/)[0]),
    ...(evenements || []).filter((e) => liensDe(e).some((l) => l.t === dep.t && l.id === dep.id)).map((e) => e.titre),
  ];
  return [...new Set(n)].join(" + ");
}
