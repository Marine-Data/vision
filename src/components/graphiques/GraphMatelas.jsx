import {
  calcsDesPoches,
  creuxEtReprise,
  formationCalc,
  getCible,
  planDisponible,
  planEpargne,
  pocketCalc,
  reelDisponible,
} from "../../lib/calculs.js";
import { eurosEntiers, paramOuDefaut, relevesLivrets } from "../../lib/format.js";
import { MOIS, moisNow } from "../../lib/mois.js";

export function GraphMatelas({ budget: t, params: e, items: im, poches: pochesRows }) {
  const rawPlan = planEpargne(im, e),
    n = getCible(e, t),
    vac = pocketCalc(im, "vacances", paramOuDefaut(e, "provision_vacances_mensuelle"), MOIS.length),
    form = formationCalc(im, e, MOIS.length),
    sport = pocketCalc(im, "sport", 0, MOIS.length, !0),
    pocheCalcs = calcsDesPoches(pochesRows, im, e, MOIS.length),
    r = rawPlan.map((q, V) => planDisponible(rawPlan, pocheCalcs, V)),
    rawReel = relevesLivrets(e, MOIS.length),
    M = moisNow(),
    latestReel = (() => {
      for (let w = MOIS.length - 1; w >= 0; w--)
        if (rawReel[w] != null) return reelDisponible(rawReel, pocheCalcs, w);
      return null;
    })(),
    s = latestReel != null ? latestReel : r[M],
    { troughIdx: i, recIdx: o } = creuxEtReprise(r, n),
    a = n > 0 ? Math.round((s / n) * 100) : 0,
    l = Math.max(0, Math.min(100, a)),
    u = s >= n;
  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div>
          <span
            style={{
              fontFamily: "Georgia,serif",
              fontSize: "1.9rem",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {eurosEntiers(s)}
          </span>
          <span
            style={{
              color: "var(--slate)",
              fontSize: 13,
              marginLeft: 6,
            }}
          >
            sur les livrets
          </span>
        </div>
        <div
          style={{
            textAlign: "right",
          }}
        >
          <div
            style={{
              color: "var(--slate)",
              fontSize: 13,
            }}
          >
            Cible 6 mois
          </div>
          <div
            style={{
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {eurosEntiers(n)}
          </div>
        </div>
      </div>
      <div className="prog">
        <i
          style={{
            width: l + "%",
            background: u ? "var(--green)" : "var(--oxblood)",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--slate)",
        }}
      >
        <span>0 €</span>
        <span
          style={{
            color: u ? "var(--green)" : "var(--oxblood)",
            fontWeight: 700,
          }}
        >
          {u ? "Atteint" : "En cours"}
          {" · "}
          {a}
          {" %"}
        </span>
      </div>
      <div className="note">
        {"Une fois les dépenses de reconversion déduites, le matelas plonge à "}
        {eurosEntiers(r[i])}
        {" en "}
        {MOIS[i]}
        {", puis repasse au-dessus de "}
        {eurosEntiers(n)}
        {" vers "}
        {o >= 0 ? MOIS[o] : "plus tard"}
        {" — avant la bascule sur le PEA."}
      </div>
    </div>
  );
}
