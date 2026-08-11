import { servant, creature, kit, mergeKits, dmg, heal, shield, draw, discard, status } from './builders';

/**
 * Bestiaire de DIONYSOS (Terre 🌿)
 *
 * Serviteurs : la Ménade, prise de transe bacchique, qui déchire à mains nues (saignement) ; le
 * Satyre, chapardeur et moqueur, qui vide la main de l'adversaire.
 *
 * Créatures : la Panthère de Dionysos, fauve attelé à son char (bond, saignement) ; Silène, le
 * vieux précepteur du dieu, toujours ivre et étonnamment increvable (mur qui se soigne).
 */

const menade = kit(
    servant({
        id: 'menade', name: 'Ménade', element: 'earth', hp: 14, god: 'dionysos',
        flavor: '"Le dieu est en moi. Je ne sens plus mes mains, et pourtant elles déchirent."',
    }),
    {
        generators: [
            { id: 'transe', name: 'Transe Bacchique', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'thyrse', name: 'Thyrse Levé', gain: 2, desc: '+2 énergie, 1 dégât et 1 saignement.', effects: [dmg(1), status('bleed', 1)] },
        ],
        competences: [
            { id: 'dechirure', name: 'Déchirure', cost: 1, desc: '2 dégâts et 2 saignements.', effects: [dmg(2), status('bleed', 2, 'same')] },
            { id: 'ronde', name: 'Ronde Sauvage', cost: 2, desc: '2 dégâts à tous les ennemis.', effects: [dmg(2, 'all_enemies')] },
        ],
        utility: {
            id: 'extase', name: 'Extase', cost: 1,
            desc: 'Se soigne de 3.',
            effects: [heal(3, 'self')],
        },
    },
);

const satyre = kit(
    servant({
        id: 'satyre', name: 'Satyre', element: 'earth', hp: 12, god: 'dionysos',
        flavor: '"Tu avais une belle carte en main. Avais."',
    }),
    {
        generators: [
            { id: 'flute', name: 'Flûte de Pan', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'gambade', name: 'Gambade', gain: 2, desc: '+2 énergie, 1 dégât et pioche 1 carte.', effects: [dmg(1), draw(1)] },
        ],
        competences: [
            { id: 'chapardage', name: 'Chapardage', cost: 1, desc: 'L\'adversaire défausse 1 carte.', effects: [discard(1)] },
            { id: 'coup_bas', name: 'Coup Bas', cost: 2, desc: 'Inflige 4 dégâts.', effects: [dmg(4)] },
        ],
        utility: {
            id: 'esquive', name: 'Esquive Moqueuse', cost: 1,
            desc: 'Bouclier 3 sur soi et pioche 1 carte.',
            effects: [shield(3), draw(1)],
        },
    },
);

const panthere = kit(
    creature({
        id: 'panthere_dionysos', name: 'Panthère de Dionysos', element: 'earth', hp: 21, god: 'dionysos',
        flavor: '"Elle tire le char du dieu. Le reste du temps, elle chasse pour son plaisir."',
    }),
    {
        generators: [
            { id: 'aguet', name: 'Aux Aguets', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'souplesse', name: 'Souplesse Féline', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 3.', effects: [dmg(1), shield(3)] },
        ],
        competences: [
            { id: 'bond', name: 'Bond Fauve', cost: 2, desc: '4 dégâts et 2 saignements.', effects: [dmg(4), status('bleed', 2, 'same')] },
            { id: 'rugissement', name: 'Rugissement', cost: 3, desc: '3 dégâts à tous les ennemis.', effects: [dmg(3, 'all_enemies')] },
        ],
        utility: {
            id: 'griffade', name: 'Griffade', cost: 1,
            desc: 'Inflige 4 dégâts.',
            effects: [dmg(4)],
        },
    },
);

const silene = kit(
    creature({
        id: 'silene', name: 'Silène', element: 'earth', hp: 26, god: 'dionysos',
        flavor: '"J\'ai élevé un dieu et bu plus que lui. Tu crois vraiment me faire tomber ?"',
    }),
    {
        generators: [
            { id: 'outre', name: 'Outre de Vin', gain: 3, desc: '+3 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'titubation', name: 'Titubation', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 3.', effects: [dmg(1), shield(3)] },
        ],
        competences: [
            { id: 'coup_outre', name: 'Coup d\'Outre', cost: 2, desc: 'Inflige 5 dégâts.', effects: [dmg(5)] },
            { id: 'ivresse', name: 'Ivresse Contagieuse', cost: 3, desc: 'Étourdit un ennemi 1 tour.', effects: [status('stun', 1, 'enemy_god', 1)] },
        ],
        utility: {
            id: 'sagesse', name: 'Sagesse de l\'Ivrogne', cost: 2,
            desc: 'Se soigne de 4, provocation sur soi et bouclier 3.',
            effects: [heal(4, 'self'), status('provocation', 1, 'self', 2), shield(3)],
        },
    },
);

export const dionysosBestiary = mergeKits(menade, satyre, panthere, silene);
