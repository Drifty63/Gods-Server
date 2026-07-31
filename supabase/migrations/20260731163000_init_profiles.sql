-- ============================================================
-- GODS: Player profiles schema (Supabase migration)
-- Replaces Firebase Auth + Firestore (src/services/firebase.ts).
-- ============================================================

-- ---------- profiles (one row per auth.users row, self-read/write only) ----------
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    username text not null,
    avatar text not null default '/avatars/default.png',
    level int not null default 1,
    xp int not null default 0,
    ambroisie int not null default 0 check (ambroisie >= 0),
    rank text not null default 'Novice',
    stats jsonb not null default '{"victories":0,"defeats":0,"totalGames":0,"currentStreak":0,"bestStreak":0}'::jsonb,
    favorite_god text,
    gods_owned text[] not null default '{}',
    spells_owned text[] not null default '{}',
    achievements text[] not null default '{}',
    needs_setup boolean not null default false,
    is_creator boolean not null default false,
    starter_pack text,
    daily_quests jsonb,
    god_play_counts jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    last_login_at timestamptz not null default now()
);

-- Case-insensitive uniqueness (replaces the old `usernames` Firestore collection).
create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));

-- ---------- saved_decks ----------
create table if not exists public.saved_decks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    slot_index int not null,
    name text not null,
    god_ids text[] not null default '{}',
    unique (user_id, slot_index)
);

-- ---------- handle_new_user trigger (replaces createDefaultProfile) ----------
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

    -- gods_owned starts empty: makes the existing /profile/setup starter-pack picker
    -- reachable (it requires 0 gods to proceed), fixing a bug where Firebase's
    -- createDefaultProfile seeded 3 fixed gods and the picker never fired.
    insert into public.profiles (id, email, username, avatar, gods_owned, needs_setup)
    values (new.id, new.email, v_username, v_avatar, '{}', (v_provider <> 'email'));

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();

