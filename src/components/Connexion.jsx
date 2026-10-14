import React from "react";
import { IMG_FOND } from "../assets/images.js";
import { supabase } from "../lib/supabase.js";

export const STYLE_ECRAN_CONNEXION = {
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  backgroundImage: `linear-gradient(180deg, rgba(9,42,49,.28), rgba(9,42,49,.5)), url(${IMG_FOND})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
};

export const STYLE_CARTE_CONNEXION = {
  background: "rgba(255,255,255,.86)",
  backdropFilter: "blur(7px)",
  WebkitBackdropFilter: "blur(7px)",
  borderRadius: 18,
  padding: "30px 24px",
  maxWidth: 380,
  width: "100%",
  textAlign: "center",
  boxShadow: "0 12px 44px rgba(35,50,58,.22)",
};

export function Connexion({ bandeau } = {}) {
  const [t, e] = React.useState(""),
    [r, n] = React.useState(""),
    [s, i] = React.useState(!1),
    [o, a] = React.useState(!1),
    [l, u] = React.useState("");
  async function c(p) {
    p.preventDefault(), a(!0), u("");
    const { error: m } = await supabase.auth.signInWithOtp({
      email: t,
      options: {
        emailRedirectTo: window.location.href,
        shouldCreateUser: !0,
      },
    });
    a(!1), m ? u(m.message) : i(!0);
  }
  async function d(p) {
    p.preventDefault(), a(!0), u("");
    const { error: m } = await supabase.auth.verifyOtp({
      email: t,
      token: r.trim(),
      type: "email",
    });
    a(!1), m && u("Code invalide ou expiré. Réessaie, ou clique le lien dans l'email.");
  }
  return s ? (
    <div style={STYLE_ECRAN_CONNEXION}>
      <div className="auth" style={STYLE_CARTE_CONNEXION}>
        <h1>Vérifie tes mails 📩</h1>
        <p>
          {"Un email a été envoyé à "}
          <b>{t}</b>
          {". "}
          <b>Clique le lien</b>
          {" dedans depuis ce téléphone."}
        </p>
        <p
          style={{
            fontSize: 13,
            color: "var(--slate)",
          }}
        >
          {"S'il contient un "}
          <b>code à 6 chiffres</b>, colle-le ici :
        </p>
        <form onSubmit={d}>
          <input inputMode="numeric" placeholder="123456" value={r} onChange={(p) => n(p.target.value)} />
          <button className="btn" disabled={o || r.length < 6}>
            {o ? "Vérification…" : "Valider le code"}
          </button>
        </form>
        {l && (
          <p
            style={{
              color: "var(--alert)",
              fontSize: 13,
            }}
          >
            {l}
          </p>
        )}
        <p
          style={{
            marginTop: 18,
          }}
        >
          <a
            href="#"
            onClick={(p) => {
              p.preventDefault(), i(!1), u("");
            }}
          >
            ← Changer d'email
          </a>
        </p>
      </div>
    </div>
  ) : (
    <div style={STYLE_ECRAN_CONNEXION}>
      <div className="auth" style={STYLE_CARTE_CONNEXION}>
        {bandeau && bandeau.props && bandeau.props.info && bandeau.props.info.etat === "ok" && !bandeau.props.info.proprio ? (
          bandeau
        ) : (
          <>
            <h1>Vision</h1>
            <p>Ta feuille de route vers la mer. Connecte-toi pour retrouver ton suivi sur tous tes appareils.</p>
          </>
        )}
        <form onSubmit={c}>
          <input
            type="email"
            inputMode="email"
            required={!0}
            placeholder="ton@email.fr"
            value={t}
            onChange={(p) => e(p.target.value)}
          />
          <button className="btn" disabled={o}>
            {o ? "Envoi…" : "Recevoir mon lien de connexion"}
          </button>
        </form>
        {l && (
          <p
            style={{
              color: "var(--alert)",
              fontSize: 13,
            }}
          >
            {l}
          </p>
        )}
      </div>
    </div>
  );
}
