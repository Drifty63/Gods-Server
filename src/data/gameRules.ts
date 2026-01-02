/**
 * ============================================
 * GODS - DOCUMENTATION DES RÈGLES DU JEU
 * ============================================
 * 
 * Ce fichier documente les règles officielles du jeu de cartes GODS.
 * Il sert de référence pour les développeurs et pour générer la documentation.
 * 
 * @version 1.0
 * @lastUpdate 2026-01-02
 */

/**
 * CONFIGURATION DE BASE
 * ---------------------
 */
export const GAME_CONFIG = {
    /** Nombre de dieux par équipe */
    GODS_PER_TEAM: 3,

    /** Taille maximale de la main */
    MAX_HAND_SIZE: 5,

    /** Énergie de départ */
    STARTING_ENERGY: 0,

    /** Énergie maximale */
    MAX_ENERGY: 10,

    /** Nombre de tours maximal avant match nul */
    MAX_TURNS: 40,

    /** Nombre de cartes dans le deck initial par dieu */
    CARDS_PER_GOD: 5,
} as const;

/**
 * SYSTÈME D'ÉLÉMENTS
 * ------------------
 * Le jeu utilise un système de 7 éléments avec des faiblesses circulaires.
 */
export const ELEMENTS = {
    fire: {
        name: 'Feu',
        symbol: '🔥',
        weakness: 'water',
        description: 'Élément offensif, brûle et consume'
    },
    water: {
        name: 'Eau',
        symbol: '💧',
        weakness: 'lightning',
        description: 'Élément défensif, apaise et protège'
    },
    earth: {
        name: 'Terre',
        symbol: '🌿',
        weakness: 'air',
        description: 'Élément stable, renforce et guérit'
    },
    air: {
        name: 'Air',
        symbol: '💨',
        weakness: 'fire',
        description: 'Élément mobile, esquive et manipule'
    },
    lightning: {
        name: 'Foudre',
        symbol: '⚡',
        weakness: 'earth',
        description: 'Élément chaotique, stun et marque'
    },
    light: {
        name: 'Lumière',
        symbol: '☀️',
        weakness: 'darkness',
        description: 'Élément pur, soigne et protège'
    },
    darkness: {
        name: 'Ténèbres',
        symbol: '💀',
        weakness: 'light',
        description: 'Élément mortel, maudit et ressuscite'
    }
} as const;

/**
 * TYPES DE CARTES
 * ---------------
 */
export const CARD_TYPES = {
    generator: {
        name: 'Générateur',
        icon: '🔋',
        description: 'Génère de l\'énergie (+1 à +3). Coût 0, effet modéré.'
    },
    competence: {
        name: 'Compétence',
        icon: '⚔️',
        description: 'Sort puissant. Coût élevé (1-4 énergie), effet fort.'
    },
    utility: {
        name: 'Utilitaire',
        icon: '🛠️',
        description: 'Sort de support. Effets variés (pioche, protection, etc.)'
    }
} as const;

/**
 * EFFETS DE STATUT
 * ----------------
 */
export const STATUS_EFFECTS = {
    poison: {
        name: 'Poison',
        icon: '🧪',
        description: 'Inflige X dégâts à la fin de chaque tour. Les dégâts ignorent le bouclier.',
        stackable: true
    },
    shield: {
        name: 'Bouclier',
        icon: '🛡️',
        description: 'Absorbe X dégâts avant les PV. Se consomme lors des attaques.',
        stackable: true
    },
    frozen: {
        name: 'Gelé',
        icon: '❄️',
        description: 'Le dieu ne peut pas attaquer pendant X tours.',
        stackable: false
    },
    stunned: {
        name: 'Étourdi',
        icon: '💫',
        description: 'Le dieu passe son prochain tour.',
        stackable: false
    },
    lightning_mark: {
        name: 'Marque de Foudre',
        icon: '⚡',
        description: 'Les prochains dégâts reçus sont doublés.',
        stackable: false
    },
    provocation: {
        name: 'Provocation',
        icon: '🗡️',
        description: 'Force les ennemis à cibler ce dieu en priorité.',
        stackable: false
    },
    burn: {
        name: 'Brûlure',
        icon: '🔥',
        description: 'Inflige 1 dégât par tour pendant X tours.',
        stackable: true
    },
    weakness: {
        name: 'Faiblesse',
        icon: '📉',
        description: 'Ajoute une faiblesse temporaire à un élément.',
        stackable: false
    },
    invincible: {
        name: 'Invincible',
        icon: '✨',
        description: 'Immunisé aux dégâts pendant X tours.',
        stackable: false
    }
} as const;

/**
 * DÉROULEMENT D'UN TOUR
 * ---------------------
 * 
 * Début du tour:
 * 1. Le joueur actif pioche jusqu'à 5 cartes
 * 2. L'énergie est conservée du tour précédent
 * 
 * Phase principale (au choix):
 * - Jouer UNE carte (coût en énergie)
 * - OU Défausser des cartes pour +1 énergie max
 * - OU Passer (ne rien faire)
 * 
 * Fin du tour:
 * 1. Application des effets de statut (poison, burn)
 * 2. Réduction de la durée des effets temporaires
 * 3. Passage au joueur suivant
 */
