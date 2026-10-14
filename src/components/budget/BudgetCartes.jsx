import React from "react";
import { KbSheet } from "../kanban/communs.jsx";
import { CarteMatelas, FeuilleMatelas } from "./Matelas.jsx";
import { catIcone, euros, hwkFmt, num } from "../../lib/format.js";
import { EP_AUTO_NOTE } from "../../lib/epargneAuto.js";

// Budget du mois en cartes : le reste sur le salaire, la projection, une carte par
// poste (triées du plus consommé au moins consommé), l'épargne programmée.
// Tout se modifie en touchant l'élément ; chaque fenêtre écrit dans la même source.

const e0 = (v) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(num(v))) + " €";
const nombre = (v) => Number(String(v).replace(/\s/g, "").replace(",", "."));
const ROUGE = "#b8432a",
  ORANGE = "#c2702f",
  VERT = "#0b7a5c";

const carteStyle = {
  background: "#ffffff",
  borderRadius: 18,
  boxShadow: "0 1px 2px rgba(14,58,66,.06)",
};
const champ = {
  height: 52,
  borderRadius: 14,
  border: "2px solid #d6e3e5",
  padding: "0 12px",
  font: "inherit",
  fontSize: 16,
  fontWeight: 700,
  color: "var(--ink)",
  boxSizing: "border-box",
  background: "#ffffff",
  minWidth: 0,
};
const boutonPlein = (fond) => ({
  minHeight: 52,
  width: "100%",
  borderRadius: 16,
  border: 0,
  background: fond || "var(--teal-dark)",
  color: "#ffffff",
  fontFamily: "inherit",
  fontSize: 15.5,
  fontWeight: 800,
  cursor: "pointer",
});
const boutonTexte = (couleur) => ({
  minHeight: 44,
  width: "100%",
  border: 0,
  background: "transparent",
  color: couleur || "var(--ink-soft)",
  fontFamily: "inherit",
  fontSize: 14.5,
  fontWeight: 800,
  cursor: "pointer",
});

