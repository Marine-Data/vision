import React from "react";
import { KbSheet } from "./kanban/communs.jsx";
import {
  DUREES,
  FORMULES,
  RACCOURCIS,
  SECTIONS_PARTAGE,
  adresseDuLien,
  codeAuHasard,
  expirationDe,
} from "../lib/partage.js";

// Fenêtre « Partager » : mes liens (couper / réactiver) et création d'un nouveau lien.

const dateCourte = (iso) =>
  iso ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso)) : "";
const DEFAUT = {
  nom: "",
  formule: "deux",
  sections: ["planning", "suivi", "sport"],
  montants: false,
  adresses: false,
  code: false,
  prevenir: true,
  duree: "mois",
  echange: false,
  mot: "",
  raccourci: null,
};

function Interrupteur({ on, label, icone, onClick }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      style={{ display: "flex", minHeight: 44, alignItems: "center", gap: 10, border: 0, background: "transparent", padding: 0, color: "var(--ink)", textAlign: "left", font: "inherit", cursor: "pointer", width: "100%" }}
    >
      <span aria-hidden="true" style={{ fontSize: 18, width: 24 }}>
        {icone}
      </span>
      <span style={{ flex: 1, fontSize: 14.5, fontWeight: 800 }}>{label}</span>
      <span style={{ width: 44, height: 26, borderRadius: 99, background: on ? "var(--teal-dark)" : "var(--line-strong)", position: "relative", flex: "none" }}>
        <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "var(--surface)", transition: "left .15s" }} />
      </span>
    </button>
  );
}

