import React from "react";
import {
  ACC_ETAPES,
  ACC_ORDRE,
  ACC_THEMES,
  HW_ETAPES,
  KB_I,
  KB_INPUT,
  KB_SR,
  KbEtapes,
  KbLane,
  KbPill,
  KbSheet,
  KbToast,
  PIECE_ETAPES,
  SUIVI_ETAPES,
  accEcheance,
  accIcone,
  accIso,
  kbBouton,
  kbChip,
  kbCompteurs,
  kbFlash,
  kbRaccourcis,
  kbToggleBtn,
} from "./communs.jsx";
import { VISION_CONFIG } from "../../config.js";
import { alerteSalaire } from "../../lib/alerteSalaire.js";
import {
  budgetDuMois,
  calcsDesPoches,
  getCible,
  ligneBudgetId,
  planDisponible,
  planEpargne,
  montantSigne,
  pocketCalc,
  tauxVacances,
} from "../../lib/calculs.js";
import { eurosCourt, num, paramOuDefaut } from "../../lib/format.js";
import { MOIS, moisNow } from "../../lib/mois.js";
import { lireProfil, ongletVisible } from "../../lib/profil.js";

export // ============================================================
// ACCUEIL
// ============================================================
function Accueil({
  budget,
  budgetMois,
  transactions,
  items,
  params,
  ongletsLecture,
  poches,
  progress,
  pieceEtapes,
  contenu,
  hw,
  taches,
  readOnly,
  goTab,
  onAdd,
  onUpdate,
  onDelete,
  onHwStatus,
  onPieceEtape,
  onSuiviToggle,
}) {
  // Thèmes affichés = onglets affichés ; « Reconversion » devient « Parcours » pour les autres comptes.
  const nomReco = lireProfil(contenu).existe ? "Parcours" : "Reconversion";
  (ACC_THEMES.reco.l = nomReco), (ACC_THEMES.reco.short = lireProfil(contenu).existe ? "Parcours" : "Reconv.");
  // En lecture seule (lien partagé) : seulement les parties partagées, sans le couloir Budget.
  const themesVisibles = Object.keys(ACC_THEMES).filter((k) =>
    ongletsLecture ? k !== "budget" && ongletsLecture.includes(ACC_THEMES[k].tab) : ongletVisible(params, ACC_THEMES[k].tab),
  );
  const [selKey, setSelKey] = React.useState(null),
    [ajout, setAjout] = React.useState(!1),
    [titre, setTitre] = React.useState(""),
    [theme, setTheme] = React.useState("budget"),
    [quand, setQuand] = React.useState(""),
    [voirTout, setVoirTout] = React.useState({}),
    [confSuppr, setConfSuppr] = React.useState(!1),
    [toast, setToast] = React.useState("");
  const flash = kbFlash(setToast);

  // ---- chiffres du haut (masqués en mode partage) ----
  const n = MOIS.length,
    M = moisNow();
  let kpis = null;
  if (!readOnly && budget) {
    const calcs = calcsDesPoches(poches, items, params, n),
      epargne = planDisponible(planEpargne(items, params, n), calcs, M),
      cible = getCible(params, budget),
      vac = pocketCalc(items, "vacances", tauxVacances(params), n).solde[M],
      catDe = (w) => {
        const m = budget.find((b) => b.id === ligneBudgetId(w)),
          c = m ? m.categorie : null;
        return c != null ? c : w.kind === "charge" ? "courantes" : w.kind === "epargne" ? "epargne" : null;
      },
      lignes = budgetDuMois(budgetMois, budget, M).filter(
        (w) => catDe(w) === "courantes" && w.line_key !== "c_sport",
      ),
      ids = lignes.map(ligneBudgetId),
      reel = (transactions || [])
        .filter((x) => num(x.mois_index) === M && ids.includes(x.budget_line_id))
        .reduce((s, x) => s + montantSigne(x), 0),
      reste = lignes.reduce((s, w) => s + num(w.montant), 0) - reel,
      al = alerteSalaire(budget, budgetMois, transactions, M);
    kpis = [
      {
        l: "Objectif 6 mois",
        v: (cible ? Math.round((epargne / cible) * 100) : 0) + " %",
        c: "var(--t-teal)",
        i: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01",
      },
      {
        l: "Vacances",
        v: eurosCourt(vac),
        c: "var(--t-orange)",
        i: "M3 20h18M5 20l4-11 3 5 3-3 4 9M15 6a2 2 0 1 0 0-.01",
      },
      al.niveau === "rouge"
        ? {
            l: "Salaire dépassé",
            v: eurosCourt(al.reste),
            c: "var(--t-rouge)",
            alerte: "rouge",
            i: "M12 3.5 2.8 19.5h18.4zM12 10v4.2M12 17h.01",
          }
        : al.niveau === "orange"
          ? {
              l: "Avant le salaire",
              v: eurosCourt(al.reste),
              c: "var(--t-orange)",
              alerte: "orange",
              i: "M12 3.5 2.8 19.5h18.4zM12 10v4.2M12 17h.01",
            }
          : {
              l: "Reste du mois",
              v: eurosCourt(reste),
              c: reste < 0 ? "var(--t-rouge)" : "var(--t-vert)",
              alerte: reste < 0 ? "rouge" : null,
              i: ACC_THEMES.budget.i,
            },
    ];
  }

  // ---- toutes les tâches, quelle que soit leur origine ----
  const hwEt = (s) => HW_ETAPES.find((x) => x.k === s) || HW_ETAPES[0],
    pieceEt = (k) => (pieceEtapes && pieceEtapes[k]) || (progress && progress[k] ? "validee" : "afournir"),
    cartes = [];
  (hw || []).forEach((r) => {
    const et = hwEt(r.status);
    cartes.push({
      key: "hw:" + r.id,
      src: "hw",
      id: r.id,
      t: r.title || r.subject || "Devoir",
      sous: r.subject,
      theme: "devoirs",
      etape: et.kan,
      sEt: et,
      val: et.k,
      due: r.deadline,
      faitLe: r.corrected_at || r.submitted_at || r.updated_at,
    });
  });
  (contenu || [])
    .filter((x) => x.type === "piece" || x.type === "suivi")
    .forEach((x) => {
      if (x.type === "piece") {
        const v = pieceEt(x.item_key),
          et = PIECE_ETAPES.find((e) => e.k === v);
        cartes.push({
          key: x.item_key,
          src: "piece",
          t: x.titre,
          sous: (x.groupe || "").split(" — ")[0],
          theme: "pieces",
          etape: et.kan,
          sEt: et,
          val: v,
          due: x.date_iso,
          faitLe: null,
        });
      } else {
        const v = progress && progress[x.item_key] ? "fait" : "afaire",
          et = SUIVI_ETAPES.find((e) => e.k === v);
        cartes.push({
          key: x.item_key,
          src: "suivi",
          t: x.titre,
          theme: "reco",
          etape: v,
          sEt: et,
          val: v,
          due: x.date_iso,
          faitLe: null,
        });
      }
    });
  (taches || []).forEach((x) => {
    const et = ACC_ETAPES.find((e) => e.k === x.etape) || ACC_ETAPES[0];
    cartes.push({
      key: "t:" + x.id,
      src: "tache",
      id: x.id,
      t: x.titre,
      theme: ACC_THEMES[x.theme] ? x.theme : "budget",
      etape: et.k,
      sEt: et,
      val: et.k,
      due: x.echeance,
      faitLe: x.fait_le,
    });
  });
  const septJours = 7 * 864e5,
    ancien = (c) =>
      c.etape === "fait" && (!c.faitLe || Date.now() - new Date(c.faitLe).getTime() > septJours),
    enRetard = (c) => c.etape !== "fait" && !!(c.due && (accEcheance(c.due) || {}).late),
    enCours = cartes.filter((c) => c.etape === "encours").length;
  const prochaine = cartes
    .filter((c) => c.etape !== "fait" && c.due)
    .map((c) => ({
      c,
      e: accEcheance(c.due),
    }))
    .sort((a, b) => a.e.j - b.e.j)[0];
  const sel = cartes.find((c) => c.key === selKey);
  function ouvrir(c) {
    if (readOnly) {
      c.src !== "tache" && goTab(ACC_THEMES[c.theme].tab);
      return;
    }
    setConfSuppr(!1), setSelKey(c.key);
  }
  const erreur = (err) => flash("Échec : " + (err && err.message ? err.message : "connexion"));
  async function choisir(c, k) {
    if (c.val === k) {
      setSelKey(null);
      return;
    }
    const et =
        c.src === "hw"
          ? HW_ETAPES
          : c.src === "piece"
            ? PIECE_ETAPES
            : c.src === "suivi"
              ? SUIVI_ETAPES
              : ACC_ETAPES,
      cible = et.find((x) => x.k === k),
      kan = cible.kan || cible.k;
    if (kan === "encours" && c.etape !== "encours" && enCours >= 3) {
      flash("3 tâches en cours maximum");
      return;
    }
    try {
      if (c.src === "tache")
        await onUpdate(c.id, {
          etape: k,
          fait_le: k === "fait" ? new Date().toISOString() : null,
        });
      else if (c.src === "hw") await onHwStatus(c.id, k);
      else if (c.src === "piece") await onPieceEtape(c.key, k);
      else await onSuiviToggle(c.key);
      setSelKey(null), flash(c.t + " → " + cible.l);
    } catch (err) {
      erreur(err);
    }
  }
  // Un seul tap : passe la tâche à « fait », quelle que soit son origine.
  function faitEnUnTap(c) {
    const liste =
        c.src === "hw" ? HW_ETAPES : c.src === "piece" ? PIECE_ETAPES : c.src === "suivi" ? SUIVI_ETAPES : ACC_ETAPES,
      cible = liste.find((x) => (x.kan || x.k) === "fait");
    if (cible) choisir(c, cible.k);
  }
  async function supprimer(c) {
    if (!confSuppr) {
      setConfSuppr(!0);
      return;
    }
    try {
      await onDelete(c.id), setSelKey(null), flash("Tâche supprimée");
    } catch (err) {
      erreur(err);
    }
  }
  async function ajouter() {
    const tt = titre.trim();
    if (!tt) {
      flash("Écris un titre");
      return;
    }
    try {
      await onAdd({
        titre: tt,
        theme,
        etape: "afaire",
        echeance: quand || null,
      });
      setAjout(!1), setTitre(""), setQuand(""), flash("Ajoutée dans " + ACC_THEMES[theme].l);
    } catch (err) {
      erreur(err);
    }
  }
  const ouvrirAjout = (th) => {
    setTheme(th || "budget"), setTitre(""), setQuand(""), setAjout(!0);
  };
  const aujD = new Date(),
    choixQuand = [
      {
        k: "",
        l: "Sans date",
      },
      {
        k: accIso(aujD),
        l: "Aujourd'hui",
      },
    ].concat(kbRaccourcis().slice(1)),
    dateDuJour = new Intl.DateTimeFormat(VISION_CONFIG.locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(aujD);
  const couloirs = themesVisibles.map((key) => {
    const th = ACC_THEMES[key],
      liste = cartes
        .filter((c) => c.theme === key)
        .sort(
          (a, b) =>
            (enRetard(b) ? 1 : 0) - (enRetard(a) ? 1 : 0) ||
            ACC_ORDRE[a.etape] - ACC_ORDRE[b.etape] ||
            (
              accEcheance(a.due) || {
                j: 9999,
              }
            ).j -
              (
                accEcheance(b.due) || {
                  j: 9999,
                }
              ).j,
        ),
      faits = liste.filter((c) => c.etape === "fait").length,
      caches = liste.filter(ancien).length,
      ouvert = !!voirTout[key],
      visibles = ouvert ? liste : liste.filter((c) => !ancien(c)),
      libre = key === "budget" || key === "sport";
    return (
      <KbLane
        titre={th.l}
        icone={th.i}
        c={th.c}
        soft={th.soft}
        ratio={faits + "/" + liste.length}
        pct={liste.length ? Math.round((faits / liste.length) * 100) : 0}
        onHeader={() => goTab(th.tab)}
        headerAria={th.l + " : " + faits + " faites sur " + liste.length + ". Ouvrir l'onglet " + th.page}
        onAdd={!readOnly && libre ? () => ouvrirAjout(key) : null}
        addAria={"Ajouter une tâche " + th.l}
        vide={!liste.length && !readOnly}
        onVide={() => (libre ? ouvrirAjout(key) : goTab(th.tab))}
        videLabel={libre ? "Ajouter une tâche" : "Ajouter dans " + th.page}
        key={key}
      >
        {visibles.map((c) => (
          <KbPill
            titre={c.t}
            etape={c.sEt}
            couleur={th.c}
            soft={th.soft}
            due={c.due}
            fini={c.etape === "fait"}
            onClick={() => ouvrir(c)}
            key={c.key}
          />
        ))}
        {caches
          ? kbToggleBtn(
              ouvert ? "Masquer" : "+" + caches + " faite" + (caches > 1 ? "s" : ""),
              ouvert
                ? "Masquer les tâches faites anciennes"
                : "Voir " + caches + " tâche(s) faite(s) de plus de 7 jours",
              () =>
                setVoirTout(
                  Object.assign({}, voirTout, {
                    [key]: !ouvert,
                  }),
                ),
            )
          : null}
        {!liste.length && readOnly ? (
          <span className="detail" key="vide">
            Rien pour l'instant
          </span>
        ) : null}
      </KbLane>
    );
  });
  const selEtapes = sel
    ? sel.src === "hw"
      ? HW_ETAPES
      : sel.src === "piece"
        ? PIECE_ETAPES
        : sel.src === "suivi"
          ? SUIVI_ETAPES
          : ACC_ETAPES
    : [];
  return (
    <section className="sec">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
            }}
          >
            Accueil
          </h2>
          <div className="detail">{dateDuJour.charAt(0).toUpperCase() + dateDuJour.slice(1)}</div>
        </div>
        {!readOnly && (
          <div
            style={{
              flex: "none",
            }}
          >
            {kbBouton("Tâche", () => ouvrirAjout("budget"), {
              icone: KB_I.plus,
              h: 46,
              width: "auto",
            })}
          </div>
        )}
      </div>
      {kpis && (
        <button
          type="button"
          onClick={() => goTab("tresorerie")}
          aria-label={kpis.map((k) => k.l + " " + k.v).join(", ") + ". Ouvrir Budget mois"}
          style={{
            border: 0,
            background: "none",
            padding: 0,
            width: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(3,minmax(0,1fr))",
            gap: 8,
            marginBottom: 14,
            fontFamily: "inherit",
            cursor: "pointer",
            color: "var(--ink)",
          }}
        >
          {kpis.map((k) => (
            <span
              style={{
                background: k.alerte === "rouge" ? "var(--rouge-doux)" : k.alerte === "orange" ? "var(--orange-doux)" : "var(--surface)",
                borderRadius: 18,
                padding: "14px 6px 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                boxShadow: "var(--shadow)",
                border:
                  "2px solid " +
                  (k.alerte === "rouge" ? "var(--c-rouge)" : k.alerte === "orange" ? "var(--c-orange)" : "transparent"),
              }}
              key={k.l}
            >
              <span
                style={{
                  color: k.c,
                  display: "flex",
                }}
              >
                {accIcone(k.i, 18, 2.2)}
              </span>
              <span
                style={{
                  fontFamily: "Georgia,serif",
                  fontSize: 24,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                  color: k.alerte ? k.c : "var(--ink)",
                }}
              >
                {k.v}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: k.alerte ? k.c : "var(--slate)",
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {k.l}
              </span>
            </span>
          ))}
        </button>
      )}
      {prochaine && (
        <div
          className="prochaine"
          style={{
            border: prochaine.e.late ? "3px solid #ffd2c7" : 0,
            background: prochaine.e.late ? "var(--c-rouge)" : "var(--teal-dark)",
          }}
        >
          <button
            type="button"
            className="p-main"
            onClick={() => ouvrir(prochaine.c)}
            aria-label={"Prochaine échéance : " + prochaine.c.t + ", " + prochaine.e.aria}
          >
            <span
              style={{
                flex: "none",
                width: 46,
                height: 46,
                borderRadius: 15,
                background: "rgba(255,255,255,.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {accIcone(ACC_THEMES[prochaine.c.theme].i, 22, 2)}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  fontFamily: "Georgia,serif",
                  fontSize: 18,
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {prochaine.c.t}
              </span>
              <span
                style={{
                  display: "inline-block",
                  marginTop: 5,
                  padding: "2px 9px",
                  borderRadius: 99,
                  background: "var(--surface)",
                  color: prochaine.e.urgent ? "var(--t-rouge)" : "var(--teal-dark)",
                  fontSize: 12.5,
                  fontWeight: 900,
                }}
              >
                {prochaine.e.l}
              </span>
            </span>
          </button>
          {!readOnly && (
            <button
              type="button"
              className="p-fait"
              onClick={() => faitEnUnTap(prochaine.c)}
              aria-label={"Marquer fait : " + prochaine.c.t}
            >
              {accIcone("M5 12.5l4.5 4.5L19 7.5", 18, 3)}
              Fait
            </button>
          )}
        </div>
      )}
      {kbCompteurs(cartes, ACC_ETAPES, "", null, (k) => cartes.filter((c) => c.etape === k).length)}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {couloirs}
      </div>
      {sel && (
        <KbSheet label={sel.t} onClose={() => setSelKey(null)}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                padding: "3px 10px",
                borderRadius: 99,
                background: ACC_THEMES[sel.theme].soft,
                color: ACC_THEMES[sel.theme].c,
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {ACC_THEMES[sel.theme].l + (sel.sous ? " · " + sel.sous : "")}
            </span>
            {accEcheance(sel.due) && sel.etape !== "fait" ? (
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: 99,
                  background: accEcheance(sel.due).urgent ? "var(--rouge-doux)" : "var(--fond-gris)",
                  color: accEcheance(sel.due).urgent ? "var(--t-rouge)" : "var(--ink-soft)",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                {accEcheance(sel.due).l}
              </span>
            ) : null}
          </div>
          <KbEtapes etapes={selEtapes} actuelle={sel.val} onPick={(k) => choisir(sel, k)} />
          {sel.src === "tache"
            ? kbBouton(confSuppr ? "Confirmer la suppression" : "Supprimer la tâche", () => supprimer(sel), {
                outline: !0,
                fg: "var(--t-rouge)",
                bd: confSuppr ? "var(--c-rouge)" : "var(--rouge-doux)",
                h: 48,
              })
            : kbBouton(
                "Ouvrir l'onglet " + ACC_THEMES[sel.theme].page,
                () => {
                  setSelKey(null), goTab(ACC_THEMES[sel.theme].tab);
                },
                {
                  outline: !0,
                  icone: KB_I.chevron,
                  h: 48,
                },
              )}
        </KbSheet>
      )}
      {ajout && (
        <KbSheet label="Nouvelle tâche" onClose={() => setAjout(!1)} form={!0} onSubmit={ajouter}>
          <label htmlFor="acc-titre" style={KB_SR}>
            Titre de la tâche
          </label>
          <input
            id="acc-titre"
            data-autofocus="1"
            value={titre}
            onChange={(ev) => setTitre(ev.target.value)}
            placeholder="Ex. Envoyer l'attestation"
            autoComplete="off"
            style={{
              ...KB_INPUT,
              height: 52,
              marginBottom: 14,
            }}
          />
          <div
            role="group"
            aria-label="Thème"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(" + themesVisibles.length + ",minmax(0,1fr))",
              gap: 6,
              marginBottom: 14,
            }}
          >
            {themesVisibles.map((key) => {
              const th = ACC_THEMES[key],
                on = key === theme;
              return (
                <button
                  type="button"
                  onClick={() => setTheme(key)}
                  aria-pressed={on ? "true" : "false"}
                  style={{
                    border: 0,
                    background: "none",
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                    color: th.c,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                  key={key}
                >
                  <span
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      border: "2px solid " + th.c,
                      background: on ? th.c : "var(--surface)",
                      color: on ? "#ffffff" : th.c,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxSizing: "border-box",
                    }}
                  >
                    {accIcone(th.i, 22, 2)}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {th.short}
                  </span>
                </button>
              );
            })}
          </div>
          <div
            role="group"
            aria-label="Échéance"
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 16,
            }}
          >
            {choixQuand.map((w) =>
              kbChip(w.l, w.k === quand, () => setQuand(w.k), {
                fontSize: 13,
              }),
            )}
          </div>
          {kbBouton("Ajouter", null, {
            type: "submit",
            icone: KB_I.plus,
            disabled: !titre.trim(),
            h: 54,
          })}
        </KbSheet>
      )}
      <KbToast texte={toast} />
    </section>
  );
}

// ============================================================
// PIÈCES
// ============================================================
