import React from "react";
import { VisionAssets } from "../assets/images.js";
import { VISION_CONFIG } from "../config.js";
import {
  ITEM_STATUTS,
  budgetDuMois,
  calcsDesPoches,
  formationCalc,
  getCible,
  itemCompte,
  planDisponible,
  planEpargne,
  pocheAffichee,
  pocheCalcDe,
  pocketCalc,
  reelDisponible,
  salaireMensuel,
  seuilEpargne,
  seuilPoche,
  statutLibelle,
} from "../lib/calculs.js";
import {
  eurosCourt,
  num,
  param,
  paramOuDefaut,
  releveDuMois,
  relevesLivrets,
  totalParType,
} from "../lib/format.js";
import { MOIS, isoAujourdhui, moisNow } from "../lib/mois.js";
import { debounceSave } from "../lib/outils.js";

export function LignesModele({
  titre: t,
  kind: e,
  budget: r,
  editLine: n,
  saveLine: s,
  addLine: i,
  removeLine: o,
  readOnly: a,
}) {
  const l = r.filter((u) => u.kind === e);
  return (
    <>
      <div className="bgrouplab">{t}</div>
      {l.map((u) => (
        <div className="brow" key={u.id}>
          <div className="bcol">
            <input
              className="bedit lbl"
              disabled={a}
              value={u.poste}
              onChange={(c) =>
                n(u.id, {
                  poste: c.target.value,
                })
              }
              onBlur={() => s(u.id)}
            />
            <input
              className="bedit"
              style={{
                width: "100%",
                fontSize: 12,
                marginTop: 2,
              }}
              disabled={a}
              value={u.detail || ""}
              placeholder="détail (ex. EDF 28 · ENGIE 98)"
              aria-label={"Détail de " + u.poste}
              onChange={(c) =>
                n(u.id, {
                  detail: c.target.value,
                })
              }
              onBlur={() => s(u.id)}
            />
          </div>
          <input
            className="bedit bnum"
            type="number"
            inputMode="numeric"
            disabled={a}
            value={u.montant}
            onChange={(c) =>
              n(u.id, {
                montant: c.target.value,
              })
            }
            onBlur={() => s(u.id)}
          />
          {!a && (
            <button className="bdel" onClick={() => o(u.id)} aria-label="Supprimer">
              ×
            </button>
          )}
        </div>
      ))}
      {!a && (
        <button className="badd" onClick={() => i(e)}>
          + Ajouter une ligne
        </button>
      )}
    </>
  );
}

