import React from "react";
import { STYLE_CARTE_CONNEXION, STYLE_ECRAN_CONNEXION } from "./Connexion.jsx";
import { creneauxLibres } from "../lib/partage.js";

// Écrans de la personne qui reçoit un lien, budget résumé, plannings échangés.

const eur = (v) => Math.round(Number(v) || 0).toLocaleString("fr-FR") + " €";
const carte = { background: "var(--surface)", borderRadius: 18, boxShadow: "0 1px 2px rgba(14,58,66,.08)" };

// Avant d'afficher l'app partagée : chargement, code, lien bloqué ou plus valable.
export function EcranLecture({ etat, onCode }) {
  const [code, setCode] = React.useState("");
  const qui = (etat && etat.prenom) || "la personne";
  let titre, texte, saisie = false;
  if (!etat) (titre = "Ouverture…"), (texte = "");
  else if (etat.etat === "code") (titre = "🔒 Code"), (texte = "Tape le code donné par " + qui + "."), (saisie = true);
  else if (etat.etat === "bloque") (titre = "🔒 Lien bloqué"), (texte = "Trop d'essais. Demande à " + qui + " de le réactiver.");
  else if (etat.etat === "invitation") (titre = "✉️ Invitation"), (texte = "Ce lien sert à créer ton app.");
  else (titre = "Lien plus valable"), (texte = "Il a été coupé ou il a expiré. Demande un nouveau lien.");
  return (
    <div style={STYLE_ECRAN_CONNEXION}>
      <div className="auth" style={STYLE_CARTE_CONNEXION}>
        <h1>{titre}</h1>
        {texte && <p>{texte}</p>}
        {saisie && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              code.length === 4 && onCode(code);
            }}
          >
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              aria-label="Code à 4 chiffres"
              placeholder="• • • •"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              style={{ textAlign: "center", fontSize: 26, letterSpacing: ".4em", fontFamily: "Georgia, serif", fontWeight: 700 }}
            />
            <button className="btn" disabled={code.length < 4}>
              Entrer
            </button>
          </form>
        )}
        {etat && etat.erreur && (
          <p role="alert" style={{ color: "var(--alert)", fontSize: 13 }}>
            Code faux · {etat.restants} essai{etat.restants > 1 ? "s" : ""} restant{etat.restants > 1 ? "s" : ""}
          </p>
        )}
        {etat && etat.etat === "invitation" && (
          <button className="btn" onClick={() => (window.location.href = window.location.href.replace("?voir=", "?invite="))}>
            Créer mon app
          </button>
        )}
      </div>
    </div>
  );
}

