-- ============================================================
-- GODS: Online multiplayer schema (Supabase migration)
-- Replaces the Socket.io-based server-online.js real-time layer.
-- ============================================================

-- ---------- games (public-readable, subscribed to via Realtime) ----------
create table if not exists public.games (
    id text primary key,
    status text not null default 'waiting'
        check (status in ('waiting', 'selecting', 'rps', 'rps_deciding', 'playing', 'finished')),
    is_private boolean not null default true,
    is_ranked boolean not null default false,
    host_name text not null,
    guest_name text,
    host_gods jsonb,
    guest_gods jsonb,
    rps_host_chosen boolean not null default false,
    rps_guest_chosen boolean not null default false,
    rps_result jsonb,
    rps_winner text check (rps_winner in ('host', 'guest')),
    first_player text check (first_player in ('host', 'guest')),
    game_state jsonb,
    winner_id text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    finished_at timestamptz
);

create index if not exists games_status_idx on public.games (status);
create index if not exists games_updated_at_idx on public.games (updated_at);

-- ---------- game_tokens (sensitive: write-authorization + pending RPS choices) ----------
-- RLS default-deny for anon/authenticated: only Edge Functions (service role) touch this.
create table if not exists public.game_tokens (
    game_id text primary key references public.games(id) on delete cascade,
    host_token uuid not null default gen_random_uuid(),
    guest_token uuid,
    rps_host_choice text check (rps_host_choice in ('rock', 'paper', 'scissors')),
    rps_guest_choice text check (rps_guest_choice in ('rock', 'paper', 'scissors'))
);

-- ---------- matchmaking_queue ----------
create table if not exists public.matchmaking_queue (
    id uuid primary key default gen_random_uuid(),
    player_name text not null,
    rating int not null default 1000,
    ranked boolean not null default true,
    matched_game_id text references public.games(id) on delete set null,
    -- Set by the pairing trigger: which side of the resulting game this queue entry became.
    -- Needed so each matched client can claim the right token afterwards.
    is_host boolean,
    created_at timestamptz not null default now(),
    last_seen timestamptz not null default now()
);

create index if not exists matchmaking_queue_pairing_idx
    on public.matchmaking_queue (ranked, created_at)
    where matched_game_id is null;

-- ---------- updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists games_set_updated_at on public.games;
create trigger games_set_updated_at
    before update on public.games
    for each row
    execute function public.set_updated_at();

-- ---------- matchmaking pairing trigger ----------
-- Fires after every insert into matchmaking_queue; if another unmatched same-mode entry
-- exists, atomically creates the game + token row and marks both queue entries matched.
-- FOR UPDATE SKIP LOCKED makes this safe under concurrent inserts.
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
    select id, player_name
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

    insert into public.games (id, status, is_private, is_ranked, host_name, guest_name)
    values (new_game_id, 'selecting', false, new.ranked, partner.player_name, new.player_name);

    insert into public.game_tokens (game_id, guest_token)
    values (new_game_id, gen_random_uuid());

    update public.matchmaking_queue set matched_game_id = new_game_id, is_host = true
        where id = partner.id;
    update public.matchmaking_queue set matched_game_id = new_game_id, is_host = false
        where id = new.id;

    return new;
end;
$$;

drop trigger if exists matchmaking_queue_pair on public.matchmaking_queue;
create trigger matchmaking_queue_pair
    after insert on public.matchmaking_queue
    for each row
    execute function public.try_pair_matchmaking();

-- ---------- RLS ----------
alter table public.games enable row level security;
alter table public.game_tokens enable row level security;
alter table public.matchmaking_queue enable row level security;

drop policy if exists games_select_all on public.games;
create policy games_select_all on public.games
    for select to anon, authenticated using (true);
-- No insert/update/delete policy for anon/authenticated: every write goes through an
-- Edge Function using the service role, which bypasses RLS by design.

-- game_tokens: zero policies for anon/authenticated -> default-deny for both.

drop policy if exists queue_select_all on public.matchmaking_queue;
create policy queue_select_all on public.matchmaking_queue
    for select to anon, authenticated using (true);
drop policy if exists queue_insert_all on public.matchmaking_queue;
create policy queue_insert_all on public.matchmaking_queue
    for insert to anon, authenticated with check (true);
drop policy if exists queue_update_all on public.matchmaking_queue;
create policy queue_update_all on public.matchmaking_queue
    for update to anon, authenticated using (true);
drop policy if exists queue_delete_all on public.matchmaking_queue;
create policy queue_delete_all on public.matchmaking_queue
    for delete to anon, authenticated using (true);

-- ---------- Realtime ----------
alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.matchmaking_queue;

-- ---------- Cleanup (pg_cron) ----------
create extension if not exists pg_cron with schema extensions;

create or replace function public.cleanup_stale_multiplayer_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    delete from public.matchmaking_queue
        where matched_game_id is null
          and last_seen < now() - interval '45 seconds';

    delete from public.games
        where status not in ('playing', 'finished')
          and created_at < now() - interval '30 minutes';

    delete from public.games
        where status = 'playing'
          and updated_at < now() - interval '30 minutes';

    delete from public.games
        where status = 'finished'
          and finished_at < now() - interval '1 hour';
end;
$$;

select cron.schedule(
    'gods-multiplayer-cleanup',
    '*/2 * * * *',
    $$select public.cleanup_stale_multiplayer_data();$$
);
