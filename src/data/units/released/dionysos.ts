import { released, dmg, heal, status, custom } from '../builders';

/**
 * Unités publiées rattachées à DIONYSOS (Eau 💧).
 */

export const satyres = released(
    {
        kind: 'servant', id: 'satyres', name: 'Satyre',
        element: 'earth', hp: 14, god: 'dionysos',
        flavor: "« Bois avec nous. Tu ne sentiras plus tes jambes, et ce sera très bien ainsi. » — Il empoisonne au compte-gouttes, puis endort l'équipe entière d'un seul refrain.",
    },
    [
        {
            slot: 'generator_1', name: 'Air espiègle', gain: 1,
            desc: '1 dégât à tous les ennemis.',
            effects: [dmg(1, 'all_enemies')],
        },
        {
            slot: 'generator_2', name: 'Coup de corne', gain: 1,
            desc: '3 dégâts à un ennemi.',
            effects: [dmg(3)],
        },
        {
            slot: 'skill_1', name: 'Tir de sarbacane',
            desc: '3 dégâts à une cible et lui applique 1 poison.',
            effects: [dmg(3), status('poison', 1, 'same')],
        },
        {
            /*
             * Un étourdissement de ZONE : avec une carte par tour, geler les quatre dieux
             * adverses leur fait sauter un tour entier. La carte la plus lourde de l'unité, et
             * l'une des deux seules du jeu à le faire (voir « Jardin des condamnés » de Méduse,
             * qui y arrive par la pétrification).
             */
            slot: 'skill_2', name: 'Ronces enivrantes',
            desc: '1 dégât à tous les ennemis et les étourdit 1 tour.',
            effects: [dmg(1, 'all_enemies'), status('stun', 1, 'all_enemies', 1)],
        },
        {
            slot: 'utility_1', name: 'Fête enivrante',
            desc: 'Se soigne de 3 PV.',
            effects: [heal(3, 'self')],
        },
    ],
);

export const chiron = released(
    {
        kind: 'creature', id: 'chiron', name: 'Chiron',
        element: 'earth', hp: 22, god: 'dionysos', arch: 'support',
        flavor: "« Je n'ai jamais gagné une bataille. J'ai formé ceux qui les ont toutes gagnées. » — Il soigne, il purge, et il arme un allié pour un coup que l'adversaire voit venir sans pouvoir l'empêcher.",
    },
    [
        {
            slot: 'generator_1', name: 'Ruade maîtrisée', gain: 1,
            desc: '1 dégât à tous les ennemis.',
            effects: [dmg(1, 'all_enemies')],
        },
        {
            slot: 'generator_2', name: 'Flèche du mentor', gain: 1,
            desc: '3 dégâts à un ennemi.',
            effects: [dmg(3)],
        },
        {
            slot: 'skill_1', name: 'Tir anatomique',
            desc: '2 dégâts à une cible et lui applique 1 saignement.',
            effects: [dmg(2), status('bleed', 1, 'same')],
        },
        {
            /*
             * Une carte par tour : cet ultime MANGE le tour, et l'allié ne frappera qu'au
             * suivant — l'adversaire a donc un tour plein pour tuer le dieu galvanisé. C'est
             * pourquoi la carte est généreuse : c'est le prix du délai, pas un excès.
             *
             * `empowered` attend une attaque MONO-CIBLE : une attaque de zone ne le consomme
             * pas. La clause ne borne pas les dégâts mais l'étourdissement, qui gèlerait sinon
             * les quatre ennemis d'un coup.
             */
            slot: 'skill_2', name: 'Leçon du héros', gain: 1,
            desc: 'Un allié gagne 3 boucliers ; sa prochaine attaque mono-cible inflige +3 dégâts et étourdit sa cible 1 tour. Rend 1 énergie.',
            effects: [
                { type: 'shield', value: 3, target: 'ally_god' },
                status('empowered', 3, 'same'),
            ],
        },
        {
            slot: 'utility_1', name: 'Baume des montagnes',
            desc: 'Soigne un allié de 3 PV et le purge de ses effets négatifs.',
            effects: [
                custom('cleanse', 'Enlève tous les effets négatifs', 'ally_god'),
                heal(3, 'same'),
            ],
        },
    ],
);
