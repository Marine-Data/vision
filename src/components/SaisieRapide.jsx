import React from "react";
import { budgetDuMois, montantSigne } from "../lib/calculs.js";
import { catIcone, euros, num } from "../lib/format.js";
import { MOIS, isoAujourdhui, moisDepuisAncre, moisNow } from "../lib/mois.js";

export function SaisieRapide({
  budget,
  budgetMois,
  transactions,
  onAdd,
  onUpdate,
  onDelete,
  onClose,
  initial,
}) {
  const edition = !!(initial && initial.id),
    remb = !!(initial && initial.type === "remboursement"),
    categories = (() => {
      const toutes = budgetDuMois(budgetMois, budget, moisNow()),
        liste = toutes.filter((w) => w.kind === "charge" && w.budget_line_id && w.line_key !== "c_sport"),
        pre = initial && initial.budget_line_id;
      pre &&
        !liste.some((w) => w.budget_line_id === pre) &&
        toutes.filter((w) => w.budget_line_id === pre).forEach((w) => liste.push(w));
      return liste.map((w) => ({
        ...w,
        id: w.budget_line_id,
      }));
    })(),
    [montant, setMontant] = React.useState(edition ? String(initial.montant) : ""),
    [ligneId, setLigneId] = React.useState(initial ? initial.budget_line_id || null : null),
    [note, setNote] = React.useState(edition && initial.note ? initial.note : ""),
    [dateDep, setDateDep] = React.useState(
      initial && initial.date_depense ? initial.date_depense : isoAujourdhui(),
    ),
    [toutesCats, setToutesCats] = React.useState(!!initial),
    [exceptionnelle, setExceptionnelle] = React.useState(!!(initial && initial.exceptionnelle)),
    [aVenir, setAVenir] = React.useState(!!(initial && initial.statut === "prevu")),
    [etat, setEtat] = React.useState(""),
    [erreur, setErreur] = React.useState(""),
    champMontant = React.useRef(null);
  React.useEffect(() => {
    champMontant.current && champMontant.current.focus();
  }, []);
  React.useEffect(() => {
    const surTouche = (e) => {
      e.key === "Escape" && onClose();
    };
    return (
      window.addEventListener("keydown", surTouche), () => window.removeEventListener("keydown", surTouche)
    );
  }, [onClose]);

  // Catégories classées par usage réel, les 6 plus fréquentes d'abord.
  const usage = {};
  (transactions || []).forEach((t) => {
    usage[t.budget_line_id] = (usage[t.budget_line_id] || 0) + 1;
  });
  const triees = [...categories].sort((a, b) => (usage[b.id] || 0) - (usage[a.id] || 0)),
    visibles = toutesCats ? triees : triees.slice(0, 6),
    masquees = triees.length - visibles.length;

  // Notes déjà employées au moins deux fois pour cette catégorie.
  const compteNotes = {};
  (transactions || [])
    .filter((t) => t.budget_line_id === ligneId)
    .forEach((t) => {
      const k = (t.note || "").trim();
      k && k !== "report" && (compteNotes[k] = (compteNotes[k] || 0) + 1);
    });
  const notesSuggerees = Object.keys(compteNotes)
    .filter((k) => compteNotes[k] >= 2)
    .slice(0, 6);
  const recentes = [];
  (transactions || []).forEach((t) => {
    if (recentes.length >= 5 || !t.note || t.note === "report") return;
    const cle = t.budget_line_id + "|" + t.note + "|" + t.montant;
    recentes.some((r) => r.cle === cle) ||
      recentes.push({
        cle,
        t,
      });
  });
  const auj = isoAujourdhui(),
    duJour = (transactions || []).filter((t) => t.date_depense === auj),
    totalJour = duJour.reduce((s, t) => s + montantSigne(t), 0),
    valeur = Number(String(montant).replace(",", ".")),
    pret = ligneId && valeur > 0;
  async function enregistrer(enchainer) {
    if (!pret) {
      setErreur(ligneId ? "Indique un montant." : "Choisis une catégorie.");
      return;
    }
    setErreur(""), setEtat("Enregistrement…");
    try {
      edition
        ? await onUpdate(initial.id, {
            budget_line_id: ligneId,
            montant: valeur,
            note: note.trim() || null,
            date_depense: dateDep,
            exceptionnelle,
            statut: aVenir ? "prevu" : "fait",
          })
        : await onAdd({
            budget_line_id: ligneId,
            montant: valeur,
            note: note.trim() || null,
            date_depense: dateDep,
            type: remb ? "remboursement" : "depense",
            exceptionnelle,
            statut: aVenir ? "prevu" : "fait",
          });
      setEtat("✓ " + euros(valeur) + " · " + (categories.find((c) => c.id === ligneId) || {}).poste);
      if (enchainer && !edition)
        setMontant(""),
          setNote(""),
          champMontant.current && champMontant.current.focus(),
          setTimeout(() => setEtat(""), 2500);
      else setTimeout(onClose, 450);
    } catch (e) {
      setEtat(""),
        setErreur(
          "Échec de l'enregistrement : " +
            (e && e.message ? e.message : "connexion") +
            ". Rien n'a été perdu, réessaie.",
        );
    }
  }
  async function supprimer() {
    if (!window.confirm(remb ? "Supprimer ce remboursement ?" : "Supprimer cette dépense ?")) return;
    setEtat("Suppression…"), setErreur("");
    try {
      await onDelete(initial.id), onClose();
    } catch (e) {
      setEtat(""), setErreur("Impossible de supprimer : " + (e && e.message ? e.message : "connexion") + ".");
    }
  }
  return (
    <div
      className="sheetbg"
      onClick={(e) => {
        e.target === e.currentTarget && onClose();
      }}
    >
      <div className="sheet">
        <div className="sheethead">
          <h3>
            {remb
              ? edition
                ? "Modifier le remboursement"
                : "Nouveau remboursement"
              : edition
                ? "Modifier la dépense"
                : "Nouvelle dépense"}
          </h3>
          <button className="sheetclose" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        {!edition && (
          <div
            className="detail"
            style={{
              marginBottom: 10,
            }}
          >
            {"Aujourd'hui · "}
            {duJour.length}
            {" dépense"}
            {duJour.length > 1 ? "s" : ""}
            {" · "}
            {euros(totalJour)}
          </div>
        )}
        <input
          ref={champMontant}
          className="amount"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          value={montant}
          onChange={(e) => setMontant(e.target.value.replace(/[^0-9.,]/g, ""))}
          aria-label="Montant"
        />
        <div
          className="detail"
          style={{
            margin: "10px 0 6px",
          }}
        >
          Catégorie
        </div>
        <div className="catgrid">
          {visibles.map((c) => (
            <button
              className={"catbtn" + (ligneId === c.id ? " on" : "")}
              onClick={() => setLigneId(c.id)}
              key={c.id}
            >
              <span>{catIcone(c.poste)}</span>
              <span>{c.poste}</span>
            </button>
          ))}
        </div>
        {masquees > 0 && (
          <button className="badd" onClick={() => setToutesCats(!0)}>
            {"+ " + masquees + " autres catégories"}
          </button>
        )}
        {!edition && recentes.length > 0 && (
          <div>
            <div
              className="detail"
              style={{
                margin: "12px 0 6px",
              }}
            >
              Reprendre une dépense récente
            </div>
            {recentes.map(({ cle, t }) => (
              <button
                className="pill"
                onClick={() => {
                  setLigneId(t.budget_line_id), setMontant(String(t.montant)), setNote(t.note || "");
                }}
                key={cle}
              >
                {t.note + " · " + euros(t.montant)}
              </button>
            ))}
          </div>
        )}
        {notesSuggerees.length > 0 && (
          <div>
            <div
              className="detail"
              style={{
                margin: "12px 0 6px",
              }}
            >
              Notes fréquentes
            </div>
            {notesSuggerees.map((k) => (
              <button className="pill" onClick={() => setNote(k)} key={k}>
                {k}
              </button>
            ))}
          </div>
        )}
        <input
          className="bedit"
          style={{
            marginTop: 10,
          }}
          placeholder="Note (facultatif)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-label="Note"
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: "10px 0",
          }}
        >
          <span className="detail">Date</span>
          <input
            className="bedit"
            type="date"
            style={{
              width: "auto",
              flex: 1,
            }}
            value={dateDep}
            onChange={(e) => setDateDep(e.target.value)}
            aria-label="Date de la dépense"
          />
          <span className="detail">
            {"→ " +
              MOIS[Math.max(0, Math.min(MOIS.length - 1, moisDepuisAncre(new Date(dateDep + "T00:00:00"))))]}
          </span>
        </div>
        {!remb && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "0 0 10px" }}>
            {[
              [
                exceptionnelle,
                setExceptionnelle,
                "Exceptionnelle",
                "Compte dans le budget, pas dans le rythme de la projection",
              ],
              [aVenir, setAVenir, "À venir", "Pas encore prélevée"],
            ].map(([on, setOn, l, aide]) => (
              <button
                key={l}
                type="button"
                className="pill"
                aria-pressed={on}
                title={aide}
                onClick={() => setOn(!on)}
                style={{
                  margin: 0,
                  background: on ? "var(--entete)" : undefined,
                  color: on ? "#ffffff" : undefined,
                  borderColor: on ? "var(--ink)" : undefined,
                }}
              >
                {(on ? "✓ " : "") + l}
              </button>
            ))}
          </div>
        )}
        {erreur && <div className="txfail">{erreur}</div>}
        {etat && <div className="bok">{etat}</div>}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: edition ? "1fr" : "1fr 1fr",
            gap: 8,
            marginTop: 6,
          }}
        >
          <button className="btn" onClick={() => enregistrer(!1)}>
            {edition ? "Enregistrer les modifications" : "Enregistrer"}
          </button>
          {!edition && (
            <button
              className="btn-outline"
              style={{
                width: "100%",
              }}
              onClick={() => enregistrer(!0)}
            >
              Et enchaîner
            </button>
          )}
        </div>
        {edition && (
          <button
            className="btn-outline"
            style={{
              width: "100%",
              marginTop: 8,
              borderColor: "rgba(221,95,67,.5)",
              color: "var(--alert)",
            }}
            onClick={supprimer}
          >
            {remb ? "Supprimer ce remboursement" : "Supprimer cette dépense"}
          </button>
        )}
      </div>
    </div>
  );
}
