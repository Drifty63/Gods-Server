import { servant, creature, kit, mergeKits, dmg, heal, shield, draw, status } from './builders';

/**
 * Bestiaire d'ARTÉMIS (Air 💨)
 *
 * Serviteurs : le Molosse de la déesse, chien de chasse qui mord et lâche pour laisser la proie se
 * vider (saignement) ; la Nymphe Chasseresse de son cortège (tir précis, mobilité).
 *
 * Créatures : la Biche de Cérynie, aux cornes d'or, si rapide qu'Héraclès mit un an à la prendre —
 * rendue par du tempo et de l'esquive plutôt que par de la force ; l'Ourse de Callisto, la nymphe
 * changée en bête, devenue une masse de muscles et de rancune.
 */

const molosse = kit(
    servant({
        id: 'molosse_artemis', name: 'Molosse d\'Artémis', element: 'air', hp: 13, god: 'artemis',
        flavor: '"Il ne tue pas d\'un coup. Il mord, il lâche, et il attend."',
    }),
    {
        generators: [
            { id: 'flair', name: 'Flair', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'aboiement', name: 'Aboiement', gain: 2, desc: '+2 énergie, 1 dégât et 1 saignement.', effects: [dmg(1), status('bleed', 1)] },
        ],
        competences: [
            { id: 'morsure', name: 'Morsure et Lâcher', desc: '2 dégâts et 2 saignements.', effects: [dmg(2), status('bleed', 2, 'same')] },
            { id: 'curee', name: 'Curée', desc: 'Se soigne de 3.', effects: [heal(3, 'self')] },
        ],
        utility: {
            id: 'croc', name: 'Croc Profond', desc: 'Inflige 4 dégâts.', effects: [dmg(4)],
        },
    },
);

const nymphe = kit(
    servant({
        id: 'nymphe_chasseresse', name: 'Nymphe Chasseresse', element: 'air', hp: 14, god: 'artemis',
        flavor: '"Nous courons avec la déesse. Aucun homme ne nous suit."',
    }),
    {
        generators: [
            { id: 'affut', name: 'À l\'Affût', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'pistage', name: 'Pistage', gain: 2, desc: '+2 énergie, 1 dégât et pioche 1 carte.', effects: [dmg(1), draw(1)] },
        ],
        competences: [
            { id: 'fleche', name: 'Flèche Précise', desc: 'Inflige 4 dégâts.', effects: [dmg(4)] },
            { id: 'repli', name: 'Repli dans les Bois', desc: 'Bouclier 4 sur soi.', effects: [shield(4)] },
        ],
        utility: {
            id: 'volee', name: 'Volée de Flèches', desc: '2 dégâts à tous les ennemis.', effects: [dmg(2, 'all_enemies')],
        },
    },
);

const biche = kit(
    creature({
        id: 'biche_cerynie', name: 'Biche de Cérynie', element: 'air', hp: 20, god: 'artemis', arch: 'support',
        flavor: '"Cornes d\'or, sabots d\'airain. Le héros m\'a poursuivie une année entière."',
    }),
    {
        generators: [
            { id: 'bond', name: 'Bond d\'Airain', gain: 3, desc: '+3 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'course', name: 'Course Insaisissable', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 3.', effects: [dmg(1), shield(3)] },
        ],
        competences: [
            { id: 'cornes', name: 'Cornes d\'Or', desc: 'Inflige 5 dégâts.', effects: [dmg(5)] },
            { id: 'ruade', name: 'Ruade', desc: 'Inflige 3 dégâts.', effects: [dmg(3)] },
        ],
        utility: {
            id: 'clairiere', name: 'Clairière Sacrée', desc: 'Soigne tous les alliés de 3.', effects: [heal(3, 'all_allies')],
        },
    },
);

const ourse = kit(
    creature({
        id: 'ourse_callisto', name: 'Ourse de Callisto', element: 'earth', hp: 26, god: 'artemis', arch: 'tank',
        flavor: '"J\'étais nymphe. On m\'a faite bête. Il me reste la force, et la rancune."',
    }),
    {
        generators: [
            { id: 'grognement', name: 'Grognement', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'fourrure', name: 'Fourrure Épaisse', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 3.', effects: [dmg(1), shield(3)] },
        ],
        competences: [
            { id: 'coup_griffe', name: 'Coup de Griffes', desc: '3 dégâts et 2 saignements.', effects: [dmg(3), status('bleed', 2, 'same')] },
            { id: 'maternelle', name: 'Protection Maternelle', desc: 'Provocation sur soi 2 tours et bouclier 4.', effects: [status('provocation', 1, 'self', 2), shield(4)] },
        ],
        utility: {
            id: 'etreinte', name: 'Étreinte de l\'Ourse', desc: 'Inflige 6 dégâts.', effects: [dmg(6)],
        },
    },
);

export const artemisBestiary = mergeKits(molosse, nymphe, biche, ourse);
