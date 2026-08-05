-- ============================================================
-- GODS: Daily quest rotation -- variety instead of the same 3 quests forever
--
-- get_daily_quests()/bump_daily_quest_progress() always generated the exact same 3 quests
-- (play_1, play_3, win_3) on every reset. This replaces that fixed set with a pool of 6
-- quest templates, 3 of which are picked at random each day. All 6 still trigger on the
-- same event as before (a match finishing, via report-match-result/leave-game) -- no new
-- client/Edge Function plumbing needed. Quest ids now follow a play_N / win_N convention so
-- the progress-bump logic can match by prefix instead of a hardcoded id list.
-- ============================================================

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
    v_picked jsonb;
begin
    select daily_quests into v_quests from public.profiles where id = auth.uid() for update;

    if v_quests is null or (v_quests->>'lastResetDate') is distinct from v_today then
        select jsonb_agg(elem || jsonb_build_object('progress', 0, 'claimed', false))
        into v_picked
        from (
            select elem from jsonb_array_elements(public.daily_quest_pool()) elem
            order by random()
            limit 3
        ) sub;

        v_fresh := jsonb_build_object('lastResetDate', v_today, 'quests', v_picked);
        update public.profiles set daily_quests = v_fresh where id = auth.uid();
        return v_fresh;
    end if;

    return v_quests;
end;
$$;

create or replace function public.bump_daily_quest_progress(p_user_id uuid, p_won boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_quests jsonb;
    v_today text := to_char(now(), 'YYYY-MM-DD');
    v_picked jsonb;
    v_updated jsonb;
begin
    select daily_quests into v_quests from public.profiles where id = p_user_id for update;

    if v_quests is null or (v_quests->>'lastResetDate') is distinct from v_today then
        select jsonb_agg(elem || jsonb_build_object('progress', 0, 'claimed', false))
        into v_picked
        from (
            select elem from jsonb_array_elements(public.daily_quest_pool()) elem
            order by random()
            limit 3
        ) sub;
        v_quests := jsonb_build_object('lastResetDate', v_today, 'quests', v_picked);
    end if;

    select jsonb_agg(
        case
            when q->>'id' like 'play_%' then
                jsonb_set(q, '{progress}', to_jsonb(least((q->>'target')::int, (q->>'progress')::int + 1)))
            when q->>'id' like 'win_%' and p_won then
                jsonb_set(q, '{progress}', to_jsonb(least((q->>'target')::int, (q->>'progress')::int + 1)))
            else q
        end
    ) into v_updated
    from jsonb_array_elements(v_quests->'quests') q;

    update public.profiles set daily_quests = jsonb_set(v_quests, '{quests}', v_updated) where id = p_user_id;
end;
$$;

-- ---------- daily_quest_pool(): the 6 templates to draw 3 from each day ----------
create or replace function public.daily_quest_pool()
returns jsonb
language sql
immutable
as $$
    select jsonb_build_array(
        jsonb_build_object('id', 'play_1', 'name', 'Jouer 1 partie', 'description', 'Participez à une partie', 'target', 1, 'reward', 100),
        jsonb_build_object('id', 'play_3', 'name', 'Jouer 3 parties', 'description', 'Participez à 3 parties', 'target', 3, 'reward', 100),
        jsonb_build_object('id', 'play_5', 'name', 'Jouer 5 parties', 'description', 'Participez à 5 parties', 'target', 5, 'reward', 150),
        jsonb_build_object('id', 'win_1', 'name', 'Gagner 1 partie', 'description', 'Remportez une victoire', 'target', 1, 'reward', 100),
        jsonb_build_object('id', 'win_3', 'name', 'Gagner 3 parties', 'description', 'Remportez 3 victoires', 'target', 3, 'reward', 100),
        jsonb_build_object('id', 'win_5', 'name', 'Gagner 5 parties', 'description', 'Remportez 5 victoires', 'target', 5, 'reward', 200)
    );
$$;
