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
];

// Helper pour obtenir un dieu par son ID
export function getGodById(id: string): GodCard | undefined {
    return ALL_GODS.find(god => god.id === id);
}

// Helper pour obtenir tous les dieux d'un élément
export function getGodsByElement(element: GodCard['element']): GodCard[] {
    return ALL_GODS.filter(god => god.element === element);
}

// Helper pour obtenir les dieux visibles selon le statut créateur
export function getVisibleGods(isCreator: boolean = false): GodCard[] {
    if (isCreator) {
        return ALL_GODS; // Les créateurs voient tous les dieux
    }
    return ALL_GODS.filter(god => !god.hidden); // Les autres ne voient que les dieux non cachés
}

