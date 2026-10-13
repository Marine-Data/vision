import React from "react";
import { Fleches } from "./Fleches.jsx";
import { contenuDe } from "../lib/contenu.js";

export function Planning({
  rows: ctRows,
  edit: ctEdit,
  save: ctSave,
  add: ctAdd,
  del: ctDel,
  move: ctMove,
  readOnly: ro,
}) {
  const [mode, setMode] = React.useState(!1),
    jours = contenuDe(ctRows, "jour"),
    cours = contenuDe(ctRows, "cours"),
    notes = contenuDe(ctRows, "note").filter((x) => x.groupe === "planning"),
    sub = contenuDe(ctRows, "note").find((x) => x.groupe === "planning_sub"),
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
      <p className="sub">{sub ? sub.titre : ""}</p>
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
                {jours.map((t) => (
                  <tr className={t.groupe === "fixe" ? "total" : ""} key={t.id}>
                    <td>
                      <b>{t.titre}</b>
                    </td>
                    <td>{t.detail}</td>
                    <td
                      style={
                        t.groupe === "fixe"
                          ? {
                              color: "var(--oxblood)",
                              fontWeight: 600,
                            }
                          : {}
                      }
                    >
                      {t.extra}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
