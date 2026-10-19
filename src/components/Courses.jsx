import React from "react";
import { supabase } from "../lib/supabase.js";
import { ToastAnnuler } from "./ToastAnnuler.jsx";
import { ScanTicket } from "./CoursesScan.jsx";
import { VerifierReleve } from "./VerifierReleve.jsx";

// Ordre d'affichage des rayons. Un article sans rayon va dans « Autres ».
const RAYONS = ["Légumes", "Frais", "Épicerie", "Autres"];
const rayonDe = (x) => x.rayon || "Autres";

// Rayon deviné depuis ce qui est tapé : d'abord l'historique, puis quelques mots courants.
const MOTS_RAYON = {
  "Légumes": /carott|courgett|oignon|c[ée]bett|tomat|salad|champignon|poireau|[ée]pinard|pomme de terre|patate|\bail\b|[ée]chalot|concombre|poivron|aubergine|chou|haricot|pousses?|brocoli|radis|avocat|citron|pomme|banane|fruit|l[ée]gume|herbe|persil|coriandre|gingembre/i,
  "Frais": /lait|yaourt|fromage|beurre|\b[œo]ufs?\b|tofu|jambon|poulet|poisson|saumon|cr[èe]me|steak|saucisse|viande|dinde|lardon|mozzarella|skyr|kefir|tempeh|surimi/i,
  "Épicerie": /p[âa]tes?|riz|farine|sucre|huile|caf[ée]|\bth[ée]\b|c[ée]r[ée]ales?|conserve|sauce|biscuit|chocolat|lentille|pois chiche|quinoa|semoule|vinaigre|sel\b|[ée]pice|miel|confiture|pain|muesli|flocons|noix|amande|bouillon|lait de coco/i,
};
const devinerRayon = (texte, habitudes) => {
  const t = (texte || "").trim().toLowerCase();
  if (t.length < 2) return null;
  const connu = habitudes.find((h) => h.label.toLowerCase() === t);
  if (connu && connu.rayon) return connu.rayon;
  const trouve = Object.keys(MOTS_RAYON).find((r) => MOTS_RAYON[r].test(t));
  return trouve || null;
};

// Historique des articles (Supabase) : sert aux suggestions, y compris supprimés et cochés.
const memoriser = (uid, label, rayon) =>
  supabase
    .from("vision_courses_habitudes")
    .upsert({ user_id: uid, label, rayon, derniere_utilisation: new Date().toISOString() }, { onConflict: "user_id,label" });

