import React from "react";
import { budgetDuMois, itemCompte, ligneBudgetId, montantSigne } from "../lib/calculs.js";
import { catIcone, num } from "../lib/format.js";
import { classer, dejaSaisie, lireFichierPdf, nomOperation, noteDesOperations } from "../lib/importReleve.js";
import { anneeMoisDe, moisDepuisAncre } from "../lib/mois.js";
import { KbSheet, KB_SR, accIcone, kbBouton } from "./kanban/communs.jsx";

const SPECIAUX = {
  salaire: { l: "Salaire", sous: "→ salaire réel du mois", c: "var(--t-vert)" },
  vacances: { l: "Vacances", sous: "→ poche vacances", c: "var(--t-orange)" },
  sport: { l: "Sport", sous: "→ paiement de l'enveloppe", c: "var(--t-rose)" },
  ignorer: { l: "Virements entre tes comptes", sous: "ignorés", c: "var(--slate-light)" },
};
const COULEURS = [
  "var(--c-vert)",
  "var(--c-bleu)",
  "var(--c-rose)",
  "var(--c-ambre)",
  "var(--c-violet)",
  "var(--c-teal)",
  "var(--ink-soft)",
  "var(--c-orange)",
  "var(--c-orange)",
  "var(--slate)",
  "var(--c-vert)",
];
const MOIS_LONGS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];
const eur = (v) =>
  (v < 0 ? "+" : "") +
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v)) +
  " €";
const dateCourte = (iso) => iso.slice(8, 10) + "/" + iso.slice(5, 7);
const ICONE_DOC = "M6.2 3.6h6.6l5 5v11.8a1 1 0 0 1-1 1H6.2a1 1 0 0 1-1-1V4.6a1 1 0 0 1 1-1zM12.8 3.6V8.6h5";

