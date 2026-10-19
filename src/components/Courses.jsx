import React from "react";
import { supabase } from "../lib/supabase.js";
import { ValiderTicket, HistoriqueTickets } from "./CoursesTickets.jsx";

// Ordre d'affichage des rayons. Un article sans rayon va dans « Autres ».
const RAYONS = ["Légumes", "Frais", "Épicerie", "Autres"];
const rayonDe = (x) => x.rayon || "Autres";

export function Courses({ user }) {
  const [articles, setArticles] = React.useState([]);
  const [saisie, setSaisie] = React.useState("");
  const [rayonSaisie, setRayonSaisie] = React.useState("Autres");
  const [err, setErr] = React.useState("");
  const [charge, setCharge] = React.useState(true);
  const [vue, setVue] = React.useState("liste"); // liste | valider | historique
  const [version, setVersion] = React.useState(0);
  const [glisse, setGlisse] = React.useState(null); // { id, label, x, y, over }
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
      .insert({ user_id: uid, label, rayon: rayonSaisie, poste: "Alimentation" })
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

  const deplacer = async (art, rayon) => {
    if (rayonDe(art) === rayon) return;
    setArticles((a) => a.map((x) => (x.id === art.id ? { ...x, rayon } : x)));
    const { error } = await supabase.from("vision_courses").update({ rayon, updated_at: new Date().toISOString() }).eq("id", art.id);
    if (error) {
      setErr("Déplacement non enregistré.");
      charger();
    }
  };

  // Glisser-déposer au doigt ou à la souris, depuis la poignée
  const debutGlisse = (e, art) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setGlisse({ id: art.id, label: art.label, x: e.clientX, y: e.clientY, over: null });
  };
  const enGlisse = (e) => {
    if (!glisse) return;
    const cible = document.elementFromPoint(e.clientX, e.clientY);
    const zone = cible && cible.closest ? cible.closest("[data-rayon]") : null;
    setGlisse((g) => ({ ...g, x: e.clientX, y: e.clientY, over: zone ? zone.dataset.rayon : null }));
  };
  const finGlisse = () => {
    if (!glisse) return;
    const art = articles.find((x) => x.id === glisse.id);
    if (art && glisse.over) deplacer(art, glisse.over);
    setGlisse(null);
  };


  const restants = articles.filter((x) => !x.coche);
  const coches = articles.filter((x) => x.coche);

  const ligne = (art, avecPoignee) => (
    <div key={art.id} className="courses-ligne" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0" }}>
      {avecPoignee && (
        <span
          role="button"
          aria-label={`Déplacer ${art.label}`}
          onPointerDown={(e) => debutGlisse(e, art)}
          onPointerMove={enGlisse}
          onPointerUp={finGlisse}
          onPointerCancel={() => setGlisse(null)}
          style={{ touchAction: "none", cursor: "grab", padding: "0 4px", opacity: 0.5, userSelect: "none", fontSize: 18, lineHeight: 1 }}
        >
          ⠿
        </span>
      )}
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
    <section className="courses" style={{ paddingBottom: 110, userSelect: glisse ? "none" : undefined }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button type="button" onClick={() => setVue("valider")} style={{ flex: 1 }}>Valider un ticket</button>
        <button type="button" onClick={() => setVue("historique")} style={{ flex: 1 }}>Historique</button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span>
          {coches.length} sur {articles.length} achetés
        </span>
        <button
          type="button"
          onClick={async () => {
            setArticles((a) => a.map((x) => ({ ...x, coche: false })));
            const { error } = await supabase.from("vision_courses").update({ coche: false }).eq("user_id", uid).eq("coche", true);
            if (error) {
              setErr("Remise à zéro impossible.");
              charger();
            }
          }}
          disabled={!coches.length}
        >
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
        <select aria-label="Rayon de l'article" value={rayonSaisie} onChange={(e) => setRayonSaisie(e.target.value)} style={{ width: 118 }}>
          {RAYONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
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
        RAYONS.map((r) => {
          const items = restants.filter((x) => rayonDe(x) === r);
          const survole = glisse && glisse.over === r;
          return (
            <div key={r} data-rayon={r} style={{ borderRadius: 12, background: survole ? "var(--teal-soft, #e6f5f7)" : "transparent", transition: "background .15s", minHeight: 44 }}>
              <h3 style={{ margin: "14px 0 0" }}>{r}</h3>
              {items.length ? items.map((art) => ligne(art, true)) : <div style={{ padding: "10px 0", opacity: 0.4, fontSize: 13 }}>{glisse ? "Dépose ici" : "—"}</div>}
            </div>
          );
        })}
      {coches.length > 0 && (
        <div>
          <h3>Cochés</h3>
          {coches.map((art) => ligne(art, false))}
        </div>
      )}
      {glisse && (
        <div
          style={{
            position: "fixed",
            left: glisse.x,
            top: glisse.y,
            transform: "translate(-50%, -140%)",
            pointerEvents: "none",
            background: "var(--surface, #fff)",
            boxShadow: "0 6px 20px rgba(0,0,0,.25)",
            borderRadius: 10,
            padding: "8px 12px",
            zIndex: 50,
            whiteSpace: "nowrap",
          }}
        >
          {glisse.label}
        </div>
      )}
    </section>
  );
}
