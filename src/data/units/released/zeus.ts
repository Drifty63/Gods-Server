import { released, dmg, shield, status, custom } from '../builders';

/**
 * Unités publiées rattachées à ZEUS (Foudre ⚡).
 */

export const gardeCeleste = released(
    {
        kind: 'servant', id: 'garde_celeste', name: 'Garde céleste',
        element: 'lightning', hp: 16, god: 'zeus', arch: 'tank',
        flavor: "« L'Olympe ne se défend pas. L'Olympe se tient. » — Il marque d'abord, il encaisse ensuite, et il fait détoner les marques au moment qu'il choisit.",
    },
    [
        {
            slot: 'generator_1', name: 'Phalange de l\'Olympe', gain: 1,
            desc: '1 dégât à tous les ennemis.',
            effects: [dmg(1, 'all_enemies')],
        },
        {
            slot: 'generator_2', name: 'Pointe olympienne', gain: 1,
            desc: '3 dégâts à un ennemi.',
            effects: [dmg(3)],
        },
        {
            slot: 'skill_1', name: 'Heurt du rempart',
            desc: '2 dégâts à un ennemi et lui applique une marque de foudre.',
            effects: [dmg(2), status('lightning', 1, 'same')],
        },
        {
            // `lightning_detonate` et non `lightning_toggle` : celui-ci POSERAIT une marque sur
            // une cible qui n'en porte pas, ce que le texte de la carte ne promet pas.
            slot: 'skill_2', name: 'Sentence du sommet',
            desc: '4 dégâts à une cible, puis retire ses marques de foudre en infligeant 2 dégâts par marque retirée.',
            effects: [dmg(4), custom('lightning_detonate', 'Fait détoner les marques de foudre : +2 dégâts par marque', 'same')],
        },
        {
            slot: 'utility_1', name: 'Relève céleste',
            desc: 'Gagne 3 boucliers et provoque pendant 2 tours.',
            effects: [shield(3), status('provocation', 1, 'self', 2)],
        },
    ],
);

export const harpies = released(
    {
        // 24 PV et non les 20 du tableur : la Harpie était la créature la plus faible du
        // bestiaire (32 de budget contre 37,5 de médiane), au point qu'un serviteur la
        // dépassait. Son kit est volontairement léger — saignement et fuite — donc c'est aux
        // PV de la ramener dans sa catégorie. Voir la note du Cyclope, l'autre moitié du même
        // ajustement.
        kind: 'creature', id: 'harpies', name: 'Harpie',
        element: 'air', hp: 24, god: 'zeus',
        flavor: "« Ce qui monte finit toujours par tomber. Nous, jamais. » — Elle ouvre des plaies qui saignent à travers les boucliers, puis disparaît hors de portée.",
    },
    [
        {
            slot: 'generator_1', name: 'Battement brutal', gain: 1,
            desc: '1 dégât à tous les ennemis.',
            effects: [dmg(1, 'all_enemies')],
        },
        {
            slot: 'generator_2', name: 'Rapt aérien', gain: 1,
            desc: '3 dégâts à une cible.',
            effects: [dmg(3)],
        },
        {
            slot: 'skill_1', name: 'Serres lacérantes',
            desc: '2 dégâts à une cible et lui applique 1 saignement.',
            effects: [dmg(2), status('bleed', 1, 'same')],
        },
        {
            slot: 'skill_2', name: 'Cri déchirant',
            desc: '1 dégât à tous les ennemis et 1 saignement à chacun.',
            effects: [dmg(1, 'all_enemies'), status('bleed', 1, 'all_enemies')],
        },
        {
            slot: 'utility_1', name: 'Refuge escarpé',
            desc: 'Devient inciblable pendant 2 tours.',
            effects: [status('untargetable', 1, 'self', 2)],
        },
    ],
);
