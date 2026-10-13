import React from "react";

// Message en bas de l'écran après une modification : « Enregistré · Annuler ».
// Il reste 6 secondes ; une erreur reste jusqu'à ce qu'on la ferme.
export function ToastAnnuler({ toast, onFermer }) {
  const [enCours, setEnCours] = React.useState(!1);
  React.useEffect(() => {
    if (!toast || toast.erreur) return;
    const t = setTimeout(onFermer, 6000);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast)
    return (
      <div
        role="status"
        aria-live="polite"
        style={{ position: "fixed", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}
      />
    );
  return (
    <div
      role={toast.erreur ? "alert" : "status"}
      aria-live={toast.erreur ? "assertive" : "polite"}
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: "calc(92px + env(safe-area-inset-bottom))",
        zIndex: 80,
        maxWidth: 520,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 8px 8px 16px",
        minHeight: 52,
        boxSizing: "border-box",
        borderRadius: 16,
        background: toast.erreur ? "#b8432a" : "var(--ink)",
        color: "#ffffff",
        boxShadow: "0 10px 30px rgba(14,58,66,.3)",
        fontSize: 15,
        fontWeight: 700,
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>{toast.msg}</span>
      {toast.annuler && (
        <button
          type="button"
          disabled={enCours}
          onClick={async () => {
            setEnCours(!0);
            try {
              await toast.annuler();
              onFermer();
            } catch (e) {
              onFermer();
            }
            setEnCours(!1);
          }}
          style={{
            minHeight: 40,
            padding: "0 14px",
            borderRadius: 12,
            border: 0,
            background: "rgba(255,255,255,.18)",
            color: "#ffffff",
            fontFamily: "inherit",
            fontSize: 14.5,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {enCours ? "…" : "Annuler"}
        </button>
      )}
      <button
        type="button"
        onClick={onFermer}
        aria-label="Fermer le message"
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          border: 0,
          background: "transparent",
          color: "#ffffff",
          fontSize: 18,
          cursor: "pointer",
        }}
      >
        ×
      </button>
    </div>
  );
}
