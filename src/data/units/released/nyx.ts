import { released, dmg, status, custom } from '../builders';

/**
 * Unités publiées rattachées à NYX (Ténèbres 💀).
 */

export const occultiste = released(
    {
        kind: 'servant', id: 'occultiste', name: 'Occultiste de Nyx',
        element: 'darkness', hp: 16, god: 'nyx', arch: 'support',
        flavor: "« La nuit ne donne rien. Elle échange. » — Il paie son pouvoir de son propre sang, couvre les autres et laisse sa gorge à découvert.",
    },
    [
        {
            slot: 'generator_1', name: 'Murmure nocturne', gain: 1,
            desc: '1 dégât à tous les ennemis.',
            effects: [dmg(1, 'all_enemies')],
        },
        {
            slot: 'generator_2', name: 'Étincelle obscure', gain: 1,
            desc: '3 dégâts à un ennemi.',
            effects: [dmg(3)],
        },
        {
            // Le seul sort du jeu qui frappe SON PROPRE lanceur en échange d'énergie. Le pari
            // est net : 4 PV contre 3 énergie, sur un serviteur qui n'en a que 16.
            slot: 'skill_1', name: 'Offrande à la nuit', gain: 3,
            desc: 'S\'inflige 4 dégâts et rend 3 énergie.',
            effects: [dmg(4, 'self')],
        },
        {
            slot: 'skill_2', name: 'Voile rituel', gain: 1,
            desc: 'Tous les alliés SAUF l\'occultiste deviennent inciblables 1 tour. Rend 1 énergie.',
            effects: [custom('allies_except_self_untargetable', 'Rend les autres alliés inciblables 1 tour')],
        },
        {
            slot: 'utility_1', name: 'Sceau du silence',
            desc: 'Un dieu ennemi ne peut plus jouer ses cartes Compétence pendant 2 tours. Ses générateurs et son utilitaire restent jouables.',
            effects: [status('silence', 1, 'enemy_god', 2)],
        },
    ],
);

export const erinyes = released(
    {
        kind: 'creature', id: 'erinyes', name: 'Érinye',
        element: 'fire', hp: 22, god: 'nyx',
        flavor: "« Nous ne jugeons pas. Nous exécutons la sentence déjà rendue. » — Elle brûle une cible à la fois, jusqu'au jour où elle fait taire l'Olympe entier.",
    },
    [
        {
            slot: 'generator_1', name: 'Lanière vengeresse', gain: 1,
            desc: '1 dégât à tous les ennemis.',
            effects: [dmg(1, 'all_enemies')],
        },
        {
            slot: 'generator_2', name: 'Morsure du remords', gain: 1,
            desc: '3 dégâts à un ennemi.',
            effects: [dmg(3)],
        },
        {
            slot: 'skill_1', name: 'Châtiment inexorable',
            desc: '3 dégâts à un ennemi et lui applique 1 brûlure.',
            effects: [dmg(3), status('burn', 1, 'same')],
        },
        {
            /*
             * Le silence de ZONE. Pour un effet de DÉNI, frapper les quatre n'est pas quatre
             * fois mieux : c'est la différence entre rien et tout, puisque l'adversaire choisit
             * quel dieu agit. Sceller un seul dieu lui coûte peu — il en prend un autre ; les
             * sceller tous lui retire ses compétences pour de bon.
             *
             * Ce qui la borne : ses générateurs restent jouables, et 56 des 60 générateurs du
             * jeu infligent des dégâts. L'adversaire n'est pas désarmé, il est ramené au
             * minimum. C'est la carte à surveiller en premier si l'équilibre penche.
             */
            slot: 'skill_2', name: 'Tribunal des furies',
            desc: 'Tous les ennemis sont réduits au silence pendant 2 tours.',
            effects: [status('silence', 1, 'all_enemies', 2)],
        },
        {
            slot: 'utility_1', name: 'Piste du coupable',
            desc: '1 saignement à 2 cibles.',
            effects: [status('bleed', 1), status('bleed', 1)],
        },
    ],
);
