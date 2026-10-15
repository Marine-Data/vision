import React from "react";
import { STYLE_CARTE_CONNEXION, STYLE_ECRAN_CONNEXION } from "./Connexion.jsx";
import { creneauxLibres } from "../lib/partage.js";
import { emojiDe, estAnnulee, evenementsLe, horairesDe, masqueLe } from "../lib/evenements.js";
import { actifLe } from "../lib/periode.js";
import { lireCreneau } from "./SportPage.jsx";

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

// ---------------------------------------------------------------
// Écran d'arrivée d'un lien de lecture : peu de mots, l'essentiel tout de suite.
// ---------------------------------------------------------------
let invitationInstall = null;
try {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    invitationInstall = e;
  });
} catch (e) {}

const JOURS_L = ["L", "M", "M", "J", "V", "S", "D"];
const JOURS_C = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."];
const isoJ = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const hCourt = (t) => (t ? t.replace(/^0/, "").replace(":00", "h").replace(":", "h") : "");
const nomCourt = (t) => String(t || "").replace(/^Sport\s*[—-]\s*/, "").replace(/^Free Style\s+/i, "").split(/\s+[—-]\s+/)[0];

// Ce qui a lieu un jour donné : cours de la semaine (période, annulation, pause) et événements à dates.
function programmeDu(d, { contenu, seances, evenements, sportSeul }) {
  const dIso = isoJ(d),
    j = (d.getDay() + 6) % 7,
    masque = masqueLe(evenements, dIso),
    l = [];
  (contenu || [])
    .filter((c) => c.type === "cours" && (!sportSeul || c.groupe === "sport"))
    .forEach((c) => {
      const x = lireCreneau(c.detail),
        sport = c.groupe === "sport";
      if (x.jour !== j || !x.debut || !actifLe(c, dIso) || masque.has(sport ? "sport" : "cours")) return;
      if ((seances || []).some((s) => s.date === dIso && s.cours_id === c.id && s.fait === false)) return;
      l.push({ h: x.debut, nom: nomCourt(c.titre), em: sport ? "🤸" : c.emoji || "📘" });
    });
  if (!sportSeul)
    evenementsLe(evenements, dIso)
      .filter((e) => !estAnnulee(e, dIso))
      .forEach((e) => l.push({ h: horairesDe(e, dIso)[0] || "00:00", nom: e.titre, em: emojiDe(e) }));
  return { liste: l.sort((a, b) => a.h.localeCompare(b.h)), pause: masque.size > 0 };
}

