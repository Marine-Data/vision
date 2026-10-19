import React from "react";
import { supabase } from "../lib/supabase.js";

export const POSTES = ["Alimentation", "Santé / pharmacie", "Autres"];

const euros = (n) => Number(n || 0).toFixed(2).replace(".", ",") + " €";
const aujourdhui = () => new Date().toISOString().slice(0, 10);
const versCentimes = (v) => Math.round(Number(String(v).replace(",", ".")) * 100);

// Saisie manuelle d'un ticket : lignes + poste, total contrôlé avant enregistrement.
export function ValiderTicket({ user, onFait, onAnnuler }) {
  const [lieu, setLieu] = React.useState("");
  const [date, setDate] = React.useState(aujourdhui());
  const [total, setTotal] = React.useState("");
  const [lignes, setLignes] = React.useState([{ label: "", montant: "", poste: "Alimentation" }]);
  const [err, setErr] = React.useState("");
  const [envoi, setEnvoi] = React.useState(false);

  const maj = (i, champ, val) => setLignes((l) => l.map((x, k) => (k === i ? { ...x, [champ]: val } : x)));
  const sommeLignes = lignes.reduce((s, x) => s + (x.montant ? versCentimes(x.montant) : 0), 0);
  const totalC = total ? versCentimes(total) : 0;
  const ecart = totalC - sommeLignes;

  const enregistrer = async () => {
    setErr("");
    if (!lieu.trim()) return setErr("Indique le magasin.");
    if (!totalC || totalC <= 0) return setErr("Indique le total du ticket.");
    const valides = lignes.filter((x) => x.label.trim() || x.montant);
    if (valides.some((x) => !x.montant || versCentimes(x.montant) <= 0)) return setErr("Chaque ligne a besoin d'un montant.");
    if (ecart !== 0) return setErr(`Les lignes ne correspondent pas au total (écart ${euros(ecart / 100)}).`);

    // Découpage par poste, en centimes pour éviter les arrondis
    const parPoste = {};
    valides.forEach((x) => (parPoste[x.poste] = (parPoste[x.poste] || 0) + versCentimes(x.montant)));
    const decoupage = Object.entries(parPoste).map(([poste, c]) => ({ poste, montant: c / 100 }));

    setEnvoi(true);
    const { error } = await supabase.from("vision_courses_tickets").insert({
      user_id: user.id,
      lieu: lieu.trim(),
      date_ticket: date,
      total: totalC / 100,
      decoupage,
    });
    setEnvoi(false);
    if (error) return setErr("Ticket non enregistré.");
    onFait();
  };

  const champ = { height: 40, border: "1px solid var(--line, #dbeaec)", borderRadius: 10, padding: "0 10px", width: "100%", boxSizing: "border-box" };

  return (
    <section>
      <h3>Valider un ticket</h3>
      <input aria-label="Magasin" placeholder="Magasin (ex. Intermarché Malakoff)" value={lieu} onChange={(e) => setLieu(e.target.value)} style={{ ...champ, marginBottom: 8 }} />
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input aria-label="Date du ticket" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...champ, flex: 1 }} />
        <input aria-label="Total du ticket" inputMode="decimal" placeholder="Total €" value={total} onChange={(e) => setTotal(e.target.value)} style={{ ...champ, flex: 1 }} />
      </div>

      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Articles</div>
      {lignes.map((x, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
          <input aria-label={`Article ${i + 1}`} placeholder="Article" value={x.label} onChange={(e) => maj(i, "label", e.target.value)} style={{ ...champ, flex: 2, minWidth: 0 }} />
          <input aria-label={`Montant ${i + 1}`} inputMode="decimal" placeholder="€" value={x.montant} onChange={(e) => maj(i, "montant", e.target.value)} style={{ ...champ, flex: 1, minWidth: 0 }} />
          <select aria-label={`Poste ${i + 1}`} value={x.poste} onChange={(e) => maj(i, "poste", e.target.value)} style={{ ...champ, flex: 1.4, minWidth: 0 }}>
            {POSTES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button type="button" aria-label={`Retirer la ligne ${i + 1}`} disabled={lignes.length === 1} onClick={() => setLignes((l) => l.filter((_, k) => k !== i))}>×</button>
        </div>
      ))}
      <button type="button" onClick={() => setLignes((l) => [...l, { label: "", montant: "", poste: "Alimentation" }])} style={{ marginBottom: 12 }}>+ Ajouter une ligne</button>

      <div style={{ fontSize: 13, marginBottom: 12 }}>
        Lignes : {euros(sommeLignes / 100)} · Total : {euros(totalC / 100)}
        {totalC > 0 && sommeLignes > 0 && ecart !== 0 && <span style={{ color: "var(--red)" }}> · écart {euros(ecart / 100)}</span>}
      </div>

      {err && <p role="alert" style={{ color: "var(--red)" }}>{err}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={onAnnuler} style={{ flex: 1 }}>Annuler</button>
        <button type="button" onClick={enregistrer} disabled={envoi} style={{ flex: 1 }}>Enregistrer</button>
      </div>
    </section>
  );
}

// Liste des tickets validés, du plus récent au plus ancien.
export function HistoriqueTickets({ user, rafraichir }) {
  const [tickets, setTickets] = React.useState([]);
  const [err, setErr] = React.useState("");

  const charger = React.useCallback(async () => {
    const { data, error } = await supabase
      .from("vision_courses_tickets")
      .select("id, lieu, date_ticket, total, decoupage")
      .eq("user_id", user.id)
      .order("date_ticket", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) setErr("Impossible de charger l'historique.");
    else setTickets(data || []);
  }, [user.id]);

  React.useEffect(() => {
    charger();
  }, [charger, rafraichir]);

  if (err) return <p role="alert">{err}</p>;
  if (!tickets.length) return <p>Aucun ticket validé pour l'instant.</p>;

  return (
    <section>
      <h3>Tickets validés</h3>
      {tickets.map((t) => (
        <div key={t.id} style={{ background: "#fff", border: "1px solid var(--line, #dbeaec)", borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 500 }}>
            <span>{t.lieu}</span>
            <span>{euros(t.total)}</span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>{new Date(t.date_ticket + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</div>
          <div style={{ fontSize: 12 }}>{(t.decoupage || []).map((d) => `${d.poste} ${euros(d.montant)}`).join(" · ")}</div>
        </div>
      ))}
    </section>
  );
}
