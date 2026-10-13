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
import { eurosEntiers, nombreEntier, paramOuDefaut, relevesLivrets } from "../../lib/format.js";
import { MOIS } from "../../lib/mois.js";

export function GraphProjection({ budget: t, params: e, voyages: vg, items: im, poches: pochesRows }) {
  const rawPlan = planEpargne(im, e),
    vacX = pocketCalc(im, "vacances", paramOuDefaut(e, "provision_vacances_mensuelle"), MOIS.length),
    formX = formationCalc(im, e, MOIS.length),
    sportX = pocketCalc(im, "sport", 0, MOIS.length, !0),
    pocheCalcsX = calcsDesPoches(pochesRows, im, e, MOIS.length),
    r = rawPlan.map((q, V) => planDisponible(rawPlan, pocheCalcsX, V)),
    n = getCible(e, t),
    { troughIdx: s, recIdx: i } = creuxEtReprise(r, n),
    o = 4,
    a = paramOuDefaut(e, "du_paiement"),
    l = 680,
    u = 300,
    c = {
      l: 54,
      r: 16,
      t: 18,
      b: 34,
    },
    d = l - c.l - c.r,
    p = u - c.t - c.b,
    m = [...r, n];
  let v = Math.min(...m),
    k = Math.max(...m);
  const x = k - v || 1;
  (v -= x * 0.08), (k += x * 0.1);
  const y = (w) => c.l + w * (d / (MOIS.length - 1)),
    f = (w) => c.t + (1 - (w - v) / (k - v)) * p,
    g = r.map((w, j) => `${j === 0 ? "M" : "L"}${y(j).toFixed(1)},${f(w).toFixed(1)}`).join(" "),
    S = `${g} L${y(r.length - 1).toFixed(1)},${f(v).toFixed(1)} L${y(0).toFixed(1)},${f(v).toFixed(1)} Z`,
    b = [0, 1, 2, 3, 4].map((w) => v + ((k - v) * w) / 4);
  return (
    <div className="card">
      <svg
        viewBox={`0 0 ${l} ${u}`}
        style={{
          display: "block",
          width: "100%",
          height: "auto",
        }}
        role="img"
        aria-label="Projection de l'épargne"
      >
        {b.map((w, j) => (
          <g key={j}>
            <line x1={c.l} y1={f(w)} x2={l - c.r} y2={f(w)} stroke="#d7e7e8" strokeWidth="1" />
            <text x={c.l - 8} y={f(w) + 4} textAnchor="end" fontSize="11" fill="#5a787e">
              {nombreEntier(w)}
            </text>
          </g>
        ))}
        <line
          x1={c.l}
          y1={f(n)}
          x2={l - c.r}
          y2={f(n)}
          stroke="#12a07a"
          strokeWidth="1.5"
          strokeDasharray="5 4"
        />
        <text x={l - c.r} y={f(n) - 6} textAnchor="end" fontSize="11" fill="#12a07a">
          {"Matelas "}
          {eurosEntiers(n)}
        </text>
        <path d={S} fill="#0e9fb2" opacity="0.07" />
        <path
          d={g}
          fill="none"
          stroke="#0e9fb2"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {MOIS.map(
          (w, j) =>
            (j % 2 === 0 || j === MOIS.length - 1) && (
              <text x={y(j)} y={u - 12} textAnchor="middle" fontSize="11" fill="#5a787e" key={j}>
                {w}
              </text>
            ),
        )}
        {r.map((w, j) => {
          const P = j <= 2 || j === o;
          return <circle cx={y(j)} cy={f(w)} r={P ? 4 : 2.5} fill={P ? "#e0794a" : "#0e9fb2"} key={j} />;
        })}
        <text x={y(o)} y={f(r[o]) + 18} textAnchor="middle" fontSize="11" fill="#e0794a">
          {"− "}
          {nombreEntier(a)}
          {" DU"}
        </text>
        {i >= 0 && (
          <g>
            <line
              x1={y(i)}
              y1={c.t}
              x2={y(i)}
              y2={u - c.b}
              stroke="#12a07a"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <circle cx={y(i)} cy={f(r[i])} r="4.5" fill="#12a07a" />
            <text
              x={y(i)}
              y={c.t + 10}
              textAnchor={i > MOIS.length - 3 ? "end" : "middle"}
              fontSize="11"
              fontWeight="700"
              fill="#12a07a"
            >
              Bascule PEA 🌊
            </text>
          </g>
        )}
        {(() => {
          const vac = vacX,
            form = formX,
            sport = sportX,
            pocheCalcs = pocheCalcsX,
            rawReel = relevesLivrets(e, MOIS.length),
            w = rawReel.map((q, V) => reelDisponible(rawReel, pocheCalcs, V)),
            j = w.map((q, V) => (q != null ? V : -1)).filter((q) => q >= 0);
          if (!j.length) return null;
          const P = j
            .map((q, V) => `${V === 0 ? "M" : "L"}${y(q).toFixed(1)},${f(w[q]).toFixed(1)}`)
            .join(" ");
          return (
            <g>
              <path d={P} fill="none" stroke="#0e3a42" strokeWidth="2.5" strokeLinejoin="round" />
              {j.map((q) => (
                <circle cx={y(q)} cy={f(w[q])} r="3.5" fill="#0e3a42" key={q} />
              ))}
            </g>
          );
        })()}
        <g transform={`translate(${c.l + 6},${c.t + 4})`}>
          <line x1="0" y1="0" x2="16" y2="0" stroke="#0e9fb2" strokeWidth="2.5" />
          <text x="20" y="4" fontSize="10.5" fill="#5a787e">
            prévu
          </text>
          <line x1="66" y1="0" x2="82" y2="0" stroke="#0e3a42" strokeWidth="2.5" />
          <text x="86" y="4" fontSize="10.5" fill="#5a787e">
            réel
          </text>
        </g>
      </svg>
      <div className="note">
        {
          "Vacances, sport et formation (SCAP + DU) déduits en totalité dès qu'ils sont provisionnés — la courbe représente l'épargne réellement disponible, hors tout engagement. Objectif de "
        }
        {eurosEntiers(n)}
        {" atteint "}
        {i >= 0 ? MOIS[i] : "plus tard"}.
      </div>
    </div>
  );
}
