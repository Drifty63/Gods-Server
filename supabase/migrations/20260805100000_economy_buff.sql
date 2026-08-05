-- ============================================================
-- GODS: Economy pass -- ambroisie income was too slow
--
-- Daily quests alone (150 ambroisie/day max) meant unlocking the 8 non-starter gods
-- (3000 each, 24000 total) took ~160 days of perfect daily completion, with no other
-- income source and real-money purchases still "coming soon". This:
-- 1. Doubles each daily quest's reward (50 -> 100, so 300/day max instead of 150).
-- 2. Adds a flat ambroisie reward for winning a RANKED match (the only match type that
--    already touches Ferveur/stats -- casual/private games stay untouched, matching how
--    daily-quest progress and Ferveur are already scoped).
-- Prices (3000/god, 10000/coffret) are left as-is, per the decision to fix this via income
-- rather than discounting.
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
begin
    select daily_quests into v_quests from public.profiles where id = auth.uid() for update;

    if v_quests is null or (v_quests->>'lastResetDate') is distinct from v_today then
        v_fresh := jsonb_build_object(
            'lastResetDate', v_today,
            'quests', jsonb_build_array(
                jsonb_build_object('id', 'play_1', 'name', 'Jouer 1 partie', 'description', 'Participez à une partie', 'target', 1, 'reward', 100, 'progress', 0, 'claimed', false),
                jsonb_build_object('id', 'play_3', 'name', 'Jouer 3 parties', 'description', 'Participez à 3 parties', 'target', 3, 'reward', 100, 'progress', 0, 'claimed', false),
                jsonb_build_object('id', 'win_3', 'name', 'Gagner 3 parties', 'description', 'Remportez 3 victoires', 'target', 3, 'reward', 100, 'progress', 0, 'claimed', false)
            )
        );
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
    v_updated jsonb;
begin
    select daily_quests into v_quests from public.profiles where id = p_user_id for update;

    if v_quests is null or (v_quests->>'lastResetDate') is distinct from v_today then
        v_quests := jsonb_build_object(
            'lastResetDate', v_today,
            'quests', jsonb_build_array(
                jsonb_build_object('id', 'play_1', 'name', 'Jouer 1 partie', 'description', 'Participez à une partie', 'target', 1, 'reward', 100, 'progress', 0, 'claimed', false),
                jsonb_build_object('id', 'play_3', 'name', 'Jouer 3 parties', 'description', 'Participez à 3 parties', 'target', 3, 'reward', 100, 'progress', 0, 'claimed', false),
                jsonb_build_object('id', 'win_3', 'name', 'Gagner 3 parties', 'description', 'Remportez 3 victoires', 'target', 3, 'reward', 100, 'progress', 0, 'claimed', false)
            )
        );
    end if;

    select jsonb_agg(
        case
            when q->>'id' in ('play_1', 'play_3') then
                jsonb_set(q, '{progress}', to_jsonb(least((q->>'target')::int, (q->>'progress')::int + 1)))
            when q->>'id' = 'win_3' and p_won then
                jsonb_set(q, '{progress}', to_jsonb(least((q->>'target')::int, (q->>'progress')::int + 1)))
            else q
        end
    ) into v_updated
    from jsonb_array_elements(v_quests->'quests') q;

    update public.profiles set daily_quests = jsonb_set(v_quests, '{quests}', v_updated) where id = p_user_id;
end;
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

    -- Ambroisie de victoire : seule source de revenu en dehors des quêtes journalières,
    -- réservée aux parties classées (même périmètre que le Ferveur/stats/historique).
    update public.profiles set ambroisie = ambroisie + 30 where id = p_winner_user_id;

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
