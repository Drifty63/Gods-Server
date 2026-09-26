/**
 * Catalogue des hauts faits.
 *
 * Chaque entrée porte un prédicat PUR sur les données du profil : aucune dépendance à React,
 * au moteur ou au réseau. C'est ce qui permet de les tester un par un, et d'évaluer la liste
 * entière en une passe à l'ouverture du profil sans requête supplémentaire.
 *
 * Les identifiants sont stockés dans `profiles.achievements` (colonne déclarée depuis l'origine
 * et restée inutilisée jusqu'ici). Ils ne doivent JAMAIS être renommés : un identifiant qui
 * change fait disparaître le haut fait des profils qui l'avaient débloqué.
 *
 * Un haut fait ne se reverrouille pas. Le prédicat peut redevenir faux — une série de victoires
 * se brise, la ferveur retombe à la remise à zéro d'une saison — mais l'identifiant reste acquis.
 */

import { RANKS } from './ranks';

/** Vue minimale du profil dont dépendent les prédicats. */
export interface AchievementProfile {
    gods_owned: string[];
    stats: {
        victories: number;
        defeats: number;
        totalGames: number;
        currentStreak: number;
        bestStreak: number;
    };
    ferveur: number;
    /** Absent tant que la migration des sommets n'est pas appliquée. */
    ferveur_max?: number;
    ascension_best_floor: number;
    god_play_counts: Record<string, number>;
    /** Chapitres du mode Histoire terminés, lus depuis le magasin local. */
    completedChapters?: string[];
    /**
     * Nombre d'amis acceptés. Absent tant que la liste n'a pas été chargée — les hauts faits
     * sociaux restent alors verrouillés au lieu de se croire mérités à zéro ami.
     */
    friendCount?: number;
}

export type AchievementFamily = 'collection' | 'combat' | 'ascension' | 'histoire' | 'classement' | 'social';

export interface Achievement {
    /** Identifiant persistant. Ne jamais renommer. */
    id: string;
    name: string;
    description: string;
    icon: string;
    family: AchievementFamily;
    /** Vrai quand le haut fait est mérité. Doit rester pur et sans effet de bord. */
    isUnlocked: (p: AchievementProfile) => boolean;
}

/** Nombre de dieux du set de base, qui borne les hauts faits de collection. */
const BASE_GODS = 12;

const DIAMANT = RANKS.find(r => r.name === 'Diamant')?.minFerveur ?? 1500;
const DEMI_DIEUX = RANKS.find(r => r.name === 'Demi-Dieux')?.minFerveur ?? 2000;

/**
 * Dieux du set de base réellement possédés.
 *
 * `gods_owned` contient aussi les créatures et serviteurs, dont les identifiants portent tous un
 * souligné (`soldier_ares_1`, `giant_spider_2`). Sans ce filtre, « Panthéon complet » se
 * débloquerait en achetant des unités.
 */
function baseGodsOwned(p: AchievementProfile): number {
    return p.gods_owned.filter(id => !id.includes('_')).length;
}

/** Ferveur la plus haute jamais atteinte, à l'épreuve des remises à zéro de saison. */
function peakFerveur(p: AchievementProfile): number {
    // `?? 0` : entre le déploiement du code et l'application de la migration, la colonne
    // n'existe pas encore et le champ arrive `undefined`. `Math.max` renverrait NaN, et NaN
    // n'est jamais `>=` : le haut fait deviendrait silencieusement impossible à obtenir.
    return Math.max(p.ferveur, p.ferveur_max ?? 0);
}

