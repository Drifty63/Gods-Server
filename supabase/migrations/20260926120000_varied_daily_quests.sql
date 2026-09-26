-- ============================================================
-- GODS — Des quêtes journalières qui ne se ressemblent plus
--
-- LE PROBLÈME. Le tirage puisait dans dix quêtes dont NEUF étaient « jouer N
-- parties » ou « gagner N parties ». Trois tirages par jour dans ce vivier
-- donnaient forcément trois variantes du même objectif, à un chiffre près.
-- Seule la dixième, propre à un dieu possédé, sortait du lot.
--
-- POURQUOI ÇA NE POUVAIT PAS ÊTRE AUTREMENT. Le jeu ne remonte que trois
-- signaux à la fin d'une partie : elle a été jouée, elle a été gagnée, et
-- voici les identifiants des unités alignées. Avec ça, on ne peut compter que
-- des parties et des victoires — à moins de savoir ce qu'EST un identifiant.
--
-- CE QUE CETTE MIGRATION AJOUTE. Une table de référence `unit_catalog` qui dit,
-- pour chaque carte jouable, sa catégorie et son élément. C'est elle qui rend
-- possibles les objectifs de COMPOSITION : jouer avec une créature, gagner avec
-- un serviteur, aligner un dieu d'un élément donné. Aucun signal nouveau n'est
-- demandé au client ; on lit autrement ce qu'il envoyait déjà.
--
-- La table est un MIROIR de `src/data`, jamais une source. Après tout ajout ou
-- retrait d'unité :  node scripts/generateUnitCatalogSql.mjs
-- puis rejouer l'`insert` produit.
--
-- L'ÉCONOMIE NE BOUGE PAS. Toujours 3 tirages, gains toujours entre 80 et 150,
-- donc le même plafond d'environ 430 ambroisie par jour parfait. Ce sont les
-- OBJECTIFS qui changent, pas ce qu'ils rapportent.
-- ============================================================

-- ---------------------------------------------- Table de référence des cartes
create table if not exists public.unit_catalog (
    id       text primary key,
    category text not null check (category in ('god', 'creature', 'servant')),
    element  text not null
);

alter table public.unit_catalog enable row level security;

-- Lecture ouverte à tous : ce ne sont que les caractéristiques publiques des
-- cartes, déjà visibles dans le jeu. Aucune écriture n'est exposée — la table
-- se remplit par migration, jamais par un joueur.
drop policy if exists unit_catalog_read on public.unit_catalog;
create policy unit_catalog_read on public.unit_catalog for select using (true);

-- 36 cartes jouables, extraites de src/data par scripts/generateUnitCatalogSql.mjs
insert into public.unit_catalog (id, category, element) values
    ('poseidon','god','water'),
    ('zeus','god','lightning'),
    ('nyx','god','darkness'),
    ('hestia','god','fire'),
    ('athena','god','light'),
    ('demeter','god','earth'),
    ('dionysos','god','earth'),
    ('hades','god','fire'),
    ('apollon','god','air'),
    ('ares','god','earth'),
    ('artemis','god','air'),
    ('aphrodite','god','light'),
    ('soldier_ares_1','servant','earth'),
    ('dragon_thebes','creature','air'),
    ('arachne','creature','darkness'),
    ('giant_spider_1','servant','darkness'),
    ('ulysses','creature','water'),
    ('athena_knight','servant','light'),
    ('feu_follet','servant','fire'),
    ('cyclopes','servant','earth'),
    ('meduse','creature','earth'),
    ('demons_tartare','servant','fire'),
    ('cerbere','creature','darkness'),
    ('serviteurs_aphrodite','servant','light'),
    ('achille','creature','air'),
    ('python','creature','earth'),
    ('satyres','servant','earth'),
    ('chiron','creature','earth'),
    ('garde_celeste','servant','lightning'),
    ('harpies','creature','air'),
    ('chiens_chasse','servant','earth'),
    ('acteon','creature','darkness'),
    ('occultiste','servant','darkness'),
    ('erinyes','creature','fire'),
    ('sirenes','servant','air'),
    ('minotaure','creature','earth')
on conflict (id) do update set category = excluded.category, element = excluded.element;

