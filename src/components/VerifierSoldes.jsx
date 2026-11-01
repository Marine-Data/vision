import React from "react";
import { euros, num } from "../lib/format.js";
import { isoAujourdhui } from "../lib/mois.js";
import { totalAttendu } from "../lib/soldes.js";

// « Vérifier mes soldes » : tu tapes le solde de chacun de tes comptes, l'app compare
// au total attendu par Vision. Les noms et derniers soldes restent sur cet appareil.
const CLE = "vision_soldes_comptes";
const DEFAUT = [
  { nom: "Compte courant", solde: "" },
  { nom: "Livrets", solde: "" },
];
const lire = () => {
  try {
    const v = JSON.parse(localStorage.getItem(CLE) || "null");
    return Array.isArray(v) && v.length ? v : DEFAUT;
  } catch (e) {
    return DEFAUT;
  }
};
const nombre = (v) => Number(String(v).replace(/\s/g, "").replace(",", ".")) || 0;

export function VerifierSoldes({ donnees, moisIndex, salairePrevu }) {
  const [comptes, setComptes] = React.useState(lire);
  const [salaireArrive, setSalaireArrive] = React.useState(false);
  const [salaire, setSalaire] = React.useState(String(salairePrevu || ""));
  React.useEffect(() => {
    try {
      localStorage.setItem(CLE, JSON.stringify(comptes));
    } catch (e) {}
  }, [comptes]);

  const maj = (i, patch) => setComptes((c) => c.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const att = totalAttendu(donnees, moisIndex, isoAujourdhui(), salaireArrive ? nombre(salaire) : 0);
  const reel = comptes.reduce((s, c) => s + nombre(c.solde), 0);
  const rempli = comptes.some((c) => String(c.solde).trim() !== "");
  const ecart = Math.round((reel - att.total) * 100) / 100;

  const ligne = (label, v, gras) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 13,
        padding: "3px 0",
        fontWeight: gras ? 700 : 400,
      }}
    >
      <span>{label}</span>
      <span>{euros(v)}</span>
    </div>
  );

  return (
    <details className="collapsible" style={{ marginBottom: 12 }}>
      <summary>🔎 Vérifier mes soldes</summary>
      <div className="inner">
        <p className="detail">Tape le solde de chacun de tes comptes (banque, livrets, Revolut, PayPal…).</p>
        {comptes.map((c, i) => (
          <div className="brow" key={i}>
            <div className="bcol">
              <input
                className="bedit lbl"
                value={c.nom}
                placeholder="Compte"
                aria-label="Nom du compte"
                onChange={(e) => maj(i, { nom: e.target.value })}
              />
            </div>
            <input
              className="bedit bnum"
              inputMode="decimal"
              value={c.solde}
              placeholder="0"
              aria-label={"Solde " + c.nom}
              onChange={(e) => maj(i, { solde: e.target.value })}
            />
            {comptes.length > 1 && (
              <button
                className="bdel"
                aria-label={"Retirer " + c.nom}
                onClick={() => setComptes((l) => l.filter((_, j) => j !== i))}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button className="badd" onClick={() => setComptes((l) => [...l, { nom: "", solde: "" }])}>
          + Ajouter un compte
        </button>

        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, margin: "10px 0" }}>
          <input
            type="checkbox"
            checked={salaireArrive}
            onChange={(e) => setSalaireArrive(e.target.checked)}
          />
          Mon salaire est arrivé
          {salaireArrive && (
            <input
              className="bedit bnum"
              style={{ width: 90 }}
              inputMode="decimal"
              value={salaire}
              aria-label="Montant du salaire arrivé"
              onChange={(e) => setSalaire(e.target.value)}
            />
          )}
        </label>

        <div style={{ borderTop: "1px solid var(--line, #dbeaec)", paddingTop: 6 }}>
          {ligne("Épargne", att.epargne)}
          {ligne("Enveloppe formation + sport", att.enveloppe)}
          {ligne("Provision vacances", att.vacances)}
          {att.paiementsPoches > 0 && ligne("− Payé ce mois sur les enveloppes", -att.paiementsPoches)}
          {att.depensesMois !== 0 && ligne("− Dépenses saisies ce mois", -att.depensesMois)}
          {att.salaireRecu > 0 && ligne("+ Salaire arrivé", att.salaireRecu)}
          {ligne("Attendu par Vision", att.total, true)}
          {rempli && ligne("Sur tes comptes", reel, true)}
        </div>
        {rempli && (
          <div className={Math.abs(ecart) < 10 ? "bok" : "bwarn"} style={{ marginTop: 8 }}>
            {Math.abs(ecart) < 10
              ? "✓ Tes comptes correspondent à Vision."
              : ecart > 0
                ? `Tu as ${euros(ecart)} de plus que prévu.`
                : `Il manque ${euros(-ecart)} par rapport à Vision : une dépense non saisie, ou un prélèvement saisi mais pas encore passé ?`}
          </div>
        )}
      </div>
    </details>
  );
}
