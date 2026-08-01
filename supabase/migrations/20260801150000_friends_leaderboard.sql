-- ============================================================
-- GODS: Real Ferveur ranking + friend system
-- Replaces the mock userFerveur/MOCK_FRIENDS/MOCK_LEADERBOARD data in
-- src/app/social/page.tsx and src/app/profile/page.tsx.
-- ============================================================

-- ---------- profiles: ferveur + last_active_at ----------
alter table public.profiles add column if not exists ferveur int not null default 0 check (ferveur >= 0);
alter table public.profiles add column if not exists last_active_at timestamptz not null default now();

create index if not exists profiles_ferveur_idx on public.profiles (ferveur desc);

-- last_active_at is a self-only, low-stakes presence heartbeat (same idea as
-- matchmaking_queue.last_seen) -- safe to add to the client-writable column set.
revoke update on public.profiles from authenticated;
grant update (username, avatar, needs_setup, last_active_at) on public.profiles to authenticated;

-- ---------- games: attribute matches to real accounts ----------
-- host_name/guest_name are freeform display-name text with no FK (this table predates the
-- Auth/profiles migration) -- these columns let match results be attributed to real accounts.
alter table public.games add column if not exists host_user_id uuid references public.profiles(id) on delete set null;
alter table public.games add column if not exists guest_user_id uuid references public.profiles(id) on delete set null;

create index if not exists games_host_user_idx on public.games (host_user_id) where host_user_id is not null;
create index if not exists games_guest_user_idx on public.games (guest_user_id) where guest_user_id is not null;

-- ---------- matchmaking_queue: track which real account queued ----------
alter table public.matchmaking_queue add column if not exists user_id uuid references public.profiles(id) on delete cascade;

-- ---------- try_pair_matchmaking(): copy user ids into the games row it creates ----------
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

    insert into public.games (id, status, is_private, is_ranked, host_name, guest_name, host_user_id, guest_user_id)
    values (new_game_id, 'selecting', false, new.ranked, partner.player_name, new.player_name, partner.user_id, new.user_id);

    insert into public.game_tokens (game_id, guest_token)
    values (new_game_id, gen_random_uuid());

    update public.matchmaking_queue set matched_game_id = new_game_id, is_host = true
        where id = partner.id;
    update public.matchmaking_queue set matched_game_id = new_game_id, is_host = false
        where id = new.id;

    return new;
end;
$$;

-- ---------- friendships ----------
create table if not exists public.friendships (
    id uuid primary key default gen_random_uuid(),
    requester_id uuid not null references public.profiles(id) on delete cascade,
    addressee_id uuid not null references public.profiles(id) on delete cascade,
    status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
    blocked_by uuid references public.profiles(id) on delete set null,
    requester_favorite boolean not null default false,
    addressee_favorite boolean not null default false,
    created_at timestamptz not null default now(),
    responded_at timestamptz,
    constraint friendships_no_self check (requester_id <> addressee_id)
);

-- Un seul lien possible entre deux comptes, quelle que soit la direction.
create unique index if not exists friendships_unique_pair_idx
    on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create index if not exists friendships_pending_addressee_idx
    on public.friendships (addressee_id) where status = 'pending';

alter table public.friendships enable row level security;
-- Zéro policy pour anon/authenticated (comme game_tokens) : la relation d'amitié a de vraies
-- règles métier (acceptation mutuelle automatique, blocage) qu'un client ne doit pas pouvoir
-- contourner en écrivant directement la table -- tout passe par les fonctions ci-dessous.

