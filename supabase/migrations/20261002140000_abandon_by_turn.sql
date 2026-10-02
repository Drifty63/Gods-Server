-- ============================================================
-- GODS — La victoire par abandon se décide sur le TOUR, plus sur le dernier acteur
--
-- Observé en test : la victoire au chrono marchait une fois sur deux. La règle exigeait que le
-- réclamant soit celui qui avait joué EN DERNIER. Or si l'adversaire jouait sa carte puis
-- fermait l'application, le dernier acteur était lui : la réclamation était refusée pour
-- toujours, et le joueur resté contemplait « Clôture de la partie… » sans fin.
--
-- Pire, au tout début d'une partie où l'adversaire commence et part avant d'avoir rien fait,
-- `last_actor` désigne l'hôte qui a synchronisé l'état initial — impossible à corriger depuis
-- l'écran.
--
-- Ce que la règle voulait vraiment dire, c'est : « c'est à l'adversaire de jouer, et il ne joue
-- pas ». Le TOUR est écrit dans `game_state.currentPlayerId`, à jour à chaque action. On le lit
-- directement.
--
-- La protection contre la triche est la même qu'avant, et ne dépend pas de qui a joué en
-- dernier : un tricheur ne peut pas réclamer pendant SON propre tour (ce n'est pas le tour de
-- l'adversaire), et pendant celui de l'adversaire, ce dernier — s'il est bien là — agit avant
-- quatre-vingt-dix secondes, le chrono de tour l'y obligeant au bout de soixante.
-- ============================================================

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
    v_my_player_id text;
    v_current_player text;
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

    if v_game.status = 'finished' then
        return query select false, 'partie deja terminee'::text;
        return;
    end if;

    if v_game.game_state is null then
        return query select false, 'partie pas encore commencee'::text;
        return;
    end if;

    -- L'hôte occupe toujours la première place de `players`, l'invité la seconde — la même
    -- convention que sync-game-state et tout le reste du mode en ligne.
    v_my_player_id := v_game.game_state -> 'players' -> (case when p_side = 'host' then 0 else 1 end) ->> 'id';
    v_current_player := v_game.game_state ->> 'currentPlayerId';

    if v_current_player is null or v_my_player_id is null then
        return query select false, 'etat de partie illisible'::text;
        return;
    end if;

    -- C'est à NOUS de jouer : l'adversaire n'a rien à se reprocher, et une réclamation ici
    -- permettrait de gagner en restant immobile pendant son propre tour.
    if v_current_player = v_my_player_id then
        return query select false, 'c''est a vous de jouer'::text;
        return;
    end if;

    if v_game.updated_at > now() - make_interval(secs => public.abandon_delay_seconds()) then
        return query select false, 'delai non ecoule'::text;
        return;
    end if;

    update public.games
       set status = 'finished',
           winner_id = p_side,
           finished_at = now()
     where id = p_game_id;

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
