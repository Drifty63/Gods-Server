// Données de tous les dieux du jeu GODS
// Mise à jour progressive avec les cartes fournies

import { GodCard } from '@/types/cards';
export type { GodCard as God } from '@/types/cards';

export const ALL_GODS: GodCard[] = [
    // =====================
    // DIEU 1: POSÉIDON (Eau 💧)
    // =====================
    {
        id: 'poseidon',
        name: 'Poséidon, Dieu des océans',
        element: 'water',
        weakness: 'lightning',
        maxHealth: 25,
        imageUrl: '/cards/gods/poseidon.png',
        carouselImage: '/cards/gods/poseidon.jpg',
        flavorText: '"Elle est douce, la terre, aux vœux des naufragés, dont Poséidon en mer, sous l\'assaut de la vague et du vent, a brisé le solide navire."',
    },

    // =====================
    // DIEU 2: ZEUS (Foudre ⚡)
    // =====================
    {
        id: 'zeus',
        name: 'Zeus, Dieu du ciel',
        element: 'lightning',
        weakness: 'earth',
        maxHealth: 25,
        imageUrl: '/cards/gods/zeus.png',
        carouselImage: '/cards/gods/zeus.jpg',
        flavorText: '"Si Zeus voulait écouter les vœux des hommes, tous périraient, car ils demandent beaucoup de choses qui sont nuisibles à leurs semblables."',
    },

    // =====================
    // DIEU 3: NYX (Ténèbres 💀)
    // =====================
    {
        id: 'nyx',
        name: 'Nyx, Déesse de la nuit',
        element: 'darkness',
        weakness: 'light',
        maxHealth: 26,
        imageUrl: '/cards/gods/nyx.png',
        carouselImage: '/cards/gods/nyx.jpg',
        flavorText: '"Je suis la mère de toutes les terreurs ! La mère des Parques elles-mêmes ! D\'Hécate ! De la vieillesse ! De la Douleur ! Du Sommeil ! De la Mort ! Et de toutes les malédictions !"',
    },

    // =====================
    // DIEU 4: HESTIA (Feu 🔥)
    // =====================
    {
        id: 'hestia',
        name: 'Hestia, Déesse du foyer',
        element: 'fire',
        weakness: 'water',
        maxHealth: 24,
        imageUrl: '/cards/gods/hestia.png',
        carouselImage: '/cards/gods/hestia.jpg',
        flavorText: '"Hestia qui partout, dans toutes les hautes maisons, celles des dieux immortels, celles des hommes qui vont sur terre, as trouvé ton lieu à jamais, ton honneur est de toujours, ta part est belle et honorable."',
    },

    // =====================
    // DIEU 5: ATHÉNA (Lumière ☀️)
    // =====================
    {
        id: 'athena',
        name: 'Athéna, Déesse de la sagesse',
        element: 'light',
        weakness: 'darkness',
        maxHealth: 30,
        imageUrl: '/cards/gods/athena.png',
        carouselImage: '/cards/gods/athena.jpg',
        flavorText: '"Homère nomme Athéna, la conseillère aux multiples ressources. Que signifie donner conseil ? Cela veut dire : préméditer quelque chose, y pourvoir d\'avance et par là faire qu\'elle réussisse."',
    },

    // =====================
    // DIEU 6: DEMETER (Terre 🌿)
    // =====================
    {
        id: 'demeter',
        name: 'Demeter, Déesse des récoltes',
        element: 'earth',
        weakness: 'air',
        maxHealth: 24,
        imageUrl: '/cards/gods/demeter.png',
        carouselImage: '/cards/gods/demeter.jpg',
        flavorText: '"Va, Perséphone, va la voir, ta mère aux voiles noirs. Que ton coeur soit sage dans ta poitrine, serein ton esprit. Ne te laisse pas aller à une tristesse trop grande."',
    },

    // =====================
    // DIEU 7: DIONYSOS (Terre 🌿)
    // =====================
    {
        id: 'dionysos',
        name: 'Dionysos, Dieu du vin',
        element: 'earth',
        weakness: 'air',
        maxHealth: 22,
        imageUrl: '/cards/gods/dionysos.png',
        carouselImage: '/cards/gods/dionysos.jpg',
        flavorText: '"À la figure de Prométhée, qui fut la figure emblématique de la Modernité est en train de se substituer celle de Dionysos. Dieu chtonien, c\'est à dire dieu de cette terre-ci, dieu autochtone..."',
    },

    // =====================
    // DIEU 8: HADÈS (Feu 🔥)
    // =====================
    {
        id: 'hades',
        name: 'Hadès, Dieu des enfers',
        element: 'fire',
        weakness: 'water',
        maxHealth: 20,
        imageUrl: '/cards/gods/hades.png',
        carouselImage: '/cards/gods/hades.jpg',
        flavorText: '"Et, sous la terre, le seigneur des morts, Hadès, soudain prend peur. De peur, il saute sur son trône et crie : Poséidon, l\'Ébranleur du sol, ne va-t-il pas faire éclater la terre dans les airs..."',
    },

    // =====================
    // DIEU 9: APOLLON (Air 💨)
    // =====================
    {
        id: 'apollon',
        name: 'Apollon, Dieu de la musique',
        element: 'air',
        weakness: 'fire',
        maxHealth: 22,
        imageUrl: '/cards/gods/apollon.png',
        carouselImage: '/cards/gods/apollon.jpg',
        flavorText: '"Aux plus savants auteurs comme aux plus grands guerriers, Apollon ne promet qu\'un nom et des lauriers."',
    },

    // =====================
    // DIEU 10: ARÈS (Terre 🌿)
    // =====================
    {
        id: 'ares',
        name: 'Arès, Dieu de la guerre',
        element: 'earth',
        weakness: 'air',
        maxHealth: 28,
        imageUrl: '/cards/gods/ares.png',
        carouselImage: '/cards/gods/ares.jpg',
        flavorText: '"Ne viens pas, tête à l\'évent, gémir ici à mes pieds. Tu m\'es le plus odieux de tous les Immortels qui habitent l\'Olympe, Ton plaisir toujours, c\'est la querelle, la guerre, et les combats."',
    },

    // =====================
    // DIEU 11: ARTÉMIS (Air 💨)
    // =====================
    {
        id: 'artemis',
        name: 'Artémis, Déesse de la chasse',
        element: 'air',
        weakness: 'fire',
        maxHealth: 20,
        imageUrl: '/cards/gods/artemis.png',
        carouselImage: '/cards/gods/artemis.jpg',
        flavorText: '"Roses blanches, tombez! vous insultez nos dieux, Tombez, fantômes blancs, de votre ciel qui brûle; La sainte de l\'abîme est plus sainte à mes yeux!"',
    },

    // =====================
    // DIEU 12: APHRODITE (Lumière ☀️)
    // =====================
    {
        id: 'aphrodite',
        name: 'Aphrodite, Déesse de l\'amour',
        element: 'light',
        weakness: 'darkness',
        maxHealth: 25,
        imageUrl: '/cards/gods/aphrodite.png',
        carouselImage: '/cards/gods/aphrodite.jpg',
        flavorText: '"Aucun spectacle de la nature, ni les flammes occidentales, ni la tempête dans les palmiers... ne semblent dignes d\'étonnement à ceux qui ont vu dans leur bras la transfiguration de la femme."',
    },

    // =====================================================
    // DIEUX CACHÉS - EXTENSION DEATH & GLORY
    // =====================================================

    // PERSÉPHONE (Ténèbres 💀) - CACHÉ
    {
        id: 'persephone',
        name: 'Perséphone, Reine des Enfers',
        element: 'darkness',
        weakness: 'light',
        maxHealth: 26,
        imageUrl: '/cards/gods/persephone.png',
        flavorText: '"Je suis celle qui règne sur les morts et guide les âmes. Mon royaume est éternel."',
        hidden: true,
    },

    // HÉPHAÏSTOS (Feu 🔥) - CACHÉ
    {
        id: 'hephaistos',
        name: 'Héphaïstos, Dieu de la forge',
        element: 'fire',
        weakness: 'water',
        maxHealth: 25,
        imageUrl: '/cards/gods/hephaistos.png',
        flavorText: '"Dans ma forge brûlent les flammes de la création. Mes armures sont invincibles."',
        hidden: true,
    },

    // THANATOS (Ténèbres 💀) - CACHÉ
    {
        id: 'thanatos',
        name: 'Thanatos, Dieu de la mort',
        element: 'darkness',
        weakness: 'light',
        maxHealth: 26,
        imageUrl: '/cards/gods/thanatos.png',
        flavorText: '"Je suis la fin inévitable. Chaque mort me rend plus puissant."',
        hidden: true,
    },

    // HERMÈS (Foudre ⚡) - CACHÉ
    {
        id: 'hermes',
        name: 'Hermès, Messager des dieux',
        element: 'lightning',
        weakness: 'earth',
        maxHealth: 24,
        imageUrl: '/cards/gods/hermes.png',
        flavorText: '"Plus rapide que la pensée, je frappe avant même que tu ne me voies venir."',
        hidden: true,
    },

    // SÉLÉNÉ (Eau 💧) - CACHÉ
    {
        id: 'selene',
        name: 'Séléné, Déesse de la lune',
        element: 'water',
        weakness: 'lightning',
        maxHealth: 30,
        imageUrl: '/cards/gods/selene.png',
        flavorText: '"Ma lumière argentée apaise les blessures et ranime les âmes perdues."',
        hidden: true,
    },

    // ZÉPHYR (Air 🌀) - CACHÉ
    {
        id: 'zephyr',
        name: 'Zéphyr, Dieu du vent d\'ouest',
        element: 'air',
        weakness: 'fire',
        maxHealth: 24,
        imageUrl: '/cards/gods/zephyr.png',
        flavorText: '"Mon souffle disperse tes plans comme des feuilles dans la tempête."',
        hidden: true,
    },

    // NIKÉ (Lumière ✨) - CACHÉ
    {
        id: 'nike',
        name: 'Niké, Déesse de la victoire',
        element: 'light',
        weakness: 'darkness',
        maxHealth: 22,
        imageUrl: '/cards/gods/nike.png',
        flavorText: '"La victoire couronne ceux qui triomphent de leurs ennemis. Je suis leur récompense."',
        hidden: true,
    },

    // CHIONÉ (Eau 💧) - CACHÉ
    {
        id: 'chione',
        name: 'Chioné, Déesse de la neige',
        element: 'water',
        weakness: 'lightning',
        maxHealth: 22,
        imageUrl: '/cards/gods/chione.png',
        flavorText: '"Mon froid gèle le temps lui-même. Tes actions seront figées dans la glace."',
        hidden: true,
    },

    // =====================================================
    // ENNEMIS SPÉCIAUX - MODE HISTOIRE
    // =====================================================

    // SOLDAT D'ARÈS 1 (Terre 🌿) - Serviteur
    {
        id: 'soldier_ares_1',
        name: 'Soldat d\'Arès',
        element: 'earth',
        weakness: 'air',
        maxHealth: 16,
        imageUrl: '/cards/gods/soldier_ares_1.png',
        flavorText: '"Pour Arès ! Pour la gloire et la guerre !"',
        hidden: false,  // Disponible en mode Duel
        category: 'servant',
        duelCost: 2,
        affiliatedTo: 'ares',
    },

    // SOLDAT D'ARÈS 2 (Terre 🌿) - Serviteur (dupliqué pour l'histoire)
    {
        id: 'soldier_ares_2',
        name: 'Soldat d\'Arès',
        element: 'earth',
        weakness: 'air',
        maxHealth: 16,
        imageUrl: '/cards/gods/soldier_ares_2.png',
        flavorText: '"Pour Arès ! Pour la gloire et la guerre !"',
        hidden: true,  // Dupliqué pour l'histoire uniquement
        category: 'servant',
        duelCost: 2,
        affiliatedTo: 'ares',
    },

    // SOLDAT D'ARÈS 3 (Terre 🌿) - Serviteur (dupliqué pour l'histoire)
    {
        id: 'soldier_ares_3',
        name: 'Soldat d\'Arès',
        element: 'earth',
        weakness: 'air',
        maxHealth: 16,
        imageUrl: '/cards/gods/soldier_ares_3.png',
        flavorText: '"Pour Arès ! Pour la gloire et la guerre !"',
        hidden: true,  // Dupliqué pour l'histoire uniquement
        category: 'servant',
        duelCost: 2,
        affiliatedTo: 'ares',
    },

    // DRAGON DE THÈBES (Air 💨) - Créature mythique
    {
        id: 'dragon_thebes',
        name: 'Dragon de Thèbes',
        element: 'air',
        weakness: 'fire',
        maxHealth: 26,  // 26 PV en mode Duel, 75 PV override en mode Histoire
        imageUrl: '/cards/gods/dragon_thebes.png',
        flavorText: '"Né du sang d\'Arès lui-même, je suis la terreur des cieux. Plus grand, plus puissant que mon ancêtre, je règne sur les vents de la mort."',
        hidden: false,  // Disponible en mode Duel
        category: 'creature',
        duelCost: 3,
        affiliatedTo: 'ares',
    },

    // ARACHNÉ (Ténèbres 💀) - Créature mythique
    {
        id: 'arachne',
        name: 'Arachné',
        element: 'darkness',
        weakness: 'light',
        maxHealth: 22,  // 22 PV en mode Duel, 50 PV override en mode Histoire
        imageUrl: '/cards/gods/arachne.png',
        flavorText: '"Athéna m\'a maudite, mais ma vengeance sera tissée de leurs propres entrailles. Partout où rampe une araignée, je peux apparaître !"',
        hidden: false,  // Disponible en mode Duel
        category: 'creature',
        duelCost: 3,
    },

    // ARAIGNÉE GÉANTE 1 (Ténèbres 💀) - Duel + Histoire
    {
        id: 'giant_spider_1',
        name: 'Araignée Géante',
        element: 'darkness',
        weakness: 'light',
        maxHealth: 12,
        imageUrl: '/cards/gods/giant_spider_1.png',
        flavorText: '"Nous sommes les enfants d\'Arachné. Nous tissons la mort."',
        category: 'servant',
        affiliatedTo: 'arachne',
        duelCost: 2,
    },

    // ARAIGNÉE GÉANTE 2 (Ténèbres 💀) - Exclusif Histoire
    {
        id: 'giant_spider_2',
        name: 'Araignée Géante',
        element: 'darkness',
        weakness: 'light',
        maxHealth: 12,
        imageUrl: '/cards/gods/giant_spider_2.png',
        flavorText: '"Nous sommes les enfants d\'Arachné. Nous tissons la mort."',
        hidden: true,  // Exclusif mode Histoire
        category: 'creature',
        affiliatedTo: 'arachne',
    },

    // ARAIGNÉE GÉANTE 3 (Ténèbres 💀) - Exclusif Histoire
    {
        id: 'giant_spider_3',
        name: 'Araignée Géante',
        element: 'darkness',
        weakness: 'light',
        maxHealth: 12,
        imageUrl: '/cards/gods/giant_spider_3.png',
        flavorText: '"Nous sommes les enfants d\'Arachné. Nous tissons la mort."',
        hidden: true,  // Exclusif mode Histoire
        category: 'creature',
        affiliatedTo: 'arachne',
    },

    // =====================
    // ULYSSE (Créature - Eau 💧) - Duel + Histoire
    // =====================
    {
        id: 'ulysses',
        name: 'Ulysse, Roi d\'Ithaque',
        element: 'water',
        weakness: 'lightning',
        maxHealth: 20,
        imageUrl: '/cards/gods/card_ulysses.png',
        flavorText: '"Je suis Ulysse, le rusé, celui que tous les dieux connaissent pour ses ruses infinies."',
        category: 'creature',
        affiliatedTo: 'athena',
        duelCost: 4,
    },

    // =====================
    // CHEVALIER D'ATHÉNA (Serviteur - Lumière ☀️) - Duel + Histoire
    // =====================
    {
        id: 'athena_knight',
        name: 'Chevalier d\'Athéna',
        element: 'light',
        weakness: 'darkness',
        maxHealth: 16,
        imageUrl: '/cards/gods/card_athena_knight.png',
        flavorText: '"Pour la gloire d\'Athéna, nous ne fléchirons jamais!"',
        category: 'servant',
        affiliatedTo: 'athena',
        duelCost: 3,
    },
];

