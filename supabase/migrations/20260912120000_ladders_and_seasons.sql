-- ============================================================
-- GODS — Lot 3 : trois classements séparés, placements, saisons
--
-- Aujourd'hui le Duel et les parties classées en ligne sont INDISCERNABLES en
-- base : même `is_ranked = true`, même colonne `ferveur`, même `match_history`.
-- Un joueur de Duel et un joueur de partie classée se retrouvent donc dans le
-- même tableau, ce qui n'a aucun sens puisqu'ils ne jouent pas au même jeu.
--
-- Deux notions distinctes, qu'il ne faut pas confondre :
--   • `is_ranked` dit si la partie COMPTE (une amicale ou une privée : non) ;
--   • `mode` dit dans QUEL classement elle compte.
-- Elles se composent : un Duel amical a mode='duel13' et is_ranked=false.
--
-- Le système de Ferveur existant est conservé tel quel — mêmes paliers Fer →
-- Dieux, même calcul de gain et de perte. On le duplique simplement par mode.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Le mode, porté de la file d'attente jusqu'à l'historique
-- ------------------------------------------------------------

alter table public.matchmaking_queue add column if not exists mode text not null default 'ranked';
alter table public.games             add column if not exists mode text not null default 'ranked';
alter table public.match_history     add column if not exists mode text not null default 'ranked';

comment on column public.games.mode is
    'Classement concerné : ranked | casual | duel13 | duel_open | private. Distinct de is_ranked, qui dit si la partie compte.';


-- ------------------------------------------------------------
-- 2. Un compteur de Ferveur et un compteur de placement par classement
-- ------------------------------------------------------------
-- `ferveur` reste celui des parties classées en ligne : aucune donnée existante
-- n'est déplacée ni perdue.

alter table public.profiles add column if not exists ferveur_duel13     int not null default 0;
alter table public.profiles add column if not exists ferveur_duel_open  int not null default 0;

-- Nombre de matchs joués dans le classement, plafonné à PLACEMENT_MATCHES.
-- En dessous, le joueur n'apparaît pas au tableau : un rang affiché après une
-- seule partie ne veut rien dire.
alter table public.profiles add column if not exists placement_ranked    int not null default 0;
alter table public.profiles add column if not exists placement_duel13    int not null default 0;
alter table public.profiles add column if not exists placement_duel_open int not null default 0;

create index if not exists profiles_ferveur_duel13_idx    on public.profiles (ferveur_duel13 desc);
create index if not exists profiles_ferveur_duel_open_idx on public.profiles (ferveur_duel_open desc);


-- ------------------------------------------------------------
-- 3. Saisons
-- ------------------------------------------------------------

create table if not exists public.seasons (
    id          int primary key generated always as identity,
    started_at  timestamptz not null default now(),
    ends_at     timestamptz not null,
    closed_at   timestamptz
);

-- Le classement figé d'une saison révolue : l'histoire de gloire passée.
create table if not exists public.season_results (
    season_id int  not null references public.seasons(id) on delete cascade,
    mode      text not null,
    user_id   uuid not null references public.profiles(id) on delete cascade,
    username  text not null,
    avatar    text not null default '',
    ferveur   int  not null,
    -- `position` est un mot-clé réservé de PostgreSQL : accepté dans un CREATE TABLE,
    -- mais refusé dans une liste RETURNS TABLE. On le nomme donc explicitement partout.
    rank_position int not null,
    primary key (season_id, mode, user_id)
);

create index if not exists season_results_lookup_idx on public.season_results (season_id, mode, rank_position);

alter table public.seasons        enable row level security;
alter table public.season_results enable row level security;

-- Lecture publique : un palmarès n'a d'intérêt que s'il se consulte.
drop policy if exists "seasons_select_all" on public.seasons;
create policy "seasons_select_all" on public.seasons for select using (true);

drop policy if exists "season_results_select_all" on public.season_results;
create policy "season_results_select_all" on public.season_results for select using (true);

grant select on public.seasons        to anon, authenticated;
grant select on public.season_results to anon, authenticated;

-- Saison 1, du mois courant, si aucune n'existe encore.
insert into public.seasons (started_at, ends_at)
select date_trunc('month', now()), date_trunc('month', now()) + interval '1 month'
where not exists (select 1 from public.seasons);


