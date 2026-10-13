import { contenuDe } from "../lib/contenu.js";

export function Sport({ rows: ctRows }) {
  // Les créneaux et les textes viennent de la base : rien n'est écrit en dur ici.
  const creneaux = contenuDe(ctRows, "cours").filter((x) => x.groupe === "sport"),
    notes = contenuDe(ctRows, "note"),
    sub = notes.find((x) => x.groupe === "sport_sub"),
    infos = notes.filter((x) => x.groupe === "sport"),
    abrege = (t) => (t || "").slice(0, 3).toUpperCase();
  return (
    <section className="sec">
      <h2>Sport</h2>
      <p className="sub">{sub ? sub.titre : ""}</p>
      <div className="card">
        {creneaux.length ? (
          creneaux.map((t, e) => (
            <div
              className="check"
              style={{
                borderBottom: e < creneaux.length - 1 ? "1px solid var(--line)" : 0,
              }}
              key={t.id}
            >
              <span className="di">{abrege(t.detail)}</span>
              <span className="lbl">
                <b>{t.titre}</b>
                <span className="meta">
                  {t.detail}
                  {t.extra ? " · " + t.extra : ""}
                </span>
              </span>
            </div>
          ))
        ) : (
          <div className="detail">Aucun créneau sport. Ajoute-le depuis l'onglet Emploi du temps.</div>
        )}
      </div>
      <div>
        {creneaux.map((t) => (
          <span className="chip" key={t.id}>
            {"Fixe · " + (t.detail || "")}
          </span>
        ))}
      </div>
      {infos.map((t) => (
        <div className="note" key={t.id}>
          {t.titre}
        </div>
      ))}
      <div
        className="detail"
        style={{
          marginTop: 8,
        }}
      >
        Ces créneaux se modifient dans l'onglet Emploi du temps.
      </div>
    </section>
  );
}
