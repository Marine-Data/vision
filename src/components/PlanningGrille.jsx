import React from "react";
import { KbSheet } from "./kanban/communs.jsx";
import { ecrireCreneau, lireCreneau } from "./SportPage.jsx";
import { chevauchements, creneauxCours } from "./Planning.jsx";
import { contenuDe } from "../lib/contenu.js";
import { param } from "../lib/format.js";
import { plagesLibres } from "../lib/partage.js";

// Planning en grille (étape 1) : semaine en colonnes, blocs de couleur par type,
// carte au toucher, ajout court, « J'y suis allée », couleurs et horaires du travail.

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const COURTS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
const MOIS_C = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
// Couleurs proposées pour chaque type : [fond, texte, nom].
export const PALETTE = [
  ["#0a7b8a", "#ffffff", "Bleu canard"],
  ["#c2477f", "#ffffff", "Framboise"],
  ["#6a5acd", "#ffffff", "Violet"],
  ["#d07a38", "#ffffff", "Orange"],
  ["#1f9a74", "#ffffff", "Vert"],
  ["#3b5fc4", "#ffffff", "Bleu"],
  ["var(--line-strong)", "var(--ink)", "Gris"],
];
const TYPES = [
  ["cours", "📚 Cours", 0],
  ["sport", "🤸 Sport", 1],
  ["travail", "💼 Travail", 6],
];
const PX = 34; // hauteur d'une heure

const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const heureNum = (t) => (t ? Number(t.slice(0, 2)) + Number(t.slice(3, 5)) / 60 : null);
const hTexte = (t) => (t ? t.replace(/^0/, "").replace(":00", "h").replace(":", "h") : "");
const nomCours = (t) => (t || "").replace(/^Sport\s*[—-]\s*/, "");
// Nom court pour la grille (colonnes étroites) : premier mot parlant, 9 lettres au plus.
const MOTS_VIDES = ["free", "style", "cours", "atelier", "sport", "le", "la", "les", "de", "du"];
export function nomGrille(t) {
  const mots = nomCours(t).split(/\s+[—-]\s+/)[0].split(/\s+/).filter(Boolean),
    m = mots.find((x) => !MOTS_VIDES.includes(x.toLowerCase())) || mots[0] || "";
  return m.length > 9 ? m.slice(0, 8) + "." : m;
}
const dateCourte = (d) => d.getDate() + " " + MOIS_C[d.getMonth()];
// Période « 30/09 → 09/12/2026 » → [début, fin] (AAAA-MM-JJ), ou null.
function periode(c) {
  const m = String(c.complement || "").match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\s*→\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const fin = m[6] + "-" + m[5].padStart(2, "0") + "-" + m[4].padStart(2, "0"),
    an = m[3] || (Number(m[2]) > Number(m[5]) ? String(Number(m[6]) - 1) : m[6]);
  return [an + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0"), fin];
}
const ecrirePeriode = (de, a) => {
  if (!de || !a) return null;
  const f = (x, an) => x.slice(8, 10) + "/" + x.slice(5, 7) + (an ? "/" + x.slice(0, 4) : "");
  return f(de, de.slice(0, 4) !== a.slice(0, 4)) + " → " + f(a, true);
};
function lundiDe(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
const couleurType = (params, type) => {
  const def = (TYPES.find((t) => t[0] === type) || [])[2] ?? 0;
  return PALETTE[Math.round(param(params, "couleur_" + type, def))] || PALETTE[def];
};

const champ = {
  height: 46,
  borderRadius: 12,
  border: "2px solid var(--line)",
  padding: "0 12px",
  font: "inherit",
  fontSize: 16,
  fontWeight: 700,
  color: "var(--ink)",
  background: "var(--surface)",
  boxSizing: "border-box",
  width: "100%",
  minWidth: 0,
};
const etiquette = { display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5, fontWeight: 800, color: "var(--slate)" };
const carte = { background: "var(--surface)", borderRadius: 20, boxShadow: "0 1px 2px rgba(14,58,66,.08)" };

function Segment({ items, valeur, onChoisir, label }) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, gap: 4, padding: 4, borderRadius: 14, background: "var(--fond-gris)" }}>
      {items.map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={v === valeur} onClick={() => onChoisir(v)} style={{ height: 42, border: 0, borderRadius: 11, background: v === valeur ? "var(--surface)" : "transparent", boxShadow: v === valeur ? "0 1px 3px rgba(0,0,0,.15)" : "none", color: "var(--ink)", font: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
          {l}
        </button>
      ))}
    </div>
  );
}

