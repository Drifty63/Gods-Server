import { ELEMENT_COLORS } from '@/game-engine/ElementSystem';
import { getGodById } from '@/data/gods';

/**
 * Couleur d'un personnage qui parle, pour le halo de son portrait.
 *
 * DEUX sources, dans cet ordre :
 *
 *  1. une couleur choisie à la main ci-dessous, quand le personnage en a une. Ce sont des
 *     couleurs de PERSONNAGE et non d'élément — le rose d'Aphrodite, le pourpre d'Hadès — et
 *     elles valent mieux que ce qu'un calcul produirait ;
 *  2. sinon, la couleur de son ÉLÉMENT, lue dans la carte.
 *
 * Le repli valait auparavant un or fixe, et cette table était recopiée dans deux fichiers — dont
 * l'un avait déjà perdu le narrateur et Arachné en route. Résultat : tous les personnages absents
 * de la table parlaient sous un halo doré, celui de Zeus. Ulysse, dieu de l'Eau, s'affichait en
 * jaune ; Thanatos, le Chevalier d'Athéna et Méduse aussi.
 *
 * Avec le repli par élément, un personnage ajouté à l'histoire reçoit une couleur juste sans
 * qu'on ait à penser à l'inscrire ici.
 */
const CHARACTER_COLORS: Record<string, string> = {
    narrator: '#d4a574',  // Parchemin doré
    zeus: '#ffd700',      // Or/Foudre
    hestia: '#ff6b35',    // Orange/Feu
    aphrodite: '#ff69b4', // Rose
    dionysos: '#9b59b6',  // Violet
    hades: '#4a0080',     // Violet sombre
    nyx: '#1a1a2e',       // Bleu très sombre
    apollon: '#87ceeb',   // Bleu ciel
    ares: '#dc143c',      // Rouge sang
    poseidon: '#00bfff',  // Bleu océan
    athena: '#f0e68c',    // Jaune doré
    demeter: '#228b22',   // Vert forêt
    artemis: '#c0c0c0',   // Argent
    arachne: '#8b0000',   // Rouge sombre (araignée)
};

/** Dernier recours : ni couleur de personnage, ni carte connue. */
const DEFAULT_SPEAKER_COLOR = '#d4a574';

export function getSpeakerColor(speakerId: string): string {
    const authored = CHARACTER_COLORS[speakerId];
    if (authored) return authored;

    const card = getGodById(speakerId);
    if (card) return ELEMENT_COLORS[card.element].primary;

    return DEFAULT_SPEAKER_COLOR;
}
