import { anneeMoisDe } from "../../lib/mois.js";

// Outils partagés par les graphiques.
export const MOIS_COURTS = [
  "Janv",
  "Févr",
  "Mars",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sept",
  "Oct",
  "Nov",
  "Déc",
];
export const LARGEUR = 358;

export const moisCourt = (i) => MOIS_COURTS[anneeMoisDe(i).mois];

export const euros0 = (v) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(v)) + " €";

export const euros2 = (v) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + " €";

// Position horizontale du mois k (0 à n-1) dans un graphique de largeur LARGEUR.
export const xMois = (k, n) => 18 + (k * (LARGEUR - 36)) / Math.max(1, n - 1);

export const tracer = (pts) =>
  pts.map((p, k) => (k ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");

// Carte blanche avec titre et chiffre principal.
export function CarteGraph({ titre, chiffre, couleur, children }) {
  return (
    <section
      aria-label={titre}
      style={{
        background: "#ffffff",
        borderRadius: 22,
        padding: 16,
        boxShadow: "var(--shadow)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 800 }}>{titre}</span>
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 26,
            fontWeight: 700,
            color: couleur,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {chiffre}
        </span>
      </div>
      {children}
    </section>
  );
}

// Ligne d'info du mois touché.
export function InfoMois({ texte }) {
  return (
    <div
      role="status"
      style={{
        minHeight: 22,
        fontSize: 14,
        fontWeight: 700,
        color: "var(--ink-soft)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {texte}
    </div>
  );
}

// Zones à toucher, une par mois, posées par-dessus le graphique (le parent est en position relative).
export function ZonesMois({ n, libelle, onPick }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: "0 0 22px 0",
        display: "grid",
        gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: n }, (_, k) => (
        <button
          key={k}
          type="button"
          onClick={() => onPick(k)}
          aria-label={libelle(k)}
          style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer" }}
        />
      ))}
    </div>
  );
}

export function Legende({ items }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        fontSize: 13,
        color: "var(--ink-soft)",
        fontWeight: 600,
        flexWrap: "wrap",
      }}
    >
      {items.map((it) => (
        <span key={it.l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {it.marque}
          {it.l}
        </span>
      ))}
    </div>
  );
}

export function EtiquettesMois({ indices, n, y }) {
  return indices
    .filter((k, j) => j % 2 === 0)
    .map((k) => {
      const pos = indices.indexOf(k);
      return (
        <text key={k} x={xMois(pos, n).toFixed(1)} y={y} textAnchor="middle" fontSize="12" fill="#536b72">
          {moisCourt(k)}
        </text>
      );
    });
}
