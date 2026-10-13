// Rappels sur le téléphone : état des notifications et abonnement.
import { supabase } from "./supabase.js";

export const VAPID_PUBLIQUE =
  "BOggBaZqp69kCtBQP8bsGgzMxUnlMMSqYwYkiDFcYovilILXH6Plxn7DuTkUvR8FABskn_Tu9UHe7iPdCVUv7qk";

const enOctets = (b64) => {
  const p = "=".repeat((4 - (b64.length % 4)) % 4),
    s = atob((b64 + p).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...s].map((c) => c.charCodeAt(0)));
};
const iphone = () => /iphone|ipad|ipod/i.test(navigator.userAgent || "");
const installee = () =>
  (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
  navigator.standalone === true;

export function enregistrerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  navigator.serviceWorker.register("./sw.js").catch((e) => console.warn("service worker :", e.message));
}

// { etat, message } : actives | a-activer | installer | refuse | non-supporte
export async function etatNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return iphone() && !installee()
      ? {
          etat: "installer",
          message:
            "Sur iPhone : dans Safari, touche Partager puis « Sur l'écran d'accueil ». Ouvre ensuite Vision depuis l'icône et reviens ici.",
        }
      : { etat: "non-supporte", message: "Ce navigateur ne peut pas recevoir de notifications." };
  }
  if (Notification.permission === "denied")
    return {
      etat: "refuse",
      message: "Les notifications sont bloquées : autorise-les pour Vision dans les réglages du téléphone.",
    };
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg && (await reg.pushManager.getSubscription());
    if (sub && Notification.permission === "granted") return { etat: "actives", message: "" };
  } catch (e) {}
  return { etat: "a-activer", message: "Active les rappels sur ce téléphone pour les recevoir." };
}

export async function activerNotifications(uid) {
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Notifications refusées sur ce téléphone.");
  const reg =
    (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register("./sw.js"));
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: enOctets(VAPID_PUBLIQUE),
    }));
  const j = sub.toJSON();
  const { error } = await supabase
    .from("vision_push")
    .upsert(
      { user_id: uid, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth },
      { onConflict: "endpoint" },
    );
  if (error) throw error;
}
