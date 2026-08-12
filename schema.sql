-- ⚠️ DÉJÀ APPLIQUÉ par Claude sur le projet kdrama-app (table vision_progress).
-- Gardé uniquement pour référence — l'app ne l'exécute pas.

create table if not exists public.vision_progress (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_key   text not null,
  done       boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, item_key)
);

alter table public.vision_progress enable row level security;

drop policy if exists "vision_progress_select" on public.vision_progress;
drop policy if exists "vision_progress_insert" on public.vision_progress;
drop policy if exists "vision_progress_update" on public.vision_progress;
drop policy if exists "vision_progress_delete" on public.vision_progress;

create policy "vision_progress_select" on public.vision_progress for select using (auth.uid() = user_id);
create policy "vision_progress_insert" on public.vision_progress for insert with check (auth.uid() = user_id);
create policy "vision_progress_update" on public.vision_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "vision_progress_delete" on public.vision_progress for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.vision_progress to authenticated;
