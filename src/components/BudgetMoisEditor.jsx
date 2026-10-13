import React from "react";
import { MOIS, anneeMoisDe } from "../lib/mois.js";
import { debounceSave } from "../lib/outils.js";
import { supabase } from "../lib/supabase.js";

export function BudgetMoisEditor({ moisIndex, rows, setRows, modele, verrouille }) {
  const { annee, mois } = anneeMoisDe(moisIndex),
    lignes = (rows || [])
      .filter((x) => x.annee === annee && x.mois === mois)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0)),
    [etat, setEtat] = React.useState(""),
    modeleDe = (l) =>
      (modele || []).find((b) => (l.budget_line_id ? b.id === l.budget_line_id : b.line_key === l.line_key));
  function maj(id, patch) {
    if (verrouille) return;
    setRows((p) =>
      p.map((x) =>
        x.id === id
          ? {
              ...x,
              ...patch,
            }
          : x,
      ),
    ),
      debounceSave(
        "bm:" + id,
        async () => {
          if (verrouille) return;
          setEtat("Enregistrement…");
          const { error: E } = await supabase
            .from("vision_budget_mois")
            .update({
              ...patch,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);
          setEtat(E ? "Échec : " + E.message : "✓ Enregistré"),
            setTimeout(() => setEtat((p) => (p.startsWith("✓") ? "" : p)), 2500);
        },
        500,
      );
  }
  async function initialiser() {
    setEtat("Initialisation…");
    const { error: E } = await supabase.rpc("vision_budget_mois_init", {
      p_annee: annee,
      p_mois: mois,
    });
    if (E) {
      setEtat("Échec : " + E.message);
      return;
    }
    const { data: K } = await supabase
      .from("vision_budget_mois")
      .select("*")
      .order("annee")
      .order("mois")
      .order("sort");
    setRows(K || []), setEtat("✓ Mois initialisé"), setTimeout(() => setEtat(""), 2500);
  }
  async function reinitialiser(l) {
    const m = modeleDe(l);
    if (!m) return;
    maj(l.id, {
      montant: m.montant,
      poste: m.poste,
      est_override: !1,
    });
  }
  async function ajouterPonctuelle() {
    const { data: u2 } = await supabase.auth.getUser(),
      uid = u2 && u2.user ? u2.user.id : null,
      ligne = {
        user_id: uid,
        annee,
        mois,
        budget_line_id: null,
        line_key: "ponctuel-" + Date.now(),
        kind: "charge",
        poste: "",
        montant: 0,
        sort: (lignes.length ? Math.max(...lignes.map((x) => x.sort || 0)) : 0) + 1,
        est_override: !0,
      },
      { data: K, error: E } = await supabase.from("vision_budget_mois").insert(ligne).select().single();
    E ? setEtat("Échec : " + E.message) : setRows((p) => [...p, K]);
  }
  async function supprimer(id) {
    if (!window.confirm("Supprimer cette ligne du mois ?")) return;
    const { error: E } = await supabase.from("vision_budget_mois").delete().eq("id", id);
    E ? setEtat("Échec : " + E.message) : setRows((p) => p.filter((x) => x.id !== id));
  }
  return (
    <details
      className="collapsible"
      style={{
        marginBottom: 12,
      }}
    >
      <summary>{"Ajuster le budget de " + MOIS[moisIndex]}</summary>
      <div className="inner">
        {verrouille && (
          <div className="bwarn">
            🔒 Mois clôturé — le budget ne peut plus être ajusté. Tu peux toujours saisir une dépense oubliée
            : ce sont deux choses différentes.
          </div>
        )}
        {!lignes.length ? (
          <div>
            <p className="detail">
              {verrouille
                ? "Ce mois est clôturé et n'a jamais été ajusté : il garde le modèle général, figé. C'est cohérent avec la clôture."
                : "Ce mois utilise le modèle général. Initialise-le pour pouvoir ajuster une ligne sans toucher aux autres mois."}
            </p>
            {!verrouille && (
              <button className="btn-outline btn-sm" onClick={initialiser}>
                Initialiser ce mois
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className="detail">
              Ces montants ne valent que pour ce mois. Le modèle général n'est pas modifié.
            </p>
            {lignes.map((l) => (
              <div className="brow" key={l.id}>
                <div className="bcol">
                  <input
                    className="bedit lbl"
                    value={l.poste || ""}
                    placeholder="Poste"
                    disabled={verrouille}
                    onChange={(g) =>
                      maj(l.id, {
                        poste: g.target.value,
                        est_override: !0,
                      })
                    }
                  />
                  <div className="bdet">
                    {l.kind}
                    {l.est_override ? " · " : ""}
                    {l.est_override && <span className="chip">ajusté</span>}
                  </div>
                </div>
                <input
                  className="bedit bnum"
                  inputMode="decimal"
                  value={l.montant}
                  disabled={verrouille}
                  aria-label={"Montant pour " + l.poste}
                  onChange={(g) =>
                    maj(l.id, {
                      montant: Number(String(g.target.value).replace(",", ".")) || 0,
                      est_override: !0,
                    })
                  }
                />
                {!verrouille && l.est_override && modeleDe(l) && (
                  <button
                    className="bdel"
                    title="Revenir au modèle"
                    aria-label={"Réinitialiser " + l.poste}
                    onClick={() => reinitialiser(l)}
                  >
                    ↺
                  </button>
                )}
                {!verrouille && !l.budget_line_id && (
                  <button
                    className="bdel"
                    aria-label={"Supprimer " + l.poste}
                    onClick={() => supprimer(l.id)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {!verrouille && (
              <button className="badd" onClick={ajouterPonctuelle}>
                + Ajouter une ligne ponctuelle
              </button>
            )}
          </div>
        )}
        {etat && <div className={etat.startsWith("Échec") ? "txfail" : "bok"}>{etat}</div>}
      </div>
    </details>
  );
}
