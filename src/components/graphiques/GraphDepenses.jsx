import React from "react";
import { budgetDuMois, ligneBudgetId, montantSigne } from "../../lib/calculs.js";
import { num } from "../../lib/format.js";
import { MOIS, moisNow } from "../../lib/mois.js";
import { CarteGraph, Legende, euros0, euros2 } from "./communs.jsx";

// Dépenses courantes du mois, poste par poste : budget (gris), payé (bleu-vert, comme le
// « Réalisé » de l'Excel), prévu pas encore payé (clair, à la suite), dépassement (rouge).
// Les postes en dépassement passent en tête.
export function GraphDepenses({ budget, budgetMois, transactions }) {
  const [m, setM] = React.useState(moisNow()),
    catDe = (w) => {
      const b = (budget || []).find((x) => x.id === ligneBudgetId(w)),
        c = b ? b.categorie : null;
      return c != null ? c : w.kind === "charge" ? "courantes" : null;
    },
    txm = (transactions || []).filter((x) => num(x.mois_index) === m),
    reelDe = (id, prevu) =>
      txm
        .filter((x) => x.budget_line_id === id && (x.statut === "prevu") === prevu)
        .reduce((s, x) => s + montantSigne(x), 0),
    lignes = budgetDuMois(budgetMois, budget, m)
      .filter((w) => catDe(w) === "courantes" && w.line_key !== "c_sport")
      .map((w) => ({ poste: w.poste, b: num(w.montant), r: reelDe(ligneBudgetId(w), false), v: reelDe(ligneBudgetId(w), true) }))
      .filter((w) => w.b || w.r || w.v)
      .sort((a, b) => (b.r + b.v > b.b) - (a.r + a.v > a.b) || b.r + b.v - b.b - (a.r + a.v - a.b)),
    max = Math.max(1, ...lignes.map((w) => Math.max(w.b, w.r + w.v))),
    totB = lignes.reduce((s, w) => s + w.b, 0),
    totR = lignes.reduce((s, w) => s + w.r, 0),
    totV = lignes.reduce((s, w) => s + w.v, 0),
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
      couleur={totR > totB ? "var(--t-rouge)" : "var(--ink)"}
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
          sur {euros0(totB)} de budget{totV > 0 ? " · + " + euros0(totV) + " prévus" : ""}
        </span>
        {bouton("→", "Mois suivant", m + 1, m < MOIS.length - 1)}
      </div>
      {lignes.map((w) => {
        const total = w.r + w.v,
          T = Math.max(w.b, total) || 1,
          pc = (x) => ((x / T) * 100).toFixed(1) + "%",
          depasse = w.r > w.b,
          depasseraAvecPrevu = !depasse && total > w.b,
          segments = [
            [0, Math.min(w.r, w.b), "var(--c-teal)", 1],
            w.r > w.b ? [w.b, w.r, "var(--c-rouge)", 1] : null,
            w.v > 0 && w.r < w.b ? [w.r, Math.min(total, w.b), "var(--c-teal)", 0.35] : null,
            w.v > 0 && total > Math.max(w.r, w.b) ? [Math.max(w.r, w.b), total, "var(--c-rouge)", 0.35] : null,
          ].filter((x) => x && x[1] > x[0]);
        return (
          <div
            key={w.poste}
            role="img"
            aria-label={`${w.poste} : ${euros2(w.r)} payés${w.v ? " et " + euros2(w.v) + " prévus" : ""} sur ${euros0(w.b)} de budget${depasse ? ", dépassement de " + euros2(w.r - w.b) : depasseraAvecPrevu ? ", dépassement de " + euros2(total - w.b) + " avec le prévu" : ""}`}
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, gap: 8 }}>
              <span style={{ fontWeight: 700 }}>{w.poste}</span>
              <span
                style={{
                  fontWeight: 700,
                  color: depasse ? "var(--t-rouge)" : depasseraAvecPrevu ? "var(--t-orange)" : "var(--ink-soft)",
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {euros2(w.r)}
                {w.v > 0 && <span style={{ fontWeight: 600, opacity: 0.8 }}>{" + " + euros2(w.v)}</span>} / {euros0(w.b)}
              </span>
            </div>
            <div
              style={{
                position: "relative",
                height: 12,
                borderRadius: 99,
                background: "var(--fond-gris)",
                width: ((T / max) * 100).toFixed(1) + "%",
                overflow: "hidden",
              }}
            >
              {segments.map(([de, a, c, op], k) => (
                <div key={k} style={{ position: "absolute", top: 0, bottom: 0, left: pc(de), width: pc(a - de), background: c, opacity: op }} />
              ))}
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
                  background: "var(--fond-gris)",
                  border: "1px solid var(--line-strong)",
                }}
              />
            ),
          },
          {
            l: "Payé",
            marque: <span style={{ width: 18, height: 8, borderRadius: 99, background: "var(--c-teal)" }} />,
          },
          ...(totV > 0
            ? [
                {
                  l: "Prévu",
                  marque: <span style={{ width: 18, height: 8, borderRadius: 99, background: "var(--c-teal)", opacity: 0.35 }} />,
                },
              ]
            : []),
          {
            l: "Dépassement",
            marque: <span style={{ width: 18, height: 8, borderRadius: 99, background: "var(--c-rouge)" }} />,
          },
        ]}
      />
    </CarteGraph>
  );
}
