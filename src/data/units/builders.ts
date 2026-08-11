import type { GodCard, SpellCard, SpellEffect, SpellType, Element, StatusEffect, TargetType } from '@/types/cards';
import { getWeakness } from '@/game-engine/ElementSystem';

/**
 * Fabriques compactes pour le bestiaire (serviteurs & créatures).
 *
 * Sans ces helpers, une unité complète (carte + 5 sorts) pèse ~90 lignes de littéraux ; avec,
 * elle en pèse ~20. C'est ce qui permet de tenir 4 unités par fichier de dieu sous la limite
 * de 400 lignes, au lieu d'un `spells.ts` monolithique qui dépasse déjà 2500 lignes.
 */

// ─────────────────────────────────────────────
// Effets (raccourcis)
// ─────────────────────────────────────────────

export const dmg = (value: number, target: TargetType = 'enemy_god'): SpellEffect => ({ type: 'damage', value, target });
export const heal = (value: number, target: TargetType = 'ally_god'): SpellEffect => ({ type: 'heal', value, target });
export const shield = (value: number, target: TargetType = 'self'): SpellEffect => ({ type: 'shield', value, target });
export const energy = (value: number): SpellEffect => ({ type: 'energy', value, target: 'self' });
export const draw = (value: number): SpellEffect => ({ type: 'draw', value, target: 'self' });
export const mill = (value: number, target: TargetType = 'enemy_god'): SpellEffect => ({ type: 'mill', value, target });
export const discard = (value: number, target: TargetType = 'enemy_hand'): SpellEffect => ({ type: 'discard', value, target });

export const status = (
    s: StatusEffect, stacks: number, target: TargetType = 'enemy_god', duration?: number
): SpellEffect => ({ type: 'status', value: stacks, status: s, target, statusDuration: duration });

export const cleanse = (s: StatusEffect, target: TargetType = 'ally_god'): SpellEffect => ({ type: 'remove_status', status: s, target });

// ─────────────────────────────────────────────
// Cartes d'unité
// ─────────────────────────────────────────────

/** Bandes de PV par catégorie. La hiérarchie réelle est vérifiée par power.ts, pas par les PV. */
export const HP_BANDS = {
    servant: { min: 10, max: 18 },
    creature: { min: 19, max: 28 },
} as const;

interface UnitInput {
    id: string;
    name: string;
    element: Element;
    /** Optionnelle : par défaut, la faiblesse découle du cycle élémentaire du jeu. */
    weakness?: Element;
    hp: number;
    /** Dieu de rattachement (l'un des 12 du roster). */
    god: string;
    flavor: string;
    /** Unité réservée au mode Histoire / Ascension, invisible en Duel et en boutique. */
    hidden?: boolean;
}

function unit(kind: 'servant' | 'creature', u: UnitInput): GodCard {
    const band = HP_BANDS[kind];
    if (u.hp < band.min || u.hp > band.max) {
        throw new Error(`[units] ${u.id}: ${u.hp} PV hors de la bande ${kind} (${band.min}-${band.max})`);
    }
    return {
        id: u.id,
        name: u.name,
        element: u.element,
        weakness: u.weakness ?? getWeakness(u.element),
        maxHealth: u.hp,
        imageUrl: `/cards/units/${u.id}.png`,
        flavorText: u.flavor,
        hidden: u.hidden ?? false,
        category: kind,
        duelCost: kind === 'servant' ? 2 : 3,
        affiliatedTo: u.god,
    };
}

export const servant = (u: UnitInput): GodCard => unit('servant', u);
export const creature = (u: UnitInput): GodCard => unit('creature', u);

// ─────────────────────────────────────────────
// Sorts
// ─────────────────────────────────────────────

interface SpellInput {
    id: string;
    name: string;
    /** Id de l'unité qui porte ce sort (équivaut à `godId`). */
    unit: string;
    element: Element;
    type: SpellType;
    /** Coût en énergie. 0 pour les générateurs. */
    cost?: number;
    /** Énergie produite en jouant la carte. */
    gain?: number;
    desc: string;
    effects: SpellEffect[];
}

/** Carte d'un kit : le type, l'élément et le préfixe d'id sont déduits de sa place dans le kit. */
interface KitCard {
    /** Suffixe d'id ; l'id final est `<unitId>_<id>`. */
    id: string;
    name: string;
    /** Générateurs : énergie produite (≥1). Ignoré pour les autres types. */
    gain?: number;
    /** Compétences/utilitaires : coût en énergie. Ignoré pour les générateurs (toujours 0). */
    cost?: number;
    desc: string;
    /** Au moins un effet : une carte sans effet est refusée par les tests de structure. */
    effects: SpellEffect[];
}

/**
 * Composition imposée d'un deck d'unité : 2 générateurs, 2 compétences, 1 utilitaire.
 *
 * Ce n'est pas qu'une convention d'affichage : sans 2 générateurs, une équipe ne produit pas
 * assez d'énergie pour jouer ses cartes chères et s'asphyxie (l'IA de l'Ascension en premier).
 * Les types tuple font échouer la COMPILATION si le compte est faux, plutôt que de laisser
 * passer une unité injouable jusqu'aux tests.
 */
interface Kit {
    generators: [KitCard, KitCard];
    competences: [KitCard, KitCard];
    utility: KitCard;
}

/**
 * Assemble une unité et ses 5 sorts. L'élément des sorts est celui de l'unité (exigé par les
 * tests de cohérence), et les ids sont préfixés par celui de l'unité pour rester uniques.
 */
export function kit(card: GodCard, k: Kit): Bestiary {
    const mk = (c: KitCard, type: SpellType): SpellCard => {
        if (c.effects.length === 0) throw new Error(`[units] ${card.id}_${c.id}: aucun effet`);
        return spell({
            id: `${card.id}_${c.id}`,
            name: c.name,
            unit: card.id,
            element: card.element,
            type,
            cost: type === 'generator' ? 0 : (c.cost ?? 0),
            gain: type === 'generator' ? (c.gain ?? 1) : 0,
            desc: c.desc,
            effects: c.effects,
        });
    };
    return {
        units: [card],
        spells: [
            ...k.generators.map(c => mk(c, 'generator')),
            ...k.competences.map(c => mk(c, 'competence')),
            mk(k.utility, 'utility'),
        ],
    };
}

/** Fusionne les kits d'un dieu en un seul bestiaire. */
export function mergeKits(...kits: Bestiary[]): Bestiary {
    return {
        units: kits.flatMap(k => k.units),
        spells: kits.flatMap(k => k.spells),
    };
}

export function spell(s: SpellInput): SpellCard {
    return {
        id: s.id,
        name: s.name,
        godId: s.unit,
        element: s.element,
        type: s.type,
        energyCost: s.cost ?? 0,
        energyGain: s.gain ?? 0,
        effects: s.effects,
        // Les sorts du bestiaire réutilisent le portrait de leur unité : 48 illustrations à
        // générer au lieu de 240, et surtout aucune image manquante (HeroCard/SpellCardUI
        // affichent l'image telle quelle, un chemin absent donnerait une icône cassée).
        imageUrl: `/cards/units/${s.unit}.png`,
        description: s.desc,
    };
}

/** Un bestiaire de dieu : ses serviteurs/créatures et l'intégralité de leurs sorts. */
export interface Bestiary {
    units: GodCard[];
    spells: SpellCard[];
}
