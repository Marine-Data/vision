import React from "react";
import { budgetDuMois, ligneBudgetId } from "../../lib/calculs.js";
import { num } from "../../lib/format.js";
import { MOIS, moisNow } from "../../lib/mois.js";
import { CarteGraph, Legende, euros0, euros2 } from "./communs.jsx";

// Dépenses courantes du mois, poste par poste : budget (gris), dépensé (bleu-vert),
// dépassement (rouge). Les postes en dépassement passent en tête.
export function GraphDepenses({ budget, budgetMois, transactions }) {
  const [m, setM] = React.useState(moisNow()),
    catDe = (w) => {
      const b = (budget || []).find((x) => x.id === ligneBudgetId(w)),
        c = b ? b.categorie : null;
      return c != null ? c : w.kind === "charge" ? "courantes" : null;
    },
    txm = (transactions || []).filter((x) => num(x.mois_index) === m),
    reelDe = (id) =>
      txm
        .filter((x) => x.budget_line_id === id)
        .reduce((s, x) => s + (x.type === "remboursement" ? -num(x.montant) : num(x.montant)), 0),
    lignes = budgetDuMois(budgetMois, budget, m)
      .filter((w) => catDe(w) === "courantes" && w.line_key !== "c_sport")
      .map((w) => ({ poste: w.poste, b: num(w.montant), r: reelDe(ligneBudgetId(w)) }))
      .filter((w) => w.b || w.r)
      .sort((a, b) => (b.r > b.b) - (a.r > a.b) || b.r - b.b - (a.r - a.b)),
    max = Math.max(1, ...lignes.map((w) => Math.max(w.b, w.r))),
    totB = lignes.reduce((s, w) => s + w.b, 0),
    totR = lignes.reduce((s, w) => s + w.r, 0),
    bouton = (label, aria, cible, actif) => (
      <button
        type="button"
        className="btn-outline btn-sm"
        aria-label={aria}
        disabled={!actif}
        onClick={() => setM(cible)}
        style={{ minHeight: 40, minWidth: 40 }}
      >
        {label}
      </button>
    );
  return (
    <CarteGraph
      titre={"Dépenses de " + MOIS[m]}
      chiffre={euros0(totR)}
      couleur={totR > totB ? "#b8432a" : "var(--ink)"}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        {bouton("←", "Mois précédent", m - 1, m > 1)}
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--ink-soft)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          sur {euros0(totB)} de budget
        </span>
        {bouton("→", "Mois suivant", m + 1, m < MOIS.length - 1)}
      </div>
      {lignes.map((w) => {
        const depasse = w.r > w.b,
          piste = (Math.max(w.b, w.r) / max) * 100,
          plein = depasse ? (w.b / w.r) * 100 : w.b ? (w.r / w.b) * 100 : 0;
        return (
          <div
            key={w.poste}
            role="img"
            aria-label={`${w.poste} : ${euros2(w.r)} dépensés sur ${euros0(w.b)} de budget${depasse ? ", dépassement de " + euros2(w.r - w.b) : ""}`}
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, gap: 8 }}>
              <span style={{ fontWeight: 700 }}>{w.poste}</span>
              <span
                style={{
                  fontWeight: 700,
                  color: depasse ? "#b8432a" : "var(--ink-soft)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {euros2(w.r)} / {euros0(w.b)}
              </span>
            </div>
            <div
              style={{
                position: "relative",
                height: 12,
                borderRadius: 99,
                background: "#eef3f4",
                width: piste.toFixed(1) + "%",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: 99,
                  background: "#086b78",
                  width: plein.toFixed(1) + "%",
                }}
              />
              {depasse && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    right: 0,
                    borderRadius: "0 99px 99px 0",
                    background: "#b8432a",
                    width: (100 - plein).toFixed(1) + "%",
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
      {!lignes.length && (
        <p className="detail" style={{ margin: 0 }}>
          Aucune dépense ce mois-ci.
        </p>
      )}
      <Legende
        items={[
          {
            l: "Budget",
            marque: (
              <span
                style={{
                  width: 18,
                  height: 8,
                  borderRadius: 99,
                  background: "#eef3f4",
                  border: "1px solid #c9d8db",
                }}
              />
            ),
          },
          {
            l: "Dépensé",
            marque: <span style={{ width: 18, height: 8, borderRadius: 99, background: "#086b78" }} />,
          },
          {
            l: "Dépassement",
            marque: <span style={{ width: 18, height: 8, borderRadius: 99, background: "#b8432a" }} />,
          },
        ]}
      />
    </CarteGraph>
  );
}
