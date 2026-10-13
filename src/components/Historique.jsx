import React from "react";
import { AUDIT_CHAMPS, AUDIT_GROUPES, PARAMS_LIBELLES } from "../data/contenu.js";
import { auditValeur, hwkFmt } from "../lib/format.js";

export function Historique({ audit, items, params }) {
  const [fTable, setFTable] = React.useState("Toutes"),
    [fGroupe, setFGroupe] = React.useState("Tous"),
    [fPeriode, setFPeriode] = React.useState("30 jours"),
    lignes = audit || [];
  const nomDe = (l) => {
      if (l.table_name === "vision_items") {
        const it = (items || []).find((x) => x.id === l.record_id);
        return it ? it.label : "poste supprimé";
      }
      if (l.table_name === "vision_params") {
        const p = (params || []).find((x) => String(x.id) === l.record_id || x.param_key === l.record_id);
        return p ? PARAMS_LIBELLES[p.param_key] || p.param_key : "paramètre";
      }
      return l.record_id;
    },
    groupeDe = (c) => {
      const g = AUDIT_GROUPES.find(([, , champs]) => champs.includes(c));
      return g ? g[0] : "autre";
    },
    tables = ["Toutes", ...new Set(lignes.map((l) => l.table_name))],
    seuil = fPeriode === "Tout" ? null : new Date(Date.now() - (fPeriode === "7 jours" ? 7 : 30) * 864e5),
    visibles = lignes.filter(
      (l) =>
        (fTable === "Toutes" || l.table_name === fTable) &&
        (fGroupe === "Tous" || groupeDe(l.field) === fGroupe) &&
        (!seuil || new Date(l.changed_at) >= seuil),
    );

  // Regroupées par jour : c'est l'unité à laquelle on se souvient d'une décision.
  const jours = [];
  visibles.forEach((l) => {
    const j = (l.changed_at || "").slice(0, 10);
    let e = jours.find((x) => x.jour === j);
    e ||
      ((e = {
        jour: j,
        lignes: [],
      }),
      jours.push(e)),
      e.lignes.push(l);
  });
  const btn = (a) => ({
    minHeight: "var(--tap)",
    padding: "11px 15px",
    borderRadius: 999,
    fontFamily: "inherit",
    cursor: "pointer",
    border: "1px solid " + (a ? "var(--oxblood)" : "var(--line)"),
    background: a ? "var(--oxblood)" : "#fff",
    color: a ? "#fff" : "var(--ink)",
    fontSize: 12.5,
    fontWeight: 600,
    marginRight: 6,
    marginBottom: 6,
  });
  return (
    <section className="sec">
      <h2>Historique</h2>
      <p className="sub">Ce qui a changé dans ton plan, et quand. Enregistré automatiquement.</p>
      <div className="note">
        Ce journal couvre les décisions de plan : provisions (formation, sport, vacances, épargne) et
        paramètres. Le budget, le budget mensuel, les dépenses et le contenu des onglets ne sont pas
        journalisés — ce sont des exécutions, pas des décisions.
      </div>
      <div className="detail">Quoi</div>
      <div>
        {["Tous", ...AUDIT_GROUPES.map(([k]) => k)].map((k) => (
          <button style={btn(fGroupe === k)} onClick={() => setFGroupe(k)} key={k}>
            {k === "Tous" ? "Tout" : (AUDIT_GROUPES.find(([g]) => g === k) || [])[1]}
          </button>
        ))}
      </div>
      <div
        className="detail"
        style={{
          marginTop: 6,
        }}
      >
        Où
      </div>
      <div>
        {tables.map((t) => (
          <button style={btn(fTable === t)} onClick={() => setFTable(t)} key={t}>
            {t === "Toutes" ? "Partout" : t.replace("vision_", "")}
          </button>
        ))}
      </div>
      <div
        className="detail"
        style={{
          marginTop: 6,
        }}
      >
        Quand
      </div>
      <div>
        {["7 jours", "30 jours", "Tout"].map((p) => (
          <button style={btn(fPeriode === p)} onClick={() => setFPeriode(p)} key={p}>
            {p}
          </button>
        ))}
      </div>
      <div className="h3">{visibles.length + (visibles.length > 1 ? " changements" : " changement")}</div>
      {jours.length === 0 ? (
        <div className="card">
          <div className="detail">Rien sur cette période. Élargis les filtres pour voir plus loin.</div>
        </div>
      ) : (
        jours.map((j) => (
          <div key={j.jour}>
            <div className="bgrouplab">{hwkFmt(j.jour)}</div>
            <div
              className="card"
              style={{
                padding: "4px 12px",
              }}
            >
              {j.lignes.map((l) => (
                <div
                  style={{
                    padding: "9px 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                  key={l.id}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13.5,
                    }}
                  >
                    {nomDe(l)}
                    <span
                      className="chip"
                      style={{
                        marginLeft: 6,
                      }}
                    >
                      {AUDIT_CHAMPS[l.field] || l.field}
                    </span>
                  </div>
                  <div
                    className="detail"
                    style={{
                      marginTop: 2,
                    }}
                  >
                    {auditValeur(l.field, l.old_value)}
                    {" → "}
                    <b>{auditValeur(l.field, l.new_value)}</b>
                    {"  ·  "}
                    {(l.changed_at || "").slice(11, 16)}
                  </div>
                  {l.note && (
                    <div
                      className="detail"
                      style={{
                        marginTop: 3,
                        fontStyle: "italic",
                        color: "var(--amber)",
                      }}
                    >
                      {"⚑ " + l.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
