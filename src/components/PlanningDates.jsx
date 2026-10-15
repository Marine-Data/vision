import React from "react";
import { KbSheet } from "./kanban/communs.jsx";
import { CATEGORIES, MASQUES, emojiDe, listeDates } from "../lib/evenements.js";
import { ChoixMatiere, propositionMatiere } from "./PlanningPrix.jsx";

// Planning étape 2 : fiche d'un événement à certaines dates (calendrier à cocher)
// et fiche d'une pause (du … au …, ce qui s'arrête).

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const MOIS_C = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const JC = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
const iso = (a, m, j) => a + "-" + String(m + 1).padStart(2, "0") + "-" + String(j).padStart(2, "0");
const deIso = (s) => new Date(s + "T12:00:00");
export const dateLongue = (s) => {
  const d = deIso(s);
  return JC[(d.getDay() + 6) % 7] + " " + d.getDate() + " " + MOIS_C[d.getMonth()];
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
const lien = { border: 0, background: "transparent", padding: 0, textAlign: "left", font: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" };

export function Interrupteur({ on, onClick, label, couleur }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, border: 0, background: "transparent", padding: 0, font: "inherit", color: "var(--ink)", cursor: "pointer", minHeight: 40, width: "100%" }}>
      <span style={{ flex: 1, textAlign: "left", fontSize: 14, fontWeight: 800 }}>{label}</span>
      <span style={{ width: 44, height: 26, borderRadius: 99, background: on ? couleur : "var(--line-strong)", position: "relative", flex: "none" }}>
        <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "var(--surface)" }} />
      </span>
    </button>
  );
}

// « Chaque semaine » / « Certaines dates » en haut de la fiche d'ajout.
export function ChoixRepetition({ valeur, onChoisir }) {
  return (
    <div role="radiogroup" aria-label="Répétition" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: 4, borderRadius: 14, background: "var(--fond-gris)" }}>
      {[
        ["semaine", "🔁 Chaque semaine"],
        ["dates", "📌 Certaines dates"],
      ].map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={v === valeur} onClick={() => onChoisir(v)} style={{ height: 42, border: 0, borderRadius: 11, background: v === valeur ? "var(--surface)" : "transparent", boxShadow: v === valeur ? "0 1px 3px rgba(0,0,0,.15)" : "none", color: "var(--ink)", font: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
          {l}
        </button>
      ))}
    </div>
  );
}

