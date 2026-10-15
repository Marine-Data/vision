-- Écran d'arrivée d'un lien de lecture : nom du lien (« Maman »), petit mot, prénom, date de fin.
-- Rien n'est modifié dans les tables ; la fonction renvoie juste 4 champs de plus,
-- et les pauses quand seul le Sport est partagé.
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
    'nom', nullif(L.nom, ''),
    'mot', L.mot,
    'prenom', vision_prenom(L.user_id),
    'expire', L.expire_le,
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
    'evenements', case when 'planning' = any(s) then vision_partage_evenements(L.user_id, adr)
                       when 'sport' = any(s) then  -- Sport seul : seulement les pauses (pour ne pas annoncer un cours en pause)
                         (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements(vision_partage_evenements(L.user_id, false)) x where x->>'genre' = 'pause')
                       else '[]'::jsonb end,
    'items', case when 'sport' = any(s) and L.montants then
               (select coalesce(jsonb_agg(to_jsonb(i) - 'user_id' - 'raison' - 'detail' - 'import_id'), '[]'::jsonb)
                  from vision_items i where i.user_id = L.user_id and i.pocket = 'sport') else '[]'::jsonb end,
    'budget', case when 'budget' = any(s) and resume is not null then
                case when L.montants then resume else resume - 'eur' end else null end
  );
end $function$;
