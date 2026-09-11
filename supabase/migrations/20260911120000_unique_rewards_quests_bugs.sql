-- ============================================================
-- GODS — Lot 2 : récompenses uniques, quêtes élargies, remontée de bugs
--
-- Trois sujets, une seule migration parce qu'ils partagent la même pièce
-- maîtresse : une récompense qu'on ne peut toucher QU'UNE FOIS par profil.
--
-- Pourquoi c'est la seule protection possible : le combat est calculé côté
-- client dans tous les modes. Le serveur ne peut donc pas vérifier qu'un
-- chapitre a réellement été terminé, ni qu'un étage a réellement été franchi.
-- Ce qu'il PEUT garantir, c'est qu'une même récompense ne sera jamais payée
-- deux fois — ce qui suffit à fermer le farm, puisque l'Histoire et
-- l'Ascension sont rejouables à volonté.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Clé d'unicité sur la boîte à récompenses
-- ------------------------------------------------------------
-- La table savait déjà livrer de l'ambroisie et l'interface existe (icône 🎁
-- de l'accueil). Il lui manquait de quoi dire « celle-ci, une seule fois ».

alter table public.mailbox_rewards add column if not exists source text;
alter table public.mailbox_rewards add column if not exists ref_id text;

comment on column public.mailbox_rewards.source is
    'Origine de la récompense : story, ascension… NULL pour les cadeaux libres, qui peuvent se répéter.';
comment on column public.mailbox_rewards.ref_id is
    'Identifiant de ce qui a été accompli : chapter_1, floor-7…';

-- Index PARTIEL : les cadeaux manuels (source NULL) restent répétables.
create unique index if not exists mailbox_rewards_unique_source
    on public.mailbox_rewards (user_id, source, ref_id)
    where source is not null;


-- ------------------------------------------------------------
-- 2. Accorder une récompense unique (helper interne)
-- ------------------------------------------------------------
-- Renvoie true si la récompense a bien été créée, false si elle existait déjà.
-- Aucun droit client : seules les fonctions ci-dessous l'appellent.

create or replace function public.grant_unique_reward(
    p_uid uuid,
    p_source text,
    p_ref_id text,
    p_title text,
    p_description text,
    p_ambroisie int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_inserted int;
begin
    if p_uid is null or p_source is null or p_ref_id is null then
        return false;
    end if;

    insert into public.mailbox_rewards (user_id, title, description, ambroisie_reward, source, ref_id)
    values (p_uid, p_title, p_description, greatest(coalesce(p_ambroisie, 0), 0), p_source, p_ref_id)
    on conflict (user_id, source, ref_id) where source is not null do nothing;

    get diagnostics v_inserted = row_count;
    return v_inserted > 0;
end;
$$;

revoke all on function public.grant_unique_reward(uuid, text, text, text, text, int) from public;
revoke all on function public.grant_unique_reward(uuid, text, text, text, text, int) from anon;
revoke all on function public.grant_unique_reward(uuid, text, text, text, text, int) from authenticated;


-- ------------------------------------------------------------
-- 3. Récompense de fin de chapitre (mode Histoire) — 250 ambroisie
-- ------------------------------------------------------------
-- Appelée par le client à la fin d'un chapitre. Le titre est construit ICI et
-- non transmis par le client : rien de ce qu'un joueur envoie ne doit se
-- retrouver tel quel dans sa boîte.

create or replace function public.claim_story_chapter_reward(p_chapter_id text)
returns table(granted boolean, ambroisie int)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid uuid := auth.uid();
    v_amount constant int := 250;
    v_digits text;
    v_label text;
    v_granted boolean;
begin
    if v_uid is null
       or p_chapter_id is null
       or p_chapter_id !~ '^chapter_[0-9]{1,3}$' then
        return query select false, 0;
        return;
    end if;

    v_digits := regexp_replace(p_chapter_id, '\D', '', 'g');
    v_label := 'Chapitre ' || v_digits || ' terminé';

    v_granted := public.grant_unique_reward(
        v_uid,
        'story',
        p_chapter_id,
        v_label,
        'Votre traversée de ce chapitre vous vaut 250 ambroisie.',
        v_amount
    );

    return query select v_granted, case when v_granted then v_amount else 0 end;
end;
$$;

grant execute on function public.claim_story_chapter_reward(text) to authenticated;


-- ------------------------------------------------------------
-- 4. Récompenses d'Ascension — une seule fois par étage et par profil
-- ------------------------------------------------------------
-- Barème : étages 1-5 → 100 chacun · 6-10 → 200 chacun · 11-15 → 600 chacun.
-- Soit 500 + 1000 + 3000 = 4500 ambroisie pour une tour entière, une fois.

create or replace function public.ascension_floor_bonus(p_floor int)
returns int
language sql
immutable
as $$
    select case
        when p_floor between 1 and 5   then 100
        when p_floor between 6 and 10  then 200
        when p_floor between 11 and 15 then 600
        else 0
    end;
$$;

create or replace function public.claim_ascension_floor_rewards(p_floor_reached int)
returns table(granted_floors int, total_ambroisie int)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid uuid := auth.uid();
    v_top int;
    v_floor int;
    v_bonus int;
    v_count int := 0;
    v_total int := 0;
begin
    if v_uid is null or p_floor_reached is null or p_floor_reached < 1 then
        return query select 0, 0;
        return;
    end if;

    -- Borne dure : la tour compte 15 étages, quoi qu'annonce le client.
    v_top := least(p_floor_reached, 15);

    for v_floor in 1..v_top loop
        v_bonus := public.ascension_floor_bonus(v_floor);
        if public.grant_unique_reward(
            v_uid,
            'ascension',
            'floor-' || v_floor,
            'Étage ' || v_floor || ' franchi',
            'Première ascension jusqu''à cet étage : ' || v_bonus || ' ambroisie.',
            v_bonus
        ) then
            v_count := v_count + 1;
            v_total := v_total + v_bonus;
        end if;
    end loop;

    return query select v_count, v_total;
end;
$$;

grant execute on function public.claim_ascension_floor_rewards(int) to authenticated;


-- ------------------------------------------------------------
-- 5. Quêtes journalières : un pool plus large, 5 tirages par jour
-- ------------------------------------------------------------
-- Avant : 3 quêtes tirées d'un pool de 6, soit 470 ambroisie/jour au maximum,
-- face à un dieu à 3000 et un coffret à 10000. Les préfixes play_ / win_ sont
-- conservés : bump_daily_quest_progress les reconnaît déjà.

create or replace function public.daily_quest_pool()
returns jsonb
language sql
immutable
as $$
    select jsonb_build_array(
        jsonb_build_object('id', 'play_1',  'name', 'Jouer 1 partie',   'description', 'Participez à une partie',  'target', 1,  'reward', 100),
        jsonb_build_object('id', 'play_2',  'name', 'Jouer 2 parties',  'description', 'Participez à 2 parties',   'target', 2,  'reward', 120),
        jsonb_build_object('id', 'play_3',  'name', 'Jouer 3 parties',  'description', 'Participez à 3 parties',   'target', 3,  'reward', 140),
        jsonb_build_object('id', 'play_5',  'name', 'Jouer 5 parties',  'description', 'Participez à 5 parties',   'target', 5,  'reward', 180),
        jsonb_build_object('id', 'play_8',  'name', 'Jouer 8 parties',  'description', 'Participez à 8 parties',   'target', 8,  'reward', 260),
        jsonb_build_object('id', 'win_1',   'name', 'Gagner 1 partie',  'description', 'Remportez une victoire',   'target', 1,  'reward', 120),
        jsonb_build_object('id', 'win_2',   'name', 'Gagner 2 parties', 'description', 'Remportez 2 victoires',    'target', 2,  'reward', 150),
        jsonb_build_object('id', 'win_3',   'name', 'Gagner 3 parties', 'description', 'Remportez 3 victoires',    'target', 3,  'reward', 180),
        jsonb_build_object('id', 'win_5',   'name', 'Gagner 5 parties', 'description', 'Remportez 5 victoires',    'target', 5,  'reward', 250)
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
                'reward', 120,
                'godId', v_random_god
            )
        );
    end if;

    select jsonb_agg(elem || jsonb_build_object('progress', 0, 'claimed', false))
    into v_picked
    from (
        select elem from jsonb_array_elements(v_candidates) elem
        order by random()
        limit 5
    ) sub;

    return v_picked;
end;
$$;


-- ------------------------------------------------------------
-- 6. Remontée de bugs
-- ------------------------------------------------------------
-- Lecture réservée aux comptes `is_creator`, le seul drapeau privilégié du
-- projet. La RLS est la vraie barrière : la garde côté page n'est qu'un confort.

create table if not exists public.bug_reports (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    username text not null default '',
    message text not null check (length(message) between 5 and 4000),
    page_url text not null default '',
    user_agent text not null default '',
    app_version text not null default '',
    status text not null default 'new' check (status in ('new', 'seen', 'resolved')),
    created_at timestamptz not null default now()
);

create index if not exists bug_reports_status_idx on public.bug_reports (status, created_at desc);

alter table public.bug_reports enable row level security;

drop policy if exists "bug_reports_insert_own" on public.bug_reports;
create policy "bug_reports_insert_own" on public.bug_reports
    for insert with check (auth.uid() = user_id);

drop policy if exists "bug_reports_select_admin" on public.bug_reports;
create policy "bug_reports_select_admin" on public.bug_reports
    for select using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_creator)
    );

drop policy if exists "bug_reports_update_admin" on public.bug_reports;
create policy "bug_reports_update_admin" on public.bug_reports
    for update using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_creator)
    ) with check (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_creator)
    );

grant select, insert on public.bug_reports to authenticated;
grant update (status) on public.bug_reports to authenticated;
