import React from "react";

// Bandeau « Nouvelle version » : l'app compare sa version à celle de la page en ligne
// à l'ouverture, au retour sur l'app et toutes les 15 minutes.
/* global __VISION_VERSION__ */
const ICI = typeof __VISION_VERSION__ !== "undefined" ? __VISION_VERSION__ : "dev";

async function versionEnLigne() {
  const r = await fetch(location.pathname + "?v=" + Date.now(), { cache: "no-store" });
  const page = new DOMParser().parseFromString(await r.text(), "text/html");
  const meta = page.querySelector('meta[name="vision-version"]');
  return meta ? meta.getAttribute("content") : null;
}

export function NouvelleVersion() {
  const [dispo, setDispo] = React.useState(false);
  React.useEffect(() => {
    if (ICI === "dev" || location.protocol === "file:") return;
    const verifier = () =>
      versionEnLigne()
        .then((v) => v && v !== ICI && setDispo(true))
        .catch(() => {});
    const auRetour = () => document.visibilityState === "visible" && verifier();
    verifier();
    document.addEventListener("visibilitychange", auRetour);
    const t = setInterval(verifier, 15 * 60 * 1000);
    return () => {
      document.removeEventListener("visibilitychange", auRetour);
      clearInterval(t);
    };
  }, []);
  if (!dispo) return null;
  return (
    <button
      type="button"
      onClick={() => location.reload()}
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: "calc(96px + env(safe-area-inset-bottom))",
        zIndex: 1000,
        padding: "14px 16px",
        borderRadius: 14,
        border: "none",
        background: "var(--teal, #0e9fb2)",
        color: "#fff",
        fontWeight: 700,
        fontSize: 15,
        boxShadow: "0 6px 20px rgba(0,0,0,.25)",
      }}
    >
      ✨ Nouvelle version — toucher pour recharger
    </button>
  );
}
