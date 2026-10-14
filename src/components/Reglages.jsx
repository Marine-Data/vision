import React from "react";
import { KbSheet } from "./kanban/communs.jsx";
import { catIcone, euros, num, param } from "../lib/format.js";
import { MOIS, moisNow } from "../lib/mois.js";
import { TAILLES, THEMES, appliquerAffichage } from "../lib/affichage.js";

// Réglages : jour de l'épargne automatique, seuil de l'alerte, dépenses récurrentes,
// rappels sur le téléphone, mots-clés de l'import. Tout est enregistré dans la base.

const TEAL = "var(--teal-dark)";
const carte = { background: "var(--surface)", borderRadius: 18, boxShadow: "0 1px 2px rgba(14,58,66,.06)" };
const champ = {
  height: 48,
  borderRadius: 14,
  border: "2px solid var(--line)",
  padding: "0 12px",
  font: "inherit",
  fontSize: 16,
  fontWeight: 700,
  color: "var(--ink)",
  boxSizing: "border-box",
  width: "100%",
  background: "var(--surface)",
};
const etiquette = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 12.5,
  fontWeight: 800,
  color: "var(--slate)",
};
const titreSection = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  margin: "10px 4px 0",
  fontSize: 16,
  fontWeight: 800,
};
const petit = {
  width: 40,
  height: 40,
  borderRadius: 12,
  border: 0,
  background: "var(--fond-gris)",
  color: "var(--ink)",
  fontSize: 18,
  fontWeight: 900,
  cursor: "pointer",
};

const GROUPES = [
  ["ignorer", "🚫", "Ignorer (virements internes)"],
  ["salaire", "💼", "Salaire"],
  ["vacances", "✈️", "Vacances"],
  ["sport", "🤸", "Sport"],
];
const RAPPELS = [
  ["rappel_suivi", "🧭", "Étapes du suivi", "j"],
  ["rappel_echeances", "💳", "Échéances à payer", "j"],
  ["rappel_devoirs", "📚", "Devoirs", "j"],
  ["rappel_sport", "🤸", "Cours de sport", "h"],
];
const DELAIS = { j: [1, 2, 3, 7, 14], h: [1, 2, 3] };

