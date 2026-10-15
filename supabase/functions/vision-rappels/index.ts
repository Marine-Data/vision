import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

// Rappels de l'app Vision, appelée chaque heure par pg_cron (tâche « vision-rappels-horaire »).
// Réglages (vision_params) : rappel_suivi, rappel_echeances, rappel_devoirs (jours avant),
// rappel_sport (heures avant, réglage par défaut de TOUS les cours ; chaque cours peut avoir le sien).
// Valeur négative ou nulle = rappel coupé.
// Chaque rappel n'est envoyé qu'une fois (vision_rappels_envoyes).
// Planning (vision_evenements) : rappel la veille d'un événement à date (si « Rappel la veille »),
// et aucun rappel sport pendant une pause qui arrête le sport.
// Corps { "essai": true } : calcule les rappels du moment sans rien envoyer ni noter.
// Corps { "file": true } : envoie seulement la file vision_notifs_file (lien ouvert, invitation utilisée).

const VAPID_PUBLIC = "BOggBaZqp69kCtBQP8bsGgzMxUnlMMSqYwYkiDFcYovilILXH6Plxn7DuTkUvR8FABskn_Tu9UHe7iPdCVUv7qk";
const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function maintenantParis() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value]),
  );
  const iso = p.year + "-" + p.month + "-" + p.day;
  const jour = (new Date(iso + "T12:00:00Z").getUTCDay() + 6) % 7;
  return { iso, heure: Number(p.hour) % 24, minute: Number(p.minute), jour };
}
const ecart = (a: string, b: string) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 864e5);
const quand = (d: number) => (d === 0 ? "aujourd'hui" : d === 1 ? "demain" : "dans " + d + " jours");
const euros = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);
const plusUnJour = (iso: string) => new Date(Date.parse(iso + "T12:00:00Z") + 864e5).toISOString().slice(0, 10);
const hTxt = (t: string | null) => (t ? String(t).replace(/^0/, "").replace(":00", "h").replace(":", "h") : "");
// Période d'un cours (« 30/09 → 09/12/2026 » ou « 15/10 → 15/10/2026 ») : hors période, pas de rappel.
function actifLe(c: { complement?: string | null }, iso: string) {
  const m = String(c.complement || "").match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\s*→\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return true;
  const fin = m[6] + "-" + m[5].padStart(2, "0") + "-" + m[4].padStart(2, "0"),
    an = m[3] || (Number(m[2]) > Number(m[5]) ? String(Number(m[6]) - 1) : m[6]);
  return an + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0") <= iso && fin >= iso;
}
const ancre = (m: number) => ({ annee: 2026 + Math.floor((7 + m) / 12), mois: (7 + m) % 12 });

