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

// Date du ticket (jj/mm/aaaa ou jj/mm/aa) ; à défaut, aujourd'hui.
export function lireDate(texte) {
  const m = texte.match(/(\d{2})[\/.\-](\d{2})[\/.\-](\d{4}|\d{2})/);
  if (!m) return null;
  const jour = Number(m[1]);
  const mois = Number(m[2]);
  const annee = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  if (mois < 1 || mois > 12 || jour < 1 || jour > 31) return null;
  return `${annee}-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
}

// Poste choisi d'après le texte du ticket : pharmacie → Santé, sinon Alimentation.
const estSante = (texte) => /pharmac|parapharm|doliprane|santé|sante/i.test(texte);

// Photo du ticket → montant lu → dépense « Alimentation » du mois, avec Annuler.
export function ScanTicket({ user, onFait }) {
  const [busy, setBusy] = React.useState(false);
  const [ali, setAli] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [saisie, setSaisie] = React.useState(null); // montant à taper si non lu
  const [sante, setSante] = React.useState(null);
  const [reste, setReste] = React.useState(null); // { alim: {budget, depense}, sante: {...} }
  const [recents, setRecents] = React.useState([]); // 5 derniers tickets photo
  const [msg, setMsg] = React.useState("");
  const inputRef = React.useRef(null);

  const resteDe = async (idLigne) => {
    if (!idLigne) return { budget: 0, depense: 0 };
    const { data: ligne } = await supabase.from("vision_budget").select("montant").eq("id", idLigne).maybeSingle();
    const moisCourant = moisIndex(new Date().toISOString().slice(0, 10));
    const { data: depenses } = await supabase
      .from("vision_transactions")
      .select("montant")
      .eq("user_id", user.id)
      .eq("budget_line_id", idLigne)
      .eq("mois_index", moisCourant);
    const depense = (depenses || []).reduce((t, x) => t + Number(x.montant), 0);
    return { budget: ligne ? Number(ligne.montant) : 0, depense };
  };

  const chargerReste = React.useCallback(async (idAli, idSante) => {
    const alim = await resteDe(idAli);
    const sant = await resteDe(idSante);
    setReste({ alim, sante: sant });
    const { data } = await supabase
      .from("vision_transactions")
      .select("id, montant, date_depense, budget_line_id")
      .eq("user_id", user.id)
      .eq("note", "Ticket (photo)")
      .order("created_at", { ascending: false })
      .limit(5);
    setRecents(data || []);
  }, [user.id]);

  React.useEffect(() => {
    supabase
      .from("vision_budget")
      .select("id, line_key")
      .eq("user_id", user.id)
      .in("line_key", ["c_alim", "c_sante"])
      .then(({ data }) => {
        const alim = (data || []).find((x) => x.line_key === "c_alim");
        const sant = (data || []).find((x) => x.line_key === "c_sante");
        setAli(alim ? alim.id : null);
        setSante(sant ? sant.id : null);
        chargerReste(alim ? alim.id : null, sant ? sant.id : null);
      });
  }, [user.id, chargerReste]);

  const enregistrer = async (montant, idLigne = ali, dateTicket = null) => {
    const aujourdhui = dateTicket || new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("vision_transactions")
      .insert({
        user_id: user.id,
        budget_line_id: idLigne,
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
    const estLaSante = idLigne === sante && sante;
    setToast({
      msg: `Ticket ${montant.toFixed(2).replace(".", ",")} € · ${estLaSante ? "Santé" : "Alimentation"}`,
      annuler: async () => {
        await supabase.from("vision_transactions").delete().eq("id", data.id);
        chargerReste(ali, sante);
        onFait && onFait();
      },
    });
    chargerReste(ali, sante);
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
        const ligne = estSante(text) && sante ? sante : ali;
        enregistrer(total, ligne, lireDate(text));
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
      {recents.length > 0 && (
        <div style={{ margin: "0 0 8px", fontSize: 13 }}>
          <div style={{ opacity: 0.6, marginBottom: 4 }}>Derniers tickets</div>
          {recents.map((t) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
              <span>{new Date(t.date_depense + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
              <span>{t.budget_line_id === sante ? "Santé" : "Alimentation"}</span>
              <span>{Number(t.montant).toFixed(2).replace(".", ",")} €</span>
            </div>
          ))}
        </div>
      )}
      {reste && (
        <div style={{ margin: "0 0 8px", fontSize: 13, opacity: 0.8 }}>
          <div>Reste Alimentation : {(reste.alim.budget - reste.alim.depense).toFixed(2).replace(".", ",")} €</div>
          <div>Reste Santé / pharmacie : {(reste.sante.budget - reste.sante.depense).toFixed(2).replace(".", ",")} €</div>
        </div>
      )}
      {saisie !== null && (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input aria-label="Montant du ticket" inputMode="decimal" placeholder="€" value={saisie} onChange={(e) => setSaisie(e.target.value)} style={{ flex: 1, height: 44, borderRadius: 10, padding: "0 10px" }} />
          <button type="button" onClick={() => enregistrer(Number(String(saisie).replace(",", ".")), ali)} style={{ height: 44, padding: "0 14px" }}>
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
