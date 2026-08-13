import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase.js'
import Auth from './components/Auth.jsx'
import { Apercu, Planning, Suivi, Budget, Tresorerie, Sport, Pieces } from './components/Sections.jsx'
import Stats from './components/Charts.jsx'
import { tabs } from './data/dossier.js'

export default function App() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState('apercu')
  const [progress, setProgress] = useState({})

  // session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // charge l'état des cases quand connectée
  useEffect(() => {
    if (!session) return
    supabase.from('vision_progress').select('item_key, done').then(({ data }) => {
      if (!data) return
      const m = {}
      for (const r of data) m[r.item_key] = r.done
      setProgress(m)
    })
  }, [session])

  async function toggle(key) {
    const next = !progress[key]
    setProgress((p) => ({ ...p, [key]: next }))           // optimiste
    const { error } = await supabase
      .from('vision_progress')
      .upsert({ item_key: key, done: next }, { onConflict: 'user_id,item_key' })
    if (error) setProgress((p) => ({ ...p, [key]: !next })) // rollback si échec
  }

  if (!supabaseConfigured) {
    return (
      <div className="warn">
        ⚙️ <b>Presque prêt.</b> Ouvre <code>src/supabaseConfig.js</code> et colle l'URL et la clé
        « anon » de ton projet Supabase (Project Settings → API). Puis <code>git push</code>.
      </div>
    )
  }

  if (!ready) return null
  if (!session) return <Auth />

  return (
    <>
      <header className="top">
        <div className="wrap">
          <div className="kick">Reconversion · 2026 – 2027</div>
          <h1>Juriste Data, IA &amp; Cyber</h1>
          <div className="who">{session.user.email}</div>
          <button className="logout" onClick={() => supabase.auth.signOut()}>Déconnexion</button>
        </div>
      </header>

      <main className="wrap">
        {tab === 'apercu' && <Apercu />}
        {tab === 'planning' && <Planning />}
        {tab === 'suivi' && <Suivi progress={progress} toggle={toggle} />}
        {tab === 'budget' && <Budget />}
        {tab === 'tresorerie' && <Tresorerie />}
        {tab === 'stats' && <Stats />}
        {tab === 'sport' && <Sport />}
        {tab === 'pieces' && <Pieces progress={progress} toggle={toggle} />}
      </main>

      <nav className="nav">
        {tabs.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
    </>
  )
}
