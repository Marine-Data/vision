-- Planning en grille (étape 1) : emoji des cours, horaires du travail jour par jour.
alter table public.vision_contenu add column if not exists emoji text;
alter table public.vision_contenu add column if not exists heure_debut text check (heure_debut is null or heure_debut ~ '^[0-2][0-9]:[0-5][0-9]$');
alter table public.vision_contenu add column if not exists heure_fin text check (heure_fin is null or heure_fin ~ '^[0-2][0-9]:[0-5][0-9]$');
