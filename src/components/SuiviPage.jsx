import React from "react";
import { KbSheet } from "./kanban/communs.jsx";

// Mon parcours : une frise de septembre à juillet, la prochaine étape en avant,
// les étapes en ligne de temps (les faites repliées). Un rond coche, le texte modifie.

const BLEU = "#086b78";
const MOIS_COURTS = [
  "Janv",
  "Févr",
  "Mars",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sept",
  "Oct",
  "Nov",
  "Déc",
];
const fmt = (iso, annee) =>
  iso
    ? new Intl.DateTimeFormat(
        "fr-FR",
        annee ? { day: "numeric", month: "short", year: "numeric" } : { day: "numeric", month: "short" },
      ).format(new Date(iso + "T00:00:00"))
    : "";
export const dateEtape = (e) =>
  e.date_iso
    ? e.date_fin
      ? fmt(e.date_iso) + " → " + fmt(e.date_fin, !0)
      : fmt(e.date_iso, !0)
    : e.detail || "";

const champ = {
  height: 48,
  borderRadius: 14,
  border: "2px solid #d6e3e5",
  padding: "0 12px",
  font: "inherit",
  fontSize: 16,
  fontWeight: 700,
  color: "var(--ink)",
  boxSizing: "border-box",
  width: "100%",
  background: "#ffffff",
};
const etiquette = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 12.5,
  fontWeight: 800,
  color: "var(--slate)",
};

