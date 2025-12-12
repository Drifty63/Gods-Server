// Données de tous les dieux du jeu GODS
// Mise à jour progressive avec les cartes fournies

import { GodCard } from '@/types/cards';

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
        flavorText: '"Aucun spectacle de la nature, ni les flammes occidentales, ni la tempête dans les palmiers... ne semblent dignes d\'étonnement à ceux qui ont vu dans leur bras la transfiguration de la femme."',
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
