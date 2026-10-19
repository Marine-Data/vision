import React from "react";
import { supabase } from "../lib/supabase.js";

const MOIS_FR = { janv: 1, févr: 2, fevr: 2, mars: 3, avr: 4, mai: 5, juin: 6, juil: 7, août: 8, aout: 8, sept: 9, oct: 10, nov: 11, déc: 12, dec: 12 };
const moisIndex = (iso) => {
  const [y, m] = iso.split("-").map(Number);
  return (y - 2026) * 12 + m - 8;
};
const enIso = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const montantFr = (txt) => Number(txt.replace(/[ .]/g, "").replace(",", "."));
const eur = (n) => n.toFixed(2).replace(".", ",") + " €";

// Une ligne de relevé = une date + un montant. Le libellé est le reste de la ligne.
export function parserReleve(texte) {
  const annee = new Date().getFullYear();
  const lignes = [];
  for (const brut of texte.split("\n")) {
    const l = brut.trim();
    if (!l || /solde|total/i.test(l)) continue;
    const montants = [...l.matchAll(/(\d{1,3}(?:[ .]\d{3})*,\d{2})/g)];
    if (!montants.length) continue;
    let date = null;
    const num = l.match(/(\d{2})\/(\d{2})(?:\/(\d{4}|\d{2}))?/);
    const txt = l.match(/(\d{1,2})\s+([a-zéû]{3,5})\.?/i);
    if (num) {
      const a = num[3] ? (num[3].length === 2 ? 2000 + Number(num[3]) : Number(num[3])) : annee;
      date = enIso(a, Number(num[2]), Number(num[1]));
    } else if (txt && MOIS_FR[txt[2].toLowerCase()]) {
      date = enIso(annee, MOIS_FR[txt[2].toLowerCase()], Number(txt[1]));
    }
    if (!date) continue;
    const dernier = montants[montants.length - 1];
    const libelle = l
      .replace(num ? num[0] : "", "")
      .replace(txt ? txt[0] : "", "")
      .replace(dernier[0], "")
      .replace(/[-+€]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60);
    lignes.push({ date, montant: Math.abs(montantFr(dernier[1])), libelle: libelle || "Dépense" });
  }
  return lignes;
}

// Choix de ligne de budget d'après le libellé (modifiable avant ajout).
const devine = (libelle) => {
  if (/carrefour|intermarch|picard|lidl|aldi|monoprix|franprix|biocoop|super/i.test(libelle)) return "c_alim";
  if (/pharma|doliprane|medecin|mutuelle/i.test(libelle)) return "c_sante";
  if (/navigo|sncf|ratp|uber|taxi|total|carbur/i.test(libelle)) return "c_transports";
  if (/amazon|netflix|spotify|apple|youtube|prime/i.test(libelle)) return "c_abos";
  return "c_plaisir";
};

export function VerifierReleve({ user }) {
  const [lignesRel, setLignesRel] = React.useState(null); // relevé lu
  const [resultat, setResultat] = React.useState(null); // { ok, manquants, enPlus }
  const [lignesBudget, setLignesBudget] = React.useState([]);
  const [choix, setChoix] = React.useState({}); // index manquant -> line_key
  const [msg, setMsg] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const fichierRef = React.useRef(null);

  React.useEffect(() => {
    supabase
      .from("vision_budget")
      .select("budget_line_id:id, line_key, poste")
      .eq("user_id", user.id)
      .eq("kind", "charge")
      .neq("line_key", "c_sport")
      .order("sort", { ascending: true })
      .then(({ data }) => setLignesBudget(data || []));
  }, [user.id]);

  const comparer = async (rel) => {
    const dates = rel.map((x) => x.date).sort();
    const debut = dates[0];
    const fin = dates[dates.length - 1];
    const { data: tx } = await supabase
      .from("vision_transactions")
      .select("id, montant, date_depense, note")
      .eq("user_id", user.id)
      .gte("date_depense", debut)
      .lte("date_depense", fin);
    const libres = [...(tx || [])];
    const ok = [];
    const manquants = [];
    for (const r of rel) {
      const i = libres.findIndex(
        (t) => Math.abs(Number(t.montant) - r.montant) < 0.005 && Math.abs(new Date(t.date_depense) - new Date(r.date)) <= 86400000,
      );
      if (i >= 0) {
        ok.push(r);
        libres.splice(i, 1);
      } else manquants.push(r);
    }
    setResultat({ ok, manquants, enPlus: libres });
    setChoix(Object.fromEntries(manquants.map((m) => [rel.indexOf(m), devine(m.libelle)])));
  };

  const lireFichier = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    setMsg("Lecture du relevé…");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("fra");
      const {
        data: { text },
      } = await worker.recognize(f);
      await worker.terminate();
      const rel = parserReleve(text);
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
    const cle = lignesBudget.find((x) => x.line_key === choix[k]);
    if (!cle) return setMsg("Ligne introuvable.");
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
    <div key={x.date + x.montant + x.libelle} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--line, #dbeaec)" }}>
      <span style={{ width: 52, opacity: 0.6 }}>{x.date.slice(8)}/{x.date.slice(5, 7)}</span>
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.libelle}</span>
      <span style={{ width: 84, textAlign: "right" }}>{eur(x.montant)}</span>
      {extra}
    </div>
  );

  return (
    <div style={{ marginBottom: 12 }}>
      <input ref={fichierRef} type="file" accept="image/*" onChange={lireFichier} style={{ display: "none" }} aria-label="Screenshot du relevé" />
      <button type="button" onClick={() => fichierRef.current && fichierRef.current.click()} disabled={busy} style={{ width: "100%", height: 48, borderRadius: 14, border: "1px solid var(--line, #dbeaec)", background: "transparent", fontWeight: 700 }}>
        {busy ? "Lecture…" : "🏦 Vérifier le relevé"}
      </button>
      {msg && <p role="status" style={{ fontSize: 13, margin: "6px 0 0" }}>{msg}</p>}
      {resultat && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>
            ✅ {resultat.ok.length} enregistrées · ❌ {resultat.manquants.length} absentes · ⚠️ {resultat.enPlus.length} seulement dans Vision
          </div>
          {resultat.manquants.map((m, k) => {
            const idx = lignesRel.indexOf(m);
            return ligneRel(
              m,
              <span style={{ display: "flex", gap: 6, marginLeft: 6 }}>
                <select aria-label={`Catégorie de ${m.libelle}`} value={choix[idx] || ""} onChange={(e) => setChoix((c) => ({ ...c, [idx]: e.target.value }))} style={{ fontSize: 12, maxWidth: 110 }}>
                  {lignesBudget.map((b) => (
                    <option key={b.line_key} value={b.line_key}>{b.poste}</option>
                  ))}
                </select>
                <button type="button" onClick={() => ajouter(m, idx)} style={{ fontSize: 12, padding: "2px 8px" }}>Ajouter</button>
              </span>,
            );
          })}
          {resultat.enPlus.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
              ⚠️ Dans Vision mais pas sur ce relevé : {resultat.enPlus.map((t) => `${eur(Number(t.montant))} (${t.note || "sans note"})`).join(" · ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