function FeuilleEtape({ etape, onClose, onEnregistrer, onSupprimer, onMonter, onDescendre }) {
  const [titre, setTitre] = React.useState(etape ? etape.titre || "" : ""),
    [date, setDate] = React.useState(etape ? etape.date_iso || "" : ""),
    [fin, setFin] = React.useState(etape ? etape.date_fin || "" : ""),
    [precision, setPrecision] = React.useState(etape ? etape.detail || "" : ""),
    [note, setNote] = React.useState(etape && etape.extra !== "—" ? etape.extra || "" : ""),
    [confirmer, setConfirmer] = React.useState(!1),
    [erreur, setErreur] = React.useState("");
  async function ok() {
    if (!titre.trim()) return setErreur("Donne un nom à l'étape.");
    if (fin && date && fin < date) return setErreur("La date de fin est avant le début.");
    try {
      await onEnregistrer({
        titre: titre.trim(),
        date_iso: date || null,
        date_fin: fin || null,
        detail: precision.trim() || null,
        extra: note.trim() || null,
      });
      onClose();
    } catch (e) {}
  }
  return (
    <KbSheet label={etape ? "Modifier l'étape" : "Nouvelle étape"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={etiquette}>
          Étape
          <input value={titre} data-autofocus onChange={(e) => setTitre(e.target.value)} style={champ} />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          <label style={etiquette}>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={champ} />
          </label>
          <label style={etiquette}>
            Jusqu'au (option)
            <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} style={champ} />
          </label>
        </div>
        <label style={etiquette}>
          Précision
          <input
            value={precision}
            placeholder="ex. À l'admission"
            onChange={(e) => setPrecision(e.target.value)}
            style={champ}
          />
        </label>
        <label style={etiquette}>
          Note
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ ...champ, height: "auto", padding: "10px 12px", resize: "none", fontWeight: 600 }}
          />
        </label>
        {erreur && (
          <div role="alert" style={{ color: "#b8432a", fontWeight: 700 }}>
            {erreur}
          </div>
        )}
        <button
          type="button"
          onClick={ok}
          style={{
            minHeight: 52,
            borderRadius: 16,
            border: 0,
            background: BLEU,
            color: "#ffffff",
            fontFamily: "inherit",
            fontSize: 15.5,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Enregistrer
        </button>
        {etape && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            <button
              type="button"
              className="btn-outline"
              onClick={onMonter}
              disabled={!onMonter}
              style={{ minHeight: 44 }}
            >
              ↑ Plus tôt
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={onDescendre}
              disabled={!onDescendre}
              style={{ minHeight: 44 }}
            >
              ↓ Plus tard
            </button>
          </div>
        )}
        {etape && (
          <button
            type="button"
            onClick={async () => {
              if (!confirmer) return setConfirmer(!0);
              try {
                await onSupprimer(), onClose();
              } catch (e) {}
            }}
            style={{
              minHeight: 44,
              border: 0,
              background: "transparent",
              color: "#b8432a",
              fontFamily: "inherit",
              fontSize: 14.5,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {confirmer ? "Confirmer la suppression" : "Supprimer l'étape"}
          </button>
        )}
      </div>
    </KbSheet>
  );
}

export function SuiviPage({ rows, progress, readOnly, onToggle, onCtMaj, onCtCreer, onCtSupprimer, onMove }) {
  const [ouvert, setOuvert] = React.useState(null),
    [voirFaites, setVoirFaites] = React.useState(!1);
  const etapes = (rows || []).filter((x) => x.type === "suivi").sort((a, b) => (a.sort || 0) - (b.sort || 0)),
    fait = (e) => !!(progress || {})[e.item_key],
    nbFaites = etapes.filter(fait).length,
    prochaine = etapes.find((e) => !fait(e)),
    visibles = etapes.filter((e) => voirFaites || !fait(e)),
    // Frise : du mois de la première date au mois de la dernière (sept. → juil. aujourd'hui).
    dates = etapes
      .flatMap((e) => [e.date_iso, e.date_fin])
      .filter(Boolean)
      .sort(),
    debut = dates.length ? new Date(dates[0].slice(0, 7) + "-01T00:00:00") : new Date(),
    finD = dates.length ? new Date(dates[dates.length - 1] + "T00:00:00") : new Date(),
    fin = new Date(finD.getFullYear(), finD.getMonth() + 1, 0),
    auj = new Date(),
    part = Math.max(0, Math.min(1, (auj - debut) / Math.max(1, fin - debut))),
    nbMois = (fin.getFullYear() - debut.getFullYear()) * 12 + fin.getMonth() - debut.getMonth() + 1,
    pas = Math.max(1, Math.ceil(nbMois / 6)),
    reperes = [];
  for (let k = 0; k < nbMois; k += pas) reperes.push(MOIS_COURTS[(debut.getMonth() + k) % 12]);
  let dernierMois = null;
  return (
    <section className="sec">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ color: BLEU, margin: 0 }}>Mon parcours</h2>
        <span style={{ fontSize: 15, fontWeight: 800, color: BLEU, fontVariantNumeric: "tabular-nums" }}>
          {nbFaites}/{etapes.length}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
        {dates.length > 0 && (
          <div
            role="img"
            aria-label={"Frise du parcours, " + Math.round(part * 100) + " % du chemin"}
            style={{
              background: "#ffffff",
              borderRadius: 18,
              padding: "14px 12px 10px",
              boxShadow: "0 1px 2px rgba(14,58,66,.06)",
            }}
          >
            <div style={{ position: "relative", height: 10, borderRadius: 99, background: "#dff2f4" }}>
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: part * 100 + "%",
                  borderRadius: 99,
                  background: BLEU,
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: part * 100 + "%",
                  top: -5,
                  width: 20,
                  height: 20,
                  marginLeft: -10,
                  borderRadius: "50%",
                  background: "#ffffff",
                  border: "4px solid " + BLEU,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--slate)",
              }}
            >
              {reperes.map((r, k) => (
                <span key={k}>{r}</span>
              ))}
            </div>
          </div>
        )}

        {prochaine && (
          <section
            aria-label="Prochaine étape"
            style={{
              background: BLEU,
              color: "#ffffff",
              borderRadius: 22,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              boxShadow: "0 10px 24px rgba(10,123,138,.25)",
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
              Prochaine étape{dateEtape(prochaine) ? " · " + dateEtape(prochaine) : ""}
            </span>
            <span style={{ fontFamily: "Georgia, serif", fontSize: 21, fontWeight: 700, lineHeight: 1.2 }}>
              {prochaine.titre}
            </span>
            {prochaine.extra && prochaine.extra !== "—" && (
              <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.95 }}>{prochaine.extra}</span>
            )}
          </section>
        )}

        {nbFaites > 0 && (
          <button
            type="button"
            onClick={() => setVoirFaites(!voirFaites)}
            aria-expanded={voirFaites}
            style={{
              minHeight: 48,
              border: 0,
              borderRadius: 16,
              background: "#e3f4ed",
              color: "#0b6e53",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 14px",
              fontFamily: "inherit",
              fontSize: 14.5,
              fontWeight: 800,
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#0b6e53",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
              }}
            >
              ✓
            </span>
            <span style={{ flex: 1 }}>
              {nbFaites} étape{nbFaites > 1 ? "s" : ""} faite{nbFaites > 1 ? "s" : ""}
            </span>
            <span aria-hidden="true">{voirFaites ? "▲" : "▼"}</span>
          </button>
        )}

        <div style={{ position: "relative", paddingLeft: 8 }}>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 27,
              top: 10,
              bottom: 10,
              width: 3,
              borderRadius: 99,
              background: "#c9e3e7",
            }}
          />
          {visibles.map((e) => {
            const f = fait(e),
              next = prochaine && e.id === prochaine.id,
              m = e.date_iso ? MOIS_COURTS[Number(e.date_iso.slice(5, 7)) - 1] : null,
              afficheMois = m && m !== dernierMois;
            m && (dernierMois = m);
            return (
              <div
                key={e.id}
                style={{
                  position: "relative",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: "6px 0",
                  marginTop: afficheMois ? 16 : 0,
                }}
              >
                {afficheMois && (
                  <span
                    style={{
                      position: "absolute",
                      left: 44,
                      top: -12,
                      fontSize: 11.5,
                      fontWeight: 900,
                      letterSpacing: ".08em",
                      color: "var(--slate)",
                      textTransform: "uppercase",
                    }}
                  >
                    {m}
                  </span>
                )}
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => onToggle(e.item_key)}
                  aria-pressed={f}
                  aria-label={e.titre + (f ? ", fait" : ", à faire")}
                  style={{
                    flex: "none",
                    position: "relative",
                    zIndex: 1,
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "3px solid " + (f ? "#0b6e53" : next ? BLEU : "#b9cfd3"),
                    background: f ? "#0b6e53" : next ? BLEU : "#ffffff",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxSizing: "border-box",
                    fontSize: 16,
                    fontWeight: 900,
                    cursor: readOnly ? "default" : "pointer",
                  }}
                >
                  {f ? "✓" : next ? "●" : ""}
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => setOuvert({ e })}
                  aria-label={"Modifier : " + e.titre}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: "left",
                    color: "var(--ink)",
                    background: next ? "#dff2f4" : "#ffffff",
                    borderRadius: 16,
                    padding: "10px 12px",
                    boxShadow: "0 1px 2px rgba(14,58,66,.06)",
                    border: "2px solid " + (next ? BLEU : "transparent"),
                    fontFamily: "inherit",
                    cursor: readOnly ? "default" : "pointer",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: 14.5,
                      fontWeight: 800,
                      color: f ? "var(--slate)" : "var(--ink)",
                    }}
                  >
                    {e.titre}
                  </span>
                  <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--slate)" }}>
                    {dateEtape(e)}
                    {e.date_iso && e.detail ? " · " + e.detail : ""}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setOuvert({ e: null })}
            style={{
              minHeight: 52,
              border: "2px dashed #9fcbd1",
              borderRadius: 18,
              background: "transparent",
              color: BLEU,
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            + Étape
          </button>
        )}
      </div>
      {ouvert && (
        <FeuilleEtape
          etape={ouvert.e}
          onClose={() => setOuvert(null)}
          onEnregistrer={(p) =>
            ouvert.e ? onCtMaj(ouvert.e.id, p) : onCtCreer("suivi", null, p, "Étape ajoutée")
          }
          onSupprimer={() => onCtSupprimer(ouvert.e.id, "Étape supprimée")}
          onMonter={ouvert.e && etapes[0].id !== ouvert.e.id ? () => onMove(ouvert.e.id, "suivi", -1) : null}
          onDescendre={
            ouvert.e && etapes[etapes.length - 1].id !== ouvert.e.id
              ? () => onMove(ouvert.e.id, "suivi", 1)
              : null
          }
        />
      )}
    </section>
  );
}
