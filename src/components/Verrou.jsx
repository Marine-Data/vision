import React from "react";
import { MOT_DE_PASSE_PARTAGE } from "../app/onglets.jsx";

export function Verrou({ onUnlock: t }) {
  const [e, r] = React.useState(""),
    [n, s] = React.useState(!1);
  function i(o) {
    o.preventDefault(), e === MOT_DE_PASSE_PARTAGE ? t() : s(!0);
  }
  return (
    <section className="sec">
      <h2>Contenu protégé 🔒</h2>
      <p className="sub">Les pages financières sont privées. Entre le mot de passe pour les afficher.</p>
      <div className="card">
        <form onSubmit={i}>
          <input
            type="password"
            placeholder="Mot de passe"
            value={e}
            onChange={(o) => {
              r(o.target.value), s(!1);
            }}
          />
          <button className="btn">Déverrouiller</button>
        </form>
        {n && (
          <p
            style={{
              color: "var(--alert)",
              fontSize: 13,
              marginTop: 8,
            }}
          >
            Mot de passe incorrect.
          </p>
        )}
      </div>
    </section>
  );
}

// ============================================================
// Kanban : Accueil, Devoirs, Pièces — composants partagés.
// Toutes les couleurs de texte ont un contraste ≥ 4,5:1, les
// icônes ≥ 3:1, les zones à toucher ≥ 44 px.
// ============================================================
