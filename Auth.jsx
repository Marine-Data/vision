import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function signIn(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  if (sent) {
    return (
      <div className="auth">
        <h1>Vérifie tes mails 📩</h1>
        <p>Un lien de connexion a été envoyé à <b>{email}</b>. Clique dessus depuis ce téléphone pour ouvrir l'app.</p>
      </div>
    )
  }

  return (
    <div className="auth">
      <h1>Vision</h1>
      <p>Ta feuille de route de reconversion. Connecte-toi pour retrouver ton suivi sur tous tes appareils.</p>
      <form onSubmit={signIn}>
        <input
          type="email" inputMode="email" required placeholder="ton@email.fr"
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn" disabled={loading}>
          {loading ? 'Envoi…' : 'Recevoir mon lien de connexion'}
        </button>
      </form>
      {error && <p style={{ color: '#8a2f2c', fontSize: 13 }}>{error}</p>}
    </div>
  )
}
