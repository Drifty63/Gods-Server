-- ============================================================
-- GODS: "Play this specific god" daily quest
--
-- Adds a 7th quest candidate to the daily roll: a per-player, dynamically-generated quest
-- that picks one of the player's OWNED gods at random and asks them to cast a spell with
-- that god 3 times in a match. Reuses the same match-finish event as every other quest --
-- GameEngine.playCard() now tracks godsCastThisMatch per player, each client sends its own
-- array when reporting a natural match finish, and progress bumps by matching quest.godId
-- against that array.
--
-- Known limitation (accepted, see report-match-result/index.ts): because of the existing
-- anti-double-report guard, only the first client to report a finished match has its
-- godsUsed actually read -- the other player's general play/win quests still advance
-- normally, but their god-specific quest doesn't credit that particular match. Forfeits
-- (leave-game) never carry godsUsed at all, for the same reason leave-game already can't see
-- the remaining player's live match data.
-- ============================================================

-- ---------- daily_quest_pool(): unchanged static candidates ----------
-- (already exists from the previous migration, kept as-is)

-- ---------- roll_daily_quests(p_uid): shared reset logic, used by both callers below ----------
create or replace function public.roll_daily_quests(p_uid uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_owned_gods text[];
    v_random_god text;
    v_candidates jsonb;
    v_picked jsonb;
begin
    select gods_owned into v_owned_gods from public.profiles where id = p_uid;
    v_candidates := public.daily_quest_pool();

    if v_owned_gods is not null and array_length(v_owned_gods, 1) > 0 then
        v_random_god := v_owned_gods[1 + floor(random() * array_length(v_owned_gods, 1))::int];
        v_candidates := v_candidates || jsonb_build_array(
            jsonb_build_object(
                'id', 'usegod_' || v_random_god,
                'name', 'Défi du jour',
                'description', 'Jouez ce dieu 3 fois dans une partie',
                'target', 3,
                'reward', 120,
                'godId', v_random_god
            )
        );
    end if;

    select jsonb_agg(elem || jsonb_build_object('progress', 0, 'claimed', false))
    into v_picked
    from (
        select elem from jsonb_array_elements(v_candidates) elem
        order by random()
        limit 3
    ) sub;

    return v_picked;
end;
$$;

create or replace function public.get_daily_quests()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_quests jsonb;
    v_today text := to_char(now(), 'YYYY-MM-DD');
    v_fresh jsonb;
begin
    select daily_quests into v_quests from public.profiles where id = auth.uid() for update;

    if v_quests is null or (v_quests->>'lastResetDate') is distinct from v_today then
        v_fresh := jsonb_build_object('lastResetDate', v_today, 'quests', public.roll_daily_quests(auth.uid()));
        update public.profiles set daily_quests = v_fresh where id = auth.uid();
        return v_fresh;
    end if;

    return v_quests;
end;
$$;

create or replace function public.bump_daily_quest_progress(p_user_id uuid, p_won boolean, p_gods_used text[] default '{}')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_quests jsonb;
    v_today text := to_char(now(), 'YYYY-MM-DD');
    v_updated jsonb;
begin
    select daily_quests into v_quests from public.profiles where id = p_user_id for update;

    if v_quests is null or (v_quests->>'lastResetDate') is distinct from v_today then
        v_quests := jsonb_build_object('lastResetDate', v_today, 'quests', public.roll_daily_quests(p_user_id));
    end if;

    select jsonb_agg(
        case
            when q->>'id' like 'play_%' then
                jsonb_set(q, '{progress}', to_jsonb(least((q->>'target')::int, (q->>'progress')::int + 1)))
            when q->>'id' like 'win_%' and p_won then
                jsonb_set(q, '{progress}', to_jsonb(least((q->>'target')::int, (q->>'progress')::int + 1)))
            when q->>'id' like 'usegod_%' and (q->>'godId') = any(p_gods_used) then
                jsonb_set(q, '{progress}', to_jsonb(least((q->>'target')::int, (q->>'progress')::int + 1)))
            else q
        end
    ) into v_updated
    from jsonb_array_elements(v_quests->'quests') q;

    update public.profiles set daily_quests = jsonb_set(v_quests, '{quests}', v_updated) where id = p_user_id;
end;
$$;