-- ---------- is_username_taken RPC ----------
create or replace function public.is_username_taken(p_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (select 1 from public.profiles where lower(username) = lower(p_username));
$$;

grant execute on function public.is_username_taken(text) to anon, authenticated;

-- ---------- replace_saved_decks RPC ----------
-- security invoker: runs as the calling user, so saved_decks RLS applies normally.
-- Always writes to auth.uid()'s own rows regardless of what the payload claims.
create or replace function public.replace_saved_decks(p_decks jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
    delete from public.saved_decks where user_id = auth.uid();

    insert into public.saved_decks (user_id, slot_index, name, god_ids)
    select
        auth.uid(),
        (elem->>'slot_index')::int,
        elem->>'name',
        coalesce(array(select jsonb_array_elements_text(elem->'god_ids')), '{}')
    from jsonb_array_elements(p_decks) as elem;
end;
$$;

grant execute on function public.replace_saved_decks(jsonb) to authenticated;

-- ---------- purchase_coffret RPC (security definer: needs to write ambroisie/gods_owned) ----------
create or replace function public.purchase_coffret(
    p_uid uuid,
    p_gods_in_pack text[],
    p_price int
)
returns table (success boolean, message text, gods_added text[])
language plpgsql
security definer
set search_path = public
as $$
declare
    v_owned text[];
    v_ambroisie int;
    v_to_add text[];
begin
    select gods_owned, ambroisie into v_owned, v_ambroisie
        from public.profiles where id = p_uid for update;

    if not found then
        return query select false, 'Profil introuvable'::text, array[]::text[];
        return;
    end if;

    select array_agg(g) into v_to_add
        from unnest(p_gods_in_pack) as g
        where g <> all(v_owned);

    if v_to_add is null or array_length(v_to_add, 1) is null then
        return query select false, 'Vous possédez déjà tous les dieux de ce coffret'::text, array[]::text[];
        return;
    end if;

    if v_ambroisie < p_price then
        return query select false, 'Pas assez d''ambroisie'::text, array[]::text[];
        return;
    end if;

    update public.profiles
        set gods_owned = v_owned || v_to_add,
            ambroisie = v_ambroisie - p_price
        where id = p_uid;

    return query select true, format('Coffret acheté ! %s nouveaux dieux ajoutés.', array_length(v_to_add, 1)), v_to_add;
end;
$$;

-- Not granted to anon/authenticated: only Edge Functions using the service role call this.

-- ---------- claim_quest_reward / claim_all_quest_rewards RPCs ----------
create or replace function public.claim_quest_reward(p_uid uuid, p_quest_id text)
returns table (success boolean, reward int)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_quests jsonb;
    v_ambroisie int;
    v_quest jsonb;
    v_progress int;
    v_target int;
    v_claimed boolean;
    v_reward int;
    v_updated jsonb;
begin
    select daily_quests, ambroisie into v_quests, v_ambroisie
        from public.profiles where id = p_uid for update;

    if not found or v_quests is null then
        return query select false, 0;
        return;
    end if;

    select q into v_quest from jsonb_array_elements(v_quests->'quests') q where q->>'id' = p_quest_id;
    if v_quest is null then
        return query select false, 0;
        return;
    end if;

    v_progress := (v_quest->>'progress')::int;
    v_target := (v_quest->>'target')::int;
    v_claimed := (v_quest->>'claimed')::boolean;
    v_reward := (v_quest->>'reward')::int;

    if v_progress < v_target or v_claimed then
        return query select false, 0;
        return;
    end if;

    select jsonb_agg(
        case when q->>'id' = p_quest_id then jsonb_set(q, '{claimed}', 'true') else q end
    ) into v_updated
    from jsonb_array_elements(v_quests->'quests') q;

    update public.profiles
        set daily_quests = jsonb_set(v_quests, '{quests}', v_updated),
            ambroisie = v_ambroisie + v_reward
        where id = p_uid;

    return query select true, v_reward;
end;
$$;

create or replace function public.claim_all_quest_rewards(p_uid uuid)
returns table (success boolean, total_reward int)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_quests jsonb;
    v_ambroisie int;
    v_total int := 0;
    v_updated jsonb;
begin
    select daily_quests, ambroisie into v_quests, v_ambroisie
        from public.profiles where id = p_uid for update;

    if not found or v_quests is null then
        return query select false, 0;
        return;
    end if;

    select
        jsonb_agg(
            case
                when (q->>'progress')::int >= (q->>'target')::int and not (q->>'claimed')::boolean
                    then jsonb_set(q, '{claimed}', 'true')
                else q
            end
        ),
        coalesce(sum(
            case
                when (q->>'progress')::int >= (q->>'target')::int and not (q->>'claimed')::boolean
                    then (q->>'reward')::int
                else 0
            end
        ), 0)
    into v_updated, v_total
    from jsonb_array_elements(v_quests->'quests') q;

    if v_total = 0 then
        return query select false, 0;
        return;
    end if;

    update public.profiles
        set daily_quests = jsonb_set(v_quests, '{quests}', v_updated),
            ambroisie = v_ambroisie + v_total
        where id = p_uid;

    return query select true, v_total;
end;
$$;

-- Not granted to anon/authenticated: only Edge Functions using the service role call these.

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.saved_decks enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
    for select to authenticated using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
    for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Column-level grant: authenticated may only ever touch these 3 columns directly.
-- Every economy/business field (ambroisie, gods_owned, is_creator, stats, ...) has no
-- client grant at all -- only Edge Functions using the service role can write them.
revoke update on public.profiles from authenticated;
grant update (username, avatar, needs_setup) on public.profiles to authenticated;
-- No insert/delete policy for authenticated: rows are created by handle_new_user()
-- (security definer) and deleted via auth.users cascade only.

drop policy if exists saved_decks_select_own on public.saved_decks;
create policy saved_decks_select_own on public.saved_decks
    for select to authenticated using (auth.uid() = user_id);
drop policy if exists saved_decks_insert_own on public.saved_decks;
create policy saved_decks_insert_own on public.saved_decks
    for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists saved_decks_update_own on public.saved_decks;
create policy saved_decks_update_own on public.saved_decks
    for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists saved_decks_delete_own on public.saved_decks;
create policy saved_decks_delete_own on public.saved_decks
    for delete to authenticated using (auth.uid() = user_id);
