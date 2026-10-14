-- Partager : liens de lecture, invitations, échange de plannings, résumé du budget.
-- Tout est ajouté, rien n'est modifié dans les tables existantes.

-- 1. Liens de partage (un par personne)
create table if not exists public.vision_partages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  jeton text not null unique default replace(replace(rtrim(encode(extensions.gen_random_bytes(24), 'base64'), '='), '+', '-'), '/', '_'),
  nom text not null default '',
  emoji text,
  formule text not null default 'deux' check (formule in ('montrer', 'inviter', 'deux')),
  sections text[] not null default '{}',
  montants boolean not null default false,
  adresses boolean not null default false,
  code text check (code is null or code ~ '^[0-9]{4}$'),
  tentatives integer not null default 0,
  duree text not null default 'mois' check (duree in ('sem', 'mois', 'jamais')),
  expire_le timestamptz,
  prevenir boolean not null default true,
  echange boolean not null default false,
  mot text,
  actif boolean not null default true,
  vues integer not null default 0,
  derniere_vue timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.vision_partages enable row level security;
create policy partages_own on public.vision_partages for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 2. Échanges de plannings (une ligne par paire, créée seulement par la fonction d'invitation)
create table if not exists public.vision_echanges (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);
alter table public.vision_echanges enable row level security;
create policy echanges_lire on public.vision_echanges for select
  using ((select auth.uid()) in (user_a, user_b));
create policy echanges_arreter on public.vision_echanges for delete
  using ((select auth.uid()) in (user_a, user_b));

-- 3. Résumé du budget du mois (calculé par l'app de la propriétaire, mêmes chiffres qu'à l'écran)
create table if not exists public.vision_partage_resume (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  budget jsonb not null default '{}',
  maj timestamptz not null default now()
);
alter table public.vision_partage_resume enable row level security;
create policy resume_own on public.vision_partage_resume for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 4. File des notifications « ton lien a été ouvert », « elle a créé son app »
create table if not exists public.vision_notifs_file (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titre text not null,
  corps text,
  url text,
  envoye boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.vision_notifs_file enable row level security; -- aucune politique : réservé aux fonctions

-- Prévenir : met la notification en file et réveille la fonction d'envoi.
create or replace function public.vision_notifier(p_user uuid, p_titre text, p_corps text, p_url text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into vision_notifs_file (user_id, titre, corps, url) values (p_user, p_titre, p_corps, p_url);
  perform net.http_post(
    url := 'https://osqyczwawbbwjwaubtvc.supabase.co/functions/v1/vision-rappels',
    body := '{"file": true}'::jsonb,
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcXljendhd2Jid2p3YXVidHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5Nzk1MjUsImV4cCI6MjA5NzU1NTUyNX0.Lk2iuL3v_AGuXbyG5yU_-cfvnOtmYoWxiYdyCVKxXzg"}'::jsonb,
    timeout_milliseconds := 10000
  );
exception when others then null; -- une notification ratée ne bloque jamais la lecture
end $$;
revoke all on function public.vision_notifier(uuid, text, text, text) from public, anon, authenticated;

-- Prénom affiché pour une personne (profil, sinon rien)
create or replace function public.vision_prenom(p_user uuid) returns text
language sql stable security definer set search_path = public as $$
  select nullif(detail, '') from vision_contenu where user_id = p_user and type = 'note' and groupe = 'profil' limit 1
$$;
revoke all on function public.vision_prenom(uuid) from public, anon, authenticated;

-- Lien valable ? (actif, pas expiré)
create or replace function public.vision_lien(p_jeton text) returns public.vision_partages
language sql stable security definer set search_path = public as $$
  select * from vision_partages where jeton = p_jeton and actif and (expire_le is null or expire_le > now()) limit 1
$$;
revoke all on function public.vision_lien(text) from public, anon, authenticated;

-- Lecture d'un lien « Montrer » / « Les deux » : seulement les parties cochées.
create or replace function public.vision_partage_lire(p_jeton text, p_code text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  L vision_partages;
  proprio boolean;
  s text[];
  adr boolean;
  cles text[];
  res jsonb;
  resume jsonb;
begin
  L := vision_lien(p_jeton);
  if L.id is null then return jsonb_build_object('etat', 'invalide'); end if;
  proprio := coalesce((select auth.uid()) = L.user_id, false);
  if L.formule = 'inviter' then
    return jsonb_build_object('etat', 'invitation');
  end if;
  if L.code is not null and not proprio then
    if L.tentatives >= 5 then return jsonb_build_object('etat', 'bloque', 'prenom', vision_prenom(L.user_id)); end if;
    if p_code is null then return jsonb_build_object('etat', 'code', 'prenom', vision_prenom(L.user_id)); end if;
    if p_code <> L.code then
      update vision_partages set tentatives = tentatives + 1 where id = L.id;
      return jsonb_build_object('etat', 'code', 'erreur', true, 'restants', greatest(0, 4 - L.tentatives), 'prenom', vision_prenom(L.user_id));
    end if;
  end if;
  if not proprio then
    update vision_partages set vues = vues + 1, derniere_vue = now(), tentatives = 0 where id = L.id;
    if L.vues = 0 and L.prevenir then
      perform vision_notifier(L.user_id, '👁 ' || coalesce(nullif(L.nom, ''), 'Quelqu''un') || ' a ouvert ton lien', 'Première ouverture.', './?onglet=reglages');
    end if;
  end if;
  s := L.sections;
  adr := L.adresses;
  -- Contenu autorisé, adresses et notes retirées si demandé
  select coalesce(jsonb_agg(
           to_jsonb(c) - 'user_id'
           || case when not adr and c.type in ('cours', 'suivi') then jsonb_build_object('extra', null) else '{}'::jsonb end
           || case when not adr and c.type = 'note' and c.groupe = 'adhesion' then jsonb_build_object('extra', null) else '{}'::jsonb end
         ), '[]'::jsonb)
    into res
    from vision_contenu c
   where c.user_id = L.user_id
     and (
       (c.type = 'note' and c.groupe = 'profil')
       or ('planning' = any(s) and c.type in ('jour', 'cours'))
       or ('planning' = any(s) and adr and c.type = 'note' and c.groupe in ('planning', 'planning_sub'))
       or ('sport' = any(s) and c.type = 'cours' and c.groupe = 'sport')
       or ('sport' = any(s) and c.type = 'note' and c.groupe = 'adhesion')
       or ('sport' = any(s) and adr and c.type = 'note' and c.groupe in ('sport', 'sport_sub'))
       or ('suivi' = any(s) and c.type in ('suivi', 'chrono'))
       or ('pieces' = any(s) and c.type = 'piece')
       or ('homework' = any(s) and c.type = 'matiere')
     );
  select array_agg(x->>'item_key') into cles from jsonb_array_elements(res) x;
  select budget into resume from vision_partage_resume where user_id = L.user_id;
  return jsonb_build_object(
    'etat', 'ok',
    'formule', L.formule,
    'sections', to_jsonb(s),
    'montants', L.montants,
    'contenu', res,
    'progress', (select coalesce(jsonb_agg(jsonb_build_object('item_key', p.item_key, 'done', p.done, 'etape', p.etape)), '[]'::jsonb)
                   from vision_progress p where p.user_id = L.user_id and p.item_key = any(coalesce(cles, '{}'))),
    'homework', case when 'homework' = any(s) then
                  (select coalesce(jsonb_agg(to_jsonb(h) - 'user_id' - 'file_url'
                     || case when not adr then jsonb_build_object('description', null, 'notes', null) else '{}'::jsonb end
                     order by h.deadline), '[]'::jsonb)
                     from vision_homework h where h.user_id = L.user_id) else '[]'::jsonb end,
    'seances', case when 'sport' = any(s) then
                 (select coalesce(jsonb_agg(to_jsonb(x) - 'user_id'), '[]'::jsonb) from vision_seances x where x.user_id = L.user_id) else '[]'::jsonb end,
    'items', case when 'sport' = any(s) and L.montants then
               (select coalesce(jsonb_agg(to_jsonb(i) - 'user_id' - 'raison' - 'detail' - 'import_id'), '[]'::jsonb)
                  from vision_items i where i.user_id = L.user_id and i.pocket = 'sport') else '[]'::jsonb end,
    'budget', case when 'budget' = any(s) and resume is not null then
                case when L.montants then resume else resume - 'eur' end else null end
  );
end $$;
revoke all on function public.vision_partage_lire(text, text) from public;
grant execute on function public.vision_partage_lire(text, text) to anon, authenticated;

-- Écran d'invitation : prénom de l'invitante, petit mot, échange proposé.
create or replace function public.vision_partage_invitation(p_jeton text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare L vision_partages;
begin
  L := vision_lien(p_jeton);
  if L.id is null or L.formule = 'montrer' then return jsonb_build_object('etat', 'invalide'); end if;
  return jsonb_build_object('etat', 'ok', 'prenom', vision_prenom(L.user_id), 'mot', L.mot, 'echange', L.echange,
                            'proprio', coalesce((select auth.uid()) = L.user_id, false));
end $$;
revoke all on function public.vision_partage_invitation(text) from public;
grant execute on function public.vision_partage_invitation(text) to anon, authenticated;

-- Modèle de l'invitante : noms des postes et onglets, jamais les montants.
create or replace function public.vision_partage_modele(p_jeton text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare L vision_partages;
begin
  L := vision_lien(p_jeton);
  if L.id is null or L.formule = 'montrer' or (select auth.uid()) is null then return null; end if;
  return jsonb_build_object(
    'postes', (select coalesce(jsonb_agg(jsonb_build_object('poste', b.poste, 'icone', b.icone, 'line_key', b.line_key) order by b.sort), '[]'::jsonb)
                 from vision_budget b where b.user_id = L.user_id and b.kind = 'charge' and b.archive_depuis is null and b.line_key <> 'c_sport'),
    'onglets', (select coalesce(jsonb_object_agg(substr(p.param_key, 8), p.montant), '{}'::jsonb)
                  from vision_params p where p.user_id = L.user_id and p.param_key like 'onglet\_%')
  );
end $$;
revoke all on function public.vision_partage_modele(text) from public;
grant execute on function public.vision_partage_modele(text) to authenticated;

-- L'invitée a créé son app (ou accepte l'échange depuis un compte existant).
create or replace function public.vision_invitation_utilisee(p_jeton text, p_echange boolean, p_nouveau boolean default true)
returns jsonb language plpgsql security definer set search_path = public as $$
declare L vision_partages; moi uuid := (select auth.uid()); qui text;
begin
  L := vision_lien(p_jeton);
  if L.id is null or moi is null or moi = L.user_id or L.formule = 'montrer' then return jsonb_build_object('ok', false); end if;
  qui := coalesce(vision_prenom(moi), nullif(L.nom, ''), 'Quelqu''un');
  if p_echange and L.echange then
    insert into vision_echanges (user_a, user_b) values (least(moi, L.user_id), greatest(moi, L.user_id))
    on conflict do nothing;
  end if;
  if L.prevenir then
    perform vision_notifier(L.user_id,
      case when p_nouveau then '✨ ' || qui || ' a créé son app' else '🔁 ' || qui || ' a accepté l''échange' end,
      case when p_echange and L.echange then 'Vos plannings sont partagés.' else 'Grâce à ton invitation.' end,
      './?onglet=planning');
  end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.vision_invitation_utilisee(text, boolean, boolean) from public;
grant execute on function public.vision_invitation_utilisee(text, boolean, boolean) to authenticated;

-- Plannings des personnes avec qui on échange : cours seulement, sans adresse.
create or replace function public.vision_planning_partenaires()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare moi uuid := (select auth.uid());
begin
  if moi is null then return '[]'::jsonb; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object(
            'echange_id', e.id,
            'prenom', coalesce(vision_prenom(case when e.user_a = moi then e.user_b else e.user_a end), 'Ton amie'),
            'cours', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'titre', c.titre, 'detail', c.detail, 'complement', c.complement)), '[]'::jsonb)
                        from vision_contenu c where c.user_id = case when e.user_a = moi then e.user_b else e.user_a end and c.type = 'cours')
          )), '[]'::jsonb)
          from vision_echanges e where moi in (e.user_a, e.user_b));
end $$;
revoke all on function public.vision_planning_partenaires() from public;
grant execute on function public.vision_planning_partenaires() to authenticated;

-- Pour la fonction d'envoi (rôle service) : la clé VAPID est déjà lue par vision_vapid_prive().
