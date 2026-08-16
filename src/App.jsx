import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase.js'
import Auth from './components/Auth.jsx'
import { Apercu, Planning, Suivi, Budget, Tresorerie, Sport, Pieces } from './components/Sections.jsx'
import Stats from './components/Charts.jsx'
import { underwaterBanner } from './data/media.js'
import { tabs, defaultBudget, defaultParams, defaultVoyages } from './data/dossier.js'

// Mode partage : ?partage dans l'URL → accès public sans connexion.
const SHARE = typeof window !== 'undefined' &&
  (new URLSearchParams(window.location.search).has('partage') || (window.location.hash || '').includes('partage'))
const LOCKED = ['tresorerie', 'stats']       // pages finances protégées en mode partage
const SHARE_PASSWORD = 'vision2027'
const noop = () => {}

/* Écran de déverrouillage (mode partage, pages finances) */
function Locked({ onUnlock }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  function submit(e) {
    e.preventDefault()
    if (pw === SHARE_PASSWORD) onUnlock()
    else setErr(true)
  }
  return (
    <section className="sec">
      <h2>Contenu protégé 🔒</h2>
      <p className="sub">Les pages financières sont privées. Entre le mot de passe pour les afficher.</p>
      <div className="card">
        <form onSubmit={submit}>
          <input type="password" placeholder="Mot de passe" value={pw}
            onChange={(e) => { setPw(e.target.value); setErr(false) }} />
          <button className="btn">Déverrouiller</button>
        </form>
        {err && <p style={{ color: 'var(--alert)', fontSize: 13, marginTop: 8 }}>Mot de passe incorrect.</p>}
      </div>
    </section>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState('apercu')
  const [progress, setProgress] = useState({})
  const [budget, setBudget] = useState(null)
  const [params, setParams] = useState([])
  const [voyages, setVoyages] = useState([])
  const [unlocked, setUnlocked] = useState(false)

  // session (sauf en mode partage : pas d'authentification)
  useEffect(() => {
    if (SHARE) { setReady(true); return }
    supabase.auth.getSession().then(({ data }) => setSession(data?.session ?? null)).catch(() => {}).finally(() => setReady(true))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // données
  useEffect(() => {
    // mode partage : données de démonstration (pas de données privées Supabase)
    if (SHARE) {
      setBudget(defaultBudget.map((b, i) => ({ ...b, id: 'd' + i })))
      setParams(defaultParams.map((p) => ({ ...p })))
      setVoyages(defaultVoyages.map((v, i) => ({ ...v, id: 'd' + i })))
      setProgress({})
      return
    }
    if (!session) return
    const uid = session.user.id
    supabase.from('vision_progress').select('item_key, done').then(({ data }) => {
      const m = {}; (data || []).forEach((r) => { m[r.item_key] = r.done }); setProgress(m)
    })
    ;(async () => {
      let { data } = await supabase.from('vision_budget').select('*').order('sort')
      if (!data || data.length === 0) {
        await supabase.from('vision_budget').upsert(defaultBudget.map((b) => ({ ...b, user_id: uid })), { onConflict: 'user_id,line_key' })
        data = (await supabase.from('vision_budget').select('*').order('sort')).data
      }
      setBudget(data || [])
    })()
    ;(async () => {
      let { data } = await supabase.from('vision_params').select('*')
      if (!data || data.length === 0) {
        await supabase.from('vision_params').upsert(defaultParams.map((p) => ({ ...p, user_id: uid })), { onConflict: 'user_id,param_key' })
        data = (await supabase.from('vision_params').select('*')).data
      }
      setParams(data || [])
    })()
    ;(async () => {
      let { data } = await supabase.from('vision_voyages').select('*').order('mois_index').order('sort')
      if (!data || data.length === 0) {
        await supabase.from('vision_voyages').upsert(defaultVoyages.map((v) => ({ ...v, user_id: uid })), { onConflict: 'user_id,line_key' })
        data = (await supabase.from('vision_voyages').select('*').order('mois_index').order('sort')).data
      }
      setVoyages(data || [])
    })()
  }, [session])

  async function toggle(key) {
    if (SHARE) return
    const next = !progress[key]
    setProgress((p) => ({ ...p, [key]: next }))
    const { error } = await supabase.from('vision_progress').upsert({ item_key: key, done: next }, { onConflict: 'user_id,item_key' })
    if (error) setProgress((p) => ({ ...p, [key]: !next }))
  }

  const editLine = (id, patch) => setBudget((b) => b.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  async function saveLine(id) {
    const r = budget.find((x) => x.id === id); if (!r) return
    await supabase.from('vision_budget').update({ poste: r.poste, montant: Number(r.montant) || 0 }).eq('id', id)
  }
  async function addLine(kind) {
    const line_key = 'x_' + Math.random().toString(36).slice(2, 10)
    const sort = Math.max(0, ...budget.map((b) => b.sort || 0)) + 1
    const row = { user_id: session.user.id, line_key, kind, poste: '', detail: '', montant: 0, sort }
    const { data } = await supabase.from('vision_budget').insert(row).select().single()
    if (data) setBudget((b) => [...b, data])
  }
  async function removeLine(id) {
    setBudget((b) => b.filter((r) => r.id !== id))
    await supabase.from('vision_budget').delete().eq('id', id)
  }

  const editParam = (key, val) => setParams((ps) => (ps.some((p) => p.param_key === key) ? ps.map((p) => (p.param_key === key ? { ...p, montant: val } : p)) : [...ps, { param_key: key, montant: val }]))
  async function saveParam(key, val) {
    await supabase.from('vision_params').upsert({ user_id: session.user.id, param_key: key, montant: Number(val) || 0 }, { onConflict: 'user_id,param_key' })
  }

  const editVoyage = (id, patch) => setVoyages((vs) => vs.map((v) => (v.id === id ? { ...v, ...patch } : v)))
  async function saveVoyage(id, extra) {
    const v = { ...(voyages.find((x) => x.id === id) || {}), ...(extra || {}) }
    await supabase.from('vision_voyages').update({ label: v.label, montant: Number(v.montant) || 0, mois_index: Number(v.mois_index) || 0 }).eq('id', id)
  }
  async function addVoyage() {
    const line_key = 'v_' + Math.random().toString(36).slice(2, 10)
    const sort = Math.max(0, ...voyages.map((v) => v.sort || 0)) + 1
    const row = { user_id: session.user.id, line_key, mois_index: 1, label: '', montant: 0, sort }
    const { data } = await supabase.from('vision_voyages').insert(row).select().single()
    if (data) setVoyages((vs) => [...vs, data])
  }
  async function removeVoyage(id) {
    setVoyages((vs) => vs.filter((v) => v.id !== id))
    await supabase.from('vision_voyages').delete().eq('id', id)
  }

  function partager() {
    const url = window.location.origin + window.location.pathname + '?partage'
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => alert('Lien de partage copié !\n\n' + url)).catch(() => window.prompt('Lien de partage :', url))
    else window.prompt('Lien de partage :', url)
  }

  if (!supabaseConfigured) return <div className="warn">Configuration Supabase manquante.</div>
  if (!ready) return null
  if (!SHARE && !session) return <Auth />

  // en mode partage, les handlers d'édition sont neutres (lecture seule)
  const rw = SHARE
    ? { readOnly: true, editLine: noop, saveLine: noop, addLine: noop, removeLine: noop, editParam: noop, saveParam: noop, editVoyage: noop, saveVoyage: noop, addVoyage: noop, removeVoyage: noop }
    : { readOnly: false, editLine, saveLine, addLine, removeLine, editParam, saveParam, editVoyage, saveVoyage, addVoyage, removeVoyage }
  const tresoProps = { budget, params, voyages, ...rw }

  const gate = (node) => (SHARE && !unlocked ? <Locked onUnlock={() => setUnlocked(true)} /> : node)

  return (
    <>
      <header className="top" style={{ backgroundImage: `linear-gradient(180deg, rgba(9,42,49,.42), rgba(9,42,49,.72)), url(${underwaterBanner})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="wrap">
          <div className="kick">Reconversion · 2026 – 2027</div>
          <h1>Juriste Data, IA &amp; Cyber</h1>
          {SHARE
            ? <div className="who">Aperçu partagé</div>
            : <>
                <div className="who">{session.user.email}</div>
                <button className="logout" onClick={partager} style={{ right: 132 }}>Partager</button>
                <button className="logout" onClick={() => supabase.auth.signOut()}>Déconnexion</button>
              </>}
        </div>
      </header>
      <main className="wrap">
        {tab === 'apercu' && <Apercu progress={progress} budget={budget} params={params} />}
        {tab === 'planning' && <Planning />}
        {tab === 'suivi' && <Suivi progress={progress} toggle={toggle} readOnly={SHARE} />}
        {tab === 'budget' && <Budget />}
        {tab === 'tresorerie' && gate(<Tresorerie {...tresoProps} />)}
        {tab === 'stats' && gate(<Stats budget={budget} params={params} voyages={voyages} />)}
        {tab === 'sport' && <Sport />}
        {tab === 'pieces' && <Pieces progress={progress} toggle={toggle} readOnly={SHARE} />}
      </main>
      <nav className="nav">
        {tabs.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}{SHARE && LOCKED.includes(t.id) && !unlocked ? ' 🔒' : ''}
          </button>
        ))}
      </nav>
    </>
  )
}
