-- ============================================================
-- GODS: Daily quest progress tracking
--
-- get_daily_quests() (20260731164500_daily_quests_rpc.sql) and claim_quest_reward()/
-- claim_all_quest_rewards() (20260731163000_init_profiles.sql) were both fully wired, but
-- nothing anywhere ever incremented a quest's `progress` field -- play_1/play_3/win_3 were
-- permanently stuck at 0/target and could never actually be completed. This adds the missing
-- write path: bump_daily_quest_progress(), called from report-match-result and leave-game
-- for every finished online match (ranked or not -- "jouer une partie" is intentionally not
-- limited to ranked play; only Ferveur/stats/match_history stay ranked-only).
-- ============================================================

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

    -- Même logique de reset paresseux que get_daily_quests() : si absent ou périmé, on repart
    -- d'un jeu de quêtes frais avant d'appliquer l'incrément de cette partie.
    if v_quests is null or (v_quests->>'lastResetDate') is distinct from v_today then
        v_quests := jsonb_build_object(
            'lastResetDate', v_today,
            'quests', jsonb_build_array(
                jsonb_build_object('id', 'play_1', 'name', 'Jouer 1 partie', 'description', 'Participez à une partie', 'target', 1, 'reward', 50, 'progress', 0, 'claimed', false),
                jsonb_build_object('id', 'play_3', 'name', 'Jouer 3 parties', 'description', 'Participez à 3 parties', 'target', 3, 'reward', 50, 'progress', 0, 'claimed', false),
                jsonb_build_object('id', 'win_3', 'name', 'Gagner 3 parties', 'description', 'Remportez 3 victoires', 'target', 3, 'reward', 50, 'progress', 0, 'claimed', false)
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

-- Pas de grant à anon/authenticated : seules les Edge Functions (rôle service) l'appellent,
-- après avoir vérifié le jeton de partie -- même posture que apply_match_result().
