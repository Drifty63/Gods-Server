-- ============================================================
-- GODS — Fermer les trois portes ouvertes
--
-- Trois défauts trouvés à l'audit, sans rapport entre eux sauf qu'ils ont la même cause : une
-- permission écrite au début du projet, quand il n'y avait ni joueurs ni économie, et jamais
-- resserrée depuis.
--
--   1. L'ambroisie se fabriquait en boucle.
--   2. La main de l'adversaire était lisible par n'importe qui.
--   3. La file d'attente était vidable par n'importe qui.
--
-- Aucun des trois ne se voit en jouant normalement, et c'est pour ça qu'ils ont tenu si
-- longtemps : il faut ouvrir l'onglet réseau du navigateur pour s'en apercevoir.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. PLAFOND QUOTIDIEN SUR L'AMBROISIE D'ASCENSION
--
-- `report_ascension_run` borne bien la récompense à ce que les étages franchis rapportent — mais
-- l'étage lui-même est déclaré par le client, et RIEN ne limite la fréquence des appels.
-- Annoncer l'étage 15 rapporte 750 ambroisies, autant de fois qu'on le demande : quatorze appels
-- suffisent pour un coffret que les quêtes mettent un mois à payer.
--
-- La vraie correction est de suivre les ascensions en base, du départ à la clôture. En attendant,
-- un plafond par jour ferme la porte en grand sans rien changer pour un joueur honnête : 750 est
-- exactement ce que rapporte UNE ascension parfaite, donc personne ne peut l'atteindre par le
-- jeu normal plus d'une fois par jour.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.ascension_grants (
    user_id uuid not null references public.profiles(id) on delete cascade,
    day date not null default (now() at time zone 'utc')::date,
    granted int not null default 0 check (granted >= 0),
    primary key (user_id, day)
);

alter table public.ascension_grants enable row level security;
-- Aucune policy : seules les fonctions security definer y touchent.

/** Ambroisie d'ascension gagnable par jour et par joueur. Une ascension parfaite en rapporte 750. */
create or replace function public.ascension_daily_cap()
returns int language sql immutable as $$ select 750 $$;

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
    v_today date := (now() at time zone 'utc')::date;
    v_already int;
    v_room int;
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

    -- Ce qui a déjà été versé aujourd'hui, et ce qu'il reste à verser.
    insert into public.ascension_grants (user_id, day, granted)
         values (v_uid, v_today, 0)
    on conflict (user_id, day) do nothing;

    select granted into v_already
      from public.ascension_grants
     where user_id = v_uid and day = v_today
       for update;

    v_room := greatest(0, public.ascension_daily_cap() - coalesce(v_already, 0));
    v_granted := least(v_granted, v_room);

    update public.ascension_grants
       set granted = coalesce(v_already, 0) + v_granted
     where user_id = v_uid and day = v_today;

    -- Le MEILLEUR ÉTAGE reste enregistré même quand le plafond annule la récompense : c'est une
    -- performance, pas un gain, et la plafonner punirait un joueur qui enchaîne les ascensions.
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


-- ─────────────────────────────────────────────────────────────
-- 2. LA MAIN DE L'ADVERSAIRE CESSE D'ÊTRE PUBLIQUE
--
-- `games_select_all` autorisait anon ET authenticated à lire TOUTES les parties sans condition.
-- Or `game_state` contient les deux joueurs, mains comprises, et la clé anonyme de Supabase est
-- dans le bundle du navigateur. N'importe qui pouvait lire les cartes de son adversaire pendant
-- une partie classée.
--
-- Les parties privées se rejoignent par un code à six caractères, saisi avant d'être participant :
-- il faut donc continuer à laisser lire la LIGNE pour qu'un code puisse être vérifié. On restreint
-- l'accès aux participants, et la vue `games_public` sert le reste sans jamais exposer l'état.
-- ─────────────────────────────────────────────────────────────

drop policy if exists games_select_all on public.games;
-- Rejouable : une première tentative de cette migration a pu créer cette politique avant
-- d'échouer plus loin.
drop policy if exists games_select_participant on public.games;

create policy games_select_participant on public.games
    for select to authenticated
    using (auth.uid() in (host_user_id, guest_user_id));

-- Ce qu'un non-participant a le droit de savoir d'une partie : qu'elle existe, et si elle attend
-- quelqu'un. Jamais son état.
create or replace view public.games_public
with (security_invoker = off) as
    select id, status, is_private, is_ranked, host_name, guest_name, created_at
      from public.games;

grant select on public.games_public to anon, authenticated;



-- ─────────────────────────────────────────────────────────────
-- 3. LA FILE D'ATTENTE — rien à faire, et c'était une erreur de l'audit
--
-- L'audit affirmait la file ouverte à tous. C'était faux : 20260805090000_security_fixes.sql
-- l'avait déjà verrouillée le 5 août (queue_select_own, queue_insert_own, queue_update_own,
-- queue_delete_own). J'avais lu la migration d'origine sans vérifier celles qui l'ont suivie.
--
-- Cette section recréait des politiques portant les MÊMES noms, et a fait échouer la migration
-- (« policy queue_insert_own already exists »). Elle est retirée : celles d'août suffisent.
-- ─────────────────────────────────────────────────────────────