export function AutresOutils(t) {
  const {
    budget: e,
    params: r,
    voyages: n,
    items: itemsAll,
    clotures: clAll,
    audit: auditAll,
    spend: spendAll,
    savings: savingsAll,
    saveSpend: saveSpendFn,
    editLine: editLineFn2,
    saveLine: saveLineFn2,
    addLine: addLineFn,
    removeLine: removeLineFn,
    editVoyage: editVoyageFn,
    saveVoyage: saveVoyageFn,
    addVoyage: addVoyageFn,
    removeVoyage: removeVoyageFn,
    transactions: txAll,
    onEditTx: onEditTx,
    budgetMois: bmAll,
    setBudgetMois: setBmAll,
    poches: pochesRows,
    setPoches: setPochesRows,
    editPoche: pocheEditFn,
    savePoche: pocheSaveFn,
    addPoche: pocheAddFn,
    delPoche: pocheDelFn,
    addSaving: addSavingFn,
    saveSaving: saveSavingFn,
    delSaving: delSavingFn,
    saveLine: saveLineFn,
    editLine: editLineFn,
    editParam: l,
    saveParam: u,
    editItem: ei,
    saveItem: si,
    addItem: ai,
    removeItem: ri,
    addCloture: acl,
    readOnly: v,
  } = t;
  // Les blocs "Détail par mois" étaient des <details> non contrôlés : à chaque
  // re-rendu (annulation, changement de mois) ils se refermaient tout seuls.
  // On mémorise ici quels mois sont ouverts pour que ça ne bouge plus.
  const [montrerArchivees, setMontrerArchivees] = React.useState(!1),
    [moisOuverts, setMoisOuverts] = React.useState({}),
    [etatSave, setEtatSave] = React.useState("");
  const flashSave = (txt = "Enregistré") => {
    setEtatSave(txt), setTimeout(() => setEtatSave((p) => (p === txt ? "" : p)), 2500);
  };
  // Modifie à l'écran tout de suite, enregistre 800 ms après la dernière frappe.
  const eiAuto = (id, patch, savePatch) => {
    ei(id, patch),
      setEtatSave("Modification en cours…"),
      debounceSave("item:" + id, () => si(id, savePatch || patch).then(() => flashSave()));
  };
  if (!e)
    return (
      <section className="sec">
        <h2>Trésorerie</h2>
        <p className="sub">Chargement du budget…</p>
      </section>
    );
  const items = itemsAll || [],
    clotures = clAll || [],
    cloture = (m) => clotures.find((x) => x.mois_index === m),
    isClosed = (m) => !!cloture(m),
    k = totalParType(e, "charge"),
    margeSecu = salaireMensuel(e) - k - totalParType(e, "epargne"),
    M = moisNow(),
    rawReel = relevesLivrets(r, MOIS.length),
    vac = pocketCalc(items, "vacances", paramOuDefaut(r, "provision_vacances_mensuelle"), MOIS.length),
    form = formationCalc(items, r, MOIS.length),
    sport = pocketCalc(items, "sport", 0, MOIS.length, !0),
    epg = pocketCalc(items, "epargne", 0, MOIS.length),
    pocheCalcs = calcsDesPoches(pochesRows, items, r, MOIS.length),
    pocheVacances = (pochesRows || []).find((p) => p.cle === "vacances"),
    plan = planEpargne(items, r, MOIS.length),
    curPlan = planDisponible(plan, pocheCalcs, M),
    curReelRaw = releveDuMois(r, M),
    curHasReel = curReelRaw !== "" && curReelRaw != null,
    curHV = reelDisponible(rawReel, pocheCalcs, M),
    curEcart = 0,
    curPoche = vac.solde[M],
    curForm = form.solde[M],
    curSport = sport.solde[M],
    lastSaved = param(r, "last_saved_at", 0),
    lastSavedLabel = lastSaved
      ? new Intl.DateTimeFormat(VISION_CONFIG.locale, {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(lastSaved))
      : null,
    dernierMoisMaj = (() => {
      for (let w = MOIS.length - 1; w >= 0; w--) if (rawReel[w] != null) return w;
      return -1;
    })(),
    [moisSel, setMoisSel] = React.useState(M),
    [reelInput, setReelInput] = React.useState(curReelRaw === "" ? "" : String(curReelRaw)),
    [saving, setSaving] = React.useState(!1),
    [closing, setClosing] = React.useState(!1),
    [justClosed, setJustClosed] = React.useState(!1),
    [msg, setMsg] = React.useState(""),
    selClosed = isClosed(moisSel),
    enAttente = items
      .filter((x) => !x.paid && num(x.mois_index) <= moisSel)
      .sort((a, b) => num(a.mois_index) - num(b.mois_index));
  React.useEffect(() => {
    const rr = releveDuMois(r, moisSel);
    setReelInput(rr === "" ? "" : String(rr));
  }, [moisSel]);
  async function enregistrer() {
    const val = parseFloat(String(reelInput).replace(",", "."));
    if (Number.isNaN(val)) {
      setMsg("Entre un montant valide.");
      return;
    }
    setSaving(!0), setMsg("");
    await u("reel_" + moisSel, val), await u("last_saved_at", Date.now());
    setSaving(!1), setMsg("ok");
  }
  async function cloturer() {
    if (!curHasReelSel()) return;
    setClosing(!0);
    const hv = reelDisponible(rawReel, pocheCalcs, moisSel),
      planD = planDisponible(plan, pocheCalcs, moisSel);
    await acl(moisSel, {
      plan: planD,
      reel: planD,
      ecart: null,
      vacPrevu: vac.prevu[moisSel],
      vacReel: vac.reel[moisSel],
      vacSolde: vac.solde[moisSel],
      formPrevu: form.prevu[moisSel],
      formReel: form.reel[moisSel],
      formSolde: form.solde[moisSel],
      sportPrevu: sport.prevu[moisSel],
      sportReel: sport.reel[moisSel],
      sportSolde: sport.solde[moisSel],
      closedAtLabel: new Date().toISOString(),
    });
    setClosing(!1), setJustClosed(!0), setTimeout(() => setJustClosed(!1), 6e3);
  }
  function curHasReelSel() {
    const rr = releveDuMois(r, moisSel);
    return rr !== "" && rr != null;
  }
  async function togglePaid(it) {
    const patch = {
      paid: !it.paid,
      montant_reel: !it.paid
        ? it.montant_reel != null
          ? it.montant_reel
          : it.montant_prevu
        : it.montant_reel,
    };
    ei(it.id, patch), await si(it.id, patch);
  }

  // Changer l'état d'un poste du plan : actif, terminé, abandonné, reporté.
  // Plus de « — annulé » écrit dans le libellé : c'est une donnée, avec sa
  // date d'effet et sa raison, et le montant d'origine n'est jamais perdu.
  async function setStatut(it, statut) {
    const patch = {
      statut,
      date_effet: it.date_effet || isoAujourdhui(),
    };
    statut === "actif" && ((patch.date_effet = null), (patch.raison = null));
    ei(it.id, patch),
      await si(it.id, patch),
      flashSave(statut === "actif" ? "Poste réactivé" : "Poste " + statutLibelle(statut).toLowerCase());
  }
  async function setRaison(it, raison) {
    ei(it.id, {
      raison,
    }),
      await si(it.id, {
        raison,
      });
  }
  async function setDateEffet(it, date_effet) {
    ei(it.id, {
      date_effet,
    }),
      await si(it.id, {
        date_effet,
      });
  }
  async function siFlash(id, patch) {
    await si(id, patch), flashSave();
  }
  function Pocket({ title, pocket, calc, note, showMonthly }) {
    const list = items
      .filter((x) => x.pocket === pocket)
      .sort((a, b) => num(a.mois_index) - num(b.mois_index) || (a.sort || 0) - (b.sort || 0));
    return (
      <details className="collapsible">
        <summary>{title}</summary>
        <div className="inner">
          {note && (
            <p
              className="sub"
              style={{
                marginTop: 0,
              }}
            >
              {note}
            </p>
          )}
          <table className="tbl">
            <thead>
              <tr>
                <th>Mois</th>
                <th className="num">Prévu</th>
                <th className="num">{pocket === "epargne" ? "Écart" : "Réel"}</th>
                {pocket !== "epargne" && <th className="num">Solde</th>}
              </tr>
            </thead>
            <tbody>
              {MOIS.map((label, i) => {
                const snap = cloture(i);
                if (pocket === "epargne") {
                  const ec = null,
                    pl = snap ? snap.snapshot.plan : planDisponible(plan, pocheCalcs, i);
                  return (
                    <tr className={i === moisSel ? "total" : ""} key={i}>
                      <td>{label + (snap ? " 🔒" : "")}</td>
                      <td className="num">{eurosCourt(pl)}</td>
                      <td className={"num" + (ec == null ? "" : ec >= 0 ? " ok" : " low")}>
                        {ec == null
                          ? "—"
                          : (Math.abs(ec) > seuilEpargne(r) ? "⚠ " : "") +
                            (ec >= 0 ? "+" : "") +
                            eurosCourt(ec)}
                      </td>
                    </tr>
                  );
                }
                const key = pocket === "vacances" ? "vac" : pocket === "sport" ? "sport" : "form",
                  prevu = snap ? snap.snapshot[key + "Prevu"] : calc.prevu[i],
                  reel = snap ? snap.snapshot[key + "Reel"] : calc.reel[i],
                  solde = snap ? snap.snapshot[key + "Solde"] : calc.solde[i];
                return (
                  <tr className={i === moisSel ? "total" : ""} key={i}>
                    <td>{label + (snap ? " 🔒" : "")}</td>
                    <td className="num">{eurosCourt(prevu)}</td>
                    <td className="num">{eurosCourt(reel)}</td>
                    <td className={"num" + (solde < seuilPoche(r) ? " low" : "")}>{eurosCourt(solde)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!v &&
            (() => {
              const byMonth = {};
              list.forEach((it) => {
                (byMonth[it.mois_index] = byMonth[it.mois_index] || []).push(it);
              });
              const months = Object.keys(byMonth)
                .map(Number)
                .sort((a, b) => a - b);
              return (
                <div
                  style={{
                    marginTop: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--slate)",
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Détail par mois
                  </div>
                  <div className="savebar">
                    <span
                      className={"savetag " + (etatSave === "Enregistré" ? "on" : etatSave ? "wait" : "")}
                      style={
                        etatSave
                          ? {}
                          : {
                              visibility: "hidden",
                            }
                      }
                    >
                      {etatSave === "Enregistré" ? "✓ Enregistré" : etatSave || "—"}
                    </span>
                  </div>
                  <div className="editable-hint">
                    Les champs sur fond gris sont modifiables : clique dessus pour corriger un libellé ou un
                    montant. Tout s'enregistre automatiquement.
                  </div>
                  {months.map((mi) => {
                    const its = byMonth[mi],
                      total = its.reduce(
                        (s, x) => s + (x.paid ? (x.montant_reel ?? x.montant_prevu) : x.montant_prevu),
                        0,
                      );
                    return (
                      <details
                        className="collapsible"
                        open={!!moisOuverts[mi]}
                        onToggle={(ev) =>
                          setMoisOuverts((p) =>
                            p[mi] === ev.target.open
                              ? p
                              : {
                                  ...p,
                                  [mi]: ev.target.open,
                                },
                          )
                        }
                        style={{
                          marginBottom: 8,
                        }}
                        key={mi}
                      >
                        <summary>
                          {MOIS[mi] + " — " + its.length + " poste" + (its.length > 1 ? "s" : "")}
                          <span
                            style={{
                              color: "var(--slate)",
                              fontWeight: 400,
                              marginLeft: 8,
                            }}
                          >
                            {eurosCourt(total)}
                          </span>
                        </summary>
                        <div className="inner">
                          {its.map((it) => (
                            <div
                              style={{
                                opacity: itemCompte(it) ? 1 : 0.55,
                                display: "flex",
                                gap: 6,
                                alignItems: "center",
                                marginBottom: 8,
                                flexWrap: "wrap",
                                paddingBottom: 8,
                                borderBottom: "1px solid var(--line)",
                              }}
                              key={it.id}
                            >
                              <input
                                aria-label="Libellé"
                                value={it.label}
                                onChange={(g) =>
                                  eiAuto(it.id, {
                                    label: g.target.value,
                                  })
                                }
                                onBlur={(g) =>
                                  siFlash(it.id, {
                                    label: g.target.value,
                                  })
                                }
                                style={{
                                  flex: "1 1 140px",
                                  padding: 8,
                                  borderRadius: 8,
                                  border: "1px solid var(--line)",
                                  fontSize: 13,
                                }}
                              />
                              <select
                                aria-label="Mois"
                                value={it.mois_index}
                                onChange={(g) => {
                                  const val = Number(g.target.value);
                                  ei(it.id, {
                                    mois_index: val,
                                  }),
                                    si(it.id, {
                                      mois_index: val,
                                    });
                                }}
                                style={{
                                  padding: 8,
                                  borderRadius: 8,
                                  border: "1px solid var(--line)",
                                  fontSize: 13,
                                }}
                              >
                                {MOIS.map((m, mj) => (
                                  <option value={mj} key={mj}>
                                    {m}
                                  </option>
                                ))}
                              </select>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 2,
                                }}
                              >
                                <label
                                  style={{
                                    fontSize: 10.5,
                                    color: "var(--slate)",
                                  }}
                                >
                                  Prévu
                                </label>
                                <input
                                  aria-label="Montant prévu"
                                  inputMode="decimal"
                                  value={it.montant_prevu}
                                  onChange={(g) =>
                                    eiAuto(
                                      it.id,
                                      {
                                        montant_prevu: g.target.value,
                                      },
                                      {
                                        montant_prevu: Number(g.target.value) || 0,
                                      },
                                    )
                                  }
                                  onBlur={(g) =>
                                    siFlash(it.id, {
                                      montant_prevu: Number(g.target.value) || 0,
                                    })
                                  }
                                  style={{
                                    width: 70,
                                    padding: 8,
                                    borderRadius: 8,
                                    border: "1px solid var(--line)",
                                    fontSize: 13,
                                    textAlign: "right",
                                  }}
                                />
                              </div>
                              <label
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  fontSize: 12.5,
                                }}
                              >
                                <input type="checkbox" checked={!!it.paid} onChange={() => togglePaid(it)} />
                                payé
                              </label>
                              {it.paid && (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 2,
                                  }}
                                >
                                  <label
                                    style={{
                                      fontSize: 10.5,
                                      color: "var(--slate)",
                                    }}
                                  >
                                    Réel
                                  </label>
                                  <input
                                    aria-label="Montant réel"
                                    inputMode="decimal"
                                    value={it.montant_reel ?? ""}
                                    onChange={(g) =>
                                      eiAuto(
                                        it.id,
                                        {
                                          montant_reel: g.target.value,
                                        },
                                        {
                                          montant_reel: Number(g.target.value) || 0,
                                        },
                                      )
                                    }
                                    onBlur={(g) =>
                                      siFlash(it.id, {
                                        montant_reel: Number(g.target.value) || 0,
                                      })
                                    }
                                    style={{
                                      width: 70,
                                      padding: 8,
                                      borderRadius: 8,
                                      border: "1px solid var(--line)",
                                      fontSize: 13,
                                      textAlign: "right",
                                    }}
                                  />
                                </div>
                              )}
                              <select
                                className="bsel"
                                style={{
                                  maxWidth: 118,
                                }}
                                value={it.statut || "actif"}
                                disabled={v}
                                aria-label={"État de « " + (it.label || "") + " »"}
                                title="Un poste abandonné ou reporté sort du plan : il n'est plus provisionné."
                                onChange={(g) => setStatut(it, g.target.value)}
                              >
                                {ITEM_STATUTS.map(([k, lib]) => (
                                  <option value={k} key={k}>
                                    {lib}
                                  </option>
                                ))}
                              </select>
                              <button
                                className="btn-outline btn-sm"
                                onClick={() => ri(it.id)}
                                aria-label="Supprimer"
                              >
                                ✕
                              </button>
                              <input
                                className="bedit"
                                style={{
                                  flexBasis: "100%",
                                  fontSize: 12,
                                  marginTop: 2,
                                }}
                                disabled={v}
                                value={it.detail || ""}
                                placeholder="détail (ex. payé par chèque, facture à venir)"
                                aria-label={"Détail de « " + (it.label || "") + " »"}
                                onChange={(g) =>
                                  eiAuto(it.id, {
                                    detail: g.target.value,
                                  })
                                }
                              />
                              {!itemCompte(it) && (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 6,
                                    alignItems: "center",
                                    flexBasis: "100%",
                                    margin: "2px 0 4px",
                                  }}
                                >
                                  <span
                                    className="detail"
                                    style={{
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    Depuis le
                                  </span>
                                  <input
                                    type="date"
                                    className="bedit"
                                    style={{
                                      width: "auto",
                                    }}
                                    disabled={v}
                                    value={it.date_effet || ""}
                                    aria-label={"Date d'effet pour « " + (it.label || "") + " »"}
                                    onChange={(g) => setDateEffet(it, g.target.value || null)}
                                  />
                                  <input
                                    className="bedit"
                                    placeholder="Pourquoi ? (facultatif)"
                                    disabled={v}
                                    defaultValue={it.raison || ""}
                                    aria-label={"Raison pour « " + (it.label || "") + " »"}
                                    onBlur={(g) => setRaison(it, g.target.value || null)}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    );
                  })}
                  <button
                    className="btn-outline btn-sm"
                    style={{
                      marginTop: 4,
                    }}
                    onClick={() => ai(pocket)}
                  >
                    + Ajouter un poste
                  </button>
                </div>
              );
            })()}
        </div>
      </details>
    );
  }
  return (
    <section className="sec">
      <h2>Trésorerie</h2>
      <p className="sub">
        Un seul geste chaque mois : ton relevé livrets + cocher ce qui a été payé. Le reste se calcule tout
        seul, à partir de tes vraies données — plus aucun chiffre caché à recalibrer.
      </p>
      {dernierMoisMaj >= 0 && dernierMoisMaj < M && (
        <div className="bwarn" role="alert">
          <b>{"⚠ Pense à mettre " + MOIS[M] + " à jour."}</b>
          {" Dernier mois saisi : " + MOIS[dernierMoisMaj] + "."}
        </div>
      )}
      {(() => {
        const mascotte =
            curEcart == null
              ? VisionAssets.mascotte_neutre
              : curEcart >= 0
                ? VisionAssets.mascotte_contente
                : VisionAssets.mascotte_encourageante,
          phrase =
            curEcart == null
              ? "Enregistre ton relevé et je te dis où on en est !"
              : curEcart >= 0
                ? "Ton épargne suit ton tableau : départ fin août + 500 € par mois."
                : "Un peu sous le plan, mais rien de grave — on continue.",
          streak = (() => {
            let s = 0;
            for (let w = M; w >= 0; w--) {
              if (!isClosed(w)) break;
              s++;
            }
            return s;
          })(),
          objectifAtteint = curHV != null && curHV >= getCible(r, e);
        return (
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <img
              src={mascotte}
              alt={
                curEcart == null
                  ? "Mascotte : en attente"
                  : curEcart >= 0
                    ? "Mascotte contente"
                    : "Mascotte encourageante"
              }
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                objectFit: "cover",
                flex: "0 0 auto",
              }}
            />
            <div
              style={{
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: 13.5,
                }}
              >
                {phrase}
              </div>
              {(streak > 0 || objectifAtteint) && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {streak > 0 && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11.5,
                        background: "#eef7fb",
                        borderRadius: 99,
                        padding: "3px 8px 3px 3px",
                      }}
                    >
                      <img
                        src={VisionAssets.badge_streak}
                        alt={streak + " mois clôturés d'affilée"}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                        }}
                      />
                      {streak + " mois d'affilée"}
                    </span>
                  )}
                  {objectifAtteint && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11.5,
                        background: "#eef7f4",
                        borderRadius: 99,
                        padding: "3px 8px 3px 3px",
                      }}
                    >
                      <img
                        src={VisionAssets.badge_objectif}
                        alt="Objectif matelas atteint"
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                        }}
                      />
                      Objectif atteint !
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}
      <div
        className="sumrow"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 8,
          marginBottom: 12,
        }}
        role="group"
        aria-label={"Résumé de " + MOIS[moisSel]}
      >
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "10px 6px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              fontSize: 18,
            }}
          >
            {curEcart == null ? "·" : curEcart >= 0 ? "✓" : "⚠"}
          </div>
          <div
            style={{
              fontFamily: "Georgia,serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: curEcart == null ? "var(--ink)" : curEcart >= 0 ? "var(--green)" : "var(--oxblood)",
            }}
          >
            {eurosCourt(curPlan)}
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: "var(--slate)",
              textTransform: "uppercase",
            }}
          >
            Épargne
          </div>
        </div>
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "10px 6px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              fontSize: 18,
            }}
          >
            {curPoche < seuilPoche(r) ? "⚠" : "✓"}
          </div>
          <div
            style={{
              fontFamily: "Georgia,serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: curPoche < seuilPoche(r) ? "var(--oxblood)" : "var(--green)",
            }}
          >
            {eurosCourt(curPoche)}
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: "var(--slate)",
              textTransform: "uppercase",
            }}
          >
            Poche vacances
          </div>
        </div>
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "10px 6px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              fontSize: 18,
            }}
          >
            {curForm < seuilPoche(r) ? "⚠" : "✓"}
          </div>
          <div
            style={{
              fontFamily: "Georgia,serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: curForm < seuilPoche(r) ? "var(--oxblood)" : "var(--green)",
            }}
          >
            {eurosCourt(curForm)}
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: "var(--slate)",
              textTransform: "uppercase",
            }}
          >
            Provision formation
          </div>
        </div>
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "10px 6px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              fontSize: 18,
            }}
          >
            {curSport < seuilPoche(r) ? "⚠" : "✓"}
          </div>
          <div
            style={{
              fontFamily: "Georgia,serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: curSport < seuilPoche(r) ? "var(--oxblood)" : "var(--green)",
            }}
          >
            {eurosCourt(curSport)}
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: "var(--slate)",
              textTransform: "uppercase",
            }}
          >
            Provision sport
          </div>
        </div>
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "10px 6px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              fontSize: 18,
            }}
          >
            {margeSecu < 0 ? "⚠" : "✓"}
          </div>
          <div
            style={{
              fontFamily: "Georgia,serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: margeSecu < 0 ? "var(--oxblood)" : "var(--green)",
            }}
          >
            {(margeSecu >= 0 ? "+" : "") + eurosCourt(margeSecu)}
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: "var(--slate)",
              textTransform: "uppercase",
            }}
          >
            Marge de sécurité
          </div>
        </div>
      </div>
      <div className="h3">📌 Mise à jour du mois</div>
      <div
        className="card"
        style={{
          borderColor: "var(--oxblood)",
          borderWidth: 2,
        }}
      >
        <div className="field">
          <label htmlFor="mois-select">Mois</label>
          <select
            id="mois-select"
            value={moisSel}
            disabled={v}
            onChange={(g) => setMoisSel(Number(g.target.value))}
          >
            {MOIS.map((m, i) => (
              <option value={i} key={i}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="reel-input">Solde total livrets (Livret A + LDD) à ce jour</label>
          <input
            id="reel-input"
            inputMode="decimal"
            disabled={v || selClosed}
            placeholder="ex. 13725,59"
            value={reelInput}
            onChange={(g) => setReelInput(g.target.value)}
          />
        </div>
        {(() => {
          const rr = parseFloat(String(reelInput).replace(",", "."));
          if (Number.isNaN(rr)) return null;
          const pockets = [
              ["vacances", "Vacances", vac],
              ["formation", "Formation + sport", form],
            ],
            reserveTot = pockets.reduce((s, [, , p]) => s + p.solde[moisSel], 0),
            disponible = rr - reserveTot;
          return (
            <div
              className="note"
              style={{
                background: "#f4fafb",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {"1. Montant sur les livrets d'épargne — "}
                {MOIS[moisSel]}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <span>Solde total (Livret A + LDD)</span>
                <b>{eurosCourt(rr)}</b>
              </div>
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                2. Montants soustraits des provisions
              </div>
              {pockets.map(([key, label, p]) => (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "var(--slate)",
                  }}
                  key={key}
                >
                  <span>
                    {"− Provision "}
                    {label}
                  </span>
                  <span>
                    {"− "}
                    {eurosCourt(p.solde[moisSel])}
                  </span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 700,
                  marginTop: 6,
                  paddingTop: 6,
                  marginBottom: 14,
                  borderTop: "1px solid var(--line)",
                }}
              >
                <span>= Épargne réellement disponible</span>
                <span>{eurosCourt(disponible)}</span>
              </div>
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                3. Détail par enveloppe
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12.5,
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        paddingBottom: 4,
                      }}
                    >
                      Enveloppe
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        paddingBottom: 4,
                      }}
                    >
                      À provisionner
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        paddingBottom: 4,
                      }}
                    >
                      Viré / dépensé
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        paddingBottom: 4,
                      }}
                    >
                      Reste
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pockets.map(([key, label, p]) => (
                    <tr key={key}>
                      <td
                        style={{
                          padding: "5px 0",
                          borderTop: "1px solid var(--line)",
                        }}
                      >
                        {label}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          padding: "5px 0",
                          borderTop: "1px solid var(--line)",
                        }}
                      >
                        {eurosCourt(p.prevu[moisSel])}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          padding: "5px 0",
                          borderTop: "1px solid var(--line)",
                        }}
                      >
                        {eurosCourt(p.reel[moisSel])}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          padding: "5px 0",
                          borderTop: "1px solid var(--line)",
                          fontWeight: 600,
                        }}
                      >
                        {eurosCourt(p.solde[moisSel])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
        {selClosed && (
          <div
            className="note"
            style={{
              background: "#eef7f4",
              borderColor: "var(--green)",
            }}
          >
            {"🔒 "}
            <b>{MOIS[moisSel] + " est clôturé."}</b>
            {" Les chiffres de ce mois sont gelés (écart figé : "}
            {(cloture(moisSel).snapshot.ecart >= 0 ? "+" : "") + eurosCourt(cloture(moisSel).snapshot.ecart)}
            ). Modifie les postes si besoin, mais le relevé et l'historique de ce mois ne bougeront plus.
          </div>
        )}
        {enAttente.length > 0 && (
          <div className="field">
            <span
              style={{
                display: "block",
                fontSize: 12.5,
                color: "var(--slate)",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Ces dépenses sont-elles passées ?
            </span>
            {enAttente.map((it) => (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 6,
                }}
                key={it.id}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flex: 1,
                    fontSize: 13.5,
                  }}
                >
                  <input
                    type="checkbox"
                    disabled={v || isClosed(it.mois_index)}
                    checked={!1}
                    onChange={() => togglePaid(it)}
                  />
                  {it.label +
                    " — " +
                    eurosCourt(it.montant_prevu) +
                    " (" +
                    MOIS[it.mois_index] +
                    ")" +
                    (isClosed(it.mois_index) ? " 🔒" : "")}
                </label>
              </div>
            ))}
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn"
            style={{
              flex: "1 1 auto",
            }}
            onClick={enregistrer}
            disabled={saving || v || selClosed}
          >
            {saving ? "Enregistrement…" : "Enregistrer ce mois"}
          </button>
          {!selClosed && (
            <p
              className="detail"
              style={{
                margin: 0,
                flex: "1 1 100%",
              }}
            >
              La clôture du mois se fait maintenant en bas de Budget mois, sans relevé des livrets.
            </p>
          )}
        </div>
        {justClosed && (
          <div
            role="status"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
              padding: 8,
              background: "#eef7fb",
              borderRadius: 10,
            }}
          >
            <img
              src={VisionAssets.badge_cloture}
              alt=""
              aria-hidden="true"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
              }}
            />
            <span
              style={{
                fontSize: 12.5,
              }}
            >
              {MOIS[moisSel] + " clôturé, bien joué !"}
            </span>
          </div>
        )}
        <div
          role="status"
          aria-live="polite"
          style={{
            marginTop: 10,
            fontSize: 12.5,
            color: msg === "ok" ? "var(--green)" : "var(--slate)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: 99,
              background: "currentColor",
              display: "inline-block",
            }}
          />
          {msg === "ok"
            ? lastSavedLabel
              ? "Enregistré \u2014 " + lastSavedLabel
              : "Enregistré"
            : msg ||
              (lastSavedLabel
                ? "Enregistré \u2014 " + lastSavedLabel
                : "Rien d\u2019enregistr\u00e9 pour l\u2019instant")}
        </div>
      </div>
      <details className="collapsible">
        <summary>Budget mensuel — modèle</summary>
        <div className="inner">
          <div className="editable-hint">
            C'est le modèle qui s'applique à tous les mois. Pour n'ajuster qu'un mois, utilise « Ajuster le
            budget de … » plus bas.
          </div>
          {["revenu", "charge", "epargne"].map((k) => (
            <LignesModele
              titre={k === "revenu" ? "Revenus" : k === "charge" ? "Charges" : "Épargne"}
              kind={k}
              budget={e || []}
              editLine={editLineFn2}
              saveLine={saveLineFn2}
              addLine={addLineFn}
              removeLine={removeLineFn}
              readOnly={v}
              key={k}
            />
          ))}
        </div>
      </details>
      {(() => {
        const list = savingsAll || [];
        return (
          <details className="collapsible">
            <summary>💚 Avant / Après — économies réalisées</summary>
            <div className="inner">
              <p
                className="sub"
                style={{
                  marginTop: 0,
                }}
              >
                Ce que tu as résilié ou renégocié depuis le début de la reconversion.
              </p>
              {list.map((sItem) => {
                const eco = num(sItem.ancien_montant) - num(sItem.nouveau_montant);
                return (
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                      marginBottom: 8,
                      flexWrap: "wrap",
                    }}
                    key={sItem.id}
                  >
                    <input
                      aria-label="Poste"
                      defaultValue={sItem.poste}
                      placeholder="Poste (ex. Shiva)"
                      disabled={v}
                      onBlur={(g) =>
                        saveSavingFn(sItem.id, {
                          poste: g.target.value,
                        })
                      }
                      style={{
                        flex: "1 1 120px",
                        padding: 8,
                        borderRadius: 8,
                        border: "1px solid var(--line)",
                        fontSize: 13,
                      }}
                    />
                    <input
                      aria-label="Ancien montant"
                      inputMode="decimal"
                      defaultValue={sItem.ancien_montant}
                      disabled={v}
                      onBlur={(g) =>
                        saveSavingFn(sItem.id, {
                          ancien_montant: Number(g.target.value) || 0,
                        })
                      }
                      style={{
                        width: 65,
                        padding: 8,
                        borderRadius: 8,
                        border: "1px solid var(--line)",
                        fontSize: 13,
                        textAlign: "right",
                      }}
                    />
                    <span aria-hidden="true">→</span>
                    <input
                      aria-label="Nouveau montant"
                      inputMode="decimal"
                      defaultValue={sItem.nouveau_montant}
                      disabled={v}
                      onBlur={(g) =>
                        saveSavingFn(sItem.id, {
                          nouveau_montant: Number(g.target.value) || 0,
                        })
                      }
                      style={{
                        width: 65,
                        padding: 8,
                        borderRadius: 8,
                        border: "1px solid var(--line)",
                        fontSize: 13,
                        textAlign: "right",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "var(--green)",
                        minWidth: 55,
                      }}
                    >
                      {"-" + eurosCourt(eco)}
                    </span>
                    {!v && (
                      <button
                        className="btn-outline btn-sm"
                        onClick={() => delSavingFn(sItem.id)}
                        aria-label="Supprimer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
              {list.length > 0 && !v && (
                <div
                  style={{
                    marginTop: 4,
                  }}
                >
                  <p
                    className="sub"
                    style={{
                      marginBottom: 6,
                    }}
                  >
                    Relier une économie à une ligne du Budget mensuel pour la répercuter réellement :
                  </p>
                  {list.map((sItem) => (
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                        marginBottom: 6,
                        flexWrap: "wrap",
                      }}
                      key={sItem.id}
                    >
                      <span
                        style={{
                          fontSize: 12.5,
                          minWidth: 90,
                        }}
                      >
                        {sItem.poste || "(sans nom)"}
                        {" →"}
                      </span>
                      <select
                        aria-label="Ligne du budget correspondante"
                        value={sItem.budget_line_id || ""}
                        onChange={(g) =>
                          saveSavingFn(sItem.id, {
                            budget_line_id: g.target.value || null,
                          })
                        }
                        style={{
                          flex: "1 1 140px",
                          padding: 7,
                          borderRadius: 8,
                          border: "1px solid var(--line)",
                          fontSize: 12.5,
                        }}
                      >
                        <option value="">— aucune —</option>
                        {budgetDuMois(bmAll, e, moisSel)
                          .filter((w) => w.kind === "charge")
                          .map((w) => (
                            <option value={w.id} key={w.id}>
                              {w.poste + " (" + eurosCourt(num(w.montant)) + ")"}
                            </option>
                          ))}
                      </select>
                      {sItem.budget_line_id && (
                        <button
                          className="btn-outline btn-sm"
                          onClick={() => {
                            editLineFn(sItem.budget_line_id, {
                              montant: sItem.nouveau_montant,
                            }),
                              saveLineFn(sItem.budget_line_id);
                          }}
                        >
                          Appliquer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {!v && (
                <button
                  className="btn-outline btn-sm"
                  style={{
                    marginTop: 4,
                  }}
                  onClick={addSavingFn}
                >
                  + Ajouter une économie
                </button>
              )}
              {list.length > 0 && (
                <p
                  className="sub"
                  style={{
                    marginTop: 10,
                  }}
                >
                  {"Total économisé : "}
                  <b
                    style={{
                      color: "var(--green)",
                    }}
                  >
                    {eurosCourt(
                      list.reduce((s, x) => s + (num(x.ancien_montant) - num(x.nouveau_montant)), 0),
                    )}
                  </b>
                  /mois
                </p>
              )}
            </div>
          </details>
        );
      })()}
      <div className="note red">
        <b>
          {"Objectif : " +
            eurosCourt(getCible(r, e)) +
            " (6 mois de salaire) sur les livrets, hors provisions vacances, sport et formation."}
        </b>
      </div>
      <Pocket
        title="Épargne — prévu vs réel"
        pocket="epargne"
        calc={epg}
        note="Rien n'est déduit de l'épargne pure ici — tout (vacances, formation, sport, DU) passe par ses propres provisions ci-dessous."
      />
      <Pocket
        title={(pocheVacances ? pocheVacances.label : "Provision vacances") + " — prévu vs réel"}
        pocket="vacances"
        calc={vac}
        note={
          eurosCourt(paramOuDefaut(r, "provision_vacances_mensuelle")) +
          (pocheVacances && pocheVacances.note
            ? pocheVacances.note
            : "/mois de provision + les dépenses réelles de voyage.")
        }
      />
      <details
        className="collapsible"
        style={{
          marginBottom: 12,
        }}
      >
        <summary>
          {"Voyages — "}
          {
            (n || []).filter(
              (x) => (x.poche_cle || "vacances") === (pocheVacances ? pocheVacances.cle : "vacances"),
            ).length
          }
          <span
            style={{
              color: "var(--slate)",
              fontWeight: 400,
              marginLeft: 8,
            }}
          >
            {eurosCourt(
              (n || [])
                .filter(
                  (x) => (x.poche_cle || "vacances") === (pocheVacances ? pocheVacances.cle : "vacances"),
                )
                .reduce((s2, x) => s2 + num(x.montant), 0),
            )}
          </span>
        </summary>
        <div className="inner">
          <div className="editable-hint">
            Les voyages prévus alimentent la courbe de la poche vacances. Le mois indique quand la dépense
            tombe.
          </div>
          {[
            ...(n || []).filter(
              (x) => (x.poche_cle || "vacances") === (pocheVacances ? pocheVacances.cle : "vacances"),
            ),
          ]
            .sort((a, b) => num(a.mois_index) - num(b.mois_index) || (a.sort || 0) - (b.sort || 0))
            .map((w) => (
              <div className="brow" key={w.id}>
                <div className="bcol">
                  <input
                    className="bedit lbl"
                    disabled={v}
                    value={w.label || ""}
                    placeholder="Voyage"
                    aria-label="Nom du voyage"
                    onChange={(g) =>
                      editVoyageFn(w.id, {
                        label: g.target.value,
                      })
                    }
                    onBlur={() => saveVoyageFn(w.id)}
                  />
                  <select
                    className="bsel"
                    disabled={v}
                    value={num(w.mois_index)}
                    aria-label="Mois du voyage"
                    onChange={(g) => {
                      editVoyageFn(w.id, {
                        mois_index: Number(g.target.value),
                      }),
                        setTimeout(() => saveVoyageFn(w.id), 0);
                    }}
                  >
                    {MOIS.map((lab, idx) => (
                      <option value={idx} key={idx}>
                        {lab}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  className="bedit bnum"
                  inputMode="decimal"
                  disabled={v}
                  value={w.montant}
                  aria-label="Montant du voyage"
                  onChange={(g) =>
                    editVoyageFn(w.id, {
                      montant: g.target.value,
                    })
                  }
                  onBlur={() => saveVoyageFn(w.id)}
                />
                {!v && (
                  <button
                    className="bdel"
                    onClick={() => removeVoyageFn(w.id)}
                    aria-label="Supprimer ce voyage"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          {!v && (
            <button className="badd" onClick={() => addVoyageFn()}>
              + Ajouter un voyage
            </button>
          )}
        </div>
      </details>
      {!v && (
        <details
          className="collapsible"
          style={{
            marginBottom: 12,
          }}
        >
          <summary>Gérer les poches</summary>
          <div className="inner">
            <div className="editable-hint">
              Archiver une poche la retire de l'affichage, mais ses postes encore actifs restent provisionnés
              : l'archivage ne solde pas, sinon ton épargne disponible remonterait sans que rien n'ait changé.
            </div>
            {(pochesRows || []).map((p) => {
              const postesActifs = (items || []).filter((x) => x.pocket === p.cle && itemCompte(x)),
                nonSoldes = postesActifs.filter((x) => !x.paid).length;
              return (
                <div
                  style={{
                    borderBottom: "1px solid var(--line)",
                    padding: "8px 0",
                    opacity: pocheAffichee(p) ? 1 : 0.6,
                  }}
                  key={p.id}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                    }}
                  >
                    <input
                      className="bedit lbl"
                      value={p.label || ""}
                      placeholder="Nom de la poche"
                      aria-label="Nom de la poche"
                      onChange={(g) =>
                        pocheEditFn(p.id, {
                          label: g.target.value,
                        })
                      }
                    />
                    <button
                      className="btn-outline btn-sm"
                      onClick={() => {
                        if (pocheAffichee(p) && nonSoldes) {
                          if (
                            !window.confirm(
                              nonSoldes +
                                " poste(s) actif(s) non soldé(s) resteront comptés après archivage. Pour les solder, il faudra désarchiver. Continuer ?",
                            )
                          )
                            return;
                        }
                        pocheEditFn(p.id, {
                          statut: pocheAffichee(p) ? "archive" : "actif",
                        });
                      }}
                    >
                      {pocheAffichee(p) ? "Archiver" : "Désarchiver"}
                    </button>
                    <button className="bdel" onClick={() => pocheDelFn(p)} aria-label="Supprimer la poche">
                      ×
                    </button>
                  </div>
                  <div className="bdet">
                    {p.regime === "provision_mensuelle" ? "provision mensuelle" : "postes datés"}
                    {" · "}
                    {postesActifs.length}
                    {" poste(s) actif(s)"}
                    {nonSoldes ? " dont " + nonSoldes + " non soldé(s)" : ""}
                    {pocheAffichee(p) ? "" : " · archivée"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginTop: 4,
                    }}
                  >
                    <input
                      className="bedit bnum"
                      inputMode="decimal"
                      value={p.seuil_bas == null ? "" : p.seuil_bas}
                      placeholder="seuil"
                      aria-label="Seuil d'alerte"
                      onChange={(g) =>
                        pocheEditFn(p.id, {
                          seuil_bas: g.target.value,
                        })
                      }
                    />
                    <input
                      className="bedit"
                      style={{
                        flex: 1,
                      }}
                      value={p.note || ""}
                      placeholder="Note affichée sous le titre"
                      aria-label="Note de la poche"
                      onChange={(g) =>
                        pocheEditFn(p.id, {
                          note: g.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              );
            })}
            <button className="badd" onClick={pocheAddFn}>
              + Ajouter une poche
            </button>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginTop: 10,
                fontSize: 13,
              }}
            >
              <input
                type="checkbox"
                checked={montrerArchivees}
                onChange={(g) => setMontrerArchivees(g.target.checked)}
              />
              Afficher les poches archivées dans la Trésorerie
            </label>
          </div>
        </details>
      )}
      {(pochesRows || [])
        .filter((p) => p.cle !== "vacances" && (pocheAffichee(p) || montrerArchivees))
        .map((p) => (
          <Pocket
            title={p.label + " — prévu vs réel" + (pocheAffichee(p) ? "" : " (archivée)")}
            pocket={p.cle}
            calc={pocheCalcDe(p, items, r, MOIS.length)}
            note={
              (p.regime === "provision_mensuelle" && p.param_key
                ? eurosCourt(paramOuDefaut(r, p.param_key))
                : "") + (p.note || "")
            }
            key={p.id}
          />
        ))}
      {!v && (
        <details className="collapsible">
          <summary>⚙ Paramètres du plan</summary>
          <div className="inner">
            {[
              ["plan_baseline", "Base théorique du plan (fixe, jamais recalée automatiquement)"],
              ["epargne_mensuelle", "Épargne mensuelle vers les livrets"],
              ["provision_vacances_mensuelle", "Provision vacances mensuelle"],
              [
                "cible_override",
                "Forcer l'objectif matelas (0 = auto, calculé depuis ton salaire du Budget mensuel ×6)",
              ],
              ["seuil_ecart_epargne", "Seuil d'alerte écart épargne (€), défaut 300"],
              ["seuil_poche_min", "Seuil d'alerte poche basse (€), défaut 200"],
            ].map(([key, label]) => (
              <div className="field" key={key}>
                <label htmlFor={"plan-" + key}>{label}</label>
                <input
                  id={"plan-" + key}
                  inputMode="decimal"
                  defaultValue={paramOuDefaut(r, key)}
                  onBlur={(g) => u(key, g.target.value)}
                />
              </div>
            ))}
            <p className="sub">
              {"Objectif matelas actuel : "}
              <b>{eurosCourt(getCible(r, e))}</b>
              {" ("}
              {paramOuDefaut(r, "cible_override") > 0 ? "forcé manuellement" : "6 × salaire mensuel"}).
            </p>
          </div>
        </details>
      )}
      {!v && (
        <details className="collapsible">
          <summary>🕘 Historique des modifications</summary>
          <div className="inner">
            <p
              className="sub"
              style={{
                marginTop: 0,
              }}
            >
              Chaque changement de montant, de statut « payé » ou de mois est journalisé automatiquement (30
              dernières modifications).
            </p>
            {(auditAll || []).length === 0 ? (
              <p className="sub">Aucune modification enregistrée pour l'instant.</p>
            ) : (
              <div>
                {(auditAll || []).map((a) => (
                  <div
                    style={{
                      fontSize: 12.5,
                      padding: "6px 0",
                      borderBottom: "1px solid var(--line)",
                      color: "var(--slate)",
                    }}
                    key={a.id}
                  >
                    <span
                      style={{
                        color: "var(--ink)",
                        fontWeight: 600,
                      }}
                    >
                      {(a.table_name === "vision_items" ? "Poste" : "Paramètre") + " · " + a.field}
                    </span>
                    {" — "}
                    {a.old_value ?? "∅"}
                    {" → "}
                    <b>{a.new_value ?? "∅"}</b>
                    <span
                      style={{
                        float: "right",
                      }}
                    >
                      {new Intl.DateTimeFormat(VISION_CONFIG.locale, {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(a.changed_at))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>
      )}
    </section>
  );
}

// Budget mensuel — reproduit BUDGET_TABLEAU.xlsx.
// Écart = Budget − Réalisé. Total des sorties (SOLDE Excel) = courantes + épargne.
// Reste disponible = salaire − total des sorties. Provision vacances = pocketCalc.
// ============================================================
// Export Excel identique à BUDGET_TABLEAU.xlsx
// Même feuille, mêmes lignes, mêmes formules, mêmes couleurs.
// ExcelJS est chargé à la demande (seulement au moment de l'export).
// ============================================================
