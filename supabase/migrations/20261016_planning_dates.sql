-- Planning étape 2 : événements à certaines dates (DU, rendez-vous…) et pauses (vacances).
-- Une seule table, rien n'est modifié dans les tables existantes.
--   genre 'evenement' : titre, catégorie, dates[] (+ horaires différents par date), lieu, rappel la veille,
--                       annulees[] = dates retirées une seule fois (« Pas cette date »).
--   genre 'pause'     : titre, date_debut → date_fin, masque[] = ce qui s'arrête (travail, cours, sport).
create table if not exists public.vision_evenements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  genre text not null default 'evenement' check (genre in ('evenement', 'pause')),
  categorie text not null default 'rdv' check (categorie in ('rdv', 'formation', 'sport', 'autre')),
  titre text not null default '',
  emoji text,
  dates date[] not null default '{}',
  heure_debut text check (heure_debut is null or heure_debut ~ '^[0-2][0-9]:[0-5][0-9]$'),
  heure_fin text check (heure_fin is null or heure_fin ~ '^[0-2][0-9]:[0-5][0-9]$'),
  horaires jsonb not null default '{}',
  lieu text,
  rappel boolean not null default true,
  annulees date[] not null default '{}',
  date_debut date,
  date_fin date,
  masque text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (genre <> 'pause' or (date_debut is not null and date_fin is not null and date_fin >= date_debut))
);
alter table public.vision_evenements enable row level security;
create policy evenements_own on public.vision_evenements for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index if not exists vision_evenements_user on public.vision_evenements (user_id);
create trigger trg_vision_evenements_historique after insert or delete or update on public.vision_evenements
  for each row execute function vision_log_row_change();

-- Lien de lecture : les événements et pauses suivent la partie « Planning » (lieu masqué sans « adresses »).
create or replace function public.vision_partage_evenements(p_user uuid, p_adresses boolean)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select coalesce(jsonb_agg(to_jsonb(e) - 'user_id'
           || case when not p_adresses then jsonb_build_object('lieu', null) else '{}'::jsonb end), '[]'::jsonb)
    from vision_evenements e where e.user_id = p_user
$$;
revoke all on function public.vision_partage_evenements(uuid, boolean) from public, anon, authenticated;

create or replace function public.vision_partage_lire(p_jeton text, p_code text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
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
                 (select coalesce(jsonb_agg(to_jsonb(x) - 'user_id'), '[]'::jsonb) from vision_seances x where x.user_id = L.user_id)
               when 'planning' = any(s) then  -- Planning seul : seulement les cours annulés un jour (pas la présence)
                 (select coalesce(jsonb_agg(to_jsonb(x) - 'user_id'), '[]'::jsonb) from vision_seances x where x.user_id = L.user_id and x.fait = false)
               else '[]'::jsonb end,
    'evenements', case when 'planning' = any(s) then vision_partage_evenements(L.user_id, adr) else '[]'::jsonb end,
    'items', case when 'sport' = any(s) and L.montants then
               (select coalesce(jsonb_agg(to_jsonb(i) - 'user_id' - 'raison' - 'detail' - 'import_id'), '[]'::jsonb)
                  from vision_items i where i.user_id = L.user_id and i.pocket = 'sport') else '[]'::jsonb end,
    'budget', case when 'budget' = any(s) and resume is not null then
                case when L.montants then resume else resume - 'eur' end else null end
  );
end $function$;

-- Échange de plannings : les dates et pauses de l'autre servent à calculer les créneaux libres
-- (sans lieu). Le nom de repli est neutre.
create or replace function public.vision_planning_partenaires()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare moi uuid := (select auth.uid());
begin
  if moi is null then return '[]'::jsonb; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object(
            'echange_id', e.id,
            'prenom', coalesce(vision_prenom(autre), 'Ton binôme'),
            'cours', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'titre', c.titre, 'detail', c.detail, 'complement', c.complement)), '[]'::jsonb)
                        from vision_contenu c where c.user_id = autre and c.type = 'cours'),
            'evenements', (select coalesce(jsonb_agg(jsonb_build_object('genre', v.genre, 'dates', v.dates, 'annulees', v.annulees,
                              'heure_debut', v.heure_debut, 'heure_fin', v.heure_fin, 'horaires', v.horaires,
                              'date_debut', v.date_debut, 'date_fin', v.date_fin, 'masque', v.masque)), '[]'::jsonb)
                        from vision_evenements v where v.user_id = autre)
          )), '[]'::jsonb)
          from (select e.*, case when e.user_a = moi then e.user_b else e.user_a end as autre
                  from vision_echanges e where moi in (e.user_a, e.user_b)) e);
end $function$;
