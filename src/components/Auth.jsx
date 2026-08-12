import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sendLink(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href, shouldCreateUser: true },
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  async function verifyCode(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.verifyOtp({
      email, token: code.trim(), type: 'email',
    })
    setLoading(false)
    if (error) setError("Code invalide ou expiré. Réessaie, ou clique le lien dans l'email.")
  }

  if (sent) {
    return (
      <div className="auth">
        <h1>Vérifie tes mails 📩</h1>
        <p>Un email a été envoyé à <b>{email}</b>. <b>Clique le lien</b> dedans depuis ce téléphone.</p>
        <p style={{ fontSize: 13, color: '#6f665c' }}>Si l'email contient un <b>code à 6 chiffres</b>, colle-le ici :</p>
        <form onSubmit={verifyCode}>
          <input inputMode="numeric" placeholder="123456" value={code}
            onChange={(e) => setCode(e.target.value)} />
          <button className="btn" disabled={loading || code.length < 6}>
            {loading ? 'Vérification…' : 'Valider le code'}
          </button>
        </form>
        {error && <p style={{ color: '#8a2f2c', fontSize: 13 }}>{error}</p>}
        <p style={{ marginTop: 18 }}><a href="#" onClick={(e) => { e.preventDefault(); setSent(false); setError('') }}>← Changer d'email</a></p>
      </div>
    )
  }

  return (
    <div className="auth">
      <h1>Vision</h1>
      <p>Ta feuille de route de reconversion. Connecte-toi pour retrouver ton suivi sur tous tes appareils.</p>
      <form onSubmit={sendLink}>
        <input type="email" inputMode="email" required placeholder="ton@email.fr"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn" disabled={loading}>
          {loading ? 'Envoi…' : 'Recevoir mon lien de connexion'}
        </button>
      </form>
      {error && <p style={{ color: '#8a2f2c', fontSize: 13 }}>{error}</p>}
    </div>
  )
}
