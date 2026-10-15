import React from "react";
import { KbSheet } from "./kanban/communs.jsx";
import { euros, num } from "../lib/format.js";
import { MOIS, anneeMoisDe } from "../lib/mois.js";

// Sport : prochain cours, semaine type, présence du mois, adhésion.
// Les cours sont les lignes « cours » du groupe sport (les mêmes que dans Planning) ;
// les échéances de l'adhésion sont les postes « sport » de l'enveloppe formation + sport.

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const COURT = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
const ROSE = "var(--c-rose)",
  ROSE_PALE = "var(--rose-doux)";

// « Vendredi 19h30–21h00 » ⇄ { jour: 4, debut: "19:30", fin: "21:00" }
export function lireCreneau(detail) {
  const t = (detail || "").trim(),
    j = JOURS.findIndex((d) => t.toLowerCase().startsWith(d.toLowerCase())),
    h = t.match(/(\d{1,2})h(\d{2})?\s*[–-]\s*(\d{1,2})h(\d{2})?/);
  const hh = (a, b) => String(a).padStart(2, "0") + ":" + (b || "00");
  return { jour: j, debut: h ? hh(h[1], h[2]) : "", fin: h ? hh(h[3], h[4]) : "" };
}
export function ecrireCreneau({ jour, debut, fin }) {
  const f = (x) => (x ? x.replace(":", "h") : "");
  return (jour >= 0 ? JOURS[jour] : "") + (debut ? " " + f(debut) + (fin ? "–" + f(fin) : "") : "");
}
const nomCours = (t) => (t || "").replace(/^Sport\s*[—-]\s*/, "");
const isoDe = (d) =>
  d.getFullYear() +
  "-" +
  String(d.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(d.getDate()).padStart(2, "0");
const jourSemaine = (d) => (d.getDay() + 6) % 7;

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
const plein = {
  minHeight: 52,
  width: "100%",
  borderRadius: 16,
  border: 0,
  background: ROSE,
  color: "#ffffff",
  fontFamily: "inherit",
  fontSize: 15.5,
  fontWeight: 800,
  cursor: "pointer",
};
const texte = (c) => ({
  minHeight: 44,
  width: "100%",
  border: 0,
  background: "transparent",
  color: c,
  fontFamily: "inherit",
  fontSize: 14.5,
  fontWeight: 800,
  cursor: "pointer",
});
const carte = {
  background: "var(--surface)",
  borderRadius: 22,
  padding: 16,
  boxShadow: "0 1px 2px rgba(14,58,66,.06)",
};

function FeuilleCours({ cours, adresseDefaut, onClose, onEnregistrer, onSupprimer }) {
  const c = cours ? lireCreneau(cours.detail) : { jour: 4, debut: "", fin: "" };
  const [titre, setTitre] = React.useState(cours ? nomCours(cours.titre) : ""),
    [jour, setJour] = React.useState(c.jour),
    [debut, setDebut] = React.useState(c.debut),
    [fin, setFin] = React.useState(c.fin),
    [adresse, setAdresse] = React.useState(cours ? cours.extra || "" : adresseDefaut || ""),
    [periode, setPeriode] = React.useState(cours ? cours.complement || "" : ""),
    [confirmer, setConfirmer] = React.useState(!1),
    [erreur, setErreur] = React.useState("");
  async function ok() {
    if (!titre.trim()) return setErreur("Donne un nom au cours.");
    if (jour < 0) return setErreur("Choisis le jour.");
    try {
      await onEnregistrer({
        titre: "Sport — " + titre.trim(),
        detail: ecrireCreneau({ jour, debut, fin }),
        extra: adresse.trim() || null,
        complement: periode.trim() || null,
      });
      onClose();
    } catch (e) {}
  }
  return (
    <KbSheet label={cours ? "Modifier le cours" : "Nouveau cours"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={etiquette}>
          Nom du cours
          <input value={titre} onChange={(e) => setTitre(e.target.value)} style={champ} data-autofocus />
        </label>
        <div
          role="radiogroup"
          aria-label="Jour"
          style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4 }}
        >
          {COURT.map((l, k) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={jour === k}
              aria-label={JOURS[k]}
              onClick={() => setJour(k)}
              style={{
                height: 44,
                borderRadius: 12,
                border: 0,
                background: jour === k ? ROSE : "var(--fond-doux)",
                color: jour === k ? "#ffffff" : "var(--ink-soft)",
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          <label style={etiquette}>
            Début
            <input type="time" value={debut} onChange={(e) => setDebut(e.target.value)} style={champ} />
          </label>
          <label style={etiquette}>
            Fin
            <input type="time" value={fin} onChange={(e) => setFin(e.target.value)} style={champ} />
          </label>
        </div>
        <label style={etiquette}>
          Adresse
          <input value={adresse} onChange={(e) => setAdresse(e.target.value)} style={champ} />
        </label>
        <label style={etiquette}>
          Période (facultatif)
          <input
            value={periode}
            placeholder="ex. saison 2026-2027"
            onChange={(e) => setPeriode(e.target.value)}
            style={champ}
          />
        </label>
        {erreur && (
          <div role="alert" style={{ color: "var(--t-rouge)", fontWeight: 700 }}>
            {erreur}
          </div>
        )}
        <button type="button" onClick={ok} style={plein}>
          Enregistrer
        </button>
        {cours && (
          <button
            type="button"
            onClick={async () => {
              if (!confirmer) return setConfirmer(!0);
              try {
                await onSupprimer(), onClose();
              } catch (e) {}
            }}
            style={texte("var(--c-rouge)")}
          >
            {confirmer ? "Confirmer la suppression" : "Supprimer le cours"}
          </button>
        )}
      </div>
    </KbSheet>
  );
}

function FeuilleAdhesion({ fiche, echeances, onClose, onFiche, onEcheance, ferme }) {
  const [club, setClub] = React.useState((fiche && fiche.titre) || ""),
    [expire, setExpire] = React.useState((fiche && fiche.date_iso) || ""),
    [certif, setCertif] = React.useState(!fiche || fiche.complement !== "certificat:ko"),
    [lignes, setLignes] = React.useState(
      echeances.map((x) => ({
        id: x.id,
        montant: String(num(x.montant_prevu)).replace(".", ","),
        paid: !!x.paid,
        m: num(x.mois_index),
        label: x.label,
      })),
    );
  async function ok() {
    try {
      const patch = {};
      club.trim() !== ((fiche && fiche.titre) || "") && (patch.titre = club.trim());
      (expire || null) !== ((fiche && fiche.date_iso) || null) && (patch.date_iso = expire || null);
      const c = certif ? "certificat:ok" : "certificat:ko";
      c !== ((fiche && fiche.complement) || "certificat:ok") && (patch.complement = c);
      if (Object.keys(patch).length) await onFiche(patch);
      for (const l of lignes) {
        const x = echeances.find((e) => e.id === l.id),
          v = Number(String(l.montant).replace(",", "."));
        if (!x || ferme(num(x.mois_index))) continue;
        const p = {};
        Number.isFinite(v) &&
          v !== num(x.montant_prevu) &&
          ((p.montant_prevu = v), x.paid && (p.montant_reel = v));
        l.paid !== !!x.paid && ((p.paid = l.paid), (p.montant_reel = l.paid ? v : null));
        Object.keys(p).length && (await onEcheance(x.id, p));
      }
      onClose();
    } catch (e) {}
  }
  return (
    <KbSheet label="Adhésion" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={etiquette}>
          Club
          <input value={club} onChange={(e) => setClub(e.target.value)} style={champ} />
        </label>
        <label style={etiquette}>
          Expire le
          <input type="date" value={expire} onChange={(e) => setExpire(e.target.value)} style={champ} />
        </label>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--slate)" }}>Échéances</div>
        {lignes.map((l, k) => {
          const bloque = ferme(l.m);
          return (
            <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>
                {MOIS[l.m]}
                {bloque ? " 🔒" : ""}
              </span>
              <input
                aria-label={"Montant " + MOIS[l.m]}
                inputMode="decimal"
                disabled={bloque}
                value={l.montant}
                onChange={(e) =>
                  setLignes(
                    lignes.map((x, j) =>
                      j === k ? { ...x, montant: e.target.value.replace(/[^0-9.,]/g, "") } : x,
                    ),
                  )
                }
                style={{ ...champ, width: 100, textAlign: "right" }}
              />
              <button
                type="button"
                disabled={bloque}
                aria-pressed={l.paid}
                onClick={() => setLignes(lignes.map((x, j) => (j === k ? { ...x, paid: !x.paid } : x)))}
                style={{
                  minHeight: 44,
                  minWidth: 76,
                  borderRadius: 12,
                  border: 0,
                  background: l.paid ? "var(--vert-doux)" : "var(--orange-doux)",
                  color: l.paid ? "var(--t-vert)" : "var(--t-orange)",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: bloque ? "default" : "pointer",
                }}
              >
                {l.paid ? "✓ payé" : "à payer"}
              </button>
            </div>
          );
        })}
        <button
          type="button"
          role="switch"
          aria-checked={certif}
          onClick={() => setCertif(!certif)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minHeight: 52,
            borderRadius: 14,
            border: 0,
            background: certif ? "var(--vert-doux)" : "var(--orange-doux)",
            color: certif ? "var(--t-vert)" : "var(--t-orange)",
            padding: "0 14px",
            fontFamily: "inherit",
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span style={{ flex: 1 }}>Certificat médical</span>
          {certif ? "✓ à jour" : "à renouveler"}
        </button>
        <button type="button" onClick={ok} style={plein}>
          Enregistrer
        </button>
      </div>
    </KbSheet>
  );
}

export function SportPage({
  rows,
  items,
  seances,
  readOnly,
  ferme,
  onCtMaj,
  onCtCreer,
  onCtSupprimer,
  onItemMaj,
  onSeance,
}) {
  const [ouvert, setOuvert] = React.useState(null),
    [libre, setLibre] = React.useState(""),
    [moisVu, setMoisVu] = React.useState(null);
  const cours = (rows || [])
      .filter((x) => x.type === "cours" && x.groupe === "sport")
      .sort((a, b) => (a.sort || 0) - (b.sort || 0)),
    fiche = (rows || []).find((x) => x.type === "note" && x.groupe === "adhesion"),
    echeances = (items || [])
      .filter((x) => x.pocket === "sport")
      .sort((a, b) => num(a.mois_index) - num(b.mois_index)),
    cotisation = echeances.reduce((s, x) => s + num(x.montant_prevu), 0),
    auj = new Date(),
    aujIso = isoDe(auj),
    creneaux = cours.map((c) => ({ c, ...lireCreneau(c.detail) })).filter((x) => x.jour >= 0);
  // Prochain cours : premier créneau à venir (aujourd'hui compris si l'heure n'est pas passée).
  let prochain = null;
  for (let k = 0; k < 8 && !prochain; k++) {
    const d = new Date(auj.getFullYear(), auj.getMonth(), auj.getDate() + k),
      l = creneaux
        .filter((x) => x.jour === jourSemaine(d))
        // cours annulé ce jour-là (« Pas cette semaine » dans Planning) : on passe au suivant
        .filter((x) => !(seances || []).some((s) => s.date === isoDe(d) && s.cours_id === x.c.id && s.fait === false))
        .filter(
          (x) =>
            k > 0 ||
            !x.debut ||
            x.debut >
              String(auj.getHours()).padStart(2, "0") + ":" + String(auj.getMinutes()).padStart(2, "0"),
        )
        .sort((a, b) => (a.debut || "").localeCompare(b.debut || ""));
    l.length && (prochain = { ...l[0], date: d, dans: k });
  }
  // Séances du mois affiché : chaque créneau du club, plus les séances libres.
  const ref = moisVu || { a: auj.getFullYear(), m: auj.getMonth() },
    jours = new Date(ref.a, ref.m + 1, 0).getDate(),
    occurrences = [];
  for (let j = 1; j <= jours; j++) {
    const d = new Date(ref.a, ref.m, j);
    creneaux
      .filter((x) => x.jour === jourSemaine(d))
      .forEach((x) => occurrences.push({ date: isoDe(d), j, c: x.c, futur: isoDe(d) > aujIso }));
  }
  const fait = (date, id) => (seances || []).some((s) => s.date === date && s.cours_id === id && s.fait),
    libres = (seances || []).filter(
      (s) => !s.cours_id && s.date.slice(0, 7) === ref.a + "-" + String(ref.m + 1).padStart(2, "0"),
    ),
    idsCours = new Set(cours.map((c) => c.id)),
    nbClubSaison = (seances || []).filter((s) => s.cours_id && idsCours.has(s.cours_id) && s.fait).length,
    nbMois = occurrences.filter((o) => fait(o.date, o.c.id)).length + libres.length,
    expire = fiche && fiche.date_iso ? new Date(fiche.date_iso + "T00:00:00") : null,
    joursExp = expire
      ? Math.round((expire - new Date(auj.getFullYear(), auj.getMonth(), auj.getDate())) / 864e5)
      : null,
    certifOk = !fiche || fiche.complement !== "certificat:ko",
    nomMois = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(new Date(ref.a, ref.m, 1)),
    adresse = (cours.find((c) => c.extra) || {}).extra || (fiche && fiche.extra) || "",
    moisDecale = (k) => {
      const d = new Date(ref.a, ref.m + k, 1);
      setMoisVu({ a: d.getFullYear(), m: d.getMonth() });
    };
  const moisIndexEch = (x) => num(x.mois_index);
  return (
    <section className="sec">
      <h2 style={{ color: ROSE }}>Sport</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {prochain && (
          <section
            aria-label="Prochain cours"
            style={{
              background: ROSE,
              color: "#ffffff",
              borderRadius: 22,
              padding: 16,
              display: "flex",
              gap: 14,
              alignItems: "center",
              boxShadow: "0 10px 24px rgba(176,58,110,.25)",
            }}
          >
            <div
              style={{
                flex: "none",
                width: 64,
                height: 64,
                borderRadius: 18,
                background: "rgba(255,255,255,.16)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".06em" }}>
                {COURT[prochain.jour]}
              </span>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, lineHeight: 1 }}>
                {prochain.date.getDate()}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  opacity: 0.92,
                }}
              >
                Prochain cours ·{" "}
                {prochain.dans === 0
                  ? "aujourd'hui"
                  : prochain.dans === 1
                    ? "demain"
                    : "dans " + prochain.dans + " jours"}
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
                {nomCours(prochain.c.titre)}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {prochain.debut
                  ? prochain.debut.replace(":", "h") +
                    (prochain.fin ? " – " + prochain.fin.replace(":", "h") : "")
                  : ""}
              </div>
            </div>
          </section>
        )}

        <div
          role="img"
          aria-label={
            "Semaine type : " +
            (creneaux.length ? creneaux.map((x) => JOURS[x.jour]).join(", ") : "aucun cours")
          }
          style={{
            ...carte,
            borderRadius: 18,
            padding: "12px 10px",
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 4,
          }}
        >
          {COURT.map((l, k) => {
            const on = creneaux.some((x) => x.jour === k);
            return (
              <span
                key={l}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
              >
                <span style={{ fontSize: 12, fontWeight: 800, color: on ? ROSE : "var(--slate-light)" }}>{l[0]}</span>
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    background: on ? ROSE : "var(--fond-doux)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                  }}
                >
                  {on ? "🤸" : ""}
                </span>
              </span>
            );
          })}
        </div>

        {cours.map((c) => {
          const x = lireCreneau(c.detail);
          return (
            <button
              key={c.id}
              type="button"
              disabled={readOnly}
              onClick={() => setOuvert({ type: "cours", c })}
              aria-label={nomCours(c.titre) + ", " + c.detail + (readOnly ? "" : ", modifier")}
              style={{
                ...carte,
                borderRadius: 18,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                border: 0,
                textAlign: "left",
                fontFamily: "inherit",
                color: "var(--ink)",
                cursor: readOnly ? "default" : "pointer",
              }}
            >
              <span
                style={{
                  flex: "none",
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: ROSE_PALE,
                  color: ROSE,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                {x.jour >= 0 ? COURT[x.jour] : "?"}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 15.5, fontWeight: 800 }}>{nomCours(c.titre)}</span>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--slate)" }}>
                  {x.debut
                    ? x.debut.replace(":", "h") + (x.fin ? " – " + x.fin.replace(":", "h") : "")
                    : c.detail}
                </span>
              </span>
            </button>
          );
        })}
        {adresse && (
          <a
            href={"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(adresse)}
            target="_blank"
            rel="noopener"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              margin: "-4px 4px 0",
              fontSize: 13.5,
              fontWeight: 700,
              color: "var(--slate)",
              minHeight: 32,
            }}
          >
            📍 {adresse} · itinéraire
          </a>
        )}
        {!readOnly && (
          <button
            type="button"
            onClick={() => setOuvert({ type: "cours", c: null })}
            style={{
              minHeight: 52,
              border: "2px dashed var(--bord-rose)",
              borderRadius: 18,
              background: "transparent",
              color: ROSE,
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            + Cours
          </button>
        )}

        <section
          aria-label={"Présence en " + nomMois}
          style={{ ...carte, display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              aria-label="Mois précédent"
              onClick={() => moisDecale(-1)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                border: 0,
                background: "var(--fond-doux)",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              ‹
            </button>
            <span style={{ flex: 1, fontSize: 16, fontWeight: 800, textTransform: "capitalize" }}>
              {nomMois}
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: ROSE }}>
              {nbMois} séance{nbMois > 1 ? "s" : ""}
            </span>
            <button
              type="button"
              aria-label="Mois suivant"
              onClick={() => moisDecale(1)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                border: 0,
                background: "var(--fond-doux)",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              ›
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
            {occurrences.map((o) => {
              const on = fait(o.date, o.c.id),
                jl = lireCreneau(o.c.detail).jour;
              return (
                <button
                  key={o.date + o.c.id}
                  type="button"
                  disabled={readOnly || o.futur}
                  aria-pressed={on}
                  aria-label={
                    JOURS[jl] +
                    " " +
                    o.j +
                    " : " +
                    nomCours(o.c.titre) +
                    (on ? ", fait" : o.futur ? ", à venir" : ", pas fait")
                  }
                  onClick={() => onSeance({ date: o.date, cours_id: o.c.id })}
                  style={{
                    minHeight: 58,
                    borderRadius: 14,
                    border: "2px solid " + (on ? ROSE : o.futur ? "var(--line)" : "#e3b9cc"),
                    background: on ? ROSE : "var(--surface)",
                    color: on ? "#ffffff" : o.futur ? "var(--slate-light)" : ROSE,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    fontFamily: "inherit",
                    cursor: readOnly || o.futur ? "default" : "pointer",
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 900 }}>{on ? "✓" : o.futur ? "·" : "✕"}</span>
                  <span style={{ fontSize: 12, fontWeight: 800 }}>
                    {COURT[jl].slice(0, 3).toLowerCase() + " " + o.j}
                  </span>
                </button>
              );
            })}
            {libres.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={readOnly}
                aria-label={(s.activite || "Séance libre") + " le " + Number(s.date.slice(8)) + ", retirer"}
                onClick={() => onSeance({ date: s.date, cours_id: null, activite: s.activite })}
                style={{
                  minHeight: 58,
                  borderRadius: 14,
                  border: "2px solid " + ROSE,
                  background: ROSE,
                  color: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 15 }}>🏃</span>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "100%",
                  }}
                >
                  {(s.activite || "libre") + " " + Number(s.date.slice(8))}
                </span>
              </button>
            ))}
          </div>
          {!readOnly && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const a = libre.trim();
                if (!a) return;
                const date =
                  ref.a === auj.getFullYear() && ref.m === auj.getMonth()
                    ? aujIso
                    : isoDe(new Date(ref.a, ref.m, 1));
                try {
                  await onSeance({ date, cours_id: null, activite: a }), setLibre("");
                } catch (e2) {}
              }}
              style={{ display: "flex", gap: 8 }}
            >
              <input
                aria-label="Séance libre (course, yoga…)"
                placeholder="+ Séance libre · course, yoga…"
                value={libre}
                onChange={(e) => setLibre(e.target.value)}
                style={{ ...champ, height: 44, flex: 1, border: "2px dashed var(--bord-rose)" }}
              />
              <button
                type="submit"
                disabled={!libre.trim()}
                style={{
                  minWidth: 64,
                  minHeight: 44,
                  borderRadius: 12,
                  border: 0,
                  background: libre.trim() ? ROSE : "var(--fond-doux)",
                  color: libre.trim() ? "#ffffff" : "var(--slate-light)",
                  fontFamily: "inherit",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Ajouter
              </button>
            </form>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            <div
              style={{
                borderRadius: 14,
                background: ROSE_PALE,
                color: "var(--t-rose)",
                padding: 10,
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700 }}>
                {nbClubSaison}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 800 }}>séances au club cette saison</div>
            </div>
            <div
              style={{
                borderRadius: 14,
                background: ROSE_PALE,
                color: "var(--t-rose)",
                padding: 10,
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700 }}>
                {nbClubSaison ? Math.round(cotisation / nbClubSaison) + " €" : "—"}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 800 }}>
                par séance ({Math.round(cotisation)} € ÷ séances)
              </div>
            </div>
          </div>
        </section>

        <section
          aria-label="Adhésion"
          style={{ ...carte, display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>{(fiche && fiche.titre) || "Adhésion"}</span>
            {!readOnly && (
              <button
                type="button"
                onClick={() => setOuvert({ type: "adhesion" })}
                aria-label="Modifier l'adhésion"
                style={{
                  border: 0,
                  background: ROSE_PALE,
                  color: ROSE,
                  borderRadius: 99,
                  padding: "8px 12px",
                  minHeight: 36,
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {euros(cotisation).replace(",00", "")} ✏️
              </button>
            )}
          </div>
          {!fiche && !echeances.length ? (
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--slate)" }}>
              Pas encore d'adhésion. Touche ✏️ pour noter ton club, la date de fin et le certificat médical.
            </div>
          ) : (
          <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.max(1, Math.min(4, echeances.length))}, minmax(0, 1fr))`,
              gap: 8,
            }}
          >
            {echeances.map((x) => (
              <div
                key={x.id}
                style={{
                  borderRadius: 14,
                  padding: 8,
                  background: x.paid ? "var(--vert-doux)" : "var(--orange-doux)",
                  color: x.paid ? "var(--t-vert)" : "var(--t-orange)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 900 }}>{x.paid ? "✓" : "⏳"}</span>
                <span style={{ fontSize: 14, fontWeight: 800 }}>
                  {euros(x.montant_reel != null && x.paid ? x.montant_reel : x.montant_prevu).replace(
                    ",00",
                    "",
                  )}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{MOIS[moisIndexEch(x)]}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            <div
              style={{
                borderRadius: 14,
                background: certifOk ? "var(--vert-doux)" : "var(--orange-doux)",
                color: certifOk ? "var(--t-vert)" : "var(--t-orange)",
                padding: 10,
                fontSize: 13.5,
                fontWeight: 800,
              }}
            >
              {certifOk ? "✓ Certificat médical" : "⚠️ Certificat médical"}
              <br />
              <span style={{ fontWeight: 600 }}>{certifOk ? "à jour" : "à renouveler"}</span>
            </div>
            {expire && (
              <div
                style={{
                  borderRadius: 14,
                  background: "var(--fond-doux)",
                  color: "var(--ink-soft)",
                  padding: 10,
                  fontSize: 13.5,
                  fontWeight: 800,
                }}
              >
                ⏳ Expire le{" "}
                {new Intl.DateTimeFormat("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                }).format(expire)}
                <br />
                <span style={{ fontWeight: 600 }}>
                  {joursExp >= 0 ? "dans " + joursExp + " jours" : "expirée"}
                </span>
              </div>
            )}
          </div>
          </>
          )}
        </section>
      </div>
      {ouvert && ouvert.type === "cours" && (
        <FeuilleCours
          cours={ouvert.c}
          adresseDefaut={adresse}
          onClose={() => setOuvert(null)}
          onEnregistrer={(p) =>
            ouvert.c ? onCtMaj(ouvert.c.id, p) : onCtCreer("cours", "sport", p, "Cours ajouté")
          }
          onSupprimer={() => onCtSupprimer(ouvert.c.id, "Cours supprimé")}
        />
      )}
      {ouvert && ouvert.type === "adhesion" && (
        <FeuilleAdhesion
          fiche={fiche}
          echeances={echeances}
          ferme={ferme}
          onClose={() => setOuvert(null)}
          onFiche={(p) =>
            fiche
              ? onCtMaj(fiche.id, p)
              : onCtCreer("note", "adhesion", { item_key: "adhesion:sport", titre: "Adhésion", ...p })
          }
          onEcheance={onItemMaj}
        />
      )}
    </section>
  );
}

export { anneeMoisDe };