// Helper pour obtenir un dieu par son ID
export function getGodById(id: string): GodCard | undefined {
    return ALL_GODS.find(god => god.id === id);
}

// Helper pour obtenir tous les dieux d'un élément
export function getGodsByElement(element: GodCard['element']): GodCard[] {
    return ALL_GODS.filter(god => god.element === element);
}

// Helper pour obtenir les dieux visibles (SEULEMENT les dieux, pas créatures/serviteurs)
// Utilisé par: Boutique, Deck, Entraînement, Accueil
export function getVisibleGods(isCreator: boolean = false): GodCard[] {
    const onlyGods = ALL_GODS.filter(god => !god.category || god.category === 'god');
    if (isCreator) {
        return onlyGods; // Les créateurs voient tous les dieux
    }
    return onlyGods.filter(god => !god.hidden); // Les autres ne voient que les dieux non cachés
}

// Helper pour obtenir les dieux possédés par un joueur (SEULEMENT les dieux)
// Utilisé par: Ascension, Mode En Ligne
export function getOwnedGods(godsOwned: string[], isCreator: boolean = false): GodCard[] {
    const onlyGods = ALL_GODS.filter(god => !god.category || god.category === 'god');

    // Les créateurs ont accès à tous les dieux
    if (isCreator) {
        return onlyGods;
    }

    // Sinon, retourner seulement les dieux possédés
    return onlyGods.filter(god => godsOwned.includes(god.id));
}

// Helper pour obtenir toutes les cartes disponibles pour le mode Duel
// Inclut: Dieux + Créatures + Serviteurs (possédés ou créateur)
export function getDuelCards(godsOwned: string[], isCreator: boolean = false): {
    gods: GodCard[];
    creatures: GodCard[];
    servants: GodCard[];
} {
    if (isCreator) {
        return {
            gods: ALL_GODS.filter(g => !g.hidden && (!g.category || g.category === 'god')),
            creatures: ALL_GODS.filter(g => !g.hidden && g.category === 'creature'),
            servants: ALL_GODS.filter(g => !g.hidden && g.category === 'servant'),
        };
    }

    return {
        gods: ALL_GODS.filter(g => (!g.category || g.category === 'god') && godsOwned.includes(g.id)),
        creatures: ALL_GODS.filter(g => g.category === 'creature' && !g.hidden && godsOwned.includes(g.id)),
        servants: ALL_GODS.filter(g => g.category === 'servant' && !g.hidden && godsOwned.includes(g.id)),
    };
}
