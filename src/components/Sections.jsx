import { useState, useEffect } from 'react'
import {
  chronologie, semaine, semaineNotes, suivi, budgetEcheancier, budgetRecap, sportSlots, pieces,
  paramLabels, defaultParams, MOIS, getParam, sumKind, marge, vacancesMensuel, projVacances,
  projLivrets, jalons, planParam, prochainesEcheances, libelleJours, serieReel, reelParam,
} from '../data/dossier.js'
import { annecyBanner } from '../data/media.js'
import { supabase } from '../lib/supabase.js'

const eur = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' €'
const defP = (k) => { const d = defaultParams.find((p) => p.param_key === k); return d ? d.montant : 0 }

/* ---------- Aperçu ---------- */
export function Apercu({ progress = {}, budget, params }) {
  const prochaines = prochainesEcheances(3)
  const next = prochaines[0]
  const suiviDone = suivi.filter((s) => progress[s.key]).length
  const piecesAll = pieces.flatMap((g) => g.items)
  const piecesDone = piecesAll.filter((it) => progress[it.key]).length
  const start = planParam(params, 'start_livrets')
  const cible = planParam(params, 'cible')
  const matelasPct = cible ? Math.min(100, Math.round((start / cible) * 100)) : 0

  return (
    <section className="sec">
      <div className="card" style={{ padding: 0, border: 0, overflow: 'hidden', height: 148,
        backgroundImage: `linear-gradient(180deg, rgba(14,58,66,.05), rgba(14,58,66,.30)), url(${annecyBanner})`,
        backgroundSize: 'cover', backgroundPosition: 'center 62%' }} />

      {next && (
        <>
          <div className="h3">À faire ensuite</div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <b>{next.titre}</b>
              <span style={{ color: 'var(--oxblood)', fontWeight: 700, whiteSpace: 'nowrap' }}>{libelleJours(next.j)}</span>
            </div>
            {next.detail && <div className="detail" style={{ marginTop: 3 }}>{next.detail}</div>}
          </div>
          {prochaines.slice(1).map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '5px 4px', fontSize: 13.5 }}>
              <span>{e.titre}</span>
              <span style={{ color: 'var(--slate)', whiteSpace: 'nowrap' }}>{libelleJours(e.j)}</span>
            </div>
          ))}
        </>
      )}

      <div className="h3">Où j'en suis</div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span>Matelas de sécurité</span>
          <b>{matelasPct} %</b>
        </div>
        <div className="prog" style={{ margin: '6px 0 14px' }}><i style={{ width: matelasPct + '%' }} /></div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}><div className="detail">Étapes de suivi</div><b>{suiviDone} / {suivi.length}</b></div>
          <div style={{ flex: 1 }}><div className="detail">Pièces prêtes</div><b>{piecesDone} / {piecesAll.length}</b></div>
        </div>
      </div>

      <div className="h3">Chronologie de l'année</div>
      <div className="card">
        {chronologie.map((t, i) => (
          <div className="tl" key={i}><div className="when">{t.when}</div><div className="what">{t.what}</div><div className="det">{t.det}</div></div>
        ))}
      </div>
    </section>
  )
}

