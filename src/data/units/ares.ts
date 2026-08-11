import { servant, creature, kit, mergeKits, dmg, heal, shield, status } from './builders';

/**
 * Bestiaire d'ARÈS (Terre 🌿)
 *
 * Arès possède déjà ses Soldats et le Dragon de Thèbes dans `gods.ts` (contenu du mode Histoire) ;
 * on complète ici son camp avec les unités les plus brutales du bestiaire.
 *
 * Serviteurs : le Berserker thrace, qui frappe sans se garder ; le Porte-Étendard, qui galvanise
 * la troupe (boucliers de groupe, provocation).
 *
 * Créatures : le Minotaure, dont les coups de corne ouvrent des plaies qui ne se ferment pas
 * (saignement lourd) ; la Chimère, monstre composite — lion, chèvre et serpent — qui crache le feu
 * et empoisonne de sa queue.
 */

const berserker = kit(
    servant({
        id: 'berserker_thrace', name: 'Berserker Thrace', element: 'earth', hp: 14, god: 'ares',
        flavor: '"La douleur ? Je la sentirai demain, quand tu seras mort."',
    }),
    {
        generators: [
            { id: 'fureur', name: 'Fureur Montante', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'cri', name: 'Cri de Guerre', gain: 2, desc: '+2 énergie et 2 dégâts.', effects: [dmg(2)] },
        ],
        competences: [
            { id: 'hache', name: 'Hache Thrace', cost: 1, desc: 'Inflige 4 dégâts.', effects: [dmg(4)] },
            { id: 'taillade', name: 'Taillade Sauvage', cost: 2, desc: '3 dégâts et 1 saignement.', effects: [dmg(3), status('bleed', 1, 'same')] },
        ],
        utility: {
            id: 'ivresse', name: 'Ivresse du Sang', cost: 2,
            desc: 'Se soigne de 4.',
            effects: [heal(4, 'self')],
        },
    },
);

const etendard = kit(
    servant({
        id: 'porte_etendard_ares', name: 'Porte-Étendard d\'Arès', element: 'earth', hp: 16, god: 'ares',
        flavor: '"Tant que l\'étendard tient debout, la ligne tient debout."',
    }),
    {
        generators: [
            { id: 'ralliement', name: 'Ralliement', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'tambour', name: 'Tambour de Guerre', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 2.', effects: [dmg(1), shield(2)] },
        ],
        competences: [
            { id: 'hampe', name: 'Coup de Hampe', cost: 1, desc: 'Inflige 3 dégâts.', effects: [dmg(3)] },
            { id: 'avance', name: 'Avance au Pas', cost: 2, desc: '2 dégâts à tous les ennemis.', effects: [dmg(2, 'all_enemies')] },
        ],
        utility: {
            id: 'serment', name: 'Serment au Dieu', cost: 2,
            desc: 'Provocation sur soi 2 tours et soigne un allié de 3.',
            effects: [status('provocation', 1, 'self', 2), heal(3)],
        },
    },
);

const minotaure = kit(
    creature({
        id: 'minotaure', name: 'Minotaure', element: 'earth', hp: 25, god: 'ares',
        flavor: '"Le Labyrinthe n\'a jamais été ma prison. C\'était mon garde-manger."',
    }),
    {
        generators: [
            { id: 'souffle', name: 'Souffle du Labyrinthe', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'grattement', name: 'Sabot Gratteur', gain: 2, desc: '+2 énergie et 2 dégâts.', effects: [dmg(2)] },
        ],
        competences: [
            { id: 'encornade', name: 'Encornade', cost: 2, desc: '3 dégâts et 3 saignements.', effects: [dmg(3), status('bleed', 3, 'same')] },
            { id: 'pietinement', name: 'Piétinement', cost: 3, desc: '3 dégâts à tous les ennemis.', effects: [dmg(3, 'all_enemies')] },
        ],
        utility: {
            id: 'rage', name: 'Rage Bestiale', cost: 1,
            desc: 'Bouclier 5 sur soi.',
            effects: [shield(5)],
        },
    },
);

const chimere = kit(
    creature({
        id: 'chimere', name: 'Chimère', element: 'fire', hp: 22, god: 'ares',
        flavor: '"Lion, chèvre et serpent. Trois façons de te tuer dans un seul corps."',
    }),
    {
        generators: [
            { id: 'rugissement', name: 'Rugissement Triple', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'queue', name: 'Queue de Serpent', gain: 2, desc: '+2 énergie, 1 dégât et 2 poisons.', effects: [dmg(1), status('poison', 2)] },
        ],
        competences: [
            { id: 'souffle_feu', name: 'Souffle de Feu', cost: 3, desc: '3 dégâts à tous les ennemis.', effects: [dmg(3, 'all_enemies')] },
            { id: 'griffes', name: 'Griffes de Lion', cost: 2, desc: '4 dégâts et 1 saignement.', effects: [dmg(4), status('bleed', 1, 'same')] },
        ],
        utility: {
            id: 'composite', name: 'Chair Composite', cost: 2,
            desc: 'Régénération 2 sur soi et bouclier 3.',
            effects: [status('regen', 2, 'self', 3), shield(3)],
        },
    },
);

export const aresBestiary = mergeKits(berserker, etendard, minotaure, chimere);
