import React from "react";
import { ImportReleve } from "./components/ImportReleve.jsx";
import { MODE_PARTAGE, ONGLETS, ONGLETS_VERROUILLES, rienFaire } from "./app/onglets.jsx";
import { IMG_FOND } from "./assets/images.js";
import { AutresOutils } from "./components/AutresOutils.jsx";
import { BudgetMensuel } from "./components/BudgetMensuel.jsx";
import { Connexion } from "./components/Connexion.jsx";
import { Formations } from "./components/Formations.jsx";
import { Historique } from "./components/Historique.jsx";
import { NavBas } from "./components/NavBas.jsx";
import { Planning } from "./components/Planning.jsx";
import { SaisieRapide } from "./components/SaisieRapide.jsx";
import { SportPage } from "./components/SportPage.jsx";
import { SuiviPage } from "./components/SuiviPage.jsx";
import { Reglages } from "./components/Reglages.jsx";
import { affichageDepuisParams } from "./lib/affichage.js";
import { Verrou } from "./components/Verrou.jsx";
import { Graphiques } from "./components/graphiques/Graphiques.jsx";
import { Accueil } from "./components/kanban/Accueil.jsx";
import { DevoirsPage, hwkSetStatus } from "./components/kanban/DevoirsPage.jsx";
import { PiecesPage } from "./components/kanban/PiecesPage.jsx";
import { BUDGET_DEFAUT, PARAMS_DEFAUT, VOYAGES_DEFAUT, contenuDefauts } from "./data/contenu.js";
import { alerteSalaire } from "./lib/alerteSalaire.js";
import {
  VISION_DEFICITS,
  budgetDuMois,
  deficitsParMois,
  itemCompte,
  ligneBudgetId,
  set_VISION_BUDGET,
  set_VISION_DEFICITS,
} from "./lib/calculs.js";
import { EP_AUTO_DEBUT, EP_AUTO_NOTE, epAutoCle, jourEpargneAuto } from "./lib/epargneAuto.js";
import { ToastAnnuler } from "./components/ToastAnnuler.jsx";
import { activerNotifications, etatNotifications } from "./lib/notifications.js";
import { creerActions, messageErreur, recurrentesACreer } from "./app/actions.js";
import { set_ALERTE_SEUIL } from "./lib/alerteSalaire.js";
import { set_ICONES } from "./lib/format.js";
import { num, param } from "./lib/format.js";
import { MOIS, anneeMoisDe, isoAujourdhui, moisDepuisAncre, moisNow } from "./lib/mois.js";
import { debounceSave } from "./lib/outils.js";
import { supabase, supabaseConfigured } from "./lib/supabase.js";

