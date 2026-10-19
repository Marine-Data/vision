import React from "react";
import { navIcon } from "../app/onglets.jsx";
import { KB_I, KbSheet, accIcone } from "./kanban/communs.jsx";

export // Barre du bas : 5 onglets fixes + « Plus ».
const NAV_PRINCIPAUX = ["apercu", "tresorerie", "homework", "planning", "sport", "courses"];

export function NavBas({ onglets, actif, aller, verrou }) {
  const [plus, setPlus] = React.useState(!1),
    principaux = NAV_PRINCIPAUX.map((id) => onglets.find((o) => o.id === id)).filter(Boolean),
    autres = onglets.filter((o) => !NAV_PRINCIPAUX.includes(o.id)),
    dansPlus = autres.some((o) => o.id === actif);
  return (
    <>
      <nav className="nav" aria-label="Navigation principale">
        {principaux.map((N) => (
          <button
            type="button"
            className={actif === N.id ? "on" : ""}
            onClick={() => aller(N.id)}
            aria-current={actif === N.id ? "page" : void 0}
            key={N.id}
          >
            <span className="ico" aria-hidden="true">
              {navIcon(N.icon)}
            </span>
            <span>{N.label + (verrou(N.id) ? " 🔒" : "")}</span>
          </button>
        ))}
        {autres.length > 0 && <button
          type="button"
          className={dansPlus ? "on" : ""}
          onClick={() => setPlus(!0)}
          aria-haspopup="dialog"
          aria-label={
            "Plus d'onglets" +
            (dansPlus ? ", onglet actuel : " + autres.find((o) => o.id === actif).label : "")
          }
        >
          <span className="ico" aria-hidden="true">
            {accIcone("M5 12h.01M12 12h.01M19 12h.01", 22, 3)}
          </span>
          <span>{dansPlus ? autres.find((o) => o.id === actif).label : "Plus"}</span>
        </button>}
      </nav>
      {plus && (
        <KbSheet label="Autres onglets" onClose={() => setPlus(!1)}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {autres.map((N) => (
              <button
                type="button"
                onClick={() => {
                  setPlus(!1), aller(N.id);
                }}
                aria-current={actif === N.id ? "page" : void 0}
                style={{
                  minHeight: 54,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "0 14px",
                  borderRadius: 16,
                  border: 0,
                  background: actif === N.id ? "var(--teal-soft)" : "var(--surface-alt)",
                  color: actif === N.id ? "var(--teal-dark)" : "var(--ink)",
                  fontSize: 16,
                  fontWeight: 700,
                  textAlign: "left",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
                key={N.id}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: "flex",
                  }}
                >
                  {navIcon(N.icon)}
                </span>
                <span
                  style={{
                    flex: 1,
                  }}
                >
                  {N.label}
                </span>
                {verrou(N.id) ? <span>🔒</span> : accIcone(KB_I.chevron, 18, 2.4)}
              </button>
            ))}
          </div>
        </KbSheet>
      )}
    </>
  );
}