function JoursChoix({ jours, setJours, couleur, multiple }) {
  return (
    <div role="group" aria-label="Jours" style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4 }}>
      {COURTS.map((l, k) => {
        const on = jours.includes(k);
        return (
          <button
            key={l}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={on}
            aria-label={JOURS[k]}
            onClick={() => setJours(multiple ? (on ? jours.filter((x) => x !== k) : [...jours, k]) : [k])}
            style={{ height: 42, borderRadius: 11, border: 0, background: on ? couleur[0] : "var(--fond-gris)", color: on ? couleur[1] : "var(--slate)", font: "inherit", fontSize: 12, fontWeight: 900, cursor: "pointer" }}
          >
            {l.slice(0, 1)}
          </button>
        );
      })}
    </div>
  );
}

// Fiche d'un cours : ajout (court, plusieurs jours) ou modification (un jour).
function FicheCours({ cours, depart, recents, params, onClose, onCreer, onMaj, onSupprimer }) {
  const c = cours ? lireCreneau(cours.detail) : null,
    p = cours ? periode(cours) : null,
    [nom, setNom] = React.useState(cours ? nomCours(cours.titre) : ""),
    [type, setType] = React.useState(cours ? (cours.groupe === "sport" ? "sport" : "cours") : "cours"),
    [jours, setJours] = React.useState(cours ? [c.jour] : [depart.jour]),
    [debut, setDebut] = React.useState(cours ? c.debut : String(depart.heure).padStart(2, "0") + ":00"),
    [fin, setFin] = React.useState(cours ? c.fin : String(Math.min(23, depart.heure + 1)).padStart(2, "0") + ":00"),
    [plus, setPlus] = React.useState(!!cours),
    [emoji, setEmoji] = React.useState(cours ? cours.emoji || "" : ""),
    [lieu, setLieu] = React.useState(cours ? cours.extra || "" : ""),
    [de, setDe] = React.useState(p ? p[0] : ""),
    [a, setA] = React.useState(p ? p[1] : ""),
    [confirmer, setConfirmer] = React.useState(false),
    [erreur, setErreur] = React.useState("");
  const coul = couleurType(params, type);
  function reprendre(r) {
    const x = lireCreneau(r.detail);
    setNom(nomCours(r.titre)), setType(r.groupe === "sport" ? "sport" : "cours"), setEmoji(r.emoji || ""), setLieu(r.extra || "");
    if (x.debut) setDebut(x.debut), setFin(x.fin);
  }
  async function enregistrer() {
    if (!nom.trim()) return setErreur("Donne un nom.");
    if (!jours.length) return setErreur("Choisis au moins un jour.");
    if (!debut || !fin || fin <= debut) return setErreur("L'heure de fin doit être après le début.");
    if ((de && !a) || (!de && a) || (de && a && a < de)) return setErreur("Période : il faut un début et une fin, dans l'ordre.");
    const champs = (j) => ({
      titre: (type === "sport" ? "Sport — " : "") + nom.trim(),
      groupe: type === "sport" ? "sport" : cours && cours.groupe && cours.groupe !== "sport" ? cours.groupe : "perso",
      detail: ecrireCreneau({ jour: j, debut, fin }),
      extra: lieu.trim() || null,
      complement: ecrirePeriode(de, a) || (cours && !p ? cours.complement : null),
      emoji: emoji.trim() || null,
    });
    try {
      if (cours) await onMaj(cours.id, champs(jours[0]), "Cours modifié");
      else for (const j of jours) await onCreer("cours", champs(j).groupe, champs(j), jours.length > 1 ? "Cours ajouté (" + COURTS[j].toLowerCase() + ".)" : "Cours ajouté");
      onClose();
    } catch (e) {
      setErreur("Pas enregistré : " + (e.message || e));
    }
  }
  return (
    <KbSheet label={cours ? "Modifier" : "Ajouter · " + JOURS[depart.jour]} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {plus && (
            <input aria-label="Emoji" value={emoji} placeholder="🙂" maxLength={4} onChange={(e) => setEmoji(e.target.value)} style={{ ...champ, width: 54, textAlign: "center", fontSize: 22, padding: 0 }} />
          )}
          <input aria-label="Nom" placeholder={type === "sport" ? "Yoga, course…" : "Anglais, DU…"} value={nom} onChange={(e) => setNom(e.target.value)} style={{ ...champ, borderColor: coul[0], fontSize: 17 }} data-autofocus />
        </div>
        {!cours && recents.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--slate)" }}>Récents :</span>
            {recents.map((r) => (
              <button key={r.id} type="button" onClick={() => reprendre(r)} style={{ height: 34, padding: "0 11px", borderRadius: 99, border: 0, background: "var(--fond-gris)", color: "var(--ink)", font: "inherit", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                {(r.emoji ? r.emoji + " " : "") + nomCours(r.titre)}
              </button>
            ))}
          </div>
        )}
        <Segment label="Type" items={TYPES.slice(0, 2)} valeur={type} onChoisir={setType} />
        <JoursChoix jours={jours} setJours={setJours} couleur={coul} multiple={!cours} />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="time" aria-label="Début" value={debut} onChange={(e) => setDebut(e.target.value)} style={{ ...champ, textAlign: "center" }} />
          <span style={{ fontWeight: 800, color: "var(--slate)" }}>→</span>
          <input type="time" aria-label="Fin" value={fin} onChange={(e) => setFin(e.target.value)} style={{ ...champ, textAlign: "center" }} />
        </div>
        <button type="button" onClick={() => setPlus(!plus)} style={{ border: 0, background: "transparent", padding: 0, textAlign: "left", font: "inherit", fontSize: 14, fontWeight: 800, color: "var(--t-teal)", cursor: "pointer" }}>
          {plus ? "▾ Moins d'options" : "▸ Plus d'options (emoji, lieu, période)"}
        </button>
        {plus && (
          <>
            <label style={etiquette}>
              Lieu
              <input value={lieu} placeholder="Adresse, visio…" onChange={(e) => setLieu(e.target.value)} style={champ} />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <label style={etiquette}>
                Du
                <input type="date" value={de} onChange={(e) => setDe(e.target.value)} style={champ} />
              </label>
              <label style={etiquette}>
                Au
                <input type="date" value={a} onChange={(e) => setA(e.target.value)} style={champ} />
              </label>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--slate)", marginTop: -6 }}>Sans période, le cours revient toutes les semaines.</span>
          </>
        )}
        {erreur && (
          <div role="alert" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--t-rouge)" }}>
            {erreur}
          </div>
        )}
        <button type="button" onClick={enregistrer} style={{ height: 52, borderRadius: 16, border: 0, background: coul[0], color: coul[1], font: "inherit", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
          {cours ? "Enregistrer" : jours.length > 1 ? "Ajouter (" + jours.length + " jours)" : "Ajouter"}
        </button>
        {cours &&
          (confirmer ? (
            <button type="button" onClick={async () => (await onSupprimer(cours.id, "Cours supprimé"), onClose())} style={{ height: 46, borderRadius: 14, border: 0, background: "var(--c-rouge)", color: "#ffffff", font: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
              Oui, supprimer ce cours
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmer(true)} style={{ height: 44, borderRadius: 14, border: 0, background: "transparent", color: "var(--t-rouge)", font: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
              Supprimer le cours
            </button>
          ))}
      </div>
    </KbSheet>
  );
}

// Réglages du planning : couleurs par type, horaires du travail jour par jour, plage d'heures, notes.
function ReglagesPlanning({ params, jours, notes, onReglage, onCtMaj, onCtCreer, onCtSupprimer }) {
  const [choixType, setChoixType] = React.useState(null);
  const h0 = Math.round(param(params, "planning_h0", 8)),
    h1 = Math.round(param(params, "planning_h1", 22)),
    travail = param(params, "planning_travail", 1) !== 0;
  const pas = (cle, v, min, max, l) => (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button type="button" aria-label={l + " plus tôt"} disabled={v <= min} onClick={() => onReglage(cle, v - 1, l + " : " + (v - 1) + "h")} style={{ width: 36, height: 36, borderRadius: 10, border: 0, background: "var(--fond-gris)", color: "var(--ink)", fontWeight: 900, cursor: "pointer" }}>
        −
      </button>
      <span style={{ minWidth: 34, textAlign: "center", fontWeight: 800 }}>{v}h</span>
      <button type="button" aria-label={l + " plus tard"} disabled={v >= max} onClick={() => onReglage(cle, v + 1, l + " : " + (v + 1) + "h")} style={{ width: 36, height: 36, borderRadius: 10, border: 0, background: "var(--fond-gris)", color: "var(--ink)", fontWeight: 900, cursor: "pointer" }}>
        +
      </button>
    </span>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 800 }}>Couleurs</span>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {TYPES.map(([t, l]) => {
            const c = couleurType(params, t);
            return (
              <button key={t} type="button" onClick={() => setChoixType(choixType === t ? null : t)} aria-expanded={choixType === t} style={{ display: "flex", alignItems: "center", gap: 6, border: 0, background: "transparent", padding: 0, font: "inherit", fontSize: 14, fontWeight: 800, color: "var(--ink)", cursor: "pointer" }}>
                {l}
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: c[0], border: "2px solid " + (choixType === t ? "var(--ink)" : "transparent") }} />
              </button>
            );
          })}
        </div>
        {choixType && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {PALETTE.map((c, i) => (
              <button key={i} type="button" aria-label={c[2]} onClick={() => (onReglage("couleur_" + choixType, i, "Couleur " + choixType + " : " + c[2].toLowerCase()), setChoixType(null))} style={{ width: 34, height: 34, borderRadius: "50%", border: "3px solid var(--surface)", boxShadow: "0 0 0 2px var(--line)", background: c[0], cursor: "pointer" }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 800 }}>Ta semaine type</span>
        {jours.map((j) => (
          <JourType key={j.id} j={j} onCtMaj={onCtMaj} />
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 800 }}>Grille</span>
        {pas("planning_h0", h0, 5, h1 - 4, "Début")}
        {pas("planning_h1", h1, h0 + 4, 24, "Fin")}
      </div>
      <button type="button" role="switch" aria-checked={travail} onClick={() => onReglage("planning_travail", travail ? 0 : 1, travail ? "Travail masqué" : "Travail affiché")} style={{ display: "flex", alignItems: "center", gap: 10, border: 0, background: "transparent", padding: 0, font: "inherit", color: "var(--ink)", cursor: "pointer", minHeight: 40 }}>
        <span style={{ flex: 1, textAlign: "left", fontSize: 14, fontWeight: 800 }}>Afficher le travail</span>
        <span style={{ width: 44, height: 26, borderRadius: 99, background: travail ? "var(--teal-dark)" : "var(--line-strong)", position: "relative" }}>
          <span style={{ position: "absolute", top: 3, left: travail ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "var(--surface)" }} />
        </span>
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 800 }}>Notes « À savoir »</span>
        {notes.map((n) => (
          <NoteEdit key={n.id} n={n} onCtMaj={onCtMaj} onCtSupprimer={onCtSupprimer} />
        ))}
        <button type="button" onClick={() => onCtCreer("note", "planning", { titre: "Nouvelle note" }, "Note ajoutée")} style={{ height: 42, borderRadius: 12, border: "2px dashed var(--bord-teal)", background: "transparent", color: "var(--t-teal)", font: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
          + Note
        </button>
      </div>
    </div>
  );
}

function JourType({ j, onCtMaj }) {
  const [texte, setTexte] = React.useState(j.detail && j.detail !== "—" ? j.detail : "");
  React.useEffect(() => setTexte(j.detail && j.detail !== "—" ? j.detail : ""), [j.detail]);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 1fr", gap: 6, alignItems: "center", paddingBottom: 6, borderBottom: "1px solid var(--line)" }}>
      <span style={{ fontSize: 13, fontWeight: 900, color: "var(--slate)", gridRow: "span 2" }}>{(j.titre || "").slice(0, 3).toUpperCase()}</span>
      <input aria-label={"Journée du " + j.titre} placeholder="Libre" value={texte} onChange={(e) => setTexte(e.target.value)} onBlur={() => texte !== (j.detail === "—" ? "" : j.detail || "") && onCtMaj(j.id, { detail: texte.trim() || "—" }, j.titre + " modifié")} style={{ ...champ, height: 40, fontSize: 14, gridColumn: "span 2" }} />
      <input type="time" aria-label={"Début " + j.titre} value={j.heure_debut || ""} onChange={(e) => onCtMaj(j.id, { heure_debut: e.target.value || null }, j.titre + " : début " + hTexte(e.target.value))} style={{ ...champ, height: 40, fontSize: 14, padding: "0 6px" }} />
      <input type="time" aria-label={"Fin " + j.titre} value={j.heure_fin || ""} onChange={(e) => onCtMaj(j.id, { heure_fin: e.target.value || null }, j.titre + " : fin " + hTexte(e.target.value))} style={{ ...champ, height: 40, fontSize: 14, padding: "0 6px" }} />
    </div>
  );
}

function NoteEdit({ n, onCtMaj, onCtSupprimer }) {
  const [t, setT] = React.useState(n.titre || "");
  React.useEffect(() => setT(n.titre || ""), [n.titre]);
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
      <textarea aria-label="Note" value={t} rows={2} onChange={(e) => setT(e.target.value)} onBlur={() => t !== n.titre && onCtMaj(n.id, { titre: t }, "Note modifiée")} style={{ ...champ, height: "auto", padding: 10, fontSize: 14, fontWeight: 600, resize: "vertical" }} />
      <button type="button" aria-label="Supprimer la note" onClick={() => onCtSupprimer(n.id, "Note supprimée")} style={{ width: 40, height: 40, flex: "none", borderRadius: 10, border: 0, background: "var(--fond-gris)", color: "var(--slate)", fontSize: 16, cursor: "pointer" }}>
        ×
      </button>
    </div>
  );
}

export function PlanningGrille({ rows, params, seances, partenaires, echanges, readOnly, onCtCreer, onCtMaj, onCtSupprimer, onSeance, onReglage }) {
  const [semaine, setSemaine] = React.useState(0),
    [sel, setSel] = React.useState(null),
    [fiche, setFiche] = React.useState(null),
    [reglagesOuverts, setReglagesOuverts] = React.useState(false),
    [terminesOuverts, setTerminesOuverts] = React.useState(false);
  const auj = new Date(),
    aujIso = iso(auj),
    lundi = lundiDe(auj);
  lundi.setDate(lundi.getDate() + semaine * 7);
  const dates = Array.from({ length: 7 }, (_, i) => new Date(lundi.getFullYear(), lundi.getMonth(), lundi.getDate() + i)),
    isos = dates.map(iso),
    jourAuj = isos.indexOf(aujIso),
    h0 = Math.round(param(params, "planning_h0", 8)),
    h1 = Math.max(h0 + 4, Math.round(param(params, "planning_h1", 22))),
    travailVisible = param(params, "planning_travail", 1) !== 0,
    cTravail = couleurType(params, "travail"),
    cCours = couleurType(params, "cours"),
    cSport = couleurType(params, "sport"),
    jours = contenuDe(rows, "jour"),
    cours = contenuDe(rows, "cours"),
    notes = contenuDe(rows, "note").filter((x) => x.groupe === "planning"),
    conflits = chevauchements(creneauxCours(cours)),
    actifLe = (c, dIso) => {
      const p = periode(c);
      return !p || (p[0] <= dIso && p[1] >= dIso);
    },
    termines = cours.filter((c) => {
      const p = periode(c);
      return p && p[1] < aujIso;
    }),
    recents = [...cours]
      .filter((c) => !termines.includes(c))
      .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")))
      .filter((c, i, l) => l.findIndex((x) => nomCours(x.titre) === nomCours(c.titre)) === i)
      .slice(0, 4),
    y = (h) => (Math.max(h0, Math.min(h1, h)) - h0) * PX;

  // Blocs de chaque jour : travail en fond, cours et sport par-dessus (côte à côte s'ils se croisent).
  const colonnes = dates.map((d, j) => {
    const dIso = isos[j],
      fond = [],
      blocs = [];
    if (travailVisible)
      jours
        .filter((x) => (x.titre || "").trim().toLowerCase() === JOURS[j].toLowerCase() && x.heure_debut && x.heure_fin)
        .forEach((x) =>
          fond.push({ cle: "t" + x.id, type: "travail", ref: x, de: heureNum(x.heure_debut), a: heureNum(x.heure_fin), titre: (x.detail || "Travail").replace(/\s*\(.*$/, "").replace(/\s*·.*$/, "") }),
        );
    (partenaires || []).forEach((p) =>
      plagesLibres(cours, p.cours)
        .filter((l) => l.jour === j)
        .forEach((l) => fond.push({ cle: "l" + p.echange_id + l.label, type: "libre", ref: p, de: l.debut, a: l.fin, titre: "Libre", label: l.label })),
    );
    cours
      .map((c) => ({ c, ...lireCreneau(c.detail) }))
      .filter((x) => x.jour === j && x.debut && actifLe(x.c, dIso))
      .forEach((x) => blocs.push({ cle: "c" + x.c.id, type: x.c.groupe === "sport" ? "sport" : "cours", ref: x.c, de: heureNum(x.debut), a: heureNum(x.fin) || heureNum(x.debut) + 1, titre: nomCours(x.c.titre), emoji: x.c.emoji }));
    blocs.sort((a, b) => a.de - b.de);
    // voies : un bloc qui en croise un autre se met à côté
    const fins = [];
    blocs.forEach((b) => {
      let v = fins.findIndex((f) => f <= b.de);
      if (v < 0) v = fins.length;
      fins[v] = b.a;
      b.voie = v;
    });
    blocs.forEach((b) => (b.voies = Math.max(1, ...blocs.filter((o) => o.de < b.a && o.a > b.de).map((o) => o.voie + 1))));
    return { fond, blocs };
  });

  const fait = (dIso, id) => (seances || []).some((s) => s.date === dIso && s.cours_id === id && s.fait),
    styleDe = (t) => (t === "sport" ? cSport : t === "travail" ? cTravail : cCours);

  // Carte du bloc touché
  let detail = null;
  if (sel && sel.type !== "vide") {
    const d = dates[sel.jour],
      quand = JOURS[sel.jour] + " " + dateCourte(d);
    if (sel.type === "libre") detail = { couleur: ["var(--vert-doux)", "var(--t-vert)"], quand, titre: "🔁 Libre avec " + sel.ref.prenom, texte: "Aucune de vous deux n'a cours " + sel.label.split(" ")[1] + "." };
    else if (sel.type === "travail") detail = { couleur: cTravail, quand, titre: sel.ref.detail || "Travail", texte: hTexte(sel.ref.heure_debut) + " – " + hTexte(sel.ref.heure_fin), travail: true };
    else {
      const c = sel.ref,
        x = lireCreneau(c.detail),
        p = periode(c);
      let barre = null;
      if (p) {
        const t0 = new Date(p[0] + "T00:00:00").getTime(),
          t1 = new Date(p[1] + "T00:00:00").getTime();
        barre = { pct: Math.max(0, Math.min(100, ((auj.getTime() - t0) / Math.max(1, t1 - t0)) * 100)), fin: "fin le " + dateCourte(new Date(p[1] + "T00:00:00")) };
      }
      detail = {
        couleur: styleDe(sel.type),
        quand,
        titre: (c.emoji ? c.emoji + " " : "") + nomCours(c.titre),
        texte: hTexte(x.debut) + " – " + hTexte(x.fin) + (c.extra ? " · 📍 " + c.extra : ""),
        barre,
        cours: c,
        sport: sel.type === "sport",
        dIso: isos[sel.jour],
      };
    }
  }

  const titreSemaine = semaine === 0 ? "Ma semaine" : semaine === 1 ? "Semaine prochaine" : semaine === -1 ? "Semaine dernière" : "Semaine du " + dateCourte(dates[0]);
  const boutonNav = (l, aria, f) => (
    <button type="button" aria-label={aria} onClick={f} style={{ width: 44, height: 44, borderRadius: 14, border: 0, background: "var(--surface)", color: "var(--ink)", fontSize: 22, fontWeight: 800, boxShadow: "0 1px 2px rgba(14,58,66,.1)", cursor: "pointer" }}>
      {l}
    </button>
  );

  return (
    <section className="sec">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
        {boutonNav("‹", "Semaine précédente", () => (setSemaine(semaine - 1), setSel(null)))}
        <button type="button" onClick={() => (setSemaine(0), setSel(null))} style={{ border: 0, background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", font: "inherit", color: "var(--ink)", cursor: "pointer" }}>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700 }}>{titreSemaine}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--slate)" }}>
            {dateCourte(dates[0])} – {dateCourte(dates[6])}
            {semaine !== 0 ? " · revenir à aujourd'hui" : ""}
          </span>
        </button>
        {boutonNav("›", "Semaine suivante", () => (setSemaine(semaine + 1), setSel(null)))}
      </div>

      <div style={{ ...carte, padding: "10px 8px 12px 0", boxShadow: "0 2px 10px rgba(14,58,66,.08)" }} aria-label="Agenda de la semaine">
        <div style={{ display: "grid", gridTemplateColumns: "34px repeat(7, minmax(0, 1fr))", gap: 3, marginBottom: 6 }}>
          <span />
          {dates.map((d, j) => (
            <span key={j} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 0", borderRadius: 12, background: j === jourAuj ? "var(--entete)" : "transparent", color: j === jourAuj ? "#ffffff" : "var(--ink)" }}>
              <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".04em" }}>{COURTS[j]}</span>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>{d.getDate()}</span>
            </span>
          ))}
        </div>
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "34px repeat(7, minmax(0, 1fr))", columnGap: 3, height: (h1 - h0) * PX }}>
          <div style={{ position: "relative" }}>
            {Array.from({ length: Math.floor((h1 - h0) / 2) + 1 }, (_, k) => h0 + k * 2).map((h) => (
              <span key={h} style={{ position: "absolute", top: y(h), right: 6, fontSize: 11, fontWeight: 800, color: "var(--slate-light)", transform: "translateY(-50%)" }}>
                {h}h
              </span>
            ))}
          </div>
          {colonnes.map((col, j) => (
            <div key={j} style={{ position: "relative", borderRadius: 10, background: j === jourAuj ? "var(--teal-doux)" : "var(--fond-doux)" }}>
              {!readOnly &&
                Array.from({ length: h1 - h0 }, (_, k) => h0 + k).map((h) => (
                  <button
                    key={h}
                    type="button"
                    aria-label={"Ajouter " + JOURS[j] + " " + h + "h"}
                    onClick={() => setFiche({ depart: { jour: j, heure: h } })}
                    style={{ position: "absolute", left: 0, right: 0, top: y(h), height: PX, border: 0, background: "transparent", padding: 0, cursor: "pointer" }}
                  />
                ))}
              {col.fond.map((b) => {
                const st = b.type === "libre" ? null : styleDe(b.type),
                  on = sel && sel.cle === b.cle && sel.jour === j;
                return (
                  <button
                    key={b.cle}
                    type="button"
                    aria-label={b.titre + ", " + JOURS[j]}
                    onClick={() => setSel({ ...b, jour: j })}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: y(b.de) + 1,
                      height: Math.max(14, y(b.a) - y(b.de) - 2),
                      borderRadius: 9,
                      border: b.type === "libre" ? "2px dashed var(--c-vert)" : on ? "3px solid var(--ink)" : 0,
                      background: b.type === "libre" ? "transparent" : st[0],
                      color: b.type === "libre" ? "var(--t-vert)" : st[1],
                      opacity: b.type === "travail" ? 0.85 : 1,
                      pointerEvents: b.type === "libre" ? "none" : "auto",
                      padding: "4px 2px",
                      fontSize: 10.5,
                      fontWeight: 900,
                      lineHeight: 1.15,
                      overflow: "hidden",
                      cursor: "pointer",
                      boxSizing: "border-box",
                    }}
                  >
                    {b.titre}
                  </button>
                );
              })}
              {col.blocs.map((b) => {
                const st = styleDe(b.type),
                  on = sel && sel.cle === b.cle && sel.jour === j,
                  coche = b.type === "sport" && fait(isos[j], b.ref.id);
                return (
                  <button
                    key={b.cle}
                    type="button"
                    aria-label={b.titre + ", " + JOURS[j] + " " + hTexte(lireCreneau(b.ref.detail).debut) + (coche ? ", fait" : "")}
                    onClick={() => setSel({ ...b, jour: j })}
                    style={{
                      position: "absolute",
                      left: (b.voie / b.voies) * 100 + "%",
                      width: 100 / b.voies + "%",
                      top: y(b.de) + 1,
                      height: Math.max(18, y(b.a) - y(b.de) - 2),
                      borderRadius: 9,
                      border: on ? "3px solid var(--ink)" : "1px solid var(--surface)",
                      background: st[0],
                      color: st[1],
                      padding: "4px 0",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                      overflow: "hidden",
                      boxShadow: "0 3px 8px rgba(0,0,0,.18)",
                      cursor: "pointer",
                      boxSizing: "border-box",
                      zIndex: 2,
                    }}
                  >
                    {b.emoji && <span style={{ fontSize: 13, lineHeight: 1 }}>{b.emoji}</span>}
                    <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "-.02em", lineHeight: 1.15, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", maxWidth: "100%" }}>{nomGrille(b.ref.titre)}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.92 }}>{hTexte(lireCreneau(b.ref.detail).debut)}</span>
                    {coche && <span style={{ fontSize: 12, fontWeight: 900 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          ))}
          {jourAuj >= 0 && auj.getHours() + auj.getMinutes() / 60 >= h0 && auj.getHours() < h1 && (
            <div aria-hidden="true" style={{ position: "absolute", left: 34, right: 0, top: y(auj.getHours() + auj.getMinutes() / 60), height: 2, background: "var(--c-rouge)", pointerEvents: "none", zIndex: 3 }}>
              <span style={{ position: "absolute", left: -4, top: -3, width: 8, height: 8, borderRadius: "50%", background: "var(--c-rouge)" }} />
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 12, fontSize: 12.5, fontWeight: 800, color: "var(--ink-soft)" }}>
          {[
            ["Travail", cTravail[0], false, travailVisible],
            ["Cours", cCours[0], false, true],
            ["Sport", cSport[0], false, true],
            ["Libre ensemble", "var(--c-vert)", true, (partenaires || []).length > 0],
          ]
            .filter((x) => x[3])
            .map(([l, c, pointille]) => (
              <span key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: pointille ? "transparent" : c, border: pointille ? "2px dashed " + c : 0, boxSizing: "border-box" }} />
                {l}
              </span>
            ))}
        </div>
      </div>

      {!readOnly && !jours.some((x) => x.heure_debut) && (
        <button type="button" onClick={() => setReglagesOuverts(true)} style={{ ...carte, width: "100%", marginTop: 10, border: "2px dashed var(--bord-teal)", padding: "12px 14px", textAlign: "left", font: "inherit", fontSize: 14, fontWeight: 800, color: "var(--t-teal)", cursor: "pointer" }}>
          💼 Ajoute tes horaires de travail pour les voir dans la grille
        </button>
      )}

      {detail && (
        <div style={{ marginTop: 12, borderRadius: 22, padding: 16, display: "flex", flexDirection: "column", gap: 6, background: detail.couleur[0], color: detail.couleur[1] }}>
          <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", opacity: 0.9 }}>{detail.quand}</span>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 23, fontWeight: 700 }}>{detail.titre}</span>
          <span style={{ fontSize: 15, fontWeight: 700, opacity: 0.95 }}>{detail.texte}</span>
          {detail.barre && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
              <span style={{ flex: 1, height: 8, borderRadius: 99, background: "rgba(255,255,255,.3)", overflow: "hidden" }}>
                <span style={{ display: "block", height: 8, width: detail.barre.pct + "%", background: "#ffffff", borderRadius: 99 }} />
              </span>
              <span style={{ fontSize: 13, fontWeight: 800 }}>{detail.barre.fin}</span>
            </div>
          )}
          {!readOnly && (detail.cours || detail.travail) && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
              {detail.sport && detail.dIso <= aujIso && (
                <button type="button" onClick={() => onSeance({ date: detail.dIso, cours_id: detail.cours.id })} style={{ height: 42, padding: "0 14px", borderRadius: 12, border: 0, background: fait(detail.dIso, detail.cours.id) ? "#ffffff" : "rgba(255,255,255,.22)", color: fait(detail.dIso, detail.cours.id) ? cSport[0] : "#ffffff", font: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                  {fait(detail.dIso, detail.cours.id) ? "✓ J'y suis allée" : "J'y suis allée ?"}
                </button>
              )}
              <button type="button" onClick={() => (detail.travail ? setReglagesOuverts(true) : setFiche({ cours: detail.cours }))} style={{ height: 42, padding: "0 14px", borderRadius: 12, border: 0, background: "rgba(255,255,255,.22)", color: "inherit", font: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                ✏️ Modifier
              </button>
            </div>
          )}
        </div>
      )}

      {echanges}

      {conflits.length > 0 && (
        <div role="alert" style={{ marginTop: 12, background: "var(--rouge-doux)", borderRadius: 18, padding: "12px 14px", display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 22 }}>⚠️</span>
          <span style={{ flex: 1, fontSize: 14.5, fontWeight: 800, color: "var(--t-rouge)" }}>Chevauchement : {conflits.join(" · ")}</span>
        </div>
      )}
      {notes.map((n) => (
        <div key={n.id} style={{ marginTop: 12, background: n.extra === "red" ? "var(--orange-doux)" : "var(--surface)", borderRadius: 18, padding: "12px 14px", display: "flex", gap: 10, alignItems: "center", boxShadow: n.extra === "red" ? "none" : "0 1px 2px rgba(14,58,66,.08)" }}>
          <span style={{ fontSize: 20 }}>{n.extra === "red" ? "⚠️" : "📝"}</span>
          <span style={{ flex: 1, fontSize: 14.5, fontWeight: 800, color: n.extra === "red" ? "var(--t-orange)" : "var(--ink)" }}>{n.titre}</span>
        </div>
      ))}

      {!readOnly && (
        <button type="button" onClick={() => setFiche({ depart: { jour: jourAuj >= 0 ? jourAuj : 0, heure: 19 } })} style={{ width: "100%", marginTop: 12, height: 54, borderRadius: 18, border: 0, background: cCours[0], color: cCours[1], font: "inherit", fontSize: 16, fontWeight: 800, boxShadow: "0 6px 16px rgba(10,123,138,.22)", cursor: "pointer" }}>
          + Ajouter un cours
        </button>
      )}

      {!readOnly && (
        <div style={{ display: "grid", gridTemplateColumns: termines.length ? "1fr 1fr" : "1fr", gap: 8, marginTop: 10 }}>
          <button type="button" aria-expanded={reglagesOuverts} onClick={() => setReglagesOuverts(!reglagesOuverts)} style={{ ...carte, border: 0, height: 46, font: "inherit", fontSize: 13.5, fontWeight: 800, color: "var(--ink-soft)", cursor: "pointer" }}>
            ⚙️ Réglages du planning
          </button>
          {termines.length > 0 && (
            <button type="button" aria-expanded={terminesOuverts} onClick={() => setTerminesOuverts(!terminesOuverts)} style={{ ...carte, border: 0, height: 46, font: "inherit", fontSize: 13.5, fontWeight: 800, color: "var(--ink-soft)", cursor: "pointer" }}>
              🗂 Cours terminés ({termines.length})
            </button>
          )}
        </div>
      )}
      {!readOnly && reglagesOuverts && (
        <div style={{ ...carte, marginTop: 10, padding: 14 }}>
          <ReglagesPlanning params={params} jours={jours} notes={notes} onReglage={onReglage} onCtMaj={onCtMaj} onCtCreer={onCtCreer} onCtSupprimer={onCtSupprimer} />
        </div>
      )}
      {!readOnly && terminesOuverts && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {termines.map((c) => (
            <button key={c.id} type="button" onClick={() => setFiche({ cours: c })} style={{ ...carte, border: 0, padding: "12px 14px", textAlign: "left", font: "inherit", color: "var(--ink)", cursor: "pointer" }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{(c.emoji ? c.emoji + " " : "") + nomCours(c.titre)}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--slate)" }}>
                {c.detail} · {c.complement}
              </div>
            </button>
          ))}
        </div>
      )}

      {fiche && (
        <FicheCours
          cours={fiche.cours || null}
          depart={fiche.depart || { jour: 0, heure: 19 }}
          recents={recents}
          params={params}
          onClose={() => (setFiche(null), setSel(null))}
          onCreer={onCtCreer}
          onMaj={onCtMaj}
          onSupprimer={onCtSupprimer}
        />
      )}
    </section>
  );
}