/* ---------- Emploi du temps ---------- */
export function Planning() {
  return (
    <section className="sec">
      <h2>Emploi du temps</h2>
      <p className="sub">Deux points fixes : sport jeudi soir et dimanche après-midi.</p>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Jour</th><th>Journée</th><th>Soirée</th></tr></thead>
          <tbody>
            {semaine.map((d, i) => (
              <tr key={i} className={d.fixe ? 'total' : ''}>
                <td><b>{d.jour}</b></td><td>{d.journee}</td>
                <td style={d.fixe ? { color: 'var(--oxblood)', fontWeight: 600 } : {}}>{d.soir}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {semaineNotes.map((n, i) => (<div className={'note' + (i === 2 ? ' red' : '')} key={i}>{n}</div>))}
    </section>
  )
}

/* ---------- Suivi ---------- */
export function Suivi({ progress, toggle, readOnly }) {
  const done = suivi.filter((s) => progress[s.key]).length
  const pct = Math.round((done / suivi.length) * 100)
  const ordonne = [...suivi].sort((a, b) => (progress[a.key] ? 1 : 0) - (progress[b.key] ? 1 : 0))
  return (
    <section className="sec">
      <h2>Tableau de suivi</h2>
      <p className="sub">{done} / {suivi.length} étapes faites · coché = sauvegardé.</p>
      <div className="prog"><i style={{ width: pct + '%' }} /></div>
      <div className="card" style={{ padding: '4px 12px' }}>
        {ordonne.map((s) => (
          <label className={'check' + (progress[s.key] ? ' done' : '')} key={s.key}>
            <input type="checkbox" checked={!!progress[s.key]} disabled={readOnly} onChange={() => toggle(s.key)} />
            <span className="lbl"><b>{s.etape}</b><span className="meta">{s.echeance}{s.action !== '—' ? ' · ' + s.action : ''}</span></span>
          </label>
        ))}
      </div>
    </section>
  )
}

/* ---------- Budget (échéancier statique) ---------- */
export function Budget() {
  return (
    <section className="sec">
      <h2>Budget &amp; échéancier</h2>
      <p className="sub">Coût de la reconversion en autofinancement intégral.</p>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Échéance</th><th>Poste</th><th className="num">Montant</th></tr></thead>
          <tbody>{budgetEcheancier.map((r, i) => (<tr key={i}><td>{r.echeance}</td><td>{r.poste}</td><td className="num">{r.montant}</td></tr>))}</tbody>
        </table>
      </div>
      <div className="h3">Récapitulatif</div>
      <div className="card" style={{ padding: 0 }}>
        <table className="tbl"><tbody>{budgetRecap.map((r, i) => (<tr key={i} className={r.total ? 'total' : ''}><td>{r.poste}</td><td className="num">{r.montant}</td></tr>))}</tbody></table>
      </div>
      <div className="note">Autofinancement intégral : ni CPF ni employeur. Impact sur l'épargne dans l'onglet Trésorerie.</div>
    </section>
  )
}

/* ---------- Groupe de budget éditable ---------- */
function BudgetGroup({ titre, kind, budget, editLine, saveLine, addLine, removeLine, readOnly }) {
  const rows = budget.filter((b) => b.kind === kind)
  return (
    <>
      <div className="bgrouplab">{titre}</div>
      {rows.map((b) => (
        <div className="brow" key={b.id}>
          <div className="bcol">
            <input className="bedit lbl" disabled={readOnly} value={b.poste} onChange={(e) => editLine(b.id, { poste: e.target.value })} onBlur={() => saveLine(b.id)} />
            {b.detail ? <div className="bdet">{b.detail}</div> : null}
          </div>
          <input className="bedit bnum" type="number" inputMode="numeric" disabled={readOnly} value={b.montant}
            onChange={(e) => editLine(b.id, { montant: e.target.value })} onBlur={() => saveLine(b.id)} />
          {!readOnly && <button className="bdel" onClick={() => removeLine(b.id)} aria-label="Supprimer">×</button>}
        </div>
      ))}
      {!readOnly && <button className="badd" onClick={() => addLine(kind)}>+ Ajouter une ligne</button>}
    </>
  )
}

/* ---------- Trésorerie (éditable) ---------- */
export function Tresorerie(props) {
  const { budget, params, voyages, editLine, saveLine, addLine, removeLine, editParam, saveParam, editVoyage, saveVoyage, addVoyage, removeVoyage, readOnly } = props
  if (!budget) return <section className="sec"><h2>Trésorerie</h2><p className="sub">Chargement du budget…</p></section>
  const totCharges = sumKind(budget, 'charge')
  const totEpargne = sumKind(budget, 'epargne')
  const m = marge(budget)
  const vacMens = vacancesMensuel(budget)
  const vacProj = projVacances(budget, voyages)
  const vacFloor = Math.min(...vacProj)
  const paramKeys = ['start_livrets', 'du_paiement', 'sport', 'scap_s1', 'cible']

  return (
    <section className="sec">
      <h2>Trésorerie</h2>
      <p className="sub">Édite tes montants : tout se sauvegarde, et les Graphiques suivent.</p>

      <div className="card">
        <BudgetGroup titre="Revenus" kind="revenu" budget={budget} editLine={editLine} saveLine={saveLine} addLine={addLine} removeLine={removeLine} readOnly={readOnly} />
        <BudgetGroup titre="Charges de vie" kind="charge" budget={budget} editLine={editLine} saveLine={saveLine} addLine={addLine} removeLine={removeLine} readOnly={readOnly} />
        <div className="btot"><span>Total charges de vie</span><span>{eur(totCharges)}</span></div>
        <BudgetGroup titre="Épargne" kind="epargne" budget={budget} editLine={editLine} saveLine={saveLine} addLine={addLine} removeLine={removeLine} readOnly={readOnly} />
        <div className="btot"><span>Total épargne</span><span>{eur(totEpargne)}</span></div>
        {m < 0
          ? <div className="bwarn"><b>Budget en déséquilibre de {eur(-m)}/mois.</b> Baisse un poste souple, réduis la provision vacances, ou ajuste la beauté.</div>
          : <div className="bok"><b>Budget équilibré</b> — il te reste {eur(m)}/mois de marge.</div>}
      </div>

      <div className="h3">Paramètres du plan</div>
      <div className="card">
        {paramKeys.map((key) => (
          <div className="hyp" key={key}>
            <span className="lbl">{paramLabels[key]}</span>
            <input className="bedit bnum" type="number" inputMode="numeric" disabled={readOnly} value={getParam(params, key, defP(key))}
              onChange={(e) => editParam(key, e.target.value)} onBlur={(e) => saveParam(key, e.target.value)} />
          </div>
        ))}
      </div>

      <div className="h3">Épargne — prévu vs réalisé</div>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Mois</th><th className="num">Prévu</th><th className="num">Réel</th><th className="num">Écart</th></tr></thead>
          <tbody>
            {(() => {
              const pts = projLivrets(budget, params)
              const { troughIdx, recIdx } = jalons(pts, planParam(params, 'cible'))
              return pts.slice(0, 13).map((v, i) => {
                const rv = reelParam(params, i)
                const has = rv !== '' && rv != null
                const ecart = has ? Number(rv) - v : null
                return (
                  <tr key={i}>
                    <td className={i === troughIdx ? 'low' : i === recIdx ? 'ok' : ''}>{MOIS[i]}</td>
                    <td className="num">{eur(v)}</td>
                    <td className="num" style={{ padding: '3px 6px' }}>
                      <input className="bedit bnum" style={{ width: 82 }} type="number" inputMode="numeric" disabled={readOnly} placeholder="—"
                        value={rv}
                        onChange={(e) => editParam('reel_' + i, e.target.value)}
                        onBlur={(e) => saveParam('reel_' + i, e.target.value)} />
                    </td>
                    <td className={'num' + (has ? (ecart >= 0 ? ' ok' : ' low') : '')}>{has ? (ecart >= 0 ? '+' : '') + eur(ecart) : '—'}</td>
                  </tr>
                )
              })
            })()}
          </tbody>
        </table>
        <div className="note">Saisis ton solde livrets réel chaque mois : l'écart et la courbe « réalisé » (Graphiques) se mettent à jour.</div>
      </div>

      <div className="h3">Voyages — provision {eur(vacMens)}/mois</div>
      <div className="card">
        {(voyages || []).map((v) => (
          <div className="brow" key={v.id}>
            <input className="bedit lbl" style={{ flex: 1 }} disabled={readOnly} value={v.label} onChange={(e) => editVoyage(v.id, { label: e.target.value })} onBlur={() => saveVoyage(v.id)} />
            <select className="bsel" disabled={readOnly} value={v.mois_index} onChange={(e) => { editVoyage(v.id, { mois_index: e.target.value }); saveVoyage(v.id, { mois_index: e.target.value }) }}>
              {MOIS.slice(0, 12).map((mo, i) => <option key={i} value={i}>{mo}</option>)}
            </select>
            <input className="bedit bnum" type="number" inputMode="numeric" disabled={readOnly} value={v.montant} onChange={(e) => editVoyage(v.id, { montant: e.target.value })} onBlur={() => saveVoyage(v.id)} />
            {!readOnly && <button className="bdel" onClick={() => removeVoyage(v.id)} aria-label="Supprimer">×</button>}
          </div>
        ))}
        {!readOnly && <button className="badd" onClick={addVoyage}>+ Ajouter un voyage</button>}
        <div className="note">Plancher de la poche vacances : <b>{eur(vacFloor)}</b>. En dessous de 0, ça déborderait sur les livrets.</div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Mois</th><th>Dépense</th><th className="num">Solde vacances</th></tr></thead>
          <tbody>
            {vacProj.slice(0, 12).map((v, i) => {
              const dep = (voyages || []).filter((x) => Number(x.mois_index) === i)
              const isFloor = v === vacFloor
              return (
                <tr key={i}>
                  <td>{MOIS[i]}</td>
                  <td className={dep.length ? 'low' : ''}>{dep.length ? dep.map((d) => '\u2212 ' + eur(d.montant) + ' (' + d.label + ')').join(' · ') : '\u2014'}</td>
                  <td className={'num' + (isFloor ? ' low' : '')}>{eur(v)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* ---------- Sport ---------- */
export function Sport() {
  return (
    <section className="sec">
      <h2>Sport</h2>
      <p className="sub"><b>En Avant! de Paris</b> — cotisation annuelle (600 €, 2 cours/semaine) + entraînement libre.</p>
      <div className="card">
        {sportSlots.map((s, i) => (
          <div className="check" key={i} style={{ borderBottom: i < 2 ? '1px solid var(--line)' : 0 }}>
            <span className="di">{s.di}</span>
            <span className="lbl"><b>{s.nom}</b><span className="meta">{s.quand}</span></span>
          </div>
        ))}
      </div>
      <div><span className="chip">Fixe · jeudi 20h–22h</span><span className="chip">Fixe · dimanche 14h–16h</span><span className="chip free">Libre · le soir</span></div>
      <div className="note">À préparer : certificat médical de moins de 3 mois + chèque de 600 €.</div>
    </section>
  )
}

/* ---------- Pièces ---------- */
export function Pieces({ progress, toggle, readOnly }) {
  const all = pieces.flatMap((g) => g.items)
  const done = all.filter((it) => progress[it.key]).length
  const pct = Math.round((done / all.length) * 100)
  return (
    <section className="sec">
      <h2>Pièces à fournir</h2>
      <p className="sub">{done} / {all.length} pièces prêtes · coché = sauvegardé.</p>
      <div className="prog"><i style={{ width: pct + '%' }} /></div>
      {pieces.map((g, i) => (
        <div key={i}>
          <div className="h3">{g.titre}</div>
          <div className="card" style={{ padding: '4px 12px' }}>
            {[...g.items].sort((a, b) => (progress[a.key] ? 1 : 0) - (progress[b.key] ? 1 : 0)).map((it) => (
              <label className={'check' + (progress[it.key] ? ' done' : '')} key={it.key}>
                <input type="checkbox" checked={!!progress[it.key]} disabled={readOnly} onChange={() => toggle(it.key)} />
                <span className="lbl"><b>{it.label}</b></span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

/* ---------- HOMEWORK — Tracker de devoirs ---------- */
export function Homework() {
  const [homeworks, setHomeworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedHw, setSelectedHw] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    subject: 'Anglais pro',
    title: '',
    deadline: '',
    description: '',
    status: 'À faire',
    notes: '',
    file_url: ''
  })

  useEffect(() => {
    loadHomeworks()
  }, [])

  async function loadHomeworks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('vision_homework')
      .select('*')
      .order('deadline', { ascending: true })
    
    if (error) {
      console.error('Erreur charge devoirs:', error)
      setHomeworks([])
    } else {
      setHomeworks(data || [])
    }
    setLoading(false)
  }

  async function createHomework() {
    if (!formData.title || !formData.deadline) {
      alert('Titre et deadline obligatoires')
      return
    }

    setSaving(true)
    const { error } = await supabase
      .from('vision_homework')
      .insert([{
        subject: formData.subject,
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline,
        status: formData.status,
        notes: formData.notes,
        file_url: formData.file_url,
        created_at: new Date().toISOString()
      }])

    if (error) {
      console.error('Erreur création:', error)
      alert('Erreur lors de la création')
    } else {
      setShowModal(false)
      setFormData({
        subject: 'Anglais pro',
        title: '',
        deadline: '',
        description: '',
        status: 'À faire',
        notes: '',
        file_url: ''
      })
      loadHomeworks()
    }
    setSaving(false)
  }

  async function updateHomework(id, updates) {
    setSaving(true)
    const { error } = await supabase
      .from('vision_homework')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Erreur update:', error)
    } else {
      loadHomeworks()
      setSelectedHw(null)
    }
    setSaving(false)
  }

  async function deleteHomework(id) {
    if (!confirm('Supprimer ce devoir ?')) return
    
    const { error } = await supabase
      .from('vision_homework')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur suppression:', error)
    } else {
      loadHomeworks()
    }
  }

  function getFilteredHomeworks() {
    let filtered = homeworks

    if (filterSubject !== 'all') {
      filtered = filtered.filter(hw => hw.subject === filterSubject)
    }

    if (filterDate !== 'all') {
      const today = new Date()
      const mondayNext = new Date(today)
      mondayNext.setDate(today.getDate() + (8 - today.getDay()) % 7)
      const sundayNext = new Date(mondayNext)
      sundayNext.setDate(mondayNext.getDate() + 6)

      if (filterDate === 'next-week') {
        filtered = filtered.filter(hw => {
          const d = new Date(hw.deadline)
          return d >= mondayNext && d <= sundayNext
        })
      } else if (filterDate === 'overdue') {
        filtered = filtered.filter(hw => new Date(hw.deadline) < today)
      }
    }

    return filtered
  }

  const filteredHws = getFilteredHomeworks()
  const stats = {
    total: homeworks.length,
    done: homeworks.filter(h => h.status === 'Fait' || h.status === 'Corrigé').length
  }

  const styles = {
    container: { padding: '1.5rem' },
    progressBar: {
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'center',
      marginBottom: '1.5rem'
    },
    progressFill: {
      height: '8px',
      background: '#199e70',
      borderRadius: '4px',
      flex: 1
    },
    controls: {
      display: 'flex',
      gap: '0.75rem',
      marginBottom: '1rem',
      flexWrap: 'wrap'
    },
    select: {
      padding: '0.5rem 0.75rem',
      border: '0.5px solid rgba(11,11,11,0.1)',
      borderRadius: '6px',
      fontSize: '13px',
      fontFamily: 'inherit',
      cursor: 'pointer'
    },
    addBtn: {
      padding: '0.5rem 1rem',
      background: '#3987e5',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: 500,
      fontSize: '13px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '13px'
    },
    tableHeader: {
      borderBottom: '0.5px solid rgba(11,11,11,0.1)',
      padding: '0.75rem',
      textAlign: 'left',
      fontWeight: 500,
      color: '#52514e'
    },
    tableCell: {
      borderBottom: '0.5px solid rgba(11,11,11,0.1)',
      padding: '0.75rem',
      cursor: 'pointer'
    },
    statusBadge: {
      padding: '4px 12px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 500,
      display: 'inline-block'
    },
    statusBadgeTodo: {
      background: '#fab219',
      color: '#663d00'
    },
    statusBadgeDone: {
      background: '#0ca30c',
      color: 'white'
    },
    statusBadgeCorrected: {
      background: '#3987e5',
      color: 'white'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      background: 'white',
      borderRadius: '12px',
      padding: '2rem',
      maxWidth: '500px',
      width: '90%'
    },
    formGroup: {
      marginBottom: '1rem'
    },
    label: {
      display: 'block',
      fontSize: '12px',
      fontWeight: 500,
      marginBottom: '0.5rem',
      color: '#0b0b0b'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '0.5px solid rgba(11,11,11,0.1)',
      borderRadius: '6px',
      fontSize: '14px',
      fontFamily: 'inherit',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      padding: '0.75rem',
      border: '0.5px solid rgba(11,11,11,0.1)',
      borderRadius: '6px',
      fontSize: '14px',
      fontFamily: 'inherit',
      minHeight: '80px',
      resize: 'vertical',
      boxSizing: 'border-box'
    },
    modalBtns: {
      display: 'flex',
      gap: '0.75rem',
      justifyContent: 'flex-end',
      marginTop: '1.5rem'
    },
    btnPrimary: {
      padding: '0.75rem 1rem',
      background: '#3987e5',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: 500,
      fontSize: '13px'
    },
    btnSecondary: {
      padding: '0.75rem 1rem',
      background: 'transparent',
      color: '#0b0b0b',
      border: '0.5px solid rgba(11,11,11,0.2)',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: 500,
      fontSize: '13px'
    }
  }

  function getStatusColor(status) {
    if (status === 'À faire' || status === 'En cours') return styles.statusBadgeTodo
    if (status === 'Fait') return styles.statusBadgeDone
    if (status === 'Corrigé') return styles.statusBadgeCorrected
    return {}
  }

  if (loading) return <div style={styles.container}>Chargement...</div>

  return (
    <div style={styles.container}>
      <h2>📚 Devoirs</h2>

      <div style={styles.progressBar}>
        <span style={{ fontWeight: 500 }}>{stats.done}/{stats.total}</span>
        <div style={{ ...styles.progressFill, width: `${stats.total > 0 ? (stats.done / stats.total) * 100 : 0}%` }} />
      </div>

      <div style={styles.controls}>
        <select 
          value={filterSubject} 
          onChange={e => setFilterSubject(e.target.value)}
          style={styles.select}
        >
          <option value="all">Toutes matières</option>
          <option value="Anglais pro">Anglais pro</option>
          <option value="Droit numérique">Droit numérique</option>
        </select>

        <select 
          value={filterDate} 
          onChange={e => setFilterDate(e.target.value)}
          style={styles.select}
        >
          <option value="all">Toutes les dates</option>
          <option value="next-week">Semaine prochaine</option>
          <option value="overdue">En retard</option>
        </select>

        <button 
          onClick={() => setShowModal(true)}
          style={styles.addBtn}
        >
          + Ajouter
        </button>
      </div>

      {filteredHws.length === 0 ? (
        <p style={{ color: '#52514e', marginTop: '1rem' }}>Aucun devoir.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Matière</th>
              <th style={styles.tableHeader}>Titre</th>
              <th style={styles.tableHeader}>Deadline</th>
              <th style={styles.tableHeader}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {filteredHws.map(hw => (
              <tr key={hw.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedHw(hw)}>
                <td style={styles.tableCell}>{hw.subject}</td>
                <td style={styles.tableCell}>{hw.title}</td>
                <td style={styles.tableCell}>{new Date(hw.deadline).toLocaleDateString('fr-FR')}</td>
                <td style={styles.tableCell}>
                  <span style={{ ...styles.statusBadge, ...getStatusColor(hw.status) }}>
                    {hw.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>Ajouter un devoir</h3>

            <div style={styles.formGroup}>
              <label style={styles.label}>Matière</label>
              <select
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                style={styles.input}
              >
                <option>Anglais pro</option>
                <option>Droit numérique</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Titre du devoir *</label>
              <input
                type="text"
                placeholder="ex. Present an app..."
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                placeholder="Instructions..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={styles.textarea}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Deadline *</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.modalBtns}>
              <button
                onClick={() => setShowModal(false)}
                style={styles.btnSecondary}
              >
                Annuler
              </button>
              <button
                onClick={createHomework}
                disabled={saving}
                style={styles.btnPrimary}
              >
                {saving ? '...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedHw && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#fcfcfb', borderRadius: '12px' }}>
          <button
            onClick={() => setSelectedHw(null)}
            style={{ ...styles.btnSecondary, marginBottom: '1rem' }}
          >
            ← Retour
          </button>

          <h3>{selectedHw.title}</h3>

          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ fontSize: '12px', color: '#52514e', textTransform: 'uppercase' }}>Matière</strong>
              <p>{selectedHw.subject}</p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ fontSize: '12px', color: '#52514e', textTransform: 'uppercase' }}>Deadline</strong>
              <p>{new Date(selectedHw.deadline).toLocaleDateString('fr-FR')}</p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ fontSize: '12px', color: '#52514e', textTransform: 'uppercase' }}>Statut</strong>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {['À faire', 'En cours', 'Fait', 'Corrigé'].map(s => (
                  <button
                    key={s}
                    onClick={() => updateHomework(selectedHw.id, { status: s })}
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: selectedHw.status === s ? '1px solid #3987e5' : '0.5px solid rgba(11,11,11,0.1)',
                      background: selectedHw.status === s ? 'rgba(57, 135, 229, 0.1)' : 'transparent',
                      color: selectedHw.status === s ? '#3987e5' : '#0b0b0b',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 500
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ fontSize: '12px', color: '#52514e', textTransform: 'uppercase' }}>Notes</strong>
              <textarea
                value={selectedHw.notes || ''}
                onChange={e => updateHomework(selectedHw.id, { notes: e.target.value })}
                style={{
                  ...styles.textarea,
                  marginTop: '0.5rem'
                }}
              />
            </div>

            <button
              onClick={() => deleteHomework(selectedHw.id)}
              style={{
                padding: '0.5rem 1rem',
                background: '#e24b4a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
