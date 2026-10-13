import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { underwaterBanner } from '../data/media.js'

const bg = {
  minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  backgroundImage: `linear-gradient(180deg, rgba(9,42,49,.28), rgba(9,42,49,.5)), url(${underwaterBanner})`,
  backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
}
const card = {
  background: 'rgba(255,255,255,.86)', backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)',
  borderRadius: 18, padding: '30px 24px', maxWidth: 380, width: '100%', textAlign: 'center',
  boxShadow: '0 12px 44px rgba(35,50,58,.22)',
}

export default function Auth() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sendLink(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href, shouldCreateUser: true } })
    setLoading(false)
    if (error) setError(error.message); else setSent(true)
  }
  async function verifyCode(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' })
    setLoading(false)
    if (error) setError("Code invalide ou expiré. Réessaie, ou clique le lien dans l'email.")
  }

  if (sent) {
    return (
      <div style={bg}>
        <div className="auth" style={card}>
          <h1>Vérifie tes mails 📩</h1>
          <p>Un email a été envoyé à <b>{email}</b>. <b>Clique le lien</b> dedans depuis ce téléphone.</p>
          <p style={{ fontSize: 13, color: 'var(--slate)' }}>S'il contient un <b>code à 6 chiffres</b>, colle-le ici :</p>
          <form onSubmit={verifyCode}>
            <input inputMode="numeric" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />
            <button className="btn" disabled={loading || code.length < 6}>{loading ? 'Vérification…' : 'Valider le code'}</button>
          </form>
          {error && <p style={{ color: 'var(--alert)', fontSize: 13 }}>{error}</p>}
          <p style={{ marginTop: 18 }}><a href="#" onClick={(e) => { e.preventDefault(); setSent(false); setError('') }}>← Changer d'email</a></p>
        </div>
      </div>
    )
  }

  return (
    <div style={bg}>
      <div className="auth" style={card}>
        <h1>Vision</h1>
        <p>Ta feuille de route vers la mer. Connecte-toi pour retrouver ton suivi sur tous tes appareils.</p>
        <form onSubmit={sendLink}>
          <input type="email" inputMode="email" required placeholder="ton@email.fr" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn" disabled={loading}>{loading ? 'Envoi…' : 'Recevoir mon lien de connexion'}</button>
        </form>
        {error && <p style={{ color: 'var(--alert)', fontSize: 13 }}>{error}</p>}
      </div>
    </div>
  )
}
