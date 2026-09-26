-- ============================================================
-- GODS — Enregistrer le CLASSEMENT de chaque partie analysée
--
-- POURQUOI MAINTENANT, ET PAS PLUS TARD. `match_records` note les équipes, le
-- vainqueur et la date, mais pas le classement joué. Or une donnée qu'on n'a pas
-- écrite ne se retrouve jamais : chaque partie disputée d'ici là sera à jamais
-- inexploitable par classement, et le tableau de bord ne pourra pas répondre à
-- « quelles équipes gagnent en Duel 13 » — la question qui compte le plus, un
-- budget de 13 points changeant complètement les compositions viables.
--
-- La migration analytique portait un commentaire affirmant que le classement ne
-- vivait que côté client. C'était faux : `games.mode` existe depuis les
-- classements par mode, et `apply_match_result` le lit déjà.
--
-- AUCUN REDÉPLOIEMENT DE FONCTION EDGE. Plutôt que de modifier
-- `report-match-result` pour qu'elle transmette le mode, un déclencheur va le
-- chercher dans `games` au moment de l'insertion. La partie y est encore : elle
-- n'est effacée qu'une heure après sa fin, par le nettoyage périodique.
-- ============================================================

alter table public.match_records
    add column if not exists mode text;

comment on column public.match_records.mode is
    'Classement de la partie (ranked / duel13 / duel_open), recopié depuis games par déclencheur.';

create index if not exists match_records_mode_idx on public.match_records (mode, finished_at desc);

create or replace function public.fill_match_record_mode()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    -- `coalesce` et non une jointure obligatoire : si la partie a déjà été effacée, on garde
    -- l'enregistrement plutôt que de perdre une ligne d'analyse pour un champ manquant.
    if new.mode is null then
        new.mode := (select g.mode from public.games g where g.id = new.game_id);
    end if;
    return new;
end;
$$;

drop trigger if exists match_records_fill_mode on public.match_records;
create trigger match_records_fill_mode
    before insert on public.match_records
    for each row execute function public.fill_match_record_mode();

-- Reprise de ce qui est encore récupérable : les parties effacées depuis plus
-- d'une heure ne le sont plus, et resteront à `null`. C'est précisément la
-- donnée que l'on cesse de perdre à partir d'aujourd'hui.
update public.match_records r
   set mode = g.mode
  from public.games g
 where g.id = r.game_id and r.mode is null;
