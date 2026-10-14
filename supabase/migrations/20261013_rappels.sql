-- Rappels sur le téléphone (13/10/2026)
-- La clé privée VAPID est dans le coffre Supabase (vault) sous le nom « vision_vapid_private »
-- (jamais dans le dépôt). La clé publique est dans src/lib/notifications.js et dans la fonction.
--   select vault.create_secret('<clé privée>', 'vision_vapid_private', 'Clé privée VAPID des rappels Vision');
create or replace function public.vision_vapid_prive()
 returns text language sql security definer set search_path to 'public', 'vault' as $f$
  select decrypted_secret from vault.decrypted_secrets where name = 'vision_vapid_private' limit 1
$f$;
revoke execute on function public.vision_vapid_prive() from public, anon, authenticated;
grant execute on function public.vision_vapid_prive() to service_role;

-- Appel de la fonction « vision-rappels » chaque heure (à la 7e minute).
select cron.schedule('vision-rappels-horaire', '7 * * * *', $c$
  select net.http_post(
    url := 'https://osqyczwawbbwjwaubtvc.supabase.co/functions/v1/vision-rappels',
    headers := jsonb_build_object('Authorization', 'Bearer <clé anon>', 'Content-Type', 'application/json'),
    timeout_milliseconds := 30000
  );
$c$);

-- Les détails des étapes du suivi qui ne faisaient que répéter la date ont été vidés
-- (la date est désormais dans date_iso / date_fin ; l'ancien texte reste dans l'historique).

-- 14/10/2026 : Planning sans doublons. Les cours s'affichent tout seuls dans la semaine ;
-- les textes qui recopiaient les horaires des cours sont mis de côté (groupe « …_archive »),
-- jamais supprimés. Strava résilié : récurrente ramenée à 48,58 € (Claude, Mediapart, Google One, YouTube).
