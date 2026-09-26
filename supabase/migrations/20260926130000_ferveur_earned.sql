-- ============================================================
-- GODS — Ferveur cumulée depuis la création du compte
--
-- LE PROBLÈME. Le profil affichait la ferveur courante DEUX FOIS : dans la
-- barre sous le pseudo, et dans les statistiques sous « Ferveur actuelle ». Le
-- second chiffre n'apprenait donc rien.
--
-- « Ferveur max » répond déjà à « jusqu'où suis-je monté ». Il manquait « combien
-- en ai-je gagné en tout » — un total qui ne redescend jamais, y compris après
-- la clôture d'une saison, et qui mesure l'activité plutôt que le niveau.
--
-- Seuls les GAINS sont comptés. Une défaite ne retire rien à ce total : c'est
-- ce qui le distingue de la ferveur courante, qui monte et descend.
--
-- ⚠ À APPLIQUER APRÈS `20260912120000_ladders_and_seasons.sql` et
-- `20260914120000_achievements_profile_stats.sql`. Le bloc de vérification
-- ci-dessous s'arrête avec un message clair si ce n'est pas le cas, plutôt que
-- d'installer une fonction qui échouerait silencieusement à chaque partie.
-- ============================================================

do $$
begin
    if not exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'profiles' and column_name = 'ferveur_duel13'
    ) then
        raise exception 'Appliquez d''abord 20260912120000_ladders_and_seasons.sql (colonne ferveur_duel13 absente).';
    end if;

    if not exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'profiles' and column_name = 'ferveur_max'
    ) then
        raise exception 'Appliquez d''abord 20260914120000_achievements_profile_stats.sql (colonne ferveur_max absente).';
    end if;
end $$;

alter table public.profiles
    add column if not exists ferveur_earned int not null default 0;

-- Reprise de l'historique : tout ce qui a déjà été gagné est récupérable, chaque
-- partie classée ayant laissé son delta dans `match_history`. Sans ce report, le
-- compteur repartirait de zéro pour des joueurs qui jouent depuis des semaines.
update public.profiles p
   set ferveur_earned = coalesce(h.total, 0)
  from (
        select player_id, sum(greatest(ferveur_change, 0))::int as total
          from public.match_history
         group by player_id
       ) h
 where h.player_id = p.id;

-- ------------------------------------------------- Comptage à chaque victoire
--
-- Identique à la version précédente, à une ligne près : `ferveur_earned`. La
-- fonction est recopiée en entier parce que Postgres ne sait pas amender un
-- corps existant — d'où le soin pris à ne rien changer d'autre.
create or replace function public.apply_stats_update(
    p_user_id uuid,
    p_won boolean,
    p_ferveur_delta int,
    p_mode text default 'ranked'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_played int;
    v_delta  int := p_ferveur_delta;
begin
    select case p_mode
        when 'duel13'    then placement_duel13
        when 'duel_open' then placement_duel_open
        else                  placement_ranked
    end into v_played
    from public.profiles where id = p_user_id;

    if coalesce(v_played, 0) < public.placement_matches() then
        v_delta := v_delta * 2;
    end if;

    update public.profiles set
        ferveur = case when p_mode = 'ranked'
            then greatest(0, ferveur + v_delta) else ferveur end,
        ferveur_duel13 = case when p_mode = 'duel13'
            then greatest(0, ferveur_duel13 + v_delta) else ferveur_duel13 end,
        ferveur_duel_open = case when p_mode = 'duel_open'
            then greatest(0, ferveur_duel_open + v_delta) else ferveur_duel_open end,

        ferveur_max = case when p_mode = 'ranked'
            then greatest(ferveur_max, greatest(0, ferveur + v_delta)) else ferveur_max end,
        ferveur_max_duel13 = case when p_mode = 'duel13'
            then greatest(ferveur_max_duel13, greatest(0, ferveur_duel13 + v_delta)) else ferveur_max_duel13 end,
        ferveur_max_duel_open = case when p_mode = 'duel_open'
            then greatest(ferveur_max_duel_open, greatest(0, ferveur_duel_open + v_delta)) else ferveur_max_duel_open end,

        -- Total de ce qui a été GAGNÉ, tous classements confondus. Ne redescend
        -- jamais : une défaite n'y touche pas, une fin de saison non plus.
        ferveur_earned = ferveur_earned + greatest(0, v_delta),

        placement_ranked = placement_ranked
            + case when p_mode = 'ranked' and placement_ranked < public.placement_matches() then 1 else 0 end,
        placement_duel13 = placement_duel13
            + case when p_mode = 'duel13' and placement_duel13 < public.placement_matches() then 1 else 0 end,
        placement_duel_open = placement_duel_open
            + case when p_mode = 'duel_open' and placement_duel_open < public.placement_matches() then 1 else 0 end,

        stats = jsonb_build_object(
            'victories',    coalesce((stats->>'victories')::int, 0)    + case when p_won then 1 else 0 end,
            'defeats',      coalesce((stats->>'defeats')::int, 0)      + case when p_won then 0 else 1 end,
            'totalGames',   coalesce((stats->>'totalGames')::int, 0)   + 1,
            'currentStreak', case when p_won then coalesce((stats->>'currentStreak')::int, 0) + 1 else 0 end,
            'bestStreak',   greatest(
                coalesce((stats->>'bestStreak')::int, 0),
                case when p_won then coalesce((stats->>'currentStreak')::int, 0) + 1 else 0 end
            )
        )
    where id = p_user_id;
end;
$$;
