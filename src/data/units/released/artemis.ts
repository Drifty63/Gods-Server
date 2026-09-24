import { released, dmg, status, custom } from '../builders';

/**
 * Unités publiées rattachées à ARTÉMIS (Lumière ☀️).
 */

export const chiensChasse = released(
    {
        kind: 'servant', id: 'chiens_chasse', name: 'Loup d\'Artémis',
        element: 'earth', hp: 14, god: 'artemis',
        flavor: "« Il ne court pas plus vite que toi. Il court plus longtemps. » — Il ouvre une plaie, il immobilise, et il se fond dans le sous-bois quand on le cherche.",
    },
    [
        {
            slot: 'generator_1', name: 'Attaque en meute', gain: 1,
            desc: '1 dégât à tous les ennemis.',
            effects: [dmg(1, 'all_enemies')],
        },
        {
            slot: 'generator_2', name: 'Bond prédateur', gain: 1,
            desc: '3 dégâts à un ennemi.',
            effects: [dmg(3)],
        },
        {
            slot: 'skill_1', name: 'Coup de crocs',
            desc: '2 dégâts à une cible et lui applique 1 saignement.',
            effects: [dmg(2), status('bleed', 1, 'same')],
        },
        {
            slot: 'skill_2', name: 'Morsure tenace',
            desc: '4 dégâts à une cible et l\'étourdit 1 tour.',
            effects: [dmg(4), status('stun', 1, 'same', 1)],
        },
        {
            slot: 'utility_1', name: 'Pas de velours',
            desc: 'Devient inciblable pendant 2 tours.',
            effects: [status('untargetable', 1, 'self', 2)],
        },
    ],
);

/*
 * ACTÉON porte à lui seul toute la mécanique de l'EFFROI.
 *
 * Ses deux cartes de peur posent `dreaded` sur lui en plus des marques sur l'ennemi. C'est ce
 * couple qui fait la règle : un dieu qui porte de l'effroi ne peut pas MONO-CIBLER un dieu qui
 * porte `dreaded`. Les attaques de zone, elles, l'atteignent toujours — sans quoi Actéon
 * deviendrait intouchable pour le reste de la partie.
 *
 * Le second garde-fou est la décroissance : une marque s'efface par tour, quoi qu'il arrive.
 * Entretenir la protection coûte donc une carte par tour, c'est-à-dire TOUT le tour d'Actéon,
 * qui ne frappe alors jamais.
 *
 * L'effet `self` est placé en dernier dans chaque liste : la branche `self` du moteur écrase
 * `lastUsedTargetId`, ce qui ferait pointer un `same` suivant sur le lanceur.
 */
export const acteon = released(
    {
        kind: 'creature', id: 'acteon', name: 'Actéon',
        element: 'darkness', hp: 24, god: 'artemis',
        flavor: "« J'ai vu ce qu'il ne fallait pas voir. Maintenant, c'est vous qui détournez les yeux. » — Le chasseur devenu gibier : tant qu'il inspire l'effroi, nul ne l'ose viser en face.",
    },
    [
        {
            slot: 'generator_1', name: 'Coup d\'andouiller', gain: 1,
            desc: '1 dégât à tous les ennemis.',
            effects: [dmg(1, 'all_enemies')],
        },
        {
            slot: 'generator_2', name: 'Griffes maudites', gain: 1,
            desc: '3 dégâts à une cible.',
            effects: [dmg(3)],
        },
        {
            slot: 'skill_1', name: 'Charge de la malédiction',
            desc: '2 dégâts et 2 marques d\'effroi à 2 cibles différentes. Un dieu effrayé ne peut plus viser Actéon avec une attaque mono-cible.',
            effects: [
                dmg(2), status('fear', 2, 'same'),
                dmg(2), status('fear', 2, 'same'),
                status('dreaded', 1, 'self'),
            ],
        },
        {
            slot: 'skill_2', name: 'Brame de terreur',
            desc: '2 dégâts à tous les ennemis et retire toutes les marques d\'effroi. Ceux qui en portaient deviennent Émoussés : leur prochaine attaque mono-cible inflige 2 dégâts de moins.',
            effects: [custom('terror_bray', '2 dégâts à tous les ennemis, encaisse l\'effroi accumulé et émousse ceux qui en portaient')],
        },
        {
            slot: 'utility_1', name: 'Refuge d\'effroi',
            desc: '3 marques d\'effroi à 2 cibles.',
            effects: [status('fear', 3), status('fear', 3), status('dreaded', 1, 'self')],
        },
    ],
);
