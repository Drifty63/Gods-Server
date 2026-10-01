-- ============================================================
-- GODS — Victoire par abandon, vérifiée côté serveur
--
-- Règle demandée : si l'adversaire quitte et ne revient pas au bout d'une minute trente, la
-- partie se termine et la victoire revient au joueur resté.
--
-- Le piège est de laisser le client en décider. `report-match-result` croit déjà `didIWin` sur
-- parole ; ajouter « et je déclare que l'autre est parti » donnerait un second bouton pour
-- gagner sans jouer, encore plus simple que le premier.
--
-- Ce que le serveur peut VÉRIFIER, lui, sans rien ajouter de coûteux : `games.updated_at` est
-- rafraîchi à chaque action, puisque chaque action réécrit `game_state`. Il suffit de savoir QUI
-- a agi en dernier — d'où la colonne `last_actor`, écrite par sync-game-state.
--
-- La condition retenue est donc : le réclamant a joué en dernier, et plus rien ne s'est passé
-- depuis quatre-vingt-dix secondes. Autrement dit, c'est à l'adversaire d'agir et il n'agit pas.
-- Un tricheur ne peut pas la déclencher pendant que son adversaire joue : la moindre action de
-- celui-ci remet `updated_at` à zéro et lui donne `last_actor`.
--
-- Ce verrou est volontairement plus strict que la présence Realtime, qui dirait « il a fermé
-- l'onglet » mais n'est pas vérifiable depuis Postgres. Le client s'en sert pour DÉCLENCHER la
-- réclamation ; le serveur, lui, ne se fie qu'à ce qu'il peut constater.
-- ============================================================

alter table public.games add column if not exists last_actor text
    check (last_actor in ('host', 'guest'));

/** Délai d'abandon, en secondes. Aligné sur la règle de jeu : une minute trente. */
create or replace function public.abandon_delay_seconds()
returns int language sql immutable as $$ select 90 $$;

create or replace function public.claim_abandon_victory(
    p_game_id text,
    p_side text
)
returns table(success boolean, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_game public.games%rowtype;
    v_winner_user uuid;
begin
    if p_side not in ('host', 'guest') then
        return query select false, 'camp invalide'::text;
        return;
    end if;

    select * into v_game from public.games where id = p_game_id for update;
    if not found then
        return query select false, 'partie introuvable'::text;
        return;
    end if;

    -- Déjà terminée : rien à faire, et surtout pas un second résultat.
    if v_game.status = 'finished' then
        return query select false, 'partie déjà terminée'::text;
        return;
    end if;

    -- Le réclamant doit être celui qui a joué en dernier : sinon c'est à LUI d'agir, et son
    -- adversaire n'a aucune raison d'être déclaré absent.
    if v_game.last_actor is distinct from p_side then
        return query select false, 'ce n''est pas à votre adversaire d''agir'::text;
        return;
    end if;

    if v_game.updated_at > now() - make_interval(secs => public.abandon_delay_seconds()) then
        return query select false, 'délai non écoulé'::text;
        return;
    end if;

    update public.games
       set status = 'finished',
           winner_id = p_side,
           finished_at = now()
     where id = p_game_id;

    -- Classement et historique : même chemin que pour une victoire normale, pour qu'un abandon
    -- compte exactement pareil. `apply_match_result` est sans effet sur une partie non classée.
    v_winner_user := case when p_side = 'host' then v_game.host_user_id else v_game.guest_user_id end;
    if v_game.is_ranked and v_winner_user is not null then
        perform public.apply_match_result(p_game_id, v_winner_user);
    end if;

    return query select true, 'victoire par abandon'::text;
end;
$$;

revoke all on function public.claim_abandon_victory(text, text) from public;
revoke all on function public.claim_abandon_victory(text, text) from anon;
revoke all on function public.claim_abandon_victory(text, text) from authenticated;
grant execute on function public.claim_abandon_victory(text, text) to service_role;