Deno.serve(async (req: Request) => {
  try {
    const corpsReq = await req.json().catch(() => ({}));
    const essai = !!(corpsReq && corpsReq.essai);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: prive, error: e0 } = await sb.rpc("vision_vapid_prive");
    if (e0 || !prive) throw new Error("clé VAPID introuvable");
    webpush.setVapidDetails("mailto:vision@marine-data.invalid", VAPID_PUBLIC, prive);
    const { data: abos } = await sb.from("vision_push").select("*");
    const envoyer = async (uid: string, msg: { titre: string; corps: string; url: string }) => {
      let n = 0;
      for (const a of (abos || []).filter((x) => x.user_id === uid)) {
        try {
          await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, JSON.stringify(msg));
          n++;
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) await sb.from("vision_push").delete().eq("id", a.id);
          else console.error("push", err?.message || err);
        }
      }
      return n;
    };
    // File des notifications de partage : envoyée à chaque appel (et tout de suite en mode « file »).
    const { data: file } = essai ? { data: [] } : await sb.from("vision_notifs_file").select("*").eq("envoye", false).order("created_at").limit(50);
    let envoyesFile = 0;
    for (const f of file || []) {
      const { data: pris } = await sb.from("vision_notifs_file").update({ envoye: true }).eq("id", f.id).eq("envoye", false).select("id");
      if (!pris || !pris.length) continue; // déjà pris par un autre appel
      envoyesFile += await envoyer(f.user_id, { titre: f.titre, corps: f.corps || "", url: f.url || "./" });
    }
    if (corpsReq && corpsReq.file) return new Response(JSON.stringify({ file: envoyesFile }), { headers: { "Content-Type": "application/json" } });
    const now = maintenantParis();
    let envoyes = 0;
    const apercu: unknown[] = [];
    const utilisateurs = essai
      ? [...new Set(((await sb.from("vision_budget").select("user_id")).data || []).map((x) => x.user_id))]
      : [...new Set((abos || []).map((a) => a.user_id))];
    for (const uid of utilisateurs) {
      const mesAbos = (abos || []).filter((a) => a.user_id === uid);
      const [{ data: params }, { data: contenu }, { data: progress }, { data: tx }, { data: items }, { data: hw }, { data: budget }, { data: evs }] = await Promise.all([
        sb.from("vision_params").select("param_key, montant").eq("user_id", uid),
        sb.from("vision_contenu").select("*").eq("user_id", uid),
        sb.from("vision_progress").select("item_key, done").eq("user_id", uid),
        sb.from("vision_transactions").select("*").eq("user_id", uid).eq("statut", "prevu"),
        sb.from("vision_items").select("*").eq("user_id", uid).eq("paid", false),
        sb.from("vision_homework").select("*").eq("user_id", uid),
        sb.from("vision_budget").select("id, poste").eq("user_id", uid),
        sb.from("vision_evenements").select("*").eq("user_id", uid),
      ]);
      const reg = (k: string) => Number(((params || []).find((p) => p.param_key === k) || {}).montant || 0);
      const fait = new Set((progress || []).filter((p) => p.done).map((p) => p.item_key));
      const rappels: { cle: string; titre: string; corps: string; url: string }[] = [];
      const matin = essai || (now.heure >= 8 && now.heure < 21);
      const nS = reg("rappel_suivi"), nE = reg("rappel_echeances"), nD = reg("rappel_devoirs"), hS = reg("rappel_sport");
      if (matin && nS > 0)
        (contenu || []).filter((c) => c.type === "suivi" && c.date_iso && !fait.has(c.item_key)).forEach((c) => {
          const d = ecart(now.iso, c.date_iso);
          if (d >= 0 && d <= nS) rappels.push({ cle: "suivi:" + c.item_key + ":" + c.date_iso, titre: "🧭 " + c.titre, corps: "Étape du parcours " + quand(d) + ".", url: "./?onglet=suivi" });
        });
      if (matin && nE > 0) {
        (tx || []).forEach((x) => {
          const d = ecart(now.iso, x.date_depense);
          const poste = ((budget || []).find((b) => b.id === x.budget_line_id) || {}).poste || "";
          if (d >= 0 && d <= nE) rappels.push({ cle: "tx:" + x.id + ":" + x.date_depense, titre: "💳 " + euros(Number(x.montant)) + " " + quand(d), corps: (x.note || poste) + (poste && x.note ? " · " + poste : ""), url: "./?onglet=tresorerie" });
        });
        (items || []).filter((x) => ["formation", "sport", "vacances"].includes(x.pocket) && (x.statut || "actif") === "actif").forEach((x) => {
          const a = ancre(Number(x.mois_index)), debut = a.annee + "-" + String(a.mois + 1).padStart(2, "0") + "-01", d = ecart(now.iso, debut);
          if (d >= 0 && d <= nE) rappels.push({ cle: "item:" + x.id + ":" + debut, titre: "💳 " + euros(Number(x.montant_prevu)) + " à payer en " + MOIS[a.mois], corps: x.label || "", url: "./?onglet=tresorerie" });
        });
      }
      if (matin && nD > 0)
        (hw || []).filter((h) => h.deadline && !["Fait", "Corrigé"].includes(h.status)).forEach((h) => {
          const j = String(h.deadline).slice(0, 10), d = ecart(now.iso, j);
          if (d >= 0 && d <= nD) rappels.push({ cle: "devoir:" + h.id + ":" + j, titre: "📚 " + (h.title || h.titre || "Devoir"), corps: (h.subject ? h.subject + " · " : "") + "à rendre " + quand(d) + ".", url: "./?onglet=homework" });
        });
      // Événements à dates : rappel la veille (matin ou soir, une seule fois).
      const demain = plusUnJour(now.iso);
      if (matin)
        (evs || [])
          .filter((e) => e.genre === "evenement" && e.rappel !== false && (e.dates || []).map(String).includes(demain) && !(e.annulees || []).map(String).includes(demain))
          .forEach((e) => {
            const h = (e.horaires || {})[demain] || [e.heure_debut, e.heure_fin];
            const emo = e.emoji || ({ rdv: "📌", formation: "🎓", sport: "🤸", autre: "🎉" } as Record<string, string>)[e.categorie] || "📌";
            rappels.push({ cle: "evt:" + e.id + ":" + demain, titre: emo + " " + e.titre + " demain", corps: [h[0] ? hTxt(h[0]) + (h[1] ? " – " + hTxt(h[1]) : "") : "", e.lieu || ""].filter(Boolean).join(" · "), url: "./?onglet=planning" });
          });
      // Cours (tous) : rappel propre au cours (vision_contenu.rappel) ou réglage général rappel_sport (heures).
      // Rien hors période, le jour d'une annulation (« Pas cette semaine », cours déplacé) ou pendant une pause.
      const { data: annulesL } = await sb.from("vision_seances").select("cours_id, date").eq("user_id", uid).in("date", [now.iso, demain]).eq("fait", false);
      const annules = new Set((annulesL || []).map((x) => x.date + ":" + x.cours_id));
      const enPause = (iso: string, cle: string) => (evs || []).some((e) => e.genre === "pause" && String(e.date_debut) <= iso && String(e.date_fin) >= iso && (e.masque || []).includes(cle));
      const parDefaut = hS > 0 ? Math.min(3, Math.round(hS)) + "h" : "aucun";
      (contenu || [])
        .filter((c) => c.type === "cours")
        .forEach((c) => {
          const mode = c.rappel || parDefaut;
          if (mode === "aucun") return;
          const sport = c.groupe === "sport",
            cleP = sport ? "sport" : "cours",
            t = String(c.detail || "").toLowerCase(),
            h = t.match(/(\d{1,2})h(\d{2})?/),
            nom = String(c.titre || "").replace(/^Sport\s*[—-]\s*/, ""),
            emo = sport ? "🤸" : c.emoji || "📘";
          if (!h) return;
          const heure = h[1] + "h" + (h[2] || "00");
          if (mode === "veille") {
            if (!essai && !(now.heure >= 18 && now.heure < 22)) return;
            if (!t.startsWith(JOURS[(now.jour + 1) % 7]) || !actifLe(c, demain) || annules.has(demain + ":" + c.id) || enPause(demain, cleP)) return;
            rappels.push({ cle: "cours:" + c.id + ":" + demain, titre: emo + " " + nom + " demain", corps: "Cours à " + heure + (c.extra ? " · " + c.extra : ""), url: sport ? "./?onglet=sport" : "./?onglet=planning" });
            return;
          }
          if (!t.startsWith(JOURS[now.jour]) || !actifLe(c, now.iso) || annules.has(now.iso + ":" + c.id) || enPause(now.iso, cleP)) return;
          const minutes = Number(h[1]) * 60 + Number(h[2] || 0) - (now.heure * 60 + now.minute);
          if (minutes > 0 && minutes <= parseInt(mode) * 60) rappels.push({ cle: (sport ? "sport:" : "cours:") + c.id + ":" + now.iso, titre: emo + " " + nom, corps: "Cours à " + heure + (c.extra ? " · " + c.extra : ""), url: sport ? "./?onglet=sport" : "./?onglet=planning" });
        });
      if (essai) {
        apercu.push({ uid, abonnements: mesAbos.length, rappels });
        continue;
      }
      for (const r of rappels) {
        const { data: neuf } = await sb.from("vision_rappels_envoyes").upsert({ user_id: uid, cle: r.cle }, { onConflict: "user_id,cle", ignoreDuplicates: true }).select();
        if (!neuf || !neuf.length) continue;
        for (const a of mesAbos) {
          try {
            await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, JSON.stringify({ titre: r.titre, corps: r.corps, url: r.url }));
            envoyes++;
          } catch (err: any) {
            if (err?.statusCode === 404 || err?.statusCode === 410) await sb.from("vision_push").delete().eq("id", a.id);
            else console.error("push", err?.message || err);
          }
        }
      }
    }
    return new Response(JSON.stringify(essai ? { maintenant: now, apercu } : { envoyes }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
