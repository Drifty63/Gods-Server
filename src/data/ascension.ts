import type { GodCard } from '@/types/cards';
import { ALL_GODS } from './gods';

/**
 * Mode Ascension : 15 étages enchaînés, sans soin entre les combats.
 *
 * La composition de chaque étage est FIXE en difficulté (combien de serviteurs / créatures /
 * dieux) mais ALÉATOIRE en contenu (lesquels), afin que deux ascensions ne se ressemblent pas
 * tout en gardant une courbe de difficulté maîtrisée. Le tirage est semé : un même seed rejoue
 * exactement la même tour, ce qui rend une partie reproductible (utile pour déboguer un run et
 * pour, plus tard, vérifier une progression côté serveur).
 */

export const TOTAL_FLOORS = 15;

export type UnitTier = 'servant' | 'creature' | 'god';

/**
 * Composition par étage : [serviteurs, créatures, dieux].
 *
 * Trois paliers NETS, dans cet ordre : serviteurs, puis créatures, puis dieux. C'est exactement
 * ce que l'écran d'accueil du mode annonce au joueur (« Étages 1-5 Serviteurs / 6-12 Créatures /
 * 13-15 Dieux »), et c'est ce qui rend la montée lisible : on sait toujours à quoi s'attendre.
 *
 * La version précédente était un dégradé continu qui contredisait cette promesse sur deux
 * paliers sur trois : un dieu surgissait dès l'étage 6, l'étage 5 annoncé « Serviteurs » ne
 * contenait que des créatures, et les étages 9 à 12 — annoncés « Créatures » — étaient déjà
 * majoritairement peuplés de dieux.
 */
const FLOOR_COMPOSITION: readonly (readonly [number, number, number])[] = [
    // Palier 1 — serviteurs (étages 1 à 5)
    [4, 0, 0],
    [4, 0, 0],
    [4, 0, 0],
    [4, 0, 0],
    [4, 0, 0],
    // Palier 2 — créatures (étages 6 à 12)
    [0, 4, 0],
    [0, 4, 0],
    [0, 4, 0],
    [0, 4, 0],
    [0, 4, 0],
    [0, 4, 0],
    [0, 4, 0],
    // Palier 3 — dieux (étages 13 à 15), sans reprendre de PV
    [0, 0, 4],
    [0, 0, 4],
    [0, 0, 4],
] as const;

/**
 * Chaque étage compte exactement 4 adversaires : c'est la taille d'équipe que gèrent le plateau
 * (4 emplacements par camp) et `createDeck` (1 à 4 unités, 5 cartes chacune). Une composition
 * plus large casserait la construction du deck ennemi.
 */
export const ENEMIES_PER_FLOOR = 4;

export interface AscensionFloor {
    /** Numéro d'étage, de 1 à TOTAL_FLOORS. */
    floor: number;
    /** Ids des adversaires (unités et/ou dieux), dans l'ordre d'affichage. */
    enemyIds: string[];
    /** Palier dominant de l'étage, pour l'affichage (couleur, libellé). */
    tier: UnitTier;
}

// ─────────────────────────────────────────────
// Tirage semé
// ─────────────────────────────────────────────

