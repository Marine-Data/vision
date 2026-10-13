import { MOIS } from "../../lib/mois.js";
import { GraphDepenses } from "./GraphDepenses.jsx";
import { GraphEpargne } from "./GraphEpargne.jsx";
import { GraphVacances } from "./GraphVacances.jsx";

// Onglet Graphiques : 3 graphiques calculés comme le tableau Excel.
// Période affichée : l'année scolaire, de septembre 2026 (mois 1) à août 2027 (mois 12).
export function Graphiques({ budget, params, items, budgetMois, transactions }) {
  if (!budget)
    return (
      <section className="sec">
        <p className="sub">Chargement…</p>
      </section>
    );
  const indices = Array.from({ length: Math.min(12, MOIS.length - 1) }, (_, k) => k + 1);
  return (
    <section className="sec">
      <h2>Graphiques</h2>
      <GraphEpargne budget={budget} params={params} items={items} indices={indices} />
      <GraphVacances params={params} items={items} indices={indices} />
      <GraphDepenses budget={budget} budgetMois={budgetMois} transactions={transactions} />
    </section>
  );
}
