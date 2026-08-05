-- ============================================================
-- GODS: Security/integrity fixes found during audit
--
-- 1. matchmaking_queue RLS was wide open (using(true) on select/update/delete, granted to
--    anon too) -- any client could enumerate every row (leaking other players' ids, ratings,
--    matched_game_id) and then update/delete rows it doesn't own, e.g. spoof a rating to skew
--    pairing, hijack matched_game_id, or delete an opponent from the queue. The client only
--    ever touches its own row (see useMultiplayer.ts: it keeps the row id from its own insert
--    in a ref and never queries anyone else's), so this scopes every policy to the caller's
--    own user_id and drops the anon grant (matchmaking now requires auth, via RequireAuth on
--    /online and /duel).
--
-- 2. claim_all_mailbox_rewards summed the unclaimed total with a plain SELECT (no row lock)
--    before flipping claimed=true, unlike the correctly-guarded claim_mailbox_reward right
--    above it in the same file -- two concurrent calls (double-click, retry) could both read
--    the same total and both credit ambroisie for it, even though only the first UPDATE
--    actually flips any rows. Adds the same FOR UPDATE lock.
-- ============================================================

drop policy if exists queue_select_all on public.matchmaking_queue;
create policy queue_select_own on public.matchmaking_queue
    for select to authenticated using (user_id = auth.uid());

drop policy if exists queue_insert_all on public.matchmaking_queue;
create policy queue_insert_own on public.matchmaking_queue
    for insert to authenticated with check (user_id = auth.uid());

drop policy if exists queue_update_all on public.matchmaking_queue;
create policy queue_update_own on public.matchmaking_queue
    for update to authenticated using (user_id = auth.uid());

drop policy if exists queue_delete_all on public.matchmaking_queue;
create policy queue_delete_own on public.matchmaking_queue
    for delete to authenticated using (user_id = auth.uid());

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
    -- Verrouille les lignes non réclamées avant de les sommer : sans ce verrou, deux appels
    -- concurrents (double-clic, retry réseau) pouvaient tous les deux lire le même total non
    -- réclamé et créditer deux fois l'ambroisie, même si un seul des deux UPDATE ci-dessous
    -- flippait réellement des lignes. FOR UPDATE ne peut pas être combiné à sum(), d'où le
    -- verrouillage en deux temps (perform ... for update, puis la somme sur les lignes déjà
    -- verrouillées par cette transaction).
    perform 1 from public.mailbox_rewards
    where user_id = v_uid and claimed = false
    for update;

    select coalesce(sum(ambroisie_reward), 0) into v_total
    from public.mailbox_rewards
    where user_id = v_uid and claimed = false;

    update public.mailbox_rewards set claimed = true, claimed_at = now()
    where user_id = v_uid and claimed = false;

    if v_total > 0 then
        update public.profiles set ambroisie = ambroisie + v_total where id = v_uid;
    end if;

    return query select true, v_total;
end;
$$;
