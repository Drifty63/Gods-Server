-- ============================================================================
-- Hauts faits, ferveur maximale et compteurs de dieux joués
--
-- Trois statistiques du profil mentaient ou restaient vides depuis l'origine :
--
--   * « Ferveur max » affichait la ferveur COURANTE — les deux chiffres côte à côte étaient
--     toujours identiques. Il manquait simplement une colonne où garder le sommet atteint, qui
--     a d'autant plus de sens depuis que les saisons remettent les classements à zéro.
--   * « Défis réalisés » était écrit en dur à 0 : la colonne `achievements` existait depuis la
--     toute première migration sans que rien ne l'écrive ni ne la lise.
--   * Le bloc « dieu le plus joué » ne s'affichait jamais : `god_play_counts` n'était jamais
--     incrémenté, alors que les équipes des deux joueurs sont dans `games`.
-- ============================================================================

-- ---------------------------------------------------------------- Ferveur maximale
-- Une colonne par classement, comme pour la ferveur courante : les trois tableaux sont
-- distincts, un sommet commun ne voudrait rien dire.
alter table public.profiles add column if not exists ferveur_max           int not null default 0;
alter table public.profiles add column if not exists ferveur_max_duel13    int not null default 0;
alter table public.profiles add column if not exists ferveur_max_duel_open int not null default 0;

-- Amorçage : pour les profils existants, le sommet connu est au moins la ferveur actuelle.
update public.profiles set
    ferveur_max           = greatest(ferveur_max,           ferveur),
    ferveur_max_duel13    = greatest(ferveur_max_duel13,    ferveur_duel13),
    ferveur_max_duel_open = greatest(ferveur_max_duel_open, ferveur_duel_open);

-- ---------------------------------------------------------------- Suivi du sommet
-- `apply_stats_update` est le SEUL endroit où la ferveur bouge : y ajouter le suivi du sommet
-- garantit qu'aucun chemin ne peut l'oublier. Le reste de la fonction est inchangé.
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
    -- Matchs déjà joués dans CE classement.
    select case p_mode
        when 'duel13'    then placement_duel13
        when 'duel_open' then placement_duel_open
        else                  placement_ranked
    end into v_played
    from public.profiles where id = p_user_id;

    -- Pendant les placements, les gains ET les pertes comptent double : cinq matchs
    -- suffisent alors à situer un joueur près de son vrai niveau, au lieu de le faire
    -- grimper vingt parties durant depuis le bas du tableau.
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

        -- Sommet historique. Survit à la clôture d'une saison, qui remet la ferveur à zéro.
        ferveur_max = case when p_mode = 'ranked'
            then greatest(ferveur_max, greatest(0, ferveur + v_delta)) else ferveur_max end,
        ferveur_max_duel13 = case when p_mode = 'duel13'
            then greatest(ferveur_max_duel13, greatest(0, ferveur_duel13 + v_delta)) else ferveur_max_duel13 end,
        ferveur_max_duel_open = case when p_mode = 'duel_open'
            then greatest(ferveur_max_duel_open, greatest(0, ferveur_duel_open + v_delta)) else ferveur_max_duel_open end,

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

-- ------------------------------------------------------- Compteurs de dieux joués
-- Appelé par `report-match-result` pour les DEUX joueurs, à partir des équipes enregistrées
-- dans `games` — et non de ce qu'envoie le client, qui ne connaît que sa propre équipe.
create or replace function public.bump_god_play_counts(p_user_id uuid, p_god_ids text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id text;
begin
    if p_user_id is null or p_god_ids is null or array_length(p_god_ids, 1) is null then
        return;
    end if;

    -- `distinct` : un dieu compte une fois par partie, pas une fois par occurrence dans
    -- l'équipe. Les trois soldats d'Arès ne doivent pas valoir trois parties.
    for v_id in select distinct unnest(p_god_ids) loop
        update public.profiles
        set god_play_counts = jsonb_set(
                god_play_counts,
                array[v_id],
                to_jsonb(coalesce((god_play_counts->>v_id)::int, 0) + 1),
                true
            )
        where id = p_user_id;
    end loop;
end;
$$;

-- ------------------------------------------------------------------- Hauts faits
-- Enregistre des hauts faits pour le joueur AUTHENTIFIÉ, jamais pour un autre : l'identité
-- vient de `auth.uid()`, pas d'un paramètre. Renvoie ceux réellement ajoutés, pour que le
-- client ne notifie que les nouveautés.
--
-- Le contrôle du mérite reste côté client : le combat y est calculé dans tous les modes, il n'y
-- a donc rien à revérifier ici que le serveur saurait mieux. Un haut fait n'ouvre aucun droit et
-- ne crédite aucune monnaie — c'est ce qui rend ce compromis acceptable, contrairement à
-- l'ambroisie, qui passe elle par `grant_unique_reward`.
create or replace function public.unlock_achievements(p_ids text[])
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid  uuid := auth.uid();
    v_new  text[];
begin
    if v_uid is null or p_ids is null or array_length(p_ids, 1) is null then
        return '{}'::text[];
    end if;

    select coalesce(array_agg(distinct id), '{}'::text[])
        into v_new
        from unnest(p_ids) as id
        where id not in (select unnest(achievements) from public.profiles where profiles.id = v_uid);

    if array_length(v_new, 1) is null then
        return '{}'::text[];
    end if;

    update public.profiles
    set achievements = (
        select array_agg(distinct a) from unnest(achievements || v_new) as a
    )
    where id = v_uid;

    return v_new;
end;
$$;

revoke all on function public.bump_god_play_counts(uuid, text[]) from public, anon, authenticated;
grant execute on function public.unlock_achievements(text[]) to authenticated;
