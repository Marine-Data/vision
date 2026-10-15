import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

// Rappels de l'app Vision, appelée chaque heure par pg_cron (tâche « vision-rappels-horaire »).
// Réglages (vision_params) : rappel_suivi, rappel_echeances, rappel_devoirs (jours avant),
// rappel_sport (heures avant). Valeur négative ou nulle = rappel coupé.
// Chaque rappel n'est envoyé qu'une fois (vision_rappels_envoyes).
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
      const [{ data: params }, { data: contenu }, { data: progress }, { data: tx }, { data: items }, { data: hw }, { data: budget }] = await Promise.all([
        sb.from("vision_params").select("param_key, montant").eq("user_id", uid),
        sb.from("vision_contenu").select("*").eq("user_id", uid),
        sb.from("vision_progress").select("item_key, done").eq("user_id", uid),
        sb.from("vision_transactions").select("*").eq("user_id", uid).eq("statut", "prevu"),
        sb.from("vision_items").select("*").eq("user_id", uid).eq("paid", false),
        sb.from("vision_homework").select("*").eq("user_id", uid),
        sb.from("vision_budget").select("id, poste").eq("user_id", uid),
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
      // Cours annulés aujourd'hui (« Pas cette semaine » dans Planning) : pas de rappel.
      const annules = hS > 0 ? new Set((((await sb.from("vision_seances").select("cours_id").eq("user_id", uid).eq("date", now.iso).eq("fait", false)).data) || []).map((x) => x.cours_id)) : new Set();
      if (hS > 0)
        (contenu || []).filter((c) => c.type === "cours" && c.groupe === "sport" && !annules.has(c.id)).forEach((c) => {
          const t = String(c.detail || "").toLowerCase();
          if (!t.startsWith(JOURS[now.jour])) return;
          const h = t.match(/(\d{1,2})h(\d{2})?/);
          if (!h) return;
          const minutes = Number(h[1]) * 60 + Number(h[2] || 0) - (now.heure * 60 + now.minute);
          if (minutes > 0 && minutes <= hS * 60) rappels.push({ cle: "sport:" + c.id + ":" + now.iso, titre: "🤸 " + String(c.titre || "").replace(/^Sport\s*[—-]\s*/, ""), corps: "Cours à " + h[1] + "h" + (h[2] || "00") + (c.extra ? " · " + c.extra : ""), url: "./?onglet=sport" });
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