export function App() {
  const [t, e] = React.useState(null),
    [r, n] = React.useState(!1),
    [s, i] = React.useState(() => {
      try {
        const q = new URLSearchParams(location.search).get("onglet");
        return q && ONGLETS.some((x) => x.id === q) ? q : "apercu";
      } catch (e) {
        return "apercu";
      }
    }),
    [o, a] = React.useState({}),
    [l, u] = React.useState(null),
    [c, d] = React.useState([]),
    [p, m] = React.useState([]),
    [v, k] = React.useState(!1),
    [vi, mi] = React.useState([]),
    [cl, scl] = React.useState([]),
    [aud, saud] = React.useState([]),
    [sp, ssp] = React.useState([]),
    [sv, ssv] = React.useState([]),
    [hwRows, setHwRows] = React.useState([]),
    [hwLoading, setHwLoading] = React.useState(!0),
    [hwErr, setHwErr] = React.useState(""),
    [ct, sct] = React.useState([]),
    [tx, stx] = React.useState([]),
    [bm, sbm] = React.useState([]),
    [poches, setPoches] = React.useState([]),
    [saisieOuverte, setSaisieOuverte] = React.useState(!1),
    [txEdit, setTxEdit] = React.useState(null);
  const [taches, setTaches] = React.useState([]);
  const [imports, setImports] = React.useState([]),
    [reglesImport, setReglesImport] = React.useState([]),
    [importOuvert, setImportOuvert] = React.useState(false);
  const [pe, setPe] = React.useState({});
  const [recurrentes, setRecurrentes] = React.useState([]),
    [seances, setSeances] = React.useState([]),
    [toast, setToast] = React.useState(null),
    [recOk, setRecOk] = React.useState(!1),
    [etatNotifs, setEtatNotifs] = React.useState(null),
    [pea, setPea] = React.useState([]);
  React.useEffect(() => affichageDepuisParams(c), [c]);
  React.useEffect(() => {
    MODE_PARTAGE ||
      etatNotifications()
        .then(setEtatNotifs)
        .catch(() => {});
  }, []);
  const recRef = React.useRef(!1);
  const [txOk, setTxOk] = React.useState(!1);
  const [tachesOk, setTachesOk] = React.useState(!1);
  const alerteRef = React.useRef({});
  const epAutoRef = React.useRef(!1);
  const ctRef = React.useRef([]);
  ctRef.current = ct;
  const clotRef = React.useRef([]);
  clotRef.current = cl;
  const pochesRef = React.useRef([]);
  pochesRef.current = poches;
  React.useEffect(() => {
    if (MODE_PARTAGE) {
      n(!0);
      return;
    }
    supabase.auth
      .getSession()
      .then(({ data: K }) => e((K == null ? void 0 : K.session) ?? null))
      .catch(() => {})
      .finally(() => n(!0));
    const { data: N } = supabase.auth.onAuthStateChange((K, H) => e(H));
    return () => N.subscription.unsubscribe();
  }, []),
    React.useEffect(() => {
      if (MODE_PARTAGE) {
        u(
          BUDGET_DEFAUT.map((K, H) => ({
            ...K,
            id: "d" + H,
          })),
        ),
          d(
            PARAMS_DEFAUT.map((K) => ({
              ...K,
            })),
          ),
          m(
            VOYAGES_DEFAUT.map((K, H) => ({
              ...K,
              id: "d" + H,
            })),
          ),
          a({});
        return;
      }
      if (!t) return;
      const N = t.user.id;
      supabase
        .from("vision_progress")
        .select("item_key, done, etape")
        .then(({ data: K }) => {
          const H = {},
            P = {};
          (K || []).forEach((A) => {
            (H[A.item_key] = A.done), A.etape && (P[A.item_key] = A.etape);
          }),
            a(H),
            setPe(P);
        }),
        (async () => {
          let { data: K } = await supabase.from("vision_budget").select("*").order("sort");
          (!K || K.length === 0) &&
            (await supabase.from("vision_budget").upsert(
              BUDGET_DEFAUT.map((H) => ({
                ...H,
                user_id: N,
              })),
              {
                onConflict: "user_id,line_key",
              },
            ),
            (K = (await supabase.from("vision_budget").select("*").order("sort")).data)),
            u(K || []);
        })(),
        (async () => {
          let { data: K } = await supabase.from("vision_params").select("*");
          (!K || K.length === 0) &&
            (await supabase.from("vision_params").upsert(
              PARAMS_DEFAUT.map((H) => ({
                ...H,
                user_id: N,
              })),
              {
                onConflict: "user_id,param_key",
              },
            ),
            (K = (await supabase.from("vision_params").select("*")).data)),
            d(K || []);
        })(),
        async () => {
          let { data: K } = await supabase
            .from("vision_voyages")
            .select("*")
            .order("mois_index")
            .order("sort");
          (!K || K.length === 0) &&
            (await supabase.from("vision_voyages").upsert(
              VOYAGES_DEFAUT.map((H) => ({
                ...H,
                user_id: N,
              })),
              {
                onConflict: "user_id,line_key",
              },
            ),
            (K = (await supabase.from("vision_voyages").select("*").order("mois_index").order("sort")).data)),
            m(K || []);
        },
        (async () => {
          let { data: K } = await supabase.from("vision_contenu").select("*").order("type").order("sort");
          (!K || K.length === 0) &&
            (await supabase.from("vision_contenu").upsert(contenuDefauts(N), {
              onConflict: "user_id,type,item_key",
            }),
            (K = (await supabase.from("vision_contenu").select("*").order("type").order("sort")).data)),
            sct(K || []);
        })(),
        (async () => {
          const { data: K } = await supabase
            .from("vision_items")
            .select("*")
            .order("mois_index")
            .order("sort");
          mi(K || []);
        })(),
        (async () => {
          const { data: K, error: E } = await supabase.from("vision_homework").select("*").order("deadline", {
            ascending: !0,
          });
          E ? setHwErr(E.message) : setHwRows(K || []), setHwLoading(!1);
        })(),
        (async () => {
          const { data: K } = await supabase.from("vision_cloture").select("*").order("mois_index");
          scl(K || []);
        })(),
        (async () => {
          const { data: K } = await supabase
            .from("vision_audit")
            .select("*")
            .order("changed_at", {
              ascending: !1,
            })
            .limit(400);
          saud(K || []);
        })(),
        (async () => {
          // Initialise les 12 prochains mois une fois pour toutes, puis relit.
          const base = moisNow();
          for (let q = 0; q < 12; q++) {
            const am = anneeMoisDe(base + q);
            try {
              const { error: E } = await supabase.rpc("vision_budget_mois_init", {
                p_annee: am.annee,
                p_mois: am.mois,
              });
              E &&
                console.warn("vision_budget_mois_init " + am.annee + "/" + (am.mois + 1) + " :", E.message);
            } catch (E) {
              console.warn(
                "vision_budget_mois_init " + am.annee + "/" + (am.mois + 1) + " :",
                E && E.message,
              );
            }
          }
          const { data: K } = await supabase
            .from("vision_budget_mois")
            .select("*")
            .order("annee")
            .order("mois")
            .order("sort");
          sbm(K || []);
        })(),
        (async () => {
          const { data: K } = await supabase.from("vision_poches").select("*").order("sort");
          setPoches(K || []);
        })(),
        (async () => {
          const { data: K } = await supabase
            .from("vision_taches")
            .select("*")
            .order("sort")
            .order("created_at");
          setTaches(K || []), K && setTachesOk(!0);
        })(),
        (async () => {
          const { data: K } = await supabase.from("vision_imports").select("*").order("created_at");
          setImports(K || []);
        })(),
        (async () => {
          const { data: K } = await supabase.from("vision_import_regles").select("*").order("sort");
          setReglesImport(K || []);
        })(),
        (async () => {
          const { data: K } = await supabase.from("vision_recurrentes").select("*").order("sort");
          setRecurrentes(K || []), K && setRecOk(!0);
        })(),
        (async () => {
          const { data: K } = await supabase.from("vision_seances").select("*").order("date");
          setSeances(K || []);
        })(),
        (async () => {
          const { data: K } = await supabase.from("vision_pea").select("*").order("date");
          setPea(K || []);
        })(),
        (async () => {
          const { data: K } = await supabase
            .from("vision_transactions")
            .select("*")
            .order("date_depense", {
              ascending: !1,
            })
            .order("created_at", {
              ascending: !1,
            });
          stx(K || []), K && setTxOk(!0);
        })(),
        (async () => {
          const { data: K } = await supabase.from("vision_spend").select("*");
          ssp(K || []);
        })(),
        (async () => {
          const { data: K } = await supabase.from("vision_savings").select("*").order("sort");
          ssv(K || []);
        })();
    }, [t]);
  function ctEdit(id, patch) {
    sct((p) =>
      p.map((x) =>
        x.id === id
          ? {
              ...x,
              ...patch,
            }
          : x,
      ),
    ),
      debounceSave("ct:" + id, () => ctSave(id));
  }
  async function ctSave(id) {
    const row = ctRef.current.find((x) => x.id === id);
    if (!row) return;
    await supabase
      .from("vision_contenu")
      .update({
        titre: row.titre,
        detail: row.detail,
        extra: row.extra,
        groupe: row.groupe,
        complement: row.complement,
        date_iso: row.date_iso,
        sort: row.sort,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
  }
  async function ctAdd(type, groupe) {
    const { data: u2 } = await supabase.auth.getUser(),
      uid = u2 && u2.user ? u2.user.id : null,
      rows = ctRef.current.filter((x) => x.type === type),
      ligne = {
        user_id: uid,
        type,
        item_key: type + ":" + Date.now(),
        groupe: groupe || (rows.length ? rows[rows.length - 1].groupe : null),
        titre: "",
        sort: rows.length ? Math.max(...rows.map((x) => x.sort || 0)) + 1 : 0,
      },
      { data: nouveau, error: E0 } = await supabase.from("vision_contenu").insert(ligne).select().single();
    let E = E0;
    if (nouveau) return sct((p) => [...p, nouveau]);
    // L'index unique sur le rang peut refuser l'ajout si deux onglets
    // calculent le même rang en même temps : on réessaie une fois plus loin.
    if (E && E.code === "23505") {
      // On relit le rang maximum en base plutôt que d'incrémenter le nôtre :
      // un autre onglet a pu insérer entre-temps et prendre le suivant.
      const { data: dernier } = await supabase
          .from("vision_contenu")
          .select("sort")
          .eq("type", type)
          .order("sort", {
            ascending: !1,
          })
          .limit(1),
        max = dernier && dernier.length ? num(dernier[0].sort) : num(ligne.sort);
      const second = {
          ...ligne,
          item_key: type + ":" + Date.now() + "-2",
          sort: max + 1,
        },
        { data: n2, error: E2 } = await supabase.from("vision_contenu").insert(second).select().single();
      if (n2) return sct((p) => [...p, n2]);
      E = E2;
    }
    E &&
      (console.warn("ajout impossible :", E.message),
      window.alert("Impossible d'ajouter la ligne : " + E.message));
  }
  // Monter / descendre une ligne. Le rang est unique par type ET par groupe :
  // une pièce se déplace dans son groupe, pas dans toute la liste.
  async function ctMove(id, type, sens) {
    const ligne = ctRef.current.find((x) => x.id === id);
    if (!ligne) return;
    // `groupe` ne veut pas dire la même chose selon le type : un vrai
    // regroupement pour les pièces et les notes, un simple drapeau pour les
    // jours (« fixe ») ou une catégorie pour les cours, qui s'affichent en
    // une seule liste. On ne restreint donc au groupe que là où ça a un sens.
    const parGroupe = type === "piece" || type === "note",
      liste = ctRef.current
        .filter((x) => x.type === type && (!parGroupe || (x.groupe || null) === (ligne.groupe || null)))
        .sort((a, b) => (a.sort || 0) - (b.sort || 0)),
      i = liste.findIndex((x) => x.id === id),
      j = i + sens;
    if (i < 0 || j < 0 || j >= liste.length) return;
    const a = liste[i],
      b = liste[j],
      sa = a.sort || 0,
      sb = b.sort || 0;
    sct((p) =>
      p.map((x) =>
        x.id === a.id
          ? {
              ...x,
              sort: sb,
            }
          : x.id === b.id
            ? {
                ...x,
                sort: sa,
              }
            : x,
      ),
    );
    // Un seul appel : les deux écritures sont dans la même transaction,
    // donc pas de rangs en double si la seconde échoue.
    const { error: E } = await supabase.rpc("vision_swap_sort", {
      p_a: a.id,
      p_b: b.id,
    });
    E &&
      (console.warn("vision_swap_sort :", E.message),
      sct((p) =>
        p.map((x) =>
          x.id === a.id
            ? {
                ...x,
                sort: sa,
              }
            : x.id === b.id
              ? {
                  ...x,
                  sort: sb,
                }
              : x,
        ),
      ));
  }

  // Poches : création, renommage, seuil, note, archivage. Une poche archivée
  // reste comptée tant qu'elle a des postes actifs (voir pocheComptee).
  function pocheEdit(id, patch) {
    setPoches((p) =>
      p.map((x) =>
        x.id === id
          ? {
              ...x,
              ...patch,
            }
          : x,
      ),
    ),
      debounceSave("poche:" + id, () => pocheSave(id));
  }
  async function pocheSave(id) {
    const r = pochesRef.current.find((x) => x.id === id);
    if (!r) return;
    await supabase
      .from("vision_poches")
      .update({
        label: r.label,
        seuil_bas: r.seuil_bas === "" || r.seuil_bas == null ? null : Number(r.seuil_bas),
        note: r.note,
        statut: r.statut,
        sort: r.sort,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
  }
  async function pocheAdd() {
    const nom = window.prompt("Nom de la nouvelle poche (ex. Permis, Mariage)", "");
    if (!nom || !nom.trim()) return;
    const cle = nom
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    if (!cle) return window.alert("Ce nom ne donne pas d'identifiant utilisable.");
    if (pochesRef.current.some((x) => x.cle === cle)) return window.alert("Une poche porte déjà ce nom.");
    const { data: u2 } = await supabase.auth.getUser(),
      uid = u2 && u2.user ? u2.user.id : null,
      { data: K, error: E } = await supabase
        .from("vision_poches")
        .insert({
          user_id: uid,
          cle,
          label: nom.trim(),
          regime: "postes_dates",
          seuil_bas: 200,
          note: "",
          sort: Math.max(0, ...pochesRef.current.map((x) => x.sort || 0)) + 1,
        })
        .select()
        .single();
    E ? window.alert("Création impossible : " + E.message) : K && setPoches((p) => [...p, K]);
  }
  async function pocheDel(p) {
    const postes = (vi || []).filter((x) => x.pocket === p.cle);
    if (postes.length) {
      const actifs = postes.filter(itemCompte).length;
      return window.alert(
        "« " +
          p.label +
          " » contient encore " +
          postes.length +
          " poste(s)" +
          (actifs
            ? ", dont " + actifs + " actif(s)"
            : ", tous abandonnés ou reportés — ils comptent quand même ici") +
          ". Supprime-les d'abord, sinon ils resteraient rattachés à une poche qui n'existe plus. Pour la retirer de l'affichage sans toucher aux postes, archive-la.",
      );
    }
    if (!window.confirm("Supprimer la poche « " + p.label + " » ?")) return;
    const { error: E } = await supabase.from("vision_poches").delete().eq("id", p.id);
    E
      ? window.alert("Suppression impossible : " + E.message)
      : setPoches((x) => x.filter((y) => y.id !== p.id));
  }
  // Contenu (cours, étapes, fiche d'adhésion) : écriture immédiate, erreur affichée, « Annuler ».
  async function ctMaj(id, patch, msg) {
    const avant = ctRef.current.find((x) => x.id === id);
    const ecrire = async (p2) => {
      const { data: K, error: E } = await supabase
        .from("vision_contenu")
        .update({ ...p2, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (E) throw E;
      sct((p) => p.map((x) => (x.id === id ? K : x)));
    };
    await ecrire(patch);
    avant &&
      notifier(msg || "Enregistré", () =>
        ecrire(Object.fromEntries(Object.keys(patch).map((k) => [k, avant[k] ?? null]))),
      );
  }
  async function ctCreer(type, groupe, champs, msg) {
    const rows = ctRef.current.filter((x) => x.type === type && (x.groupe || null) === (groupe || null)),
      ligne = {
        user_id: t.user.id,
        type,
        groupe: groupe || null,
        item_key: type + ":" + Date.now(),
        sort: (rows.length ? Math.max(...rows.map((x) => x.sort || 0)) : 0) + 1,
        ...champs,
      };
    const { data: K, error: E } = await supabase.from("vision_contenu").insert(ligne).select().single();
    if (E) throw E;
    sct((p) => [...p, K]);
    notifier(msg || "Ajouté", async () => {
      const { error: E2 } = await supabase.from("vision_contenu").delete().eq("id", K.id);
      if (E2) throw E2;
      sct((p) => p.filter((x) => x.id !== K.id));
    });
    return K;
  }
  async function ctSupprimer(id, msg) {
    const avant = ctRef.current.find((x) => x.id === id);
    const { error: E } = await supabase.from("vision_contenu").delete().eq("id", id);
    if (E) throw E;
    sct((p) => p.filter((x) => x.id !== id));
    avant &&
      notifier(msg || "Supprimé", async () => {
        const { data: K, error: E2 } = await supabase
          .from("vision_contenu")
          .insert({ ...avant })
          .select()
          .single();
        if (E2) throw E2;
        sct((p) => [...p, K]);
      });
  }
  // Échéances d'adhésion / enveloppe (vision_items) depuis les écrans.
  async function itemMaj(id, patch) {
    const avant = vi.find((x) => x.id === id);
    const ecrire = async (p2) => {
      const { data: K, error: E } = await supabase
        .from("vision_items")
        .update(p2)
        .eq("id", id)
        .select()
        .single();
      if (E) throw E;
      mi((p) => p.map((x) => (x.id === id ? K : x)));
    };
    await ecrire(patch);
    avant &&
      notifier("Enregistré", () =>
        ecrire(Object.fromEntries(Object.keys(patch).map((k) => [k, avant[k] ?? null]))),
      );
  }
  async function ctDel(id) {
    if (!window.confirm("Supprimer cette ligne ?")) return;
    sct((p) => p.filter((x) => x.id !== id)), await supabase.from("vision_contenu").delete().eq("id", id);
  }
  async function x(N) {
    if (MODE_PARTAGE) return;
    const K = !o[N];
    a((A) => ({
      ...A,
      [N]: K,
    }));
    const { error: H } = await supabase.from("vision_progress").upsert(
      {
        item_key: N,
        done: K,
      },
      {
        onConflict: "user_id,item_key",
      },
    );
    H &&
      a((A) => ({
        ...A,
        [N]: !K,
      }));
  }
  const y = (N, K) =>
    u((H) =>
      H.map((A) =>
        A.id === N
          ? {
              ...A,
              ...K,
            }
          : A,
      ),
    );
  async function f(N) {
    const K = l.find((H) => H.id === N);
    K &&
      (await supabase
        .from("vision_budget")
        .update({
          poste: K.poste,
          montant: Number(K.montant) || 0,
        })
        .eq("id", N));
  }
  async function g(N) {
    const K = "x_" + Math.random().toString(36).slice(2, 10),
      H = Math.max(0, ...l.map((I) => I.sort || 0)) + 1,
      A = {
        user_id: t.user.id,
        line_key: K,
        kind: N,
        poste: "",
        detail: "",
        montant: 0,
        sort: H,
      },
      { data: E } = await supabase.from("vision_budget").insert(A).select().single();
    E && u((I) => [...I, E]);
  }
  async function S(N) {
    u((K) => K.filter((H) => H.id !== N)), await supabase.from("vision_budget").delete().eq("id", N);
  }
  const b = (N, K) =>
    d((H) =>
      H.some((A) => A.param_key === N)
        ? H.map((A) =>
            A.param_key === N
              ? {
                  ...A,
                  montant: K,
                }
              : A,
          )
        : [
            ...H,
            {
              param_key: N,
              montant: K,
            },
          ],
    );
  async function w(N, K) {
    await supabase.from("vision_params").upsert(
      {
        user_id: t.user.id,
        param_key: N,
        montant: Number(K) || 0,
      },
      {
        onConflict: "user_id,param_key",
      },
    );
  }
  const j = (N, K) =>
    m((H) =>
      H.map((A) =>
        A.id === N
          ? {
              ...A,
              ...K,
            }
          : A,
      ),
    );
  async function P(N, K) {
    const H = {
      ...(p.find((A) => A.id === N) || {}),
      ...(K || {}),
    };
    await supabase
      .from("vision_voyages")
      .update({
        label: H.label,
        montant: Number(H.montant) || 0,
        mois_index: Number(H.mois_index) || 0,
      })
      .eq("id", N);
  }
  async function q() {
    const N = "v_" + Math.random().toString(36).slice(2, 10),
      K = Math.max(0, ...p.map((E) => E.sort || 0)) + 1,
      H = {
        user_id: t.user.id,
        line_key: N,
        mois_index: 1,
        label: "",
        montant: 0,
        poche_cle: "vacances",
        sort: K,
      },
      { data: A } = await supabase.from("vision_voyages").insert(H).select().single();
    A && m((E) => [...E, A]);
  }
  async function V(N) {
    m((K) => K.filter((H) => H.id !== N)), await supabase.from("vision_voyages").delete().eq("id", N);
  }
  const itemLocal = (N, K) =>
    mi((H) =>
      H.map((A) =>
        A.id === N
          ? {
              ...A,
              ...K,
            }
          : A,
      ),
    );
  async function itemSave(N, K) {
    await supabase.from("vision_items").update(K).eq("id", N);
  }
  async function itemAdd(N) {
    const K = {
        user_id: t.user.id,
        pocket: N,
        label: "",
        montant_prevu: 0,
        montant_reel: null,
        mois_index: moisNow(),
        paid: !1,
        sort: Math.max(0, ...vi.filter((A) => A.pocket === N).map((A) => A.sort || 0)) + 1,
      },
      { data: H } = await supabase.from("vision_items").insert(K).select().single();
    H && mi((A) => [...A, H]);
  }
  // Épargne programmée : le 3 de chaque mois (à partir de novembre 2026),
  // chaque ligne d'épargne du budget du mois est marquée « versée » si rien
  // n'est encore saisi pour elle ce mois-là. La base est relue juste avant
  // d'écrire : jamais de doublon, même avec deux onglets ouverts.
  React.useEffect(() => {
    if (MODE_PARTAGE || !t || !l || !txOk || !c.length || epAutoRef.current) return;
    epAutoRef.current = !0;
    (async () => {
      const auj = new Date(),
        EP_AUTO_JOUR = jourEpargneAuto(c),
        dernier = moisDepuisAncre(auj) - (auj.getDate() >= EP_AUTO_JOUR ? 0 : 1);
      if (dernier < EP_AUTO_DEBUT) return;
      const { data: deja, error: E0 } = await supabase
        .from("vision_transactions")
        .select("budget_line_id, mois_index")
        .gte("mois_index", EP_AUTO_DEBUT)
        .lte("mois_index", dernier);
      if (E0) {
        console.warn("épargne auto :", E0.message);
        return;
      }
      const nouveaux = [];
      for (let m = EP_AUTO_DEBUT; m <= dernier; m++) {
        const { annee, mois } = anneeMoisDe(m),
          date =
            annee + "-" + String(mois + 1).padStart(2, "0") + "-" + String(EP_AUTO_JOUR).padStart(2, "0");
        budgetDuMois(bm, l, m)
          .filter((w) => w.kind === "epargne" && num(w.montant) > 0)
          .forEach((w) => {
            const lid = ligneBudgetId(w);
            if ((deja || []).some((x) => x.budget_line_id === lid && num(x.mois_index) === m)) return;
            if (param(c, epAutoCle(lid, m), 0)) return;
            nouveaux.push({
              user_id: t.user.id,
              budget_line_id: lid,
              montant: num(w.montant),
              note: EP_AUTO_NOTE,
              date_depense: date,
              type: "depense",
              mois_index: m,
            });
          });
      }
      if (!nouveaux.length) return;
      const { data: K, error: E } = await supabase.from("vision_transactions").insert(nouveaux).select();
      if (E) {
        console.warn("épargne auto :", E.message);
        return;
      }
      stx((p) => [...(K || []), ...p]), await relireSpend();
    })();
  }, [t, l, bm, c, txOk]);
  // L'historique est relu à chaque ouverture de l'onglet : il montre aussi ce qui vient d'être fait.
  React.useEffect(() => {
    if (s !== "historique" || MODE_PARTAGE || !t) return;
    supabase
      .from("vision_audit")
      .select("*")
      .order("changed_at", { ascending: !1 })
      .limit(400)
      .then(({ data: K }) => K && saud(K));
  }, [s, t]);
  // Dépenses récurrentes : celles du mois en cours sont créées une fois (« à venir »
  // tant que leur date n'est pas passée), puis passent à « faite » le jour venu.
  React.useEffect(() => {
    if (MODE_PARTAGE || !t || !l || !txOk || !recOk || !c.length || recRef.current) return;
    recRef.current = !0;
    (async () => {
      const auj = new Date(),
        M = moisNow(),
        isoAuj = isoAujourdhui();
      const { data: deja, error: E0 } = await supabase
        .from("vision_transactions")
        .select("recurrente_id, mois_index")
        .not("recurrente_id", "is", null)
        .eq("mois_index", M);
      if (E0) return console.warn("récurrentes :", E0.message);
      const nouveaux = recurrentesACreer(recurrentes, deja, c, M, auj, t.user.id);
      if (nouveaux.length) {
        const { data: K, error: E } = await supabase.from("vision_transactions").insert(nouveaux).select();
        if (E) return console.warn("récurrentes :", E.message);
        stx((p) => [...(K || []), ...p]);
      }
      const passees = tx.filter(
        (x) =>
          x.statut === "prevu" &&
          x.recurrente_id &&
          x.date_depense <= isoAuj &&
          !cl.some((k) => k.mois_index === num(x.mois_index)),
      );
      for (const x of passees) {
        const { data: K } = await supabase
          .from("vision_transactions")
          .update({ statut: "fait" })
          .eq("id", x.id)
          .select()
          .single();
        K && stx((p) => p.map((y) => (y.id === K.id ? K : y)));
      }
      await relireSpend();
    })();
  }, [t, l, txOk, recOk, c, recurrentes]);
  // Dépassement du salaire sur le mois en cours : une tâche « Revoir le budget »
  // apparaît dans la ligne Budget de l'Accueil (une seule par mois).
  React.useEffect(() => {
    if (MODE_PARTAGE || !t || !l || !txOk || !tachesOk) return;
    const M = moisNow(),
      a = alerteSalaire(l, bm, tx, M),
      ref = "salaire:" + M;
    if (
      a.niveau !== "rouge" ||
      alerteRef.current[ref] ||
      taches.some((x) => x.source === "alerte" && x.source_ref === ref)
    )
      return;
    alerteRef.current[ref] = !0;
    const { annee, mois } = anneeMoisDe(M),
      fin = new Date(annee, mois + 1, 0);
    tacheAdd({
      titre: "Revoir le budget de " + MOIS[M],
      theme: "budget",
      etape: "afaire",
      echeance:
        annee + "-" + String(mois + 1).padStart(2, "0") + "-" + String(fin.getDate()).padStart(2, "0"),
      source: "alerte",
      source_ref: ref,
    }).catch((e) => console.warn("tâche alerte :", e.message));
  }, [t, l, bm, tx, txOk, tachesOk, taches]);
  // « Pas versé » : on retire la saisie automatique et on note de ne pas la recréer.
  async function epargnePasVersee(x) {
    const cle = epAutoCle(x.budget_line_id, num(x.mois_index));
    b(cle, 1), await w(cle, 1);
    await txDelete(x.id);
  }
  async function clotureFixer(moisIdx, snapshot) {
    const { data: K, error: E } = await supabase
      .from("vision_cloture")
      .upsert(
        {
          user_id: t.user.id,
          mois_index: moisIdx,
          snapshot,
        },
        {
          onConflict: "user_id,mois_index",
        },
      )
      .select()
      .single();
    if (E) throw E;
    K && scl((H) => [...H.filter((A) => A.mois_index !== moisIdx), K]);
  }
  async function clotureRouvrir(moisIdx) {
    const { error: E } = await supabase.from("vision_cloture").delete().eq("mois_index", moisIdx);
    if (E) throw E;
    scl((H) => H.filter((A) => A.mois_index !== moisIdx));
  }
  async function pieceEtape(key, et) {
    if (MODE_PARTAGE) return;
    const avantDone = o[key],
      avantEt = pe[key],
      done = et === "validee";
    a((A) => ({
      ...A,
      [key]: done,
    })),
      setPe((A) => ({
        ...A,
        [key]: et,
      }));
    const { error: E } = await supabase.from("vision_progress").upsert(
      {
        item_key: key,
        done,
        etape: et,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,item_key",
      },
    );
    if (E) {
      a((A) => ({
        ...A,
        [key]: avantDone,
      })),
        setPe((A) => ({
          ...A,
          [key]: avantEt,
        }));
      throw E;
    }
  }
  async function pieceAdd(titre, groupe) {
    const { data: u2 } = await supabase.auth.getUser(),
      uid = u2 && u2.user ? u2.user.id : null,
      memes = ctRef.current.filter((x) => x.type === "piece" && (x.groupe || null) === (groupe || null)),
      base = {
        user_id: uid,
        type: "piece",
        groupe: groupe || null,
        titre,
      };
    let rang = memes.length ? Math.max(...memes.map((x) => x.sort || 0)) + 1 : 0,
      E = null;
    for (let essai = 0; essai < 3; essai++) {
      const r2 = await supabase
        .from("vision_contenu")
        .insert({
          ...base,
          item_key: "piece:" + Date.now() + (essai ? "-" + essai : ""),
          sort: rang,
        })
        .select()
        .single();
      if (r2.data) {
        sct((p) => [...p, r2.data]);
        return;
      }
      E = r2.error;
      if (!E || E.code !== "23505") break;
      rang += 1;
    }
    throw E || new Error("ajout impossible");
  }
  async function pieceDel(id) {
    const { error: E } = await supabase.from("vision_contenu").delete().eq("id", id);
    if (E) throw E;
    sct((p) => p.filter((x) => x.id !== id));
  }
  async function groupeRename(ancien, nouveau) {
    let q = supabase
      .from("vision_contenu")
      .update({
        groupe: nouveau,
        updated_at: new Date().toISOString(),
      })
      .eq("type", "piece");
    q = ancien == null ? q.is("groupe", null) : q.eq("groupe", ancien);
    const { error: E } = await q;
    if (E) throw E;
    sct((p) =>
      p.map((x) =>
        x.type === "piece" && (x.groupe || null) === (ancien || null)
          ? {
              ...x,
              groupe: nouveau,
            }
          : x,
      ),
    );
  }
  async function matAdd(titre) {
    const { data: u2 } = await supabase.auth.getUser(),
      uid = u2 && u2.user ? u2.user.id : null,
      l = ctRef.current.filter((x) => x.type === "matiere"),
      { data: d, error: E } = await supabase
        .from("vision_contenu")
        .insert({
          user_id: uid,
          type: "matiere",
          item_key: "matiere:" + Date.now(),
          titre,
          sort: l.length ? Math.max(...l.map((x) => x.sort || 0)) + 1 : 0,
        })
        .select()
        .single();
    if (E) throw E;
    sct((p) => [...p, d]);
  }
  async function matDel(id) {
    const { error: E } = await supabase.from("vision_contenu").delete().eq("id", id);
    if (E) throw E;
    sct((p) => p.filter((x) => x.id !== id));
  }
  // Import d'un relevé : un total par poste, plus salaire, vacances et sport.
  // Tout ce qui est créé porte l'identifiant de l'import, pour pouvoir l'annuler en une fois.
  async function importEnregistrer(plan) {
    const uid = t.user.id,
      { data: imp, error: E0 } = await supabase
        .from("vision_imports")
        .insert({
          user_id: uid,
          compte: plan.compte,
          debut: plan.debut,
          fin: plan.fin,
          nb_operations: plan.nb,
          details: { sport: plan.sport.map((x) => x.id) },
        })
        .select()
        .single();
    if (E0) throw E0;
    try {
      const lignes = plan.postes
        .filter((p) => p.lid && p.montant)
        .map((p) => ({
          user_id: uid,
          budget_line_id: p.lid,
          montant: Math.abs(p.montant),
          type: p.montant < 0 ? "remboursement" : "depense",
          note: p.note,
          date_depense: p.date,
          mois_index: moisDeDate(p.date),
          import_id: imp.id,
        }));
      if (plan.salaire && plan.salaire.montant)
        lignes.push({
          user_id: uid,
          budget_line_id: plan.salaire.lid,
          montant: plan.salaire.montant,
          type: "depense",
          note: "Salaire (relevé)",
          date_depense: plan.salaire.date,
          mois_index: moisDeDate(plan.salaire.date),
          import_id: imp.id,
        });
      if (lignes.length) {
        const { data: K, error: E } = await supabase.from("vision_transactions").insert(lignes).select();
        if (E) throw E;
        stx((p) => [...(K || []), ...p]);
      }
      if (plan.vacances.length) {
        let rang = Math.max(0, ...vi.filter((A) => A.pocket === "vacances").map((A) => A.sort || 0));
        const { data: K, error: E } = await supabase
          .from("vision_items")
          .insert(
            plan.vacances.map((v) => ({
              user_id: uid,
              pocket: "vacances",
              label: v.label,
              montant_prevu: v.montant,
              montant_reel: v.montant,
              mois_index: v.mois,
              paid: true,
              sort: ++rang,
              import_id: imp.id,
            })),
          )
          .select();
        if (E) throw E;
        mi((A) => [...A, ...(K || [])]);
      }
      for (const sp of plan.sport) {
        const { error: E } = await supabase
          .from("vision_items")
          .update({ paid: true, montant_reel: sp.montant })
          .eq("id", sp.id);
        if (E) throw E;
        itemLocal(sp.id, { paid: true, montant_reel: sp.montant });
      }
      if (plan.regles.length) {
        const { data: K } = await supabase
          .from("vision_import_regles")
          .upsert(
            plan.regles.map((r) => {
              const g = ["ignorer", "salaire", "vacances", "sport"].includes(r.poste) ? r.poste : null,
                ligne = g ? null : (l || []).find((b) => b.poste === r.poste && b.archive_depuis == null);
              return {
                user_id: uid,
                motif: r.motif,
                poste: r.poste,
                groupe: g,
                budget_line_id: ligne ? ligne.id : null,
                source: "appris",
              };
            }),
            { onConflict: "user_id,motif" },
          )
          .select("*");
        K && setReglesImport((A) => [...A.filter((x) => !K.some((k) => k.motif === x.motif)), ...K]);
      }
    } catch (e) {
      await importAnnuler(imp).catch(() => {});
      throw e;
    }
    setImports((A) => [...A, imp]), await relireSpend();
    return imp;
  }
  async function importAnnuler(imp) {
    const sport = (imp.details && imp.details.sport) || [];
    for (const id of sport) {
      await supabase.from("vision_items").update({ paid: false, montant_reel: null }).eq("id", id);
      itemLocal(id, { paid: false, montant_reel: null });
    }
    const r1 = await supabase.from("vision_transactions").delete().eq("import_id", imp.id);
    if (r1.error) throw r1.error;
    const r2 = await supabase.from("vision_items").delete().eq("import_id", imp.id);
    if (r2.error) throw r2.error;
    const r3 = await supabase.from("vision_imports").delete().eq("id", imp.id);
    if (r3.error) throw r3.error;
    stx((p) => p.filter((x) => x.import_id !== imp.id));
    mi((p) => p.filter((x) => x.import_id !== imp.id));
    setImports((A) => A.filter((x) => x.id !== imp.id));
    await relireSpend();
  }
  async function tacheAdd(v) {
    const K = Object.assign(
        {
          user_id: t.user.id,
          sort: Math.max(0, ...taches.map((A) => A.sort || 0)) + 1,
        },
        v,
      ),
      { data: H, error: E } = await supabase.from("vision_taches").insert(K).select().single();
    if (E) throw E;
    H && setTaches((A) => [...A, H]);
  }
  async function tacheUpdate(id, v) {
    const K = Object.assign({}, v, {
        updated_at: new Date().toISOString(),
      }),
      { data: H, error: E } = await supabase.from("vision_taches").update(K).eq("id", id).select().single();
    if (E) throw E;
    H && setTaches((A) => A.map((x) => (x.id === id ? H : x)));
  }
  async function tacheDelete(id) {
    const { error: E } = await supabase.from("vision_taches").delete().eq("id", id);
    if (E) throw E;
    setTaches((A) => A.filter((x) => x.id !== id));
  }
  async function itemDel(N) {
    mi((K) => K.filter((H) => H.id !== N)), await supabase.from("vision_items").delete().eq("id", N);
  }
  async function vacAdd(label, montant, moisIdx) {
    const K = {
        user_id: t.user.id,
        pocket: "vacances",
        label,
        montant_prevu: montant,
        montant_reel: montant,
        mois_index: moisIdx,
        paid: !0,
        sort: Math.max(0, ...vi.filter((A) => A.pocket === "vacances").map((A) => A.sort || 0)) + 1,
      },
      { data: H, error: E } = await supabase.from("vision_items").insert(K).select().single();
    if (E) throw E;
    H && mi((A) => [...A, H]);
  }
  async function vacSave(N, K) {
    const { error: E } = await supabase.from("vision_items").update(K).eq("id", N);
    if (E) throw E;
    itemLocal(N, K);
  }
  async function formAdd(label, montant, moisIdx) {
    const K = {
        user_id: t.user.id,
        pocket: "formation",
        label,
        montant_prevu: montant,
        montant_reel: null,
        mois_index: moisIdx,
        paid: !1,
        sort: Math.max(0, ...vi.filter((A) => A.pocket === "formation").map((A) => A.sort || 0)) + 1,
      },
      { data: H, error: E } = await supabase.from("vision_items").insert(K).select().single();
    if (E) throw E;
    H && mi((A) => [...A, H]);
  }
  async function vacDel(N) {
    const { error: E } = await supabase.from("vision_items").delete().eq("id", N);
    if (E) throw E;
    mi((K) => K.filter((H) => H.id !== N));
  }
  async function clore(moisIdx, snapshot) {
    const { data: K } = await supabase
      .from("vision_cloture")
      .upsert(
        {
          user_id: t.user.id,
          mois_index: moisIdx,
          snapshot,
        },
        {
          onConflict: "user_id,mois_index",
        },
      )
      .select()
      .single();
    K && scl((H) => [...H.filter((A) => A.mois_index !== moisIdx), K]);
  }
  // Les totaux de vision_spend sont recalculés par un trigger en base :
  // après chaque écriture de transaction on les relit, sans les recalculer ici.
  async function relireSpend() {
    const { data: K } = await supabase.from("vision_spend").select("*");
    K && ssp(K);
  }
  function moisDeDate(iso) {
    const dt = new Date(iso + "T00:00:00");
    return Math.max(0, Math.min(MOIS.length - 1, moisDepuisAncre(dt)));
  }
  async function txAdd(ligne) {
    if (clotRef.current.some((x) => x.mois_index === moisDeDate(ligne.date_depense)))
      throw new Error("Mois clôturé : rouvre-le pour y ajouter une dépense.");
    const { data: u2 } = await supabase.auth.getUser(),
      uid = u2 && u2.user ? u2.user.id : null,
      payload = {
        user_id: uid,
        budget_line_id: ligne.budget_line_id,
        montant: Number(ligne.montant) || 0,
        note: ligne.note || null,
        date_depense: ligne.date_depense,
        type: ligne.type === "remboursement" ? "remboursement" : "depense",
        mois_index: moisDeDate(ligne.date_depense),
        statut: ligne.statut === "prevu" ? "prevu" : "fait",
        exceptionnelle: !!ligne.exceptionnelle,
        recurrente_id: ligne.recurrente_id || null,
      },
      { data: K, error: E } = await supabase.from("vision_transactions").insert(payload).select().single();
    if (E) throw E;
    return stx((p) => [K, ...p]), await relireSpend(), K;
  }
  async function txUpdate(id, patch) {
    const corps = {
      ...patch,
    };
    corps.date_depense && (corps.mois_index = moisDeDate(corps.date_depense)),
      corps.montant != null && (corps.montant = Number(corps.montant) || 0);
    const { data: K, error: E } = await supabase
      .from("vision_transactions")
      .update(corps)
      .eq("id", id)
      .select()
      .single();
    if (E) throw E;
    return stx((p) => p.map((x) => (x.id === id ? K : x))), await relireSpend(), K;
  }
  async function txDelete(id) {
    const avant = tx.find((x) => x.id === id);
    if (avant && avant.note === EP_AUTO_NOTE) {
      const cle = epAutoCle(avant.budget_line_id, num(avant.mois_index));
      b(cle, 1), await w(cle, 1);
    }
    const { error: E } = await supabase.from("vision_transactions").delete().eq("id", id);
    if (E) throw E;
    stx((p) => p.filter((x) => x.id !== id)), await relireSpend();
  }
  // Remettre une dépense supprimée (bouton « Annuler ») : même identifiant, mêmes champs.
  async function txRemettre(ligne) {
    const { data: K, error: E } = await supabase
      .from("vision_transactions")
      .insert({ ...ligne })
      .select()
      .single();
    if (E) throw E;
    stx((p) => [K, ...p.filter((x) => x.id !== K.id)]), await relireSpend();
    return K;
  }
  // Supprimer une dépense depuis les écrans : une instance de récurrente supprimée
  // n'est pas recréée ce mois-ci (comme l'épargne automatique « pas versée »).
  async function txSupprimerUI(id, silencieux) {
    const avant = tx.find((x) => x.id === id);
    if (avant && avant.recurrente_id) {
      const cle = "rec_off_" + avant.recurrente_id + "_" + num(avant.mois_index);
      b(cle, 1), await w(cle, 1);
    }
    await txDelete(id);
    if (!silencieux && avant)
      notifier("Dépense supprimée", async () => {
        if (avant.recurrente_id) {
          const cle = "rec_off_" + avant.recurrente_id + "_" + num(avant.mois_index);
          b(cle, 0), await w(cle, 0);
        }
        await txRemettre(avant);
      });
  }
  async function txModifierUI(id, patch) {
    const avant = tx.find((x) => x.id === id),
      K = await txUpdate(id, patch);
    avant &&
      notifier("Enregistré", async () => {
        const retour = {};
        Object.keys(patch).forEach((k) => (retour[k] = avant[k]));
        await txUpdate(id, retour);
      });
    return K;
  }
  async function txAjouterUI(ligne) {
    const K = await txAdd(ligne);
    notifier("Dépense ajoutée", () => txDelete(K.id));
    return K;
  }
  function notifier(msg, annuler) {
    setToast({ msg, annuler, n: Date.now() });
  }
  function signalerErreur(e) {
    setToast({ msg: messageErreur(e), erreur: !0, n: Date.now() });
  }
  async function saveSpend(lineId, moisIdx, montant, note) {
    const payload = {
      user_id: t.user.id,
      budget_line_id: lineId,
      mois_index: moisIdx,
      montant,
    };
    if (note !== undefined) payload.note = note;
    const { data: K } = await supabase
      .from("vision_spend")
      .upsert(payload, {
        onConflict: "user_id,budget_line_id,mois_index",
      })
      .select()
      .single();
    K && ssp((H) => [...H.filter((A) => !(A.budget_line_id === lineId && A.mois_index === moisIdx)), K]);
  }
  async function addSaving() {
    const K = {
        user_id: t.user.id,
        poste: "",
        ancien_montant: 0,
        nouveau_montant: 0,
        note: "",
        sort: Math.max(0, ...sv.map((A) => A.sort || 0)) + 1,
      },
      { data: H } = await supabase.from("vision_savings").insert(K).select().single();
    H && ssv((A) => [...A, H]);
  }
  async function saveSaving(id, patch) {
    await supabase.from("vision_savings").update(patch).eq("id", id),
      ssv((K) =>
        K.map((H) =>
          H.id === id
            ? {
                ...H,
                ...patch,
              }
            : H,
        ),
      );
  }
  async function delSaving(id) {
    ssv((K) => K.filter((H) => H.id !== id)), await supabase.from("vision_savings").delete().eq("id", id);
  }
  function oe() {
    const N = window.location.origin + window.location.pathname + "?partage";
    navigator.clipboard
      ? navigator.clipboard
          .writeText(N)
          .then(() =>
            alert(
              `Lien de partage copié !

` + N,
            ),
          )
          .catch(() => window.prompt("Lien de partage :", N))
      : window.prompt("Lien de partage :", N);
  }
  const notifs = MODE_PARTAGE
    ? null
    : {
        ...(etatNotifs || { etat: "", message: "" }),
        activer:
          etatNotifs && etatNotifs.etat === "a-activer"
            ? async () => {
                try {
                  await activerNotifications(t.user.id);
                  setEtatNotifs({ etat: "actives", message: "" }),
                    notifier("Rappels activés sur ce téléphone");
                } catch (e) {
                  signalerErreur(e), etatNotifications().then(setEtatNotifs);
                }
              }
            : null,
      };
  const actions = creerActions({
    uid: () => (t ? t.user.id : null),
    notifier,
    txModifier: txUpdate,
    txAjouter: txAdd,
    txSupprimer: txSupprimerUI,
    txRemettre,
    get: {
      budget: () => l,
      bm: () => bm,
      tx: () => tx,
      params: () => c,
      clotures: () => cl,
      recurrentes: () => recurrentes,
      seances: () => seances,
      regles: () => reglesImport,
      pea: () => pea,
    },
    set: {
      budget: u,
      bm: sbm,
      params: d,
      recurrentes: setRecurrentes,
      seances: setSeances,
      regles: setReglesImport,
      pea: setPea,
    },
  });
  // Une action déclenchée depuis un écran : erreur affichée, jamais avalée.
  const agir =
    (fn) =>
    async (...args) => {
      if (MODE_PARTAGE) return;
      try {
        return await fn(...args);
      } catch (e) {
        signalerErreur(e);
        throw e;
      }
    };
  if (!supabaseConfigured) return <div className="warn">Configuration Supabase manquante.</div>;
  if (!r) return null;
  if (!MODE_PARTAGE && !t) return <Connexion />;
  set_VISION_BUDGET(l, bm, txOk ? tx : null);
  set_ICONES(l);
  set_ALERTE_SEUIL(param(c, "alerte_seuil", 50));
  set_VISION_DEFICITS(l ? deficitsParMois(l, bm, tx, MOIS.length) : []);
  const Ge = {
      budget: l,
      params: c,
      voyages: p,
      items: vi,
      clotures: cl,
      audit: aud,
      spend: sp,
      transactions: tx,
      onEditTx: setTxEdit,
      budgetMois: bm,
      setBudgetMois: sbm,
      poches: poches,
      setPoches: setPoches,
      editPoche: pocheEdit,
      savePoche: pocheSave,
      addPoche: pocheAdd,
      delPoche: pocheDel,
      savings: sv,
      ...(MODE_PARTAGE
        ? {
            readOnly: !0,
            editLine: rienFaire,
            saveLine: rienFaire,
            addLine: rienFaire,
            removeLine: rienFaire,
            editParam: rienFaire,
            saveParam: rienFaire,
            editVoyage: rienFaire,
            saveVoyage: rienFaire,
            addVoyage: rienFaire,
            removeVoyage: rienFaire,
            editItem: rienFaire,
            saveItem: rienFaire,
            addItem: rienFaire,
            removeItem: rienFaire,
            addCloture: rienFaire,
            saveSpend: rienFaire,
            addSaving: rienFaire,
            saveSaving: rienFaire,
            delSaving: rienFaire,
          }
        : {
            readOnly: !1,
            editLine: y,
            saveLine: f,
            addLine: g,
            removeLine: S,
            editParam: b,
            saveParam: w,
            editVoyage: j,
            saveVoyage: P,
            addVoyage: q,
            removeVoyage: V,
            editItem: itemLocal,
            saveItem: itemSave,
            addItem: itemAdd,
            removeItem: itemDel,
            addCloture: clore,
            saveSpend: saveSpend,
            addSaving: addSaving,
            saveSaving: saveSaving,
            delSaving: delSaving,
          }),
    },
    gt = (N) => (MODE_PARTAGE && !v ? <Verrou onUnlock={() => k(!0)} /> : N);
  return (
    <>
      <header
        className="top"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(9,42,49,.42), rgba(9,42,49,.72)), url(${IMG_FOND})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="wrap">
          <div className="kick">Reconversion · 2026 – 2027</div>
          <h1>{"Juriste Data, IA & Cyber"}</h1>
          {MODE_PARTAGE ? (
            <>
              <div className="who">Aperçu partagé</div>
              <div className="topact">
                <button className="logout" onClick={() => (window.location.href = window.location.origin + window.location.pathname)}>
                  Mon compte
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="who">{t.user.email}</div>
              <div className="topact">
                <button className="logout" onClick={oe}>
                  Partager
                </button>
                <button className="logout" onClick={() => supabase.auth.signOut()}>
                  Déconnexion
                </button>
              </div>
            </>
          )}
        </div>
      </header>
      <main className="wrap">
        {s === "apercu" && (
          <Accueil
            budget={l}
            budgetMois={bm}
            transactions={tx}
            items={vi}
            params={c}
            poches={poches}
            progress={o}
            pieceEtapes={pe}
            contenu={ct}
            hw={hwRows}
            taches={MODE_PARTAGE ? [] : taches}
            onHwStatus={(id, st) => hwkSetStatus(setHwRows, id, st)}
            onPieceEtape={pieceEtape}
            onSuiviToggle={async (key) => x(key)}
            readOnly={MODE_PARTAGE}
            goTab={(N) => {
              i(N), window.scrollTo(0, 0);
            }}
            onAdd={MODE_PARTAGE ? rienFaire : tacheAdd}
            onUpdate={MODE_PARTAGE ? rienFaire : tacheUpdate}
            onDelete={MODE_PARTAGE ? rienFaire : tacheDelete}
          />
        )}
        {s === "planning" && (
          <Planning
            rows={ct}
            edit={ctEdit}
            save={ctSave}
            add={ctAdd}
            del={ctDel}
            move={ctMove}
            readOnly={MODE_PARTAGE}
          />
        )}
        {s === "suivi" && (
          <SuiviPage
            rows={ct}
            progress={o}
            readOnly={MODE_PARTAGE}
            onToggle={x}
            onCtMaj={agir(ctMaj)}
            onCtCreer={agir(ctCreer)}
            onCtSupprimer={agir(ctSupprimer)}
            onMove={agir(ctMove)}
          />
        )}
        {s === "budget" && <Formations items={vi} />}
        {s === "tresorerie" &&
          gt(
            <>
              <BudgetMensuel
                budget={l}
                budgetMois={bm}
                setBudgetMois={sbm}
                transactions={tx}
                poches={poches}
                items={vi}
                params={c}
                clotures={cl}
                ve={MOIS}
                readOnly={MODE_PARTAGE}
                onEditTx={MODE_PARTAGE ? rienFaire : setTxEdit}
                onNewTx={MODE_PARTAGE ? rienFaire : setTxEdit}
                onAddVacances={MODE_PARTAGE ? rienFaire : vacAdd}
                onSaveVacances={MODE_PARTAGE ? rienFaire : vacSave}
                onDelVacances={MODE_PARTAGE ? rienFaire : vacDel}
                onAddTx={MODE_PARTAGE ? rienFaire : agir(txAjouterUI)}
                onUpdateTx={MODE_PARTAGE ? rienFaire : agir(txModifierUI)}
                onAddFormation={MODE_PARTAGE ? rienFaire : formAdd}
                onPatchItem={MODE_PARTAGE ? rienFaire : vacSave}
                onPasVerse={MODE_PARTAGE ? rienFaire : epargnePasVersee}
                onCloturer={MODE_PARTAGE ? rienFaire : clotureFixer}
                onRouvrir={MODE_PARTAGE ? rienFaire : clotureRouvrir}
                onImport={MODE_PARTAGE ? null : () => setImportOuvert(true)}
                pea={pea}
                actions={
                  MODE_PARTAGE
                    ? null
                    : {
                        conflits: actions.conflits,
                        posteModifier: agir(actions.posteModifier),
                        posteAjouter: agir(actions.posteAjouter),
                        posteArchiver: agir(actions.posteArchiver),
                        basculerPEA: agir(actions.basculerPEA),
                        recompleterMatelas: agir(actions.recompleterMatelas),
                        matelasPlusTard: agir(actions.matelasPlusTard),
                        peaNoter: agir(actions.peaNoter),
                      }
                }
              />
              <details
                className="collapsible"
                style={{
                  marginTop: 24,
                }}
              >
                <summary>
                  🧰 Autres outils — relevé livrets, clôture du mois, poches, voyages, modèle de budget
                </summary>
                <div className="inner">
                  <AutresOutils {...Ge} />
                </div>
              </details>
            </>,
          )}
        {s === "stats" &&
          gt(<Graphiques budget={l} params={c} items={vi} budgetMois={bm} transactions={tx} />)}
        {s === "sport" && (
          <SportPage
            rows={ct}
            items={vi}
            seances={seances}
            readOnly={MODE_PARTAGE}
            ferme={actions.ferme}
            onCtMaj={agir(ctMaj)}
            onCtCreer={agir(ctCreer)}
            onCtSupprimer={agir(ctSupprimer)}
            onItemMaj={agir(itemMaj)}
            onSeance={agir(actions.seanceBasculer)}
          />
        )}
        {s === "reglages" &&
          gt(
            <Reglages
              params={c}
              budget={l}
              budgetMois={bm}
              recurrentes={recurrentes}
              regles={reglesImport}
              readOnly={MODE_PARTAGE}
              notifs={notifs}
              actions={{
                reglage: agir(actions.reglage),
                recurrenteEnregistrer: agir(actions.recurrenteEnregistrer),
                recurrenteArreter: agir(actions.recurrenteArreter),
                regleAjouter: agir(actions.regleAjouter),
                regleSupprimer: agir(actions.regleSupprimer),
              }}
            />,
          )}
        {s === "pieces" && (
          <PiecesPage
            rows={ct}
            progress={o}
            pieceEtapes={pe}
            readOnly={MODE_PARTAGE}
            onEtape={pieceEtape}
            onEdit={ctEdit}
            onSave={ctSave}
            onAdd={pieceAdd}
            onDel={pieceDel}
            onMove={(id, sens) => ctMove(id, "piece", sens)}
            onRenameGroupe={groupeRename}
          />
        )}
        {s === "historique" && gt(<Historique audit={aud} items={vi} params={c} />)}
        {s === "homework" && (
          <DevoirsPage
            rows={hwRows}
            setRows={setHwRows}
            loading={hwLoading}
            err={hwErr}
            contenu={ct}
            readOnly={MODE_PARTAGE}
            onEditCt={ctEdit}
            onSaveCt={ctSave}
            onStatus={(id, st) => hwkSetStatus(setHwRows, id, st)}
            onMatAdd={matAdd}
            onMatDel={matDel}
          />
        )}
      </main>
      {!MODE_PARTAGE && (
        <button
          className="fab"
          onClick={() => {
            setTxEdit(null), setSaisieOuverte(!0);
          }}
          aria-label="Ajouter une dépense"
        >
          +
        </button>
      )}
      {importOuvert && !MODE_PARTAGE && (
        <ImportReleve
          budget={l}
          budgetMois={bm}
          transactions={tx}
          items={vi}
          imports={imports}
          regles={reglesImport.map((r) => ({
            ...r,
            poste: r.groupe || ((l || []).find((b) => b.id === r.budget_line_id) || {}).poste || r.poste,
          }))}
          onEnregistrer={importEnregistrer}
          onAnnuler={importAnnuler}
          onClose={() => setImportOuvert(false)}
        />
      )}
      {(saisieOuverte || txEdit) && (
        <SaisieRapide
          budget={l}
          budgetMois={bm}
          transactions={tx}
          onAdd={txAjouterUI}
          onUpdate={txModifierUI}
          onDelete={(id) => txSupprimerUI(id)}
          initial={txEdit}
          onClose={() => {
            setSaisieOuverte(!1), setTxEdit(null);
          }}
        />
      )}
      <ToastAnnuler toast={toast} onFermer={() => setToast(null)} />
      <NavBas
        onglets={ONGLETS}
        actif={s}
        aller={(N) => {
          i(N), window.scrollTo(0, 0);
        }}
        verrou={(N) => !!(MODE_PARTAGE && ONGLETS_VERROUILLES.includes(N) && !v)}
      />
    </>
  );
}
