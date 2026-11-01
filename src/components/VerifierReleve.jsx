import React from "react";
import { supabase } from "../lib/supabase.js";
import { parserReleve, preparerImage } from "../lib/releveImage.js";
import { classer, lireFichierPdf, nomOperation } from "../lib/importReleve.js";

const moisIndex = (iso) => {
  const [y, m] = iso.split("-").map(Number);
  return (y - 2026) * 12 + m - 8;
};
const eur = (n) => n.toFixed(2).replace(".", ",") + " €";
const JOUR = 86400000;
const TOLERANCE = 4 * JOUR; // carte débitée jusqu'à quelques jours après l'achat
const decaler = (iso, j) => new Date(new Date(iso).getTime() + j * JOUR).toISOString().slice(0, 10);
// Écart de date entre une dépense Vision et une ligne du relevé (date d'achat ou date de débit).
const ecart = (t, r) =>
  Math.min(...[r.date, r.dateOp || r.date].map((d) => Math.abs(new Date(t.date_depense) - new Date(d))));

// Choix de ligne de budget d'après le libellé (modifiable avant ajout).
const devine = (libelle) => {
  if (/carrefour|intermarch|picard|lidl|aldi|monoprix|franprix|biocoop|super/i.test(libelle)) return "c_alim";
  if (/pharma|doliprane|medecin|mutuelle/i.test(libelle)) return "c_sante";
  if (/navigo|sncf|ratp|uber|taxi|total|carbur/i.test(libelle)) return "c_transports";
  if (/amazon|netflix|spotify|apple|youtube|prime/i.test(libelle)) return "c_abos";
  return "c_plaisir";
};

