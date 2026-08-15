import {
  MOIS, getParam, planParam, sumKind, livretsMensuel, projLivrets, projVacances, jalons,
} from '../data/dossier.js'

const eur = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' €'
const eurShort = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n))

const DONUT_COLORS = ['#c15a3d', '#148a7a', '#dd9038', '#3f9fb0', '#e0a15a', '#5b8c9c', '#b5654d', '#2f9e8a', '#c9873f', '#5f7279', '#7fbfc4', '#a8543a']

/* ---------- Courbe de projection de l'épargne (livrets) ---------- */
export function EpargneChart({ budget, params }) {
  const pts = projLivrets(budget, params)
  const cible = planParam(params, 'cible')
  const { troughIdx, recIdx } = jalons(pts, cible)
  const duMois = 4
  const duMontant = planParam(params, 'du_paiement')
  const W = 680, H = 300, pad = { l: 54, r: 16, t: 18, b: 34 }
  const ix = W - pad.l - pad.r, iy = H - pad.t - pad.b
  const vals = [...pts, cible]
  let min = Math.min(...vals), max = Math.max(...vals)
  const span = (max - min) || 1; min -= span * 0.08; max += span * 0.10
  const X = (i) => pad.l + i * (ix / (MOIS.length - 1))
  const Y = (v) => pad.t + (1 - (v - min) / (max - min)) * iy
  const line = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${X(pts.length - 1).toFixed(1)},${Y(min).toFixed(1)} L${X(0).toFixed(1)},${Y(min).toFixed(1)} Z`
  const grid = [0, 1, 2, 3, 4].map((k) => min + (max - min) * k / 4)

  return (
    <div className="card">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }} role="img" aria-label="Projection de l'épargne">
        {grid.map((v, k) => (
          <g key={k}>
            <line x1={pad.l} y1={Y(v)} x2={W - pad.r} y2={Y(v)} stroke="#dfe5e3" strokeWidth="1" />
            <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="#5f7279">{eurShort(v)}</text>
          </g>
        ))}
        <line x1={pad.l} y1={Y(cible)} x2={W - pad.r} y2={Y(cible)} stroke="#148a7a" strokeWidth="1.5" strokeDasharray="5 4" />
        <text x={W - pad.r} y={Y(cible) - 6} textAnchor="end" fontSize="11" fill="#148a7a">Matelas {eur(cible)}</text>
        <path d={area} fill="#c15a3d" opacity="0.07" />
        <path d={line} fill="none" stroke="#c15a3d" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {MOIS.map((m, i) => (i % 2 === 0 || i === MOIS.length - 1) && (
          <text key={i} x={X(i)} y={H - 12} textAnchor="middle" fontSize="11" fill="#5f7279">{m}</text>
        ))}
        {pts.map((v, i) => {
          const hot = i === 0 || i === 1 || i === duMois
          return <circle key={i} cx={X(i)} cy={Y(v)} r={hot ? 4 : 2.5} fill={hot ? '#dd9038' : '#c15a3d'} />
        })}
        <text x={X(duMois)} y={Y(pts[duMois]) + 18} textAnchor="middle" fontSize="11" fill="#dd9038">{'\u2212 '}{eurShort(duMontant)} DU</text>
        {recIdx >= 0 && (
          <g>
            <line x1={X(recIdx)} y1={pad.t} x2={X(recIdx)} y2={H - pad.b} stroke="#148a7a" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx={X(recIdx)} cy={Y(pts[recIdx])} r="4.5" fill="#148a7a" />
            <text x={X(recIdx)} y={pad.t + 10} textAnchor={recIdx > MOIS.length - 3 ? 'end' : 'middle'} fontSize="11" fontWeight="700" fill="#148a7a">Bascule PEA 🌊</text>
          </g>
        )}
      </svg>
      <div className="note">
        Sport, SCAP et DU déduits des livrets : creux à {eur(pts[troughIdx])} en {MOIS[troughIdx]}, puis retour au-dessus du matelas de {eur(cible)} vers {recIdx >= 0 ? MOIS[recIdx] : 'plus tard'}.
      </div>
    </div>
  )
}

/* ---------- Jauge du matelas de sécurité ---------- */
export function MatelasGauge({ budget, params }) {
  const pts = projLivrets(budget, params)
  const cible = planParam(params, 'cible')
  const start = planParam(params, 'start_livrets')
  const { troughIdx, recIdx } = jalons(pts, cible)
  const pct = cible > 0 ? Math.round(start / cible * 100) : 0
  const barW = Math.max(0, Math.min(100, pct))
  const atteint = start >= cible
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: '1.9rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{eur(start)}</span>
          <span style={{ color: 'var(--slate)', fontSize: 13, marginLeft: 6 }}>sur les livrets</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--slate)', fontSize: 13 }}>Cible 6 mois</div>
          <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{eur(cible)}</div>
        </div>
      </div>
      <div className="prog"><i style={{ width: barW + '%', background: atteint ? 'var(--green)' : 'var(--oxblood)' }} /></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--slate)' }}>
        <span>0 €</span>
        <span style={{ color: atteint ? 'var(--green)' : 'var(--oxblood)', fontWeight: 700 }}>{atteint ? 'Atteint' : 'En cours'} · {pct} %</span>
      </div>
      <div className="note">
        Une fois les dépenses de reconversion déduites, le matelas plonge à {eur(pts[troughIdx])} en {MOIS[troughIdx]}, puis repasse au-dessus de {eur(cible)} vers {recIdx >= 0 ? MOIS[recIdx] : 'plus tard'} — avant la bascule sur le PEA.
      </div>
    </div>
  )
}

/* ---------- Courbe de la poche vacances ---------- */
export function VacancesChart({ budget, voyages }) {
  const pts = projVacances(budget, voyages, 12)
  const labels = MOIS.slice(0, 12)
  const W = 680, H = 240, pad = { l: 48, r: 16, t: 16, b: 34 }
  const ix = W - pad.l - pad.r, iy = H - pad.t - pad.b
  let min = Math.min(0, ...pts), max = Math.max(...pts, 1)
  const span = (max - min) || 1; min -= span * 0.08; max += span * 0.10
  const X = (i) => pad.l + i * (ix / (labels.length - 1))
  const Y = (v) => pad.t + (1 - (v - min) / (max - min)) * iy
  const line = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')
  const floor = Math.min(...pts), floorIdx = pts.indexOf(floor)
  return (
    <div className="card">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }} role="img" aria-label="Projection de la poche vacances">
        {[0, 1, 2].map((k) => { const v = min + (max - min) * k / 2; return (
          <g key={k}><line x1={pad.l} y1={Y(v)} x2={W - pad.r} y2={Y(v)} stroke="#dfe5e3" strokeWidth="1" />
          <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="#5f7279">{eurShort(v)}</text></g>) })}
        {min < 0 && <line x1={pad.l} y1={Y(0)} x2={W - pad.r} y2={Y(0)} stroke="#c15a3d" strokeWidth="1" strokeDasharray="3 3" />}
        <path d={line} fill="none" stroke="#148a7a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {labels.map((m, i) => (i % 2 === 0 || i === labels.length - 1) && (
          <text key={i} x={X(i)} y={H - 12} textAnchor="middle" fontSize="11" fill="#5f7279">{m}</text>
        ))}
        {pts.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r={i === floorIdx ? 4 : 2.5} fill={i === floorIdx ? '#c15a3d' : '#148a7a'} />)}
      </svg>
      <div className="note">Plancher à {eur(floor)} en {labels[floorIdx]} (après le grand voyage). En dessous de 0, ça déborderait sur les livrets.</div>
    </div>
  )
}

/* ---------- Donut de répartition des charges ---------- */
export function ChargesDonut({ budget }) {
  const charges = (budget || []).filter((b) => b.kind === 'charge').map((b, i) => ({ nom: b.poste, montant: Number(b.montant) || 0, couleur: DONUT_COLORS[i % DONUT_COLORS.length] }))
  const total = charges.reduce((s, c) => s + c.montant, 0) || 1
  const R = 70, C = 100, circ = 2 * Math.PI * R
  let off = 0
  return (
    <div className="card">
      <div style={{ maxWidth: 230, margin: '0 auto' }}>
        <svg viewBox="0 0 200 200" style={{ display: 'block', width: '100%', height: 'auto' }} role="img" aria-label="Répartition des charges">
          <circle cx={C} cy={C} r={R} fill="none" stroke="#efe7d8" strokeWidth="26" />
          {charges.map((c, i) => {
            const len = c.montant / total * circ
            const el = (
              <circle key={i} cx={C} cy={C} r={R} fill="none" stroke={c.couleur} strokeWidth="26"
                strokeDasharray={`${len.toFixed(2)} ${(circ - len).toFixed(2)}`} strokeDashoffset={(-off).toFixed(2)}
                transform={`rotate(-90 ${C} ${C})`} />
            )
            off += len
            return el
          })}
          <text x={C} y={C - 4} textAnchor="middle" style={{ fontFamily: 'Georgia,serif', fontSize: 22, fontWeight: 600, fill: '#23323a' }}>{eurShort(total)} €</text>
          <text x={C} y={C + 16} textAnchor="middle" fontSize="11" fill="#5f7279">par mois</text>
        </svg>
      </div>
      <div style={{ marginTop: 10 }}>
        {charges.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', borderBottom: i < charges.length - 1 ? '1px solid var(--line)' : 0 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: c.couleur, flex: '0 0 auto' }} />
            <span style={{ flex: 1, fontSize: 13.5 }}>{c.nom}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: 13.5 }}>{eur(c.montant)}</span>
            <span style={{ color: 'var(--slate)', fontSize: 12, width: 44, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Math.round(c.montant / total * 100)} %</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Section Graphiques ---------- */
export default function Stats({ budget, params, voyages }) {
  if (!budget) return <section className="sec"><p className="sub">Chargement…</p></section>
  const totalCharges = sumKind(budget, 'charge')
  return (
    <section className="sec">
      <h2>Graphiques</h2>
      <p className="sub">Calculés en direct depuis ton budget — ils se mettent à jour dès que tu édites la Trésorerie.</p>
      <div className="h3">Projection de l'épargne (livrets)</div>
      <EpargneChart budget={budget} params={params} />
      <div className="h3">Matelas de sécurité</div>
      <MatelasGauge budget={budget} params={params} />
      <div className="h3">Poche vacances</div>
      <VacancesChart budget={budget} voyages={voyages} />
      <div className="h3">{`Répartition des charges — ${eurShort(totalCharges)} €/mois`}</div>
      <ChargesDonut budget={budget} />
    </section>
  )
}
