-- ============================================================
-- get_daily_quests(): lazy-reset read of the caller's own daily quests.
-- Not caught by the Edge Function list in the original plan -- daily_quests isn't a
-- client-grantable column (see profiles RLS/grants), yet reading quests needs to be able
-- to reset them on a new day. A security definer RPC scoped to auth.uid() (not a
-- caller-supplied uid) is the right size here: no economy math, no need for a whole
-- Edge Function round trip, and it can't touch anyone else's row.
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
                jsonb_build_object('id', 'play_1', 'name', 'Jouer 1 partie', 'description', 'Participez à une partie', 'target', 1, 'reward', 50, 'progress', 0, 'claimed', false),
                jsonb_build_object('id', 'play_3', 'name', 'Jouer 3 parties', 'description', 'Participez à 3 parties', 'target', 3, 'reward', 50, 'progress', 0, 'claimed', false),
                jsonb_build_object('id', 'win_3', 'name', 'Gagner 3 parties', 'description', 'Remportez 3 victoires', 'target', 3, 'reward', 50, 'progress', 0, 'claimed', false)
            )
        );
        update public.profiles set daily_quests = v_fresh where id = auth.uid();
        return v_fresh;
    end if;

    return v_quests;
end;
$$;

grant execute on function public.get_daily_quests() to authenticated;
