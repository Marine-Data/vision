import React from "react";
import { supabase } from "../lib/supabase.js";
import { ValiderTicket, HistoriqueTickets } from "./CoursesTickets.jsx";

// Ordre d'affichage des rayons ; un article sans rayon va dans « Autres ».
const RAYONS = ["Légumes", "Frais", "Épicerie", "Autres"];

export function Courses({ user }) {
  const [articles, setArticles] = React.useState([]);
  const [saisie, setSaisie] = React.useState("");
  const [err, setErr] = React.useState("");
  const [charge, setCharge] = React.useState(true);
  const [vue, setVue] = React.useState("liste"); // liste | valider | historique
  const [version, setVersion] = React.useState(0);
  const uid = user && user.id;

  const charger = React.useCallback(async () => {
    if (!uid) return;
    const { data, error } = await supabase
      .from("vision_courses")
      .select("id, label, rayon, coche, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });
    if (error) setErr("Impossible de charger la liste.");
    else setArticles(data || []);
    setCharge(false);
  }, [uid]);

  React.useEffect(() => {
    charger();
  }, [charger]);

  const ajouter = async (e) => {
    e.preventDefault();
    const label = saisie.trim();
    if (!label || !uid) return;
    const { data, error } = await supabase
      .from("vision_courses")
      .insert({ user_id: uid, label, rayon: null, poste: "Alimentation" })
      .select()
      .single();
    if (error) return setErr("Article non ajouté.");
    setSaisie("");
    setArticles((a) => [...a, data]);
  };

  const basculer = async (art) => {
    const coche = !art.coche;
    setArticles((a) => a.map((x) => (x.id === art.id ? { ...x, coche } : x)));
    const { error } = await supabase.from("vision_courses").update({ coche, updated_at: new Date().toISOString() }).eq("id", art.id);
    if (error) {
      setErr("Modification non enregistrée.");
      charger();
    }
  };

  const supprimer = async (art) => {
    setArticles((a) => a.filter((x) => x.id !== art.id));
    const { error } = await supabase.from("vision_courses").delete().eq("id", art.id);
    if (error) {
      setErr("Suppression impossible.");
      charger();
    }
  };

  const toutDecocher = async () => {
    setArticles((a) => a.map((x) => ({ ...x, coche: false })));
    const { error } = await supabase.from("vision_courses").update({ coche: false }).eq("user_id", uid).eq("coche", true);
    if (error) {
      setErr("Remise à zéro impossible.");
      charger();
    }
  };

  const restants = articles.filter((x) => !x.coche);
  const coches = articles.filter((x) => x.coche);
  const parRayon = (liste) =>
    RAYONS.map((r) => ({
      rayon: r,
      items: liste.filter((x) => (x.rayon || "Autres") === r),
    })).filter((g) => g.items.length);

  const ligne = (art) => (
    <div key={art.id} className="courses-ligne" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0" }}>
      <input type="checkbox" checked={art.coche} onChange={() => basculer(art)} aria-label={art.label} />
      <span style={{ flex: 1, textDecoration: art.coche ? "line-through" : "none", opacity: art.coche ? 0.6 : 1 }}>{art.label}</span>
      <button type="button" aria-label={`Supprimer ${art.label}`} onClick={() => supprimer(art)}>
        ×
      </button>
    </div>
  );

  if (!uid) return <p>Connectez-vous pour voir vos courses.</p>;

  if (vue === "valider")
    return (
      <ValiderTicket
        user={user}
        onFait={() => {
          setVersion((v) => v + 1);
          setVue("historique");
        }}
        onAnnuler={() => setVue("liste")}
      />
    );
  if (vue === "historique")
    return (
      <section>
        <button type="button" onClick={() => setVue("liste")} style={{ marginBottom: 10 }}>‹ Retour à la liste</button>
        <HistoriqueTickets user={user} rafraichir={version} />
      </section>
    );

  return (
    <section className="courses">
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button type="button" onClick={() => setVue("valider")} style={{ flex: 1 }}>Valider un ticket</button>
        <button type="button" onClick={() => setVue("historique")} style={{ flex: 1 }}>Historique</button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span>
          {coches.length} sur {articles.length} achetés
        </span>
        <button type="button" onClick={toutDecocher} disabled={!coches.length}>
          Tout décocher
        </button>
      </div>
      <form onSubmit={ajouter} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder="Ajouter un article"
          aria-label="Ajouter un article"
          style={{ flex: 1, minWidth: 0 }}
        />
        <button type="submit" aria-label="Ajouter">
          +
        </button>
      </form>
      {err && (
        <p role="alert" style={{ color: "var(--red)" }}>
          {err}
        </p>
      )}
      {!charge &&
        parRayon(restants).map((g) => (
          <div key={g.rayon}>
            <h3>{g.rayon}</h3>
            {g.items.map(ligne)}
          </div>
        ))}
      {coches.length > 0 && (
        <div>
          <h3>Cochés</h3>
          {coches.map(ligne)}
        </div>
      )}
    </section>
  );
}