// Budget partagé : le résumé calculé par l'app de la propriétaire (pourcentages, euros si autorisés).
export function BudgetPartage({ budget }) {
  if (!budget || !budget.pct)
    return (
      <section className="sec">
        <h2>Budget</h2>
        <p className="sub">Pas encore de résumé disponible.</p>
      </section>
    );
  const p = budget.pct,
    e = budget.eur,
    couleur = (x) => (x == null ? "var(--line)" : x > 100 ? "var(--c-rouge)" : x > 85 ? "var(--c-orange)" : "var(--c-vert)");
  return (
    <section className="sec">
      <h2>Budget · {budget.mois}</h2>
      {budget.maj && (
        <p className="sub">
          Mis à jour le{" "}
          {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(budget.maj))}
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ background: (e ? e.reste : p.reste) < 0 ? "var(--c-rouge)" : "var(--teal-dark)", color: "#ffffff", borderRadius: 22, padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.92 }}>Reste sur le salaire</span>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 34, fontWeight: 700 }}>{e ? eur(e.reste) : (p.reste ?? 0) + " %"}</span>
          <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.92 }}>
            {e ? "Dépensé " + eur(e.depense) + " · épargné " + eur(e.epargne) : "Dépensé : " + (p.depense ?? 0) + " % du salaire"}
          </span>
        </div>
        <div style={{ ...carte, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>🎯</span>
          <span style={{ flex: 1, fontSize: 14.5, fontWeight: 800 }}>Objectif 6 mois</span>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "var(--t-vert)" }}>
            {e ? eur(e.matelas) + " · " : ""}
            {p.objectif} %
          </span>
        </div>
        <div style={{ ...carte, padding: "6px 14px" }}>
          {p.postes.map((x, i) => {
            const m = e && e.postes[i];
            return (
              <div key={i} style={{ padding: "8px 0", borderBottom: i < p.postes.length - 1 ? "1px solid var(--line)" : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{x.icone}</span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 800 }}>{x.poste}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: x.pct > 100 ? "var(--t-rouge)" : "var(--ink-soft)" }}>
                    {m ? eur(m.r) + " / " + eur(m.b) : x.pct == null ? "—" : x.pct + " %"}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: "var(--fond-gris)", marginTop: 6, overflow: "hidden" }}>
                  <div style={{ height: 6, width: Math.min(100, x.pct || 0) + "%", background: couleur(x.pct), borderRadius: 99 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Écran de connexion : bandeau « … t'invite » avec petit mot, modèle et échange.
export function BandeauInvitation({ info, choix, setChoix }) {
  if (!info || info.etat !== "ok" || info.proprio) return null;
  const ligne = (cle, icone, label, aide) => (
    <button
      type="button"
      role="switch"
      aria-checked={!!choix[cle]}
      onClick={() => setChoix({ ...choix, [cle]: !choix[cle] })}
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", minHeight: 48, border: 0, background: "transparent", padding: 0, textAlign: "left", font: "inherit", color: "var(--ink)", cursor: "pointer" }}
    >
      <span style={{ fontSize: 18 }}>{icone}</span>
      <span style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 14, fontWeight: 800 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--slate)" }}>{aide}</span>
      </span>
      <span style={{ width: 44, height: 26, borderRadius: 99, background: choix[cle] ? "var(--teal-dark)" : "var(--line-strong)", position: "relative", flex: "none" }}>
        <span style={{ position: "absolute", top: 3, left: choix[cle] ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#ffffff" }} />
      </span>
    </button>
  );
  const qui = info.prenom || "On";
  return (
    <div style={{ textAlign: "left", marginBottom: 14 }}>
      <div style={{ fontSize: 30 }}>👋</div>
      <h1 style={{ margin: "6px 0" }}>{qui} t'invite</h1>
      <p style={{ margin: "0 0 8px" }}>Ton app à toi. Personne d'autre ne voit tes données.</p>
      {info.mot && (
        <p style={{ margin: "0 0 10px", padding: "10px 12px", borderRadius: 12, background: "var(--teal-doux)", fontStyle: "italic" }}>« {info.mot} »</p>
      )}
      {ligne("modele", "📋", "Partir du modèle de " + (info.prenom || "ton invitante"), "Ses postes et onglets, sans ses montants")}
      {info.echange && ligne("echange", "🔁", "Échanger nos plannings", "Vos cours visibles des deux côtés")}
    </div>
  );
}

// Planning : créneaux libres en commun avec chaque personne qui échange son planning.
export function PlanningsEchanges({ partenaires, mesCours, onArreter, readOnly }) {
  if (!partenaires || !partenaires.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "10px 0 14px" }}>
      {partenaires.map((p) => {
        const libres = creneauxLibres(mesCours, p.cours);
        return (
          <div key={p.echange_id} style={{ background: "var(--vert-doux)", borderRadius: 16, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ flex: 1, fontSize: 14.5, fontWeight: 800, color: "var(--t-vert)" }}>🔁 Libres ensemble · {p.prenom}</span>
              {!readOnly && (
                <button type="button" onClick={() => onArreter(p)} style={{ height: 30, padding: "0 10px", borderRadius: 9, border: 0, background: "var(--surface)", color: "var(--slate)", font: "inherit", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                  Arrêter
                </button>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {libres.length ? (
                libres.slice(0, 8).map((l) => (
                  <span key={l} style={{ height: 30, padding: "0 10px", borderRadius: 99, background: "var(--surface)", color: "var(--t-vert)", fontSize: 12.5, fontWeight: 800, display: "flex", alignItems: "center" }}>
                    {l}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--slate)" }}>Aucun créneau libre en commun cette semaine.</span>
              )}
            </div>
            {p.cours.length > 0 && (
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)" }}>
                Ses cours : {p.cours.map((c) => c.titre.replace(/^Sport\s*[—-]\s*/, "") + " (" + (c.detail || "").split(" ")[0].slice(0, 3).toLowerCase() + ".)").join(", ")}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Accueil d'un lien partagé : raccourcis vers les parties partagées.
export function RaccourcisLecture({ sections, aller, prenom }) {
  const L = [
    ["planning", "📅", "Planning", "planning"],
    ["budget", "💶", "Budget du mois", "tresorerie"],
    ["suivi", "🧭", "Parcours", "suivi"],
    ["sport", "🤸", "Sport", "sport"],
    ["homework", "📚", "Devoirs", "homework"],
    ["pieces", "📄", "Pièces", "pieces"],
  ].filter(([k]) => (sections || []).includes(k));
  return (
    <section className="sec">
      <h2>{prenom ? "L'app de " + prenom : "Aperçu"}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        {L.map(([k, i, l, ong]) => (
          <button
            key={k}
            type="button"
            onClick={() => aller(ong)}
            style={{ ...carte, border: 0, minHeight: 92, padding: 14, display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "space-between", font: "inherit", color: "var(--ink)", cursor: "pointer", textAlign: "left" }}
          >
            <span style={{ fontSize: 26 }}>{i}</span>
            <span style={{ fontSize: 15, fontWeight: 800 }}>{l}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
