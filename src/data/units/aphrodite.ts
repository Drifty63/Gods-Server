import { servant, creature, kit, mergeKits, dmg, heal, shield, draw, discard, status, cleanse } from './builders';

/**
 * Bestiaire d'APHRODITE (Lumière ☀️)
 *
 * Serviteurs : Éros, dont la flèche prive de volonté (étourdissement) ; la Charite, l'une des Grâces
 * qui accompagnent la déesse (soin, purification).
 *
 * Créatures : la Sirène, dont le chant détourne les marins de leur route et les fait tout lâcher
 * (défausse, étourdissement) ; Adonis, le mortel si beau qu'Aphrodite et Perséphone se le
 * disputèrent jusqu'aux Enfers (mur qui se soigne).
 */

const eros = kit(
    servant({
        id: 'eros', name: 'Éros', element: 'light', hp: 12, god: 'aphrodite',
        flavor: '"Ma flèche ne tue pas. Elle te fait simplement oublier pourquoi tu te battais."',
    }),
    {
        generators: [
            { id: 'arc', name: 'Arc d\'Or', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'caprice', name: 'Caprice', gain: 2, desc: '+2 énergie, 1 dégât et pioche 1 carte.', effects: [dmg(1), draw(1)] },
        ],
        competences: [
            { id: 'trait', name: 'Trait de Plomb', desc: 'Inflige 3 dégâts.', effects: [dmg(3)] },
            { id: 'passion', name: 'Passion Brûlante', desc: '2 dégâts et 2 saignements.', effects: [dmg(2), status('bleed', 2, 'same')] },
        ],
        utility: {
            id: 'fleche', name: 'Flèche du Désir', desc: 'Étourdit un ennemi 1 tour.', effects: [status('stun', 1, 'enemy_god', 1)],
        },
    },
);

const charite = kit(
    servant({
        id: 'charite', name: 'Charite', element: 'light', hp: 14, god: 'aphrodite',
        flavor: '"La grâce n\'est pas une faiblesse. Elle recoud ce que la guerre déchire."',
    }),
    {
        generators: [
            { id: 'grace', name: 'Grâce', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'baume', name: 'Baume de Beauté', gain: 2, desc: '+2 énergie, 1 dégât et soigne un allié de 2.', effects: [dmg(1), heal(2)] },
        ],
        competences: [
            { id: 'eclat', name: 'Éclat Aveuglant', desc: 'Inflige 3 dégâts.', effects: [dmg(3)] },
            { id: 'seduction', name: 'Séduction', desc: 'Inflige 4 dégâts.', effects: [dmg(4)] },
        ],
        utility: {
            id: 'danse', name: 'Danse des Grâces', desc: 'Soigne tous les alliés de 2 et retire leur poison.', effects: [heal(2, 'all_allies'), cleanse('poison')],
        },
    },
);

const sirene = kit(
    creature({
        id: 'sirene', name: 'Sirène', element: 'water', hp: 22, god: 'aphrodite',
        flavor: '"Approche. Lâche tes armes. Tu n\'en auras plus besoin, là où je t\'emmène."',
    }),
    {
        generators: [
            { id: 'appel', name: 'Appel du Large', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'ecailles', name: 'Écailles Nacrées', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 3.', effects: [dmg(1), shield(3)] },
        ],
        competences: [
            { id: 'naufrage', name: 'Naufrage', desc: '3 dégâts et l\'adversaire défausse 1 carte.', effects: [dmg(3), discard(1)] },
            { id: 'recifs', name: 'Récifs', desc: '1 dégât à tous les ennemis et 1 saignement.', effects: [dmg(1, 'all_enemies'), status('bleed', 1)] },
        ],
        utility: {
            id: 'chant', name: 'Chant Envoûtant', desc: 'Étourdit un ennemi 1 tour.', effects: [status('stun', 1, 'enemy_god', 1)],
        },
    },
);

const adonis = kit(
    creature({
        id: 'adonis', name: 'Adonis', element: 'light', hp: 23, god: 'aphrodite',
        flavor: '"Deux déesses se sont battues pour moi. Crois-tu vraiment pouvoir me faire tomber ?"',
    }),
    {
        generators: [
            { id: 'charme', name: 'Charme Naturel', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'chasse', name: 'Cor de Chasse', gain: 2, desc: '+2 énergie et 2 dégâts.', effects: [dmg(2)] },
        ],
        competences: [
            { id: 'epieu', name: 'Épieu de Chasse', desc: 'Inflige 5 dégâts.', effects: [dmg(5)] },
            { id: 'anemone', name: 'Anémone de Sang', desc: '2 dégâts et 1 saignement.', effects: [dmg(2), status('bleed', 1, 'same')] },
        ],
        utility: {
            id: 'faveur', name: 'Faveur des Déesses', desc: 'Se soigne de 4, régénération 2 et provocation sur soi.', effects: [heal(4, 'self'), status('regen', 2, 'self', 3), status('provocation', 1, 'self', 2)],
        },
    },
);

export const aphroditeBestiary = mergeKits(eros, charite, sirene, adonis);