export function Courses({ user }) {
  const [articles, setArticles] = React.useState([]);
  const [saisie, setSaisie] = React.useState("");
  const [rayonManuel, setRayonManuel] = React.useState(null); // choix explicite ; sinon rayon deviné
  const champ = React.useRef(null);
  const [err, setErr] = React.useState("");
  const [charge, setCharge] = React.useState(true);
  const [vue, setVue] = React.useState("liste"); // liste | valider | historique
  const [version, setVersion] = React.useState(0);
  const [glisse, setGlisse] = React.useState(null); // { id, label, x, y, over }
  const [toast, setToast] = React.useState(null);
  const [habitudes, setHabitudes] = React.useState([]); // { label, rayon }
  const aSupprimer = React.useRef(null); // suppression en attente (annulable)
  const uid = user && user.id;

  const charger = React.useCallback(async () => {
    if (!uid) return;
    const [liste, hab] = await Promise.all([
      supabase.from("vision_courses").select("id, label, rayon, coche, created_at").eq("user_id", uid).order("created_at", { ascending: true }),
      supabase.from("vision_courses_habitudes").select("label, rayon").eq("user_id", uid).order("derniere_utilisation", { ascending: false }).limit(40),
    ]);
    if (liste.error) setErr("Impossible de charger la liste.");
    else setArticles(liste.data || []);
    if (!hab.error) setHabitudes(hab.data || []);
    setCharge(false);
  }, [uid]);

  React.useEffect(() => {
    charger();
  }, [charger]);

  const creer = async (label, rayon) => {
    if (!label || !uid) return;
    const { data, error } = await supabase
      .from("vision_courses")
      .insert({ user_id: uid, label, rayon, poste: "Alimentation" })
      .select()
      .single();
    if (error) return setErr("Article non ajouté.");
    setArticles((a) => [...a, data]);
    memoriser(uid, label, rayon);
    setHabitudes((h) => [{ label, rayon }, ...h.filter((x) => x.label !== label)]);
  };

  const ajouter = async (e) => {
    e.preventDefault();
    const label = saisie.trim();
    if (!label) return;
    const rayon = rayonManuel || devinerRayon(label, habitudes) || "Autres";
    setSaisie("");
    setRayonManuel(null);
    creer(label, rayon);
    if (champ.current) champ.current.focus();
  };

  // La suppression part vraiment en base à la fermeture du message « Annuler »
  const validerSuppression = async () => {
    const art = aSupprimer.current;
    if (!art) return;
    aSupprimer.current = null;
    memoriser(uid, art.label, rayonDe(art));
    setHabitudes((h) => [{ label: art.label, rayon: rayonDe(art) }, ...h.filter((x) => x.label !== art.label)]);
    const { error } = await supabase.from("vision_courses").delete().eq("id", art.id);
    if (error) {
      setErr("Suppression impossible.");
      charger();
    }
  };

  const changerVue = (v) => {
    setToast(null);
    validerSuppression();
    setVue(v);
  };

  const basculer = async (art) => {
    const coche = !art.coche;
    setArticles((a) => a.map((x) => (x.id === art.id ? { ...x, coche } : x)));
    if (coche) {
      memoriser(uid, art.label, rayonDe(art));
      setHabitudes((h) => [{ label: art.label, rayon: rayonDe(art) }, ...h.filter((x) => x.label !== art.label)]);
    }
    const { error } = await supabase.from("vision_courses").update({ coche, updated_at: new Date().toISOString() }).eq("id", art.id);
    if (error) {
      setErr("Modification non enregistrée.");
      charger();
    }
  };

  const fermerToast = () => {
    setToast(null);
    validerSuppression();
  };

  const supprimer = (art) => {
    validerSuppression();
    aSupprimer.current = art;
    setArticles((a) => a.filter((x) => x.id !== art.id));
    setToast({
      msg: `« ${art.label} » retiré`,
      annuler: () => {
        aSupprimer.current = null;
        setArticles((a) => [...a, art].sort((x, y) => (x.created_at > y.created_at ? 1 : -1)));
      },
    });
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


  const rayonSaisie = rayonManuel || devinerRayon(saisie, habitudes) || "Autres";
  const restants = articles.filter((x) => !x.coche);
  const coches = articles.filter((x) => x.coche);
  const suggestions = habitudes
    .filter((h) => !articles.some((x) => x.label.toLowerCase() === h.label.toLowerCase()))
    .slice(0, 8)
    .map((h) => [h.label, h.rayon]);

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


  return (
    <section className="courses" style={{ paddingBottom: 110, userSelect: glisse ? "none" : undefined, display: "grid", gap: 14 }}>
      <ScanTicket user={user} onFait={() => setVersion((v) => v + 1)} />
      <VerifierReleve user={user} />
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, marginBottom: 6 }}>
          <span>
            <b>{coches.length}</b> / {articles.length} achetés
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
            style={{ border: 0, background: "transparent", color: "var(--teal, #0e9fb2)", fontSize: 13, fontWeight: 600, padding: 0 }}
          >
            Tout décocher
          </button>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: "var(--line, #dbeaec)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${articles.length ? (coches.length / articles.length) * 100 : 0}%`, background: "var(--teal, #0e9fb2)", transition: "width .3s" }} />
        </div>
      </div>
      <form onSubmit={ajouter} style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input ref={champ} type="text" value={saisie} onChange={(e) => setSaisie(e.target.value)} placeholder="Ajouter un article" aria-label="Ajouter un article" enterKeyHint="done" autoComplete="off" style={{ flex: 1, minWidth: 0 }} />
          <button type="submit" aria-label="Ajouter" style={{ width: 48 }}>
            +
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {RAYONS.map((r) => {
            const on = rayonSaisie === r;
            return (
              <button
                key={r}
                type="button"
                aria-pressed={on}
                onClick={() => setRayonManuel(rayonManuel === r ? null : r)}
                style={{ fontSize: 13, padding: "6px 12px", borderRadius: 99, border: `1px solid ${on ? "var(--teal, #0e9fb2)" : "var(--line, #dbeaec)"}`, background: on ? "var(--teal-soft, #e6f5f7)" : "transparent", color: on ? "var(--teal-dark, #0a7b8a)" : "inherit", fontWeight: on ? 700 : 500 }}
              >
                {r}
              </button>
            );
          })}
        </div>
      </form>
      {suggestions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {suggestions.map(([label, rayon]) => (
            <button
              key={label}
              type="button"
              onClick={() => creer(label, rayon)}
              style={{ fontSize: 13, borderRadius: 99, padding: "4px 10px", border: "1px solid var(--line, #dbeaec)", background: "transparent" }}
            >
              + {label}
            </button>
          ))}
          {suggestions.length > 1 && (
            <button
              type="button"
              onClick={() => suggestions.forEach(([l, r]) => creer(l, r))}
              style={{ fontSize: 13, borderRadius: 99, padding: "4px 10px", border: "1px solid var(--teal, #0e9fb2)", background: "transparent", color: "var(--teal, #0e9fb2)" }}
            >
              Tout ajouter
            </button>
          )}
        </div>
      )}
      {err && (
        <p role="alert" style={{ color: "var(--red)", margin: 0 }}>
          {err}
        </p>
      )}
      {!charge &&
        RAYONS.map((r) => {
          const items = articles
            .filter((x) => rayonDe(x) === r)
            .sort((x, y) => Number(x.coche) - Number(y.coche));
          const survole = glisse && glisse.over === r;
          return (
            <div
              key={r}
              data-rayon={r}
              style={{ borderRadius: 16, padding: "4px 14px 8px", border: "1px solid var(--line, #dbeaec)", background: survole ? "var(--teal-soft, #e6f5f7)" : "var(--surface, transparent)", transition: "background .15s" }}
            >
              <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.6, padding: "10px 0 2px" }}>{r}</div>
              {items.length ? items.map((art) => ligne(art, !art.coche)) : <div style={{ padding: "10px 0", opacity: 0.4, fontSize: 13 }}>{glisse ? "Dépose ici" : "—"}</div>}
            </div>
          );
        })}
      <ToastAnnuler toast={toast} onFermer={fermerToast} />
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
