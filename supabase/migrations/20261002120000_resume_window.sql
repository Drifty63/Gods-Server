-- ============================================================
-- GODS — La reprise de partie s'aligne sur l'abandon, et cesse d'être abusable
--
-- Deux incohérences signalées en test, qui n'en font qu'une : la fenêtre de reprise ne parlait
-- pas à la règle d'abandon.
--
--   * On pouvait reprendre une partie pendant TRENTE MINUTES, alors que l'adversaire resté
--     remporte la victoire au bout de quatre-vingt-dix secondes. Passé ce délai, il n'y a plus
--     rien à reprendre : la partie est finie et la bannière mentait.
--
--   * Le décompte repart à quatre-vingt-dix secondes à CHAQUE retour. Quelqu'un qui part et
--     revient indéfiniment tient son adversaire en otage sans jamais perdre.
--
-- La correction tient en deux bornes : une de temps, une de nombre.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. COMBIEN DE FOIS CHAQUE CAMP EST REVENU
--
-- Compté en base et non côté client, pour une raison simple : le joueur qui part n'est plus là
-- pour être compté, et laisser son adversaire le compter à sa place offrirait un bouton « fais
-- perdre l'autre ». Seul le RETOUR est observable par le serveur, puisqu'il passe par une
-- fonction authentifiée — c'est donc lui qu'on compte.
-- ─────────────────────────────────────────────────────────────

alter table public.games add column if not exists host_resumes  int not null default 0;
alter table public.games add column if not exists guest_resumes int not null default 0;

/**
 * Reprises autorisées avant forfait.
 *
 * Trois, comme demandé : on peut revenir deux fois, la troisième est refusée et la partie est
 * perdue. Une coupure réseau honnête consomme une reprise comme un départ volontaire — c'est
 * assumé, parce que la victime d'un joueur qui s'acharne n'a aucun moyen de faire la différence,
 * et que c'est elle qu'on protège.
 */
create or replace function public.max_resumes()
returns int language sql immutable as $$ select 3 $$;

/**
 * Enregistre un retour et dit s'il est accordé.
 *
 * Renvoie le nombre de reprises déjà consommées et, quand le plafond est atteint, clôt la partie
 * au bénéfice de l'adversaire. Tout est fait dans la même transaction : deux onglets rouverts en
 * même temps ne peuvent pas se partager la dernière reprise.
 */
create or replace function public.register_resume(
    p_game_id text,
    p_side text
)
returns table(allowed boolean, used int, forfeited boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_game public.games%rowtype;
    v_used int;
    v_winner_user uuid;
    v_other text;
begin
    if p_side not in ('host', 'guest') then
        return query select false, 0, false;
        return;
    end if;

    select * into v_game from public.games where id = p_game_id for update;
    if not found or v_game.status <> 'playing' then
        return query select false, 0, false;
        return;
    end if;

    v_used := case when p_side = 'host' then v_game.host_resumes else v_game.guest_resumes end;

    -- Le plafond est atteint : ce retour n'est pas accordé, et la partie est perdue.
    if v_used + 1 >= public.max_resumes() then
        v_other := case when p_side = 'host' then 'guest' else 'host' end;
        update public.games
           set status = 'finished', winner_id = v_other, finished_at = now()
         where id = p_game_id;

        v_winner_user := case when v_other = 'host' then v_game.host_user_id else v_game.guest_user_id end;
        if v_game.is_ranked and v_winner_user is not null then
            perform public.apply_match_result(p_game_id, v_winner_user);
        end if;

        return query select false, v_used + 1, true;
        return;
    end if;

    if p_side = 'host' then
        update public.games set host_resumes = host_resumes + 1 where id = p_game_id;
    else
        update public.games set guest_resumes = guest_resumes + 1 where id = p_game_id;
    end if;

    return query select true, v_used + 1, false;
end;
$$;

revoke all on function public.register_resume(text, text) from public;
revoke all on function public.register_resume(text, text) from anon;
revoke all on function public.register_resume(text, text) from authenticated;
grant execute on function public.register_resume(text, text) to service_role;


-- ─────────────────────────────────────────────────────────────
-- 2. LE MÉNAGE S'ALIGNE SUR LA RÈGLE D'ABANDON
--
-- Une partie en cours que plus personne ne touche était gardée trente minutes. Or au bout de
-- quatre-vingt-dix secondes l'adversaire resté a déjà gagné ; et si les DEUX sont partis, plus
-- personne ne reviendra. On laisse une marge — cinq minutes — pour qu'une partie gagnée par
-- abandon ait le temps d'être enregistrée avant que sa ligne disparaisse.
-- ─────────────────────────────────────────────────────────────

-- Reprise à l'identique de la version d'origine : SEUL le délai des parties en cours change.
-- Les trois autres suppressions, et la condition `matched_game_id is null` qui protège une
-- entrée de file déjà appariée, sont recopiées telles quelles — les réécrire de mémoire était
-- le meilleur moyen d'en perdre une en silence.
create or replace function public.cleanup_stale_multiplayer_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    delete from public.matchmaking_queue
        where matched_game_id is null
          and last_seen < now() - interval '45 seconds';

    delete from public.games
        where status not in ('playing', 'finished')
          and created_at < now() - interval '30 minutes';

    -- Était à 30 minutes. Au bout de 90 secondes l'adversaire resté a déjà gagné ; si les DEUX
    -- sont partis, personne ne reviendra. Cinq minutes laissent le temps à une victoire par
    -- abandon d'être enregistrée avant que la ligne ne disparaisse.
    delete from public.games
        where status = 'playing'
          and updated_at < now() - interval '5 minutes';

    delete from public.games
        where status = 'finished'
          and finished_at < now() - interval '1 hour';
end;
$$;