export const TURN_PHASES = ['draw', 'main', 'end'] as const;

/**
 * CONDITIONS DE VICTOIRE
 * ----------------------
 */
export const WIN_CONDITIONS = {
    elimination: 'Éliminer tous les dieux adverses',
    surrender: 'L\'adversaire abandonne',
    turn_limit: 'Après 40 tours : le joueur avec le plus de dieux vivants gagne. En cas d\'égalité : PV totaux. Si toujours égalité : match nul.'
} as const;

/**
 * SYSTÈME DE FAIBLESSE
 * --------------------
 * 
 * Quand un dieu reçoit des dégâts de son élément de faiblesse:
 * - Les dégâts sont DOUBLÉS (×2)
 * 
 * Exemple: Poséidon (Eau) est faible à la Foudre
 * - Un sort de Foudre infligeant 3 dégâts → 6 dégâts sur Poséidon
 */
export const WEAKNESS_MULTIPLIER = 2;

/**
 * SYSTÈME DE FATIGUE
 * ------------------
 * 
 * Quand le deck est vide:
 * 1. La défausse est mélangée et devient le nouveau deck
 * 2. Le compteur de fatigue augmente de 1
 * 3. Le joueur subit X dégâts à TOUS ses dieux (X = niveau de fatigue)
 * 
 * La fatigue est cumulative et dangereuse en fin de partie.
 */
export const FATIGUE_RULES = {
    INITIAL_DAMAGE: 1,
    INCREMENT: 1,
    AFFECTS_ALL_GODS: true
} as const;

/**
 * MÉCANIQUES SPÉCIALES
 * --------------------
 */
export const SPECIAL_MECHANICS = {
    zombie: {
        name: 'Zombie',
        description: 'Un dieu mort peut être ressuscité en zombie (5 PV). Il inflige automatiquement 1 dégât par tour à un ennemi au choix.',
        god: 'Perséphone'
    },
    blind_cards: {
        name: 'Cartes Cachées',
        description: 'Certains effets placent des cartes "cachées" dans la main adverse. Le joueur ne peut pas voir ces cartes tant qu\'elles ne sont pas révélées ou jouées.',
        god: 'Nyx'
    },
    copy_spell: {
        name: 'Copie de Sort',
        description: 'Perséphone peut copier et jouer un sort depuis la défausse adverse.',
        god: 'Perséphone'
    },
    cascade_heal: {
        name: 'Soin en Cascade',
        description: 'Séléné peut soigner ses alliés en cascade (3, 2, 1 PV) dans une direction au choix.',
        god: 'Séléné'
    }
} as const;

/**
 * LISTE DES DIEUX
 * ---------------
 */
export const GODS_LIST = [
    { id: 'poseidon', name: 'Poséidon', element: 'water', role: 'Contrôle/Mill' },
    { id: 'zeus', name: 'Zeus', element: 'lightning', role: 'Dégâts/Marque' },
    { id: 'nyx', name: 'Nyx', element: 'darkness', role: 'Disruption/Blind' },
    { id: 'hestia', name: 'Hestia', element: 'fire', role: 'Support/Heal' },
    { id: 'athena', name: 'Athéna', element: 'light', role: 'Tank/Provocation' },
    { id: 'demeter', name: 'Déméter', element: 'earth', role: 'Heal/Renfort' },
    { id: 'dionysos', name: 'Dionysos', element: 'earth', role: 'Chaos/RNG' },
    { id: 'apollon', name: 'Apollon', element: 'air', role: 'Contrôle/Stun' },
    { id: 'artemis', name: 'Artémis', element: 'fire', role: 'Dégâts/Faiblesse' },
    { id: 'aphrodite', name: 'Aphrodite', element: 'light', role: 'Support/Charme' },
    { id: 'persephone', name: 'Perséphone', element: 'darkness', role: 'Zombie/Copy' },
    { id: 'hephaistos', name: 'Héphaïstos', element: 'fire', role: 'Burn/Forge' },
    { id: 'selene', name: 'Séléné', element: 'water', role: 'Heal/Cascade' },
    { id: 'zephyr', name: 'Zéphyr', element: 'air', role: 'Mobilité/Shuffle' },
    { id: 'hades', name: 'Hadès', element: 'darkness', role: 'Boss/Story' }
] as const;

export default {
    GAME_CONFIG,
    ELEMENTS,
    CARD_TYPES,
    STATUS_EFFECTS,
    TURN_PHASES,
    WIN_CONDITIONS,
    WEAKNESS_MULTIPLIER,
    FATIGUE_RULES,
    SPECIAL_MECHANICS,
    GODS_LIST
};
