import { servant, creature, kit, mergeKits, dmg, heal, shield, mill, status, cleanse } from './builders';

/**
 * Bestiaire de POSÉIDON (Eau 💧)
 *
 * Serviteurs : la Naïade, nymphe des sources d'eau douce (soin, purification) ; Triton, fils du
 * dieu, qui apaise ou soulève les flots en soufflant dans sa conque (zone, étourdissement).
 *
 * Créatures : Charybde, le gouffre qui engloutit ce qui passe à sa portée — rendu par de la meule
 * de deck plutôt que par des dégâts bruts ; Céto, monstre marin primordial et mère des monstres,
 * un mur qui provoque et fait saigner.
 */

const naiade = kit(
    servant({
        id: 'naiade', name: 'Naïade des Sources', element: 'water', hp: 12, god: 'poseidon', arch: 'support',
        flavor: '"Chaque source est ma sœur. Bois, et tes blessures s\'oublieront."',
    }),
    {
        generators: [
            { id: 'source', name: 'Source Claire', gain: 2, desc: '+2 énergie, 1 dégât et soigne un allié de 2.', effects: [dmg(1), heal(2)] },
            { id: 'ondee', name: 'Ondée', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
        ],
        competences: [
            { id: 'courant', name: 'Courant Vif', desc: 'Inflige 3 dégâts.', effects: [dmg(3)] },
            { id: 'lustrale', name: 'Eau Lustrale', desc: 'Soigne un allié de 3 et retire poison et saignement.', effects: [heal(3), cleanse('poison'), cleanse('bleed')] },
        ],
        utility: {
            id: 'lame_eau', name: 'Lame d\'Eau', desc: 'Inflige 4 dégâts.', effects: [dmg(4)],
        },
    },
);

const triton = kit(
    servant({
        id: 'triton', name: 'Triton, Héraut des Mers', element: 'water', hp: 16, god: 'poseidon', arch: 'tank',
        flavor: '"Ma conque décide : que la mer se couche, ou qu\'elle vous engloutisse."',
    }),
    {
        generators: [
            { id: 'conque', name: 'Appel de la Conque', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'ressac', name: 'Ressac', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 2.', effects: [dmg(1), shield(2)] },
        ],
        competences: [
            { id: 'trident', name: 'Trident du Héraut', desc: 'Inflige 3 dégâts.', effects: [dmg(3)] },
            { id: 'ecume', name: 'Voile d\'Écume', desc: 'Bouclier 4 sur soi.', effects: [shield(4)] },
        ],
        utility: {
            id: 'souffle', name: 'Souffle Assourdissant', desc: 'Étourdit un ennemi 1 tour.', effects: [status('stun', 1, 'enemy_god', 1)],
        },
    },
);

const charybde = kit(
    creature({
        id: 'charybde', name: 'Charybde', element: 'water', hp: 22, god: 'poseidon',
        flavor: '"Trois fois par jour j\'avale la mer, et trois fois je la rends. Ce qui tombe en moi ne revient pas."',
    }),
    {
        generators: [
            { id: 'remous', name: 'Remous', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'aspiration', name: 'Aspiration', gain: 2, desc: '+2 énergie, 1 dégât et meule 2 cartes.', effects: [dmg(1), mill(2)] },
        ],
        competences: [
            { id: 'engloutir', name: 'Engloutir', desc: '4 dégâts et meule 2 cartes.', effects: [dmg(4), mill(2)] },
            { id: 'reflux', name: 'Reflux', desc: 'Se soigne de 4.', effects: [heal(4, 'self')] },
        ],
        utility: {
            id: 'succion', name: 'Succion Abyssale', desc: '3 dégâts à tous les ennemis.', effects: [dmg(3, 'all_enemies')],
        },
    },
);

const ceto = kit(
    creature({
        id: 'ceto', name: 'Céto, Monstre Marin', element: 'water', hp: 26, god: 'poseidon', arch: 'tank',
        flavor: '"Mère des monstres, je dormais dans l\'abîme avant que vos temples n\'existent."',
    }),
    {
        generators: [
            { id: 'abysse', name: 'Souffle de l\'Abîme', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'lame_fond', name: 'Lame de Fond', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 2.', effects: [dmg(1), shield(2)] },
        ],
        competences: [
            { id: 'crocs', name: 'Crocs de Céto', desc: '3 dégâts et 2 saignements.', effects: [dmg(3), status('bleed', 2, 'same')] },
            { id: 'defi', name: 'Défi des Profondeurs', desc: 'Provocation sur soi 2 tours et bouclier 5.', effects: [status('provocation', 1, 'self', 2), shield(5)] },
        ],
        utility: {
            id: 'ecrasement', name: 'Écrasement', desc: 'Inflige 6 dégâts.', effects: [dmg(6)],
        },
    },
);

export const poseidonBestiary = mergeKits(naiade, triton, charybde, ceto);
