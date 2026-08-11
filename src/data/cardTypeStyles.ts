import type { SpellType } from '@/types/cards';

/**
 * Identité visuelle par type de carte (façon Yu-Gi-Oh : Sort/Piège/Rituel se reconnaissent au
 * cadre avant même de lire le texte). Le type était jusqu'ici invisible dans la main -- seule
 * la description le révélait -- alors que l'élément a déjà sa propre couleur (bordure). On donne
 * donc au type un canal distinct : couleur de bandeau + icône, pour rester lisible à côté de la
 * couleur d'élément plutôt qu'en concurrence avec elle.
 */
export const CARD_TYPE_META: Record<SpellType, { label: string; icon: string; color: string }> = {
    generator: { label: 'Générateur', icon: '⚡', color: '#22d3ee' },
    competence: { label: 'Compétence', icon: '⚔️', color: '#f97316' },
    utility: { label: 'Utilitaire', icon: '🔧', color: '#a78bfa' },
};

export function getCardTypeMeta(type: SpellType) {
    return CARD_TYPE_META[type];
}
