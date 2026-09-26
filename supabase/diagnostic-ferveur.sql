-- ============================================================
-- GODS — Pourquoi la ferveur ne bouge pas ?
--
-- À coller dans le SQL Editor de Supabase, puis « Run ». Rien n'est modifié :
-- ce script ne fait que LIRE. Chaque ligne du résultat porte un verdict ; la
-- première qui n'est pas « OK » désigne le maillon cassé.
--
-- Le code du jeu est correct de bout en bout (vérifié) : si la ferveur ne bouge
-- pas, c'est qu'une migration n'a pas été appliquée ou qu'une fonction edge n'a
-- pas été redéployée.
--
-- NOTE : pas d'`auth.uid()` ici. L'éditeur SQL ne s'exécute pas au nom d'un
-- joueur connecté, il y renverrait toujours vide.
-- ============================================================

select 'ferveur par mode' as verification,
       case when count(*) = 3 then 'OK'
            else 'MANQUE — appliquer 20260912120000_ladders_and_seasons.sql' end as verdict
  from information_schema.columns
 where table_schema = 'public' and table_name = 'profiles'
   and column_name in ('ferveur', 'ferveur_duel13', 'ferveur_duel_open')

union all
select 'ferveur max par mode',
       case when count(*) = 3 then 'OK'
            else 'MANQUE — appliquer 20260914120000_achievements_profile_stats.sql' end
  from information_schema.columns
 where table_schema = 'public' and table_name = 'profiles'
   and column_name in ('ferveur_max', 'ferveur_max_duel13', 'ferveur_max_duel_open')

union all
select 'apply_stats_update a 4 arguments',
       case when exists (
                select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'apply_stats_update'
                   and pg_get_function_identity_arguments(p.oid) like '%text%')
            then 'OK'
            else 'MANQUE — appliquer 20260914120000_achievements_profile_stats.sql' end

union all
select 'parties classees terminees',
       (select count(*)::text from public.games where finished_at is not null and is_ranked)

union all
select 'lignes dans match_history',
       (select count(*)::text from public.match_history);


-- Vos cinq derniers profils actifs, et vos cinq dernières parties.
-- Une partie classée terminée SANS ligne correspondante dans match_history
-- signifie que `apply_match_result` n'a jamais tourné : l'appel edge a échoué.
select username, ferveur, ferveur_duel13, ferveur_duel_open, ferveur_max
  from public.profiles
 order by last_login_at desc nulls last
 limit 5;

select id, status, is_ranked, is_private, mode, finished_at
  from public.games
 where finished_at is not null
 order by finished_at desc
 limit 5;
