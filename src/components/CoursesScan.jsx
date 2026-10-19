import React from "react";
import { supabase } from "../lib/supabase.js";
import { ToastAnnuler } from "./ToastAnnuler.jsx";

// Montant du ticket : on cherche la ligne « TOTAL » (hors TVA, HT, rendu).
export function lireTotal(texte) {
  const lignes = texte.split("\n");
  let trouve = null;
  for (const l of lignes) {
    if (!/total/i.test(l) || /tva|ht|rendu|espèce|carte/i.test(l)) continue;
    const nombres = [...l.matchAll(/(\d+[.,]\d{2})/g)].map((m) => Number(m[1].replace(",", ".")));
    if (nombres.length) trouve = nombres[nombres.length - 1];
  }
  return trouve;
}

const moisIndex = (dateIso) => {
  const [y, m] = dateIso.split("-").map(Number);
  return (y - 2026) * 12 + m - 8;
};

// Photo du ticket → montant lu → dépense « Alimentation » du mois, avec Annuler.
export function ScanTicket({ user, onFait }) {
  const [busy, setBusy] = React.useState(false);
  const [ali, setAli] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [saisie, setSaisie] = React.useState(null); // montant à taper si non lu
  const [msg, setMsg] = React.useState("");
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    supabase
      .from("vision_budget")
      .select("id, line_key")
      .eq("user_id", user.id)
      .eq("line_key", "c_alim")
      .maybeSingle()
      .then(({ data }) => setAli(data ? data.id : null));
  }, [user.id]);

  const enregistrer = async (montant) => {
    const aujourdhui = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("vision_transactions")
      .insert({
        user_id: user.id,
        budget_line_id: ali,
        montant,
        note: "Ticket (photo)",
        date_depense: aujourdhui,
        mois_index: moisIndex(aujourdhui),
        type: "depense",
        statut: "fait",
        exceptionnelle: false,
      })
      .select("id")
      .single();
    if (error) return setMsg("Non enregistré.");
    setSaisie(null);
    setMsg("");
    setToast({
      msg: `Ticket ${montant.toFixed(2).replace(".", ",")} € · Alimentation`,
      annuler: async () => {
        await supabase.from("vision_transactions").delete().eq("id", data.id);
        onFait && onFait();
      },
    });
    onFait && onFait();
  };

  const choisie = async (e) => {
    const fichier = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!fichier || !ali) return setMsg("Ligne Alimentation introuvable.");
    setBusy(true);
    setMsg("Lecture du ticket…");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("fra");
      const {
        data: { text },
      } = await worker.recognize(fichier);
      await worker.terminate();
      const total = lireTotal(text);
      setBusy(false);
      if (total && total > 0) {
        setMsg("");
        enregistrer(total);
      } else {
        setMsg("Montant non lu, tape-le :");
        setSaisie("");
      }
    } catch (err) {
      setBusy(false);
      setMsg("Lecture impossible, réessaie.");
    }
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={choisie} style={{ display: "none" }} aria-label="Photo du ticket" />
      <button type="button" onClick={() => inputRef.current && inputRef.current.click()} disabled={busy} style={{ width: "100%", height: 48 }}>
        {busy ? "Lecture…" : "📷 Photo du ticket"}
      </button>
      {saisie !== null && (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input aria-label="Montant du ticket" inputMode="decimal" placeholder="€" value={saisie} onChange={(e) => setSaisie(e.target.value)} style={{ flex: 1, height: 44, borderRadius: 10, padding: "0 10px" }} />
          <button type="button" onClick={() => enregistrer(Number(String(saisie).replace(",", ".")))} style={{ height: 44, padding: "0 14px" }}>
            OK
          </button>
        </div>
      )}
      {msg && (
        <p role="status" style={{ margin: "6px 0 0", fontSize: 13 }}>
          {msg}
        </p>
      )}
      <ToastAnnuler toast={toast} onFermer={() => setToast(null)} />
    </div>
  );
}
