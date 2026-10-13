import { GraphMatelas } from "./GraphMatelas.jsx";
import { GraphProjection } from "./GraphProjection.jsx";
import { GraphRepartition } from "./GraphRepartition.jsx";
import { GraphVacances } from "./GraphVacances.jsx";
import { budgetDuMois } from "../../lib/calculs.js";
import { nombreEntier, totalParType } from "../../lib/format.js";
import { moisNow } from "../../lib/mois.js";

export function Graphiques({
  budget: modele,
  params: e,
  voyages: r,
  items: im,
  spend: spAll,
  budgetMois: bmAll,
  poches: pochesRows,
}) {
  const t = modele ? budgetDuMois(bmAll, modele, moisNow()) : null;
  if (!t)
    return (
      <section className="sec">
        <p className="sub">Chargement…</p>
      </section>
    );
  const n = totalParType(t, "charge");
  return (
    <section className="sec">
      <h2>Graphiques</h2>
      <p className="sub">
        Calculés en direct depuis ton budget — ils se mettent à jour dès que tu édites la Trésorerie.
      </p>
      <div className="h3">Projection de l'épargne (livrets)</div>
      <GraphProjection budget={t} params={e} voyages={r} items={im} poches={pochesRows} />
      <div className="h3">Matelas de sécurité</div>
      <GraphMatelas budget={t} params={e} items={im} poches={pochesRows} />
      <div className="h3">Poche vacances</div>
      <GraphVacances budget={t} params={e} items={im} />
      <div className="h3">{`Répartition des charges — ${nombreEntier(n)} €/mois`}</div>
      <GraphRepartition budget={t} spend={spAll} />
    </section>
  );
}
