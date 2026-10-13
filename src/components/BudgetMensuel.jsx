import React from "react";
import { AlerteSalaire } from "./AlerteSalaire.jsx";
import { BudgetMoisEditor } from "./BudgetMoisEditor.jsx";
import { alerteSalaire } from "../lib/alerteSalaire.js";
import {
  VISION_DEFICITS,
  budgetDuMois,
  calcsDesPoches,
  formationCalc,
  itemCompte,
  ligneBudgetId,
  planDisponible,
  planEpargne,
  pocheAffichee,
  pocketCalc,
  reelDisponible,
  seuilPoche,
} from "../lib/calculs.js";
import { EP_AUTO_NOTE } from "../lib/epargneAuto.js";
import { exporterBudgetExcel } from "../lib/exportExcel.js";
import { catIcone, euros, hwkFmt, num, param, paramOuDefaut, relevesLivrets } from "../lib/format.js";
import { anneeMoisDe, isoAujourdhui, moisNow } from "../lib/mois.js";
import { exportMoisCSV } from "../lib/outils.js";

export function BudgetMensuel({
  budget,
  budgetMois,
  setBudgetMois,
  transactions,
  poches,
  items,
  params,
  clotures,
  ve: mois,
  readOnly,
  onEditTx,
  onNewTx,
  onAddVacances,
  onSaveVacances,
  onDelVacances,
  onAddFormation,
  onPatchItem,
  onAddTx,
  onUpdateTx,
  onPasVerse,
  onCloturer,
  onRouvrir,
}) {
  const [exportEtat, setExportEtat] = React.useState(""),
    [clotEtape, setClotEtape] = React.useState(""),
    [clotMsg, setClotMsg] = React.useState(""),
    [pasVerseId, setPasVerseId] = React.useState(null);
  const [moisSel, setMoisSel] = React.useState(moisNow()),
    [fDesc, setFDesc] = React.useState(""),
    [fMontant, setFMontant] = React.useState(""),
    [fMois, setFMois] = React.useState(moisNow()),
    [fEtat, setFEtat] = React.useState(""),
    [modalOuverte, setModalOuverte] = React.useState(null),
    [ajusterOuvert, setAjusterOuvert] = React.useState(!1),
    [vacDesc, setVacDesc] = React.useState(""),
    [vacMontant, setVacMontant] = React.useState(""),
    [vacEtat, setVacEtat] = React.useState(""),
    [vacEdit, setVacEdit] = React.useState(null);
  if (!budget)
    return (
      <section className="sec">
        <h2>Budget mensuel</h2>
        <p className="sub">Chargement du budget…</p>
      </section>
    );
  const n = mois.length,
    allerA = (i) => {
      setMoisSel(Math.max(0, Math.min(n - 1, i))),
        setModalOuverte(null),
        setVacEdit(null),
        setVacEtat(""),
        setClotEtape(""),
        setClotMsg("");
    },
    ferme = (clotures || []).some((x) => x.mois_index === moisSel),
    lignes = budgetDuMois(budgetMois, budget, moisSel),
    catDe = (w) => {
      const m = budget.find((b) => b.id === ligneBudgetId(w)),
        c = m ? m.categorie : null;
      return c != null ? c : w.kind === "charge" ? "courantes" : w.kind === "epargne" ? "epargne" : null;
    },
    txMois = (transactions || []).filter((x) => num(x.mois_index) === moisSel),
    txDe = (id) =>
      txMois
        .filter((x) => x.budget_line_id === id)
        .sort((a, b) => (b.date_depense || "").localeCompare(a.date_depense || "")),
    reelDe = (id) =>
      txDe(id).reduce((s, x) => s + (x.type === "remboursement" ? -num(x.montant) : num(x.montant)), 0),
    rembOk = (w) => /santé|sante|transport/i.test((w && w.poste) || ""),
    avecReel = (l) =>
      l.map((w) => ({
        ...w,
        lid: ligneBudgetId(w),
        b: num(w.montant),
        r: reelDe(ligneBudgetId(w)),
      })),
    courantes = avecReel(lignes.filter((w) => catDe(w) === "courantes" && w.line_key !== "c_sport"))
      .filter((w) => w.b !== 0 || w.r !== 0)
      .sort((a, b) => (a.poste || "").localeCompare(b.poste || "", "fr")),
    epargne = avecReel(lignes.filter((w) => catDe(w) === "epargne")),
    somme = (l, k) => l.reduce((s, w) => s + w[k], 0),
    totC = {
      b: somme(courantes, "b"),
      r: somme(courantes, "r"),
    },
    totE = {
      b: somme(epargne, "b"),
      r: somme(epargne, "r"),
    },
    sorties = {
      b: totC.b + totE.b,
      r: totC.r + totE.r,
    },
    revenus = lignes.filter((w) => w.kind === "revenu"),
    salaire = revenus.reduce((s, w) => s + num(w.montant), 0),
    salaireReel = revenus.some((w) => txDe(ligneBudgetId(w)).length)
      ? revenus.reduce((s, w) => s + reelDe(ligneBudgetId(w)), 0)
      : null,
    reste = salaire - sorties.b,
    pocheVac = (poches || []).find((p) => p.cle === "vacances"),
    vacActive = pocheVac ? pocheAffichee(pocheVac) : !0,
    vacCalc = pocketCalc(items, "vacances", paramOuDefaut(params, "provision_vacances_mensuelle"), n),
    vacSolde = vacCalc.solde[moisSel],
    vacPrec = moisSel > 0 ? vacCalc.solde[moisSel - 1] : null,
    vacPayes = (items || [])
      .filter((x) => x.pocket === "vacances" && itemCompte(x) && x.paid && num(x.mois_index) === moisSel)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0)),
    calcs = calcsDesPoches(poches, items, params, n),
    rawReel = relevesLivrets(params, n),
    planArr = planEpargne(items, params, n),
    epReel = reelDisponible(rawReel, calcs, moisSel),
    epDispo = planDisponible(planArr, calcs, moisSel),
    { annee, mois: m0 } = anneeMoisDe(moisSel),
    dateDefaut =
      moisSel === moisNow() ? isoAujourdhui() : annee + "-" + String(m0 + 1).padStart(2, "0") + "-01",
    nombre = (v) => Number(String(v).replace(/\s/g, "").replace(",", ".")),
    fTotal = param(params, "enveloppe_formation", 0),
    fItems = (items || [])
      .filter((x) => x.pocket === "formation" || x.pocket === "sport")
      .sort((a, b) => num(a.mois_index) - num(b.mois_index) || (a.sort || 0) - (b.sort || 0)),
    fMt = (x) => (x.montant_reel != null && x.paid ? num(x.montant_reel) : num(x.montant_prevu)),
    fPaye = fItems.filter((x) => x.paid).reduce((s, x) => s + fMt(x), 0),
    fAVenir = fItems
      .filter((x) => !x.paid && (x.statut || "actif") === "actif")
      .reduce((s, x) => s + fMt(x), 0),
    fReste = fTotal - fPaye;
  async function enregistrerSalaire(brut) {
    if (String(brut).trim() === "") return;
    const v = nombre(brut);
    if (!(v >= 0)) {
      setFEtat("");
      return;
    }
    const ids = revenus.map(ligneBudgetId),
      txs = txMois.filter((x) => ids.includes(x.budget_line_id)),
      dFin = new Date(annee, m0 + 1, 0),
      dateFin = annee + "-" + String(m0 + 1).padStart(2, "0") + "-" + String(dFin.getDate()).padStart(2, "0");
    if (txs.length && num(txs[0].montant) === v) return;
    try {
      txs.length
        ? await onUpdateTx(txs[0].id, {
            montant: v,
          })
        : revenus.length &&
          (await onAddTx({
            budget_line_id: ids[0],
            montant: v,
            note: "Salaire réel",
            date_depense: dateFin,
          }));
    } catch (e) {
      window.alert("Salaire non enregistré : " + (e && e.message ? e.message : "connexion"));
    }
  }
  async function fPatch(it, patch, msg) {
    setFEtat("");
    try {
      await onPatchItem(it.id, patch), msg && setFEtat(msg);
    } catch (e) {
      setFEtat("Échec de l'enregistrement : " + (e && e.message ? e.message : "connexion") + ".");
    }
  }
  async function fAjouter() {
    const m = nombre(fMontant);
    if (!fDesc.trim() || !(m > 0)) {
      setFEtat("Indique une description et un montant.");
      return;
    }
    try {
      await onAddFormation(fDesc.trim(), m, fMois),
        setFDesc(""),
        setFMontant(""),
        setFEtat("✓ Dépense à faire ajoutée");
    } catch (e) {
      setFEtat("Échec de l'enregistrement : " + (e && e.message ? e.message : "connexion") + ".");
    }
  }
  async function depenser() {
    const m = nombre(vacMontant);
    if (!vacDesc.trim() || !(m > 0)) {
      setVacEtat("Indique une description et un montant.");
      return;
    }
    setVacEtat("Enregistrement…");
    try {
      await onAddVacances(vacDesc.trim(), m, moisSel),
        setVacDesc(""),
        setVacMontant(""),
        setVacEtat("✓ " + euros(m) + " retiré de la provision vacances");
    } catch (e) {
      setVacEtat("Échec de l'enregistrement : " + (e && e.message ? e.message : "connexion") + ". Réessaie.");
    }
  }
  async function enregistrerVac() {
    const m = nombre(vacEdit.montant);
    if (!String(vacEdit.label).trim() || !(m > 0)) {
      setVacEtat("Indique une description et un montant.");
      return;
    }
    try {
      await onSaveVacances(vacEdit.id, {
        label: String(vacEdit.label).trim(),
        montant_prevu: m,
        montant_reel: m,
      }),
        setVacEdit(null),
        setVacEtat("✓ Corrigé");
    } catch (e) {
      setVacEtat("Échec de l'enregistrement : " + (e && e.message ? e.message : "connexion") + ".");
    }
  }
  async function supprimerVac(it) {
    if (!window.confirm("Supprimer « " + it.label + " » ?")) return;
    try {
      await onDelVacances(it.id), setVacEtat("Supprimé — la provision est recréditée");
    } catch (e) {
      setVacEtat("Suppression impossible : " + (e && e.message ? e.message : "connexion") + ".");
    }
  }
  async function exporter() {
    try {
      setExportEtat("…");
      await exporterBudgetExcel(budget, budgetMois, transactions, items, params);
      setExportEtat("");
    } catch (e) {
      setExportEtat("");
      window.alert(
        "Export Excel impossible : " +
          (e && e.message ? e.message : "connexion") +
          ". Je télécharge le mois en CSV à la place.",
      );
      exporterCSV();
    }
  }
  function exporterCSV() {
    const l = [
      ["Vision — budget mensuel"],
      ["Mois", mois[moisSel]],
      [],
      ["Poste", "Budget", "Réalisé", "Écart"],
      ["DÉPENSES COURANTES"],
    ];
    courantes.forEach((w) => l.push([w.poste, w.b, w.r, w.b - w.r]));
    l.push(["Total courantes", totC.b, totC.r, totC.b - totC.r], [], ["ÉPARGNE PROGRAMMÉE"]);
    epargne.forEach((w) => l.push([w.poste, w.b, w.r, ""]));
    l.push([], ["SOLDE", sorties.b, sorties.r, ""]);
    l.push([
      "SALAIRE MENSUEL (net)",
      salaire,
      salaireReel == null ? "" : salaireReel,
      salaireReel == null ? "" : salaireReel - sorties.r,
    ]);
    l.push([], ["Provision Vacances", Math.round(vacSolde * 100) / 100]);
    vacPayes.forEach((it) =>
      l.push(["  " + it.label, "", -num(it.montant_reel != null ? it.montant_reel : it.montant_prevu), ""]),
    );
    l.push(["Épargne disponible", Math.round(epDispo * 100) / 100]);
    exportMoisCSV(mois[moisSel], l);
  }
  const btnPoste = {
      background: "none",
      border: 0,
      padding: 0,
      font: "inherit",
      color: "var(--teal-dark)",
      cursor: "pointer",
      textAlign: "left",
      textDecoration: "underline",
      textUnderlineOffset: 3,
    },
    thNum = {
      textAlign: "right",
    },
    ecartTd = (x) => <td className={"num " + (x >= 0 ? "ok" : "low")}>{(x > 0 ? "+" : "") + euros(x)}</td>,
    posteTd = (w) => (
      <td>
        <button style={btnPoste} onClick={() => setModalOuverte(w.lid)}>
          {catIcone(w.poste)} {w.poste}
        </button>
      </td>
    ),
    carte = (titre, valeur, classe, sous) => (
      <div
        className="card"
        style={{
          textAlign: "center",
          padding: "10px 6px",
          margin: 0,
        }}
      >
        <div
          className={classe}
          style={{
            fontFamily: "Georgia,serif",
            fontWeight: 700,
            fontSize: "1.1rem",
          }}
        >
          {valeur}
        </div>
        <div
          style={{
            fontSize: 10.5,
            color: "var(--slate)",
            textTransform: "uppercase",
            letterSpacing: ".05em",
            fontWeight: 600,
          }}
        >
          {titre}
        </div>
        {sous && (
          <div
            className="detail"
            style={{
              fontSize: 11.5,
              marginTop: 2,
            }}
          >
            {sous}
          </div>
        )}
      </div>
    ),
    ligneModal = modalOuverte ? [...courantes, ...epargne].find((w) => w.lid === modalOuverte) : null;
  return (
    <section className="sec">
      <h2>Budget mensuel</h2>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          margin: "8px 0 14px",
        }}
      >
        <button
          className="btn-outline btn-sm"
          disabled={moisSel <= 0}
          onClick={() => allerA(moisSel - 1)}
          aria-label="Mois précédent"
        >
          ←
        </button>
        <select
          className="bsel"
          style={{
            flex: 1,
            textAlign: "center",
          }}
          value={moisSel}
          aria-label="Mois"
          onChange={(g) => allerA(Number(g.target.value))}
        >
          {mois.map((lab, i) => (
            <option value={i} key={i}>
              {lab}
            </option>
          ))}
        </select>
        <button
          className="btn-outline btn-sm"
          disabled={moisSel >= n - 1}
          onClick={() => allerA(moisSel + 1)}
          aria-label="Mois suivant"
        >
          →
        </button>
        <button
          className="btn-outline btn-sm"
          onClick={exporter}
          disabled={!!exportEtat}
          aria-label="Télécharger le tableau Excel (BUDGET_TABLEAU)"
          title="Télécharger le tableau Excel (BUDGET_TABLEAU)"
        >
          {exportEtat || "↓"}
        </button>
      </div>
      <AlerteSalaire
        a={alerteSalaire(budget, budgetMois, transactions, moisSel)}
        moisLabel={mois[moisSel]}
        vacSolde={vacSolde}
        onAjuster={readOnly || ferme ? null : () => setAjusterOuvert(!0)}
      />
      <div
        className="sumrow"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 8,
          marginBottom: 16,
        }}
        role="group"
        aria-label={"Résumé de " + mois[moisSel]}
      >
        {carte(
          "Provision vacances",
          euros(vacSolde),
          vacSolde < seuilPoche(params) ? "low" : "",
          vacPrec != null ? "Fin " + mois[moisSel - 1] + " : " + euros(vacPrec) : "Cumul de la poche",
        )}
        {carte("ÉPARGNE", euros(epDispo), "", "Départ fin août + épargne versée")}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div
          className="h3"
          style={{
            margin: 0,
          }}
        >
          DÉPENSES COURANTES
        </div>
        {!readOnly && (
          <button className="btn-outline btn-sm" onClick={() => setAjusterOuvert(!ajusterOuvert)}>
            {ajusterOuvert ? "Fermer l'ajustement" : "Ajuster le budget de " + mois[moisSel]}
          </button>
        )}
      </div>
      {!readOnly && ajusterOuvert && (
        <div
          style={{
            marginTop: 10,
          }}
        >
          <BudgetMoisEditor
            moisIndex={moisSel}
            rows={budgetMois}
            setRows={setBudgetMois}
            modele={budget}
            verrouille={ferme}
          />
        </div>
      )}
      <div
        className="card"
        style={{
          padding: 0,
          overflowX: "auto",
          marginTop: 10,
        }}
      >
        <table className="tbl">
          <thead>
            <tr>
              <th>Poste</th>
              <th style={thNum}>Budget</th>
              <th style={thNum}>Réalisé</th>
              <th style={thNum}>Écart</th>
            </tr>
          </thead>
          <tbody>
            {courantes.map((w) => (
              <tr key={w.lid}>
                {posteTd(w)}
                <td className="num">{euros(w.b)}</td>
                <td className="num">{euros(w.r)}</td>
                {ecartTd(w.b - w.r)}
              </tr>
            ))}
            <tr className="total">
              <td>Total courantes</td>
              <td className="num">{euros(totC.b)}</td>
              <td className="num">{euros(totC.r)}</td>
              {ecartTd(totC.b - totC.r)}
            </tr>
          </tbody>
        </table>
      </div>
      <div
        className="h3"
        style={{
          marginTop: 18,
        }}
      >
        ÉPARGNE PROGRAMMÉE
      </div>
      <div
        className="card"
        style={{
          padding: 0,
          overflowX: "auto",
        }}
      >
        <table className="tbl">
          <thead>
            <tr>
              <th>Poste</th>
              <th style={thNum}>Budget</th>
              <th style={thNum}>Réalisé</th>
            </tr>
          </thead>
          <tbody>
            {epargne.map((w) => (
              <tr key={w.lid}>
                {posteTd(w)}
                <td className="num">{euros(w.b)}</td>
                <td className="num">{euros(w.r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        className="h3"
        style={{
          marginTop: 18,
        }}
      >
        SOLDE
      </div>
      <div
        className="card"
        style={{
          padding: 0,
          overflowX: "auto",
        }}
      >
        <table className="tbl">
          <thead>
            <tr>
              <th>Poste</th>
              <th style={thNum}>Budget</th>
              <th style={thNum}>Réalisé</th>
              <th style={thNum}>Écart</th>
            </tr>
          </thead>
          <tbody>
            <tr className="total">
              <td>SOLDE</td>
              <td className="num">{euros(sorties.b)}</td>
              <td className="num">{euros(sorties.r)}</td>
              <td />
            </tr>
            <tr>
              <td
                style={{
                  fontWeight: 700,
                }}
              >
                SALAIRE MENSUEL (net)
              </td>
              <td className="num">{euros(salaire)}</td>
              <td className="num">
                {readOnly ? (
                  salaireReel == null ? (
                    "—"
                  ) : (
                    euros(salaireReel)
                  )
                ) : (
                  <input
                    key={moisSel + "|" + (salaireReel == null ? "" : salaireReel)}
                    className="bedit bnum"
                    inputMode="decimal"
                    placeholder="✏️ réel"
                    aria-label={"Salaire réel de " + mois[moisSel]}
                    defaultValue={salaireReel == null ? "" : String(salaireReel).replace(".", ",")}
                    onBlur={(g) => enregistrerSalaire(g.target.value)}
                    onKeyDown={(g) => {
                      g.key === "Enter" && g.target.blur();
                    }}
                  />
                )}
              </td>
              {salaireReel == null ? <td className="num">—</td> : ecartTd(salaireReel - sorties.r)}
            </tr>
          </tbody>
        </table>
      </div>
      <div
        className="detail"
        style={{
          marginTop: 6,
        }}
      >
        SOLDE = dépenses courantes + épargne programmée. Écart salaire = salaire réel − SOLDE réalisé.
      </div>
      {vacActive && (
        <>
          <div
            className="h3"
            style={{
              marginTop: 18,
            }}
          >
            DÉPENSES VACANCES
          </div>
          <div className="card">
            <p
              style={{
                marginTop: 0,
              }}
            >
              {"Provision vacances disponible : "}
              <b className={vacSolde < seuilPoche(params) ? "low" : "ok"}>{euros(vacSolde)}</b>
            </p>
            {vacPayes.length ? (
              vacPayes.map((it) =>
                vacEdit && vacEdit.id === it.id ? (
                  <div className="brow" key={it.id}>
                    <input
                      className="bedit lbl"
                      value={vacEdit.label}
                      aria-label="Description"
                      onChange={(g) =>
                        setVacEdit({
                          ...vacEdit,
                          label: g.target.value,
                        })
                      }
                    />
                    <input
                      className="bedit bnum"
                      inputMode="decimal"
                      value={vacEdit.montant}
                      aria-label="Montant"
                      onChange={(g) =>
                        setVacEdit({
                          ...vacEdit,
                          montant: g.target.value,
                        })
                      }
                    />
                    <button className="btn btn-sm" onClick={enregistrerVac}>
                      Enregistrer
                    </button>
                    <button className="btn-outline btn-sm" onClick={() => setVacEdit(null)}>
                      Annuler
                    </button>
                  </div>
                ) : (
                  <div
                    className="txrow"
                    style={{
                      cursor: "default",
                    }}
                    key={it.id}
                  >
                    <span
                      style={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      {it.label}
                    </span>
                    <span className="m">
                      {"−" + euros(it.montant_reel != null ? it.montant_reel : it.montant_prevu)}
                    </span>
                    {!readOnly && (
                      <span
                        style={{
                          display: "flex",
                          gap: 6,
                        }}
                      >
                        <button
                          className="btn-icon"
                          aria-label={"Corriger " + it.label}
                          onClick={() =>
                            setVacEdit({
                              id: it.id,
                              label: it.label || "",
                              montant: String(it.montant_reel != null ? it.montant_reel : it.montant_prevu),
                            })
                          }
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon danger"
                          aria-label={"Supprimer " + it.label}
                          onClick={() => supprimerVac(it)}
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                ),
              )
            ) : num(VISION_DEFICITS[moisSel]) < 0 ? null : (
              <div className="detail">{"Aucune dépense vacances en " + mois[moisSel] + "."}</div>
            )}
            {num(VISION_DEFICITS[moisSel]) < 0 && (
              <div
                className="txrow"
                style={{
                  cursor: "default",
                }}
              >
                <span
                  style={{
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  {"Dépassement du salaire (SOLDE réalisé > salaire réel)"}
                </span>
                <span className="m low">{euros(VISION_DEFICITS[moisSel])}</span>
              </div>
            )}
            {!readOnly && (
              <div
                className="brow"
                style={{
                  marginTop: 12,
                }}
              >
                <input
                  className="bedit lbl"
                  placeholder="Description (ex. billet d'avion)"
                  value={vacDesc}
                  aria-label="Description de la dépense vacances"
                  onChange={(g) => setVacDesc(g.target.value)}
                />
                <input
                  className="bedit bnum"
                  inputMode="decimal"
                  placeholder="Montant"
                  value={vacMontant}
                  aria-label="Montant de la dépense vacances"
                  onChange={(g) => setVacMontant(g.target.value)}
                  onKeyDown={(g) => {
                    g.key === "Enter" && depenser();
                  }}
                />
                <button className="btn btn-sm" onClick={depenser}>
                  Dépenser
                </button>
              </div>
            )}
            {vacEtat && (
              <div
                className="detail"
                style={{
                  marginTop: 8,
                }}
              >
                {vacEtat}
              </div>
            )}
            <div
              className="detail"
              style={{
                marginTop: 8,
              }}
            >
              Chaque dépense vacances est retirée automatiquement de la provision vacances.
            </div>
          </div>
        </>
      )}
      {fTotal > 0 && (
        <>
          <div
            className="h3"
            style={{
              marginTop: 18,
            }}
          >
            ENVELOPPE FORMATION + SPORT
          </div>
          <div className="card">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 6,
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              {[
                ["Enveloppe", euros(fTotal), ""],
                ["Déjà payé", euros(fPaye), ""],
                ["Reste dans l'enveloppe", euros(fReste), fReste >= 0 ? "ok" : "low"],
              ].map(([lab, val, cl]) => (
                <div key={lab}>
                  <div
                    className={cl}
                    style={{
                      fontFamily: "Georgia,serif",
                      fontWeight: 700,
                    }}
                  >
                    {val}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "var(--slate)",
                      textTransform: "uppercase",
                    }}
                  >
                    {lab}
                  </div>
                </div>
              ))}
            </div>
            <div
              className="detail"
              style={{
                marginBottom: 6,
              }}
            >
              {"Reste à payer : "}
              {euros(fAVenir)}
              {" · Il restera en fin d'année : "}
              <b className={fReste - fAVenir >= 0 ? "ok" : "low"}>{euros(fReste - fAVenir)}</b>
            </div>
            {fItems.map((it) => {
              const annule = (it.statut || "actif") === "abandonne" || it.statut === "reporte";
              return (
                <div
                  className="txrow"
                  style={{
                    cursor: "default",
                  }}
                  key={it.id}
                >
                  <span
                    style={{
                      minWidth: 0,
                      flex: 1,
                      textDecoration: annule ? "line-through" : "none",
                      color: annule ? "var(--slate)" : "inherit",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      {it.label}
                    </span>
                    <span
                      className="detail"
                      style={{
                        display: "block",
                        textDecoration: "none",
                      }}
                    >
                      {mois[num(it.mois_index)] + " · " + (it.paid ? "payé" : annule ? "annulé" : "à payer")}
                    </span>
                  </span>
                  <span
                    className="m"
                    style={{
                      color: annule ? "var(--slate)" : "inherit",
                    }}
                  >
                    {euros(fMt(it))}
                  </span>
                  {!readOnly && (
                    <span
                      style={{
                        display: "flex",
                        gap: 6,
                      }}
                    >
                      {!annule && (
                        <button
                          className={it.paid ? "btn btn-sm" : "btn-outline btn-sm"}
                          onClick={() =>
                            fPatch(
                              it,
                              it.paid
                                ? {
                                    paid: !1,
                                  }
                                : {
                                    paid: !0,
                                    montant_reel:
                                      it.montant_reel != null ? it.montant_reel : it.montant_prevu,
                                  },
                              it.paid
                                ? "Paiement retiré — remis dans l'enveloppe"
                                : "✓ Payé — retiré de l'enveloppe",
                            )
                          }
                        >
                          {it.paid ? "✓ Payé" : "Payer"}
                        </button>
                      )}
                      {!it.paid && (
                        <button
                          className="btn-outline btn-sm"
                          onClick={() =>
                            fPatch(
                              it,
                              annule
                                ? {
                                    statut: "actif",
                                    date_effet: null,
                                    raison: null,
                                  }
                                : {
                                    statut: "abandonne",
                                    date_effet: isoAujourdhui(),
                                  },
                              annule ? "Réactivé" : "Annulé — le montant reste dans l'enveloppe",
                            )
                          }
                        >
                          {annule ? "Réactiver" : "Annuler"}
                        </button>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
            {!readOnly && (
              <div
                className="brow"
                style={{
                  marginTop: 12,
                  flexWrap: "wrap",
                }}
              >
                <input
                  className="bedit lbl"
                  placeholder="Dépense à faire (ex. SCAP S2)"
                  value={fDesc}
                  aria-label="Description de la dépense formation"
                  onChange={(g) => setFDesc(g.target.value)}
                />
                <input
                  className="bedit bnum"
                  inputMode="decimal"
                  placeholder="Montant"
                  value={fMontant}
                  aria-label="Montant de la dépense formation"
                  onChange={(g) => setFMontant(g.target.value)}
                />
                <select
                  className="bsel"
                  value={fMois}
                  aria-label="Mois de la dépense formation"
                  onChange={(g) => setFMois(Number(g.target.value))}
                >
                  {mois.map((lab, i) => (
                    <option value={i} key={i}>
                      {lab}
                    </option>
                  ))}
                </select>
                <button className="btn btn-sm" onClick={fAjouter}>
                  Ajouter
                </button>
              </div>
            )}
            {fEtat && (
              <div
                className="detail"
                style={{
                  marginTop: 8,
                }}
              >
                {fEtat}
              </div>
            )}
            <div
              className="detail"
              style={{
                marginTop: 8,
              }}
            >
              L'enveloppe ne se remplit jamais : chaque paiement la diminue. Un cours annulé laisse son
              montant dans l'enveloppe.
            </div>
          </div>
        </>
      )}
      {(() => {
        const cl = (clotures || []).find((x) => x.mois_index === moisSel),
          sn = (cl && cl.snapshot) || {},
          passe = moisSel <= moisNow(),
          form = formationCalc(items, params, n),
          sport = pocketCalc(items, "sport", 0, n, !0),
          deficit = (VISION_DEFICITS || [])[moisSel] || 0,
          lignesC = cl
            ? [
                ["Dépenses courantes", sn.budgetCourantes, sn.realiseCourantes],
                ["Épargne programmée", sn.budgetEpargne, sn.epargneVersee],
                ["Salaire", sn.salaire, sn.salaireReel],
                ["Dépassement du salaire", null, sn.depassementSalaire],
                ["Provision vacances", null, sn.vacSolde],
                ["Épargne fin de mois", null, sn.plan],
              ]
            : [];
        async function clore() {
          if (clotEtape !== "confirmer") {
            setClotEtape("confirmer"), setClotMsg("");
            return;
          }
          setClotEtape("encours");
          try {
            await onCloturer(moisSel, {
              mode: "excel",
              budgetCourantes: totC.b,
              realiseCourantes: totC.r,
              budgetEpargne: totE.b,
              epargneVersee: totE.r,
              salaire,
              salaireReel,
              depassementSalaire: deficit,
              plan: epDispo,
              reel: epDispo,
              ecart: null,
              vacPrevu: vacCalc.prevu[moisSel],
              vacReel: vacCalc.reel[moisSel],
              vacSolde,
              formPrevu: form.prevu[moisSel],
              formReel: form.reel[moisSel],
              formSolde: form.solde[moisSel],
              sportPrevu: sport.prevu[moisSel],
              sportReel: sport.reel[moisSel],
              sportSolde: sport.solde[moisSel],
              closedAtLabel: new Date().toISOString(),
            });
            setClotEtape(""), setClotMsg(mois[moisSel] + " est clôturé.");
          } catch (e) {
            setClotEtape(""), setClotMsg("Échec : " + (e && e.message ? e.message : "connexion"));
          }
        }
        async function rouvrir() {
          if (clotEtape !== "rouvrir") {
            setClotEtape("rouvrir"), setClotMsg("");
            return;
          }
          setClotEtape("encours");
          try {
            await onRouvrir(moisSel),
              setClotEtape(""),
              setClotMsg(mois[moisSel] + " est rouvert. Pense à le clôturer de nouveau.");
          } catch (e) {
            setClotEtape(""), setClotMsg("Échec : " + (e && e.message ? e.message : "connexion"));
          }
        }
        if (!cl && !passe) return null;
        const dateCl = sn.closedAtLabel
          ? new Intl.DateTimeFormat("fr-FR", {
              day: "numeric",
              month: "long",
            }).format(new Date(sn.closedAtLabel))
          : "";
        return (
          <>
            <div
              className="h3"
              style={{
                marginTop: 18,
              }}
            >
              CLÔTURE DU MOIS
            </div>
            <div
              className="card"
              style={
                cl
                  ? {
                      borderColor: "#0b6e53",
                      background: "#f2faf6",
                    }
                  : void 0
              }
            >
              {cl ? (
                <>
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontWeight: 800,
                      color: "#0b6e53",
                      fontSize: 15,
                    }}
                  >
                    {"🔒 "}
                    {mois[moisSel]}
                    {" est clôturé"}
                    {dateCl ? " depuis le " + dateCl : ""}. Ses chiffres sont figés.
                  </p>
                  {sn.mode === "excel" ? (
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Poste</th>
                          <th
                            style={{
                              textAlign: "right",
                            }}
                          >
                            Budget
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                            }}
                          >
                            Réalisé
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lignesC.map(([lib, bgt, rl]) => (
                          <tr key={lib}>
                            <td>{lib}</td>
                            <td className="num">{bgt == null ? "" : euros(bgt)}</td>
                            <td
                              className="num"
                              style={{
                                fontWeight: 700,
                              }}
                            >
                              {rl == null ? "—" : euros(rl)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p
                      className="detail"
                      style={{
                        margin: 0,
                      }}
                    >
                      {"Clôturé avec l'ancienne méthode : épargne " +
                        euros(sn.plan) +
                        ", provision vacances " +
                        euros(sn.vacSolde) +
                        (sn.depassementSalaire != null
                          ? ", dépassement du salaire " + euros(sn.depassementSalaire)
                          : "") +
                        "."}
                    </p>
                  )}
                  {!readOnly && (
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={rouvrir}
                      disabled={clotEtape === "encours"}
                      style={{
                        width: "100%",
                        marginTop: 12,
                        minHeight: 46,
                        color: clotEtape === "rouvrir" ? "#b8432a" : void 0,
                        borderColor: clotEtape === "rouvrir" ? "#b8432a" : void 0,
                      }}
                    >
                      {clotEtape === "rouvrir" ? "Confirmer : rouvrir " + mois[moisSel] : "Rouvrir ce mois"}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontSize: 14.5,
                    }}
                  >
                    {clotEtape === "confirmer"
                      ? "Les chiffres du tableau ci-dessus seront figés pour " +
                        mois[moisSel] +
                        ". Tu pourras rouvrir le mois si besoin."
                      : "Clôturer fige les chiffres de ce tableau : dépenses, épargne, salaire, provision vacances. Aucun relevé à saisir."}
                  </p>
                  {!readOnly && (
                    <button
                      type="button"
                      className="btn"
                      onClick={clore}
                      disabled={clotEtape === "encours"}
                      style={{
                        width: "100%",
                        minHeight: 50,
                      }}
                    >
                      {clotEtape === "encours"
                        ? "Clôture…"
                        : clotEtape === "confirmer"
                          ? "Confirmer la clôture de " + mois[moisSel]
                          : "🔒 Clôturer " + mois[moisSel]}
                    </button>
                  )}
                  {clotEtape === "confirmer" && (
                    <button
                      type="button"
                      onClick={() => setClotEtape("")}
                      style={{
                        width: "100%",
                        minHeight: 44,
                        marginTop: 6,
                        border: 0,
                        background: "none",
                        color: "var(--ink-soft)",
                        fontWeight: 700,
                        fontFamily: "inherit",
                        cursor: "pointer",
                      }}
                    >
                      Annuler
                    </button>
                  )}
                </>
              )}
              {clotMsg ? (
                <p
                  role="status"
                  style={{
                    margin: "10px 0 0",
                    fontWeight: 700,
                    color: clotMsg.startsWith("Échec") ? "#b8432a" : "#0b6e53",
                  }}
                >
                  {clotMsg}
                </p>
              ) : null}
            </div>
          </>
        );
      })()}
      {ligneModal && (
        <div
          className="sheetbg"
          onClick={(g) => {
            g.target === g.currentTarget && setModalOuverte(null);
          }}
        >
          <div className="sheet">
            <div className="sheethead">
              <h3>
                {catIcone(ligneModal.poste)} {ligneModal.poste}
              </h3>
              <button className="sheetclose" onClick={() => setModalOuverte(null)} aria-label="Fermer">
                ×
              </button>
            </div>
            <div
              className="detail"
              style={{
                marginBottom: 10,
              }}
            >
              {mois[moisSel]}
              {" · Budget "}
              {euros(ligneModal.b)}
              {" · Réalisé "}
              {euros(ligneModal.r)}
              {catDe(ligneModal) === "courantes" ? (
                <span className={ligneModal.b - ligneModal.r >= 0 ? "ok" : "low"}>
                  {" · Écart "}
                  {euros(ligneModal.b - ligneModal.r)}
                </span>
              ) : null}
            </div>
            {txDe(ligneModal.lid).length ? (
              txDe(ligneModal.lid).map((x) =>
                x.note === EP_AUTO_NOTE ? (
                  <div
                    className="txrow"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                    key={x.id}
                  >
                    <span
                      style={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                        }}
                      >
                        {"Virement automatique · " + euros(x.montant)}
                      </span>
                      <span
                        className="detail"
                        style={{
                          display: "block",
                        }}
                      >
                        {"Le " + hwkFmt(x.date_depense)}
                      </span>
                    </span>
                    {!readOnly && (
                      <button
                        type="button"
                        className="btn-outline btn-sm"
                        style={{
                          flex: "none",
                          minHeight: 44,
                          color: pasVerseId === x.id ? "#b8432a" : void 0,
                          borderColor: pasVerseId === x.id ? "#b8432a" : void 0,
                        }}
                        onClick={async () => {
                          if (pasVerseId !== x.id) {
                            setPasVerseId(x.id);
                            return;
                          }
                          try {
                            await onPasVerse(x), setPasVerseId(null);
                          } catch (e) {
                            window.alert("Échec : " + (e && e.message ? e.message : "connexion"));
                          }
                        }}
                      >
                        {pasVerseId === x.id ? "Confirmer : pas versé" : "Pas versé"}
                      </button>
                    )}
                  </div>
                ) : (
                  <button className="txrow" disabled={readOnly} onClick={() => onEditTx(x)} key={x.id}>
                    <span
                      style={{
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                        }}
                      >
                        {(x.type === "remboursement" ? "↩︎ " : "") +
                          (x.note || (x.type === "remboursement" ? "Remboursement" : ligneModal.poste))}
                      </span>
                      <span
                        className="detail"
                        style={{
                          display: "block",
                        }}
                      >
                        {hwkFmt(x.date_depense) + (x.type === "remboursement" ? " · remboursement" : "")}
                      </span>
                    </span>
                    <span className={"m" + (x.type === "remboursement" ? " ok" : "")}>
                      {(x.type === "remboursement" ? "−" : "") + euros(x.montant)}
                    </span>
                  </button>
                ),
              )
            ) : (
              <div className="detail">{"Aucune dépense saisie pour ce poste en " + mois[moisSel] + "."}</div>
            )}
            {!readOnly && (
              <button
                className="btn"
                style={{
                  width: "100%",
                  marginTop: 14,
                }}
                onClick={() =>
                  onNewTx({
                    budget_line_id: ligneModal.lid,
                    date_depense: dateDefaut,
                  })
                }
              >
                + Ajouter une dépense
              </button>
            )}
            {!readOnly && rembOk(ligneModal) && (
              <button
                className="btn-outline"
                style={{
                  width: "100%",
                  marginTop: 8,
                }}
                onClick={() =>
                  onNewTx({
                    budget_line_id: ligneModal.lid,
                    date_depense: dateDefaut,
                    type: "remboursement",
                  })
                }
              >
                ↩︎ + Ajouter un remboursement
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