// Écran d'import d'un relevé BoursoBank : aperçu complet, rien n'est enregistré
// avant le bouton final, et chaque import peut être annulé en une fois.
export function ImportReleve({
  budget,
  budgetMois,
  transactions,
  items,
  imports,
  regles,
  onEnregistrer,
  onAnnuler,
  onClose,
}) {
  const [etat, setEtat] = React.useState(""),
    [releve, setReleve] = React.useState(null),
    [choix, setChoix] = React.useState({}),
    [off, setOff] = React.useState({}),
    [ouvert, setOuvert] = React.useState({}),
    [edit, setEdit] = React.useState(null),
    [fini, setFini] = React.useState(null),
    [confAnnul, setConfAnnul] = React.useState(null),
    [erreur, setErreur] = React.useState(""),
    [det, setDet] = React.useState(null),
    [autre, setAutre] = React.useState(false);

  async function lire(ev) {
    const f = ev.target.files && ev.target.files[0];
    ev.target.value = "";
    if (!f) return;
    setErreur(""), setEtat("lecture");
    try {
      const r = await lireFichierPdf(f);
      if (!r.ops.length || !r.periode)
        throw new Error("aucune opération trouvée : est-ce bien un relevé BoursoBank ?");
      if (r.compte !== "courant")
        throw new Error("c'est un relevé de livret. Seul le relevé du compte courant s'importe.");
      setReleve(r),
        setChoix({}),
        setOff({}),
        setOuvert({}),
        setEdit(null),
        setDet(null),
        setAutre(false),
        setEtat("");
    } catch (e) {
      setEtat(""), setErreur(e && e.message ? e.message : "lecture impossible");
    }
  }

  async function annuler(imp) {
    if (confAnnul !== imp.id) {
      setConfAnnul(imp.id);
      return;
    }
    try {
      await onAnnuler(imp), setConfAnnul(null), fini && fini.id === imp.id && setFini(null);
    } catch (e) {
      setErreur("Annulation impossible : " + (e && e.message ? e.message : "connexion"));
    }
  }

  // ---------- étape 1 : choisir le fichier ----------
  if (!releve || fini) {
    return (
      <KbSheet label="Importer un relevé" onClose={onClose}>
        {fini ? (
          <div
            style={{
              background: "var(--vert-doux)",
              borderRadius: 16,
              padding: 14,
              marginBottom: 16,
              color: "var(--t-vert)",
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            ✓ {fini.n} opérations enregistrées
          </div>
        ) : (
          <p style={{ margin: "0 0 14px", fontSize: 15 }}>
            Choisis le relevé PDF de ton compte courant BoursoBank.
          </p>
        )}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            minHeight: 56,
            borderRadius: 16,
            border: "2px dashed #9ec9cf",
            background: "var(--fond-doux)",
            color: "var(--teal-dark)",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          {accIcone(ICONE_DOC, 22, 2.2)}
          {etat === "lecture"
            ? "Lecture du relevé…"
            : fini
              ? "Importer un autre relevé"
              : "Choisir le relevé PDF"}
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={lire}
            disabled={etat === "lecture"}
            style={KB_SR}
          />
        </label>
        {erreur && (
          <p role="alert" style={{ margin: "0 0 12px", color: "var(--t-rouge)", fontWeight: 700 }}>
            {erreur}
          </p>
        )}
        {(imports || []).length > 0 && (
          <>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink-soft)", margin: "10px 0 6px" }}>
              Imports précédents
            </div>
            {[...imports]
              .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
              .map((imp) => (
                <div
                  key={imp.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700 }}>
                    {MOIS_LONGS[Number(imp.debut.slice(5, 7)) - 1]} {imp.debut.slice(0, 4)}
                    <span className="detail" style={{ display: "block" }}>
                      {imp.nb_operations} opérations
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() => annuler(imp)}
                    style={{
                      minHeight: 44,
                      color: "var(--t-rouge)",
                      borderColor: confAnnul === imp.id ? "var(--c-rouge)" : "var(--rouge-doux)",
                    }}
                  >
                    {confAnnul === imp.id ? "Confirmer l'annulation" : "Annuler l'import"}
                  </button>
                </div>
              ))}
          </>
        )}
      </KbSheet>
    );
  }

  // ---------- étape 2 : aperçu ----------
  const m = moisDepuisAncre(new Date(releve.periode.debut + "T00:00:00")),
    { mois: m0, annee } = anneeMoisDe(m),
    catDe = (w) => {
      const b = (budget || []).find((x) => x.id === ligneBudgetId(w)),
        c = b ? b.categorie : null;
      return c != null ? c : w.kind === "charge" ? "courantes" : null;
    },
    lignesMois = budgetDuMois(budgetMois, budget, m),
    postes = lignesMois.filter((w) => catDe(w) === "courantes" && w.line_key !== "c_sport"),
    lidDe = (p) => {
      const w = postes.find((x) => x.poste === p);
      return w ? ligneBudgetId(w) : null;
    },
    revenu = lignesMois.find((w) => w.kind === "revenu"),
    txMois = (transactions || []).filter((x) => num(x.mois_index) === m),
    dansApp = (lid) =>
      txMois
        .filter((x) => x.budget_line_id === lid)
        .reduce((s, x) => s + montantSigne(x), 0),
    sportAPayer = (items || []).filter(
      (x) => (x.pocket === "sport" || x.pocket === "formation") && !x.paid && itemCompte(x),
    ),
    dejaImporte = (imports || []).find((i) => i.compte === releve.compte && i.debut === releve.periode.debut),
    ops = releve.ops.map((o, i) => {
      let g = choix[i] !== undefined ? choix[i] : classer(o, regles);
      if (g && !SPECIAUX[g] && !lidDe(g)) g = null;
      const signe = o.sens === "debit" ? o.montant : -o.montant;
      let note = null,
        actifDefaut = !!g && g !== "ignorer",
        sport = null;
      if (g === "salaire") {
        actifDefaut = o.sens === "credit" && /salaire/i.test(o.detail.join(" "));
        if (!actifDefaut) note = "pas le salaire du mois : décoché";
      }
      if (g === "sport") {
        sport = sportAPayer.find((x) => Math.abs(num(x.montant_prevu) - o.montant) < 0.01);
        if (sport) note = "→ « " + sport.label + " » payé";
        else (actifDefaut = false), (note = "aucune échéance de ce montant");
      }
      const doublon = g && g !== "ignorer" ? dejaSaisie(o, transactions) : null;
      return {
        ...o,
        i,
        g,
        signe,
        nom: nomOperation(o.libelle),
        actif: actifDefaut ? !off[i] : !!off[i] && off[i] === "on",
        note,
        sport,
        doublon,
      };
    }),
    toggle = (o) => {
      if (o.g === "ignorer" || !o.g) return;
      const x = { ...off };
      const defaut =
        o.g === "salaire"
          ? o.sens === "credit" && /salaire/i.test(o.detail.join(" "))
          : o.g === "sport"
            ? !!o.sport
            : true;
      if (defaut) x[o.i] = !x[o.i];
      else x[o.i] = x[o.i] === "on" ? false : "on";
      setOff(x);
    },
    aChoisir = ops.filter((o) => !o.g),
    groupes = [...postes.map((w) => w.poste), "salaire", "vacances", "sport", "ignorer"]
      .map((g, k) => {
        const list = ops.filter((o) => o.g === g);
        if (!list.length) return null;
        const sp = SPECIAUX[g],
          actifs = list.filter((o) => o.actif),
          tot = actifs.reduce((s, o) => s + o.signe, 0);
        return {
          g,
          list,
          tot,
          l: sp ? sp.l : g,
          c: sp ? sp.c : COULEURS[k % COULEURS.length],
          sous: sp
            ? list.length + " · " + sp.sous
            : list.length +
              " opération" +
              (list.length > 1 ? "s" : "") +
              " · dans l'app : " +
              eur(dansApp(lidDe(g))),
        };
      })
      .filter(Boolean),
    nbActifs = ops.filter((o) => o.actif).length,
    choixPostes = [...postes.map((w) => w.poste), "vacances", "ignorer"];

  async function enregistrer() {
    if (!nbActifs || etat === "enreg" || ops.some((o) => !o.g)) return;
    setEtat("enreg"), setErreur("");
    const actifs = ops.filter((o) => o.actif),
      parPoste = {};
    actifs.filter((o) => !SPECIAUX[o.g]).forEach((o) => (parPoste[o.g] = parPoste[o.g] || []).push(o));
    const fin = releve.periode.fin,
      plan = {
        compte: releve.compte,
        debut: releve.periode.debut,
        fin,
        nb: actifs.length,
        postes: Object.entries(parPoste).map(([p, l]) => ({
          lid: lidDe(p),
          montant: Math.round(l.reduce((s, o) => s + o.signe, 0) * 100) / 100,
          note: noteDesOperations(l),
          date: fin,
        })),
        salaire: (() => {
          const l = actifs.filter((o) => o.g === "salaire");
          return l.length && revenu
            ? {
                lid: ligneBudgetId(revenu),
                montant: Math.round(l.reduce((s, o) => s - o.signe, 0) * 100) / 100,
                date: l[l.length - 1].date,
              }
            : null;
        })(),
        vacances: actifs
          .filter((o) => o.g === "vacances")
          .map((o) => ({ label: o.nom, montant: o.signe, mois: m })),
        sport: actifs
          .filter((o) => o.g === "sport" && o.sport)
          .map((o) => ({ id: o.sport.id, montant: o.montant })),
        regles: Object.keys(choix)
          .map((i) => ({ motif: nomOperation(releve.ops[i].libelle).toUpperCase(), poste: choix[i] }))
          .filter((r) => r.motif.length >= 3 && !/PAYPAL/.test(r.motif)),
      };
    try {
      const imp = await onEnregistrer(plan);
      setFini({ id: imp.id, n: actifs.length }), setReleve(null), setEtat("");
    } catch (e) {
      setEtat(""), setErreur("Enregistrement impossible : " + (e && e.message ? e.message : "connexion"));
    }
  }

  const emoji = (g) =>
      g === "autre"
        ? "⋯"
        : g === "salaire"
          ? "💼"
          : g === "vacances"
            ? "✈️"
            : g === "sport"
              ? "🏋️"
              : g === "ignorer"
                ? "↔"
                : catIcone(g),
    libelleGroupe = (g) =>
      g === "autre" ? "Autre" : SPECIAUX[g] ? (g === "ignorer" ? "Ignorer" : SPECIAUX[g].l) : g,
    courant = aChoisir[0],
    rapides = ["Abonnements", "Plaisir / sorties", "Alimentation", "vacances", "ignorer"].filter(
      (p) => SPECIAUX[p] || lidDe(p),
    ),
    groupeDetail = det ? groupes.find((g) => g.g === det) : null,
    bouton = (p, onPick, clair) => (
      <button
        key={p}
        type="button"
        onClick={onPick}
        style={{
          minHeight: 64,
          border: clair ? "2px solid var(--line)" : 0,
          borderRadius: 16,
          background: clair ? "var(--surface)" : "rgba(255,255,255,.16)",
          color: clair ? "var(--ink)" : "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          fontSize: 12.5,
          fontWeight: 800,
          fontFamily: "inherit",
          cursor: "pointer",
          padding: "4px",
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 20 }}>
          {emoji(p)}
        </span>
        {libelleGroupe(p).replace(" / sorties", "").replace(" & high-tech", "")}
      </button>
    );

  const ligneOp = (o) => (
    <div key={o.i} style={{ borderBottom: "1px solid var(--fond-doux)" }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 14px 4px 4px", minHeight: 52 }}
      >
        <button
          type="button"
          onClick={() => toggle(o)}
          aria-pressed={o.actif ? "true" : "false"}
          aria-label={(o.actif ? "Retirer " : "Ajouter ") + o.nom}
          disabled={o.g === "ignorer"}
          style={{
            flex: "none",
            width: 44,
            height: 44,
            border: 0,
            background: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 7,
              border: "2px solid " + (o.actif ? "var(--teal-dark)" : "var(--line-strong)"),
              background: o.actif ? "var(--teal-dark)" : "var(--surface)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
          >
            {o.actif ? accIcone("M5 12l5 5L20 7", 14, 3.2) : null}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setEdit(edit === o.i ? null : o.i)}
          aria-expanded={edit === o.i ? "true" : "false"}
          aria-label={"Changer le poste de " + o.nom}
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            background: "none",
            padding: 0,
            textAlign: "left",
            color: o.actif || o.g === "ignorer" ? "var(--ink)" : "var(--slate)",
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          <span style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
            <span
              style={{
                flex: "none",
                width: 40,
                fontSize: 12.5,
                fontWeight: 700,
                color: "var(--slate)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {dateCourte(o.dateAchat)}
            </span>
            <span
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 14.5,
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {o.nom}
            </span>
            <span
              style={{
                flex: "none",
                whiteSpace: "nowrap",
                fontSize: 14.5,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                color: o.signe < 0 ? "var(--t-vert)" : undefined,
              }}
            >
              {eur(o.signe)}
            </span>
          </span>
          {(o.doublon || o.note) && (
            <span
              style={{
                display: "block",
                marginLeft: 48,
                fontSize: 12.5,
                fontWeight: 800,
                color: o.doublon ? "var(--t-orange)" : "var(--slate)",
              }}
            >
              {o.doublon
                ? "⚠ déjà saisie ? (" +
                  eur(num(o.doublon.montant)) +
                  " le " +
                  dateCourte(o.doublon.date_depense) +
                  ")"
                : o.note}
            </span>
          )}
        </button>
      </div>
      {edit === o.i && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,minmax(0,1fr))",
            gap: 6,
            padding: "0 14px 12px",
          }}
        >
          {choixPostes.map((p) =>
            bouton(
              p,
              () => {
                setChoix({ ...choix, [o.i]: p }), setEdit(null);
                const x = { ...off };
                delete x[o.i];
                setOff(x);
              },
              true,
            ),
          )}
        </div>
      )}
    </div>
  );

  // ---------- détail d'un poste ----------
  if (groupeDetail) {
    return (
      <KbSheet label={emoji(groupeDetail.g) + " " + groupeDetail.l} onClose={() => setDet(null)}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 6,
          }}
        >
          <span className="detail">{groupeDetail.sous}</span>
          {groupeDetail.g !== "ignorer" && (
            <span
              style={{
                fontFamily: "Georgia,serif",
                fontSize: 22,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {eur(groupeDetail.tot)}
            </span>
          )}
        </div>
        <p className="detail" style={{ margin: "0 0 8px" }}>
          Touche une case pour retirer l'opération, ou son nom pour la changer de poste.
        </p>
        <div style={{ margin: "0 -18px" }}>{groupeDetail.list.map(ligneOp)}</div>
        <div
          style={{
            position: "sticky",
            bottom: -24,
            marginBottom: -24,
            paddingBottom: 24,
            paddingTop: 10,
            background: "var(--surface)",
          }}
        >
          {kbBouton("Retour au relevé", () => setDet(null), { h: 52, icone: "M15 6l-6 6 6 6" })}
        </div>
      </KbSheet>
    );
  }

  // ---------- aperçu ----------
  return (
    <KbSheet label={"Relevé de " + MOIS_LONGS[m0]} onClose={onClose}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginTop: -8,
          marginBottom: 14,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 10px",
            borderRadius: 99,
            background: releve.controle === 0 ? "var(--vert-doux)" : "var(--rouge-doux)",
            color: releve.controle === 0 ? "var(--t-vert)" : "var(--t-rouge)",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          {releve.controle === 0
            ? "✓ " + releve.ops.length + " opérations · solde vérifié"
            : "⚠ le total ne correspond pas au solde"}
        </span>
        <button
          type="button"
          onClick={() => setReleve(null)}
          style={{
            minHeight: 36,
            border: 0,
            background: "none",
            color: "var(--teal-dark)",
            fontWeight: 800,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          Changer de fichier
        </button>
      </div>
      {dejaImporte && (
        <p
          role="alert"
          style={{
            margin: "0 0 12px",
            padding: "10px 12px",
            borderRadius: 14,
            background: "var(--orange-doux)",
            color: "var(--t-orange)",
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          ⚠ Ce relevé a déjà été importé le {new Date(dejaImporte.created_at).toLocaleDateString("fr-FR")}.
        </p>
      )}
      {courant && (
        <section
          aria-label="Opération à classer"
          style={{
            borderRadius: 22,
            background: "var(--teal-dark)",
            color: "#ffffff",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 14,
            boxShadow: "0 10px 24px rgba(10,123,138,.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            <span style={{ letterSpacing: ".06em", textTransform: "uppercase" }}>
              À classer · {aChoisir.length} restante{aChoisir.length > 1 ? "s" : ""}
            </span>
            <span>{dateCourte(courant.dateAchat)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.25 }}>{courant.nom}</span>
            <span
              style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, whiteSpace: "nowrap" }}
            >
              {eur(courant.signe)}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
            {rapides.map((p) => bouton(p, () => setChoix({ ...choix, [courant.i]: p })))}
            {bouton("autre", () => setAutre(!autre))}
          </div>
          {autre && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
              {choixPostes
                .filter((p) => !rapides.includes(p))
                .map((p) =>
                  bouton(p, () => {
                    setChoix({ ...choix, [courant.i]: p }), setAutre(false);
                  }),
                )}
            </div>
          )}
        </section>
      )}
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10, marginBottom: 12 }}
      >
        {groupes
          .filter((g) => g.g !== "ignorer")
          .map((g) => {
            const actifs = g.list.filter((o) => o.actif).length,
              doublons = g.list.filter((o) => o.doublon).length,
              app = SPECIAUX[g.g] ? null : dansApp(lidDe(g.g));
            return (
              <button
                key={g.g}
                type="button"
                onClick={() => setDet(g.g)}
                aria-label={
                  g.l +
                  " : " +
                  eur(g.tot) +
                  ", " +
                  actifs +
                  " opérations cochées sur " +
                  g.list.length +
                  ". Voir le détail"
                }
                style={{
                  position: "relative",
                  border: "2px solid " + (actifs ? "var(--teal-dark)" : "var(--line)"),
                  borderRadius: 18,
                  background: "var(--surface)",
                  padding: 12,
                  minHeight: 108,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 3,
                  textAlign: "left",
                  color: "var(--ink)",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 20 }}>
                  {emoji(g.g)}
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-soft)", lineHeight: 1.2 }}>
                  {g.l}
                </span>
                <span
                  style={{
                    fontFamily: "Georgia,serif",
                    fontSize: 20,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {eur(g.tot)}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--slate)" }}>
                  {actifs}/{g.list.length} op.{app != null ? " · app " + eur(app) : ""}
                </span>
                {doublons > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--t-orange)" }}>
                    ⚠ {doublons} déjà saisie{doublons > 1 ? "s" : ""} ?
                  </span>
                )}
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    background: actifs ? "var(--teal-dark)" : "var(--surface)",
                    border: "2px solid " + (actifs ? "var(--teal-dark)" : "var(--line-strong)"),
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxSizing: "border-box",
                  }}
                >
                  {actifs ? accIcone("M5 12l5 5L20 7", 14, 3.2) : null}
                </span>
              </button>
            );
          })}
      </div>
      {groupes.some((g) => g.g === "ignorer") && (
        <button
          type="button"
          onClick={() => setDet("ignorer")}
          style={{
            width: "100%",
            minHeight: 48,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 14px",
            borderRadius: 16,
            border: 0,
            background: "var(--fond-gris)",
            color: "var(--ink-soft)",
            fontSize: 14,
            fontWeight: 700,
            textAlign: "left",
            fontFamily: "inherit",
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          <span aria-hidden="true">↔</span>
          {ops.filter((o) => o.g === "ignorer").length} virements entre tes comptes · ignorés
        </button>
      )}
      {erreur && (
        <p role="alert" style={{ color: "var(--t-rouge)", fontWeight: 700 }}>
          {erreur}
        </p>
      )}
      <div
        style={{
          position: "sticky",
          bottom: -24,
          marginBottom: -24,
          paddingBottom: 24,
          paddingTop: 10,
          background: "var(--surface)",
          boxShadow: "0 -10px 14px -10px rgba(14,58,66,.18)",
        }}
      >
        {kbBouton(
          courant
            ? "Classe d'abord " + aChoisir.length + " opération" + (aChoisir.length > 1 ? "s" : "")
            : etat === "enreg"
              ? "Enregistrement…"
              : "Enregistrer " + nbActifs + " opération" + (nbActifs > 1 ? "s" : ""),
          enregistrer,
          { disabled: !!courant || !nbActifs || etat === "enreg", h: 56 },
        )}
      </div>
    </KbSheet>
  );
}
