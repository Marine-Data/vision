import { stats } from '../data/dossier.js'

/* Graphiques de l'onglet — SVG pur, aucune dépendance.
   Toutes les données viennent de `stats` dans dossier.js (source unique). */

const eur = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' €'
const eurShort = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n))

// Somme des dépenses de reconversion prélevées le mois i.
const sortieMois = (i) => (stats.sorties || []).filter((s) => s.i === i).reduce((t, s) => t + s.montant, 0)

// Série d'épargne mois par mois : départ − dépenses, puis +épargne chaque mois − dépenses du mois.
function serieEpargne() {
  const { livretsDepart, epargneMensuelle, moisLabels } = stats
  const p = [livretsDepart - sortieMois(0)]
  for (let i = 1; i < moisLabels.length; i++) {
    p.push(p[i - 1] + epargneMensuelle - sortieMois(i))
  }
  return p
}

// Index du creux et mois où l'on repasse la cible après le creux.
function jalons(pts) {
  const troughIdx = pts.indexOf(Math.min(...pts))
  let recIdx = -1
  for (let i = troughIdx; i < pts.length; i++) { if (pts[i] >= stats.cible) { recIdx = i; break } }
  return { troughIdx, recIdx }
}

/* ---------- Courbe de projection (le héros) ---------- */
export function EpargneChart() {
  const pts = serieEpargne()
  const { moisLabels, cible, sorties } = stats
  const { troughIdx, recIdx } = jalons(pts)
  const W = 680, H = 300, pad = { l: 54, r: 16, t: 18, b: 34 }
  const ix = W - pad.l - pad.r, iy = H - pad.t - pad.b

  const vals = [...pts, cible]
  let min = Math.min(...vals), max = Math.max(...vals)
  const span = (max - min) || 1
  min -= span * 0.08; max += span * 0.10
  const X = (i) => pad.l + i * (ix / (moisLabels.length - 1))
  const Y = (v) => pad.t + (1 - (v - min) / (max - min)) * iy

  const line = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${X(pts.length - 1).toFixed(1)},${Y(min).toFixed(1)} L${X(0).toFixed(1)},${Y(min).toFixed(1)} Z`
  const grid = [0, 1, 2, 3, 4].map((k) => min + (max - min) * k / 4)

  // la plus grosse dépense (le DU) porte l'annotation chiffrée
  const bigSortie = (sorties || []).reduce((a, b) => (b.montant > (a ? a.montant : 0) ? b : a), null)

  return (
    <div className="card">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}
        role="img" aria-label="Projection de l'épargne sur les livrets">
        {grid.map((v, k) => (
          <g key={k}>
            <line x1={pad.l} y1={Y(v)} x2={W - pad.r} y2={Y(v)} stroke="#e4dccd" strokeWidth="1" />
            <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="#6f665c">{eurShort(v)}</text>
          </g>
        ))}
        <line x1={pad.l} y1={Y(cible)} x2={W - pad.r} y2={Y(cible)} stroke="#2e6b4f" strokeWidth="1.5" strokeDasharray="5 4" />
        <text x={W - pad.r} y={Y(cible) - 6} textAnchor="end" fontSize="11" fill="#2e6b4f">Matelas {eur(cible)}</text>
        <path d={area} fill="#8a2f2c" opacity="0.07" />
        <path d={line} fill="none" stroke="#8a2f2c" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {moisLabels.map((m, i) => (i % 2 === 0 || i === moisLabels.length - 1) && (
          <text key={i} x={X(i)} y={H - 12} textAnchor="middle" fontSize="11" fill="#6f665c">{m}</text>
        ))}
        {/* points : ambre là où une dépense est prélevée */}
        {pts.map((v, i) => {
          const s = sortieMois(i)
          return <circle key={i} cx={X(i)} cy={Y(v)} r={s > 0 ? 4 : 2.5} fill={s > 0 ? '#946517' : '#8a2f2c'} />
        })}
        {bigSortie && (
          <text x={X(bigSortie.i)} y={Y(pts[bigSortie.i]) + 18} textAnchor="middle" fontSize="11" fill="#946517">
            {'\u2212 '}{eurShort(bigSortie.montant)} {bigSortie.label}
          </text>
        )}
      </svg>
      <div className="note">
        Sport, SCAP et DU prélevés sur les livrets : creux à {eur(pts[troughIdx])} en {moisLabels[troughIdx]}, puis
        retour au-dessus du matelas de {eur(cible)} vers {recIdx >= 0 ? moisLabels[recIdx] : 'plus tard'}.
      </div>
    </div>
  )
}

/* ---------- Jauge du matelas de sécurité ---------- */
export function MatelasGauge() {
  const pts = serieEpargne()
  const { livretsDepart, cible, moisLabels } = stats
  const { troughIdx, recIdx } = jalons(pts)
  const pct = Math.round(livretsDepart / cible * 100)
  const barW = Math.max(0, Math.min(100, pct))
  const atteint = livretsDepart >= cible

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: '1.9rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {eur(livretsDepart)}
          </span>
          <span style={{ color: 'var(--slate)', fontSize: 13, marginLeft: 6 }}>sur les livrets aujourd'hui</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--slate)', fontSize: 13 }}>Cible 6 mois</div>
          <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{eur(cible)}</div>
        </div>
      </div>
      <div className="prog"><i style={{ width: barW + '%', background: atteint ? 'var(--green)' : 'var(--oxblood)' }} /></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--slate)', marginTop: 6 }}>
        <span>0 €</span>
        <span style={{ color: atteint ? 'var(--green)' : 'var(--oxblood)', fontWeight: 700 }}>
          {atteint ? 'Atteint' : 'En cours'} · {pct} %
        </span>
      </div>
      <div className="note">
        Atteint aujourd'hui. Une fois toutes les dépenses de reconversion prélevées, le matelas plonge à {eur(pts[troughIdx])} en {moisLabels[troughIdx]},
        puis repasse au-dessus de {eur(cible)} vers {recIdx >= 0 ? moisLabels[recIdx] : 'plus tard'} — avant la bascule sur le PEA.
      </div>
    </div>
  )
}

/* ---------- Donut de répartition des charges ---------- */
export function ChargesDonut() {
  const { charges } = stats
  const total = charges.reduce((s, c) => s + c.montant, 0)
  const R = 70, C = 100, circ = 2 * Math.PI * R
  let off = 0

  return (
    <div className="card">
      <div style={{ maxWidth: 230, margin: '0 auto' }}>
        <svg viewBox="0 0 200 200" style={{ display: 'block', width: '100%', height: 'auto' }}
          role="img" aria-label="Répartition des charges mensuelles">
          <circle cx={C} cy={C} r={R} fill="none" stroke="#efe7d8" strokeWidth="26" />
          {charges.map((c, i) => {
            const len = c.montant / total * circ
            const el = (
              <circle key={i} cx={C} cy={C} r={R} fill="none" stroke={c.couleur} strokeWidth="26"
                strokeDasharray={`${len.toFixed(2)} ${(circ - len).toFixed(2)}`}
                strokeDashoffset={(-off).toFixed(2)} transform={`rotate(-90 ${C} ${C})`} />
            )
            off += len
            return el
          })}
          <text x={C} y={C - 4} textAnchor="middle" style={{ fontFamily: 'Georgia,serif', fontSize: 22, fontWeight: 600, fill: '#26201b' }}>
            {eurShort(total)} €
          </text>
          <text x={C} y={C + 16} textAnchor="middle" fontSize="11" fill="#6f665c">par mois</text>
        </svg>
      </div>
      <div style={{ marginTop: 10 }}>
        {charges.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', borderBottom: i < charges.length - 1 ? '1px solid var(--line)' : 0 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: c.couleur, flex: '0 0 auto' }} />
            <span style={{ flex: 1, fontSize: 13.5 }}>{c.nom}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: 13.5 }}>{eur(c.montant)}</span>
            <span style={{ color: 'var(--slate)', fontSize: 12, width: 44, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(c.montant / total * 100)} %
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Section complète (onglet Graphiques) ---------- */
export default function Stats() {
  const totalCharges = stats.charges.reduce((s, c) => s + c.montant, 0)
  return (
    <section className="sec">
      <h2>Graphiques</h2>
      <p className="sub">Projection de l'épargne, matelas de sécurité et répartition des charges.</p>

      <div className="h3">Projection de l'épargne (livrets)</div>
      <EpargneChart />

      <div className="h3">Matelas de sécurité</div>
      <MatelasGauge />

      <div className="h3">{`Répartition des charges — ${eurShort(totalCharges)} €/mois`}</div>
      <ChargesDonut />
    </section>
  )
}
