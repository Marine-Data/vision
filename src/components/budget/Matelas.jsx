import React from "react";
import { KbSheet } from "../kanban/communs.jsx";
import { isoAujourdhui } from "../../lib/mois.js";
import { nomMoisLong } from "../../lib/matelas.js";

const e0 = (v) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(v)) + " €";
const VERT = "#0b6e53",
  TEAL = "var(--teal-dark)";

// Carte en haut de Budget mois : matelas atteint → basculer vers le PEA, ou l'inverse.
export function CarteMatelas({ etat, onOui, onPlusTard, readOnly }) {
  const [enCours, setEnCours] = React.useState(!1);
  if (!etat || !etat.proposition || readOnly) return null;
  const bascule = etat.proposition === "basculer",
    mois = nomMoisLong(etat.suivant).replace(/ \d{4}$/, "");
  return (
    <section
      aria-label={bascule ? "Matelas atteint" : "Matelas sous l'objectif"}
      style={{
        background: bascule ? VERT : "#9a4515",
        color: "#ffffff",
        borderRadius: 22,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxShadow: "0 10px 24px rgba(11,110,83,.22)",
      }}
    >
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 800,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          opacity: 0.92,
        }}
      >
        {bascule ? "🎉 Matelas atteint" : "🛟 Matelas sous l'objectif"}
      </span>
      <span style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, lineHeight: 1.25 }}>
        {bascule
          ? "Les " + e0(etat.versLivrets) + "/mois vont au PEA dès " + mois + " ?"
          : "Remettre l'épargne sur les livrets dès " + mois + " ?"}
      </span>
      <span style={{ fontSize: 13.5, fontWeight: 700, opacity: 0.95 }}>
        {bascule
          ? etat.livrets
              .filter((l) => l.montant > 0)
              .map((l) => l.poste + " " + e0(l.montant))
              .join(" + ") + " → PEA Trade Republic"
          : e0(etat.dispo) + " de côté pour " + e0(etat.cible) + " visés"}
      </span>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        <button
          type="button"
          disabled={enCours}
          onClick={async () => {
            setEnCours(!0);
            try {
              await onOui();
            } catch (e) {}
            setEnCours(!1);
          }}
          style={{
            minHeight: 48,
            border: 0,
            borderRadius: 14,
            background: "#ffffff",
            color: bascule ? VERT : "#9a4515",
            fontFamily: "inherit",
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {enCours ? "…" : bascule ? "Oui, basculer" : "Oui, recompléter"}
        </button>
        <button
          type="button"
          onClick={onPlusTard}
          style={{
            minHeight: 48,
            border: 0,
            borderRadius: 14,
            background: "rgba(255,255,255,.18)",
            color: "#ffffff",
            fontFamily: "inherit",
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Plus tard
        </button>
      </div>
    </section>
  );
}

// Fenêtre « Matelas + PEA » (touchée depuis la case Épargne de Budget mois).
export function FeuilleMatelas({ etat, onClose, onNoterPEA, readOnly }) {
  const [extra, setExtra] = React.useState(0),
    [valeur, setValeur] = React.useState(""),
    [saisie, setSaisie] = React.useState(!1);
  const atteint = etat.dispo >= etat.cible,
    pct = Math.max(0, Math.min(100, etat.pct)),
    couleur = atteint ? VERT : "#0a7b8a",
    debut = Math.max(0, etat.M - 2),
    fin = Math.min(
      etat.serie.length - 1,
      Math.max(etat.atteintA != null ? etat.atteintA : etat.M + 10, etat.M + 6),
    ),
    barres = etat.serie.slice(debut, fin + 1),
    max = Math.max(etat.cible, ...barres),
    simu = etat.simuler(extra),
    gain = etat.peaValeur != null ? etat.peaValeur - etat.peaVerse : null;
  return (
    <KbSheet label="Matelas et PEA" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <section
          aria-label="Matelas de sécurité"
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>🛟 Matelas</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--slate)" }}>
              6 × {e0(etat.salaire)} = {e0(etat.cible)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              role="img"
              aria-label={Math.round(etat.pct) + " % de l'objectif"}
              style={{
                flex: "none",
                width: 92,
                height: 92,
                borderRadius: "50%",
                background: `conic-gradient(${couleur} ${pct * 3.6}deg, #e3ebec 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: "50%",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Georgia, serif",
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {Math.round(etat.pct)} %
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700 }}>
                {e0(etat.dispo)}
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 800 }}>
                {etat.moisCouverts.toFixed(1).replace(".", ",")} mois de salaire de côté
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--slate)" }}>
                {atteint
                  ? "Objectif atteint ✓"
                  : etat.atteintA != null
                    ? "Atteint en " + nomMoisLong(etat.atteintA)
                    : "Pas atteint d'ici " + nomMoisLong(etat.serie.length - 1)}
              </span>
            </div>
          </div>
          <div aria-hidden="true" style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 56 }}>
            {barres.map((v, k) => (
              <span
                key={k}
                title={nomMoisLong(debut + k) + " : " + e0(v)}
                style={{
                  flex: 1,
                  height: Math.max(3, Math.round((v / max) * 56)),
                  borderRadius: "4px 4px 0 0",
                  background: debut + k <= etat.M ? couleur : v >= etat.cible ? "#9ed3c2" : "#d6e3e5",
                }}
              />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11.5,
              fontWeight: 700,
              color: "var(--slate)",
            }}
          >
            <span>{nomMoisLong(debut)}</span>
            <span>{nomMoisLong(fin)}</span>
          </div>
          {!atteint && (
            <div
              style={{
                background: "#f3f8f9",
                borderRadius: 16,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 13.5, fontWeight: 800 }}>Et si j'épargne en plus chaque mois…</span>
              <div
                role="radiogroup"
                aria-label="Épargne en plus"
                style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}
              >
                {[0, 25, 50, 100].map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={extra === v}
                    onClick={() => setExtra(v)}
                    style={{
                      height: 40,
                      borderRadius: 11,
                      border: 0,
                      background: extra === v ? "#0a7b8a" : "#ffffff",
                      color: extra === v ? "#ffffff" : "var(--ink)",
                      fontFamily: "inherit",
                      fontSize: 13.5,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {v ? "+" + v + " €" : "0 €"}
                  </button>
                ))}
              </div>
              <span role="status" style={{ fontSize: 14, fontWeight: 800, color: "#0a7b8a" }}>
                → atteint en {simu != null ? nomMoisLong(simu) : "plus de 20 ans"}
              </span>
            </div>
          )}
        </section>

        <section
          aria-label="PEA Trade Republic"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            borderTop: "1px solid var(--line)",
            paddingTop: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>📈 PEA Trade Republic</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--slate)" }}>
              {etat.versPEA > 0 ? "+" + e0(etat.versPEA) + "/mois" : "démarre après le matelas"}
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 8,
              textAlign: "center",
            }}
          >
            {[
              ["Versé", e0(etat.peaVerse), "var(--ink)", "#f3f8f9"],
              ["Valeur", etat.peaValeur != null ? e0(etat.peaValeur) : "—", "var(--ink)", "#f3f8f9"],
              [
                "Gain",
                gain != null ? (gain >= 0 ? "+" : "−") + e0(Math.abs(gain)) : "—",
                gain == null ? "var(--ink)" : gain >= 0 ? VERT : "#b8432a",
                gain == null ? "#f3f8f9" : gain >= 0 ? "#e3f4ed" : "#fbe9e4",
              ],
            ].map(([l, v, fg, bg]) => (
              <div key={l} style={{ background: bg, borderRadius: 14, padding: "10px 4px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--slate)" }}>{l}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: fg, fontVariantNumeric: "tabular-nums" }}>
                  {v}
                </div>
              </div>
            ))}
          </div>
          {etat.peaDate && (
            <div className="detail" style={{ marginTop: -6 }}>
              Valeur notée le{" "}
              {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(
                new Date(etat.peaDate + "T00:00:00"),
              )}
            </div>
          )}
          {!readOnly &&
            (saisie ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await onNoterPEA({ date: isoAujourdhui(), valeur }), setSaisie(!1), setValeur("");
                  } catch (e2) {}
                }}
                style={{ display: "flex", gap: 8 }}
              >
                <input
                  aria-label="Valeur du PEA aujourd'hui"
                  inputMode="decimal"
                  data-autofocus
                  placeholder="Valeur aujourd'hui"
                  value={valeur}
                  onChange={(e) => setValeur(e.target.value.replace(/[^0-9.,]/g, ""))}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: 48,
                    borderRadius: 14,
                    border: "2px solid #d6e3e5",
                    padding: "0 12px",
                    font: "inherit",
                    fontSize: 16,
                    fontWeight: 700,
                    textAlign: "right",
                  }}
                />
                <button
                  type="submit"
                  disabled={!valeur}
                  style={{
                    minWidth: 96,
                    minHeight: 48,
                    borderRadius: 14,
                    border: 0,
                    background: valeur ? TEAL : "#eef3f4",
                    color: valeur ? "#ffffff" : "var(--slate)",
                    fontFamily: "inherit",
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Noter
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setSaisie(!0)}
                style={{
                  minHeight: 48,
                  border: "2px dashed #9fcbd1",
                  borderRadius: 14,
                  background: "transparent",
                  color: "#0a7b8a",
                  fontFamily: "inherit",
                  fontSize: 14.5,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                ✏️ Noter la valeur du jour
              </button>
            ))}
          {etat.peaValeur == null && etat.peaVerse === 0 && (
            <div className="detail">
              La valeur se lit dans l'app Trade Republic. Le gain = valeur − versé.
            </div>
          )}
        </section>
      </div>
    </KbSheet>
  );
}