function Anneau({ pct, texte, fond, centre }) {
  const deg = Math.max(0, Math.min(100, pct)) * 3.6;
  return (
    <span aria-hidden="true" style={{ flex: "none", width: 96, height: 96, borderRadius: "50%", background: `conic-gradient(#ffffff 0 ${deg}deg, rgba(255,255,255,.22) ${deg}deg 360deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ width: 74, height: 74, borderRadius: "50%", background: centre, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", fontSize: 25, fontWeight: 700, color: "#ffffff" }}>{texte}</span>
    </span>
  );
}

export function LectureAccueil({ lecture, contenu, seances, evenements, titreDefaut, image, installee, aller, onCreer }) {
  const [astuce, setAstuce] = React.useState(false);
  const sections = (lecture && lecture.sections) || [],
    planning = sections.includes("planning"),
    sport = sections.includes("sport"),
    budget = sections.includes("budget") && lecture.budget && lecture.budget.pct,
    prenom = (lecture && lecture.prenom) || "",
    auj = new Date(),
    lundi = new Date(auj.getFullYear(), auj.getMonth(), auj.getDate() - ((auj.getDay() + 6) % 7)),
    opts = { contenu, seances, evenements, sportSeul: !planning };
  // Prochain moment (7 jours) : « Ce soir : Tricks 20h ».
  let prochain = null;
  for (let k = 0; k < 8 && !prochain && (planning || sport); k++) {
    const d = new Date(auj.getFullYear(), auj.getMonth(), auj.getDate() + k),
      maintenant = String(auj.getHours()).padStart(2, "0") + ":" + String(auj.getMinutes()).padStart(2, "0"),
      x = programmeDu(d, opts).liste.find((p) => k > 0 || p.h >= maintenant);
    if (x) prochain = { ...x, quand: k === 0 ? (x.h >= "17:00" ? "Ce soir" : "Aujourd'hui") : k === 1 ? "Demain" : JOURS_C[(d.getDay() + 6) % 7] };
  }
  const semaine = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(lundi.getFullYear(), lundi.getMonth(), lundi.getDate() + k),
      p = programmeDu(d, opts),
      x = p.liste[0];
    return { l: JOURS_L[k], em: x ? x.em : p.pause ? "🏖" : "", auj: isoJ(d) === isoJ(auj), sport: x && x.em === "🤸", pause: !x && p.pause };
  });
  const idsSport = new Set((contenu || []).filter((c) => c.type === "cours" && c.groupe === "sport").map((c) => c.id)),
    nbSeances = (seances || []).filter((s) => s.fait && (!s.cours_id || idsSport.has(s.cours_id))).length,
    carteStyle = { border: 0, width: "100%", font: "inherit", textAlign: "left", cursor: "pointer" };
  return (
    <div className="lecture-bord">
      <header style={{ padding: "34px 22px 40px", color: "#ffffff", display: "flex", flexDirection: "column", gap: 14, backgroundImage: `linear-gradient(180deg, rgba(9,42,49,.35), rgba(9,42,49,.8)), url(${image})`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: ".14em", textTransform: "uppercase", opacity: 0.85 }}>{"Bonjour" + (lecture.nom ? " " + lecture.nom : "") + " 👋"}</span>
        <span style={{ fontFamily: "Georgia, serif", fontSize: prenom ? 48 : 34, fontWeight: 700, lineHeight: 1 }}>{prenom || titreDefaut}</span>
        {lecture.mot && <span style={{ alignSelf: "flex-start", maxWidth: 300, background: "#ffffff", color: "#0e3a42", borderRadius: "20px 20px 20px 6px", padding: "12px 14px", fontSize: 16, fontWeight: 700, lineHeight: 1.35, boxShadow: "0 10px 30px rgba(0,0,0,.25)" }}>{lecture.mot}</span>}
        <span style={{ fontSize: 13, fontWeight: 800, opacity: 0.8 }}>👁 Lecture seule</span>
      </header>
      <div style={{ marginTop: -16, borderRadius: "26px 26px 0 0", background: "var(--paper)", padding: "18px 12px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
        {(planning || sport) && (
          <button type="button" onClick={() => aller(planning ? "planning" : "sport")} aria-label={(prochain ? prochain.quand + " : " + prochain.nom + " " + hCourt(prochain.h) : "Rien de prévu") + ", ouvrir"} style={{ ...carteStyle, borderRadius: 24, background: "var(--surface)", padding: 16, display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 2px 10px rgba(14,58,66,.08)", color: "var(--ink)" }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: 25, fontWeight: 700, lineHeight: 1.15 }}>{prochain ? prochain.quand + " : " + prochain.nom + " " + hCourt(prochain.h) : "Semaine calme"}</span>
            <span aria-hidden="true" style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 5 }}>
              {semaine.map((j, k) => (
                <span key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "7px 0", borderRadius: 14, background: j.auj ? "var(--entete)" : j.pause ? "var(--ambre-doux)" : j.sport ? "var(--rose-doux)" : j.em ? "var(--teal-doux)" : "var(--fond-doux)", color: j.auj ? "#ffffff" : "var(--ink-soft)" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 900 }}>{j.l}</span>
                  <span style={{ fontSize: 17, height: 22, lineHeight: "22px" }}>{j.em}</span>
                </span>
              ))}
            </span>
          </button>
        )}
        {budget ? (
          <button type="button" onClick={() => aller("tresorerie")} aria-label={budget.reste + " % du salaire restant, épargne " + budget.objectif + " %, ouvrir"} style={{ ...carteStyle, borderRadius: 24, background: "linear-gradient(140deg, #0a7b8a, #0e5a66)", color: "#ffffff", padding: 18, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 8px 22px rgba(10,123,138,.3)" }}>
            <Anneau pct={budget.reste ?? 0} texte={(budget.reste ?? 0) + " %"} centre="#0b6a76" />
            <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700 }}>du salaire restant</span>
              {budget.objectif != null && <span style={{ fontSize: 14, fontWeight: 800, opacity: 0.9 }}>🎯 Épargne : {budget.objectif} %</span>}
            </span>
          </button>
        ) : (
          sport && (
            <button type="button" onClick={() => aller("sport")} aria-label={nbSeances + " séances depuis septembre, ouvrir"} style={{ ...carteStyle, borderRadius: 24, background: "linear-gradient(140deg, #c2477f, #8f2d5a)", color: "#ffffff", padding: 18, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 8px 22px rgba(194,71,127,.3)" }}>
              <Anneau pct={100} texte={String(nbSeances)} centre="#a8386c" />
              <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700 }}>séances depuis sept.</span>
            </button>
          )
        )}
        {lecture.formule === "deux" && (
          <button type="button" onClick={onCreer} style={{ height: 56, borderRadius: 18, border: 0, background: "linear-gradient(140deg, #0e3a42, #0a7b8a)", color: "#ffffff", font: "inherit", fontSize: 16, fontWeight: 900, cursor: "pointer" }}>
            ✨ Créer la mienne
          </button>
        )}
        {!installee && (
          <button
            type="button"
            onClick={async () => {
              if (invitationInstall) {
                invitationInstall.prompt();
                invitationInstall = null;
              } else setAstuce(true);
            }}
            style={{ alignSelf: "center", minHeight: 44, padding: "0 18px", border: "2px dashed var(--line-strong)", borderRadius: 99, background: "transparent", color: "var(--ink)", font: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
          >
            📲 Garder sur mon écran
          </button>
        )}
        {astuce && <span style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--slate)" }}>Menu ⋮ du navigateur → « Ajouter à l'écran d'accueil »</span>}
      </div>
    </div>
  );
}
