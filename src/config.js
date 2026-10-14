export // =================================================================
//  CONFIGURATION VISION — tout ce qui est réglable est ici.
//  Un seul endroit à modifier, plus besoin de chercher dans le bundle.
//  Pour basculer sur une base de test : ouvrir la console du navigateur
//  et taper  localStorage.setItem("vision_env", "dev")  puis recharger
//  (après avoir rempli supabaseDev ci-dessous). Pour revenir en prod :
//  localStorage.removeItem("vision_env").
// =================================================================
const VISION_CONFIG = {
  // --- Base de données -----------------------------------------
  supabase: {
    url: "https://osqyczwawbbwjwaubtvc.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcXljendhd2Jid2p3YXVidHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5Nzk1MjUsImV4cCI6MjA5NzU1NTUyNX0.Lk2iuL3v_AGuXbyG5yU_-cfvnOtmYoWxiYdyCVKxXzg",
  },
  // Base de test : laisser vide tant qu'elle n'existe pas.
  supabaseDev: {
    url: "",
    anonKey: "",
  },
  // --- Horizon des mois ----------------------------------------
  // ancre = mois 0 = mois_index 0 dans Supabase. NE JAMAIS LA CHANGER :
  // tous les mois_index enregistrés sont comptés à partir d'elle.
  ancre: {
    annee: 2026,
    mois: 7,
  },
  horizon: {
    min: 17,
    avance: 12,
    max: 60,
  },
  // --- Règles de calcul ----------------------------------------
  matelas: {
    multiplicateurSalaire: 6,
    fallback: 0,
  },
  seuilPocheDefaut: 200,
  // --- Contenu -------------------------------------------------
  devoirs: {
    matieres: ["Anglais", "Droit"],
  },
  // --- Affichage -----------------------------------------------
  locale: "fr-FR",
  devise: "€",
};

export function visionEnv() {
  try {
    if (localStorage.getItem("vision_env") === "dev" && VISION_CONFIG.supabaseDev.url)
      return VISION_CONFIG.supabaseDev;
  } catch (e) {}
  return VISION_CONFIG.supabase;
}
