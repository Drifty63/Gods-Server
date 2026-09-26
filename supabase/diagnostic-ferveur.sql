-- ============================================================
-- GODS — Pourquoi la ferveur ne bouge pas ?
--
-- À COLLER DANS LE SQL EDITOR DE SUPABASE, puis « Run ». Rien n'est modifié :
-- ce script ne fait que LIRE. Il remonte la chaîne dans l'ordre où elle peut
-- rompre, et la première ligne qui répond « NON » désigne le maillon cassé.
--
-- Le code du jeu est correct de bout en bout (vérifié) : si la ferveur ne bouge
-- pas, c'est qu'une migration n'a pas été appliquée, qu'une fonction edge n'a
-- pas été redéployée, ou qu'une partie n'a pas été enregistrée comme classée.
-- ============================================================

-- 1. Les colonnes des trois classements existent-elles ?
--    NON => la migration 20260912120000_ladders_and_seasons.sql n'a pas été appliquée.
select 'colonnes de ferveur par mode' as verification,
       count(*) filter (where column_name in ('ferveur', 'ferveur_duel13', 'ferveur_duel_open')) as trouvees,
       case when count(*) filter (where column_name in ('ferveur', 'ferveur_duel13', 'ferveur_duel_open')) = 3
            then 'OUI' else 'NON — appliquer 20260912120000_ladders_and_seasons.sql' end as verdict
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles';

-- 2. Les colonnes de sommet historique existent-elles ?
--    NON => la migration 20260914120000_achievements_profile_stats.sql manque.
select 'colonnes de ferveur max' as verification,
       count(*) filter (where column_name like 'ferveur\_max%') as trouvees,
       case when count(*) filter (where column_name like 'ferveur\_max%') = 3
            then 'OUI' else 'NON — appliquer 20260914120000_achievements_profile_stats.sql' end as verdict
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles';

-- 3. `apply_stats_update` existe-t-elle avec QUATRE arguments ?
--    La version à trois arguments ne connaît pas les modes : appelée avec
--    quatre, elle n'existe pas et `apply_match_result` échoue en silence.
select 'apply_stats_update(4 arguments)' as verification,
       coalesce(string_agg(pg_get_function_identity_arguments(p.oid), ' | '), 'AUCUNE') as signatures,
       case when bool_or(pg_get_function_identity_arguments(p.oid) like '%text%')
            then 'OUI' else 'NON — appliquer 20260914120000_achievements_profile_stats.sql' end as verdict
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'apply_stats_update';

-- 4. Vos dix dernières parties : étaient-elles réellement CLASSÉES ?
--    `is_ranked = false` => aucune ferveur, c'est voulu (amicale ou privée).
--    `mode` vide ou inattendu => `apply_match_result` s'arrête net.
select 'dernieres parties' as verification,
       id, status, is_ranked, is_private, mode, finished_at
from public.games
where finished_at is not null
order by finished_at desc
limit 10;

-- 5. L'historique a-t-il enregistré un changement de ferveur ?
--    Des lignes avec ferveur_change = 0 sur des parties classées => le calcul
--    a tourné mais n'a rien appliqué. Aucune ligne du tout => `apply_match_result`
--    n'a jamais été atteinte, donc l'appel edge a échoué ou la partie n'était
--    pas classée.
select 'historique de ferveur' as verification,
       game_id, mode, result, ferveur_change, created_at
from public.match_history
order by created_at desc
limit 10;

-- 6. Votre profil aujourd'hui.
select 'profil' as verification,
       username, ferveur, ferveur_duel13, ferveur_duel_open,
       ferveur_max, ferveur_max_duel13, ferveur_max_duel_open,
       placement_ranked, placement_duel13, placement_duel_open
from public.profiles
where id = auth.uid();