function Segment({ items, valeur, onChoisir, label, petit }) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, gap: 4, padding: 4, borderRadius: 14, background: "var(--fond-gris)" }}>
      {items.map(([v, l]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={v === valeur}
          onClick={() => onChoisir(v)}
          style={{ height: petit ? 34 : 44, border: 0, borderRadius: 11, background: v === valeur ? "var(--surface)" : "transparent", boxShadow: v === valeur ? "0 1px 3px rgba(0,0,0,.15)" : "none", color: "var(--ink)", font: "inherit", fontSize: petit ? 12.5 : 13.5, fontWeight: 800, cursor: "pointer" }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function Partager({ supabase, uid, onClose, notifier }) {
  const [liens, setLiens] = React.useState(null),
    [f, setF] = React.useState(DEFAUT),
    [codeTire] = React.useState(codeAuHasard),
    [enCours, setEnCours] = React.useState(false),
    [erreur, setErreur] = React.useState("");
  const maj = (o, garderRaccourci) => setF((x) => ({ ...x, ...o, raccourci: garderRaccourci ? x.raccourci : null }));
  const lecture = f.formule !== "inviter";

  async function charger() {
    const { data, error } = await supabase.from("vision_partages").select("*").order("created_at", { ascending: false });
    if (error) setErreur(error.message);
    setLiens((data || []).filter((x) => !/^_essai/.test(x.nom)));
  }
  React.useEffect(() => {
    charger();
  }, []);

  async function basculer(L) {
    const patch = L.actif
      ? { actif: false }
      : { actif: true, tentatives: 0, expire_le: expirationDe(L.duree), updated_at: new Date().toISOString() };
    const { error } = await supabase.from("vision_partages").update(patch).eq("id", L.id);
    if (error) return setErreur(error.message);
    notifier && notifier(L.actif ? "Lien coupé : " + (L.nom || "sans nom") : "Lien réactivé : " + (L.nom || "sans nom"));
    charger();
  }

  async function creer(apercu) {
    setEnCours(true), setErreur("");
    // Fenêtre ouverte tout de suite (sinon le téléphone la bloque), remplie quand le lien existe.
    const fenetre = apercu ? window.open("", "_blank") : null;
    const ligne = {
      user_id: uid,
      nom: f.nom.trim(),
      formule: f.formule,
      sections: lecture ? f.sections : [],
      montants: lecture && f.sections.includes("budget") && f.montants,
      adresses: lecture && f.adresses,
      code: lecture && f.code ? codeTire : null,
      duree: f.duree,
      expire_le: expirationDe(f.duree),
      prevenir: f.prevenir,
      echange: f.formule !== "montrer" && f.echange,
      mot: f.formule !== "montrer" && f.mot.trim() ? f.mot.trim() : null,
    };
    const { data: L, error } = await supabase.from("vision_partages").insert(ligne).select().single();
    setEnCours(false);
    if (error) {
      fenetre && fenetre.close();
      return setErreur(error.message);
    }
    const url = adresseDuLien(L);
    charger();
    setF(DEFAUT);
    if (apercu) {
      if (fenetre) fenetre.location.href = url;
      else window.location.href = url;
      return;
    }
    const texte = f.formule === "montrer" ? "Mon app Vision 👀" : "Fais ton app Vision ✨" + (ligne.mot ? " — " + ligne.mot : "");
    try {
      if (navigator.share) await navigator.share({ title: "Vision", text: texte, url });
      else {
        await navigator.clipboard.writeText(url);
        notifier && notifier("Lien copié" + (ligne.code ? " · code " + ligne.code : ""));
      }
    } catch (e) {
      // partage annulé : le lien reste dans « Mes liens »
    }
  }

  const resumeLien = (L) => {
    const fin = !L.actif ? "Coupé" : L.expire_le && new Date(L.expire_le) < new Date() ? "Expiré" : L.expire_le ? "jusqu'au " + dateCourte(L.expire_le) : "sans fin";
    const quoi =
      L.formule === "inviter"
        ? "✉️ invitation"
        : (L.formule === "deux" ? "✨ " : "") +
          SECTIONS_PARTAGE.filter(([k]) => L.sections.includes(k))
            .map(([k, i]) => i + (k === "budget" && L.montants ? "€" : ""))
            .join(" ");
    return [quoi, L.code ? "🔒 " + L.code + (L.tentatives >= 5 ? " (bloqué)" : "") : null, fin, L.vues ? "vu " + L.vues + "×" : null].filter(Boolean).join(" · ");
  };

  return (
    <KbSheet label="Partager" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(liens || []).map((L) => {
          const actif = L.actif && !(L.expire_le && new Date(L.expire_le) < new Date());
          return (
            <div key={L.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--fond-doux)", borderRadius: 16, padding: "10px 12px", opacity: actif ? 1 : 0.6 }}>
              <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 800 }}>{L.nom || "Sans nom"}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--slate)" }}>{resumeLien(L)}</span>
              </span>
              {actif && (
                <button type="button" aria-label={"Renvoyer le lien " + (L.nom || "")} onClick={() => (navigator.share ? navigator.share({ title: "Vision", url: adresseDuLien(L) }).catch(() => {}) : navigator.clipboard.writeText(adresseDuLien(L)).then(() => notifier && notifier("Lien copié")))} style={{ height: 34, width: 38, borderRadius: 10, border: 0, background: "var(--teal-doux)", color: "var(--t-teal)", fontSize: 15, cursor: "pointer" }}>
                  📤
                </button>
              )}
              <button type="button" onClick={() => basculer({ ...L, actif })} style={{ height: 34, padding: "0 10px", borderRadius: 10, border: 0, background: actif ? "var(--rouge-doux)" : "var(--teal-doux)", color: actif ? "var(--t-rouge)" : "var(--t-teal)", font: "inherit", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>
                {actif ? "Couper" : "Réactiver"}
              </button>
            </div>
          );
        })}

        <div style={{ background: "var(--surface)", border: "2px solid var(--line)", borderRadius: 18, padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 800, flex: "none" }}>+ Nouveau lien</span>
            <input
              aria-label="Pour qui"
              placeholder="Pour qui ?"
              value={f.nom}
              onChange={(e) => maj({ nom: e.target.value }, true)}
              style={{ flex: 1, minWidth: 0, height: 42, borderRadius: 12, border: "2px solid var(--line)", padding: "0 10px", font: "inherit", fontSize: 15, fontWeight: 700, color: "var(--ink)", background: "var(--surface)" }}
            />
          </div>

          <div role="radiogroup" aria-label="Raccourcis" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {RACCOURCIS.map(([k, l, r]) => {
              const on = f.raccourci === k;
              return (
                <button key={k} type="button" role="radio" aria-checked={on} onClick={() => setF((x) => ({ ...x, ...r, raccourci: k }))} style={{ height: 38, padding: "0 12px", borderRadius: 99, border: "2px solid " + (on ? "var(--teal-dark)" : "var(--line)"), background: on ? "var(--teal-dark)" : "var(--surface)", color: on ? "#ffffff" : "var(--ink)", font: "inherit", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>
                  {l}
                </button>
              );
            })}
          </div>

          <Segment label="Formule" items={FORMULES} valeur={f.formule} onChoisir={(v) => maj({ formule: v })} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--slate)", marginTop: -6 }}>{(FORMULES.find((x) => x[0] === f.formule) || [])[2]}</span>

          {lecture && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SECTIONS_PARTAGE.map(([k, i, l]) => {
                const on = f.sections.includes(k);
                return (
                  <button key={k} type="button" role="checkbox" aria-checked={on} onClick={() => maj({ sections: on ? f.sections.filter((x) => x !== k) : [...f.sections, k] })} style={{ height: 36, padding: "0 11px", borderRadius: 99, border: "2px solid " + (on ? "var(--teal-dark)" : "var(--line)"), background: on ? "var(--teal-doux)" : "var(--surface)", color: on ? "var(--t-teal)" : "var(--slate)", font: "inherit", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                    {i} {l}
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column" }}>
            {lecture && f.sections.includes("budget") && <Interrupteur icone="€" label="Montants" on={f.montants} onClick={() => maj({ montants: !f.montants })} />}
            {lecture && <Interrupteur icone="📍" label="Adresses & notes" on={f.adresses} onClick={() => maj({ adresses: !f.adresses })} />}
            {lecture && <Interrupteur icone="🔒" label="Code" on={f.code} onClick={() => maj({ code: !f.code })} />}
            {lecture && f.code && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 6px 34px" }}>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, letterSpacing: ".3em" }}>{codeTire}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--slate)" }}>à donner à part</span>
              </div>
            )}
            {f.formule !== "montrer" && <Interrupteur icone="🔁" label="Échanger nos plannings" on={f.echange} onClick={() => maj({ echange: !f.echange })} />}
            <Interrupteur icone="🔔" label="Me prévenir" on={f.prevenir} onClick={() => maj({ prevenir: !f.prevenir }, true)} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44 }}>
              <span aria-hidden="true" style={{ fontSize: 18, width: 24 }}>
                ⏳
              </span>
              <span style={{ flex: 1, fontSize: 14.5, fontWeight: 800 }}>Expire</span>
              <div style={{ width: 200 }}>
                <Segment petit label="Expiration" items={DUREES} valeur={f.duree} onChoisir={(v) => maj({ duree: v })} />
              </div>
            </div>
          </div>

          {f.formule !== "montrer" && (
            <input
              aria-label="Petit mot"
              placeholder="Petit mot (facultatif)"
              value={f.mot}
              onChange={(e) => maj({ mot: e.target.value }, true)}
              style={{ height: 42, borderRadius: 12, border: "2px solid var(--line)", padding: "0 10px", font: "inherit", fontSize: 15, fontWeight: 600, color: "var(--ink)", background: "var(--surface)" }}
            />
          )}

          {erreur && (
            <div role="alert" style={{ fontSize: 13, fontWeight: 700, color: "var(--t-rouge)" }}>
              {erreur}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: lecture ? "1fr 1.4fr" : "1fr", gap: 8 }}>
            {lecture && (
              <button type="button" disabled={enCours || !f.sections.length} onClick={() => creer(true)} style={{ height: 50, borderRadius: 14, border: "2px solid var(--bord-teal)", background: "var(--surface)", color: "var(--t-teal)", font: "inherit", fontSize: 14.5, fontWeight: 800, cursor: "pointer" }}>
                👁 Aperçu du lien
              </button>
            )}
            <button type="button" disabled={enCours || (lecture && !f.sections.length)} onClick={() => creer(false)} style={{ height: 50, borderRadius: 14, border: 0, background: "var(--c-teal)", color: "#ffffff", font: "inherit", fontSize: 15.5, fontWeight: 800, cursor: "pointer" }}>
              {enCours ? "…" : "📤 Envoyer"}
            </button>
          </div>
        </div>
      </div>
    </KbSheet>
  );
}
