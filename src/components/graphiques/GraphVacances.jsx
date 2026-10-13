import { pocketCalc } from "../../lib/calculs.js";
import { eurosEntiers, nombreEntier, paramOuDefaut } from "../../lib/format.js";
import { MOIS } from "../../lib/mois.js";

export function GraphVacances({ budget: t, params: e, items: im }) {
  const r = pocketCalc(im, "vacances", paramOuDefaut(e, "provision_vacances_mensuelle"), MOIS.length).solde,
    n = MOIS,
    s = 680,
    i = 240,
    o = {
      l: 48,
      r: 16,
      t: 16,
      b: 34,
    },
    a = s - o.l - o.r,
    l = i - o.t - o.b;
  let u = Math.min(0, ...r),
    c = Math.max(...r, 1);
  const d = c - u || 1;
  (u -= d * 0.08), (c += d * 0.1);
  const p = (y) => o.l + y * (a / (n.length - 1)),
    m = (y) => o.t + (1 - (y - u) / (c - u)) * l,
    v = r.map((y, f) => `${f === 0 ? "M" : "L"}${p(f).toFixed(1)},${m(y).toFixed(1)}`).join(" "),
    k = Math.min(...r),
    x = r.indexOf(k);
  return (
    <div className="card">
      <svg
        viewBox={`0 0 ${s} ${i}`}
        style={{
          display: "block",
          width: "100%",
          height: "auto",
        }}
        role="img"
        aria-label="Projection de la poche vacances"
      >
        {[0, 1, 2].map((y) => {
          const f = u + ((c - u) * y) / 2;
          return (
            <g key={y}>
              <line x1={o.l} y1={m(f)} x2={s - o.r} y2={m(f)} stroke="#d7e7e8" strokeWidth="1" />
              <text x={o.l - 8} y={m(f) + 4} textAnchor="end" fontSize="11" fill="#5a787e">
                {nombreEntier(f)}
              </text>
            </g>
          );
        })}
        {u < 0 && (
          <line
            x1={o.l}
            y1={m(0)}
            x2={s - o.r}
            y2={m(0)}
            stroke="#dd5f43"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}
        <path
          d={v}
          fill="none"
          stroke="#12a07a"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {n.map(
          (y, f) =>
            (f % 2 === 0 || f === n.length - 1) && (
              <text x={p(f)} y={i - 12} textAnchor="middle" fontSize="11" fill="#5a787e" key={f}>
                {y}
              </text>
            ),
        )}
        {r.map((y, f) => (
          <circle cx={p(f)} cy={m(y)} r={f === x ? 4 : 2.5} fill={f === x ? "#dd5f43" : "#12a07a"} key={f} />
        ))}
      </svg>
      <div className="note">
        {"Plancher à "}
        {eurosEntiers(k)}
        {" en "}
        {n[x]}
        {" (après le grand voyage). En dessous de 0, ça déborderait sur les livrets."}
      </div>
    </div>
  );
}
