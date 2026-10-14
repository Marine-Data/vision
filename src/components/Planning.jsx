import React from "react";
import { Fleches } from "./Fleches.jsx";
import { contenuDe } from "../lib/contenu.js";
import { lireCreneau } from "./SportPage.jsx";

const JOURS_PL = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const COURTS_PL = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
const h = (x) => (x ? x.replace(":", "h") : "");
// Période d'un cours (« 30/09 → 09/12/2026 ») : [début, fin] en AAAA-MM-JJ, ou null.
function periode(c) {
  const t = c.complement || "",
    m = t.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\s*→\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const fin = m[6] + "-" + m[5].padStart(2, "0") + "-" + m[4].padStart(2, "0"),
    anDebut = m[3] || (Number(m[2]) > Number(m[5]) ? String(Number(m[6]) - 1) : m[6]);
  return [anDebut + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0"), fin];
}
const nomCours = (t) => (t || "").replace(/^Sport\s*[—-]\s*/, "");
// Créneaux des cours, lus dans « Quand » (même source que l'onglet Sport).
export function creneauxCours(cours) {
  const auj = new Date().toISOString().slice(0, 10);
  return cours
    .map((c) => ({ c, ...lireCreneau(c.detail), p: periode(c) }))
    .filter((x) => x.jour >= 0)
    .map((x) => ({
      ...x,
      actif: !x.p || (x.p[0] <= auj && x.p[1] >= auj) || x.p[0] > auj,
      fini: !!(x.p && x.p[1] < auj),
    }));
}
// Chevauchements : même jour, horaires qui se croisent, périodes qui se croisent.
export function chevauchements(cr) {
  const out = [];
  cr.filter((x) => !x.fini).forEach((a, i, l) =>
    l.slice(i + 1).forEach((b) => {
      if (a.jour !== b.jour) return;
      const heures = !a.debut || !b.debut || !a.fin || !b.fin || (a.debut < b.fin && b.debut < a.fin),
        dates = !a.p || !b.p || (a.p[0] <= b.p[1] && b.p[0] <= a.p[1]);
      heures &&
        dates &&
        out.push(JOURS_PL[a.jour] + " : " + nomCours(a.c.titre) + " et " + nomCours(b.c.titre));
    }),
  );
  return out;
}

export function Planning({
  rows: ctRows,
  edit: ctEdit,
  save: ctSave,
  add: ctAdd,
  del: ctDel,
  move: ctMove,
  readOnly: ro,
  echanges,
}) {
  const [mode, setMode] = React.useState(!1),
    jours = contenuDe(ctRows, "jour"),
    cours = contenuDe(ctRows, "cours"),
    notes = contenuDe(ctRows, "note").filter((x) => x.groupe === "planning"),
    sub = contenuDe(ctRows, "note").find((x) => x.groupe === "planning_sub"),
    cr = creneauxCours(cours),
    conflits = chevauchements(cr),
    duJour = (titreJour) => {
      const k = JOURS_PL.indexOf((titreJour || "").trim().toLowerCase());
      return cr
        .filter((x) => x.jour === k && !x.fini)
        .sort((a, b) => (a.debut || "").localeCompare(b.debut || ""));
    },
    ligneCours = (x) =>
      nomCours(x.c.titre) + (x.debut ? " " + h(x.debut) + (x.fin ? "–" + h(x.fin) : "") : ""),
    resume = cr.filter((x) => !x.fini).length
      ? "Cours : " +
        cr
          .filter((x) => !x.fini)
          .sort((a, b) => a.jour - b.jour)
          .map((x) => nomCours(x.c.titre) + " (" + COURTS_PL[x.jour] + ")")
          .join(", ") +
        "."
      : "",
    champ = (o, k, ph) => (
      <input
        className="bedit"
        style={{
          width: "100%",
        }}
        value={o[k] || ""}
        placeholder={ph}
        onChange={(w) =>
          ctEdit(o.id, {
            [k]: w.target.value,
          })
        }
        onBlur={() => ctSave(o.id)}
      />
    );
  return (
    <section className="sec">
      <h2>Emploi du temps</h2>
      <p className="sub">{sub ? sub.titre : resume}</p>
      {echanges}
      {!ro && (
        <div
          style={{
            margin: "10px 0",
          }}
        >
          <button className="btn-outline btn-sm" onClick={() => setMode(!mode)}>
            {mode ? "✓ Terminer" : "✎ Modifier l'emploi du temps"}
          </button>
        </div>
      )}
      {mode && (
        <div className="editable-hint">
          Champs sur fond gris : clique pour corriger. L'enregistrement est automatique.
        </div>
      )}
      {mode ? (
        <div>
          <div className="h3">Semaine</div>
          <div className="detail" style={{ marginBottom: 6 }}>
            Les cours s'ajoutent tout seuls à leur jour, d'après « Détail des cours ». Ici, seulement le reste
            (travail, repos…).
          </div>
          <div className="card">
            {jours.map((o) => (
              <div
                style={{
                  borderBottom: "1px solid var(--line)",
                  padding: "8px 0",
                }}
                key={o.id}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  <input
                    className="bedit lbl"
                    value={o.titre || ""}
                    placeholder="Jour"
                    onChange={(w) =>
                      ctEdit(o.id, {
                        titre: w.target.value,
                      })
                    }
                    onBlur={() => ctSave(o.id)}
                  />
                  <Fleches
                    nom={o.titre}
                    onUp={() => ctMove(o.id, "jour", -1)}
                    onDown={() => ctMove(o.id, "jour", 1)}
                  />
                  <button className="bdel" onClick={() => ctDel(o.id)} aria-label="Supprimer">
                    ×
                  </button>
                </div>
                {champ(o, "detail", "Journée")}
                {champ(o, "extra", "Soirée")}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    marginTop: 4,
                    color: "var(--slate)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={o.groupe === "fixe"}
                    onChange={(w) => {
                      ctEdit(o.id, {
                        groupe: w.target.checked ? "fixe" : null,
                      }),
                        setTimeout(() => ctSave(o.id), 0);
                    }}
                  />
                  Point fixe (mis en avant)
                </label>
              </div>
            ))}
            <button className="badd" onClick={() => ctAdd("jour")}>
              + Ajouter un jour
            </button>
          </div>
          <div className="h3">Notes</div>
          <div className="card">
            {notes.map((o) => (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  padding: "6px 0",
                }}
                key={o.id}
              >
                {champ(o, "titre", "Note")}
                <button className="bdel" onClick={() => ctDel(o.id)} aria-label="Supprimer">
                  ×
                </button>
              </div>
            ))}
            <button className="badd" onClick={() => ctAdd("note", "planning")}>
              + Ajouter une note
            </button>
          </div>
          <div className="h3">Détail des cours</div>
          <div className="card">
            {cours.map((o) => (
              <div
                style={{
                  borderBottom: "1px solid var(--line)",
                  padding: "8px 0",
                }}
                key={o.id}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  <input
                    className="bedit lbl"
                    value={o.titre || ""}
                    placeholder="Cours"
                    onChange={(w) =>
                      ctEdit(o.id, {
                        titre: w.target.value,
                      })
                    }
                    onBlur={() => ctSave(o.id)}
                  />
                  <Fleches
                    nom={o.titre}
                    onUp={() => ctMove(o.id, "cours", -1)}
                    onDown={() => ctMove(o.id, "cours", 1)}
                  />
                  <button className="bdel" onClick={() => ctDel(o.id)} aria-label="Supprimer">
                    ×
                  </button>
                </div>
                {champ(o, "detail", "Quand")}
                {champ(o, "extra", "Lieu")}
                {champ(o, "complement", "Période")}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    marginTop: 4,
                    color: "var(--slate)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={o.groupe === "sport"}
                    onChange={(w) => {
                      ctEdit(o.id, {
                        groupe: w.target.checked ? "sport" : "scap",
                      }),
                        setTimeout(() => ctSave(o.id), 0);
                    }}
                  />
                  Créneau sport (affiché dans l'onglet Sport)
                </label>
              </div>
            ))}
            <button className="badd" onClick={() => ctAdd("cours", "scap")}>
              + Ajouter un cours
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className="card"
            style={{
              padding: 0,
              overflowX: "auto",
            }}
          >
            <table className="tbl">
              <thead>
                <tr>
                  <th>Jour</th>
                  <th>Journée</th>
                  <th>Soirée</th>
                </tr>
              </thead>
              <tbody>
                {jours.map((t) => {
                  const l = duJour(t.titre),
                    jour = l.filter((x) => !x.debut || x.debut < "17:00"),
                    soir = l.filter((x) => x.debut && x.debut >= "17:00"),
                    vide = (v) => !v || v === "—",
                    cellule = (texte, liste) => (
                      <>
                        {!vide(texte) && <div>{texte}</div>}
                        {liste.map((x) => (
                          <div key={x.c.id} style={{ color: "var(--oxblood)", fontWeight: 600 }}>
                            {ligneCours(x)}
                            {x.p && !x.actif
                              ? " (dès " + x.p[0].slice(8) + "/" + x.p[0].slice(5, 7) + ")"
                              : ""}
                          </div>
                        ))}
                        {vide(texte) && !liste.length && "—"}
                      </>
                    );
                  return (
                    <tr className={t.groupe === "fixe" || l.length ? "total" : ""} key={t.id}>
                      <td>
                        <b>{t.titre}</b>
                      </td>
                      <td>{cellule(t.detail, jour)}</td>
                      <td>{cellule(t.extra, soir)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div
            className={"note" + (conflits.length ? " red" : "")}
            role={conflits.length ? "alert" : undefined}
          >
            {conflits.length
              ? "⚠️ Chevauchement — " + conflits.join(" · ") + "."
              : "✓ Aucun chevauchement entre tes cours."}
          </div>
          {notes.map((t) => (
            <div className={"note" + (t.extra === "red" ? " red" : "")} key={t.id}>
              {t.titre}
            </div>
          ))}
          <div className="h3">Détail des cours — jours, horaires, lieux, dates</div>
          <div
            className="card"
            style={{
              padding: 0,
              overflowX: "auto",
            }}
          >
            <table className="tbl">
              <thead>
                <tr>
                  <th>Cours</th>
                  <th>Quand</th>
                  <th>Lieu</th>
                  <th>Période</th>
                </tr>
              </thead>
              <tbody>
                {cours.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <b>{t.titre}</b>
                    </td>
                    <td>{t.detail}</td>
                    <td className="detail">{t.extra}</td>
                    <td className="detail">{t.complement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
