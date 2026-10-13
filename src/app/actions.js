// Actions de modification partagées par les écrans (budget, récurrentes, séances,
// réglages, mots-clés d'import). Une seule règle : la base d'abord, l'écran ensuite,
// un message clair si ça échoue, et « Annuler » quand c'est possible.
import { budgetDuMois, ligneBudgetId } from "../lib/calculs.js";
import { num } from "../lib/format.js";
import { anneeMoisDe, moisDepuisAncre, moisNow } from "../lib/mois.js";
import { supabase } from "../lib/supabase.js";

const iMois = (r) => (r.annee - 2026) * 12 + r.mois - 7; // même ancre que config.js (août 2026)

export function messageErreur(e) {
  const m = (e && (e.message || e.error_description)) || "";
  if (/Failed to fetch|NetworkError|Load failed|network/i.test(m) || !m)
    return "Connexion perdue : rien n'a été modifié. Réessaie.";
  return m;
}

export function creerActions(ctx) {
  const { get, set, notifier, uid } = ctx;
  const ferme = (m) => (get.clotures() || []).some((x) => x.mois_index === m);
  const ok = (r) => {
    if (r.error) throw r.error;
    return r.data;
  };

  // Lignes de budget d'un poste, mois par mois (seulement les mois déjà créés).
  const lignesDuPoste = (lid) => (get.bm() || []).filter((x) => x.budget_line_id === lid);
  const ligneDuMois = (lid, m) => lignesDuPoste(lid).find((x) => iMois(x) === m);

  // Mois suivants qui ont déjà leur propre montant : différent du montant habituel du
  // poste (le modèle) et de celui du mois de départ. Ceux-là, on demande.
  function conflits(lid, depuis) {
    const depart = ligneDuMois(lid, depuis),
      modele = (get.budget() || []).find((b) => b.id === lid),
      habituels = new Set([depart ? num(depart.montant) : null, modele ? num(modele.montant) : null]);
    return lignesDuPoste(lid)
      .filter((x) => iMois(x) > depuis && !ferme(iMois(x)) && !habituels.has(num(x.montant)))
      .sort((a, b) => iMois(a) - iMois(b))
      .map((x) => ({ m: iMois(x), montant: num(x.montant) }));
  }

  async function majLignesMois(maj) {
    // maj : [{ id, patch }] ; renvoie les anciennes valeurs pour « Annuler ».
    const avant = [];
    for (const { id, patch } of maj) {
      const ancienne = (get.bm() || []).find((x) => x.id === id);
      const d = ok(
        await supabase
          .from("vision_budget_mois")
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single(),
      );
      avant.push({
        id,
        patch: Object.fromEntries(Object.keys(patch).map((k) => [k, ancienne ? ancienne[k] : null])),
      });
      set.bm((p) => p.map((x) => (x.id === id ? d : x)));
    }
    return avant;
  }

  async function majModele(lid, patch) {
    const ancienne = (get.budget() || []).find((x) => x.id === lid);
    const d = ok(await supabase.from("vision_budget").update(patch).eq("id", lid).select().single());
    set.budget((p) => p.map((x) => (x.id === lid ? d : x)));
    return {
      id: lid,
      patch: Object.fromEntries(Object.keys(patch).map((k) => [k, ancienne ? ancienne[k] : null])),
    };
  }

  // Modifier un poste : nom / icône partout (sauf mois clôturés), montant selon la portée.
  // portee : "mois" (ce mois seulement) ou "suite" (ce mois et les suivants).
  // garder : mois personnalisés à laisser tels quels quand portee = "suite".
  async function posteModifier({ lid, depuis, poste, icone, montant, portee, garder }) {
    const annulerLignes = [],
      annulerModele = [];
    try {
      if (poste != null || icone !== undefined) {
        const p = {};
        poste != null && (p.poste = poste.trim());
        icone !== undefined && (p.icone = icone || null);
        annulerModele.push(await majModele(lid, p));
        if (p.poste) {
          const maj = lignesDuPoste(lid)
            .filter((x) => !ferme(iMois(x)) && x.poste !== p.poste)
            .map((x) => ({ id: x.id, patch: { poste: p.poste } }));
          annulerLignes.push(...(await majLignesMois(maj)));
        }
      }
      if (montant != null) {
        const v = Math.round(num(montant) * 100) / 100,
          depart = ligneDuMois(lid, depuis);
        if (ferme(depuis)) throw new Error("Mois clôturé : rouvre-le pour le modifier.");
        if (!depart) throw new Error("Ce mois n'est pas encore préparé.");
        const ancien = num(depart.montant),
          garde = new Set(garder || []);
        const cibles =
          portee === "mois"
            ? [depart]
            : lignesDuPoste(lid).filter(
                (x) =>
                  iMois(x) >= depuis &&
                  !ferme(iMois(x)) &&
                  (iMois(x) === depuis || num(x.montant) === ancien || !garde.has(iMois(x))),
              );
        annulerLignes.push(
          ...(await majLignesMois(
            cibles.map((x) => ({ id: x.id, patch: { montant: v, est_override: portee === "mois" } })),
          )),
        );
        if (portee !== "mois") annulerModele.push(await majModele(lid, { montant: v }));
      }
    } catch (e) {
      // Remise en l'état de ce qui a déjà été écrit.
      for (const a of annulerLignes.reverse()) await majLignesMois([a]).catch(() => {});
      for (const a of annulerModele.reverse()) await majModele(a.id, a.patch).catch(() => {});
      throw e;
    }
    notifier("Enregistré", async () => {
      for (const a of [...annulerLignes].reverse()) await majLignesMois([a]);
      for (const a of [...annulerModele].reverse()) await majModele(a.id, a.patch);
    });
  }

  // Nouveau poste de dépense, à partir du mois « depuis ».
  async function posteAjouter({ poste, icone, montant, depuis, kind = "charge" }) {
    const nom = (poste || "").trim();
    if (!nom) throw new Error("Donne un nom au poste.");
    if (
      (get.budget() || []).some(
        (b) => b.poste.toLowerCase() === nom.toLowerCase() && b.archive_depuis == null,
      )
    )
      throw new Error("Un poste porte déjà ce nom.");
    const v = Math.round(num(montant) * 100) / 100;
    if (v < 0) throw new Error("Le montant ne peut pas être négatif.");
    const modele = ok(
      await supabase
        .from("vision_budget")
        .insert({
          user_id: uid(),
          line_key: "x_" + Math.random().toString(36).slice(2, 10),
          kind,
          poste: nom,
          icone: icone || null,
          detail: "",
          montant: v,
          type: "variable",
          sort:
            Math.max(0, ...(get.budget() || []).filter((b) => b.kind === kind).map((b) => b.sort || 0)) + 1,
        })
        .select()
        .single(),
    );
    set.budget((p) => [...p, modele]);
    const moisCrees = [...new Set((get.bm() || []).map(iMois))].filter((m) => m >= depuis && !ferme(m));
    let lignes = [];
    if (moisCrees.length) {
      lignes = ok(
        await supabase
          .from("vision_budget_mois")
          .insert(
            moisCrees.map((m) => {
              const { annee, mois } = anneeMoisDe(m);
              return {
                user_id: uid(),
                annee,
                mois,
                budget_line_id: modele.id,
                line_key: modele.line_key,
                kind,
                poste: nom,
                detail: "",
                montant: v,
                sort: modele.sort,
                type: "variable",
                est_override: false,
              };
            }),
          )
          .select(),
      );
      set.bm((p) => [...p, ...lignes]);
    }
    notifier("« " + nom + " » ajouté", async () => {
      ok(
        await supabase
          .from("vision_budget_mois")
          .delete()
          .in(
            "id",
            lignes.map((x) => x.id),
          ),
      );
      set.bm((p) => p.filter((x) => !lignes.some((l) => l.id === x.id)));
      ok(await supabase.from("vision_budget").delete().eq("id", modele.id));
      set.budget((p) => p.filter((x) => x.id !== modele.id));
    });
    return modele;
  }

  // Archiver : le poste disparaît à partir de « depuis », ses dépenses restent.
  async function posteArchiver(lid, depuis) {
    const avant = await majModele(lid, { archive_depuis: depuis });
    const recs = (get.recurrentes() || []).filter(
      (r) => r.budget_line_id === lid && (r.fin == null || r.fin >= depuis),
    );
    const recAvant = [];
    for (const r of recs) {
      const d = ok(
        await supabase
          .from("vision_recurrentes")
          .update({ fin: depuis - 1 })
          .eq("id", r.id)
          .select()
          .single(),
      );
      recAvant.push({ id: r.id, fin: r.fin });
      set.recurrentes((p) => p.map((x) => (x.id === r.id ? d : x)));
    }
    const nom = ((get.budget() || []).find((b) => b.id === lid) || {}).poste || "Poste";
    notifier("« " + nom + " » archivé", async () => {
      await majModele(lid, avant.patch);
      for (const r of recAvant) {
        const d = ok(
          await supabase.from("vision_recurrentes").update({ fin: r.fin }).eq("id", r.id).select().single(),
        );
        set.recurrentes((p) => p.map((x) => (x.id === r.id ? d : x)));
      }
    });
  }

  // ---- Réglages (vision_params) ----
  async function reglage(cle, valeur, libelle) {
    const ancien = ((get.params() || []).find((x) => x.param_key === cle) || {}).montant;
    const ecrire = async (v) => {
      ok(
        await supabase
          .from("vision_params")
          .upsert({ user_id: uid(), param_key: cle, montant: v }, { onConflict: "user_id,param_key" }),
      );
      set.params((p) =>
        p.some((x) => x.param_key === cle)
          ? p.map((x) => (x.param_key === cle ? { ...x, montant: v } : x))
          : [...p, { param_key: cle, montant: v }],
      );
    };
    await ecrire(Number(valeur));
    libelle && notifier(libelle, ancien == null ? null : () => ecrire(Number(ancien)));
  }

  // ---- Dépenses récurrentes ----
  async function recurrenteEnregistrer(r) {
    const champs = {
      label: (r.label || "").trim(),
      budget_line_id: r.budget_line_id,
      montant: Math.round(num(r.montant) * 100) / 100,
      jour: Math.max(1, Math.min(31, Math.round(num(r.jour) || 1))),
      fin: r.fin === "" || r.fin == null ? null : Number(r.fin),
    };
    if (!champs.label) throw new Error("Donne un nom à la dépense.");
    if (!champs.budget_line_id) throw new Error("Choisis le poste.");
    if (champs.montant < 0) throw new Error("Le montant ne peut pas être négatif.");
    if (r.id) {
      const avant = (get.recurrentes() || []).find((x) => x.id === r.id);
      const d = ok(
        await supabase
          .from("vision_recurrentes")
          .update({ ...champs, updated_at: new Date().toISOString() })
          .eq("id", r.id)
          .select()
          .single(),
      );
      set.recurrentes((p) => p.map((x) => (x.id === r.id ? d : x)));
      // Les prélèvements encore « à venir » suivent le nouveau montant et le nouveau poste.
      const prevus = (get.tx() || []).filter(
        (x) => x.recurrente_id === r.id && x.statut === "prevu" && !ferme(num(x.mois_index)),
      );
      for (const x of prevus)
        await ctx.txModifier(x.id, {
          montant: champs.montant,
          budget_line_id: champs.budget_line_id,
          note: champs.label,
        });
      notifier("Enregistré", async () => {
        const back = {
          label: avant.label,
          budget_line_id: avant.budget_line_id,
          montant: avant.montant,
          jour: avant.jour,
          fin: avant.fin,
        };
        const d2 = ok(
          await supabase.from("vision_recurrentes").update(back).eq("id", r.id).select().single(),
        );
        set.recurrentes((p) => p.map((x) => (x.id === r.id ? d2 : x)));
        for (const x of prevus)
          await ctx.txModifier(x.id, { montant: x.montant, budget_line_id: x.budget_line_id, note: x.note });
      });
      return d;
    }
    const d = ok(
      await supabase
        .from("vision_recurrentes")
        .insert({
          ...champs,
          user_id: uid(),
          debut: moisNow(),
          sort: Math.max(0, ...(get.recurrentes() || []).map((x) => x.sort || 0)) + 1,
        })
        .select()
        .single(),
    );
    set.recurrentes((p) => [...p, d]);
    // L'occurrence du mois en cours est créée tout de suite (« à venir » si sa date n'est pas passée).
    const instances = recurrentesACreer([d], get.tx(), get.params(), moisNow(), new Date(), uid());
    for (const l of instances) await ctx.txAjouter(l).catch(() => {});
    notifier("« " + d.label + " » ajoutée", async () => {
      const lies = (get.tx() || []).filter((x) => x.recurrente_id === d.id && x.statut === "prevu");
      for (const x of lies) await ctx.txSupprimer(x.id);
      ok(await supabase.from("vision_recurrentes").delete().eq("id", d.id));
      set.recurrentes((p) => p.filter((x) => x.id !== d.id));
    });
    return d;
  }
  // Arrêter : plus de prélèvement à partir de ce mois ; l'historique reste.
  async function recurrenteArreter(id) {
    const avant = (get.recurrentes() || []).find((x) => x.id === id),
      m = moisNow();
    const d = ok(
      await supabase
        .from("vision_recurrentes")
        .update({ fin: m - 1, actif: false })
        .eq("id", id)
        .select()
        .single(),
    );
    set.recurrentes((p) => p.map((x) => (x.id === id ? d : x)));
    const prevus = (get.tx() || []).filter(
      (x) => x.recurrente_id === id && x.statut === "prevu" && num(x.mois_index) >= m,
    );
    for (const x of prevus) await ctx.txSupprimer(x.id, !0);
    notifier("« " + avant.label + " » arrêtée", async () => {
      const d2 = ok(
        await supabase
          .from("vision_recurrentes")
          .update({ fin: avant.fin, actif: avant.actif })
          .eq("id", id)
          .select()
          .single(),
      );
      set.recurrentes((p) => p.map((x) => (x.id === id ? d2 : x)));
      for (const x of prevus) await ctx.txRemettre(x);
    });
  }

  // ---- Séances de sport ----
  async function seanceBasculer({ date, cours_id, activite }) {
    const ex = (get.seances() || []).find(
      (x) =>
        x.date === date &&
        (x.cours_id || null) === (cours_id || null) &&
        (cours_id || x.activite === activite),
    );
    if (ex) {
      ok(await supabase.from("vision_seances").delete().eq("id", ex.id));
      set.seances((p) => p.filter((x) => x.id !== ex.id));
      notifier("Séance retirée", async () => {
        const d = ok(
          await supabase
            .from("vision_seances")
            .insert({ ...ex })
            .select()
            .single(),
        );
        set.seances((p) => [...p, d]);
      });
      return;
    }
    const d = ok(
      await supabase
        .from("vision_seances")
        .insert({ user_id: uid(), date, cours_id: cours_id || null, activite: activite || null, fait: true })
        .select()
        .single(),
    );
    set.seances((p) => [...p, d]);
  }

  // ---- Mots-clés de l'import ----
  async function regleAjouter({ motif, budget_line_id, groupe }) {
    const m = (motif || "").trim().toUpperCase();
    if (!m) throw new Error("Écris un mot-clé.");
    if ((get.regles() || []).some((r) => r.motif === m)) throw new Error("« " + m + " » existe déjà.");
    const poste = groupe || ((get.budget() || []).find((b) => b.id === budget_line_id) || {}).poste;
    const d = ok(
      await supabase
        .from("vision_import_regles")
        .insert({
          user_id: uid(),
          motif: m,
          budget_line_id: budget_line_id || null,
          groupe: groupe || null,
          poste,
          source: "base",
          sort: Math.max(0, ...(get.regles() || []).map((r) => r.sort || 0)) + 1,
        })
        .select()
        .single(),
    );
    set.regles((p) => [...p, d]);
    notifier("« " + m + " » ajouté", async () => {
      ok(await supabase.from("vision_import_regles").delete().eq("id", d.id));
      set.regles((p) => p.filter((x) => x.id !== d.id));
    });
  }
  async function regleSupprimer(r) {
    ok(await supabase.from("vision_import_regles").delete().eq("id", r.id));
    set.regles((p) => p.filter((x) => x.id !== r.id));
    notifier("« " + r.motif + " » retiré", async () => {
      const d = ok(
        await supabase
          .from("vision_import_regles")
          .insert({ ...r })
          .select()
          .single(),
      );
      set.regles((p) => [...p, d]);
    });
  }

  return {
    conflits,
    posteModifier,
    posteAjouter,
    posteArchiver,
    reglage,
    recurrenteEnregistrer,
    recurrenteArreter,
    seanceBasculer,
    regleAjouter,
    regleSupprimer,
    ferme,
  };
}

