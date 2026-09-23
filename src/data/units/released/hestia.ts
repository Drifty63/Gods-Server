import { released, dmg, heal, status } from '../builders';

/**
 * Unités publiées rattachées à HESTIA (Feu 🔥).
 */

export const feuFollet = released(
    {
        kind: 'servant', id: 'feu_follet', name: 'Feu follet',
        element: 'fire', hp: 14, god: 'hestia', arch: 'support',
        flavor: "« Suis-moi. Je ne brûle pas — je marque. » — Il n'abat personne : il pose la brûlure sur toute l'équipe adverse et laisse les siens attiser.",
    },
    [
        {
            slot: 'generator_1', name: 'Danse des étincelles', gain: 1,
            desc: '1 dégât à tous les ennemis.',
            effects: [dmg(1, 'all_enemies')],
        },
        {
            slot: 'generator_2', name: 'Flammèche vive', gain: 1,
            desc: '3 dégâts à un ennemi.',
            effects: [dmg(3)],
        },
        {
            /*
             * 2 PV et non 3 : conséquence en cascade de l'échelle des soigneurs.
             *
             * Chiron, le support des créatures, soigne 3 — calé sur le « Toucher sensuel »
             * d'Aphrodite, qui est sa carte jumelle. Le support des SERVITEURS doit donc passer
             * sous lui, et le Feu follet est le seul serviteur support qui soigne.
             *
             * Le prix reste doux : la carte coûte 1 énergie et en rend 1, donc ce soin de 2 est
             * gratuit — ce qu'aucune des cartes de Chiron ou d'Aphrodite n'offre.
             */
            slot: 'skill_1', name: 'Chaleur bienveillante', gain: 1,
            desc: 'Soigne un allié de 2 PV et rend 1 énergie.',
            effects: [heal(2)],
        },
        {
            slot: 'skill_2', name: 'Cœur incandescent',
            desc: '1 dégât à tous les ennemis et une marque de brûlure à chacun.',
            effects: [dmg(1, 'all_enemies'), status('burn', 1, 'all_enemies')],
        },
        {
            // Deux effets `enemy_god` au lieu d'une zone : le moteur avance d'une cible par
            // effet, donc le joueur en désigne deux — et deux seulement.
            slot: 'utility_1', name: 'Morsure de braise',
            desc: 'Une marque de brûlure à 2 cibles.',
            effects: [status('burn', 1), status('burn', 1)],
        },
    ],
);
