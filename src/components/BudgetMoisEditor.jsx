import React from "react";
import { MOIS, anneeMoisDe } from "../lib/mois.js";
import { supabase } from "../lib/supabase.js";

// Postes sans suggestion (dépenses trop irrégulières d'un mois à l'autre).
const SANS_SUGGESTION = ["c_plaisir"];

// Suggestion d'un poste : moyenne des 3 derniers mois passés qui ont des dépenses saisies
// (un mois sans dépense sur ce poste compte 0), arrondie aux 5 € supérieurs.
function suggestion(ligne, transactions, moisIndex) {
  if (ligne.kind !== "charge" || !ligne.budget_line_id || SANS_SUGGESTION.includes(ligne.line_key))
    return null;
  const faits = (transactions || []).filter((t) => t.statut !== "prevu" && Number(t.mois_index) < moisIndex);
  const moisAvecDonnees = [...new Set(faits.map((t) => Number(t.mois_index)))]
    .sort((a, b) => b - a)
    .slice(0, 3);
  if (!moisAvecDonnees.length) return null;
  const total = faits
    .filter(
      (t) => t.budget_line_id === ligne.budget_line_id && moisAvecDonnees.includes(Number(t.mois_index)),
    )
    .reduce((s, t) => s + (t.type === "remboursement" ? -1 : 1) * Number(t.montant), 0);
  const moyenne = total / moisAvecDonnees.length;
  return moyenne > 0 ? Math.ceil(moyenne / 5) * 5 : null;
}

export function BudgetMoisEditor({ moisIndex, rows, setRows, modele, verrouille, transactions }) {
  const { annee, mois } = anneeMoisDe(moisIndex),
    lignes = (rows || [])
      .filter((x) => x.annee === annee && x.mois === mois)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0)),
    [etat, setEtat] = React.useState(""),
    modeleDe = (l) =>
      (modele || []).find((b) => (l.budget_line_id ? b.id === l.budget_line_id : b.line_key === l.line_key));
  // Enregistrement automatique (0,5 s après la dernière frappe) ; le bouton « Enregistrer »
  // envoie tout de suite ce qui est encore en attente.
  const attente = React.useRef({}); // id -> modifications pas encore envoyées
  const minuteurs = React.useRef({});
  const [aEnregistrer, setAEnregistrer] = React.useState(0);
  const vue = (l) => l;
  async function envoyer(id) {
    clearTimeout(minuteurs.current[id]);
    const patch = attente.current[id];
    if (!patch) return true;
    delete attente.current[id];
    setAEnregistrer(Object.keys(attente.current).length);
    setEtat("Enregistrement…");
    const { error: E } = await supabase
      .from("vision_budget_mois")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (E) {
      attente.current[id] = { ...patch, ...(attente.current[id] || {}) };
      setAEnregistrer(Object.keys(attente.current).length);
      setEtat("Échec : " + E.message);
      return false;
    }
    if (!Object.keys(attente.current).length) {
      setEtat("✓ Enregistré");
      setTimeout(() => setEtat((p) => (p.startsWith("✓") ? "" : p)), 2500);
    }
    return true;
  }
  function maj(id, patch) {
    if (verrouille) return;
    setRows((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    attente.current[id] = { ...(attente.current[id] || {}), ...patch };
    setAEnregistrer(Object.keys(attente.current).length);
    clearTimeout(minuteurs.current[id]);
    minuteurs.current[id] = setTimeout(() => envoyer(id), 500);
  }
  async function enregistrer() {
    for (const id of Object.keys(attente.current)) if (!(await envoyer(id))) return;
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
            {!verrouille && lignes.some((l) => suggestion(l, transactions, moisIndex) != null) && (
              <button
                className="btn-outline btn-sm"
                style={{ marginBottom: 8 }}
                onClick={() =>
                  lignes.forEach((l) => {
                    const s = suggestion(l, transactions, moisIndex);
                    if (s != null && s !== Number(vue(l).montant))
                      maj(l.id, { montant: s, est_override: !0 });
                  })
                }
              >
                Appliquer toutes les suggestions
              </button>
            )}
            {lignes.map(vue).map((l) => (
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
                    {(() => {
                      const s = verrouille ? null : suggestion(l, transactions, moisIndex);
                      return s != null && s !== Number(l.montant) ? (
                        <button
                          className="chip"
                          style={{ border: "none", marginRight: 6, cursor: "pointer" }}
                          aria-label={"Appliquer la suggestion " + s + " € pour " + l.poste}
                          onClick={() => maj(l.id, { montant: s, est_override: !0 })}
                        >
                          💡 {s} €
                        </button>
                      ) : null;
                    })()}
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
            {!verrouille && (
              <button
                className="btn"
                style={{ width: "100%", marginTop: 10 }}
                disabled={!aEnregistrer}
                onClick={enregistrer}
              >
                {aEnregistrer ? "Enregistrer" : "✓ Tout est enregistré"}
              </button>
            )}
          </div>
        )}
        {etat && <div className={etat.startsWith("Échec") ? "txfail" : "bok"}>{etat}</div>}
      </div>
    </details>
  );
}