// Instances des dépenses récurrentes pour le mois en cours (créées une seule fois).
export function recurrentesACreer(recurrentes, tx, params, m, aujourdhui, uid) {
  const { annee, mois } = anneeMoisDe(m),
    jours = new Date(annee, mois + 1, 0).getDate(),
    iso = (j) =>
      annee + "-" + String(mois + 1).padStart(2, "0") + "-" + String(Math.min(j, jours)).padStart(2, "0"),
    auj =
      aujourdhui.getFullYear() +
      "-" +
      String(aujourdhui.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(aujourdhui.getDate()).padStart(2, "0"),
    off = (id) => (params || []).some((p) => p.param_key === "rec_off_" + id + "_" + m && Number(p.montant));
  return (recurrentes || [])
    .filter((r) => r.actif !== false && num(r.debut) <= m && (r.fin == null || num(r.fin) >= m))
    .filter((r) => !(tx || []).some((x) => x.recurrente_id === r.id && num(x.mois_index) === m) && !off(r.id))
    .map((r) => ({
      user_id: uid,
      budget_line_id: r.budget_line_id,
      montant: num(r.montant),
      note: r.label,
      date_depense: iso(num(r.jour)),
      mois_index: m,
      type: "depense",
      recurrente_id: r.id,
      statut: iso(num(r.jour)) > auj ? "prevu" : "fait",
    }));
}

export { iMois, moisDepuisAncre, ligneBudgetId, budgetDuMois };
