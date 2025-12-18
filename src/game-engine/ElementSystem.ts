// Système de gestion des éléments et des faiblesses

import { Element } from '@/types/cards';

// Cycle élémentaire principal : Feu > Air > Terre > Foudre > Eau > Feu
const ELEMENTAL_CYCLE: Record<Element, Element> = {
    fire: 'air',       // Feu bat Air
    air: 'earth',      // Air bat Terre
    earth: 'lightning', // Terre bat Foudre
    lightning: 'water', // Foudre bat Eau
    water: 'fire',     // Eau bat Feu
    light: 'darkness', // Lumière bat Ténèbres
    darkness: 'light', // Ténèbres bat Lumière
};

// Symboles pour l'affichage
export const ELEMENT_SYMBOLS: Record<Element, string> = {
    fire: '🔥',
    air: '💨',
    earth: '🌿',
    lightning: '⚡',
    water: '💧',
    light: '☀️',
    darkness: '💀',
};

// Couleurs pour l'UI
export const ELEMENT_COLORS: Record<Element, { primary: string; secondary: string; gradient: string }> = {
    fire: {
        primary: '#FF4500',
        secondary: '#FF6B35',
        gradient: 'linear-gradient(135deg, #FF4500, #FF6B35)'
    },
    air: {
        primary: '#87CEEB',
        secondary: '#B0E0E6',
        gradient: 'linear-gradient(135deg, #87CEEB, #E0F4FF)'
    },
    earth: {
        primary: '#228B22',
        secondary: '#32CD32',
        gradient: 'linear-gradient(135deg, #228B22, #32CD32)'
    },
    lightning: {
        primary: '#FFD700',
        secondary: '#FFA500',
        gradient: 'linear-gradient(135deg, #FFD700, #FFA500)'
    },
    water: {
        primary: '#1E90FF',
        secondary: '#00BFFF',
        gradient: 'linear-gradient(135deg, #1E90FF, #00BFFF)'
    },
    light: {
        primary: '#FFFACD',
        secondary: '#FFFFE0',
        gradient: 'linear-gradient(135deg, #FFFACD, #FFF8DC)'
    },
    darkness: {
        primary: '#2F2F2F',
        secondary: '#4A4A4A',
        gradient: 'linear-gradient(135deg, #2F2F2F, #1A1A1A)'
    },
};

// Noms français des éléments
export const ELEMENT_NAMES: Record<Element, string> = {
    fire: 'Feu',
    air: 'Air',
    earth: 'Terre',
    lightning: 'Foudre',
    water: 'Eau',
    light: 'Lumière',
    darkness: 'Ténèbres',
};

/**
 * Vérifie si un élément est fort contre un autre
 */
export function isStrongAgainst(attacker: Element, defender: Element): boolean {
    return ELEMENTAL_CYCLE[attacker] === defender;
}

/**
 * Vérifie si un élément est faible contre un autre
 */
export function isWeakAgainst(attacker: Element, defender: Element): boolean {
    return ELEMENTAL_CYCLE[defender] === attacker;
}

/**
 * Calcule le multiplicateur de dégâts basé sur les éléments
 * Retourne 2 si l'attaquant frappe sur la faiblesse, 1 sinon
 */
export function getDamageMultiplier(attackElement: Element, defenderWeakness: Element): number {
    return attackElement === defenderWeakness ? 2 : 1;
}

/**
 * Obtient l'élément auquel un élément est faible
 */
export function getWeakness(element: Element): Element {
    // Trouve l'élément qui bat celui-ci
    const entries = Object.entries(ELEMENTAL_CYCLE) as [Element, Element][];
    const weakness = entries.find(([_, beats]) => beats === element);
    return weakness ? weakness[0] : element;
}

/**
 * Obtient l'élément contre lequel un élément est fort
 */
export function getStrength(element: Element): Element {
    return ELEMENTAL_CYCLE[element];
}

/**
 * Calcule les dégâts finaux avec le bonus élémentaire
 */
export function calculateDamage(
    baseDamage: number,
    attackElement: Element,
    defenderWeakness: Element
): { damage: number; isWeakness: boolean } {
    const isWeakness = attackElement === defenderWeakness;
    const multiplier = isWeakness ? 2 : 1;

    return {
        damage: baseDamage * multiplier,
        isWeakness,
    };
}

/**
 * Calcule les dégâts avec prise en compte de la faiblesse innée ET temporaire
 * Le bonus de faiblesse s'applique si l'attaque correspond à l'une OU l'autre
 */
export function calculateDamageWithDualWeakness(
    baseDamage: number,
    attackElement: Element,
    innateWeakness: Element | undefined,
    temporaryWeakness: Element | undefined
): { damage: number; isWeakness: boolean } {
    // Vérifie si l'attaque correspond à l'une des deux faiblesses
    const matchesInnate = innateWeakness && attackElement === innateWeakness;
    const matchesTemporary = temporaryWeakness && attackElement === temporaryWeakness;
    const isWeakness = !!(matchesInnate || matchesTemporary);
    const multiplier = isWeakness ? 2 : 1;

    return {
        damage: baseDamage * multiplier,
        isWeakness,
    };
}
