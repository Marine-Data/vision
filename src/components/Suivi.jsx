import React from "react";
import { Fleches } from "./Fleches.jsx";
import { contenuDe } from "../lib/contenu.js";

export function Suivi({
  progress: t,
  toggle: e,
  readOnly: r,
  rows: ctRows,
  edit: ctEdit,
  save: ctSave,
  add: ctAdd,
  del: ctDel,
  move: ctMove,
}) {
  const [mode, setMode] = React.useState(!1),
    list = contenuDe(ctRows, "suivi"),
    n = list.filter((o) => t[o.item_key]).length,
    s = list.length ? Math.round((n / list.length) * 100) : 0,
    vue = mode ? list : [...list].sort((o, a) => (t[o.item_key] ? 1 : 0) - (t[a.item_key] ? 1 : 0));
  return (
    <section className="sec">
      <h2>Tableau de suivi</h2>
      <p className="sub">
        {n}
        {" / "}
        {list.length}
        {" étapes faites · coché = sauvegardé."}
      </p>
      <div className="prog">
        <i
          style={{
            width: s + "%",
          }}
        />
      </div>
      {!r && (
        <div
          style={{
            margin: "10px 0",
          }}
        >
          <button className="btn-outline btn-sm" onClick={() => setMode(!mode)}>
            {mode ? "✓ Terminer" : "✎ Modifier les étapes"}
          </button>
        </div>
      )}
      {mode && (
        <div className="editable-hint">
          Champs sur fond gris : clique pour corriger. L'enregistrement est automatique.
        </div>
      )}
      {mode ? (
        <div className="card">
          {list.map((o) => (
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
                  placeholder="Étape"
                  onChange={(w) =>
                    ctEdit(o.id, {
                      titre: w.target.value,
                    })
                  }
                  onBlur={() => ctSave(o.id)}
                />
                <Fleches
                  nom={o.titre}
                  onUp={() => ctMove(o.id, "suivi", -1)}
                  onDown={() => ctMove(o.id, "suivi", 1)}
                />
                <button className="bdel" onClick={() => ctDel(o.id)} aria-label="Supprimer">
                  ×
                </button>
              </div>
              <input
                className="bedit"
                style={{
                  width: "100%",
                }}
                value={o.detail || ""}
                placeholder="Échéance"
                onChange={(w) =>
                  ctEdit(o.id, {
                    detail: w.target.value,
                  })
                }
                onBlur={() => ctSave(o.id)}
              />
              <input
                className="bedit"
                style={{
                  width: "100%",
                }}
                value={o.extra || ""}
                placeholder="Action à faire"
                onChange={(w) =>
                  ctEdit(o.id, {
                    extra: w.target.value,
                  })
                }
                onBlur={() => ctSave(o.id)}
              />
            </div>
          ))}
          <button className="badd" onClick={() => ctAdd("suivi")}>
            + Ajouter une étape
          </button>
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: "4px 12px",
          }}
        >
          {vue.map((o) => (
            <label className={"check" + (t[o.item_key] ? " done" : "")} key={o.item_key}>
              <input type="checkbox" checked={!!t[o.item_key]} disabled={r} onChange={() => e(o.item_key)} />
              <span className="lbl">
                <b>{o.titre}</b>
                <span className="meta">
                  {o.detail || ""}
                  {o.extra && o.extra !== "—" ? " · " + o.extra : ""}
                </span>
              </span>
            </label>
          ))}
        </div>
      )}
    </section>
  );
}
