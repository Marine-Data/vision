import React from "react";
import { Fleches } from "../components/Fleches.jsx";
import { contenuDe } from "../lib/contenu.js";

export function PiecesAncien({
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
    n = contenuDe(ctRows, "piece"),
    s = n.filter((o) => t[o.item_key]).length,
    i = n.length ? Math.round((s / n.length) * 100) : 0,
    groupes = [];
  n.forEach((o) => {
    const g = o.groupe || "Autres";
    let e2 = groupes.find((x) => x.titre === g);
    e2 ||
      ((e2 = {
        titre: g,
        items: [],
      }),
      groupes.push(e2)),
      e2.items.push(o);
  });
  return (
    <section className="sec">
      <h2>Pièces à fournir</h2>
      <p className="sub">
        {s}
        {" / "}
        {n.length}
        {" pièces prêtes · coché = sauvegardé."}
      </p>
      <div className="prog">
        <i
          style={{
            width: i + "%",
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
            {mode ? "✓ Terminer" : "✎ Modifier les pièces"}
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
          {n.map((o) => (
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
                  placeholder="Pièce"
                  onChange={(w) =>
                    ctEdit(o.id, {
                      titre: w.target.value,
                    })
                  }
                  onBlur={() => ctSave(o.id)}
                />
                <Fleches
                  nom={o.titre}
                  onUp={() => ctMove(o.id, "piece", -1)}
                  onDown={() => ctMove(o.id, "piece", 1)}
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
                value={o.groupe || ""}
                placeholder="Groupe (ex. DU Paris 1)"
                onChange={(w) =>
                  ctEdit(o.id, {
                    groupe: w.target.value,
                  })
                }
                onBlur={() => ctSave(o.id)}
              />
            </div>
          ))}
          <button className="badd" onClick={() => ctAdd("piece")}>
            + Ajouter une pièce
          </button>
        </div>
      ) : (
        groupes.map((o, a) => (
          <div key={a}>
            <div className="h3">{o.titre}</div>
            <div
              className="card"
              style={{
                padding: "4px 12px",
              }}
            >
              {[...o.items]
                .sort((l, u) => (t[l.item_key] ? 1 : 0) - (t[u.item_key] ? 1 : 0))
                .map((l) => (
                  <label className={"check" + (t[l.item_key] ? " done" : "")} key={l.item_key}>
                    <input
                      type="checkbox"
                      checked={!!t[l.item_key]}
                      disabled={r}
                      onChange={() => e(l.item_key)}
                    />
                    <span className="lbl">
                      <b>{l.titre}</b>
                    </span>
                  </label>
                ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
