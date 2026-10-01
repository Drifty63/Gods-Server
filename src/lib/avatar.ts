/**
 * Résout l'avatar stocké sur un profil.
 *
 * `profiles.avatar` contient soit un EMOJI, choisi à l'inscription, soit un CHEMIN d'image pour
 * les comptes plus anciens qui pouvaient prendre un portrait de dieu. Ce champ vit en base : on
 * ne peut pas le réécrire depuis le code, et un compte qui n'ouvre jamais le jeu garde sa valeur
 * pour toujours.
 *
 * Le passage des illustrations en WebP a donc cassé ces chemins-là, et eux seuls. Plutôt qu'une
 * migration qui devrait deviner quels chemins existaient à quelle époque, on ramène l'ancienne
 * extension vers la nouvelle au moment de l'AFFICHAGE : c'est réversible, ça ne touche à aucune
 * donnée, et un avatar déjà en `.webp` traverse la fonction sans changer.
 */

/** Dossiers dont les images ont été converties (voir scripts/toWebp.mjs). */
const CONVERTED = /^\/(cards|story|assets|backgrounds|images)\//;

/** Un avatar est une image quand c'est un chemin ; sinon c'est un emoji. */
export function isAvatarImage(avatar: string | null | undefined): boolean {
    return !!avatar && avatar.startsWith('/');
}

export function resolveAvatarUrl(avatar: string): string {
    if (!CONVERTED.test(avatar)) return avatar;
    return avatar.replace(/\.(png|jpe?g)$/i, '.webp');
}
