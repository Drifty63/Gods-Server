-- ============================================================
-- GODS: mode Ascension — record d'étage et récompenses
--
-- `ascension_best_floor` est une statistique de vitrine (elle alimentera un classement) : comme
-- `ambroisie` et `stats`, la colonne n'obtient AUCUN droit d'écriture pour le rôle
-- `authenticated`. Seule une Edge Function utilisant la clé de service peut la modifier, via le
-- RPC ci-dessous. Voir 20260731163000_init_profiles.sql pour le `revoke update` d'origine.
-- ============================================================

alter table public.profiles
    add column if not exists ascension_best_floor int not null default 0
        check (ascension_best_floor >= 0);

-- ---------- report_ascension_run ----------
-- Enregistre la fin d'une ascension : met à jour le record si l'étage atteint le dépasse, et
-- crédite l'ambroisie accumulée pendant la montée.
--
-- L'ambroisie est bornée côté serveur : le total réclamable ne peut pas dépasser ce que les
-- étages franchis rapportent réellement (voir floorReward dans src/data/ascension.ts, soit
-- 10 + 5*étage). Un client qui annoncerait une récompense gonflée est ramené à ce plafond.
-- `p_uid` est fourni par l'Edge Function après avoir validé le JWT de l'appelant : la fonction
-- tourne avec la clé de service, donc auth.uid() y serait nul (même contrat que
-- claim_quest_reward).
create or replace function public.report_ascension_run(
    p_uid uuid,
    p_floor_reached int,
    p_reward int
)
returns table(success boolean, best_floor int, ambroisie_granted int)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid uuid := p_uid;
    v_best int;
    v_max_reward int;
    v_granted int;
begin
    if v_uid is null then
        return query select false, 0, 0;
        return;
    end if;

    if p_floor_reached < 0 or p_floor_reached > 15 then
        return query select false, 0, 0;
        return;
    end if;

    -- Somme de 10 + 5*i pour i de 1 à p_floor_reached.
    v_max_reward := 10 * p_floor_reached + 5 * (p_floor_reached * (p_floor_reached + 1)) / 2;
    v_granted := greatest(0, least(coalesce(p_reward, 0), v_max_reward));

    update public.profiles
    set ascension_best_floor = greatest(ascension_best_floor, p_floor_reached),
        ambroisie = ambroisie + v_granted
    where id = v_uid
    returning ascension_best_floor into v_best;

    if v_best is null then
        return query select false, 0, 0;
        return;
    end if;

    return query select true, v_best, v_granted;
end;
$$;

revoke all on function public.report_ascension_run(uuid, int, int) from public;
revoke all on function public.report_ascension_run(uuid, int, int) from anon;
revoke all on function public.report_ascension_run(uuid, int, int) from authenticated;
grant execute on function public.report_ascension_run(uuid, int, int) to service_role;
