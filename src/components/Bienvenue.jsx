import React from "react";
import { IMG_FOND } from "../assets/images.js";
import { EPARGNES_PROPOSEES, POSTES_PROPOSES, creerNouveauCompte, nombre } from "../lib/nouveauCompte.js";
import { ONGLETS_AU_CHOIX } from "../lib/profil.js";
import { moisNow } from "../lib/mois.js";

// Écran « Bienvenue » d'un compte neuf : 6 questions courtes, chacune peut être passée.

const ETAPES = [
  ["toi", "👋", "Bienvenue !", "Deux mots pour personnaliser ton app."],
  ["salaire", "💶", "Ton salaire", "Pour savoir ce qui te reste chaque mois."],
  ["postes", "🧾", "Tes dépenses du mois", "Coche ce qui te concerne, ajuste les montants."],
  ["epargne", "🐷", "Ton épargne", "Ce que tu mets de côté chaque mois."],
  ["suivis", "🧭", "Qu'est-ce que tu veux suivre ?", "Le budget est toujours là. Le reste, à toi de choisir."],
  ["semaine", "📅", "Ta semaine type", "Tes activités régulières. Tu pourras en ajouter."],
];
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const eur = (v) => Math.round(v).toLocaleString("fr-FR") + " €";

const carte = {
  background: "var(--surface)",
  borderRadius: 18,
  padding: 14,
  boxShadow: "0 1px 2px rgba(14,58,66,.08)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};
const champ = {
  height: 48,
  borderRadius: 12,
  border: "2px solid var(--line)",
  padding: "0 12px",
  font: "inherit",
  fontSize: 17,
  fontWeight: 700,
  color: "var(--ink)",
  background: "var(--surface)",
  boxSizing: "border-box",
  minWidth: 0,
};
const petitChamp = { ...champ, width: 84, height: 42, fontSize: 16, textAlign: "right", padding: "0 8px" };
const pointille = {
  minHeight: 46,
  borderRadius: 16,
  border: "2px dashed var(--bord-teal)",
  background: "transparent",
  color: "var(--t-teal)",
  font: "inherit",
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
};
const libelle = { fontSize: 13, fontWeight: 800, color: "var(--slate)" };

function Case({ on }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 28,
        height: 28,
        flex: "none",
        borderRadius: 9,
        border: "2px solid " + (on ? "var(--c-teal)" : "var(--line-strong)"),
        background: on ? "var(--c-teal)" : "var(--surface)",
        color: "#ffffff",
        fontWeight: 900,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {on ? "✓" : ""}
    </span>
  );
}

