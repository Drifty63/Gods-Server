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
            { id: 'hache', name: 'Hache Thrace', desc: 'Inflige 4 dégâts.', effects: [dmg(4)] },
            { id: 'taillade', name: 'Taillade Sauvage', desc: '3 dégâts et 1 saignement.', effects: [dmg(3), status('bleed', 1, 'same')] },
        ],
        utility: {
            id: 'ivresse', name: 'Ivresse du Sang', desc: 'Se soigne de 4.', effects: [heal(4, 'self')],
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
            { id: 'hampe', name: 'Coup de Hampe', desc: 'Inflige 3 dégâts.', effects: [dmg(3)] },
            { id: 'avance', name: 'Avance au Pas', desc: '1 dégât à tous les ennemis et bouclier 2.', effects: [dmg(1, 'all_enemies'), shield(2)] },
        ],
        utility: {
            id: 'serment', name: 'Serment au Dieu', desc: 'Provocation sur soi 2 tours et soigne un allié de 3.', effects: [status('provocation', 1, 'self', 2), heal(3)],
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
            { id: 'encornade', name: 'Encornade', desc: '3 dégâts et 2 saignements.', effects: [dmg(3), status('bleed', 2, 'same')] },
            { id: 'rage', name: 'Rage Bestiale', desc: 'Bouclier 5 sur soi.', effects: [shield(5)] },
        ],
        utility: {
            id: 'pietinement', name: 'Piétinement', desc: '3 dégâts à tous les ennemis.', effects: [dmg(3, 'all_enemies')],
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
            { id: 'composite', name: 'Chair Composite', desc: 'Régénération 2 sur soi et bouclier 3.', effects: [status('regen', 2, 'self', 3), shield(3)] },
            { id: 'griffes', name: 'Griffes de Lion', desc: '4 dégâts et 1 saignement.', effects: [dmg(4), status('bleed', 1, 'same')] },
        ],
        utility: {
            id: 'souffle_feu', name: 'Souffle de Feu', desc: '3 dégâts à tous les ennemis.', effects: [dmg(3, 'all_enemies')],
        },
    },
);

export const aresBestiary = mergeKits(berserker, etendard, minotaure, chimere);
