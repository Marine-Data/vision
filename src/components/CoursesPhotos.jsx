import React from "react";
import { supabase } from "../lib/supabase.js";

const BUCKET = "tickets-photos";

// Bouton qui ouvre l'appareil photo et enregistre la photo du ticket.
export function PhotoTicket({ user, onAjoute }) {
  const [envoi, setEnvoi] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const inputRef = React.useRef(null);

  const choisie = async (e) => {
    const fichier = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!fichier) return;
    setEnvoi(true);
    setMsg("");
    const aujourdhui = new Date().toISOString().slice(0, 10);
    const chemin = `${user.id}/${Date.now()}.jpg`;
    const { error: errUp } = await supabase.storage.from(BUCKET).upload(chemin, fichier, { contentType: fichier.type || "image/jpeg" });
    if (errUp) {
      setEnvoi(false);
      return setMsg("Photo non enregistrée.");
    }
    const { error: errBase } = await supabase
      .from("vision_tickets_photos")
      .insert({ user_id: user.id, path: chemin, date_ticket: aujourdhui });
    setEnvoi(false);
    if (errBase) {
      await supabase.storage.from(BUCKET).remove([chemin]);
      return setMsg("Photo non enregistrée.");
    }
    setMsg("Photo enregistrée.");
    onAjoute && onAjoute();
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={choisie} style={{ display: "none" }} aria-label="Photo du ticket" />
      <button type="button" onClick={() => inputRef.current && inputRef.current.click()} disabled={envoi} style={{ width: "100%", height: 48 }}>
        {envoi ? "Envoi en cours…" : "📷 Photo du ticket"}
      </button>
      {msg && (
        <p role="status" style={{ margin: "6px 0 0", fontSize: 13 }}>
          {msg}
        </p>
      )}
    </div>
  );
}

// Liste des photos de tickets, avec lien d'ouverture temporaire.
export function ListePhotos({ user, rafraichir }) {
  const [photos, setPhotos] = React.useState([]);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    let vivant = true;
    (async () => {
      const { data, error } = await supabase
        .from("vision_tickets_photos")
        .select("id, path, date_ticket")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!vivant) return;
      if (error) return setErr("Impossible de charger les photos.");
      const avecLien = await Promise.all(
        (data || []).map(async (p) => {
          const { data: s } = await supabase.storage.from(BUCKET).createSignedUrl(p.path, 3600);
          return { ...p, url: s ? s.signedUrl : null };
        })
      );
      if (vivant) setPhotos(avecLien);
    })();
    return () => (vivant = false);
  }, [user.id, rafraichir]);

  if (err) return <p role="alert">{err}</p>;
  if (!photos.length) return <p>Aucune photo de ticket pour l'instant.</p>;

  return (
    <section>
      <h3>Photos de tickets</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {photos.map((p) => (
          <a key={p.id} href={p.url || "#"} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              {new Date(p.date_ticket + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </div>
            <div style={{ height: 120, borderRadius: 10, background: "rgba(127,127,127,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
              Voir la photo
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