export const ACHIEVEMENTS: Achievement[] = [
    // ---------------------------------------------------------------- Collection
    {
        id: 'collection_first',
        name: 'Premier fidèle',
        description: 'Posséder un deuxième dieu.',
        icon: '🃏',
        family: 'collection',
        isUnlocked: p => baseGodsOwned(p) >= 2,
    },
    {
        id: 'collection_half',
        name: 'Demi-panthéon',
        description: `Posséder ${BASE_GODS / 2} dieux du set de base.`,
        icon: '🏛️',
        family: 'collection',
        isUnlocked: p => baseGodsOwned(p) >= BASE_GODS / 2,
    },
    {
        id: 'collection_full',
        name: 'Panthéon complet',
        description: `Posséder les ${BASE_GODS} dieux du set de base.`,
        icon: '👑',
        family: 'collection',
        isUnlocked: p => baseGodsOwned(p) >= BASE_GODS,
    },

    // -------------------------------------------------------------------- Combat
    {
        id: 'combat_first_win',
        name: 'Première offrande',
        description: 'Remporter une partie.',
        icon: '⚔️',
        family: 'combat',
        isUnlocked: p => p.stats.victories >= 1,
    },
    {
        id: 'combat_win_25',
        name: 'Vétéran',
        description: 'Remporter 25 parties.',
        icon: '🛡️',
        family: 'combat',
        isUnlocked: p => p.stats.victories >= 25,
    },
    {
        id: 'combat_win_100',
        name: 'Légende vivante',
        description: 'Remporter 100 parties.',
        icon: '🔱',
        family: 'combat',
        isUnlocked: p => p.stats.victories >= 100,
    },
    {
        id: 'combat_streak_5',
        name: 'Faveur des dieux',
        description: 'Enchaîner 5 victoires.',
        icon: '🔥',
        family: 'combat',
        isUnlocked: p => p.stats.bestStreak >= 5,
    },
    {
        id: 'combat_streak_10',
        name: 'Invaincu',
        description: 'Enchaîner 10 victoires.',
        icon: '☄️',
        family: 'combat',
        isUnlocked: p => p.stats.bestStreak >= 10,
    },
    {
        id: 'combat_devoted',
        name: 'Dévotion',
        description: 'Jouer 50 fois le même dieu.',
        icon: '🕯️',
        family: 'combat',
        isUnlocked: p => Object.values(p.god_play_counts).some(n => n >= 50),
    },

    // ----------------------------------------------------------------- Ascension
    {
        id: 'ascension_tier_1',
        name: 'Premiers degrés',
        description: 'Franchir le 5e étage de la tour.',
        icon: '🪜',
        family: 'ascension',
        isUnlocked: p => p.ascension_best_floor >= 5,
    },
    {
        id: 'ascension_tier_2',
        name: 'Chasseur de monstres',
        description: 'Franchir le 12e étage de la tour.',
        icon: '🐉',
        family: 'ascension',
        isUnlocked: p => p.ascension_best_floor >= 12,
    },
    {
        id: 'ascension_summit',
        name: 'Sommet de la tour',
        description: 'Franchir les 15 étages.',
        icon: '🏔️',
        family: 'ascension',
        isUnlocked: p => p.ascension_best_floor >= 15,
    },

    // ------------------------------------------------------------------ Histoire
    {
        id: 'story_chapter_1',
        name: 'Ombre sur Olympe',
        description: 'Terminer le chapitre 1.',
        icon: '📖',
        family: 'histoire',
        isUnlocked: p => (p.completedChapters ?? []).includes('chapter1'),
    },
    {
        id: 'story_chapter_2',
        name: 'La route de Thèbes',
        description: 'Terminer le chapitre 2.',
        icon: '📜',
        family: 'histoire',
        isUnlocked: p => (p.completedChapters ?? []).includes('chapter2'),
    },
    {
        id: 'story_chapter_3',
        name: 'Le cap Ténare',
        description: 'Terminer le chapitre 3.',
        icon: '⛵',
        family: 'histoire',
        isUnlocked: p => (p.completedChapters ?? []).includes('chapter3'),
    },
    {
        id: 'story_chapter_4',
        name: 'La reprise de l\'Olympe',
        description: 'Terminer le chapitre 4.',
        icon: '⚡',
        family: 'histoire',
        isUnlocked: p => (p.completedChapters ?? []).includes('chapter4'),
    },

    // -------------------------------------------------------------------- Social
    /*
     * `friendCount` est ABSENT tant que la liste d'amis n'est pas chargée, et `?? -1` verrouille
     * alors ces quatre hauts faits. Avec `?? 0`, « Première poignée de main » resterait verrouillé
     * à juste titre, mais n'importe quel seuil à 0 se serait débloqué tout seul — et un haut fait
     * ne se reverrouille jamais.
     */
    {
        id: 'social_friend_1',
        name: 'Première poignée de main',
        description: 'Compter 1 ami.',
        icon: '🤝',
        family: 'social',
        isUnlocked: p => (p.friendCount ?? -1) >= 1,
    },
    {
        id: 'social_friend_5',
        name: 'Cercle proche',
        description: 'Compter 5 amis.',
        icon: '👥',
        family: 'social',
        isUnlocked: p => (p.friendCount ?? -1) >= 5,
    },
    {
        id: 'social_friend_10',
        name: 'Assemblée',
        description: 'Compter 10 amis.',
        icon: '🏛️',
        family: 'social',
        isUnlocked: p => (p.friendCount ?? -1) >= 10,
    },
    {
        id: 'social_friend_25',
        name: 'Grande maisonnée',
        description: 'Compter 25 amis.',
        icon: '🏺',
        family: 'social',
        isUnlocked: p => (p.friendCount ?? -1) >= 25,
    },
    {
        /*
         * Le dernier palier suit le plafond réel de la liste d'amis (MAX_FRIENDS), et non un
         * chiffre rond choisi à part : un haut fait « le maximum » qui ne serait pas celui du
         * jeu deviendrait faux au premier changement de limite. Il n'importe pas la constante
         * pour autant — ce fichier doit rester sans dépendance, chaque prédicat étant une
         * fonction pure sur le profil.
         */
        id: 'social_friend_50',
        name: 'Panthéon d\'alliés',
        description: 'Compter 50 amis, le maximum.',
        icon: '🌟',
        family: 'social',
        isUnlocked: p => (p.friendCount ?? -1) >= 50,
    },

    // ---------------------------------------------------------------- Classement
    {
        id: 'rank_diamant',
        name: 'Éclat du diamant',
        description: `Atteindre ${DIAMANT} de ferveur.`,
        icon: '💎',
        family: 'classement',
        isUnlocked: p => peakFerveur(p) >= DIAMANT,
    },
    {
        id: 'rank_demigod',
        name: 'Parmi les demi-dieux',
        description: `Atteindre ${DEMI_DIEUX} de ferveur.`,
        icon: '⭐',
        family: 'classement',
        isUnlocked: p => peakFerveur(p) >= DEMI_DIEUX,
    },
];

export const FAMILY_LABELS: Record<AchievementFamily, string> = {
    collection: 'Collection',
    combat: 'Combat',
    ascension: 'Ascension',
    histoire: 'Histoire',
    classement: 'Classement',
    social: 'Social',
};

/**
 * Hauts faits mérités mais pas encore enregistrés.
 *
 * Renvoie uniquement les NOUVEAUX : les rejouer à chaque ouverture du profil ferait réécrire la
 * colonne pour rien, et surtout renotifierait le joueur d'un haut fait déjà obtenu.
 */
export function newlyUnlocked(p: AchievementProfile, already: string[]): string[] {
    const owned = new Set(already);
    return ACHIEVEMENTS.filter(a => !owned.has(a.id) && a.isUnlocked(p)).map(a => a.id);
}

export function getAchievement(id: string): Achievement | undefined {
    return ACHIEVEMENTS.find(a => a.id === id);
}
