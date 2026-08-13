import { servant, creature, kit, mergeKits, dmg, heal, shield, draw, mill, status, cleanse } from './builders';

/**
 * Bestiaire d'APOLLON (Air 💨)
 *
 * Serviteurs : la Pythie, oracle de Delphes qui rend les prophéties du dieu (pioche) ; la Muse, qui
 * inspire les mortels (soutien, soin).
 *
 * Créatures : Orphée, fils d'Apollon, dont la lyre endormait les bêtes et fléchissait les morts
 * (étourdissement plutôt que force brute) ; le Python de Delphes, le serpent que le dieu abattit
 * pour s'emparer de l'oracle (poison lourd).
 */

const pythie = kit(
    servant({
        id: 'pythie', name: 'Pythie de Delphes', element: 'air', hp: 11, god: 'apollon',
        flavor: '"Les vapeurs montent. Je vois ce qui n\'est pas encore, et cela me brûle."',
    }),
    {
        generators: [
            { id: 'vapeurs', name: 'Vapeurs Prophétiques', gain: 2, desc: '+2 énergie, 1 dégât et pioche 1 carte.', effects: [dmg(1), draw(1)] },
            { id: 'presage', name: 'Présage', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
        ],
        competences: [
            { id: 'transe', name: 'Transe Sacrée', desc: 'Inflige 3 dégâts.', effects: [dmg(3)] },
            { id: 'oracle', name: 'Oracle', desc: 'Pioche 2 cartes.', effects: [draw(2)] },
        ],
        utility: {
            id: 'verite', name: 'Vérité Cruelle', desc: '2 dégâts et meule 2 cartes.', effects: [dmg(2), mill(2)],
        },
    },
);

const muse = kit(
    servant({
        id: 'muse', name: 'Muse', element: 'air', hp: 13, god: 'apollon',
        flavor: '"Chante-moi, et je te donnerai les mots qui font tomber les rois."',
    }),
    {
        generators: [
            { id: 'inspiration', name: 'Inspiration', gain: 3, desc: '+3 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'harmonie', name: 'Harmonie', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 2.', effects: [dmg(1), shield(2)] },
        ],
        competences: [
            { id: 'verve', name: 'Verve Mordante', desc: 'Inflige 3 dégâts.', effects: [dmg(3)] },
            { id: 'satire', name: 'Satire', desc: 'Inflige 4 dégâts.', effects: [dmg(4)] },
        ],
        utility: {
            id: 'memoire', name: 'Mémoire Retrouvée', desc: 'Soigne un allié de 4 et retire son étourdissement.', effects: [heal(4), cleanse('stun')],
        },
    },
);

const orphee = kit(
    creature({
        id: 'orphee', name: 'Orphée', element: 'air', hp: 20, god: 'apollon', arch: 'support',
        flavor: '"Ma lyre a endormi Cerbère et fait pleurer Hadès. Tu penses résister ?"',
    }),
    {
        generators: [
            { id: 'accord', name: 'Premier Accord', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'corde', name: 'Corde Tranchante', gain: 2, desc: '+2 énergie et 2 dégâts.', effects: [dmg(2)] },
        ],
        competences: [
            { id: 'descente', name: 'Descente aux Enfers', desc: 'Soigne tous les alliés de 3.', effects: [heal(3, 'all_allies')] },
            { id: 'lamento', name: 'Lamento', desc: '1 dégât à tous les ennemis et 1 poison.', effects: [dmg(1, 'all_enemies'), status('poison', 1)] },
        ],
        utility: {
            id: 'berceuse', name: 'Berceuse de la Lyre', desc: 'Étourdit un ennemi 1 tour.', effects: [status('stun', 1, 'enemy_god', 1)],
        },
    },
);

const python = kit(
    creature({
        id: 'python_delphes', name: 'Python de Delphes', element: 'air', hp: 24, god: 'apollon', arch: 'glass_cannon',
        flavor: '"Je gardais l\'oracle avant qu\'un dieu-enfant ne me le prenne. Mon venin, lui, est resté."',
    }),
    {
        generators: [
            { id: 'sifflement', name: 'Sifflement de l\'Antre', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'ecailles', name: 'Écailles Antiques', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 3.', effects: [dmg(1), shield(3)] },
        ],
        competences: [
            { id: 'venin', name: 'Venin de Delphes', desc: '2 dégâts et 3 poisons.', effects: [dmg(2), status('poison', 3, 'same')] },
            { id: 'miasmes', name: 'Miasmes', desc: '1 poison à tous les ennemis.', effects: [status('poison', 1, 'all_enemies')] },
        ],
        utility: {
            id: 'constriction', name: 'Constriction', desc: 'Inflige 6 dégâts.', effects: [dmg(6)],
        },
    },
);

export const apollonBestiary = mergeKits(pythie, muse, orphee, python);
