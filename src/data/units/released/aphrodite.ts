import { released, dmg, shield, status, custom } from '../builders';

/**
 * Unités publiées rattachées à APHRODITE (Lumière ☀️).
 */

export const serviteursAphrodite = released(
    {
        kind: 'servant', id: 'serviteurs_aphrodite', name: 'Serviteur d\'Aphrodite',
        element: 'light', hp: 15, god: 'aphrodite', arch: 'support',
        flavor: "« Ma vie ne m'appartient pas. Elle lui appartient. » — Il protège, il charme, et le moment venu il se vide de son sang pour qu'un autre tienne debout.",
    },
    [
        {
            slot: 'generator_1', name: 'Regard hypnotique', gain: 1,
            desc: '1 dégât à tous les ennemis.',
            effects: [dmg(1, 'all_enemies')],
        },
        {
            slot: 'generator_2', name: 'Poing du dévoué', gain: 1,
            desc: '3 dégâts à un ennemi.',
            effects: [dmg(3)],
        },
        {
            slot: 'skill_1', name: 'Étreinte envoûtante',
            desc: '2 dégâts à une cible et l\'étourdit 1 tour.',
            effects: [dmg(2), status('stun', 1, 'same', 1)],
        },
        {
            /*
             * Sans allié vivant autre que lui, le handler ne fait RIEN et le serviteur survit :
             * se sacrifier pour personne serait un suicide pur, que rien sur la carte n'annonce.
             */
            slot: 'skill_2', name: 'Dévotion sans faille',
            desc: 'Le serviteur se sacrifie : il meurt et donne à un autre allié la moitié de ses PV actuels, arrondie vers le bas.',
            effects: [custom('sacrifice_half_hp', 'Se sacrifie et lègue la moitié de ses PV à un allié', 'ally_god')],
        },
        {
            slot: 'utility_1', name: 'Geste protecteur',
            desc: 'Donne 3 boucliers à un allié et le fait provoquer pendant 1 tour.',
            effects: [shield(3, 'ally_god'), status('provocation', 1, 'same', 1)],
        },
    ],
);

export const achille = released(
    {
        kind: 'creature', id: 'achille', name: 'Achille',
        element: 'air', hp: 20, god: 'aphrodite', arch: 'glass_cannon',
        flavor: "« On m'a promis une vie brève et un nom éternel. J'ai signé. » — Il frappe plus fort que tout le bestiaire et choisit lui-même la faiblesse de sa cible. Son seul répit : tout effacer d'un coup.",
    },
    [
        {
            slot: 'generator_1', name: 'Course héroïque', gain: 1,
            desc: '1 dégât à tous les ennemis.',
            effects: [dmg(1, 'all_enemies')],
        },
        {
            slot: 'generator_2', name: 'Estocade myrmidone', gain: 1,
            desc: '3 dégâts à un ennemi.',
            effects: [dmg(3)],
        },
        {
            slot: 'skill_1', name: 'Revers du bouclier',
            desc: '2 dégâts à 2 cibles différentes et gagne 2 boucliers.',
            effects: [dmg(2), dmg(2), shield(2)],
        },
        {
            // `apply_weakness` est l'effet qui déclenche la modale de choix d'élément
            // (gameStore.needsElementChoice) : sans lui, aucun choix n'est proposé.
            slot: 'skill_2', name: 'Fureur de Troie',
            desc: '6 dégâts à une cible et lui impose la faiblesse de l\'élément de votre choix.',
            effects: [dmg(6), custom('apply_weakness', 'Impose une faiblesse élémentaire au choix', 'same')],
        },
        {
            slot: 'utility_1', name: 'Garde impénétrable',
            desc: 'Se purge de tous ses effets négatifs.',
            effects: [custom('cleanse', 'Enlève tous les effets négatifs', 'self')],
        },
    ],
);