export function Bienvenue({ supabase, uid, onTermine }) {
  const [E, setE] = React.useState(0),
    [r, setR] = React.useState({
      prenom: "",
      projet: "",
      salaire: "",
      postes: POSTES_PROPOSES.map(([k, e, l, on]) => ({ k, e, l, m: "", on })),
      epargnes: EPARGNES_PROPOSEES.map(([k, e, l]) => ({ k, e, l, m: "" })),
      deja: "",
      suivis: { planning: true },
      creneaux: [],
      passe: {},
    }),
    [nv, setNv] = React.useState({ jour: 0, t: "", h: "" }),
    [nouveauPoste, setNouveauPoste] = React.useState(null),
    [nouvelleEpargne, setNouvelleEpargne] = React.useState(null),
    [enCours, setEnCours] = React.useState(false),
    [erreur, setErreur] = React.useState("");
  const maj = (o) => setR((x) => ({ ...x, ...o })),
    etapes = ETAPES.filter(([k]) => k !== "semaine" || r.suivis.planning),
    etape = etapes[Math.min(E, etapes.length - 1)],
    derniere = E >= etapes.length - 1,
    salaire = nombre(r.salaire),
    objectif = 6 * salaire,
    deja = nombre(r.deja),
    pct = objectif > 0 ? Math.min(100, (deja / objectif) * 100) : 0;

  async function terminer(rep) {
    setEnCours(true), setErreur("");
    try {
      await creerNouveauCompte(supabase, { ...rep, mois: moisNow() }, uid);
      onTermine();
    } catch (e) {
      setErreur("L'enregistrement n'a pas marché (" + e.message + "). Réessaie.");
      setEnCours(false);
    }
  }
  function avancer(passer) {
    const k = etape[0],
      rep = { ...r, passe: { ...r.passe, [k]: !!passer } };
    // Un créneau tapé mais pas ajouté compte quand même.
    if (k === "semaine" && !passer && nv.t.trim()) rep.creneaux = [...rep.creneaux, { j: nv.jour, t: nv.t.trim(), h: nv.h }];
    setR(rep);
    if (derniere) terminer(rep);
    else setE(E + 1), window.scrollTo(0, 0);
  }
  const posteMaj = (i, patch) => maj({ postes: r.postes.map((p, k) => (k === i ? { ...p, ...patch } : p)) }),
    epargneMaj = (i, patch) => maj({ epargnes: r.epargnes.map((p, k) => (k === i ? { ...p, ...patch } : p)) });

  return (
    <div style={{ minHeight: "100dvh", background: "var(--paper)", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(9,42,49,.55), rgba(9,42,49,.78)), url(${IMG_FOND})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#ffffff",
          padding: "calc(16px + env(safe-area-inset-top)) 18px 22px",
        }}
      >
        <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <button
              type="button"
              onClick={() => setE(Math.max(0, E - 1))}
              aria-label="Question précédente"
              style={{ width: 42, height: 42, borderRadius: 12, border: 0, background: "rgba(255,255,255,.18)", color: "#ffffff", fontSize: 18, cursor: "pointer", visibility: E > 0 ? "visible" : "hidden" }}
            >
              ←
            </button>
            <div style={{ display: "flex", gap: 6 }} role="progressbar" aria-valuemin={1} aria-valuemax={etapes.length} aria-valuenow={E + 1} aria-label={"Question " + (E + 1) + " sur " + etapes.length}>
              {etapes.map((x, i) => (
                <span key={x[0]} style={{ width: i === E ? 22 : 8, height: 8, borderRadius: 99, background: i <= E ? "#ffffff" : "rgba(255,255,255,.35)", transition: "width .2s" }} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => avancer(true)}
              disabled={enCours}
              style={{ height: 42, padding: "0 14px", borderRadius: 12, border: 0, background: "rgba(255,255,255,.18)", color: "#ffffff", font: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
            >
              Passer
            </button>
          </div>
          <div style={{ fontSize: 32, lineHeight: 1 }} aria-hidden="true">
            {etape[1]}
          </div>
          <h1 style={{ margin: 0, color: "#ffffff", fontSize: 26 }}>{etape[2]}</h1>
          <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.92 }}>{etape[3]}</div>
        </div>
      </div>

      <div style={{ flex: 1, width: "100%", maxWidth: 560, margin: "0 auto", padding: "18px 16px 120px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 10 }}>
        {etape[0] === "toi" && (
          <>
            <label style={carte}>
              <span style={libelle}>Ton prénom</span>
              <input style={champ} value={r.prenom} onChange={(e) => maj({ prenom: e.target.value })} autoComplete="given-name" />
            </label>
            <label style={carte}>
              <span style={libelle}>
                Ton grand projet de l'année <span style={{ fontWeight: 600 }}>(facultatif)</span>
              </span>
              <input style={champ} value={r.projet} placeholder="Prépa marathon, nouvel appart…" onChange={(e) => maj({ projet: e.target.value })} />
            </label>
          </>
        )}

        {etape[0] === "salaire" && (
          <div style={carte}>
            <span style={libelle}>Net reçu sur ton compte, chaque mois</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                inputMode="decimal"
                aria-label="Salaire net mensuel"
                style={{ ...champ, flex: 1, height: 60, fontFamily: "Georgia, serif", fontSize: 30, textAlign: "right", borderColor: "var(--teal-dark)" }}
                value={r.salaire}
                placeholder="0"
                onChange={(e) => maj({ salaire: e.target.value })}
              />
              <span style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700 }}>€</span>
            </div>
            <span style={{ fontSize: 13, color: "var(--slate)" }}>Modifiable plus tard dans Budget mois.</span>
          </div>
        )}

        {etape[0] === "postes" && (
          <>
            {r.postes.map((p, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 16,
                  padding: "8px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: p.on ? "var(--surface)" : "transparent",
                  border: "2px solid " + (p.on ? "transparent" : "var(--line)"),
                }}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={p.on}
                  aria-label={p.l}
                  onClick={() => posteMaj(i, { on: !p.on })}
                  style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, minHeight: 44, border: 0, background: "transparent", padding: 0, font: "inherit", color: p.on ? "var(--ink)" : "var(--slate)", textAlign: "left", cursor: "pointer" }}
                >
                  <Case on={p.on} />
                  <span style={{ fontSize: 20 }}>{p.e}</span>
                  <span style={{ fontSize: 15, fontWeight: 800 }}>{p.l}</span>
                </button>
                <input
                  inputMode="decimal"
                  aria-label={"Montant " + p.l}
                  style={{ ...petitChamp, opacity: p.on ? 1 : 0.45 }}
                  value={p.m}
                  placeholder="0"
                  onChange={(e) => posteMaj(i, { m: e.target.value, on: true })}
                />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--slate)" }}>€</span>
              </div>
            ))}
            {nouveauPoste == null ? (
              <button type="button" style={pointille} onClick={() => setNouveauPoste("")}>
                + Autre poste
              </button>
            ) : (
              <form
                style={{ ...carte, flexDirection: "row", alignItems: "center", padding: 8 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!nouveauPoste.trim()) return;
                  maj({ postes: [...r.postes, { e: "•", l: nouveauPoste.trim(), m: "", on: true }] }), setNouveauPoste(null);
                }}
              >
                <input autoFocus aria-label="Nom du poste" placeholder="Animaux, crèche…" style={{ ...champ, flex: 1, height: 44 }} value={nouveauPoste} onChange={(e) => setNouveauPoste(e.target.value)} />
                <button type="submit" style={{ height: 44, padding: "0 14px", borderRadius: 12, border: 0, background: "var(--c-teal)", color: "#ffffff", font: "inherit", fontWeight: 800 }}>
                  Ajouter
                </button>
              </form>
            )}
            <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--slate)" }}>
              Total : {eur(r.postes.filter((p) => p.on).reduce((s, p) => s + nombre(p.m), 0))} / mois
            </div>
          </>
        )}

        {etape[0] === "epargne" && (
          <>
            {r.epargnes.map((p, i) => (
              <div key={i} style={{ ...carte, flexDirection: "row", alignItems: "center", padding: "8px 10px", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{p.e}</span>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 800 }}>{p.l}</span>
                <input inputMode="decimal" aria-label={p.l} style={petitChamp} value={p.m} placeholder="0" onChange={(e) => epargneMaj(i, { m: e.target.value })} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--slate)" }}>€</span>
              </div>
            ))}
            {nouvelleEpargne == null ? (
              <button type="button" style={pointille} onClick={() => setNouvelleEpargne("")}>
                + Autre épargne
              </button>
            ) : (
              <form
                style={{ ...carte, flexDirection: "row", alignItems: "center", padding: 8 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  const l = nouvelleEpargne.trim();
                  if (!l) return;
                  maj({ epargnes: [...r.epargnes, { e: /pea/i.test(l) ? "📈" : "💰", l, m: "" }] }), setNouvelleEpargne(null);
                }}
              >
                <input autoFocus aria-label="Nom de l'épargne" placeholder="LDD, PEA…" style={{ ...champ, flex: 1, height: 44 }} value={nouvelleEpargne} onChange={(e) => setNouvelleEpargne(e.target.value)} />
                <button type="submit" style={{ height: 44, padding: "0 14px", borderRadius: 12, border: 0, background: "var(--c-teal)", color: "#ffffff", font: "inherit", fontWeight: 800 }}>
                  Ajouter
                </button>
              </form>
            )}
            <div style={{ ...carte, background: "var(--vert-doux)", boxShadow: "none", marginTop: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--t-vert)" }}>🎯 Objectif sécurité · 6 mois de salaire</span>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "var(--t-vert)" }}>{salaire ? eur(objectif) : "—"}</span>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700 }}>
                <span style={{ flex: 1 }}>Déjà de côté aujourd'hui (livrets)</span>
                <input inputMode="decimal" aria-label="Déjà de côté" style={{ ...petitChamp, width: 100 }} value={r.deja} placeholder="0" onChange={(e) => maj({ deja: e.target.value })} />
                <span>€</span>
              </label>
              {salaire > 0 && (
                <>
                  <span style={{ height: 8, borderRadius: 99, background: "var(--surface)", overflow: "hidden" }}>
                    <span style={{ display: "block", height: 8, width: pct + "%", background: "var(--c-vert)", borderRadius: 99 }} />
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-vert)" }}>
                    {Math.round(pct)} % · encore {eur(Math.max(0, objectif - deja))}
                  </span>
                </>
              )}
            </div>
          </>
        )}

        {etape[0] === "suivis" && (
          <>
            {ONGLETS_AU_CHOIX.filter(([id]) => id !== "budget").map(([id, e, l, d]) => {
              const on = !!r.suivis[id];
              return (
                <button
                  key={id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => maj({ suivis: { ...r.suivis, [id]: !on } })}
                  style={{
                    minHeight: 62,
                    borderRadius: 16,
                    border: "2px solid " + (on ? "var(--c-teal)" : "var(--line)"),
                    background: on ? "var(--surface)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 12px",
                    textAlign: "left",
                    color: "var(--ink)",
                    font: "inherit",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 24 }}>{e}</span>
                  <span style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 15, fontWeight: 800 }}>{l}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--slate)" }}>{d}</span>
                  </span>
                  <Case on={on} />
                </button>
              );
            })}
          </>
        )}

        {etape[0] === "semaine" && (
          <>
            {r.creneaux.map((c, i) => (
              <div key={i} style={{ ...carte, flexDirection: "row", alignItems: "center", gap: 12, padding: "10px 12px" }}>
                <span style={{ width: 46, height: 46, borderRadius: 12, background: "var(--teal-doux)", color: "var(--t-teal)", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {JOURS[c.j].slice(0, 3).toUpperCase()}
                </span>
                <span style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 15, fontWeight: 800 }}>{c.t}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--slate)" }}>
                    {JOURS[c.j]}
                    {c.h ? " · " + c.h : ""}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={"Retirer " + c.t}
                  onClick={() => maj({ creneaux: r.creneaux.filter((_, k) => k !== i) })}
                  style={{ width: 40, height: 40, borderRadius: 10, border: 0, background: "var(--fond-gris)", color: "var(--slate)", fontSize: 18, cursor: "pointer" }}
                >
                  ×
                </button>
              </div>
            ))}
            <form
              style={carte}
              onSubmit={(e) => {
                e.preventDefault();
                if (!nv.t.trim()) return;
                maj({ creneaux: [...r.creneaux, { j: nv.jour, t: nv.t.trim(), h: nv.h.trim() }] }), setNv({ ...nv, t: "", h: "" });
              }}
            >
              <div role="radiogroup" aria-label="Jour" style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4 }}>
                {JOURS.map((j, i) => (
                  <button
                    key={j}
                    type="button"
                    role="radio"
                    aria-checked={nv.jour === i}
                    aria-label={j}
                    onClick={() => setNv({ ...nv, jour: i })}
                    style={{ height: 40, borderRadius: 10, border: 0, background: nv.jour === i ? "var(--c-teal)" : "var(--fond-gris)", color: nv.jour === i ? "#ffffff" : "var(--slate)", font: "inherit", fontWeight: 900, fontSize: 13, cursor: "pointer" }}
                  >
                    {j[0]}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <input aria-label="Activité" placeholder="Yoga, cours d'anglais…" style={{ ...champ, flex: 1, height: 46, fontSize: 15 }} value={nv.t} onChange={(e) => setNv({ ...nv, t: e.target.value })} />
                <input aria-label="Heure" placeholder="19h" style={{ ...champ, width: 92, height: 46, fontSize: 15, textAlign: "center", padding: "0 6px" }} value={nv.h} onChange={(e) => setNv({ ...nv, h: e.target.value })} />
              </div>
              <button type="submit" style={{ height: 46, borderRadius: 12, border: 0, background: "var(--teal-doux)", color: "var(--t-teal)", font: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
                + Ajouter à ma semaine
              </button>
              <span style={{ fontSize: 12.5, color: "var(--slate)" }}>Heure : « 19h » (1 h par défaut) ou « 19h-20h30 ».</span>
            </form>
          </>
        )}
        {erreur && (
          <div role="alert" style={{ ...carte, background: "var(--rouge-doux)", color: "var(--t-rouge)", fontWeight: 700 }}>
            {erreur}
          </div>
        )}
      </div>

      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, padding: "14px 16px calc(18px + env(safe-area-inset-bottom))", background: "linear-gradient(180deg, transparent, var(--paper) 35%)" }}>
        <button
          type="button"
          onClick={() => avancer(false)}
          disabled={enCours}
          style={{ display: "block", width: "100%", maxWidth: 528, margin: "0 auto", height: 56, borderRadius: 18, border: 0, background: "var(--c-teal)", color: "#ffffff", font: "inherit", fontSize: 17, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 18px rgba(10,123,138,.3)" }}
        >
          {enCours ? "Préparation de ton app…" : derniere ? "C'est parti ✨" : "Continuer"}
        </button>
      </div>
    </div>
  );
}
