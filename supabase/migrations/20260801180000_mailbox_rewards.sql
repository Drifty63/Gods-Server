-- ============================================================
-- GODS: Real mailbox/rewards system (replaces MOCK_REWARDS in GlobalUI.tsx)
--
-- Adds a per-user reward inbox: a one-time "1000 ambroisie" welcome gift for
-- the first 1000 players (backfilled for existing accounts, auto-granted to
-- new signups until the cap is reached), plus broadcast_mailbox_reward() for
-- occasional gifts the developer sends manually via the SQL editor/service
-- role -- no admin UI exists yet, so this is intentionally not exposed to
-- authenticated clients.
-- ============================================================

create table if not exists public.mailbox_rewards (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    title text not null,
    description text not null,
    ambroisie_reward int not null default 0 check (ambroisie_reward >= 0),
    claimed boolean not null default false,
    created_at timestamptz not null default now(),
    claimed_at timestamptz
);

create index if not exists mailbox_rewards_user_idx on public.mailbox_rewards (user_id, claimed, created_at desc);

alter table public.mailbox_rewards enable row level security;

-- Fully server-mediated like match_history/friendships: clients only ever read
-- their own rows directly; every write (claim, grant, broadcast) goes through
-- a security-definer RPC below.
create policy "mailbox_rewards_select_own" on public.mailbox_rewards
    for select using (auth.uid() = user_id);

-- ---------- claim_mailbox_reward RPC ----------
create or replace function public.claim_mailbox_reward(p_reward_id uuid)
returns table(success boolean, message text, ambroisie_reward int)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid uuid := auth.uid();
    v_reward record;
begin
    select * into v_reward from public.mailbox_rewards
    where id = p_reward_id and user_id = v_uid
    for update;

    if not found then
        return query select false, 'Récompense introuvable'::text, 0;
        return;
    end if;

    if v_reward.claimed then
        return query select false, 'Déjà récupérée'::text, 0;
        return;
    end if;

    update public.mailbox_rewards set claimed = true, claimed_at = now() where id = p_reward_id;
    update public.profiles set ambroisie = ambroisie + v_reward.ambroisie_reward where id = v_uid;

    return query select true, 'OK'::text, v_reward.ambroisie_reward;
end;
$$;

grant execute on function public.claim_mailbox_reward(uuid) to authenticated;

-- ---------- claim_all_mailbox_rewards RPC ----------
create or replace function public.claim_all_mailbox_rewards()
returns table(success boolean, total_ambroisie int)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid uuid := auth.uid();
    v_total int;
begin
    select coalesce(sum(ambroisie_reward), 0) into v_total
    from public.mailbox_rewards where user_id = v_uid and claimed = false;

    update public.mailbox_rewards set claimed = true, claimed_at = now()
    where user_id = v_uid and claimed = false;

    if v_total > 0 then
        update public.profiles set ambroisie = ambroisie + v_total where id = v_uid;
    end if;

    return query select true, v_total;
end;
$$;

grant execute on function public.claim_all_mailbox_rewards() to authenticated;

-- ---------- broadcast_mailbox_reward RPC (service-role only, no client grant) ----------
-- Run manually from the SQL editor whenever the dev wants to send an occasional
-- gift to every player, e.g.:
--   select public.broadcast_mailbox_reward('Cadeau de la semaine', 'Merci de jouer a GODS !', 200);
create or replace function public.broadcast_mailbox_reward(p_title text, p_description text, p_ambroisie int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
    v_count int;
begin
    insert into public.mailbox_rewards (user_id, title, description, ambroisie_reward)
    select id, p_title, p_description, p_ambroisie from public.profiles;
    get diagnostics v_count = row_count;
    return v_count;
end;
$$;

-- ---------- 1000-premiers-joueurs welcome gift ----------

-- Backfill: grant retroactively to whichever existing accounts fall within the
-- first 1000 by signup order (today's real userbase is a handful of accounts,
-- so in practice this covers everyone registered so far).
insert into public.mailbox_rewards (user_id, title, description, ambroisie_reward)
select id, 'Bienvenue !', 'Cadeau de lancement offert aux 1000 premiers joueurs de GODS.', 1000
from (
    select id from public.profiles order by created_at asc limit 1000
) first_players
where not exists (
    select 1 from public.mailbox_rewards mr
    where mr.user_id = first_players.id and mr.title = 'Bienvenue !'
);

-- Extend handle_new_user() so every future signup gets the same gift until the
-- 1000-player cap is reached (count includes the row just inserted above it).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_provider text;
    v_base text;
    v_username text;
    v_avatar text;
    v_counter int := 1;
begin
    v_provider := coalesce(new.raw_app_meta_data->>'provider', 'email');

    if v_provider = 'email' then
        v_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
        v_avatar := '/avatars/default.png';
    else
        v_base := coalesce(
            nullif(new.raw_user_meta_data->>'full_name', ''),
            nullif(new.raw_user_meta_data->>'name', ''),
            nullif(split_part(new.email, '@', 1), ''),
            'Joueur'
        );
        v_username := v_base;
        while exists (select 1 from public.profiles where lower(username) = lower(v_username)) loop
            v_counter := v_counter + 1;
            v_username := v_base || v_counter::text;
        end loop;
        v_avatar := coalesce(
            nullif(new.raw_user_meta_data->>'avatar_url', ''),
            nullif(new.raw_user_meta_data->>'picture', ''),
            '/avatars/default.png'
        );
    end if;

    insert into public.profiles (id, email, username, avatar, gods_owned, needs_setup)
    values (new.id, new.email, v_username, v_avatar, '{}', (v_provider <> 'email'));

    if (select count(*) from public.profiles) <= 1000 then
        insert into public.mailbox_rewards (user_id, title, description, ambroisie_reward)
        values (new.id, 'Bienvenue !', 'Cadeau de lancement offert aux 1000 premiers joueurs de GODS.', 1000);
    end if;

    return new;
end;
$$;
