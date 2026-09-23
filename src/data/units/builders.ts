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
    /** Rôle de combat franc, s'il y en a un. Omis = polyvalent (voir GodCard.archetype). */
    arch?: 'glass_cannon' | 'tank' | 'support';
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
        archetype: u.arch,
        /**
         * TOUT ce bestiaire est marqué « brouillon » : portraits, images de sorts et effets ont
         * été produits automatiquement, sans reprise manuelle. La règle de contenu de la v1.0
         * est qu'une unité ne sort que si elle a été réellement dessinée et validée.
         *
         * Le code et les tests d'équilibrage restent en place : ces unités sont la base de
         * travail des créatures à venir (Cyclopes, Cerbère, Harpies...). Il suffira de retirer
         * ce drapeau, unité par unité, à mesure qu'elles seront reprises.
         */
        draft: true,
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
    desc: string;
    /** Au moins un effet : une carte sans effet est refusée par les tests de structure. */
    effects: SpellEffect[];
}

/**
 * Courbe de coûts imposée à TOUTE unité : 2 générateurs gratuits, 2 compétences à 1, 1
 * utilitaire à 3 — le même gabarit que 17 des 20 dieux du roster.
 *
 * Le coût est déduit de la POSITION dans le kit et n'est pas paramétrable : les 48 unités du
 * bestiaire avaient dérivé vers 9 courbes différentes (0,0,2,2,3 / 0,0,1,2,2 / …), ce qui
 * rendait leur puissance incomparable d'une unité à l'autre. En le rendant positionnel, la
 * dérive redevient impossible.
 *
 * Conséquence de conception : l'utilitaire est la carte CHÈRE de l'unité, donc c'est là que doit
 * vivre son effet signature — pas dans une compétence.
 */
export const KIT_COSTS = { generator: 0, competence: 1, utility: 3 } as const;

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
            cost: KIT_COSTS[type],
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

// ─────────────────────────────────────────────
// Unités PUBLIÉES
// ─────────────────────────────────────────────

/*
 * Tout ce qui suit sert les unités reprises à la main — dessinées, équilibrées, jouables — par
 * opposition aux 48 unités `draft` ci-dessus, produites automatiquement et invisibles en jeu.
 *
 * Trois choses les séparent, et aucune n'est cosmétique :
 *
 *  1. LES CHEMINS D'IMAGES. Une unité brouillon réutilise son portrait pour ses cinq sorts
 *     (`/cards/units/<id>.png` partout) : 48 illustrations au lieu de 240. Une unité publiée
 *     suit la convention du roster — portrait dans `/cards/gods/`, une image par sort dans
 *     `/cards/spells/spell_<id>_<emplacement>.png`. C'est cette convention que produit la
 *     feuille d'illustrations, et c'est l'emplacement, jamais le nom du sort, qui nomme le
 *     fichier : un sort peut être renommé sans relivrer son image.
 *
 *  2. LA COURBE DE COÛTS. `KIT_COSTS` impose 0/0/1/1/3 avec l'utilitaire en carte chère. Les
 *     unités écrites à la main suivent l'autre gabarit du roster — l'utilitaire est bon marché
 *     et c'est la SECONDE compétence qui porte le coup lourd (Arachné, Aphrodite, Ulysse font
 *     déjà ainsi). Les deux trient vers [0,0,1,1,3], donc le test de courbe est satisfait dans
 *     les deux cas ; ce qui change est l'emplacement de l'effet signature.
 *
 *  3. L'ÉNERGIE. Un générateur en produit toujours ; une carte payante a le droit d'en rendre
 *     une partie (l'Envolée Lyrique d'Apollon coûte 3 et en rend 1). `spellPower` facture déjà
 *     cette énergie, donc les plafonds de puissance continuent de mordre.
 */

/** Emplacement d'une carte dans un kit publié : nomme l'id, le fichier image, le type et le coût. */
export type Slot = 'generator_1' | 'generator_2' | 'skill_1' | 'skill_2' | 'utility_1';

const SLOTS: Record<Slot, { type: SpellType; cost: number }> = {
    generator_1: { type: 'generator', cost: 0 },
    generator_2: { type: 'generator', cost: 0 },
    skill_1: { type: 'competence', cost: 1 },
    skill_2: { type: 'competence', cost: 3 },
    utility_1: { type: 'utility', cost: 1 },
};

interface ReleasedCard {
    slot: Slot;
    name: string;
    /** Énergie produite. Obligatoire (≥1) sur un générateur, facultative ailleurs. */
    gain?: number;
    /** Texte de la carte, en français lisible — celui que l'auteur a écrit dans le tableur. */
    desc: string;
    effects: SpellEffect[];
}

interface ReleasedUnit extends UnitInput {
    kind: 'servant' | 'creature';
    /** Retenue en brouillon malgré tout : un effet signature pas encore codé, par exemple. */
    draft?: boolean;
}

/**
 * Assemble une unité publiée et ses cinq sorts.
 *
 * Le tuple de cinq cartes fait échouer la COMPILATION si un emplacement manque ou se répète,
 * plutôt que de laisser une unité incomplète filer jusqu'aux tests — ou pire, jusqu'au jeu,
 * où elle serait injouable faute de générateurs.
 */
export function released(
    u: ReleasedUnit,
    cards: [ReleasedCard, ReleasedCard, ReleasedCard, ReleasedCard, ReleasedCard],
): Bestiary {
    const band = HP_BANDS[u.kind];
    if (u.hp < band.min || u.hp > band.max) {
        throw new Error(`[units] ${u.id}: ${u.hp} PV hors de la bande ${u.kind} (${band.min}-${band.max})`);
    }

    const seen = new Set(cards.map(c => c.slot));
    if (seen.size !== 5) throw new Error(`[units] ${u.id}: emplacement de sort manquant ou répété`);

    const card: GodCard = {
        id: u.id,
        name: u.name,
        element: u.element,
        weakness: u.weakness ?? getWeakness(u.element),
        maxHealth: u.hp,
        imageUrl: `/cards/gods/${u.id}.png`,
        flavorText: u.flavor,
        hidden: u.hidden ?? false,
        category: u.kind,
        duelCost: u.kind === 'servant' ? 2 : 3,
        affiliatedTo: u.god,
        archetype: u.arch,
        ...(u.draft ? { draft: true } : {}),
    };

    return {
        units: [card],
        spells: cards.map(c => {
            if (c.effects.length === 0) throw new Error(`[units] ${u.id}_${c.slot}: aucun effet`);
            const { type, cost } = SLOTS[c.slot];
            if (type === 'generator' && !(c.gain ?? 0)) {
                throw new Error(`[units] ${u.id}_${c.slot}: un générateur doit produire de l'énergie`);
            }
            return {
                id: `${u.id}_${c.slot}`,
                name: c.name,
                godId: u.id,
                element: u.element,
                type,
                energyCost: cost,
                energyGain: c.gain ?? 0,
                effects: c.effects,
                imageUrl: `/cards/spells/spell_${u.id}_${c.slot}.png`,
                description: c.desc,
            };
        }),
    };
}

/** Effet sur mesure, résolu par un handler enregistré dans GameEngine. */
export const custom = (id: string, desc: string, target?: TargetType): SpellEffect =>
    ({ type: 'custom', customEffectId: id, target, description: desc });

/** Dégâts qui traversent le bouclier sans l'entamer. */
export const pierce = (value: number, target: TargetType = 'enemy_god'): SpellEffect =>
    ({ type: 'damage', value, target, ignoreShield: true });