function Reglette({ icone, label, valeur, suffixe, onMoins, onPlus, aria }) {
  return (
    <section
      aria-label={aria}
      style={{
        ...carte,
        borderRadius: 20,
        padding: "14px 10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 22 }}>
        {icone}
      </span>
      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--slate)", textAlign: "center" }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          type="button"
          onClick={onMoins}
          aria-label={aria + " : moins"}
          style={petit}
          disabled={!onMoins}
        >
          −
        </button>
        <span
          role="status"
          style={{
            minWidth: 58,
            textAlign: "center",
            fontFamily: "Georgia, serif",
            fontSize: 23,
            fontWeight: 700,
          }}
        >
          {valeur}
          {suffixe}
        </span>
        <button type="button" onClick={onPlus} aria-label={aria + " : plus"} style={petit} disabled={!onPlus}>
          +
        </button>
      </div>
    </section>
  );
}

function FeuilleRecurrente({ r, postes, onClose, onEnregistrer, onArreter }) {
  const [label, setLabel] = React.useState(r ? r.label : ""),
    [ligne, setLigne] = React.useState(r ? r.budget_line_id : postes[0] && postes[0].id),
    [montant, setMontant] = React.useState(r ? String(r.montant).replace(".", ",") : ""),
    [jour, setJour] = React.useState(r ? String(r.jour) : "1"),
    [fin, setFin] = React.useState(r && r.fin != null ? String(r.fin) : ""),
    [confirmer, setConfirmer] = React.useState(!1);
  const M = moisNow();
  return (
    <KbSheet label={r ? "Dépense récurrente" : "Nouvelle dépense récurrente"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={etiquette}>
          Nom
          <input value={label} data-autofocus onChange={(e) => setLabel(e.target.value)} style={champ} />
        </label>
        <label style={etiquette}>
          Poste
          <select value={ligne || ""} onChange={(e) => setLigne(e.target.value)} style={champ}>
            {postes.map((p) => (
              <option key={p.id} value={p.id}>
                {catIcone(p.poste) + " " + p.poste}
              </option>
            ))}
          </select>
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          <label style={etiquette}>
            Montant
            <input
              inputMode="decimal"
              value={montant}
              onChange={(e) => setMontant(e.target.value.replace(/[^0-9.,]/g, ""))}
              style={{ ...champ, textAlign: "right" }}
            />
          </label>
          <label style={etiquette}>
            Le (jour du mois)
            <input
              inputMode="numeric"
              value={jour}
              onChange={(e) => setJour(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
              style={{ ...champ, textAlign: "center" }}
            />
          </label>
        </div>
        <label style={etiquette}>
          Dernier mois
          <select value={fin} onChange={(e) => setFin(e.target.value)} style={champ}>
            <option value="">Sans fin</option>
            {MOIS.map((l, i) =>
              i >= M - 1 ? (
                <option key={i} value={i}>
                  {l}
                </option>
              ) : null,
            )}
          </select>
        </label>
        <button
          type="button"
          onClick={async () => {
            try {
              await onEnregistrer({
                id: r && r.id,
                label,
                budget_line_id: ligne,
                montant: Number(String(montant).replace(",", ".")),
                jour: Number(jour),
                fin,
              }),
                onClose();
            } catch (e) {}
          }}
          style={{
            minHeight: 52,
            borderRadius: 16,
            border: 0,
            background: TEAL,
            color: "#ffffff",
            fontFamily: "inherit",
            fontSize: 15.5,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Enregistrer
        </button>
        {r && (
          <button
            type="button"
            onClick={async () => {
              if (!confirmer) return setConfirmer(!0);
              try {
                await onArreter(r.id), onClose();
              } catch (e) {}
            }}
            style={{
              minHeight: 44,
              border: 0,
              background: "transparent",
              color: "var(--t-rouge)",
              fontFamily: "inherit",
              fontSize: 14.5,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {confirmer ? "Confirmer : plus de prélèvement dès " + MOIS[M] : "Arrêter cette dépense"}
          </button>
        )}
      </div>
    </KbSheet>
  );
}

// Rangée de choix (taille du texte, thème).
function Segments({ label, choix, valeur, onChoisir }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--slate)", margin: "0 2px 6px" }}>{label}</div>
      <div role="radiogroup" aria-label={label} style={{ display: "flex", gap: 4, padding: 4, borderRadius: 14, background: "var(--fond-gris)" }}>
        {choix.map(([v, l, , fs]) => {
          const on = v === valeur;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={typeof l === "string" ? l : undefined}
              onClick={() => onChoisir(v)}
              style={{
                flex: 1,
                minHeight: 44,
                border: 0,
                borderRadius: 11,
                background: on ? "var(--surface)" : "transparent",
                boxShadow: on ? "0 1px 3px rgba(0,0,0,.18)" : "none",
                color: on ? "var(--ink)" : "var(--slate)",
                fontFamily: "inherit",
                fontSize: fs || 14,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {fs ? "A" : l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Reglages({ params, budget, budgetMois, recurrentes, regles, actions, readOnly, notifs }) {
  const [ouvert, setOuvert] = React.useState(null),
    [groupeOuvert, setGroupeOuvert] = React.useState(null),
    [saisie, setSaisie] = React.useState("");
  const jour = Math.round(param(params, "ep_auto_jour", 3)),
    seuil = Math.round(param(params, "alerte_seuil", 50)),
    postes = (budget || [])
      .filter((b) => b.kind === "charge" && b.line_key !== "c_sport" && b.archive_depuis == null)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0)),
    M = moisNow(),
    actives = (recurrentes || [])
      .filter((r) => r.actif !== false && (r.fin == null || num(r.fin) >= M))
      .sort((a, b) => num(a.jour) - num(b.jour) || (a.sort || 0) - (b.sort || 0)),
    nomPoste = (id) => ((budget || []).find((b) => b.id === id) || {}).poste || "?",
    groupes = [
      ...postes.map((p) => ({
        cle: p.id,
        icone: catIcone(p.poste),
        label: p.poste,
        filtre: (r) => !r.groupe && r.budget_line_id === p.id,
        ajout: { budget_line_id: p.id },
      })),
      ...GROUPES.map(([g, i, l]) => ({
        cle: g,
        icone: i,
        label: l,
        filtre: (r) => r.groupe === g,
        ajout: { groupe: g },
      })),
    ],
    nbMots = (regles || []).length,
    a = actions || {},
    taille = Math.round(param(params, "affichage_taille", 2)),
    theme = Math.round(param(params, "affichage_theme", 1)),
    affichage = (cle, v, libelle) => {
      appliquerAffichage(cle === "affichage_taille" ? v : taille, cle === "affichage_theme" ? v : theme);
      if (!readOnly && a.reglage) a.reglage(cle, v, libelle);
    };
  return (
    <section className="sec">
      <h2>Réglages</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ ...carte, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>🎨 Affichage</div>
          <Segments
            label="Taille du texte"
            choix={TAILLES.map(([v, l], i) => [v, l, null, 13 + i * 4])}
            valeur={taille}
            onChoisir={(v) => affichage("affichage_taille", v, "Texte : " + TAILLES.find((t) => t[0] === v)[1].toLowerCase())}
          />
          <Segments
            label="Thème"
            choix={THEMES}
            valeur={theme}
            onChoisir={(v) => affichage("affichage_theme", v, "Thème : " + THEMES.find((t) => t[0] === v)[1].replace(/^\S+ /, "").toLowerCase())}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <Reglette
            icone="🐷"
            label="Épargne auto"
            aria="Jour de l'épargne automatique"
            valeur={"le " + jour}
            onMoins={
              readOnly || jour <= 1
                ? null
                : () => a.reglage("ep_auto_jour", jour - 1, "Épargne automatique le " + (jour - 1))
            }
            onPlus={
              readOnly || jour >= 28
                ? null
                : () => a.reglage("ep_auto_jour", jour + 1, "Épargne automatique le " + (jour + 1))
            }
          />
          <Reglette
            icone="🟠"
            label="Alerte si reste <"
            aria="Seuil de l'alerte orange"
            valeur={seuil}
            suffixe=" €"
            onMoins={
              readOnly || seuil <= 0
                ? null
                : () =>
                    a.reglage(
                      "alerte_seuil",
                      Math.max(0, seuil - 10),
                      "Alerte sous " + Math.max(0, seuil - 10) + " €",
                    )
            }
            onPlus={
              readOnly
                ? null
                : () => a.reglage("alerte_seuil", seuil + 10, "Alerte sous " + (seuil + 10) + " €")
            }
          />
        </div>

        <div style={titreSection}>
          <span>Dépenses récurrentes</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--slate)" }}>
            {euros(actives.reduce((s, r) => s + num(r.montant), 0))} / mois
          </span>
        </div>
        <section aria-label="Dépenses récurrentes" style={{ ...carte, padding: "4px 0" }}>
          {actives.map((r) => (
            <button
              key={r.id}
              type="button"
              disabled={readOnly}
              onClick={() => setOuvert({ type: "rec", r })}
              aria-label={
                r.label +
                ", " +
                euros(r.montant) +
                " le " +
                r.jour +
                ", " +
                nomPoste(r.budget_line_id) +
                (readOnly ? "" : ", modifier")
              }
              style={{
                width: "100%",
                minHeight: 58,
                border: 0,
                background: "transparent",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0 14px",
                textAlign: "left",
                color: "var(--ink)",
                fontFamily: "inherit",
                cursor: readOnly ? "default" : "pointer",
              }}
            >
              <span
                style={{
                  flex: "none",
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "var(--violet-doux)",
                  color: "var(--t-violet)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 900,
                  lineHeight: 1.1,
                }}
              >
                <span>le</span>
                <span style={{ fontSize: 15 }}>{r.jour}</span>
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14.5, fontWeight: 800 }}>{r.label}</span>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--slate)" }}>
                  {nomPoste(r.budget_line_id)}
                  {r.fin != null ? " · jusqu'en " + MOIS[r.fin] : ""}
                </span>
              </span>
              <span style={{ fontSize: 14.5, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                {euros(r.montant)}
              </span>
            </button>
          ))}
          {!actives.length && (
            <div className="detail" style={{ padding: "12px 14px" }}>
              Aucune dépense récurrente.
            </div>
          )}
          {!readOnly && (
            <button
              type="button"
              onClick={() => setOuvert({ type: "rec", r: null })}
              style={{
                width: "calc(100% - 24px)",
                margin: "4px 12px 8px",
                minHeight: 44,
                border: "2px dashed var(--bord-violet)",
                borderRadius: 14,
                background: "transparent",
                color: "var(--t-violet)",
                fontFamily: "inherit",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              + Récurrente
            </button>
          )}
        </section>

        <div style={titreSection}>
          <span>Rappels sur le téléphone</span>
        </div>
        <section aria-label="Rappels" style={{ ...carte, padding: "4px 0" }}>
          {notifs && notifs.etat === "actives" && (
            <div style={{ padding: "10px 14px", fontSize: 13.5, fontWeight: 800, color: "var(--t-vert)" }}>
              ✓ Rappels actifs sur ce téléphone
            </div>
          )}
          {notifs && notifs.etat && notifs.etat !== "actives" && !readOnly && (
            <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-soft)" }}>
                {notifs.message}
              </div>
              {notifs.activer && (
                <button
                  type="button"
                  onClick={notifs.activer}
                  style={{
                    minHeight: 48,
                    borderRadius: 14,
                    border: 0,
                    background: TEAL,
                    color: "#ffffff",
                    fontFamily: "inherit",
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  🔔 Activer sur ce téléphone
                </button>
              )}
            </div>
          )}
          {RAPPELS.map(([cle, i, l, unite]) => {
            const v = param(params, cle, 0),
              on = v > 0,
              d = Math.abs(v) || DELAIS[unite][0],
              liste = DELAIS[unite];
            return (
              <div
                key={cle}
                style={{
                  minHeight: 60,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0 10px 0 14px",
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 20 }}>
                  {i}
                </span>
                <span style={{ flex: 1, fontSize: 14.5, fontWeight: 800 }}>{l}</span>
                {on && (
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => {
                      const n = liste[(liste.indexOf(d) + 1) % liste.length] || liste[0];
                      a.reglage(cle, n, l + " : " + n + (unite === "h" ? " h" : " j") + " avant");
                    }}
                    aria-label={"Délai : " + d + (unite === "h" ? " heures" : " jours") + " avant, changer"}
                    style={{
                      minHeight: 36,
                      padding: "0 10px",
                      borderRadius: 10,
                      border: 0,
                      background: "var(--fond-gris)",
                      color: "var(--ink)",
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {d + (unite === "h" ? " h" : " j") + " avant"}
                  </button>
                )}
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={l}
                  disabled={readOnly}
                  onClick={() =>
                    a.reglage(cle, on ? -d : d, l + (on ? " : rappel coupé" : " : rappel activé"))
                  }
                  style={{
                    flex: "none",
                    width: 52,
                    height: 32,
                    borderRadius: 99,
                    border: 0,
                    background: on ? "var(--teal-dark)" : "var(--line-strong)",
                    position: "relative",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 3,
                      left: on ? 23 : 3,
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: "var(--surface)",
                      boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                      transition: "left .15s",
                    }}
                  />
                </button>
              </div>
            );
          })}
        </section>

        <div style={titreSection}>
          <span>Import du relevé</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--slate)" }}>{nbMots} mots-clés</span>
        </div>
        {groupes.map((g) => {
          const mots = (regles || [])
              .filter(g.filtre)
              .sort((x, y) =>
                x.source === y.source ? (x.sort || 0) - (y.sort || 0) : x.source === "base" ? -1 : 1,
              ),
            o = groupeOuvert === g.cle;
          return (
            <section key={g.cle} aria-label={g.label} style={{ ...carte, overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => (setGroupeOuvert(o ? null : g.cle), setSaisie(""))}
                aria-expanded={o}
                style={{
                  width: "100%",
                  minHeight: 56,
                  border: 0,
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0 14px",
                  textAlign: "left",
                  color: "var(--ink)",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 20 }}>
                  {g.icone}
                </span>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 800 }}>{g.label}</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "var(--slate)",
                    background: "var(--fond-gris)",
                    borderRadius: 99,
                    padding: "3px 9px",
                  }}
                >
                  {mots.length}
                </span>
                <span aria-hidden="true" style={{ fontSize: 14, color: "var(--slate)" }}>
                  {o ? "▲" : "▼"}
                </span>
              </button>
              {o && (
                <div style={{ padding: "0 14px 14px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {mots.map((r) => (
                    <span
                      key={r.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 2,
                        borderRadius: 99,
                        background: r.source === "appris" ? "var(--rose-doux)" : "var(--teal-doux)",
                        color: r.source === "appris" ? "var(--t-rose)" : "var(--t-teal)",
                        padding: "2px 2px 2px 12px",
                        fontSize: 13.5,
                        fontWeight: 800,
                      }}
                    >
                      {r.motif}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => a.regleSupprimer(r)}
                          aria-label={"Retirer " + r.motif}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            border: 0,
                            background: "transparent",
                            color: "inherit",
                            fontSize: 15,
                            cursor: "pointer",
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  ))}
                  {!readOnly && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                          await a.regleAjouter({ motif: saisie, ...g.ajout }), setSaisie("");
                        } catch (e2) {}
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        height: 40,
                        borderRadius: 99,
                        border: "2px dashed var(--bord-teal)",
                        padding: "0 4px 0 12px",
                        gap: 4,
                      }}
                    >
                      <input
                        aria-label={"Nouveau mot-clé pour " + g.label}
                        placeholder="ex. BIOCOOP"
                        value={saisie}
                        onChange={(e) => setSaisie(e.target.value)}
                        style={{
                          width: 104,
                          border: 0,
                          background: "transparent",
                          font: "inherit",
                          fontSize: 13.5,
                          fontWeight: 800,
                          color: "var(--ink)",
                          textTransform: "uppercase",
                          outline: "none",
                        }}
                      />
                      <button
                        type="submit"
                        aria-label="Ajouter"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          border: 0,
                          background: TEAL,
                          color: "#ffffff",
                          fontSize: 16,
                          fontWeight: 900,
                          cursor: "pointer",
                        }}
                      >
                        +
                      </button>
                    </form>
                  )}
                </div>
              )}
            </section>
          );
        })}
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            background: "var(--orange-doux)",
            color: "var(--t-orange)",
            borderRadius: 16,
            padding: "12px 14px",
            fontSize: 13.5,
            fontWeight: 700,
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 18 }}>
            ❓
          </span>
          <span>PayPal : toujours demandé à l'import</span>
        </div>
        <div
          style={{
            display: "flex",
            gap: 14,
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--slate)",
            margin: "0 4px",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 99, background: "var(--teal-doux)" }} />
            de base
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 99, background: "var(--rose-doux)" }} />
            appris à l'import
          </span>
        </div>
      </div>
      {ouvert && ouvert.type === "rec" && (
        <FeuilleRecurrente
          r={ouvert.r}
          postes={postes}
          onClose={() => setOuvert(null)}
          onEnregistrer={a.recurrenteEnregistrer}
          onArreter={a.recurrenteArreter}
        />
      )}
    </section>
  );
}
