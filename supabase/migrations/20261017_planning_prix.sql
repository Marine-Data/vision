-- Planning étape 3 : prix relié au Budget, matière, rappel par cours, cours déplacés.
-- Ajouts seulement.
--   depenses : liens vers les dépenses du Budget [{ "t": "item" | "tx", "id": uuid }].
--              Le montant et « payé » restent dans vision_items / vision_transactions (une seule source).
--   matiere  : matière des Devoirs reliée au cours.
--   rappel   : null = réglage général ; 'aucun' | '1h' | '2h' | '3h' | 'veille'.
--   origine  : cours d'origine d'un cours déplacé une seule fois (« Déplacer cette fois »).
alter table public.vision_contenu add column if not exists depenses jsonb not null default '[]';
alter table public.vision_contenu add column if not exists matiere text;
alter table public.vision_contenu add column if not exists rappel text check (rappel is null or rappel in ('aucun', '1h', '2h', '3h', 'veille'));
alter table public.vision_contenu add column if not exists origine uuid references public.vision_contenu(id) on delete set null;
alter table public.vision_evenements add column if not exists depenses jsonb not null default '[]';
alter table public.vision_evenements add column if not exists matiere text;
