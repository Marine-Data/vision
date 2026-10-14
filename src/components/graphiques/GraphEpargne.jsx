import React from "react";
import { getCible, planEpargne } from "../../lib/calculs.js";
import { anneeMoisDe, moisNow } from "../../lib/mois.js";
import {
  CarteGraph,
  EtiquettesMois,
  InfoMois,
  LARGEUR,
  Legende,
  ZonesMois,
  euros0,
  moisCourt,
  tracer,
  xMois,
} from "./communs.jsx";

// Épargne vers l'objectif 6 mois de salaire (calcul de l'Excel : épargne de
// départ + épargne versée chaque mois). Réel jusqu'au mois en cours, prévu ensuite.
export function GraphEpargne({ budget, params, items, indices }) {
  const M = moisNow(),
    n = indices.length,
    plan = planEpargne(items, params, Math.max(...indices) + 1),
    valeurs = indices.map((i) => plan[i]),
    cible = getCible(params, budget),
    [sel, setSel] = React.useState(Math.max(0, indices.indexOf(M))),
    min = Math.min(...valeurs, cible) * 0.92,
    max = Math.max(...valeurs, cible) * 1.03,
    y = (v) => 150 - ((v - min) / (max - min)) * 140,
    pts = valeurs.map((v, k) => [xMois(k, n), y(v)]),
    nbReel = indices.filter((i) => i <= M).length,
    atteint = indices.find((i, k) => valeurs[k] >= cible),
    pct = (v) => (cible ? Math.round((v / cible) * 100) : 0) + " %",
    actuel = valeurs[Math.max(0, nbReel - 1)];
  const anneeAtteinte = atteint != null ? anneeMoisDe(atteint).annee : "";
  return (
    <CarteGraph titre="Épargne · objectif 6 mois" chiffre={pct(actuel)} couleur="var(--t-teal)">
      <InfoMois
        texte={`${moisCourt(indices[sel])} ${indices[sel] <= M ? "(réel)" : "(prévu)"} · ${euros0(valeurs[sel])} · ${pct(valeurs[sel])}`}
      />
      <div style={{ position: "relative" }}>
        <svg
          width="100%"
          viewBox={`0 0 ${LARGEUR} 176`}
          role="img"
          aria-label={`Épargne de ${euros0(valeurs[0])} à ${euros0(valeurs[n - 1])} ; objectif ${euros0(cible)}`}
        >
          <line
            x1="0"
            x2={LARGEUR}
            y1={y(cible)}
            y2={y(cible)}
            stroke="var(--c-vert)"
            strokeWidth="1.5"
            strokeDasharray="2 4"
          />
          <text
            x={LARGEUR - 2}
            y={y(cible) - 6}
            textAnchor="end"
            fontSize="12"
            fontWeight="700"
            fill="var(--c-vert)"
          >
            Objectif {euros0(cible)}
          </text>
          {nbReel > 0 && (
            <path
              d={`${tracer(pts.slice(0, nbReel))} L${pts[nbReel - 1][0].toFixed(1)},150 L${pts[0][0].toFixed(1)},150 Z`}
              fill="var(--teal-doux)"
            />
          )}
          {nbReel > 1 && (
            <path
              d={tracer(pts.slice(0, nbReel))}
              fill="none"
              stroke="var(--c-teal)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          <path
            d={tracer(pts.slice(Math.max(0, nbReel - 1)))}
            fill="none"
            stroke="var(--c-teal)"
            strokeWidth="2"
            strokeDasharray="5 5"
            strokeLinecap="round"
          />
          {pts.map((p, k) => (
            <circle
              key={k}
              cx={p[0]}
              cy={p[1]}
              r={k === sel ? 6 : 4}
              fill={k === sel || k < nbReel ? "var(--c-teal)" : "var(--surface)"}
              stroke="var(--c-teal)"
              strokeWidth="2"
            />
          ))}
          <EtiquettesMois indices={indices} n={n} y={172} />
        </svg>
        <ZonesMois
          n={n}
          libelle={(k) => `${moisCourt(indices[k])} : ${euros0(valeurs[k])}`}
          onPick={setSel}
        />
      </div>
      <Legende
        items={[
          {
            l: "Réel",
            marque: (
              <svg width="22" height="6" aria-hidden="true">
                <line x1="0" x2="22" y1="3" y2="3" stroke="var(--c-teal)" strokeWidth="2.5" />
              </svg>
            ),
          },
          {
            l: "Prévu",
            marque: (
              <svg width="22" height="6" aria-hidden="true">
                <line x1="0" x2="22" y1="3" y2="3" stroke="var(--c-teal)" strokeWidth="2" strokeDasharray="5 4" />
              </svg>
            ),
          },
        ]}
      />
      {atteint != null ? (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 14,
            background: "var(--vert-doux)",
            color: "var(--t-vert)",
            fontSize: 14.5,
            fontWeight: 800,
          }}
        >
          Objectif atteint en {moisCourt(atteint).toLowerCase()} {anneeAtteinte}
        </div>
      ) : null}
    </CarteGraph>
  );
}