-- ------------------------------------------------------------
-- 4. Mise à jour du classement, par mode
-- ------------------------------------------------------------
-- L'ancienne fonction à trois arguments est SUPPRIMÉE plutôt que surchargée :
-- deux versions coexistantes rendraient tout appel à trois arguments ambigu.

drop function if exists public.apply_stats_update(uuid, boolean, int);

/** Nombre de matchs de placement avant d'apparaître au classement. */
create or replace function public.placement_matches()
returns int language sql immutable as $$ select 5; $$;

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


-- ------------------------------------------------------------
-- 5. Résultat de match : le bon classement, et l'historique daté du mode
-- ------------------------------------------------------------


/** Ferveur d'un joueur dans un classement donné. */
create or replace function public.ferveur_in_mode(p_uid uuid, p_mode text)
returns int
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(case p_mode
        when 'duel13'    then ferveur_duel13
        when 'duel_open' then ferveur_duel_open
        else                  ferveur
    end, 0)
    from public.profiles where id = p_uid;
$$;

create or replace function public.apply_match_result(p_game_id text, p_winner_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_game record;
    v_host_ferveur int;
    v_guest_ferveur int;
    v_host_delta int;
    v_guest_delta int;
    v_diff int;
    v_host_won boolean;
    v_mode text;
begin
    select host_user_id, guest_user_id, host_name, guest_name, is_ranked, mode
        into v_game
        from public.games
        where id = p_game_id
        for update;

    if not found then return; end if;

    if v_game.host_user_id is null or v_game.guest_user_id is null or not v_game.is_ranked then
        return;
    end if;

    -- Défense en profondeur : le vrai garde-fou anti-doublon est le guard sur games.status côté
    -- report-match-result (WHERE status <> 'finished'), mais on vérifie aussi ici.
    if exists (select 1 from public.match_history where game_id = p_game_id) then
        return;
    end if;

    v_mode := coalesce(v_game.mode, 'ranked');
    -- Une amicale ou une privée n'a pas de classement : `is_ranked` l'a déjà écartée plus haut.
    if v_mode not in ('ranked', 'duel13', 'duel_open') then
        return;
    end if;

    v_host_ferveur  := public.ferveur_in_mode(v_game.host_user_id,  v_mode);
    v_guest_ferveur := public.ferveur_in_mode(v_game.guest_user_id, v_mode);

    v_host_won := (p_winner_user_id = v_game.host_user_id);

    if v_host_won then
        v_diff := v_guest_ferveur - v_host_ferveur;
        v_host_delta := 25 + greatest(0, floor(v_diff / 100.0)::int * 5);
        v_diff := v_host_ferveur - v_guest_ferveur;
        v_guest_delta := -greatest(5, 20 - greatest(0, floor(v_diff / 100.0)::int * 3));
    else
        v_diff := v_host_ferveur - v_guest_ferveur;
        v_guest_delta := 25 + greatest(0, floor(v_diff / 100.0)::int * 5);
        v_diff := v_guest_ferveur - v_host_ferveur;
        v_host_delta := -greatest(5, 20 - greatest(0, floor(v_diff / 100.0)::int * 3));
    end if;

    perform public.apply_stats_update(v_game.host_user_id,  v_host_won,     v_host_delta,  v_mode);
    perform public.apply_stats_update(v_game.guest_user_id, not v_host_won, v_guest_delta, v_mode);

    insert into public.match_history (game_id, player_id, opponent_id, opponent_name, result, ferveur_change, mode)
    values
        (p_game_id, v_game.host_user_id, v_game.guest_user_id, v_game.guest_name,
            case when v_host_won then 'victory' else 'defeat' end, v_host_delta, v_mode),
        (p_game_id, v_game.guest_user_id, v_game.host_user_id, v_game.host_name,
            case when v_host_won then 'defeat' else 'victory' end, v_guest_delta, v_mode);
end;
$$;


-- ------------------------------------------------------------
-- 6. Appariement : on ne croise que les joueurs du MÊME mode
-- ------------------------------------------------------------
-- Sans quoi un joueur de Duel à budget illimité se retrouverait face à un
-- joueur de partie classée ordinaire, avec des équipes sans rapport.

create or replace function public.try_pair_matchmaking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    partner record;
    new_game_id text;
begin
    select id, player_name, user_id
        into partner
        from public.matchmaking_queue
        where ranked = new.ranked
          and coalesce(mode, 'ranked') = coalesce(new.mode, 'ranked')
          and matched_game_id is null
          and id <> new.id
        order by created_at
        limit 1
        for update skip locked;

    if partner.id is null then
        return new;
    end if;

    loop
        new_game_id := upper(substr(md5(random()::text), 1, 6));
        exit when not exists (select 1 from public.games where id = new_game_id);
    end loop;

    insert into public.games (id, status, is_private, is_ranked, mode, host_name, guest_name, host_user_id, guest_user_id)
    values (new_game_id, 'selecting', false, new.ranked, coalesce(new.mode, 'ranked'),
            partner.player_name, new.player_name, partner.user_id, new.user_id);

    insert into public.game_tokens (game_id, guest_token)
    values (new_game_id, gen_random_uuid());

    update public.matchmaking_queue set matched_game_id = new_game_id, is_host = true
        where id = partner.id;
    update public.matchmaking_queue set matched_game_id = new_game_id, is_host = false
        where id = new.id;

    return new;
end;
$$;


-- ------------------------------------------------------------
-- 7. Classement par mode, joueurs placés uniquement
-- ------------------------------------------------------------

drop function if exists public.get_leaderboard(int);

create or replace function public.get_leaderboard(p_limit int default 100, p_mode text default 'ranked')
returns table (id uuid, username text, avatar text, ferveur int, victories int, rank_position int)
language sql
security definer
set search_path = public
stable
as $$
    -- Alias volontairement distincts des colonnes de sortie : dans une fonction `language sql`,
    -- les noms déclarés par RETURNS TABLE deviennent des paramètres et peuvent entrer en conflit
    -- avec une colonne du même nom. On s'épargne toute ambiguïté plutôt que de parier dessus.
    with classed as (
        select
            p.id as uid,
            p.username as uname,
            p.avatar as uavatar,
            public.ferveur_in_mode(p.id, p_mode) as fv,
            coalesce((p.stats->>'victories')::int, 0) as wins,
            case p_mode
                when 'duel13'    then p.placement_duel13
                when 'duel_open' then p.placement_duel_open
                else                  p.placement_ranked
            end as played
        from public.profiles p
    )
    select uid, uname, uavatar, fv, wins,
           row_number() over (order by fv desc, uname asc)::int
    from classed
    -- Un joueur non placé n'apparaît pas : un rang affiché après une seule partie ne
    -- reflèterait rien, et fausserait le rang de tous les autres.
    where played >= public.placement_matches()
    order by fv desc, uname asc
    limit least(coalesce(p_limit, 100), 200);
$$;

grant execute on function public.get_leaderboard(int, text) to authenticated;
grant execute on function public.ferveur_in_mode(uuid, text) to authenticated;
grant execute on function public.placement_matches() to authenticated;


-- ------------------------------------------------------------
-- 8. Clôture de saison
-- ------------------------------------------------------------
-- Archive le classement des trois modes, remet les compteurs à zéro comme
-- demandé, et ouvre la saison suivante.

create or replace function public.close_season()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
    v_season record;
    v_mode text;
begin
    select * into v_season from public.seasons
     where closed_at is null order by id limit 1 for update;

    if not found or v_season.ends_at > now() then
        return 0;   -- rien à clore
    end if;

    foreach v_mode in array array['ranked', 'duel13', 'duel_open'] loop
        insert into public.season_results (season_id, mode, user_id, username, avatar, ferveur, rank_position)
        select v_season.id, v_mode, l.id, l.username, coalesce(l.avatar, ''), l.ferveur, l.rank_position
        from public.get_leaderboard(200, v_mode) l
        on conflict do nothing;
    end loop;

    update public.profiles set
        ferveur = 0, ferveur_duel13 = 0, ferveur_duel_open = 0,
        placement_ranked = 0, placement_duel13 = 0, placement_duel_open = 0;

    update public.seasons set closed_at = now() where id = v_season.id;

    insert into public.seasons (started_at, ends_at)
    values (v_season.ends_at, v_season.ends_at + interval '1 month');

    return v_season.id;
end;
$$;

-- Tous les jours à 3h : la fonction ne fait rien tant que la saison court, et
-- clôt d'elle-même le jour où elle expire. Plus robuste qu'un déclenchement
-- mensuel unique, qui ne rattraperait jamais une exécution manquée.
select cron.unschedule('gods-close-season') where exists (
    select 1 from cron.job where jobname = 'gods-close-season'
);
select cron.schedule('gods-close-season', '0 3 * * *', $$ select public.close_season(); $$);