-- ------------------------------------------------------- Le nouveau vivier
--
-- Quatre familles au lieu de deux, pour que trois tirages donnent trois choses
-- à faire différentes :
--   play_*        — participer, l'objectif de repli qui tombe toujours
--   win_*         — l'emporter
--   withX_* / winwithX_*  — aligner une créature ou un serviteur
--   element_*     — aligner une carte d'un élément donné
--
-- Les paliers intermédiaires (play_2, win_2, play_8, win_5) disparaissent :
-- ils n'apportaient qu'un chiffre de plus sur un objectif déjà présent. Un
-- vivier plus court mais plus varié tire mieux qu'un vivier long et redondant.
create or replace function public.daily_quest_pool()
returns jsonb
language sql
immutable
as $$
    select jsonb_build_array(
        jsonb_build_object('id','play_1','name','Fouler l''arène','description','Participez à une partie','target',1,'reward',80),
        jsonb_build_object('id','play_3','name','Journée chargée','description','Participez à 3 parties','target',3,'reward',110),
        jsonb_build_object('id','play_5','name','Sans relâche','description','Participez à 5 parties','target',5,'reward',140),

        jsonb_build_object('id','win_1','name','Première offrande','description','Remportez une victoire','target',1,'reward',95),
        jsonb_build_object('id','win_3','name','Faveur des dieux','description','Remportez 3 victoires','target',3,'reward',140),

        jsonb_build_object('id','withcreature_2','name','Meute déchaînée','description','Jouez 2 parties avec une créature dans votre équipe','target',2,'reward',110),
        jsonb_build_object('id','withservant_2','name','Fidèles au poste','description','Jouez 2 parties avec un serviteur dans votre équipe','target',2,'reward',110),
        jsonb_build_object('id','winwithcreature_1','name','Crocs et écailles','description','Remportez une victoire avec une créature dans votre équipe','target',1,'reward',125),
        jsonb_build_object('id','winwithservant_1','name','Loyauté récompensée','description','Remportez une victoire avec un serviteur dans votre équipe','target',1,'reward',125),

        jsonb_build_object('id','element_fire_2','name','Sous le signe du feu','description','Jouez 2 parties avec une carte de Feu','target',2,'reward',100,'element','fire'),
        jsonb_build_object('id','element_water_2','name','Sous le signe de l''eau','description','Jouez 2 parties avec une carte d''Eau','target',2,'reward',100,'element','water'),
        jsonb_build_object('id','element_earth_2','name','Sous le signe de la terre','description','Jouez 2 parties avec une carte de Terre','target',2,'reward',100,'element','earth'),
        jsonb_build_object('id','element_air_2','name','Sous le signe de l''air','description','Jouez 2 parties avec une carte d''Air','target',2,'reward',100,'element','air'),
        jsonb_build_object('id','element_lightning_2','name','Sous le signe de la foudre','description','Jouez 2 parties avec une carte de Foudre','target',2,'reward',100,'element','lightning'),
        jsonb_build_object('id','element_light_2','name','Sous le signe de la lumière','description','Jouez 2 parties avec une carte de Lumière','target',2,'reward',100,'element','light'),
        jsonb_build_object('id','element_darkness_2','name','Sous le signe des ténèbres','description','Jouez 2 parties avec une carte de Ténèbres','target',2,'reward',100,'element','darkness')
    );
$$;

-- --------------------------------------------------- Comptage de progression
--
-- Les nouvelles familles se reconnaissent à leur préfixe, comme les anciennes.
-- Elles interrogent `unit_catalog` avec les identifiants réellement alignés :
-- un identifiant inconnu de la table (unité retirée, brouillon) ne compte pour
-- rien plutôt que de faire échouer la mise à jour.
create or replace function public.bump_daily_quest_progress(
    p_user_id uuid,
    p_won boolean,
    p_gods_used text[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_quests jsonb;
    v_today text := to_char(now(), 'YYYY-MM-DD');
    v_updated jsonb;
    v_has_creature boolean;
    v_has_servant boolean;
    v_elements text[];
begin
    select daily_quests into v_quests from public.profiles where id = p_user_id for update;

    if v_quests is null or (v_quests->>'lastResetDate') is distinct from v_today then
        v_quests := jsonb_build_object('lastResetDate', v_today, 'quests', public.roll_daily_quests(p_user_id));
    end if;

    -- Composition de l'équipe alignée, résolue UNE fois plutôt qu'à chaque quête.
    select
        bool_or(c.category = 'creature'),
        bool_or(c.category = 'servant'),
        coalesce(array_agg(distinct c.element), '{}')
    into v_has_creature, v_has_servant, v_elements
    from public.unit_catalog c
    where c.id = any(coalesce(p_gods_used, '{}'));

    v_has_creature := coalesce(v_has_creature, false);
    v_has_servant  := coalesce(v_has_servant, false);
    v_elements     := coalesce(v_elements, '{}');

    /*
     * Les souligné sont ÉCHAPPÉS dans chaque motif, et ce n'est pas cosmétique : dans `like`,
     * `_` est un joker d'un caractère. Le motif `'win_%'` d'origine attrapait donc aussi
     * `winwithcreature_1` — « win » + un caractère quelconque + le reste — et l'aurait compté
     * comme une simple victoire, sans jamais vérifier la composition de l'équipe.
     *
     * Avec `\_`, chaque motif exige un vrai souligné à cette place, et les familles cessent de
     * se marcher dessus quel que soit l'ordre des branches.
     */
    select jsonb_agg(
        case
            when q->>'id' like 'play\_%' then
                jsonb_set(q, '{progress}', to_jsonb(least((q->>'target')::int, (q->>'progress')::int + 1)))
            when q->>'id' like 'win\_%' and p_won then
                jsonb_set(q, '{progress}', to_jsonb(least((q->>'target')::int, (q->>'progress')::int + 1)))
            when q->>'id' like 'usegod\_%' and (q->>'godId') = any(p_gods_used) then
                jsonb_set(q, '{progress}', to_jsonb(least((q->>'target')::int, (q->>'progress')::int + 1)))

            when q->>'id' like 'withcreature\_%' and v_has_creature then
                jsonb_set(q, '{progress}', to_jsonb(least((q->>'target')::int, (q->>'progress')::int + 1)))
            when q->>'id' like 'withservant\_%' and v_has_servant then
                jsonb_set(q, '{progress}', to_jsonb(least((q->>'target')::int, (q->>'progress')::int + 1)))
            when q->>'id' like 'winwithcreature\_%' and p_won and v_has_creature then
                jsonb_set(q, '{progress}', to_jsonb(least((q->>'target')::int, (q->>'progress')::int + 1)))
            when q->>'id' like 'winwithservant\_%' and p_won and v_has_servant then
                jsonb_set(q, '{progress}', to_jsonb(least((q->>'target')::int, (q->>'progress')::int + 1)))
            when q->>'id' like 'element\_%' and (q->>'element') = any(v_elements) then
                jsonb_set(q, '{progress}', to_jsonb(least((q->>'target')::int, (q->>'progress')::int + 1)))

            else q
        end
    ) into v_updated
    from jsonb_array_elements(v_quests->'quests') q;

    update public.profiles set daily_quests = jsonb_set(v_quests, '{quests}', v_updated) where id = p_user_id;
end;
$$;
