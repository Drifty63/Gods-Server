-- ============================================================================
-- ENREGISTREMENT ANALYTIQUE — ce qui se perd si on ne l'écrit pas maintenant
-- ============================================================================
--
-- Deux questions que l'équipe veut pouvoir poser plus tard, et auxquelles la base
-- d'aujourd'hui ne peut PAS répondre — même rétroactivement :
--
--   « quelles équipes les joueurs composent-ils ? »
--   « quel dieu gagne le plus souvent ? »
--
-- Pourquoi c'est perdu : `public.games` est la SEULE table qui porte les compositions
-- (`host_gods` / `guest_gods`), et `cleanup_stale_multiplayer_data()` la purge une heure après
-- la fin de la partie. `match_history`, lui, ne garde que résultat, adversaire et delta de
-- ferveur. Les cartes jouées disparaissent donc avec la ligne de partie.
--
-- Troisième trou : aucune table ne journalise les ACHATS. `profiles.gods_owned` mélange ce qui
-- a été acheté, offert dans un pack de départ et gagné en récompense — impossible de savoir ce
-- qui se vend.
--
-- Un tableau de bord se construit quand on veut. Une semaine de joueurs non enregistrée est
-- perdue pour toujours, et ce sont les premières semaines qui servent le plus à équilibrer.
--
-- CHOIX DE CONCEPTION : des tables SÉPARÉES, écrites par les Edge Functions avec la clé de
-- service. On ne touche ni à `apply_match_result` ni au calcul de ferveur — la logique qui
-- paie les joueurs ne doit pas bouger pour une raison de statistiques. Conséquence voulue :
-- `match_records` enregistre TOUTES les parties en ligne terminées, classées ou non, là où
-- `match_history` s'arrête aux parties classées.

-- ---------- 1. Les parties terminées ----------

create table if not exists public.match_records (
    -- La partie elle-même est la clé : `report-match-result` a une garde anti-doublon, mais
    -- une clé primaire sur le game_id rend le double enregistrement impossible par construction.
    game_id text primary key,
    host_user_id uuid references public.profiles(id) on delete set null,
    guest_user_id uuid references public.profiles(id) on delete set null,
    -- Identifiants de cartes, dieux comme créatures et serviteurs, dans l'ordre de composition.
    host_team text[] not null default '{}',
    guest_team text[] not null default '{}',
    winner_user_id uuid references public.profiles(id) on delete set null,
    winner_side text check (winner_side in ('host', 'guest')),
    is_ranked boolean not null default false,
    -- Pas de colonne `ladder` : le classement choisi ne vit que côté client, il n'est jamais
    -- écrit sur `games`. Une colonne toujours vide serait un mensonge dans le schéma.
    is_private boolean not null default false,
    finished_at timestamptz not null default now()
);

create index if not exists match_records_finished_idx on public.match_records (finished_at desc);
-- GIN : permet « toutes les parties où l'équipe contenait Zeus » sans parcourir la table.
create index if not exists match_records_host_team_idx on public.match_records using gin (host_team);
create index if not exists match_records_guest_team_idx on public.match_records using gin (guest_team);

-- ---------- 2. Les achats ----------

create table if not exists public.purchases (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    -- `starter_pack` est enregistré au même endroit, à prix nul : c'est la seule façon de
    -- distinguer plus tard ce qui a été ACHETÉ de ce qui a été OFFERT.
    kind text not null check (kind in ('god', 'coffret', 'starter_pack')),
    item_id text not null,
    price int not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists purchases_created_idx on public.purchases (created_at desc);
create index if not exists purchases_item_idx on public.purchases (kind, item_id);

-- ---------- 3. Lecture réservée aux créateurs ----------
--
-- Aucune policy d'écriture : seules les Edge Functions écrivent ici, avec la clé de service,
-- qui contourne RLS. Un joueur ne peut donc jamais fabriquer une ligne de statistique.

alter table public.match_records enable row level security;
alter table public.purchases enable row level security;

drop policy if exists match_records_select_creator on public.match_records;
create policy match_records_select_creator on public.match_records
    for select to authenticated
    using (exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.is_creator
    ));

drop policy if exists purchases_select_creator on public.purchases;
create policy purchases_select_creator on public.purchases
    for select to authenticated
    using (exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.is_creator
    ));