export function VerifierReleve({ user, onSupprimer }) {
  const [lignesRel, setLignesRel] = React.useState(null); // relevé lu
  const [resultat, setResultat] = React.useState(null); // { ok, manquants, enPlus }
  const [lignesBudget, setLignesBudget] = React.useState([]);
  const [regles, setRegles] = React.useState([]); // règles du relevé (virements internes, postes…)
  const [paiementsEnveloppe, setPaiementsEnveloppe] = React.useState([]); // sport, formation, vacances payés
  const [choix, setChoix] = React.useState({}); // index manquant -> line_key
  const [msg, setMsg] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [texteLu, setTexteLu] = React.useState("");
  const fichierRef = React.useRef(null);
  const enCours = React.useRef(new Set()); // lignes en cours d'ajout : bloque les tapes répétées
  const [ajoutEnCours, setAjoutEnCours] = React.useState({});

  React.useEffect(() => {
    supabase
      .from("vision_budget")
      .select("budget_line_id:id, line_key, poste")
      .eq("user_id", user.id)
      .eq("kind", "charge")
      .neq("line_key", "c_sport")
      .order("sort", { ascending: true })
      .then(({ data }) => setLignesBudget(data || []));
    supabase
      .from("vision_import_regles")
      .select("motif, groupe, poste, source, sort")
      .eq("user_id", user.id)
      .order("sort")
      .then(({ data }) => setRegles(data || []));
    supabase
      .from("vision_items")
      .select("id, pocket, label, montant_reel, mois_index, statut")
      .eq("user_id", user.id)
      .eq("paid", true)
      .then(({ data }) =>
        setPaiementsEnveloppe((data || []).filter((x) => x.montant_reel != null && x.statut !== "abandonne")),
      );
  }, [user.id]);

  const comparer = async (rel) => {
    rel.forEach((r, i) => (r.id = r.id || "r" + i)); // clé unique, même pour deux lignes identiques
    const dates = rel.map((x) => x.date).sort();
    const debut = dates[0];
    const fin = dates[dates.length - 1];
    // Recherche élargie autour du relevé : une dépense saisie un peu avant ou après est retrouvée.
    const { data: tx } = await supabase
      .from("vision_transactions")
      .select("id, montant, date_depense, note")
      .eq("user_id", user.id)
      .gte("date_depense", decaler(debut, -4))
      .lte("date_depense", decaler(fin, 4));
    const libres = [...(tx || [])];
    const ok = [];
    const manquants = [];
    const enveloppes = []; // payés par une enveloppe (sport, formation, vacances)
    const internes = []; // virements entre tes comptes : ni dépense, ni absent
    const items = [...paiementsEnveloppe];
    for (const r of rel) {
      const i = libres.findIndex(
        (t) => Math.abs(Number(t.montant) - r.montant) < 0.005 && ecart(t, r) <= TOLERANCE,
      );
      if (i >= 0) {
        ok.push(r);
        libres.splice(i, 1);
        continue;
      }
      const j = items.findIndex(
        (x) =>
          Math.abs(Number(x.montant_reel) - r.montant) < 0.005 &&
          Math.abs(x.mois_index - moisIndex(r.date)) <= 1,
      );
      if (j >= 0) {
        enveloppes.push({ ...r, enveloppe: items[j].label });
        items.splice(j, 1);
      } else if (r.groupe === "ignorer") internes.push(r);
      else manquants.push(r);
    }
    // « Seulement dans Vision » : uniquement sur la période du relevé.
    const enPlus = libres.filter((t) => t.date_depense >= debut && t.date_depense <= fin);
    setResultat({ ok, manquants, enPlus, enveloppes, internes });
    // Poste proposé : règles du relevé d'abord, sinon mots-clés.
    const posteDe = (m) => {
      const l = m.groupe && lignesBudget.find((b) => b.poste === m.groupe);
      return l ? l.line_key : devine(m.libelle);
    };
    setChoix(Object.fromEntries(manquants.map((m) => [rel.indexOf(m), posteDe(m)])));
  };

  const lireFichier = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    setMsg("Lecture du relevé…");
    try {
      // Relevé PDF BoursoBank : lecture directe du texte, sans OCR.
      if (f.type === "application/pdf" || /\.pdf$/i.test(f.name)) {
        const { ops } = await lireFichierPdf(f);
        const debits = ops.filter((o) => o.sens === "debit");
        // Une annulation (« ANNUL CARTE … ») efface le débit identique.
        for (const a of ops.filter((o) => o.sens === "credit" && /^ANNUL /.test(o.libelle))) {
          const cible = a.libelle.replace(/^ANNUL /, "");
          const i = debits.findIndex((d) => d.libelle === cible && Math.abs(d.montant - a.montant) < 0.005);
          if (i >= 0) debits.splice(i, 1);
        }
        const rel = debits.map((o) => ({
          date: o.dateAchat || o.date,
          dateOp: o.date,
          libelle: nomOperation(o.libelle),
          montant: o.montant,
          groupe: classer(o, regles),
        }));
        setTexteLu("");
        setLignesRel(rel);
        if (!rel.length) setMsg("Aucune ligne lue dans ce PDF.");
        else {
          setMsg("");
          await comparer(rel);
        }
        setBusy(false);
        return;
      }
      const image = await preparerImage(f);
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("fra");
      let text = (await worker.recognize(image)).data.text;
      let rel = parserReleve(text);
      if (!rel.length) {
        // 2e essai : lecture en bloc uniforme, mieux adaptée aux listes d'opérations
        await worker.setParameters({ tessedit_pageseg_mode: "6" });
        text = (await worker.recognize(image)).data.text;
        rel = parserReleve(text);
      }
      await worker.terminate();
      setTexteLu(text);
      setLignesRel(rel);
      if (!rel.length) setMsg("Aucune ligne lue sur cette image.");
      else {
        setMsg("");
        await comparer(rel);
      }
    } catch (err) {
      setMsg("Lecture impossible, réessaie.");
    }
    setBusy(false);
  };

  const ajouter = async (m, k) => {
    if (enCours.current.has(k)) return;
    enCours.current.add(k);
    setAjoutEnCours((a) => ({ ...a, [k]: true }));
    try {
      await ajouterUne(m, k);
    } finally {
      enCours.current.delete(k);
      setAjoutEnCours((a) => ({ ...a, [k]: false }));
    }
  };

  // Supprimer une dépense présente dans Vision mais absente du relevé (ex. doublon).
  const supprimer = async (t) => {
    const quand = `${t.date_depense.slice(8)}/${t.date_depense.slice(5, 7)}`;
    if (!window.confirm(`Supprimer ${eur(Number(t.montant))} du ${quand} (${t.note || "sans note"}) ?`))
      return;
    try {
      if (onSupprimer) await onSupprimer(t.id);
      else {
        const { error } = await supabase.from("vision_transactions").delete().eq("id", t.id);
        if (error) throw error;
      }
      setResultat((r) => ({ ...r, enPlus: r.enPlus.filter((x) => x.id !== t.id) }));
    } catch (e) {
      setMsg("Suppression impossible.");
    }
  };

  const ajouterUne = async (m, k) => {
    const cle = lignesBudget.find((x) => x.line_key === choix[k]);
    if (!cle) return setMsg("Ligne introuvable.");
    // Garde-fou : même montant déjà saisi à ± 4 jours → demander avant d'ajouter.
    const { data: proches } = await supabase
      .from("vision_transactions")
      .select("montant, date_depense, note")
      .eq("user_id", user.id)
      .eq("montant", m.montant)
      .gte("date_depense", decaler(m.date, -4))
      .lte("date_depense", decaler(m.dateOp || m.date, 4));
    if (proches && proches.length) {
      const p = proches[0];
      const deja = `${p.date_depense.slice(8)}/${p.date_depense.slice(5, 7)} (${p.note || "sans note"})`;
      if (!window.confirm(`Déjà saisi : ${eur(Number(p.montant))} le ${deja}. Ajouter quand même ?`)) return;
    }
    const { error } = await supabase.from("vision_transactions").insert({
      user_id: user.id,
      budget_line_id: cle.budget_line_id,
      montant: m.montant,
      note: m.libelle,
      date_depense: m.date,
      mois_index: moisIndex(m.date),
      type: "depense",
      statut: "fait",
      exceptionnelle: false,
    });
    if (error) return setMsg("Non ajoutée.");
    setResultat((r) => ({ ...r, manquants: r.manquants.filter((x) => x !== m), ok: [...r.ok, m] }));
  };

  const ligneRel = (x, extra) => (
    <div
      key={x.id || x.date + x.montant + x.libelle}
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        fontSize: 13,
        padding: "6px 0",
        borderBottom: "1px solid var(--line, #dbeaec)",
      }}
    >
      <span style={{ width: 52, opacity: 0.6 }}>
        {x.date.slice(8)}/{x.date.slice(5, 7)}
      </span>
      <span
        style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {x.libelle}
      </span>
      <span style={{ width: 84, textAlign: "right" }}>{eur(x.montant)}</span>
      {extra}
    </div>
  );

  return (
    <div style={{ marginBottom: 12 }}>
      <input
        ref={fichierRef}
        type="file"
        accept="image/*,application/pdf,.pdf"
        onChange={lireFichier}
        style={{ display: "none" }}
        aria-label="Relevé (PDF ou screenshot)"
      />
      <button
        type="button"
        onClick={() => fichierRef.current && fichierRef.current.click()}
        disabled={busy}
        style={{
          width: "100%",
          height: 48,
          borderRadius: 14,
          border: "1px solid var(--line, #dbeaec)",
          background: "transparent",
          fontWeight: 700,
        }}
      >
        {busy ? "Lecture…" : "🏦 Vérifier le relevé"}
      </button>
      {msg && (
        <p role="status" style={{ fontSize: 13, margin: "6px 0 0" }}>
          {msg}
        </p>
      )}
      {lignesRel && !lignesRel.length && texteLu.trim() && (
        <details style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
          <summary>Voir ce qui a été lu</summary>
          <pre style={{ whiteSpace: "pre-wrap", margin: "6px 0 0" }}>{texteLu.trim().slice(0, 800)}</pre>
        </details>
      )}
      {resultat && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>
            ✅ {resultat.ok.length} enregistrées · ❌ {resultat.manquants.length} absentes · ⚠️{" "}
            {resultat.enPlus.length} seulement dans Vision
          </div>
          {resultat.enveloppes.length > 0 && (
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
              💼 Payés par une enveloppe :{" "}
              {resultat.enveloppes.map((x) => `${x.enveloppe} ${eur(x.montant)}`).join(" · ")}
            </div>
          )}
          {resultat.internes.length > 0 && (
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
              ↔️ Virements entre tes comptes (ignorés) :{" "}
              {resultat.internes.map((x) => `${x.libelle} ${eur(x.montant)}`).join(" · ")}
            </div>
          )}
          {resultat.manquants.map((m, k) => {
            const idx = lignesRel.indexOf(m);
            return ligneRel(
              m,
              <span style={{ display: "flex", gap: 6, marginLeft: 6 }}>
                <select
                  aria-label={`Catégorie de ${m.libelle}`}
                  value={choix[idx] || ""}
                  onChange={(e) => setChoix((c) => ({ ...c, [idx]: e.target.value }))}
                  style={{ fontSize: 12, maxWidth: 110 }}
                >
                  {lignesBudget.map((b) => (
                    <option key={b.line_key} value={b.line_key}>
                      {b.poste}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => ajouter(m, idx)}
                  disabled={!!ajoutEnCours[idx]}
                  style={{ fontSize: 12, padding: "2px 8px" }}
                >
                  {ajoutEnCours[idx] ? "…" : "Ajouter"}
                </button>
              </span>,
            );
          })}
          {resultat.enPlus.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, marginBottom: 4 }}>⚠️ Dans Vision mais pas sur ce relevé</div>
              {resultat.enPlus.map((t) =>
                ligneRel(
                  {
                    id: t.id,
                    date: t.date_depense,
                    libelle: t.note || "sans note",
                    montant: Number(t.montant),
                  },
                  <button
                    type="button"
                    onClick={() => supprimer(t)}
                    style={{ fontSize: 12, padding: "2px 8px", marginLeft: 6 }}
                  >
                    Supprimer
                  </button>,
                ),
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
