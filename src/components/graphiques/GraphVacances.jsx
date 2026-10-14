import React from "react";
import { itemCompte, pocketCalc, tauxVacances } from "../../lib/calculs.js";
import { num, paramOuDefaut } from "../../lib/format.js";
import { moisNow } from "../../lib/mois.js";
import {
  CarteGraph,
  EtiquettesMois,
  InfoMois,
  LARGEUR,
  Legende,
  ZonesMois,
  euros0,
  moisCourt,
  xMois,
} from "./communs.jsx";

// Provision vacances en fin de mois (calcul de l'Excel). Mois passés : solde réel.
// Mois à venir : solde prévu, en retirant aussi les dépenses vacances prévues.
export function GraphVacances({ params, items, indices }) {
  const M = moisNow(),
    n = indices.length,
    calc = pocketCalc(
      items,
      "vacances",
      tauxVacances(params),
      Math.max(...indices) + 1,
    ),
    postes = (items || []).filter((x) => x.pocket === "vacances" && itemCompte(x)),
    montant = (x) => (x.paid && x.montant_reel != null ? num(x.montant_reel) : num(x.montant_prevu)),
    depensesDu = (i) => postes.filter((x) => num(x.mois_index) === i).reduce((s, x) => s + montant(x), 0),
    prevuNonPaye = (i) =>
      postes
        .filter((x) => !x.paid && num(x.mois_index) > M && num(x.mois_index) <= i)
        .reduce((s, x) => s + montant(x), 0),
    valeurs = indices.map((i) => (i <= M ? calc.solde[i] : calc.solde[i] - prevuNonPaye(i))),
    [sel, setSel] = React.useState(Math.max(0, indices.indexOf(M))),
    max = Math.max(...valeurs, 100),
    largeurBarre = (LARGEUR - 20) / n - 6,
    hauteur = (v) => Math.max(3, (Math.max(0, v) / max) * 120),
    idxActuel = Math.max(0, indices.indexOf(M));
  return (
    <CarteGraph titre="Provision vacances" chiffre={euros0(valeurs[idxActuel])} couleur="var(--t-orange)">
      <InfoMois
        texte={`${moisCourt(indices[sel])} ${indices[sel] <= M ? "(réel)" : "(prévu)"} · ${euros0(valeurs[sel])}${depensesDu(indices[sel]) ? " après " + euros0(depensesDu(indices[sel])) + " de dépenses" : ""}`}
      />
      <div style={{ position: "relative" }}>
        <svg
          width="100%"
          viewBox={`0 0 ${LARGEUR} 186`}
          role="img"
          aria-label={
            "Provision vacances : " +
            indices.map((i, k) => moisCourt(i) + " " + euros0(valeurs[k])).join(", ")
          }
        >
          <line x1="0" x2={LARGEUR} y1="160" y2="160" stroke="var(--line-strong)" strokeWidth="1" />
          {valeurs.map((v, k) => {
            const reel = indices[k] <= M,
              h = hauteur(v);
            return (
              <rect
                key={k}
                x={(xMois(k, n) - largeurBarre / 2).toFixed(1)}
                y={(160 - h).toFixed(1)}
                width={largeurBarre.toFixed(1)}
                height={h.toFixed(1)}
                rx="4"
                fill={reel ? "var(--c-orange)" : k === sel ? "#e9b27f" : "var(--orange-doux)"}
                stroke={reel ? "none" : "var(--c-orange)"}
                strokeWidth={reel ? 0 : 1.2}
              />
            );
          })}
          {indices.map((i, k) => {
            const d = depensesDu(i);
            if (!d) return null;
            const haut = 160 - hauteur(valeurs[k]) - 26,
              t = "−" + euros0(d).replace(" €", ""),
              w = t.length * 7 + 10;
            return (
              <g key={"d" + k}>
                <rect
                  x={(xMois(k, n) - w / 2).toFixed(1)}
                  y={haut.toFixed(1)}
                  width={w}
                  height="20"
                  rx="10"
                  fill="var(--rouge-doux)"
                />
                <text
                  x={xMois(k, n).toFixed(1)}
                  y={(haut + 14).toFixed(1)}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="800"
                  fill="var(--c-rouge)"
                >
                  {t}
                </text>
              </g>
            );
          })}
          <EtiquettesMois indices={indices} n={n} y={180} />
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
            l: "Solde réel",
            marque: <span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--c-orange)" }} />,
          },
          {
            l: "Prévu",
            marque: (
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: "var(--orange-doux)",
                  border: "1.5px dashed var(--c-orange)",
                  boxSizing: "border-box",
                }}
              />
            ),
          },
          {
            l: "Dépense vacances",
            marque: (
              <span
                style={{
                  padding: "0 6px",
                  borderRadius: 8,
                  background: "var(--rouge-doux)",
                  color: "var(--t-rouge)",
                  fontWeight: 800,
                }}
              >
                −
              </span>
            ),
          },
        ]}
      />
    </CarteGraph>
  );
}
