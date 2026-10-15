import React from "react";
import { KbSheet } from "./kanban/communs.jsx";
import { coursRelies, depensesDe, liensDe, motsCles, nbCoursPeriode, nomsRelies, resumePrix, suggestions } from "../lib/depenses.js";
import { eurosCourt } from "../lib/format.js";
import { MOIS, moisNow } from "../lib/mois.js";

// Planning étape 3 : prix relié au Budget, matière, rappel, « Déplacer cette fois ».

const champ = {
  height: 42,
  borderRadius: 11,
  border: "2px solid var(--line)",
  padding: "0 10px",
  font: "inherit",
  fontSize: 15,
  fontWeight: 700,
  color: "var(--ink)",
  background: "var(--surface)",
  boxSizing: "border-box",
  width: "100%",
  minWidth: 0,
};
const titreSection = { fontSize: 14, fontWeight: 800 };
const petit = { fontSize: 12.5, fontWeight: 700, color: "var(--slate)" };
const lien = { border: 0, background: "transparent", padding: 0, textAlign: "left", font: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" };
const eur = (v) => eurosCourt(Math.round(v));

// ---------- Matière ----------
export function propositionMatiere(nom, matieres) {
  const m = new Set(motsCles(nom));
  return (matieres || []).find((x) => motsCles(x).some((w) => m.has(w))) || null;
}
export function ChoixMatiere({ valeur, setValeur, matieres, couleur, onNouvelle }) {
  const [nouvelle, setNouvelle] = React.useState(null);
  const puce = (v, l) => {
    const on = (valeur || null) === v;
    return (
      <button key={l} type="button" role="radio" aria-checked={on} onClick={() => setValeur(v)} style={{ height: 38, padding: "0 13px", borderRadius: 99, border: "2px solid " + (on ? couleur[0] : "var(--line)"), background: on ? couleur[0] : "var(--surface)", color: on ? couleur[1] : "var(--ink)", font: "inherit", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>
        {l}
      </button>
    );
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={titreSection}>
        📚 Matière <span style={petit}>· relie les devoirs</span>
      </span>
      <div role="radiogroup" aria-label="Matière" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {matieres.map((m) => puce(m, m))}
        {puce(null, "Aucune")}
        {nouvelle === null ? (
          <button type="button" onClick={() => setNouvelle("")} style={{ height: 38, padding: "0 13px", borderRadius: 99, border: "2px dashed var(--line-strong)", background: "transparent", color: "var(--ink-soft)", font: "inherit", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>
            + Nouvelle
          </button>
        ) : (
          <span style={{ display: "flex", gap: 6 }}>
            <input aria-label="Nouvelle matière" value={nouvelle} onChange={(e) => setNouvelle(e.target.value)} placeholder="Droit…" style={{ ...champ, height: 38, width: 130 }} autoFocus />
            <button
              type="button"
              disabled={!nouvelle.trim()}
              onClick={async () => {
                const t = nouvelle.trim();
                await onNouvelle(t);
                setValeur(t), setNouvelle(null);
              }}
              style={{ height: 38, padding: "0 12px", borderRadius: 11, border: 0, background: couleur[0], color: couleur[1], font: "inherit", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}
            >
              OK
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

// ---------- Rappel ----------
export const RAPPELS = [
  ["aucun", "Aucun"],
  ["1h", "1 h"],
  ["2h", "2 h"],
  ["3h", "3 h"],
  ["veille", "Veille"],
];
export const rappelDefaut = (heures) => (heures > 0 ? Math.min(3, Math.round(heures)) + "h" : "aucun");
export function ChoixRappel({ valeur, setValeur, heuresDefaut }) {
  const def = rappelDefaut(heuresDefaut),
    effectif = valeur || def;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={titreSection}>
        🔔 Rappel <span style={petit}>· {valeur ? "réglé pour ce cours" : "par défaut (Réglages)"}</span>
      </span>
      <div role="radiogroup" aria-label="Rappel" style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 4, padding: 4, borderRadius: 14, background: "var(--fond-gris)" }}>
        {RAPPELS.map(([v, l]) => {
          const on = effectif === v;
          return (
            <button key={v} type="button" role="radio" aria-checked={on} onClick={() => setValeur(v === def && !valeur ? null : v)} style={{ height: 40, border: 0, borderRadius: 11, background: on ? "var(--surface)" : "transparent", boxShadow: on ? "0 1px 3px rgba(0,0,0,.15)" : "none", color: "var(--ink)", font: "inherit", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}
export const texteRappel = (r) => ({ aucun: "Pas de rappel", "1h": "Rappel 1 h avant", "2h": "Rappel 2 h avant", "3h": "Rappel 3 h avant", veille: "Rappel la veille au soir" })[r] || "";

// ---------- Prix ----------
// Prix par séance : cours à période → total / nb de cours ; sport → total / séances faites (tous les cours reliés) ;
// événement → total / nb de dates.
export function texteParSeance(x, total, { contenu, seances, jour }) {
  if (!total) return "";
  if (x.genre === "evenement") {
    const n = (x.dates || []).length - (x.annulees || []).length;
    return n > 0 ? "≈ " + eur(total / n) + " par date (" + n + " date" + (n > 1 ? "s" : "") + ")" : "";
  }
  const n = nbCoursPeriode(x, jour, seances);
  if (n && x.groupe !== "sport") return "≈ " + eur(total / n) + " par cours (" + n + " cours)";
  const deps = liensDe(x),
    ids = new Set();
  deps.forEach((d) => coursRelies(d, contenu).forEach((c) => ids.add(c.id)));
  ids.add(x.id);
  (contenu || []).filter((c) => c.origine && ids.has(c.origine)).forEach((c) => ids.add(c.id));
  const faites = (seances || []).filter((s) => s.cours_id && ids.has(s.cours_id) && s.fait).length;
  if (!faites) return "Pas encore de séance comptée";
  const autres = ids.size > 1 ? " (tous les cours reliés)" : "";
  return "≈ " + eur(total / faites) + " par séance pour l'instant · " + faites + " séance" + (faites > 1 ? "s" : "") + autres + " · baisse à chaque séance";
}

function LigneDepense({ d, couleur, onPayer, onMontant, onDelier }) {
  const [edition, setEdition] = React.useState(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, background: "var(--fond-doux)", borderRadius: 14, padding: "9px 10px 9px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 14, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis" }}>{d.titre}</span>
          <span style={petit}>{[d.ou, d.quand].filter(Boolean).join(" · ")}</span>
        </span>
        {edition === null ? (
          <button type="button" disabled={d.perdu} aria-label={"Montant " + d.titre + ", modifier"} onClick={() => setEdition(String(d.montant))} style={{ border: 0, background: "transparent", font: "inherit", fontSize: 15, fontWeight: 800, color: "var(--ink)", cursor: "pointer", padding: "4px 2px" }}>
            {eur(d.montant)}
          </button>
        ) : (
          <input
            aria-label={"Nouveau montant " + d.titre}
            inputMode="decimal"
            value={edition}
            autoFocus
            onChange={(e) => setEdition(e.target.value)}
            onBlur={async () => {
              const v = Number(String(edition).replace(",", "."));
              setEdition(null);
              if (v >= 0 && v !== d.montant) await onMontant(d, v);
            }}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            style={{ ...champ, width: 84, height: 36, textAlign: "right" }}
          />
        )}
        {!d.perdu && (
          <button type="button" aria-label={d.titre + (d.paye ? ", payé" : ", à payer") + ", changer"} onClick={() => onPayer(d)} style={{ height: 30, padding: "0 9px", borderRadius: 99, border: 0, background: d.paye ? "var(--vert-doux)" : "var(--orange-doux)", color: d.paye ? "var(--t-vert)" : "var(--t-orange)", font: "inherit", fontSize: 12, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" }}>
            {d.paye ? "✓ payé" : "à payer"}
          </button>
        )}
        <button type="button" aria-label={"Délier " + d.titre} onClick={() => onDelier(d)} style={{ width: 30, height: 30, borderRadius: 9, border: 0, background: "transparent", color: "var(--slate)", fontSize: 16, cursor: "pointer" }}>
          ×
        </button>
      </div>
      {d.abandonne && <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--t-orange)" }}>⚠️ Marquée « abandonné » dans Budget alors que le cours est au planning.</span>}
    </div>
  );
}

// Prix d'un cours ou d'un événement : enregistré tout de suite (dans Budget pour le montant et « payé »,
// sur le cours pour les liens).
export function PrixCours({ x, couleur, contenu, evenements, items, transactions, budget, seances, jour, onLiens, onItemCreer, onItemMaj, onTxAjouter, onTxModifier }) {
  const [ouvert, setOuvert] = React.useState(false),
    [ou, setOu] = React.useState("enveloppe"),
    [montant, setMontant] = React.useState(""),
    [mois, setMois] = React.useState(moisNow()),
    [date, setDate] = React.useState(new Date().toISOString().slice(0, 10)),
    [poste, setPoste] = React.useState(""),
    [erreur, setErreur] = React.useState("");
  const liens = liensDe(x),
    deps = depensesDe(x, items, transactions, budget),
    r = resumePrix(deps),
    sport = x.groupe === "sport" || x.categorie === "sport",
    sug = suggestions(x, items, transactions, budget),
    autresCours = deps.length ? nomsRelies(deps[0], contenu, evenements).split(" + ").filter((n) => n && !String(x.titre || "").includes(n)) : [],
    postes = (budget || []).filter((b) => b.kind !== "revenu" && b.archive_depuis == null),
    nomCourt = String(x.titre || "").replace(/^Sport\s*[—-]\s*/, ""),
    lier = (l) => onLiens([...liens, ...l.map((d) => ({ t: d.t, id: d.id }))], l.length > 1 ? l.length + " paiements reliés" : "Dépense reliée"),
    autres = [
      ...(items || []).filter((i) => (i.pocket === "formation" || i.pocket === "sport") && !liens.some((l) => l.t === "item" && l.id === i.id)).map((i) => ({ t: "item", id: i.id })),
      ...(transactions || []).filter((t) => t.statut === "prevu" && !liens.some((l) => l.t === "tx" && l.id === t.id)).map((t) => ({ t: "tx", id: t.id })),
    ].map((k) => depensesDe({ depenses: [k] }, items, transactions, budget)[0]);
  // Pour le sport : toutes les échéances de l'enveloppe sport ensemble ; sinon la meilleure ressemblance.
  const proposees = sport ? sug.filter((d) => d.t === "item") : sug.slice(0, 1);
  async function payer(d) {
    if (d.t === "item") await onItemMaj(d.id, { paid: !d.paye }, d.paye ? "Remis à payer" : "Payé ✓");
    else await onTxModifier(d.id, { statut: d.paye ? "prevu" : "fait" });
  }
  async function changerMontant(d, v) {
    if (d.t === "item") await onItemMaj(d.id, { montant_prevu: v }, "Montant modifié dans Budget");
    else await onTxModifier(d.id, { montant: v });
  }
  async function creer() {
    setErreur("");
    const v = Number(String(montant).replace(",", "."));
    if (!(v > 0)) return setErreur("Indique un montant.");
    try {
      let k;
      if (ou === "enveloppe") {
        const it = await onItemCreer({ pocket: sport ? "sport" : "formation", label: nomCourt, montant_prevu: v, mois_index: Number(mois) });
        k = { t: "item", id: it.id };
      } else {
        if (!poste) return setErreur("Choisis le poste.");
        const t = await onTxAjouter({ budget_line_id: poste, montant: v, note: nomCourt, date_depense: date, statut: "prevu" });
        k = { t: "tx", id: t.id };
      }
      await onLiens([...liens, k], "Dépense créée dans Budget et reliée");
      setOuvert(false), setMontant("");
    } catch (e) {
      setErreur("Pas enregistré : " + (e.message || e));
    }
  }
  const parSeance = texteParSeance(x, r.total, { contenu, seances, jour });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "2px solid var(--fond-gris)", paddingTop: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ ...titreSection, flex: 1 }}>💶 Ce que ça coûte</span>
        {r.nb > 0 && <span style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700 }}>{eur(r.total)}</span>}
      </div>
      {r.nb > 0 && (
        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-soft)", marginTop: -6 }}>
          {r.payees === r.nb ? "Tout payé" : r.payees + "/" + r.nb + " payé" + (r.payees > 1 ? "s" : "")}
          {parSeance ? " · " + parSeance : ""}
        </span>
      )}
      {!liens.length && proposees.length > 0 && (
        <button type="button" onClick={() => lier(proposees)} style={{ display: "flex", alignItems: "center", gap: 10, border: "2px dashed " + couleur[0], borderRadius: 14, background: "var(--fond-doux)", padding: "10px 12px", textAlign: "left", font: "inherit", color: "var(--ink)", cursor: "pointer" }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <span style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <span style={petit}>Trouvé dans ton Budget</span>
            <span style={{ fontSize: 14.5, fontWeight: 800 }}>
              {proposees.length > 1 ? proposees[0].titre.replace(/\s*\(\d+\/\d+\)\s*$/, "") + " · " + proposees.length + " paiements · " + eur(proposees.reduce((s, d) => s + d.montant, 0)) : proposees[0].titre + " · " + eur(proposees[0].montant)}
            </span>
          </span>
          <span style={{ height: 34, padding: "0 12px", borderRadius: 10, background: couleur[0], color: couleur[1], display: "flex", alignItems: "center", fontSize: 13.5, fontWeight: 800 }}>Relier</span>
        </button>
      )}
      {deps.map((d) => (
        <LigneDepense key={d.t + d.id} d={d} couleur={couleur} onPayer={payer} onMontant={changerMontant} onDelier={(k) => onLiens(liens.filter((l) => !(l.t === k.t && l.id === k.id)), "Dépense déliée (elle reste dans Budget)")} />
      ))}
      {autresCours.length > 0 && <span style={petit}>🔗 Aussi reliée à {autresCours.join(", ")} : comptée une seule fois dans Budget.</span>}
      <button type="button" onClick={() => setOuvert(!ouvert)} style={{ ...lien, color: couleur[0] === "var(--line-strong)" ? "var(--ink)" : couleur[0] }}>
        {ouvert ? "▾ Fermer" : liens.length ? "+ Un autre paiement" : "+ Ajouter un prix"}
      </button>
      {ouvert && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--fond-doux)", borderRadius: 14, padding: 10 }}>
          <div role="radiogroup" aria-label="Où va la dépense" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              ["enveloppe", sport ? "🤸 Enveloppe sport" : "🎓 Enveloppe formation"],
              ["poste", "🧾 Dépense à venir dans un poste"],
            ].map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={ou === v} onClick={() => setOu(v)} style={{ minHeight: 48, borderRadius: 12, border: "2px solid " + (ou === v ? couleur[0] : "var(--line)"), background: "var(--surface)", color: "var(--ink)", font: "inherit", fontSize: 12.5, fontWeight: 800, padding: "4px 8px", cursor: "pointer" }}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input aria-label="Montant" inputMode="decimal" placeholder="Montant €" value={montant} onChange={(e) => setMontant(e.target.value)} style={champ} />
            {ou === "enveloppe" ? (
              <select aria-label="Mois" value={mois} onChange={(e) => setMois(e.target.value)} style={champ}>
                {MOIS.map((m, i) => (
                  <option key={i} value={i}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input aria-label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={champ} />
            )}
          </div>
          {ou === "poste" && (
            <select aria-label="Poste" value={poste} onChange={(e) => setPoste(e.target.value)} style={champ}>
              <option value="">Choisis le poste…</option>
              {postes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.poste}
                </option>
              ))}
            </select>
          )}
          {erreur && (
            <span role="alert" style={{ fontSize: 13, fontWeight: 700, color: "var(--t-rouge)" }}>
              {erreur}
            </span>
          )}
          <button type="button" onClick={creer} style={{ height: 44, borderRadius: 12, border: 0, background: couleur[0], color: couleur[1], font: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
            Créer dans Budget et relier
          </button>
          {autres.length > 0 && (
            <>
              <span style={petit}>Ou relier une dépense déjà dans Budget :</span>
              {autres.map((d) => (
                <button key={d.t + d.id} type="button" onClick={() => (lier([d]), setOuvert(false))} style={{ display: "flex", alignItems: "center", gap: 8, border: "2px solid var(--line)", borderRadius: 12, background: "var(--surface)", padding: "8px 10px", textAlign: "left", font: "inherit", color: "var(--ink)", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>
                  <span style={{ flex: 1, minWidth: 0 }}>{d.titre}</span>
                  <span style={{ color: "var(--slate)", whiteSpace: "nowrap" }}>
                    {eur(d.montant)} · {d.quand}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
      <span style={petit}>Une seule dépense, la même que dans Budget. Supprimer le cours ne supprime jamais une dépense.</span>
    </div>
  );
}

// ---------- Déplacer cette fois ----------
export function FicheDeplacer({ cours, dateIso, debut, fin, couleur, onClose, onDeplacer }) {
  const [date, setDate] = React.useState(dateIso),
    [de, setDe] = React.useState(debut || ""),
    [a, setA] = React.useState(fin || ""),
    [erreur, setErreur] = React.useState("");
  const nom = String(cours.titre || "").replace(/^Sport\s*[—-]\s*/, "");
  async function ok() {
    if (!date || !de || !a || a <= de) return setErreur("Choisis le jour, puis un début et une fin dans l'ordre.");
    if (date === dateIso && de === debut && a === fin) return setErreur("Change le jour ou l'heure.");
    try {
      await onDeplacer({ cours, date: dateIso, nouvelle: date, debut: de, fin: a });
      onClose();
    } catch (e) {
      setErreur("Pas enregistré : " + (e.message || e));
    }
  }
  return (
    <KbSheet label={"🔁 Déplacer " + nom + " cette fois"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-soft)" }}>Le cours prévu ce jour-là est mis en « pas cette semaine », et il a lieu une seule fois au nouveau moment : même lieu, même rappel, même prix. Il compte comme le même cours.</span>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5, fontWeight: 800, color: "var(--slate)" }}>
          Nouveau jour
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...champ, height: 46 }} data-autofocus />
        </label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="time" aria-label="Début" value={de} onChange={(e) => setDe(e.target.value)} style={{ ...champ, height: 46, textAlign: "center" }} />
          <span style={{ fontWeight: 800, color: "var(--slate)" }}>→</span>
          <input type="time" aria-label="Fin" value={a} onChange={(e) => setA(e.target.value)} style={{ ...champ, height: 46, textAlign: "center" }} />
        </div>
        {erreur && (
          <div role="alert" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--t-rouge)" }}>
            {erreur}
          </div>
        )}
        <button type="button" onClick={ok} style={{ height: 52, borderRadius: 16, border: 0, background: couleur[0], color: couleur[1], font: "inherit", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
          Déplacer
        </button>
      </div>
    </KbSheet>
  );
}

// 📚 Devoirs à montrer sur une séance : matière du cours, à rendre entre cette séance et la suivante.
export function devoirsPour(matiere, dIso, prochaineIso, homework) {
  if (!matiere) return [];
  const m = matiere.trim().toLowerCase();
  return (homework || []).filter((h) => {
    const d = h.deadline ? String(h.deadline).slice(0, 10) : null;
    return d && String(h.subject || "").trim().toLowerCase() === m && !["Fait", "Corrigé"].includes(h.status) && d >= dIso && (!prochaineIso || d < prochaineIso);
  });
}
