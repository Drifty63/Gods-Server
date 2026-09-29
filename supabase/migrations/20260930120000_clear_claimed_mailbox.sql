-- ============================================================
-- GODS — Vider les récompenses déjà récupérées
--
-- La boîte 🎁 garde TOUT : une récompense réclamée y reste indéfiniment, sous
-- les nouvelles. Au bout de quelques chapitres et de quelques ascensions, il
-- faut faire défiler une liste d'anciens cadeaux pour trouver celui qui attend.
--
-- Rien ne permettait de faire le ménage : la table n'accorde que la LECTURE de
-- ses propres lignes (`mailbox_rewards_select_own`), aucune suppression. Une
-- fonction dédiée vaut mieux qu'une politique de suppression ouverte : elle ne
-- peut toucher QUE les lignes déjà réclamées de l'appelant, quoi qu'on lui
-- demande. Une récompense en attente ne peut donc pas être effacée par erreur —
-- ce serait de l'ambroisie perdue.
-- ============================================================

create or replace function public.clear_claimed_mailbox_rewards()
returns table(deleted int)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid uuid := auth.uid();
    v_count int;
begin
    if v_uid is null then
        return query select 0;
        return;
    end if;

    -- `claimed = true` est la garde essentielle : l'ambroisie a déjà été versée
    -- sur le profil, la ligne n'est plus qu'une trace. Les autres attendent.
    delete from public.mailbox_rewards
     where user_id = v_uid and claimed = true;

    get diagnostics v_count = row_count;
    return query select v_count;
end;
$$;

revoke all on function public.clear_claimed_mailbox_rewards() from public;
grant execute on function public.clear_claimed_mailbox_rewards() to authenticated;