function Segment({ valeur, options, onChange, label }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        gap: 4,
        background: "#eef3f4",
        borderRadius: 14,
        padding: 4,
      }}
    >
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={valeur === v}
          onClick={() => onChange(v)}
          style={{
            minHeight: 42,
            borderRadius: 11,
            border: 0,
            background: valeur === v ? "#ffffff" : "transparent",
            boxShadow: valeur === v ? "0 1px 3px rgba(14,58,66,.15)" : "none",
            color: "var(--ink)",
            fontFamily: "inherit",
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

// Choix pour chaque mois qui a déjà son propre montant (« Me demander »).
function Conflits({ liste, choix, setChoix, nomMois }) {
  if (!liste.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {liste.map((c) => (
        <div
          key={c.m}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#fbeee4",
            color: "#7a3a12",
            borderRadius: 14,
            padding: "8px 8px 8px 12px",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          <span style={{ flex: 1 }}>
            {nomMois(c.m)} a son propre budget ({euros(c.montant)})
          </span>
          {[
            ["garder", "Garder"],
            ["remplacer", "Remplacer"],
          ].map(([v, l]) => (
            <button
              key={v}
              type="button"
              aria-pressed={choix[c.m] === v}
              onClick={() => setChoix({ ...choix, [c.m]: v })}
              style={{
                minHeight: 40,
                padding: "0 10px",
                borderRadius: 10,
                border: 0,
                background: choix[c.m] === v ? "#7a3a12" : "#ffffff",
                color: choix[c.m] === v ? "#ffffff" : "#7a3a12",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {l}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function LigneMontant({ label, valeur, onChange, disabled, id }) {
  return (
    <label
      htmlFor={id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#f3f8f9",
        borderRadius: 14,
        padding: "6px 6px 6px 14px",
        fontSize: 14.5,
        fontWeight: 800,
        color: "var(--ink-soft)",
      }}
    >
      <span style={{ flex: 1 }}>{label}</span>
      <input
        id={id}
        inputMode="decimal"
        value={valeur}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ""))}
        style={{ ...champ, width: 130, height: 46, textAlign: "right", fontSize: 17, fontWeight: 800 }}
      />
    </label>
  );
}

// ---------- fenêtre d'un poste (dépenses courantes ou épargne) ----------
function FeuillePoste({ w, ctx, onClose, mode }) {
  const {
    moisSel,
    nomMois,
    readOnly,
    ferme,
    actions,
    txDe,
    onEditTx,
    onNewTx,
    dateDefaut,
    onPasVerse,
    onPayee,
    moisDepartEpargne,
  } = ctx;
  const epargne = mode === "epargne",
    depuis = epargne ? moisDepartEpargne : moisSel,
    bloque = readOnly || (ferme && !epargne),
    [nom, setNom] = React.useState(w.poste || ""),
    [icone, setIcone] = React.useState(catIcone(w.poste)),
    [montant, setMontant] = React.useState(
      String(epargne && w.bDepart != null ? w.bDepart : w.b).replace(".", ","),
    ),
    [portee, setPortee] = React.useState("suite"),
    [choix, setChoix] = React.useState({}),
    [etat, setEtat] = React.useState(""),
    [archiver, setArchiver] = React.useState(!1),
    [pasVerseId, setPasVerseId] = React.useState(null);
  const v = nombre(montant),
    montantChange =
      Number.isFinite(v) &&
      Math.round(v * 100) !== Math.round(num(w.bDepart != null ? w.bDepart : w.b) * 100),
    nomChange = nom.trim() && nom.trim() !== w.poste,
    iconeChange = icone !== catIcone(w.poste),
    conflits = montantChange && (portee === "suite" || epargne) ? actions.conflits(w.lid, depuis) : [],
    manque = conflits.filter((c) => !choix[c.m]).length,
    txs = txDe(w.lid),
    rembOk = /santé|sante|transport/i.test(w.poste || "");
  async function enregistrer() {
    if (!Number.isFinite(v) || v < 0) return setEtat("Montant invalide.");
    if (!nom.trim()) return setEtat("Le nom ne peut pas être vide.");
    if (manque) return setEtat("Choisis Garder ou Remplacer pour chaque mois.");
    setEtat("Enregistrement…");
    try {
      await actions.posteModifier({
        lid: w.lid,
        depuis,
        poste: nomChange ? nom : null,
        icone: iconeChange ? icone : undefined,
        montant: montantChange ? v : null,
        portee: epargne ? "suite" : portee,
        garder: conflits.filter((c) => choix[c.m] === "garder").map((c) => c.m),
      });
      onClose();
    } catch (e) {
      setEtat("");
    }
  }
  return (
    <KbSheet label={epargne ? "Épargne programmée" : "Modifier le poste"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {bloque && !readOnly && (
          <div className="bwarn" style={{ margin: 0 }}>
            🔒 {nomMois(moisSel)} est clôturé : rouvre-le pour le modifier.
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            aria-label="Icône"
            value={icone}
            disabled={bloque}
            maxLength={4}
            onChange={(e) => setIcone(e.target.value.trim())}
            style={{ ...champ, width: 56, textAlign: "center", fontSize: 22, padding: 0 }}
          />
          <input
            aria-label="Nom du poste"
            value={nom}
            disabled={bloque}
            onChange={(e) => setNom(e.target.value)}
            style={{ ...champ, flex: 1 }}
          />
        </div>
        <LigneMontant
          id="montant-poste"
          label={epargne ? "Montant · dès " + nomMois(depuis) : "Budget de " + nomMois(moisSel)}
          valeur={montant}
          onChange={setMontant}
          disabled={bloque}
        />
        {!epargne && montantChange && (
          <Segment
            label="Appliquer à"
            valeur={portee}
            onChange={setPortee}
            options={[
              ["mois", "Ce mois"],
              ["suite", "Et les suivants"],
            ]}
          />
        )}
        <Conflits liste={conflits} choix={choix} setChoix={setChoix} nomMois={nomMois} />
        {!bloque && (montantChange || nomChange || iconeChange) && (
          <button type="button" onClick={enregistrer} style={boutonPlein()}>
            Enregistrer
          </button>
        )}
        {etat && (
          <div role="status" style={{ fontWeight: 700, color: "var(--ink-soft)" }}>
            {etat}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {txs.map((x) => {
            const aVenir = x.statut === "prevu",
              auto = x.note === EP_AUTO_NOTE;
            return (
              <div
                key={x.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 14,
                  background: "#f3f8f9",
                  padding: "4px 4px 4px 12px",
                }}
              >
                <button
                  type="button"
                  disabled={readOnly || auto}
                  onClick={() => onEditTx(x)}
                  aria-label={"Modifier " + (x.note || w.poste) + " " + euros(x.montant)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 44,
                    border: 0,
                    background: "transparent",
                    textAlign: "left",
                    fontFamily: "inherit",
                    color: "var(--ink)",
                    cursor: readOnly || auto ? "default" : "pointer",
                    padding: 0,
                  }}
                >
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 700 }}>
                    {(x.type === "remboursement" ? "↩︎ " : "") +
                      (x.note || (x.type === "remboursement" ? "Remboursement" : w.poste))}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      alignItems: "center",
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: "var(--slate)",
                    }}
                  >
                    {hwkFmt(x.date_depense)}
                    {aVenir && (
                      <span
                        style={{
                          borderRadius: 99,
                          background: "#e8e3f7",
                          color: "#4b3a8a",
                          padding: "1px 8px",
                        }}
                      >
                        🔁 à venir
                      </span>
                    )}
                    {x.recurrente_id && !aVenir && <span aria-label="récurrente">🔁</span>}
                    {x.exceptionnelle && (
                      <span
                        style={{
                          borderRadius: 99,
                          background: "#fbeee4",
                          color: "#7a3a12",
                          padding: "1px 8px",
                        }}
                      >
                        exceptionnelle
                      </span>
                    )}
                  </span>
                </button>
                <span
                  style={{
                    fontSize: 14.5,
                    fontWeight: 800,
                    fontVariantNumeric: "tabular-nums",
                    color: x.type === "remboursement" ? VERT : "var(--ink)",
                  }}
                >
                  {(x.type === "remboursement" ? "−" : "") + euros(x.montant)}
                </span>
                {!readOnly && aVenir && !ferme && (
                  <button
                    type="button"
                    onClick={() => onPayee(x)}
                    style={{
                      minHeight: 40,
                      padding: "0 10px",
                      borderRadius: 10,
                      border: 0,
                      background: "#ffffff",
                      color: VERT,
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Payée ✓
                  </button>
                )}
                {!readOnly && auto && !ferme && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (pasVerseId !== x.id) return setPasVerseId(x.id);
                      await onPasVerse(x), setPasVerseId(null);
                    }}
                    style={{
                      minHeight: 40,
                      padding: "0 10px",
                      borderRadius: 10,
                      border: 0,
                      background: "#ffffff",
                      color: pasVerseId === x.id ? ROUGE : "var(--ink-soft)",
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {pasVerseId === x.id ? "Confirmer" : "Pas versé"}
                  </button>
                )}
              </div>
            );
          })}
          {!txs.length && <div className="detail">Aucune dépense en {nomMois(moisSel)}.</div>}
        </div>
        {!bloque && !epargne && (
          <button
            type="button"
            onClick={() => onNewTx({ budget_line_id: w.lid, date_depense: dateDefaut })}
            style={boutonPlein()}
          >
            + Ajouter une dépense
          </button>
        )}
        {!bloque && !epargne && rembOk && (
          <button
            type="button"
            className="btn-outline"
            style={{ width: "100%", minHeight: 48 }}
            onClick={() =>
              onNewTx({ budget_line_id: w.lid, date_depense: dateDefaut, type: "remboursement" })
            }
          >
            ↩︎ Ajouter un remboursement
          </button>
        )}
        {!readOnly && (!ferme || epargne) && (
          <button
            type="button"
            onClick={async () => {
              if (!archiver) return setArchiver(!0);
              try {
                await actions.posteArchiver(w.lid, depuis), onClose();
              } catch (e) {
                setArchiver(!1);
              }
            }}
            style={boutonTexte(ROUGE)}
          >
            {archiver
              ? "Confirmer : plus de « " + w.poste + " » dès " + nomMois(depuis)
              : epargne
                ? "Arrêter ce virement"
                : "Archiver le poste"}
          </button>
        )}
        {archiver && (
          <div className="detail" style={{ textAlign: "center", marginTop: -6 }}>
            Ses dépenses passées restent dans l'historique, l'export et les graphiques.
          </div>
        )}
      </div>
    </KbSheet>
  );
}

function FeuilleSalaire({ ctx, onClose }) {
  const { moisSel, nomMois, readOnly, ferme, actions, salaire, salaireReel, revenu, onSalaireRecu } = ctx;
  const [recu, setRecu] = React.useState(salaireReel == null ? "" : String(salaireReel).replace(".", ",")),
    [prevu, setPrevu] = React.useState(String(salaire).replace(".", ",")),
    [portee, setPortee] = React.useState("suite"),
    [choix, setChoix] = React.useState({}),
    [etat, setEtat] = React.useState(""),
    vp = nombre(prevu),
    prevuChange = revenu && Number.isFinite(vp) && Math.round(vp * 100) !== Math.round(num(salaire) * 100),
    conflits = prevuChange && portee === "suite" ? actions.conflits(revenu.lid, moisSel) : [],
    bloque = readOnly || ferme;
  async function enregistrer() {
    const vr = recu.trim() === "" ? null : nombre(recu);
    if ((vr != null && !(vr >= 0)) || !(vp >= 0)) return setEtat("Montant invalide.");
    if (conflits.some((c) => !choix[c.m])) return setEtat("Choisis Garder ou Remplacer pour chaque mois.");
    setEtat("Enregistrement…");
    try {
      if (vr != null && vr !== salaireReel) await onSalaireRecu(vr);
      if (prevuChange)
        await actions.posteModifier({
          lid: revenu.lid,
          depuis: moisSel,
          montant: vp,
          portee,
          garder: conflits.filter((c) => choix[c.m] === "garder").map((c) => c.m),
        });
      onClose();
    } catch (e) {
      setEtat("");
    }
  }
  return (
    <KbSheet label={"Salaire de " + nomMois(moisSel)} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <LigneMontant
          id="salaire-recu"
          label="Salaire reçu"
          valeur={recu}
          onChange={setRecu}
          disabled={bloque}
        />
        <LigneMontant
          id="salaire-prevu"
          label="Salaire prévu"
          valeur={prevu}
          onChange={setPrevu}
          disabled={bloque}
        />
        {prevuChange && (
          <Segment
            label="Appliquer à"
            valeur={portee}
            onChange={setPortee}
            options={[
              ["mois", "Ce mois"],
              ["suite", "Et les suivants"],
            ]}
          />
        )}
        <Conflits liste={conflits} choix={choix} setChoix={setChoix} nomMois={nomMois} />
        {!bloque && (
          <button type="button" onClick={enregistrer} style={boutonPlein()}>
            Enregistrer
          </button>
        )}
        {etat && (
          <div role="status" style={{ fontWeight: 700, color: "var(--ink-soft)" }}>
            {etat}
          </div>
        )}
      </div>
    </KbSheet>
  );
}

function FeuilleProjection({ p, nomMois, moisSel, onClose }) {
  const lignes = [
    ["Reste aujourd'hui", e0(p.resteAujourdhui)],
    ["Prélèvements à venir", "− " + e0(p.prevu)],
    ["Dépenses courantes : " + euros(p.parJour) + "/jour × " + p.joursRestants + " j", "− " + e0(p.rythme)],
  ];
  return (
    <KbSheet
      label={
        "Projection au " +
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() +
        " " +
        nomMois(moisSel).toLowerCase()
      }
      onClose={onClose}
    >
      <div style={{ background: "#f3f8f9", borderRadius: 16, padding: "6px 14px" }}>
        {lignes.map(([l, v]) => (
          <div
            key={l}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              padding: "9px 0",
              fontSize: 14.5,
              fontWeight: 600,
              color: "var(--ink-soft)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span>{l}</span>
            <span style={{ whiteSpace: "nowrap" }}>{v}</span>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            padding: "10px 0",
            borderTop: "2px solid #c9dadd",
            fontSize: 17,
            fontWeight: 800,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span>Fin du mois</span>
          <span>≈ {e0(p.finDeMois)}</span>
        </div>
      </div>
      <p className="detail" style={{ marginBottom: 0 }}>
        Une dépense marquée « exceptionnelle » compte dans le budget mais pas dans le rythme par jour.
      </p>
    </KbSheet>
  );
}

function FeuilleNouveauPoste({ ctx, onClose }) {
  const { moisSel, nomMois, actions } = ctx;
  const [nom, setNom] = React.useState(""),
    [icone, setIcone] = React.useState("✨"),
    [montant, setMontant] = React.useState(""),
    [etat, setEtat] = React.useState("");
  async function ajouter() {
    const v = montant.trim() === "" ? 0 : nombre(montant);
    if (!(v >= 0)) return setEtat("Montant invalide.");
    try {
      await actions.posteAjouter({ poste: nom, icone, montant: v, depuis: moisSel });
      onClose();
    } catch (e) {
      setEtat("");
    }
  }
  return (
    <KbSheet label="Nouveau poste" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            aria-label="Icône"
            value={icone}
            maxLength={4}
            onChange={(e) => setIcone(e.target.value.trim())}
            style={{ ...champ, width: 56, textAlign: "center", fontSize: 22, padding: 0 }}
          />
          <input
            aria-label="Nom du poste"
            placeholder="ex. Cadeaux"
            value={nom}
            data-autofocus
            onChange={(e) => setNom(e.target.value)}
            style={{ ...champ, flex: 1 }}
          />
        </div>
        <LigneMontant
          id="montant-nouveau"
          label={"Budget dès " + nomMois(moisSel)}
          valeur={montant}
          onChange={setMontant}
        />
        <button
          type="button"
          disabled={!nom.trim()}
          onClick={ajouter}
          style={{ ...boutonPlein(), opacity: nom.trim() ? 1 : 0.5 }}
        >
          Ajouter
        </button>
        {etat && (
          <div role="status" style={{ fontWeight: 700, color: ROUGE }}>
            {etat}
          </div>
        )}
      </div>
    </KbSheet>
  );
}

export function BudgetCartes(props) {
  const {
    moisSel,
    nomMois,
    courantes,
    epargne,
    salaire,
    salaireReel,
    vacSolde,
    epDispo,
    cible,
    projection,
    readOnly,
    ferme,
  } = props;
  const [ouvert, setOuvert] = React.useState(null); // {type, lid}
  const depense = courantes.reduce((s, w) => s + w.r, 0),
    budgetC = courantes.reduce((s, w) => s + w.b, 0),
    epB = epargne.reduce((s, w) => s + w.b, 0),
    epR = epargne.reduce((s, w) => s + w.r, 0),
    base = salaireReel != null ? salaireReel : salaire,
    epCompte = Math.max(epB, epR),
    reste = base - depense - epCompte,
    rouge = reste < 0,
    triees = [...courantes].sort((a, b) => {
      const ra = a.b ? a.r / a.b : a.r > 0 ? 99 : 0,
        rb = b.b ? b.r / b.b : b.r > 0 ? 99 : 0;
      return rb - ra || (a.poste || "").localeCompare(b.poste || "", "fr");
    }),
    pct = (v) => (base > 0 ? Math.max(0, Math.min(100, (v / base) * 100)).toFixed(1) + "%" : "0%"),
    ctx = { ...props, nomMois };
  const wOuvert = ouvert && ouvert.lid ? [...courantes, ...epargne].find((w) => w.lid === ouvert.lid) : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
      {props.matelas && moisSel === props.matelas.M && (
        <CarteMatelas
          etat={props.matelas}
          readOnly={readOnly}
          onOui={() =>
            props.matelas.proposition === "basculer"
              ? props.actions.basculerPEA(props.matelas)
              : props.actions.recompleterMatelas(props.matelas)
          }
          onPlusTard={() => props.actions.matelasPlusTard(props.matelas.M)}
        />
      )}
      <section
        aria-label="Salaire du mois"
        style={{
          background: rouge ? ROUGE : "var(--teal-dark)",
          color: "#ffffff",
          borderRadius: 22,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          boxShadow: "0 10px 24px rgba(10,123,138,.22)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              opacity: 0.92,
            }}
          >
            {rouge ? "Dépassement" : "Reste sur le salaire"}
            {projection ? " · " + projection.joursRestants + " jours" : ""}
          </span>
          <button
            type="button"
            onClick={() => setOuvert({ type: "salaire" })}
            aria-label={
              "Salaire " +
              (salaireReel != null ? "reçu " + euros(salaireReel) : "prévu " + euros(salaire)) +
              ", modifier"
            }
            style={{
              border: 0,
              background: "rgba(255,255,255,.18)",
              color: "#ffffff",
              borderRadius: 99,
              padding: "8px 12px",
              minHeight: 36,
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flex: "none",
            }}
          >
            Salaire {e0(base)} {readOnly ? "" : "✏️"}
          </button>
        </div>
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 34,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {e0(reste)}
        </div>
        <div
          style={{
            height: 10,
            borderRadius: 99,
            background: "rgba(255,255,255,.25)",
            overflow: "hidden",
            display: "flex",
          }}
          aria-hidden="true"
        >
          <span style={{ width: pct(depense), background: "#ffffff" }} />
          <span style={{ width: pct(epCompte), background: "rgba(255,255,255,.6)" }} />
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 13, fontWeight: 700, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "#ffffff" }} />
            Dépensé {e0(depense)}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(255,255,255,.6)" }} />
            Épargné {e0(epCompte)}
          </span>
        </div>
        {projection && (
          <button
            type="button"
            onClick={() => setOuvert({ type: "projection" })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: 0,
              borderRadius: 14,
              background: "rgba(255,255,255,.16)",
              color: "#ffffff",
              padding: "10px 12px",
              textAlign: "left",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 16 }}>
              🔮
            </span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>
              À ce rythme, le {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} :{" "}
              <b style={{ fontSize: 16 }}>{e0(projection.finDeMois)}</b>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        )}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        {[
          ["✈️", e0(vacSolde), "Provision vacances"],
          [
            "🎯",
            e0(epDispo),
            "Épargne" + (cible ? " · " + Math.round((epDispo / cible) * 100) + " % de l'objectif" : ""),
          ],
        ].map(([i, v, l]) => {
          const matelas = i === "🎯" && props.matelas;
          const Balise = matelas ? "button" : "div";
          return (
            <Balise
              key={l}
              type={matelas ? "button" : undefined}
              onClick={matelas ? () => setOuvert({ type: "matelas" }) : undefined}
              aria-label={matelas ? l + " : " + v + ", ouvrir Matelas et PEA" : undefined}
              style={{
                ...carteStyle,
                padding: 12,
                border: 0,
                textAlign: "left",
                fontFamily: "inherit",
                color: "var(--ink)",
                cursor: matelas ? "pointer" : "default",
              }}
            >
              <div aria-hidden="true" style={{ fontSize: 18 }}>
                {i}
              </div>
              <div
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: 22,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {v}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--slate)" }}>{l}</div>
            </Balise>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          margin: "4px 4px 0",
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 800 }}>Dépenses</span>
        <span
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: "var(--slate)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {e0(depense)} / {e0(budgetC)}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        {triees.map((w) => {
          const over = w.r > w.b + 0.005,
            ratio = w.b ? w.r / w.b : w.r > 0 ? 1 : 0,
            couleur = over ? ROUGE : ratio > 0.85 ? ORANGE : VERT,
            ecart = w.b - w.r;
          return (
            <button
              key={w.lid}
              type="button"
              onClick={() => setOuvert({ type: "poste", lid: w.lid })}
              aria-label={
                w.poste +
                " : " +
                euros(w.r) +
                " sur " +
                euros(w.b) +
                (w.prevu ? ", dont " + euros(w.prevu) + " à venir" : "") +
                ", modifier"
              }
              style={{
                ...carteStyle,
                border: "2px solid " + (over ? ROUGE : "transparent"),
                background: over ? "#fff4f1" : "#ffffff",
                padding: 12,
                minHeight: 112,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 4,
                textAlign: "left",
                color: "var(--ink)",
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  display: "flex",
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 20 }}>
                  {catIcone(w.poste)}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: over ? ROUGE : VERT,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {over ? "−" + e0(-ecart) : ratio >= 0.999 && w.b ? "✓" : "reste " + e0(ecart)}
                </span>
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-soft)", lineHeight: 1.2 }}>
                {w.poste}
              </span>
              <span
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: 19,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {e0(w.r)}{" "}
                <span
                  style={{ fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--slate)" }}
                >
                  / {e0(w.b)}
                </span>
              </span>
              {w.prevu ? (
                <span style={{ fontSize: 11.5, fontWeight: 800, color: "#4b3a8a" }}>
                  dont {e0(w.prevu)} à venir
                </span>
              ) : null}
              <span
                style={{
                  width: "100%",
                  height: 7,
                  borderRadius: 99,
                  background: "#eef3f4",
                  overflow: "hidden",
                  marginTop: "auto",
                }}
                aria-hidden="true"
              >
                <span
                  style={{
                    display: "block",
                    height: 7,
                    borderRadius: 99,
                    width: Math.min(100, ratio * 100) + "%",
                    background: couleur,
                  }}
                />
              </span>
            </button>
          );
        })}
        {!readOnly && !ferme && (
          <button
            type="button"
            onClick={() => setOuvert({ type: "nouveau" })}
            style={{
              border: "2px dashed #b9cfd3",
              borderRadius: 18,
              background: "transparent",
              minHeight: 112,
              color: "var(--teal-dark)",
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            + Poste
          </button>
        )}
      </div>

      <div style={{ fontSize: 16, fontWeight: 800, margin: "4px 4px 0" }}>
        Épargne programmée · le {props.jourEpargne}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(1, Math.min(3, epargne.length))}, minmax(0, 1fr))`,
          gap: 8,
        }}
      >
        {epargne.map((w) => {
          const verse = w.r >= w.b - 0.005 && w.b > 0;
          return (
            <button
              key={w.lid}
              type="button"
              onClick={() => setOuvert({ type: "epargne", lid: w.lid })}
              aria-label={
                w.poste + " " + euros(w.b) + (verse ? ", versé" : ", pas encore versé") + ", modifier"
              }
              style={{
                ...carteStyle,
                border: 0,
                padding: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                color: "var(--ink)",
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: verse ? "#e3f4ed" : "#eef3f4",
                  color: verse ? "#0b6e53" : "var(--slate)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 900,
                }}
              >
                {verse ? "✓" : "·"}
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                {e0(w.b)}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--slate)", textAlign: "center" }}>
                {w.poste}
              </span>
            </button>
          );
        })}
      </div>

      {ouvert && ouvert.type === "poste" && wOuvert && (
        <FeuillePoste w={wOuvert} ctx={ctx} mode="courantes" onClose={() => setOuvert(null)} />
      )}
      {ouvert && ouvert.type === "epargne" && wOuvert && (
        <FeuillePoste w={wOuvert} ctx={ctx} mode="epargne" onClose={() => setOuvert(null)} />
      )}
      {ouvert && ouvert.type === "salaire" && <FeuilleSalaire ctx={ctx} onClose={() => setOuvert(null)} />}
      {ouvert && ouvert.type === "projection" && projection && (
        <FeuilleProjection
          p={projection}
          nomMois={nomMois}
          moisSel={moisSel}
          onClose={() => setOuvert(null)}
        />
      )}
      {ouvert && ouvert.type === "matelas" && props.matelas && (
        <FeuilleMatelas
          etat={props.matelas}
          readOnly={readOnly}
          onClose={() => setOuvert(null)}
          onNoterPEA={props.actions.peaNoter}
        />
      )}
      {ouvert && ouvert.type === "nouveau" && (
        <FeuilleNouveauPoste ctx={ctx} onClose={() => setOuvert(null)} />
      )}
    </div>
  );
}
