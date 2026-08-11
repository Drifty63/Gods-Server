import { servant, creature, kit, mergeKits, dmg, shield, draw, status, cleanse } from './builders';

/**
 * Bestiaire d'ATHÉNA (Lumière ☀️)
 *
 * Serviteurs : l'Hoplite d'Athènes, discipline et mur de boucliers ; la Chouette, qui voit dans
 * le noir ce que les autres ignorent (pioche).
 *
 * Créatures : Méduse, dont le regard change la chair en pierre — elle porte le statut de
 * PÉTRIFICATION, qui empêche d'agir ET d'être soigné ; Persée, le héros qui la décapita avec
 * l'aide d'Athéna et se servit ensuite de sa tête comme d'une arme.
 */

const hoplite = kit(
    servant({
        id: 'hoplite_athenes', name: 'Hoplite d\'Athènes', element: 'light', hp: 17, god: 'athena',
        flavor: '"La phalange ne recule pas. Le bouclier de mon voisin est ma vie."',
    }),
    {
        generators: [
            { id: 'discipline', name: 'Discipline', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'cadence', name: 'Cadence de Marche', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 2.', effects: [dmg(1), shield(2)] },
        ],
        competences: [
            { id: 'estoc', name: 'Estoc d\'Hoplite', cost: 1, desc: 'Inflige 3 dégâts.', effects: [dmg(3)] },
            { id: 'charge', name: 'Charge Ordonnée', cost: 3, desc: 'Inflige 5 dégâts.', effects: [dmg(5)] },
        ],
        utility: {
            id: 'phalange', name: 'Mur de Phalange', cost: 2,
            desc: 'Bouclier 2 à tous les alliés et provocation sur soi.',
            effects: [shield(2, 'all_allies'), status('provocation', 1, 'self', 2)],
        },
    },
);

const chouette = kit(
    servant({
        id: 'chouette_athena', name: 'Chouette d\'Athéna', element: 'light', hp: 11, god: 'athena',
        flavor: '"Je vois vos plans avant que vous ne les ayez pensés."',
    }),
    {
        generators: [
            { id: 'veille', name: 'Veille Nocturne', gain: 2, desc: '+2 énergie, 1 dégât et pioche 1 carte.', effects: [dmg(1), draw(1)] },
            { id: 'augure', name: 'Bon Augure', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
        ],
        competences: [
            { id: 'serres', name: 'Serres Silencieuses', cost: 1, desc: 'Inflige 3 dégâts.', effects: [dmg(3)] },
            { id: 'fondre', name: 'Fondre sur la Proie', cost: 2, desc: 'Inflige 4 dégâts.', effects: [dmg(4)] },
        ],
        utility: {
            id: 'sagesse', name: 'Sagesse Partagée', cost: 2,
            desc: 'Pioche 2 cartes et retire l\'étourdissement d\'un allié.',
            effects: [draw(2), cleanse('stun')],
        },
    },
);

const meduse = kit(
    creature({
        id: 'meduse', name: 'Méduse', element: 'darkness', hp: 22, god: 'athena',
        flavor: '"Regarde-moi. Je te ferai le cadeau que la déesse m\'a fait : l\'éternité, immobile."',
    }),
    {
        generators: [
            { id: 'sifflement', name: 'Sifflement des Serpents', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'chevelure', name: 'Chevelure Grouillante', gain: 2, desc: '+2 énergie, 1 dégât et 1 poison.', effects: [dmg(1), status('poison', 1)] },
        ],
        competences: [
            { id: 'regard', name: 'Regard Pétrifiant', cost: 3, desc: 'Pétrifie un ennemi 1 tour : il ne peut ni agir ni être soigné.', effects: [status('petrify', 1, 'enemy_god', 1)] },
            { id: 'morsure', name: 'Morsure Venimeuse', cost: 1, desc: '2 dégâts et 3 poisons.', effects: [dmg(2), status('poison', 3, 'same')] },
        ],
        utility: {
            id: 'gorgone', name: 'Face de Gorgone', cost: 2,
            desc: 'Inflige 5 dégâts.',
            effects: [dmg(5)],
        },
    },
);

const persee = kit(
    creature({
        id: 'persee', name: 'Persée', element: 'light', hp: 23, god: 'athena',
        flavor: '"Le bouclier d\'Athéna m\'a montré son reflet. Sa tête m\'a donné son pouvoir."',
    }),
    {
        generators: [
            { id: 'sandales', name: 'Sandales Ailées', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'casque', name: 'Casque d\'Invisibilité', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 3.', effects: [dmg(1), shield(3)] },
        ],
        competences: [
            { id: 'harpe', name: 'Harpé d\'Adamant', cost: 2, desc: '4 dégâts et 1 saignement.', effects: [dmg(4), status('bleed', 1, 'same')] },
            { id: 'decapitation', name: 'Décapitation', cost: 3, desc: 'Inflige 7 dégâts.', effects: [dmg(7)] },
        ],
        utility: {
            id: 'tete_gorgone', name: 'Tête de la Gorgone', cost: 3,
            desc: 'Pétrifie un ennemi 1 tour.',
            effects: [status('petrify', 1, 'enemy_god', 1)],
        },
    },
);

export const athenaBestiary = mergeKits(hoplite, chouette, meduse, persee);