/** PRNG déterministe (mulberry32) : même seed ⇒ même tour. */
function makeRng(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Tire `count` éléments distincts du pool. Si le pool est plus petit que `count`, on autorise
 * les répétitions plutôt que de rendre un étage incomplet (cas des paliers à 4 dieux tirés
 * parmi un roster réduit).
 */
function pick<T>(pool: readonly T[], count: number, rng: () => number): T[] {
    if (pool.length === 0) return [];
    const remaining = [...pool];
    const out: T[] = [];
    for (let i = 0; i < count; i++) {
        if (remaining.length === 0) remaining.push(...pool);
        const idx = Math.floor(rng() * remaining.length);
        out.push(remaining.splice(idx, 1)[0]);
    }
    return out;
}

// ─────────────────────────────────────────────
// Réservoirs d'adversaires
// ─────────────────────────────────────────────

/**
 * Les adversaires de l'Ascension incluent les unités marquées `hidden` (exclusives au mode
 * Histoire) : « caché » ne concerne que ce que le JOUEUR peut posséder ou jouer, pas ce que le
 * jeu peut lui opposer. Cela élargit nettement la variété du bestiaire disponible.
 */
export function enemyPools(): Record<UnitTier, GodCard[]> {
    return {
        // `draft` exclut en revanche le bestiaire encore à l'état de brouillon : contrairement à
        // `hidden`, il signifie « pas prêt à être montré », donc pas davantage comme adversaire.
        servant: ALL_GODS.filter(g => g.category === 'servant' && !g.draft),
        creature: ALL_GODS.filter(g => g.category === 'creature' && !g.draft),
        // Seuls les 12 dieux jouables : les dieux cachés du roster ne sont pas équilibrés
        // comme adversaires d'un mode chronométré par les PV.
        god: ALL_GODS.filter(g => (!g.category || g.category === 'god') && !g.hidden),
    };
}

/** Palier dominant : celui qui pèse le plus lourd dans la composition de l'étage. */
function dominantTier(s: number, c: number, g: number): UnitTier {
    if (g >= c && g >= s && g > 0) return 'god';
    if (c >= s && c > 0) return 'creature';
    return 'servant';
}

/**
 * Construit les 15 étages d'une ascension.
 *
 * @param seed graine du tirage ; conservez-la pour rejouer exactement la même tour.
 */
export function generateAscensionRun(seed: number): AscensionFloor[] {
    const rng = makeRng(seed);
    const pools = enemyPools();

    return FLOOR_COMPOSITION.map(([nServants, nCreatures, nGods], i) => {
        const enemies = [
            ...pick(pools.servant, nServants, rng),
            ...pick(pools.creature, nCreatures, rng),
            ...pick(pools.god, nGods, rng),
        ];
        return {
            floor: i + 1,
            enemyIds: enemies.map(e => e.id),
            tier: dominantTier(nServants, nCreatures, nGods),
        };
    });
}

export const TIER_LABELS: Record<UnitTier, { label: string; color: string; icon: string }> = {
    servant: { label: 'Serviteurs', color: '#22c55e', icon: '👤' },
    creature: { label: 'Créatures', color: '#f59e0b', icon: '🐉' },
    god: { label: 'Dieux', color: '#ef4444', icon: '⚡' },
};

/**
 * Ambroisie gagnée en franchissant un étage. Croissante pour que grimper haut vaille mieux que
 * refaire les premiers étages en boucle.
 */
export function floorReward(floor: number): number {
    return 10 + floor * 5;
}

/**
 * Bonus de PREMIÈRE ascension, accordé une seule fois par étage et par profil.
 *
 * À ne pas confondre avec `floorReward`, qui récompense chaque run. Celui-ci est la vraie
 * récompense de progression : franchir un étage inédit rapporte gros, le refranchir ne rapporte
 * plus rien. C'est ce qui permet de récompenser généreusement sans ouvrir une boucle de farm.
 *
 * Le barème est dupliqué dans `ascension_floor_bonus()` côté Postgres, qui fait autorité — cette
 * fonction ne sert qu'à ANNONCER au joueur ce qu'il peut gagner.
 */
export function ascensionFloorBonus(floor: number): number {
    if (floor >= 1 && floor <= 5) return 100;
    if (floor >= 6 && floor <= 10) return 200;
    if (floor >= 11 && floor <= 15) return 600;
    return 0;
}

/** Total des bonus de première ascension d'une tour entière : 500 + 1000 + 3000. */
export const TOTAL_FIRST_CLEAR_BONUS = Array.from(
    { length: TOTAL_FLOORS },
    (_, i) => ascensionFloorBonus(i + 1),
).reduce((a, b) => a + b, 0);
