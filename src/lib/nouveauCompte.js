// Écran « Bienvenue » : transforme les réponses en lignes de la base.
// Une question passée n'écrit rien (sauf la ligne Salaire, toujours créée à 0 €
// pour pouvoir saisir le salaire plus tard, et les 7 jours du planning).

import { ecrireCreneau } from "../components/SportPage.jsx";
import { ONGLETS_AU_CHOIX } from "./profil.js";

export const POSTES_PROPOSES = [
  ["c_logement", "🏠", "Logement & énergie", true],
  ["c_alim", "🥗", "Alimentation", true],
  ["c_transports", "🚇", "Transports", true],
  ["c_abos", "🔁", "Abonnements", true],
  ["c_plaisir", "🎉", "Sorties", false],
  ["c_sante", "💊", "Santé", false],
  ["c_vetements", "👕", "Vêtements", false],
];
export const EPARGNES_PROPOSEES = [
  ["e_livretA", "🏦", "Livret A"],
  ["e_vacances", "✈️", "Vacances"],
];
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export const nombre = (v) => {
  const x = parseFloat(String(v == null ? "" : v).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(x) && x > 0 ? Math.round(x * 100) / 100 : 0;
};
const cle = (prefixe, libelle, deja) => {
  const base =
    prefixe +
    (libelle || "poste")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 24);
  let k = base,
    n = 2;
  while (deja.has(k)) k = base + "_" + n++;
  deja.add(k);
  return k;
};

// « 19h », « 19h30 », « 19:30 », « 19h-20h30 » → { debut: "19:00", fin: "20:00" }.
// Sans heure de fin : 1 heure.
export function lireHeure(t) {
  const m = String(t || "").match(/(\d{1,2})(?:\s*[h:]\s*(\d{2})?)?(?:\s*[–\-à]+\s*(\d{1,2})(?:\s*[h:]\s*(\d{2})?)?)?/);
  if (!m || Number(m[1]) > 23) return { debut: "", fin: "" };
  const hh = (a, b) => String(Math.min(23, Number(a))).padStart(2, "0") + ":" + (b || "00");
  return { debut: hh(m[1], m[2]), fin: m[3] ? hh(m[3], m[4]) : hh(Number(m[1]) + 1, m[2]) };
}

// r = { prenom, projet, salaire, passe: {…}, postes: [{k,e,l,m,on}], epargnes: [{k,e,l,m}],
//       deja, suivis: {planning: true, …}, creneaux: [{j, t, h}] }
export function lignesNouveauCompte(r, uid) {
  const passe = r.passe || {},
    cles = new Set(),
    budget = [],
    params = [],
    contenu = [],
    poches = [];
  budget.push({ user_id: uid, line_key: "revenu_salaire", kind: "revenu", poste: "Salaire (net)", detail: "", montant: passe.salaire ? 0 : nombre(r.salaire), sort: 0, icone: "💶" });
  cles.add("revenu_salaire");
  if (!passe.postes)
    (r.postes || [])
      .filter((p) => p.on && (p.l || "").trim())
      .forEach((p, i) =>
        budget.push({ user_id: uid, line_key: p.k && !cles.has(p.k) ? (cles.add(p.k), p.k) : cle("c_", p.l, cles), kind: "charge", poste: p.l.trim(), detail: "", montant: nombre(p.m), sort: 10 + i, icone: p.e && p.e !== "•" ? p.e : null }),
      );
  let livrets = 0,
    vacances = 0;
  if (!passe.epargne)
    (r.epargnes || [])
      // Épargnes proposées laissées à 0 : pas créées (celles ajoutées à la main le sont toujours).
      .filter((p) => (p.l || "").trim() && (nombre(p.m) > 0 || !p.k))
      .forEach((p, i) => {
        const k = p.k && !cles.has(p.k) ? (cles.add(p.k), p.k) : cle(/pea/i.test(p.l) ? "e_pea_" : "e_", p.l, cles),
          m = nombre(p.m);
        if (k === "e_vacances") vacances += m;
        else if (!/^e_pea/.test(k)) livrets += m;
        budget.push({ user_id: uid, line_key: k, kind: "epargne", poste: k === "e_vacances" ? "Provision vacances" : p.l.trim(), detail: "", montant: m, sort: 40 + i, icone: p.e || null });
        if (k === "e_vacances")
          poches.push({ user_id: uid, cle: "vacances", label: "Provision vacances", regime: "provision_mensuelle", param_key: "provision_vacances_mensuelle", seuil_bas: 200, statut: "actif", sort: 0 });
      });
  const P = (k, v) => params.push({ user_id: uid, param_key: k, montant: v });
  P("plan_baseline", passe.epargne ? 0 : nombre(r.deja));
  P("epargne_mensuelle", livrets);
  P("provision_vacances_mensuelle", vacances);
  P("seuil_ecart_epargne", 300);
  P("seuil_poche_min", 200);
  // Début du compte : rien n'est provisionné avant ce mois.
  if (r.mois != null) P("compte_debut", r.mois);
  // PEA choisi dès le départ : pas de proposition « recompléter les livrets » ce mois-ci.
  if (r.mois != null && budget.some((b) => /^e_pea/.test(b.line_key))) P("matelas_plus_tard", r.mois);
  const suivis = passe.suivis ? { planning: true } : r.suivis || {};
  ONGLETS_AU_CHOIX.forEach(([id]) => P("onglet_" + id, suivis[id] ? 1 : 0));
  JOURS.forEach((j, i) =>
    contenu.push({ user_id: uid, type: "jour", item_key: "jour:" + (i + 1), titre: j, detail: "—", extra: "—", sort: i }),
  );
  if (!passe.semaine && suivis.planning)
    (r.creneaux || []).forEach((c, i) =>
      contenu.push({ user_id: uid, type: "cours", item_key: "cours:" + (i + 1), groupe: "perso", titre: c.t, detail: ecrireCreneau({ jour: c.j, ...lireHeure(c.h) }), sort: i }),
    );
  contenu.push({
    user_id: uid,
    type: "note",
    item_key: "profil",
    groupe: "profil",
    titre: passe.toi ? "" : (r.projet || "").trim(),
    detail: passe.toi ? "" : (r.prenom || "").trim(),
    sort: 0,
  });
  return { budget, params, contenu, poches };
}

// Écrit tout, dans cet ordre ; le profil en dernier (il marque le compte comme prêt).
export async function creerNouveauCompte(supabase, r, uid) {
  const L = lignesNouveauCompte(r, uid),
    profil = L.contenu.filter((x) => x.groupe === "profil"),
    reste = L.contenu.filter((x) => x.groupe !== "profil"),
    ok = ({ error }) => {
      if (error) throw new Error(error.message);
    };
  ok(await supabase.from("vision_budget").upsert(L.budget, { onConflict: "user_id,line_key" }));
  ok(await supabase.from("vision_params").upsert(L.params, { onConflict: "user_id,param_key" }));
  if (L.poches.length) ok(await supabase.from("vision_poches").upsert(L.poches, { onConflict: "user_id,cle" }));
  ok(await supabase.from("vision_contenu").upsert(reste, { onConflict: "user_id,type,item_key" }));
  ok(await supabase.from("vision_contenu").upsert(profil, { onConflict: "user_id,type,item_key" }));
  return L;
}