function Calendrier({ choisies, setChoisies, couleur, depart }) {
  const d0 = deIso(choisies[0] || depart),
    [vue, setVue] = React.useState([d0.getFullYear(), d0.getMonth()]),
    [an, mo] = vue,
    decal = (new Date(an, mo, 1).getDay() + 6) % 7,
    nb = new Date(an, mo + 1, 0).getDate(),
    cases = Array.from({ length: Math.ceil((decal + nb) / 7) * 7 }, (_, k) => k - decal + 1),
    bouger = (n) => {
      const d = new Date(an, mo + n, 1);
      setVue([d.getFullYear(), d.getMonth()]);
    };
  const nav = (l, aria, n) => (
    <button type="button" aria-label={aria} onClick={() => bouger(n)} style={{ width: 42, height: 42, borderRadius: 12, border: 0, background: "var(--fond-gris)", color: "var(--ink)", fontSize: 18, fontWeight: 800, cursor: "pointer" }}>
      {l}
    </button>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {nav("‹", "Mois précédent", -1)}
        <span style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700 }}>
          {MOIS[mo]} {an}
        </span>
        {nav("›", "Mois suivant", 1)}
      </div>
      <div role="group" aria-label="Dates" style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4, textAlign: "center" }}>
        {["L", "M", "M", "J", "V", "S", "D"].map((l, k) => (
          <span key={k} aria-hidden="true" style={{ fontSize: 11, fontWeight: 900, color: "var(--slate-light)" }}>
            {l}
          </span>
        ))}
        {cases.map((j, k) => {
          if (j < 1 || j > nb) return <span key={k} />;
          const cle = iso(an, mo, j),
            on = choisies.includes(cle);
          return (
            <button
              key={k}
              type="button"
              role="checkbox"
              aria-checked={on}
              aria-label={dateLongue(cle)}
              onClick={() => setChoisies(on ? choisies.filter((x) => x !== cle) : [...choisies, cle].sort())}
              style={{ height: 40, borderRadius: 12, border: 0, background: on ? couleur[0] : "var(--fond-doux)", color: on ? couleur[1] : "var(--ink)", font: "inherit", fontSize: 15, fontWeight: 800, padding: 0, cursor: "pointer" }}
            >
              {j}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Fiche d'un événement à dates : ajout (depuis une case de la grille) ou modification.
export function FicheEvenement({ ev, depart, couleurDe, onClose, onCreer, onMaj, onSupprimer, onRepetition, matieres = [], onNouvelleMatiere, prix }) {
  const [categorie, setCategorie] = React.useState(ev ? ev.categorie : "rdv"),
    [nom, setNom] = React.useState(ev ? ev.titre : ""),
    [emoji, setEmoji] = React.useState(ev ? ev.emoji || "" : ""),
    [choisies, setChoisies] = React.useState(ev ? listeDates(ev) : depart.date ? [depart.date] : []),
    [debut, setDebut] = React.useState(ev ? ev.heure_debut || "" : String(depart.heure ?? 9).padStart(2, "0") + ":00"),
    [fin, setFin] = React.useState(ev ? ev.heure_fin || "" : String(Math.min(23, (depart.heure ?? 9) + 1)).padStart(2, "0") + ":00"),
    [horaires, setHoraires] = React.useState(ev ? ev.horaires || {} : {}),
    [parJour, setParJour] = React.useState(!!(ev && Object.keys(ev.horaires || {}).length)),
    [lieu, setLieu] = React.useState(ev ? ev.lieu || "" : ""),
    [rappel, setRappel] = React.useState(ev ? ev.rappel !== false : true),
    [matiere, setMatiere] = React.useState(ev ? ev.matiere || (ev.categorie === "formation" ? propositionMatiere(ev.titre, matieres) : null) : null),
    [confirmer, setConfirmer] = React.useState(false),
    [erreur, setErreur] = React.useState("");
  const coul = couleurDe(categorie),
    hj = (d) => horaires[d] || [debut, fin];
  async function enregistrer() {
    if (!nom.trim()) return setErreur("Donne un nom.");
    if (!choisies.length) return setErreur("Touche au moins une date dans le calendrier.");
    if (debut && fin && fin <= debut) return setErreur("L'heure de fin doit être après le début.");
    const h = {};
    if (parJour)
      for (const d of choisies) {
        const [a, b] = hj(d);
        if (a && b && b <= a) return setErreur(dateLongue(d) + " : la fin doit être après le début.");
        if (a !== debut || b !== fin) h[d] = [a || null, b || null];
      }
    const champs = {
      genre: "evenement",
      categorie,
      titre: nom.trim(),
      emoji: emoji.trim() || null,
      dates: choisies,
      heure_debut: debut || null,
      heure_fin: fin || null,
      horaires: h,
      lieu: lieu.trim() || null,
      rappel,
      matiere: categorie === "sport" ? null : matiere || null,
      annulees: ev ? (ev.annulees || []).map(String).filter((x) => choisies.includes(x)) : [],
    };
    try {
      if (ev) await onMaj(ev.id, champs, "Modifié pour toutes les dates");
      else await onCreer(champs, choisies.length > 1 ? choisies.length + " dates ajoutées" : "Date ajoutée");
      onClose();
    } catch (e) {
      setErreur("Pas enregistré : " + (e.message || e));
    }
  }
  return (
    <KbSheet label={ev ? "Modifier · toutes les dates" : "Ajouter · certaines dates"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!ev && <ChoixRepetition valeur="dates" onChoisir={(v) => v === "semaine" && onRepetition()} />}
        <div style={{ display: "flex", gap: 8 }}>
          <input aria-label="Emoji" value={emoji} placeholder={emojiDe({ categorie })} maxLength={4} onChange={(e) => setEmoji(e.target.value)} style={{ ...champ, width: 54, textAlign: "center", fontSize: 22, padding: 0, flex: "none" }} />
          <input aria-label="Nom" placeholder="DU, dentiste, stage…" value={nom} onChange={(e) => setNom(e.target.value)} style={{ ...champ, borderColor: coul[0], fontSize: 17 }} data-autofocus />
        </div>
        <div role="radiogroup" aria-label="Type" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: 4, borderRadius: 14, background: "var(--fond-gris)" }}>
          {CATEGORIES.map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={v === categorie} onClick={() => setCategorie(v)} style={{ height: 40, border: 0, borderRadius: 11, background: v === categorie ? "var(--surface)" : "transparent", boxShadow: v === categorie ? "0 1px 3px rgba(0,0,0,.15)" : "none", color: "var(--ink)", font: "inherit", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>
              {l}
            </button>
          ))}
        </div>
        <Calendrier choisies={choisies} setChoisies={setChoisies} couleur={coul} depart={depart.date || new Date().toISOString().slice(0, 10)} />
        <span style={{ fontSize: 13.5, fontWeight: 800, color: choisies.length ? "var(--ink-soft)" : "var(--slate)" }}>
          {choisies.length ? choisies.map(dateLongue).join(" · ") : "Touche les jours dans le calendrier"}
        </span>
        {!parJour && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="time" aria-label="Début" value={debut} onChange={(e) => setDebut(e.target.value)} style={{ ...champ, textAlign: "center" }} />
            <span style={{ fontWeight: 800, color: "var(--slate)" }}>→</span>
            <input type="time" aria-label="Fin" value={fin} onChange={(e) => setFin(e.target.value)} style={{ ...champ, textAlign: "center" }} />
          </div>
        )}
        {choisies.length > 1 && (
          <button type="button" onClick={() => setParJour(!parJour)} style={{ ...lien, color: coul[0] === "var(--line-strong)" ? "var(--ink)" : coul[0] }}>
            {parJour ? "▾ Mêmes horaires partout" : "▸ Horaires différents selon le jour"}
          </button>
        )}
        {parJour &&
          choisies.map((d) => {
            const [a, b] = hj(d);
            return (
              <div key={d} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 108px 10px 108px", gap: 6, alignItems: "center", fontSize: 14, fontWeight: 800 }}>
                <span>{dateLongue(d)}</span>
                <input type="time" aria-label={"Début " + dateLongue(d)} value={a || ""} onChange={(e) => setHoraires({ ...horaires, [d]: [e.target.value, b] })} style={{ ...champ, height: 40, fontSize: 14, padding: "0 4px" }} />
                <span style={{ color: "var(--slate)" }}>→</span>
                <input type="time" aria-label={"Fin " + dateLongue(d)} value={b || ""} onChange={(e) => setHoraires({ ...horaires, [d]: [a, e.target.value] })} style={{ ...champ, height: 40, fontSize: 14, padding: "0 4px" }} />
              </div>
            );
          })}
        <label style={etiquette}>
          📍 Lieu
          <input value={lieu} placeholder="Adresse, visio…" onChange={(e) => setLieu(e.target.value)} style={champ} />
        </label>
        <Interrupteur on={rappel} onClick={() => setRappel(!rappel)} label="🔔 Rappel la veille" couleur={coul[0]} />
        {categorie !== "sport" && onNouvelleMatiere && <ChoixMatiere valeur={matiere} setValeur={setMatiere} matieres={matieres} couleur={coul} onNouvelle={onNouvelleMatiere} />}
        {ev && prix ? prix(ev, coul) : !ev && <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--slate)" }}>💶 Le prix se relie au Budget après l'ajout (✏️ Toutes les dates).</span>}
        {erreur && (
          <div role="alert" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--t-rouge)" }}>
            {erreur}
          </div>
        )}
        <button type="button" onClick={enregistrer} style={{ height: 52, borderRadius: 16, border: 0, background: coul[0], color: coul[1], font: "inherit", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
          {ev ? "Enregistrer" : choisies.length > 1 ? "Ajouter " + choisies.length + " dates" : "Ajouter"}
        </button>
        {ev &&
          (confirmer ? (
            <button type="button" onClick={async () => (await onSupprimer(ev.id, "Supprimé (toutes les dates)"), onClose())} style={{ height: 46, borderRadius: 14, border: 0, background: "var(--c-rouge)", color: "#ffffff", font: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
              Oui, supprimer toutes les dates
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmer(true)} style={{ height: 44, borderRadius: 14, border: 0, background: "transparent", color: "var(--t-rouge)", font: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
              Supprimer (toutes les dates)
            </button>
          ))}
      </div>
    </KbSheet>
  );
}

// Fiche d'une pause : nom, du … au …, ce qui s'arrête.
export function FichePause({ pause, depart, onClose, onCreer, onMaj, onSupprimer }) {
  const [nom, setNom] = React.useState(pause ? pause.titre : ""),
    [de, setDe] = React.useState(pause ? String(pause.date_debut) : depart || ""),
    [a, setA] = React.useState(pause ? String(pause.date_fin) : ""),
    [masque, setMasque] = React.useState(pause ? pause.masque || [] : ["travail", "cours", "sport"]),
    [confirmer, setConfirmer] = React.useState(false),
    [erreur, setErreur] = React.useState("");
  async function enregistrer() {
    if (!nom.trim()) return setErreur("Donne un nom (Vacances de Noël…).");
    if (!de || !a || a < de) return setErreur("Il faut une date de début et une date de fin, dans l'ordre.");
    if (!masque.length) return setErreur("Coche au moins une chose qui s'arrête.");
    const champs = { genre: "pause", titre: nom.trim(), date_debut: de, date_fin: a, masque };
    try {
      if (pause) await onMaj(pause.id, champs, "Pause modifiée");
      else await onCreer(champs, "Pause ajoutée");
      onClose();
    } catch (e) {
      setErreur("Pas enregistré : " + (e.message || e));
    }
  }
  return (
    <KbSheet label={pause ? "Modifier la pause" : "🏖 Pause"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input aria-label="Nom" placeholder="Vacances de Noël…" value={nom} onChange={(e) => setNom(e.target.value)} style={{ ...champ, borderColor: "var(--c-ambre)", fontSize: 17 }} data-autofocus />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <label style={etiquette}>
            Du
            <input type="date" value={de} onChange={(e) => setDe(e.target.value)} style={champ} />
          </label>
          <label style={etiquette}>
            Au (inclus)
            <input type="date" value={a} min={de || undefined} onChange={(e) => setA(e.target.value)} style={champ} />
          </label>
        </div>
        <span style={{ fontSize: 14, fontWeight: 800 }}>Ce qui s'arrête :</span>
        <div role="group" aria-label="Ce qui s'arrête" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6 }}>
          {MASQUES.map(([v, l]) => {
            const on = masque.includes(v);
            return (
              <button key={v} type="button" role="checkbox" aria-checked={on} onClick={() => setMasque(on ? masque.filter((x) => x !== v) : [...masque, v])} style={{ height: 46, borderRadius: 12, border: "2px solid " + (on ? "var(--c-ambre)" : "var(--line)"), background: on ? "var(--ambre-doux)" : "var(--surface)", color: "var(--ink)", font: "inherit", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>
                {(on ? "✓ " : "") + l}
              </button>
            );
          })}
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--slate)" }}>Rien n'est effacé : tout revient après la pause. Les rappels se taisent pendant.</span>
        {erreur && (
          <div role="alert" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--t-rouge)" }}>
            {erreur}
          </div>
        )}
        <button type="button" onClick={enregistrer} style={{ height: 52, borderRadius: 16, border: 0, background: "var(--c-ambre)", color: "#ffffff", font: "inherit", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
          {pause ? "Enregistrer" : "Ajouter la pause"}
        </button>
        {pause &&
          (confirmer ? (
            <button type="button" onClick={async () => (await onSupprimer(pause.id, "Pause supprimée"), onClose())} style={{ height: 46, borderRadius: 14, border: 0, background: "var(--c-rouge)", color: "#ffffff", font: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
              Oui, supprimer la pause
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmer(true)} style={{ height: 44, borderRadius: 14, border: 0, background: "transparent", color: "var(--t-rouge)", font: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
              Supprimer la pause
            </button>
          ))}
      </div>
    </KbSheet>
  );
}
