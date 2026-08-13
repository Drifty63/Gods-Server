import { servant, creature, kit, mergeKits, dmg, heal, shield, draw, status, cleanse } from './builders';

/**
 * Bestiaire de ZEUS (Foudre ⚡)
 *
 * Serviteurs : Ganymède, l'échanson enlevé par l'aigle pour verser le nectar aux dieux (soutien,
 * soin) ; les Courètes, qui entrechoquaient leurs boucliers pour couvrir les cris du Zeus
 * nourrisson et le cacher de Cronos (protection, vacarme étourdissant).
 *
 * Créatures : l'Aigle de Zeus, porteur de la foudre et bourreau de Prométhée dont il rouvrait
 * chaque jour le flanc (saignement) ; Pégase, né du sang de la Gorgone, qui finit par porter le
 * tonnerre sur l'Olympe (vitesse, pioche).
 */

const ganymede = kit(
    servant({
        id: 'ganymede', name: 'Ganymède, Échanson', element: 'lightning', hp: 12, god: 'zeus',
        flavor: '"L\'aigle m\'a arraché à la terre. Je verse désormais le nectar qui rend les dieux immortels."',
    }),
    {
        generators: [
            { id: 'nectar', name: 'Coupe de Nectar', gain: 2, desc: '+2 énergie, 1 dégât et soigne un allié de 2.', effects: [dmg(1), heal(2)] },
            { id: 'ambroisie', name: 'Part d\'Ambroisie', gain: 2, desc: '+2 énergie, 1 dégât et pioche 1 carte.', effects: [dmg(1), draw(1)] },
        ],
        competences: [
            { id: 'rapt', name: 'Rapt de l\'Aigle', desc: 'Inflige 3 dégâts.', effects: [dmg(3)] },
            { id: 'echanson', name: 'Service de l\'Olympe', desc: 'Inflige 4 dégâts.', effects: [dmg(4)] },
        ],
        utility: {
            id: 'immortalite', name: 'Don d\'Immortalité', desc: 'Régénération 2 sur un allié et retire son poison.', effects: [status('regen', 2, 'ally_god', 3), cleanse('poison')],
        },
    },
);

const courete = kit(
    servant({
        id: 'courete', name: 'Courète du Berceau', element: 'lightning', hp: 16, god: 'zeus', arch: 'tank',
        flavor: '"Frappez vos boucliers ! Que Cronos n\'entende jamais pleurer l\'enfant."',
    }),
    {
        generators: [
            { id: 'fracas', name: 'Fracas de Boucliers', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'danse', name: 'Danse Armée', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 2.', effects: [dmg(1), shield(2)] },
        ],
        competences: [
            { id: 'lance', name: 'Lance Crétoise', desc: 'Inflige 3 dégâts.', effects: [dmg(3)] },
            { id: 'garde', name: 'Garde du Berceau', desc: 'Provocation sur soi 2 tours et bouclier 3.', effects: [status('provocation', 1, 'self', 2), shield(3)] },
        ],
        utility: {
            id: 'vacarme', name: 'Vacarme Assourdissant', desc: 'Étourdit un ennemi 1 tour.', effects: [status('stun', 1, 'enemy_god', 1)],
        },
    },
);

const aigle = kit(
    creature({
        id: 'aigle_zeus', name: 'Aigle de Zeus', element: 'lightning', hp: 21, god: 'zeus',
        flavor: '"Chaque jour je fends le flanc du Titan, et chaque nuit sa chair repousse pour mes serres."',
    }),
    {
        generators: [
            { id: 'ascendance', name: 'Ascendance', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'piquer', name: 'Piqué', gain: 2, desc: '+2 énergie et 2 dégâts.', effects: [dmg(2)] },
        ],
        competences: [
            { id: 'supplice', name: 'Supplice de Prométhée', desc: '2 dégâts et 2 saignements.', effects: [dmg(2), status('bleed', 2, 'same')] },
            { id: 'charognard', name: 'Festin du Charognard', desc: '3 dégâts à un ennemi et se soigne de 3.', effects: [dmg(3), heal(3, 'self')] },
        ],
        utility: {
            id: 'fonte', name: 'Fonte du Ciel', desc: '3 dégâts à tous les ennemis.', effects: [dmg(3, 'all_enemies')],
        },
    },
);

const pegase = kit(
    creature({
        id: 'pegase', name: 'Pégase', element: 'air', hp: 23, god: 'zeus', arch: 'support',
        flavor: '"Né du sang de la Gorgone, je porte aujourd\'hui le tonnerre du maître de l\'Olympe."',
    }),
    {
        generators: [
            { id: 'envol', name: 'Envol', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'galop', name: 'Galop Céleste', gain: 2, desc: '+2 énergie, 1 dégât et pioche 1 carte.', effects: [dmg(1), draw(1)] },
        ],
        competences: [
            { id: 'ruade', name: 'Ruade Ailée', desc: 'Inflige 4 dégâts.', effects: [dmg(4)] },
            { id: 'hippocrene', name: 'Source Hippocrène', desc: 'Soigne tous les alliés de 3.', effects: [heal(3, 'all_allies')] },
        ],
        utility: {
            id: 'foudre', name: 'Foudre Portée', desc: 'Inflige 7 dégâts.', effects: [dmg(7)],
        },
    },
);

export const zeusBestiary = mergeKits(ganymede, courete, aigle, pegase);
