-- ============================================================
-- GODS — Rééquilibrage des quêtes journalières
--
-- La migration précédente avait porté le tirage à 5 quêtes/jour avec des gains
-- montant jusqu'à 260 : le plafond quotidien passait d'environ 470 à un bon
-- millier d'ambroisie. C'est trop pour une monnaie qu'on veut aussi vendre —
-- un dieu coûte 3000, un coffret 10000, et à ce rythme ils s'obtenaient en
-- quelques jours de jeu régulier.
--
-- On garde l'élargissement du POOL (plus de variété d'un jour à l'autre) mais
-- on revient à 3 tirages, avec des gains resserrés.
--
-- Plafond résultant : 150 + 150 + 130 = 430 ambroisie/jour dans le meilleur
-- tirage, et seulement si les trois quêtes sont menées à terme. Soit :
--   • un dieu (3000)      ≈ 7 jours de jeu quotidien parfait
--   • un coffret (10000)  ≈ 23 jours
--
-- Pour resserrer ou desserrer davantage, il n'y a que deux endroits à toucher :
-- les valeurs `reward` ci-dessous, et le `limit` de roll_daily_quests.
-- ============================================================

create or replace function public.daily_quest_pool()
returns jsonb
language sql
immutable
as $$
    select jsonb_build_array(
        jsonb_build_object('id', 'play_1',  'name', 'Jouer 1 partie',   'description', 'Participez à une partie',  'target', 1,  'reward', 80),
        jsonb_build_object('id', 'play_2',  'name', 'Jouer 2 parties',  'description', 'Participez à 2 parties',   'target', 2,  'reward', 90),
        jsonb_build_object('id', 'play_3',  'name', 'Jouer 3 parties',  'description', 'Participez à 3 parties',   'target', 3,  'reward', 100),
        jsonb_build_object('id', 'play_5',  'name', 'Jouer 5 parties',  'description', 'Participez à 5 parties',   'target', 5,  'reward', 130),
        jsonb_build_object('id', 'play_8',  'name', 'Jouer 8 parties',  'description', 'Participez à 8 parties',   'target', 8,  'reward', 150),
        jsonb_build_object('id', 'win_1',   'name', 'Gagner 1 partie',  'description', 'Remportez une victoire',   'target', 1,  'reward', 90),
        jsonb_build_object('id', 'win_2',   'name', 'Gagner 2 parties', 'description', 'Remportez 2 victoires',    'target', 2,  'reward', 110),
        jsonb_build_object('id', 'win_3',   'name', 'Gagner 3 parties', 'description', 'Remportez 3 victoires',    'target', 3,  'reward', 130),
        jsonb_build_object('id', 'win_5',   'name', 'Gagner 5 parties', 'description', 'Remportez 5 victoires',    'target', 5,  'reward', 150)
    );
$$;

create or replace function public.roll_daily_quests(p_uid uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_owned_gods text[];
    v_random_god text;
    v_candidates jsonb;
    v_picked jsonb;
begin
    select gods_owned into v_owned_gods from public.profiles where id = p_uid;
    v_candidates := public.daily_quest_pool();

    if v_owned_gods is not null and array_length(v_owned_gods, 1) > 0 then
        v_random_god := v_owned_gods[1 + floor(random() * array_length(v_owned_gods, 1))::int];
        v_candidates := v_candidates || jsonb_build_array(
            jsonb_build_object(
                'id', 'usegod_' || v_random_god,
                'name', 'Défi du jour',
                'description', 'Jouez ce dieu 3 fois dans une partie',
                'target', 3,
                'reward', 100,
                'godId', v_random_god
            )
        );
    end if;

    select jsonb_agg(elem || jsonb_build_object('progress', 0, 'claimed', false))
    into v_picked
    from (
        select elem from jsonb_array_elements(v_candidates) elem
        order by random()
        limit 3
    ) sub;

    return v_picked;
end;
$$;


-- ------------------------------------------------------------
-- Forcer un nouveau tirage dès aujourd'hui
-- ------------------------------------------------------------
-- Le tirage est PARESSEUX : il n'a lieu que lorsque `lastResetDate` ne
-- correspond plus au jour courant. Sans cette remise à zéro, tous les joueurs
-- conserveraient jusqu'à demain les quêtes tirées sous l'ancien barème — c'est
-- d'ailleurs pourquoi l'écran en affichait toujours 3 juste après la migration
-- précédente, et non 5.
--
-- Les quêtes déjà RÉCLAMÉES le sont restées : l'ambroisie est versée sur le
-- profil au moment de la réclamation, ce jeton-ci ne fait que redistribuer les
-- quêtes du jour.
update public.profiles
   set daily_quests = jsonb_build_object('lastResetDate', '1970-01-01', 'quests', '[]'::jsonb)
 where daily_quests is not null;
