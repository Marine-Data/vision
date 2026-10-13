-- =====================================================================
-- Onglets modifiables (13/10/2026)
-- Tout devient modifiable sans perte de données ; chaque écran lit la même source.
-- =====================================================================

-- 1. Plus aucune suppression en cascade des dépenses : un poste s'archive.
-- (Les clés étrangères restent en cascade ; un déclencheur refuse la suppression
--  d'un poste qui a des dépenses, des totaux ou des récurrentes.)
create or replace function public.vision_garde_poste()
 returns trigger language plpgsql security definer set search_path to 'public' as $f$
begin
  if exists (select 1 from vision_transactions where budget_line_id = old.id)
     or exists (select 1 from vision_spend where budget_line_id = old.id)
     or exists (select 1 from vision_recurrentes where budget_line_id = old.id) then
    raise exception 'Ce poste a des dépenses : archive-le au lieu de le supprimer.' using errcode = 'P0001';
  end if;
  return old;
end $f$;
revoke execute on function public.vision_garde_poste() from public, anon, authenticated;

-- archive_depuis : mois_index à partir duquel le poste n'apparaît plus.
-- icone : emoji choisi (sinon l'icône est déduite du nom).
alter table public.vision_budget add column if not exists archive_depuis integer,
  add column if not exists icone text;

-- Les mois initialisés ne reprennent pas un poste archivé, ni un mois clôturé.
-- mois_index = (annee − 2026) × 12 + mois − 7 (ancre : août 2026, voir config.js).
create or replace function public.vision_budget_mois_init(p_annee integer, p_mois integer)
 returns integer language plpgsql set search_path to 'public' as $f$
declare v_user uuid := auth.uid(); v_n int; v_idx int := (p_annee - 2026) * 12 + p_mois - 7;
begin
  if v_user is null then raise exception 'non authentifié'; end if;
  if exists (select 1 from public.vision_cloture c where c.user_id = v_user and c.mois_index = v_idx) then
    return 0;
  end if;
  insert into public.vision_budget_mois
    (user_id, annee, mois, budget_line_id, line_key, kind, poste, detail, montant, sort, type, est_override)
  select b.user_id, p_annee, p_mois, b.id, b.line_key, b.kind, b.poste, b.detail, b.montant, b.sort, b.type, false
    from public.vision_budget b
   where b.user_id = v_user and (b.archive_depuis is null or v_idx < b.archive_depuis)
  on conflict (user_id, annee, mois, line_key) do nothing;
  get diagnostics v_n = row_count;
  return v_n;
end $f$;

-- 2. Dépenses : prévue / faite, récurrente, exceptionnelle (hors rythme de la projection).
create table if not exists public.vision_recurrentes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text not null,
  budget_line_id uuid not null references public.vision_budget(id) on delete restrict,
  montant numeric not null check (montant >= 0),
  jour integer not null check (jour between 1 and 31),
  debut integer not null,
  fin integer,
  actif boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.vision_recurrentes enable row level security;
create policy recurrentes_own on public.vision_recurrentes for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index if not exists vision_recurrentes_user on public.vision_recurrentes(user_id);
create index if not exists vision_recurrentes_ligne on public.vision_recurrentes(budget_line_id);

alter table public.vision_transactions
  add column if not exists recurrente_id uuid references public.vision_recurrentes(id) on delete set null,
  add column if not exists statut text not null default 'fait' check (statut in ('fait', 'prevu')),
  add column if not exists exceptionnelle boolean not null default false;
create index if not exists vision_transactions_recurrente on public.vision_transactions(recurrente_id);

-- 3. Sport : séances suivies (club ou libres).
create table if not exists public.vision_seances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  cours_id uuid references public.vision_contenu(id) on delete set null,
  activite text,
  fait boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.vision_seances enable row level security;
create policy seances_own on public.vision_seances for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create unique index if not exists vision_seances_unique on public.vision_seances(user_id, date, cours_id);
create index if not exists vision_seances_cours on public.vision_seances(cours_id);

-- 4. Contenu : date de fin (étapes du suivi) et fiche d'adhésion.
alter table public.vision_contenu add column if not exists date_fin date;
-- La fiche d'adhésion est une note (groupe « adhesion »).

-- 5. Import : règles rattachées au poste par son identifiant, mots-clés de base en table.
alter table public.vision_import_regles
  add column if not exists budget_line_id uuid references public.vision_budget(id) on delete cascade,
  add column if not exists groupe text check (groupe in ('ignorer','salaire','vacances','sport')),
  add column if not exists source text not null default 'appris' check (source in ('base','appris')),
  add column if not exists sort integer not null default 0;

-- 6. Notifications : abonnements du téléphone et rappels déjà envoyés.
create table if not exists public.vision_push (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.vision_push enable row level security;
create policy push_own on public.vision_push for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index if not exists vision_push_user on public.vision_push(user_id);

create table if not exists public.vision_rappels_envoyes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cle text not null,
  envoye_at timestamptz not null default now(),
  unique (user_id, cle)
);
alter table public.vision_rappels_envoyes enable row level security;
create policy rappels_own on public.vision_rappels_envoyes for select
  using ((select auth.uid()) = user_id);

-- 7. Historique complet : chaque ajout, modification et suppression est gardé (ligne entière).
create or replace function public.vision_log_row_change()
 returns trigger language plpgsql security definer set search_path to 'public' as $f$
begin
  if tg_op = 'INSERT' then
    insert into vision_audit(user_id, table_name, record_id, field, old_value, new_value)
    values (new.user_id, tg_table_name, new.id::text, '*', null, to_jsonb(new)::text);
    return new;
  elsif tg_op = 'UPDATE' then
    if (to_jsonb(old) - 'updated_at') is distinct from (to_jsonb(new) - 'updated_at') then
      insert into vision_audit(user_id, table_name, record_id, field, old_value, new_value)
      values (new.user_id, tg_table_name, new.id::text, '*', to_jsonb(old)::text, to_jsonb(new)::text);
    end if;
    return new;
  else
    insert into vision_audit(user_id, table_name, record_id, field, old_value, new_value)
    values (old.user_id, tg_table_name, old.id::text, '*', to_jsonb(old)::text, null);
    return old;
  end if;
end $f$;
revoke execute on function public.vision_log_row_change() from public, anon, authenticated;

do $d$ declare t text; begin
  foreach t in array array['vision_budget','vision_budget_mois','vision_transactions','vision_contenu',
                           'vision_recurrentes','vision_seances','vision_import_regles'] loop
    execute format('create trigger trg_%1$s_historique after insert or update or delete on public.%1$s
                    for each row execute function public.vision_log_row_change()', t);
  end loop;
end $d$;

-- 8. Mois clôturé = figé : aucune écriture tant qu'il n'est pas rouvert.
create or replace function public.vision_garde_cloture()
 returns trigger language plpgsql security definer set search_path to 'public' as $f$
declare r record; m int;
begin
  for r in select * from (values (case when tg_op = 'INSERT' then null else to_jsonb(old) end),
                                 (case when tg_op = 'DELETE' then null else to_jsonb(new) end)) v(j)
           where j is not null loop
    if tg_table_name = 'vision_budget_mois' then
      m := ((r.j->>'annee')::int - 2026) * 12 + (r.j->>'mois')::int - 7;
    else
      m := (r.j->>'mois_index')::int;
    end if;
    if m is not null and exists (select 1 from vision_cloture c
                                  where c.user_id = (r.j->>'user_id')::uuid and c.mois_index = m) then
      raise exception 'Mois clôturé : rouvre-le pour le modifier.' using errcode = 'P0001';
    end if;
  end loop;
  return case when tg_op = 'DELETE' then old else new end;
end $f$;
revoke execute on function public.vision_garde_cloture() from public, anon, authenticated;

do $d$ declare t text; begin
  foreach t in array array['vision_transactions','vision_budget_mois','vision_items'] loop
    execute format('create trigger trg_%1$s_cloture before insert or update or delete on public.%1$s
                    for each row execute function public.vision_garde_cloture()', t);
  end loop;
end $d$;

-- 9. Réglages par défaut.
insert into public.vision_params (user_id, param_key, montant)
select u.user_id, k.cle, k.val
  from (select distinct user_id from public.vision_budget) u
  cross join (values ('ep_auto_jour', 3), ('alerte_seuil', 50), ('rappel_suivi', 7),
                     ('rappel_echeances', 2), ('rappel_devoirs', 3), ('rappel_sport', -2)) k(cle, val)
on conflict (user_id, param_key) do nothing;

create trigger trg_vision_budget_garde before delete on public.vision_budget
  for each row execute function public.vision_garde_poste();

-- 10. Mots-clés de base de l'import (repris à l'identique des règles du code).
insert into public.vision_import_regles (user_id, motif, groupe, budget_line_id, poste, source, sort)
select u.user_id, r.motif, r.groupe, b.id, coalesce(r.poste, r.groupe), 'base', r.sort
  from (select distinct user_id from public.vision_budget) u
  cross join (values
    ('ignorer', null, 'VIR ZINZEN', 1),
    ('ignorer', null, 'VIR INST ZINZEN', 2),
    ('ignorer', null, 'VIR SEPA ZINZEN', 3),
    ('ignorer', null, 'VIREMENT DE MARINE ZINZEN', 4),
    ('ignorer', null, 'VIREMENT DEPUIS LIVRET', 5),
    ('ignorer', null, 'REJ VIR', 6),
    ('ignorer', null, 'EPARGNE AUTOMATIQUE', 7),
    ('ignorer', null, 'PROVISION VACANCES', 8),
    ('ignorer', null, 'VIR VIR POUR', 9),
    ('ignorer', null, 'VIR COURSES', 10),
    ('salaire', null, 'ADEDOM', 11),
    ('vacances', null, 'TAP AIR', 12),
    ('vacances', null, 'TRANSAVIA', 13),
    ('vacances', null, 'AIRBNB', 14),
    ('vacances', null, 'CLICKANDBOAT', 15),
    ('vacances', null, 'BOOKING', 16),
    ('vacances', null, 'EASYJET', 17),
    ('vacances', null, 'RYANAIR', 18),
    ('vacances', null, 'VUELING', 19),
    ('vacances', null, 'HOTEL', 20),
    ('sport', null, 'MANGOPAY', 21),
    ('sport', null, 'MONCLUB', 22),
    ('sport', null, 'EN AVANT', 23),
    (null, 'Alimentation', 'LIDL', 24),
    (null, 'Alimentation', 'INTERMARCHE', 25),
    (null, 'Alimentation', 'CARREFOUR', 26),
    (null, 'Alimentation', 'DISTRIBEN', 27),
    (null, 'Alimentation', 'FP PARIS', 28),
    (null, 'Alimentation', 'PATISSERIE', 29),
    (null, 'Alimentation', 'TABAC', 30),
    (null, 'Alimentation', 'ACE MART', 31),
    (null, 'Alimentation', 'HUGO PRIMEUR', 32),
    (null, 'Alimentation', 'BELLE VIE', 33),
    (null, 'Alimentation', 'G20', 34),
    (null, 'Alimentation', 'MONOP', 35),
    (null, 'Alimentation', 'FRANPRIX', 36),
    (null, 'Alimentation', 'NOUS PARIS', 37),
    (null, 'Alimentation', 'DISTRI LABRO', 38),
    (null, 'Alimentation', 'CHEZ DOLLY', 39),
    (null, 'Alimentation', 'SUMUP', 40),
    (null, 'Alimentation', 'BOULANG', 41),
    (null, 'Alimentation', 'PICARD', 42),
    (null, 'Alimentation', 'NATURALIA', 43),
    (null, 'Alimentation', 'BIOCOOP', 44),
    (null, 'Alimentation', 'AUCHAN', 45),
    (null, 'Alimentation', 'LECLERC', 46),
    (null, 'Alimentation', 'CASINO', 47),
    (null, 'Alimentation', 'PRIMEUR', 48),
    (null, 'Transports', 'SNCF', 49),
    (null, 'Transports', 'RESEAU MISTRAL', 50),
    (null, 'Transports', 'SANEF', 51),
    (null, 'Transports', 'NAVIGO', 52),
    (null, 'Transports', 'RATP', 53),
    (null, 'Transports', 'REGIELER', 54),
    (null, 'Transports', 'DAT AIX', 55),
    (null, 'Transports', 'BLABLACAR', 56),
    (null, 'Transports', 'INDIGO', 57),
    (null, 'Transports', 'CLICHY', 58),
    (null, 'Transports', 'UBER', 59),
    (null, 'Transports', 'VELIB', 60),
    (null, 'Transports', 'AUTOROUTE', 61),
    (null, 'Beauté & soins', 'INSTITUT WENDY', 62),
    (null, 'Beauté & soins', 'AROMA-ZONE', 63),
    (null, 'Beauté & soins', 'NORMAL PARIS', 64),
    (null, 'Beauté & soins', 'SEPHORA', 65),
    (null, 'Beauté & soins', 'COIFF', 66),
    (null, 'Vêtements', 'TIME TO PRESSING', 67),
    (null, 'Vêtements', 'DECATHLON', 68),
    (null, 'Vêtements', 'ZARA', 69),
    (null, 'Vêtements', 'UNIQLO', 70),
    (null, 'Vêtements', 'KIABI', 71),
    (null, 'Vêtements', 'PRESSING', 72),
    (null, 'Santé / pharmacie', 'DOCTOLIB', 73),
    (null, 'Santé / pharmacie', 'DOCTEUR', 74),
    (null, 'Santé / pharmacie', 'PHARMA', 75),
    (null, 'Santé / pharmacie', 'MEDECIN', 76),
    (null, 'Santé / pharmacie', 'DENTISTE', 77),
    (null, 'Logement & énergie', 'EDF', 78),
    (null, 'Logement & énergie', 'ENGIE', 79),
    (null, 'Logement & énergie', 'LOYER', 80),
    (null, 'Logement & énergie', 'ASSURANCE HABIT', 81),
    (null, 'Impôts (DGFIP)', 'FINANCES PUBLIQUES', 82),
    (null, 'Impôts (DGFIP)', 'DIRECTION GENERALE DES FINANCE', 83),
    (null, 'Impôts (DGFIP)', 'DGFIP', 84),
    (null, 'Abonnements', 'ANTHROPIC', 85),
    (null, 'Abonnements', 'CLAUDE', 86),
    (null, 'Abonnements', 'MEDIAPART', 87),
    (null, 'Abonnements', 'GOOGLE', 88),
    (null, 'Abonnements', 'STRAVA', 89),
    (null, 'Abonnements', 'YOUTUB', 90),
    (null, 'Abonnements', 'NETFLIX', 91),
    (null, 'Abonnements', 'SPOTIFY', 92),
    (null, 'Abonnements', 'DEEZER', 93),
    (null, 'Abonnements', 'BOURSO PROTECT', 94),
    (null, 'Matériel & high-tech', 'AMAZON', 95),
    (null, 'Matériel & high-tech', 'EURL CUEFF', 96),
    (null, 'Matériel & high-tech', 'FNAC', 97),
    (null, 'Matériel & high-tech', 'DARTY', 98),
    (null, 'Matériel & high-tech', 'APPLE', 99),
    (null, 'Plaisir / sorties', 'EL COMPADRE', 100),
    (null, 'Plaisir / sorties', 'RESTAU', 101),
    (null, 'Plaisir / sorties', 'CINEMA', 102),
    (null, 'Plaisir / sorties', 'UGC', 103),
    (null, 'Plaisir / sorties', 'PATHE', 104),
    (null, 'Argent liquide', 'RETRAIT DAB', 105)
  ) r(groupe, poste, motif, sort)
  left join public.vision_budget b on b.user_id = u.user_id and b.poste = r.poste
on conflict (user_id, motif) do nothing;

-- 11. Données reprises
-- Étapes du suivi : dates reprises du texte de chaque étape.
update public.vision_contenu c set date_iso = v.d::date, date_fin = v.f::date
  from (values ('suivi:1','2026-09-08','2026-09-25'), ('suivi:4','2026-09-01','2026-11-30'),
               ('suivi:5','2026-09-08','2026-09-25'), ('suivi:6','2026-09-28',null),
               ('suivi:7','2026-12-01',null), ('suivi:8','2027-01-15',null),
               ('suivi:9','2027-01-05','2027-01-25'), ('suivi:10','2027-07-04',null)) v(k, d, f)
 where c.type = 'suivi' and c.item_key = v.k and c.date_iso is null;

-- Fiche d'adhésion sport (reprise de la note existante, qui reste en place).
insert into public.vision_contenu (user_id, type, item_key, groupe, titre, detail, extra, date_iso, complement, sort)
select distinct user_id, 'note', 'adhesion:sport', 'adhesion', 'En Avant! de Paris', 'Free Style Gym · 2 cours/semaine',
       '10 rue Huyghens, 75014 Paris', date '2027-08-31', 'certificat:ok', 0
  from public.vision_budget
on conflict (user_id, type, item_key) do nothing;

-- Dépenses récurrentes validées le 13/10/2026.
insert into public.vision_recurrentes (user_id, label, budget_line_id, montant, jour, debut, fin, sort)
select b.user_id, r.label, b.id, r.montant, r.jour, r.debut, r.fin, r.sort
  from (values ('ENGIE', 'Logement & énergie', 98::numeric, 1, 2, null::int, 1),
               ('Netflix + Supabase', 'Abonnements', 38.97, 1, 2, null, 2),
               ('Claude, Mediapart, Google, Strava, YouTube', 'Abonnements', 58.57, 1, 2, null, 3),
               ('EDF', 'Logement & énergie', 30.27, 6, 2, null, 4),
               ('Cristel · Alma 3×', 'Matériel & high-tech', 61.66, 7, 2, 4, 5)) r(label, poste, montant, jour, debut, fin, sort)
  join public.vision_budget b on b.poste = r.poste
 where not exists (select 1 from public.vision_recurrentes x where x.user_id = b.user_id and x.label = r.label);

-- Rattachement des dépenses d'octobre déjà saisies.
update public.vision_transactions t set recurrente_id = r.id
  from public.vision_recurrentes r
 where t.user_id = r.user_id and t.budget_line_id = r.budget_line_id and t.recurrente_id is null
   and t.mois_index = 2
   and ((r.label = 'ENGIE' and t.note = 'ENGIE')
     or (r.label = 'EDF' and t.note = 'EDF')
     or (r.label = 'Netflix + Supabase' and t.note = 'Netflix + Supabase'));
update public.vision_transactions t set recurrente_id = r.id,
       statut = case when t.date_depense > date '2026-10-13' then 'prevu' else t.statut end
  from public.vision_recurrentes r
 where t.user_id = r.user_id and r.label = 'Cristel · Alma 3×' and t.recurrente_id is null
   and t.budget_line_id = r.budget_line_id and t.note like 'Cristel (Alma 3x%';

-- Claude, Mediapart, Google, Strava, YouTube : pas encore vus en octobre → prévus fin octobre.
insert into public.vision_transactions (user_id, budget_line_id, montant, note, date_depense, mois_index, type, recurrente_id, statut)
select r.user_id, r.budget_line_id, r.montant, r.label, date '2026-10-31', 2, 'depense', r.id, 'prevu'
  from public.vision_recurrentes r
 where r.label = 'Claude, Mediapart, Google, Strava, YouTube'
   and not exists (select 1 from public.vision_transactions t where t.recurrente_id = r.id and t.mois_index = 2);
