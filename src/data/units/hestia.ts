import { servant, creature, kit, mergeKits, dmg, heal, shield, status, cleanse } from './builders';

/**
 * Bestiaire d'HESTIA (Feu 🔥)
 *
 * Serviteurs : la Vestale, gardienne du feu qui ne doit jamais s'éteindre (soin, purification) ;
 * le Gardien de l'Âtre, qui se place entre le foyer et la menace (mur défensif).
 *
 * Créatures : le Phénix, qui se consume et renaît de ses cendres — rendu par une régénération forte
 * plutôt que par une vraie résurrection, que le moteur réserve aux dieux ; la Salamandre des
 * Braises, qui vit dans le feu et dont le contact brûle longtemps après (poison).
 */

const vestale = kit(
    servant({
        id: 'vestale', name: 'Vestale du Foyer', element: 'fire', hp: 13, god: 'hestia',
        flavor: '"Tant que je veille, la flamme ne meurt pas. Et tant qu\'elle vit, vous vivez."',
    }),
    {
        generators: [
            { id: 'flamme', name: 'Flamme Éternelle', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'veille', name: 'Veille du Foyer', gain: 2, desc: '+2 énergie, 1 dégât et soigne un allié de 2.', effects: [dmg(1), heal(2)] },
        ],
        competences: [
            { id: 'braise', name: 'Braise Vive', cost: 1, desc: 'Inflige 3 dégâts.', effects: [dmg(3)] },
            { id: 'flambee', name: 'Flambée', cost: 2, desc: 'Inflige 4 dégâts.', effects: [dmg(4)] },
        ],
        utility: {
            id: 'purification', name: 'Purification par le Feu', cost: 1,
            desc: 'Soigne un allié de 3 et retire poison et saignement.',
            effects: [heal(3), cleanse('poison'), cleanse('bleed')],
        },
    },
);

const gardien = kit(
    servant({
        id: 'gardien_atre', name: 'Gardien de l\'Âtre', element: 'fire', hp: 16, god: 'hestia',
        flavor: '"Le foyer est derrière moi. Il faudra passer par mon corps."',
    }),
    {
        generators: [
            { id: 'souffle', name: 'Souffle sur les Braises', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'tisons', name: 'Tisons Remués', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 2.', effects: [dmg(1), shield(2)] },
        ],
        competences: [
            { id: 'masse', name: 'Masse Chauffée', cost: 1, desc: 'Inflige 3 dégâts.', effects: [dmg(3)] },
            { id: 'rempart', name: 'Coup de Rempart', cost: 2, desc: 'Inflige 4 dégâts.', effects: [dmg(4)] },
        ],
        utility: {
            id: 'devoir', name: 'Devoir du Gardien', cost: 2,
            desc: 'Provocation sur soi 2 tours et bouclier 4.',
            effects: [status('provocation', 1, 'self', 2), shield(4)],
        },
    },
);

const phenix = kit(
    creature({
        id: 'phenix', name: 'Phénix', element: 'fire', hp: 20, god: 'hestia',
        flavor: '"J\'ai déjà brûlé mille fois. La cendre n\'est qu\'une étape."',
    }),
    {
        generators: [
            { id: 'envol', name: 'Envol Incandescent', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'serres', name: 'Serres Brûlantes', gain: 2, desc: '+2 énergie, 1 dégât et 1 poison.', effects: [dmg(1), status('poison', 1)] },
        ],
        competences: [
            { id: 'cendres', name: 'Pluie de Cendres', cost: 3, desc: '3 dégâts à tous les ennemis.', effects: [dmg(3, 'all_enemies')] },
            { id: 'bucher', name: 'Bûcher', cost: 2, desc: 'Inflige 5 dégâts.', effects: [dmg(5)] },
        ],
        utility: {
            id: 'renaissance', name: 'Renaissance', cost: 2,
            desc: 'Régénération 3 sur soi et se soigne de 3.',
            effects: [status('regen', 3, 'self', 3), heal(3, 'self')],
        },
    },
);

const salamandre = kit(
    creature({
        id: 'salamandre_braises', name: 'Salamandre des Braises', element: 'fire', hp: 23, god: 'hestia',
        flavor: '"Touche-moi. La marque restera longtemps après que j\'aurai disparu."',
    }),
    {
        generators: [
            { id: 'chaleur', name: 'Chaleur Rampante', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'peau', name: 'Peau de Lave', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 3.', effects: [dmg(1), shield(3)] },
        ],
        competences: [
            { id: 'contact', name: 'Contact Brûlant', cost: 1, desc: '2 dégâts et 3 poisons.', effects: [dmg(2), status('poison', 3, 'same')] },
            { id: 'embrasement', name: 'Embrasement', cost: 3, desc: 'Inflige 6 dégâts.', effects: [dmg(6)] },
        ],
        utility: {
            id: 'fournaise', name: 'Fournaise', cost: 2,
            desc: '1 poison à tous les ennemis.',
            effects: [status('poison', 1, 'all_enemies')],
        },
    },
);

export const hestiaBestiary = mergeKits(vestale, gardien, phenix, salamandre);
