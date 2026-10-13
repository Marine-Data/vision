import React from "react";
import { AUDIT_CHAMPS, AUDIT_GROUPES, PARAMS_LIBELLES } from "../data/contenu.js";
import { auditValeur, eurosCourt, hwkFmt, num } from "../lib/format.js";
import { MOIS } from "../lib/mois.js";

// Lignes « * » : la ligne entière avant / après (ajout, modification, suppression).
const TABLES = {
  vision_items: "provisions",
  vision_params: "réglages",
  vision_budget: "postes",
  vision_budget_mois: "budget du mois",
  vision_transactions: "dépenses",
  vision_contenu: "contenu",
  vision_recurrentes: "récurrentes",
  vision_seances: "sport",
  vision_import_regles: "import",
};
const IGNORES = [
  "id",
  "user_id",
  "created_at",
  "updated_at",
  "sort",
  "line_key",
  "item_key",
  "import_id",
  "budget_line_id",
  "recurrente_id",
  "cours_id",
  "est_override",
];
const NOMS_CHAMPS = {
  montant: "montant",
  poste: "nom",
  note: "note",
  date_depense: "date",
  titre: "titre",
  detail: "détail",
  extra: "note",
  date_iso: "date",
  date_fin: "fin",
  statut: "état",
  exceptionnelle: "exceptionnelle",
  archive_depuis: "archivé dès",
  icone: "icône",
  label: "nom",
  jour: "jour",
  fin: "fin",
  actif: "actif",
  motif: "mot-clé",
  fait: "fait",
  complement: "complément",
  type: "type",
  mois_index: "mois",
  annee: "année",
  mois: "mois",
};
function lire(j) {
  try {
    return j ? JSON.parse(j) : null;
  } catch (e) {
    return null;
  }
}
function valeur(k, v) {
  if (v == null || v === "") return "—";
  if (k === "montant") return eurosCourt(num(v));
  if (k === "mois_index" || k === "archive_depuis" || k === "fin") return MOIS[num(v)] || v;
  if (typeof v === "boolean") return v ? "oui" : "non";
  return String(v);
}
export function resumeLigne(l) {
  const a = lire(l.old_value),
    n = lire(l.new_value),
    r = n || a || {},
    nom =
      r.poste ||
      r.note ||
      r.titre ||
      r.label ||
      r.motif ||
      r.activite ||
      (r.date ? "Séance du " + r.date : "") ||
      TABLES[l.table_name] ||
      "",
    action = !a ? "ajout" : !n ? "suppression" : "modification",
    champs =
      a && n
        ? Object.keys(n).filter((k) => !IGNORES.includes(k) && JSON.stringify(a[k]) !== JSON.stringify(n[k]))
        : [];
  return {
    nom:
      (l.table_name === "vision_transactions" && r.montant != null && action !== "modification"
        ? eurosCourt(num(r.montant)) + " · "
        : "") + nom,
    chip:
      action === "modification"
        ? champs.map((k) => NOMS_CHAMPS[k] || k).join(", ") || "modification"
        : action,
    detail:
      action === "modification"
        ? champs.map((k) => valeur(k, a[k]) + " → " + valeur(k, n[k])).join(" · ")
        : "",
  };
}

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
        Tout est gardé : budget, dépenses, postes, provisions, réglages, cours, étapes, récurrentes et
        mots-clés de l'import. Chaque ligne montre l'avant et l'après.
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
            {t === "Toutes" ? "Partout" : TABLES[t] || t.replace("vision_", "")}
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
              {j.lignes.map((l) => {
                const r = l.field === "*" ? resumeLigne(l) : null;
                return (
                  <div style={{ padding: "9px 0", borderBottom: "1px solid var(--line)" }} key={l.id}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                      {r ? r.nom : nomDe(l)}
                      <span className="chip" style={{ marginLeft: 6 }}>
                        {r ? r.chip : AUDIT_CHAMPS[l.field] || l.field}
                      </span>
                    </div>
                    <div className="detail" style={{ marginTop: 2 }}>
                      {r ? (
                        r.detail ? (
                          r.detail + "  ·  "
                        ) : (
                          (TABLES[l.table_name] || "") + "  ·  "
                        )
                      ) : (
                        <>
                          {auditValeur(l.field, l.old_value)}
                          {" → "}
                          <b>{auditValeur(l.field, l.new_value)}</b>
                          {"  ·  "}
                        </>
                      )}
                      {(l.changed_at || "").slice(11, 16)}
                    </div>
                    {l.note && (
                      <div
                        className="detail"
                        style={{ marginTop: 3, fontStyle: "italic", color: "var(--amber)" }}
                      >
                        {"⚑ " + l.note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
