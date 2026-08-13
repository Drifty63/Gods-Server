import { servant, creature, kit, mergeKits, dmg, heal, shield, mill, discard, status } from './builders';

/**
 * Bestiaire de NYX (Ténèbres 💀)
 *
 * Serviteurs : Oneiros, l'un des Songes enfantés par la Nuit, qui endort au lieu de frapper
 * (étourdissement, meule) ; l'Ombre Voilée, sentinelle du crépuscule qui frappe sans être vue.
 *
 * Créatures : l'Empouse, démone nocturne qui se repaît du sang des voyageurs isolés (vol de vie) ;
 * Lamia, qui rôde la nuit et arrache aux mères ce qu'elles ont de plus cher (défausse forcée).
 */

const oneiros = kit(
    servant({
        id: 'oneiros', name: 'Oneiros, Esprit des Songes', element: 'darkness', hp: 11, god: 'nyx',
        flavor: '"Je ne te tuerai pas. Je te ferai simplement dormir, et tu ne verras pas la fin."',
    }),
    {
        generators: [
            { id: 'torpeur', name: 'Torpeur', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'brume', name: 'Brume Onirique', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 2.', effects: [dmg(1), shield(2)] },
        ],
        competences: [
            { id: 'murmure', name: 'Murmure Endormant', desc: 'Inflige 3 dégâts.', effects: [dmg(3)] },
            { id: 'cauchemar', name: 'Cauchemar', desc: '2 dégâts et meule 2 cartes.', effects: [dmg(2), mill(2)] },
        ],
        utility: {
            id: 'songe', name: 'Songe Profond', desc: 'Étourdit un ennemi 1 tour.', effects: [status('stun', 1, 'enemy_god', 1)],
        },
    },
);

const ombre = kit(
    servant({
        id: 'ombre_voilee', name: 'Ombre Voilée', element: 'darkness', hp: 15, god: 'nyx',
        flavor: '"La Nuit m\'a tissé un voile. Tu ne sauras jamais d\'où vient le coup."',
    }),
    {
        generators: [
            { id: 'penombre', name: 'Pénombre', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'voile', name: 'Voile de Nuit', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 2.', effects: [dmg(1), shield(2)] },
        ],
        competences: [
            { id: 'dague', name: 'Dague de l\'Ombre', desc: '3 dégâts et 1 saignement.', effects: [dmg(3), status('bleed', 1, 'same')] },
            { id: 'embuscade', name: 'Embuscade', desc: 'Inflige 4 dégâts.', effects: [dmg(4)] },
        ],
        utility: {
            id: 'effacement', name: 'Effacement', desc: 'Se soigne de 3 et régénération 1.', effects: [heal(3, 'self'), status('regen', 1, 'self', 2)],
        },
    },
);

const empousa = kit(
    creature({
        id: 'empousa', name: 'Empouse', element: 'darkness', hp: 21, god: 'nyx',
        flavor: '"Marche seul sur la route, voyageur. Je t\'y attends depuis toujours."',
    }),
    {
        generators: [
            { id: 'appel', name: 'Appel de la Route', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'griffes', name: 'Griffes de Bronze', gain: 2, desc: '+2 énergie et 2 dégâts.', effects: [dmg(2)] },
        ],
        competences: [
            { id: 'festin', name: 'Festin de Sang', desc: '4 dégâts et se soigne de 4.', effects: [dmg(4), heal(4, 'self')] },
            { id: 'saignee', name: 'Saignée', desc: '3 dégâts et 2 saignements.', effects: [dmg(3), status('bleed', 2, 'same')] },
        ],
        utility: {
            id: 'charme', name: 'Charme Nocturne', desc: 'Étourdit un ennemi 1 tour.', effects: [status('stun', 1, 'enemy_god', 1)],
        },
    },
);

const lamia = kit(
    creature({
        id: 'lamia', name: 'Lamia', element: 'darkness', hp: 24, god: 'nyx', arch: 'glass_cannon',
        flavor: '"On m\'a pris mes enfants. Depuis, je prends ceux des autres."',
    }),
    {
        generators: [
            { id: 'rode', name: 'Rôdeuse Nocturne', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'ecailles', name: 'Écailles de Serpent', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 3.', effects: [dmg(1), shield(3)] },
        ],
        competences: [
            { id: 'rapt', name: 'Rapt', desc: 'L\'adversaire défausse 2 cartes.', effects: [discard(2)] },
            { id: 'deuil', name: 'Deuil Éternel', desc: '3 dégâts et l\'adversaire défausse 1 carte.', effects: [dmg(3), discard(1)] },
        ],
        utility: {
            id: 'etreinte', name: 'Étreinte Fatale', desc: 'Inflige 6 dégâts.', effects: [dmg(6)],
        },
    },
);

export const nyxBestiary = mergeKits(oneiros, ombre, empousa, lamia);
