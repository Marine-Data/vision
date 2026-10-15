import { KB_SR, accIcone } from "./kanban/communs.jsx";
import { euros } from "../lib/format.js";

export // Bandeau d'alerte (Budget mois) : un chiffre, une jauge, presque pas de mots.
function AlerteSalaire({ a, moisLabel, vacSolde, onAjuster }) {
  if (!a || (!a.niveau && !a.prevu)) return null;
  const pct = a.salaire > 0 ? Math.min(100, Math.round((a.engage / a.salaire) * 100)) : 0,
    triangle = "M12 3.5 2.8 19.5h18.4zM12 10v4.2M12 17h.01",
    cal =
      "M4 6.8A1.8 1.8 0 015.8 5h12.4A1.8 1.8 0 0120 6.8v11.4a1.8 1.8 0 01-1.8 1.8H5.8A1.8 1.8 0 014 18.2zM4 9.6h16M8.4 3.4v3.2M15.6 3.4v3.2",
    rond = (n) =>
      new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 0,
      }).format(Math.round(n)) + " €",
    rouge = a.niveau === "rouge",
    blocs = [];
  if (a.niveau) {
    const sous = rouge ? "rgba(255,255,255,.85)" : "var(--c-orange)";
    blocs.push(
      <div
        role="status"
        aria-label={
          (rouge
            ? "Salaire dépassé de " + euros(-a.reste)
            : "Plus que " + euros(a.reste) + " avant le salaire") +
          ". Dépensé et épargné " +
          euros(a.engage) +
          " sur " +
          euros(a.salaire) +
          (rouge && vacSolde != null ? ". Pris sur la provision vacances, il reste " + euros(vacSolde) : "")
        }
        style={{
          borderRadius: 20,
          padding: "14px 16px",
          marginBottom: 10,
          background: rouge ? "var(--c-rouge)" : "var(--orange-doux)",
          border: rouge ? "0" : "2px solid #e9b27f",
          color: rouge ? "#ffffff" : "var(--ink)",
          boxShadow: rouge ? "0 10px 24px rgba(166,58,36,.28)" : "none",
        }}
        key="reel"
      >
        <div
          aria-hidden="true"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              flex: "none",
              width: 42,
              height: 42,
              borderRadius: 14,
              background: rouge ? "rgba(255,255,255,.16)" : "var(--orange-doux)",
              color: rouge ? "#ffffff" : "var(--t-orange)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {accIcone(triangle, 22, 2.2)}
          </span>
          <span
            style={{
              flex: 1,
              fontFamily: "Georgia,serif",
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {rouge ? euros(a.reste) : "Encore " + rond(a.reste)}
          </span>
          {rouge && vacSolde != null ? (
            <span
              style={{
                flex: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 12,
                background: "rgba(255,255,255,.16)",
                fontSize: 14,
                fontWeight: 800,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {accIcone("M3 20h18M5 20l4-11 3 5 3-3 4 9M15 6a2 2 0 1 0 0-.01", 16, 2.2)}
              {rond(vacSolde)}
            </span>
          ) : null}
        </div>
        <div
          aria-hidden="true"
          style={{
            marginTop: 12,
          }}
        >
          <div
            style={{
              height: 10,
              borderRadius: 99,
              background: rouge ? "rgba(255,255,255,.25)" : "var(--orange-doux)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: pct + "%",
                height: "100%",
                borderRadius: 99,
                background: rouge
                  ? "repeating-linear-gradient(135deg,var(--surface) 0 6px,var(--rouge-doux) 6px 10px)"
                  : "var(--c-orange)",
              }}
            />
          </div>
          <div
            style={{
              textAlign: "right",
              marginTop: 5,
              fontSize: 13,
              fontWeight: 700,
              color: sous,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {rond(a.engage) + " / " + rond(a.salaire)}
          </div>
        </div>
      </div>,
    );
  }
  if (a.prevu)
    blocs.push(
      <div
        style={{
          borderRadius: 16,
          padding: "8px 8px 8px 12px",
          marginBottom: 10,
          background: "var(--orange-doux)",
          border: "1px solid var(--line-strong)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
        key="prevu"
      >
        <span
          aria-hidden="true"
          style={{
            flex: "none",
            color: "var(--t-orange)",
            display: "flex",
          }}
        >
          {accIcone(cal, 18, 2.2)}
        </span>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 14.5,
            fontWeight: 800,
            color: "var(--t-orange)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {"Budget "}
          <span aria-hidden="true">{"> "}</span>
          <span style={KB_SR}>{"au-dessus du "}</span>
          {a.salaireReel != null ? "salaire réel · " : "salaire · "}
          {euros(a.ecartPrevu)}
        </span>
        {onAjuster ? (
          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={onAjuster}
            style={{
              flex: "none",
              minHeight: 44,
              borderColor: "var(--c-orange)",
              color: "var(--t-orange)",
            }}
          >
            Ajuster
          </button>
        ) : null}
      </div>,
    );
  return <div>{blocs}</div>;
}

// Épargne programmée automatique : jour du virement et premier mois concerné
// (index 3 = novembre 2026 ; septembre et octobre sont déjà saisis à la main).
