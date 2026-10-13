import { depasseCategorie } from "../../lib/calculs.js";
import { eurosCourt, eurosEntiers, nombreEntier } from "../../lib/format.js";
import { MOIS, moisNow } from "../../lib/mois.js";

export const COULEURS_GRAPHIQUES = [
  "#0e9fb2",
  "#12a07a",
  "#3fb6c4",
  "#5b9bb0",
  "#7fccd4",
  "#2f8f9e",
  "#e0794a",
  "#4a7a8c",
  "#8fd0d6",
  "#5a787e",
  "#1c6e7a",
  "#c9873f",
];

export function GraphRepartition({ budget: t, spend: spAll }) {
  const e = (t || [])
      .filter((a) => a.kind === "charge")
      .map((a, l) => ({
        id: a.id,
        type: a.type,
        nom: a.poste,
        montant: Number(a.montant) || 0,
        couleur: COULEURS_GRAPHIQUES[l % COULEURS_GRAPHIQUES.length],
      })),
    r = e.reduce((a, l) => a + l.montant, 0) || 1,
    n = 70,
    s = 100,
    i = 2 * Math.PI * n;
  let o = 0;
  return (
    <div className="card">
      <div
        style={{
          maxWidth: 230,
          margin: "0 auto",
        }}
      >
        <svg
          viewBox="0 0 200 200"
          style={{
            display: "block",
            width: "100%",
            height: "auto",
          }}
          role="img"
          aria-label="Répartition des charges"
        >
          <circle cx={s} cy={s} r={n} fill="none" stroke="#efe7d8" strokeWidth="26" />
          {e.map((a, l) => {
            const u = (a.montant / r) * i,
              c = (
                <circle
                  cx={s}
                  cy={s}
                  r={n}
                  fill="none"
                  stroke={a.couleur}
                  strokeWidth="26"
                  strokeDasharray={`${u.toFixed(2)} ${(i - u).toFixed(2)}`}
                  strokeDashoffset={(-o).toFixed(2)}
                  transform={`rotate(-90 ${s} ${s})`}
                  key={l}
                />
              );
            return (o += u), c;
          })}
          <text
            x={s}
            y={s - 4}
            textAnchor="middle"
            style={{
              fontFamily: "Georgia,serif",
              fontSize: 22,
              fontWeight: 600,
              fill: "#23323a",
            }}
          >
            {nombreEntier(r)}
            {" €"}
          </text>
          <text x={s} y={s + 16} textAnchor="middle" fontSize="11" fill="#5a787e">
            par mois
          </text>
        </svg>
      </div>
      <div
        style={{
          marginTop: 10,
        }}
      >
        {e.map((a, l) => (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "6px 0",
              borderBottom: l < e.length - 1 ? "1px solid var(--line)" : 0,
            }}
            key={l}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: a.couleur,
                flex: "0 0 auto",
              }}
            />
            <span
              style={{
                flex: 1,
                fontSize: 13.5,
              }}
            >
              {a.nom}
            </span>
            <span
              style={{
                fontVariantNumeric: "tabular-nums",
                fontWeight: 600,
                fontSize: 13.5,
              }}
            >
              {eurosEntiers(a.montant)}
            </span>
            <span
              style={{
                color: "var(--slate)",
                fontSize: 12,
                width: 44,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {Math.round((a.montant / r) * 100)}
              {" %"}
            </span>
          </div>
        ))}
      </div>
      {(() => {
        const fixe = e.filter((a) => a.type === "fixe").reduce((s, a) => s + a.montant, 0),
          variable = e.filter((a) => a.type === "variable").reduce((s, a) => s + a.montant, 0),
          autre = r - fixe - variable,
          M = moisNow(),
          spentByLine = (a) => {
            const rec = (spAll || []).find((x) => x.budget_line_id === a.id && x.mois_index === M);
            return rec ? Number(rec.montant) : null;
          },
          noteByLine = (a) => {
            const rec = (spAll || []).find((x) => x.budget_line_id === a.id && x.mois_index === M);
            return rec ? rec.note : "";
          },
          totalSpent = e.reduce((s, a) => {
            const val = spentByLine(a);
            return s + (val != null ? val : 0);
          }, 0),
          anySpent = e.some((a) => spentByLine(a) != null);
        return (
          <>
            {(fixe > 0 || variable > 0) && (
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: "1px solid var(--line)",
                }}
              >
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  Fixe vs variable
                </div>
                <div
                  style={{
                    display: "flex",
                    height: 22,
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  {[
                    ["Fixe", fixe, "var(--oxblood)"],
                    ["Variable", variable, "var(--green)"],
                    ["Autre", autre, "var(--line)"],
                  ]
                    .filter(([, v]) => v > 0)
                    .map(([lbl, v, col], idx) => (
                      <div
                        style={{
                          width: (v / r) * 100 + "%",
                          background: col,
                        }}
                        title={lbl + " : " + eurosCourt(v)}
                        key={idx}
                      />
                    ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 6,
                    fontSize: 11.5,
                    color: "var(--slate)",
                  }}
                >
                  {fixe > 0 && (
                    <span>
                      {"● Fixe "}
                      {eurosCourt(fixe)}
                    </span>
                  )}
                  {variable > 0 && (
                    <span>
                      {"● Variable "}
                      {eurosCourt(variable)}
                    </span>
                  )}
                </div>
              </div>
            )}
            {anySpent && (
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: "1px solid var(--line)",
                }}
              >
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  {"Budget vs réel — "}
                  {MOIS[M]}
                </div>
                {e
                  .filter((a) => spentByLine(a) != null)
                  .map((a) => {
                    const val = spentByLine(a),
                      over = depasseCategorie(val, a.montant);
                    return (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 13,
                          padding: "5px 0",
                          borderBottom: "1px solid var(--line)",
                        }}
                        key={a.id}
                      >
                        <span>
                          {a.nom}
                          {noteByLine(a) && (
                            <span
                              style={{
                                color: "var(--slate)",
                                fontSize: 11,
                                fontStyle: "italic",
                              }}
                            >
                              {" ("}
                              {noteByLine(a)})
                            </span>
                          )}
                        </span>
                        <span
                          className={over ? "low" : "ok"}
                          style={{
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {eurosCourt(val)}
                          {" / "}
                          {eurosCourt(a.montant)}
                        </span>
                      </div>
                    );
                  })}
                <div
                  className="note"
                  style={{
                    marginTop: 8,
                  }}
                >
                  {"Total réel : "}
                  <b>{eurosCourt(totalSpent)}</b>
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