-- ---------- match_history ----------
create table if not exists public.match_history (
    id uuid primary key default gen_random_uuid(),
    game_id text references public.games(id) on delete set null,
    player_id uuid not null references public.profiles(id) on delete cascade,
    opponent_id uuid references public.profiles(id) on delete set null,
    opponent_name text not null,
    result text not null check (result in ('victory', 'defeat')),
    ferveur_change int not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists match_history_player_idx on public.match_history (player_id, created_at desc);

alter table public.match_history enable row level security;

drop policy if exists match_history_select_own on public.match_history;
create policy match_history_select_own on public.match_history
    for select to authenticated using (player_id = auth.uid());
-- Pas de policy insert/update/delete : seule apply_match_result() (security definer) écrit ici.

-- ---------- apply_stats_update(): helper interne, un joueur à la fois ----------
create or replace function public.apply_stats_update(p_user_id uuid, p_won boolean, p_ferveur_delta int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_stats jsonb;
    v_total int;
    v_victories int;
    v_defeats int;
    v_streak int;
    v_best int;
begin
    select stats into v_stats from public.profiles where id = p_user_id for update;

    v_total := coalesce((v_stats->>'totalGames')::int, 0) + 1;
    v_victories := coalesce((v_stats->>'victories')::int, 0) + case when p_won then 1 else 0 end;
    v_defeats := coalesce((v_stats->>'defeats')::int, 0) + case when p_won then 0 else 1 end;
    v_streak := case when p_won then coalesce((v_stats->>'currentStreak')::int, 0) + 1 else 0 end;
    v_best := greatest(coalesce((v_stats->>'bestStreak')::int, 0), v_streak);

    update public.profiles set
        ferveur = greatest(0, ferveur + p_ferveur_delta),
        stats = jsonb_build_object(
            'totalGames', v_total,
            'victories', v_victories,
            'defeats', v_defeats,
            'currentStreak', v_streak,
            'bestStreak', v_best
        )
        where id = p_user_id;
end;
$$;

-- ---------- apply_match_result(): cœur du système, appelé par l'Edge Function report-match-result ----------
-- Même formule que calculateFerveurChange() (src/data/ranks.ts) : gain de base 25 + bonus de
-- 5 par tranche de 100 de Ferveur d'écart si l'adversaire était plus fort ; perte de base 20
-- (plancher 5), réduite de 3 par tranche de 100 si l'adversaire était plus fort.
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
begin
    select host_user_id, guest_user_id, host_name, guest_name, is_ranked
        into v_game
        from public.games
        where id = p_game_id
        for update;

    if not found then
        return;
    end if;

    if v_game.host_user_id is null or v_game.guest_user_id is null or not v_game.is_ranked then
        return;
    end if;

    -- Défense en profondeur : le vrai garde-fou anti-doublon est le guard sur games.status côté
    -- report-match-result (WHERE status <> 'finished'), mais on vérifie aussi ici.
    if exists (select 1 from public.match_history where game_id = p_game_id) then
        return;
    end if;

    select ferveur into v_host_ferveur from public.profiles where id = v_game.host_user_id;
    select ferveur into v_guest_ferveur from public.profiles where id = v_game.guest_user_id;

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

    perform public.apply_stats_update(v_game.host_user_id, v_host_won, v_host_delta);
    perform public.apply_stats_update(v_game.guest_user_id, not v_host_won, v_guest_delta);

    insert into public.match_history (game_id, player_id, opponent_id, opponent_name, result, ferveur_change)
    values
        (p_game_id, v_game.host_user_id, v_game.guest_user_id, v_game.guest_name,
            case when v_host_won then 'victory' else 'defeat' end, v_host_delta),
        (p_game_id, v_game.guest_user_id, v_game.host_user_id, v_game.host_name,
            case when v_host_won then 'defeat' else 'victory' end, v_guest_delta);
end;
$$;

-- ---------- Lecture publique (fonctions security definer, profiles reste privé sinon) ----------

create or replace function public.get_leaderboard(p_limit int default 100)
returns table (id uuid, username text, avatar text, ferveur int, victories int)
language sql
security definer
set search_path = public
stable
as $$
    select id, username, avatar, ferveur, coalesce((stats->>'victories')::int, 0)
    from public.profiles
    order by ferveur desc, username asc
    limit least(coalesce(p_limit, 100), 200);
$$;

grant execute on function public.get_leaderboard(int) to authenticated;

create or replace function public.get_friends_list()
returns table (
    friendship_id uuid,
    id uuid,
    username text,
    avatar text,
    ferveur int,
    is_favorite boolean,
    online boolean,
    in_game boolean
)
language sql
security definer
set search_path = public
stable
as $$
    select
        f.id,
        p.id,
        p.username,
        p.avatar,
        p.ferveur,
        case when f.requester_id = auth.uid() then f.requester_favorite else f.addressee_favorite end,
        p.last_active_at > now() - interval '2 minutes',
        exists (
            select 1 from public.games g
            where (g.host_user_id = p.id or g.guest_user_id = p.id)
              and g.status in ('selecting', 'rps', 'rps_deciding', 'playing')
        )
    from public.friendships f
    join public.profiles p on p.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
    where f.status = 'accepted'
      and (f.requester_id = auth.uid() or f.addressee_id = auth.uid());
$$;

grant execute on function public.get_friends_list() to authenticated;

create or replace function public.get_pending_requests()
returns table (friendship_id uuid, id uuid, username text, avatar text, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
    select f.id, p.id, p.username, p.avatar, f.created_at
    from public.friendships f
    join public.profiles p on p.id = f.requester_id
    where f.addressee_id = auth.uid() and f.status = 'pending'
    order by f.created_at desc;
$$;

grant execute on function public.get_pending_requests() to authenticated;

create or replace function public.search_users(p_query text)
returns table (id uuid, username text, avatar text, ferveur int, relationship text)
language sql
security definer
set search_path = public
stable
as $$
    select
        p.id, p.username, p.avatar, p.ferveur,
        coalesce(f.status, 'none')
    from public.profiles p
    left join public.friendships f
        on (f.requester_id = auth.uid() and f.addressee_id = p.id)
        or (f.addressee_id = auth.uid() and f.requester_id = p.id)
    where length(trim(coalesce(p_query, ''))) >= 2
      and p.username ilike '%' || p_query || '%'
      and p.id <> auth.uid()
    order by p.username asc
    limit 20;
$$;

grant execute on function public.search_users(text) to authenticated;

create or replace function public.get_public_profile(p_user_id uuid)
returns table (id uuid, username text, avatar text, ferveur int, level int, stats jsonb)
language sql
security definer
set search_path = public
stable
as $$
    select id, username, avatar, ferveur, level, stats
    from public.profiles
    where id = p_user_id;
$$;

grant execute on function public.get_public_profile(uuid) to authenticated;

-- ---------- Écriture (fonctions security definer, valident auth.uid() en interne) ----------

create or replace function public.send_friend_request(p_username text)
returns table (success boolean, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_target_id uuid;
    v_existing record;
begin
    select id into v_target_id from public.profiles where lower(username) = lower(p_username);
    if v_target_id is null then
        return query select false, 'Utilisateur introuvable';
        return;
    end if;
    if v_target_id = auth.uid() then
        return query select false, 'Vous ne pouvez pas vous ajouter vous-même';
        return;
    end if;

    select * into v_existing from public.friendships
        where least(requester_id, addressee_id) = least(auth.uid(), v_target_id)
          and greatest(requester_id, addressee_id) = greatest(auth.uid(), v_target_id);

    if not found then
        insert into public.friendships (requester_id, addressee_id, status)
            values (auth.uid(), v_target_id, 'pending');
        return query select true, 'Demande envoyée';
        return;
    end if;

    if v_existing.status = 'blocked' then
        return query select false, 'Impossible d''envoyer une demande à cet utilisateur';
        return;
    end if;

    if v_existing.status = 'accepted' then
        return query select true, 'Vous êtes déjà amis';
        return;
    end if;

    if v_existing.requester_id = auth.uid() then
        return query select true, 'Demande déjà envoyée';
        return;
    end if;

    -- L'autre m'a déjà envoyé une demande -> acceptation mutuelle immédiate.
    update public.friendships set status = 'accepted', responded_at = now() where id = v_existing.id;
    return query select true, 'Vous êtes maintenant amis !';
end;
$$;

grant execute on function public.send_friend_request(text) to authenticated;

create or replace function public.respond_friend_request(p_friendship_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if p_accept then
        update public.friendships set status = 'accepted', responded_at = now()
            where id = p_friendship_id and addressee_id = auth.uid() and status = 'pending';
    else
        delete from public.friendships
            where id = p_friendship_id and addressee_id = auth.uid() and status = 'pending';
    end if;
end;
$$;

grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;

create or replace function public.remove_friendship(p_friendship_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    delete from public.friendships
        where id = p_friendship_id
          and (requester_id = auth.uid() or addressee_id = auth.uid());
end;
$$;

grant execute on function public.remove_friendship(uuid) to authenticated;

create or replace function public.block_user(p_friendship_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.friendships set status = 'blocked', blocked_by = auth.uid()
        where id = p_friendship_id
          and (requester_id = auth.uid() or addressee_id = auth.uid());
end;
$$;

grant execute on function public.block_user(uuid) to authenticated;

create or replace function public.toggle_favorite_friend(p_friendship_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.friendships set requester_favorite = not requester_favorite
        where id = p_friendship_id and requester_id = auth.uid() and status = 'accepted';
    update public.friendships set addressee_favorite = not addressee_favorite
        where id = p_friendship_id and addressee_id = auth.uid() and status = 'accepted';
end;
$$;

grant execute on function public.toggle_favorite_friend(uuid) to authenticated;
