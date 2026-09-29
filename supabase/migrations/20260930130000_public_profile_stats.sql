-- ============================================================
-- GODS — Le profil d'un ami affiche les mêmes statistiques que le sien
--
-- `get_public_profile` ne renvoyait que six champs : id, pseudo, avatar, ferveur du Classé,
-- `level` et le bloc `stats`. La page d'un ami était donc trois fois plus pauvre que la sienne,
-- alors que TOUT ce qui manque est déjà dans la table `profiles`.
--
-- Ce qui s'ajoute, et pourquoi :
--   * les ferveurs des trois classements et leurs sommets — sans elles, un joueur dont le
--     meilleur classement est le Duel s'affichait au rang de son Classé, souvent à zéro ;
--   * `ferveur_earned`, le total obtenu depuis toujours, qui ne redescend jamais ;
--   * `god_play_counts`, pour le dieu le plus joué ;
--   * `gods_owned` et `achievements`, dont seul le NOMBRE sera affiché.
--
-- `level` disparaît : la colonne vaut 1 par défaut et n'est mise à jour nulle part, si bien que
-- tous les profils annonçaient « Niveau 1 » à vie.
--
-- Rien de sensible ne sort ici : ces valeurs décrivent déjà ce qu'un joueur montre de lui dans
-- les classements. L'e-mail, l'ambroisie et les sorts possédés restent hors de la fonction.
--
-- `drop` puis `create` — et non `create or replace` : Postgres refuse de changer le type de
-- retour d'une fonction existante.
-- ============================================================

drop function if exists public.get_public_profile(uuid);

create function public.get_public_profile(p_user_id uuid)
returns table (
    id uuid,
    username text,
    avatar text,
    ferveur int,
    ferveur_duel13 int,
    ferveur_duel_open int,
    ferveur_max int,
    ferveur_max_duel13 int,
    ferveur_max_duel_open int,
    ferveur_earned int,
    god_play_counts jsonb,
    gods_owned text[],
    achievements text[],
    stats jsonb
)
language sql
security definer
set search_path = public
stable
as $$
    select
        p.id, p.username, p.avatar,
        p.ferveur, p.ferveur_duel13, p.ferveur_duel_open,
        p.ferveur_max, p.ferveur_max_duel13, p.ferveur_max_duel_open,
        p.ferveur_earned,
        p.god_play_counts,
        p.gods_owned, p.achievements,
        p.stats
    from public.profiles p
    where p.id = p_user_id;
$$;

grant execute on function public.get_public_profile(uuid) to authenticated;
