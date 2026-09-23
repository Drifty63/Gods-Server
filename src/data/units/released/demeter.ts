import { released, dmg, heal, shield, status, custom, pierce, cleanse } from '../builders';

/**
 * Unités publiées rattachées à DÉMÉTER (Terre 🌿).
 */

export const sirenes = released(
    {
        kind: 'servant', id: 'sirenes', name: 'Sirène',
        element: 'air', hp: 14, god: 'demeter', arch: 'support',
        flavor: "« Approche. Le récif ne fait jamais de bruit. » — Elle fige deux ennemis d'un même chant, vide leurs réserves et se dérobe avant la riposte.",
    },
    [
        {
            slot: 'generator_1', name: 'Note obsédante', gain: 1,
            desc: '1 dégât à tous les ennemis.',
            effects: [dmg(1, 'all_enemies')],
        },
        {
            slot: 'generator_2', name: 'Serres du récif', gain: 1,
            desc: '3 dégâts à un ennemi.',
            effects: [dmg(3)],
        },
        {
            slot: 'skill_1', name: 'Mélodie fatale',
            desc: 'Étourdit 2 cibles différentes pendant 1 tour.',
            effects: [status('stun', 1, 'enemy_god', 1), status('stun', 1, 'enemy_god', 1)],
        },
        {
            slot: 'skill_2', name: 'Chœur des égarés',
            desc: 'Fait perdre 2 énergies à l\'adversaire et devient inciblable pendant 2 tours.',
            effects: [
                custom('remove_energy_2', 'Fait perdre 2 énergies à l\'adversaire'),
                status('untargetable', 1, 'self', 2),
            ],
        },
        {
            slot: 'utility_1', name: 'Chant réparateur',
            desc: 'Soigne un allié de 4 PV.',
            effects: [heal(4)],
        },
    ],
);

/*
 * LE MINOTAURE est le premier brise-bouclier du jeu : aucun sort, jusqu'ici, ne retirait de
 * bouclier ni ne le traversait. Ses deux compétences attaquent la même défense par deux angles
 * opposés — l'une passe à travers sans l'entamer, l'autre l'efface entièrement.
 */
export const minotaure = released(
    {
        kind: 'creature', id: 'minotaure', name: 'Minotaure',
        element: 'earth', hp: 24, god: 'demeter', arch: 'glass_cannon',
        flavor: "« Le labyrinthe n'a qu'une règle : ce qui entre ne ressort pas. » — Aucun bouclier ne le retarde. Il passe à travers, ou il l'arrache.",
    },
    [
        {
            slot: 'generator_1', name: 'Charge écrasante', gain: 1,
            desc: '1 dégât à tous les ennemis.',
            effects: [dmg(1, 'all_enemies')],
        },
        {
            slot: 'generator_2', name: 'Taillade de bronze', gain: 1,
            desc: '3 dégâts à un ennemi.',
            effects: [dmg(3)],
        },
        {
            // Le bouclier n'est ni entamé ni consommé : 12 PV + 2 boucliers finit à 9 PV + 2.
            slot: 'skill_1', name: 'Coup de boule',
            desc: '3 dégâts à 2 cibles différentes, en ignorant le bouclier.',
            effects: [pierce(3), pierce(3)],
        },
        {
            // L'ORDRE EST TOUT : retirer le bouclier AVANT de frapper. Inversé, il absorberait
            // les 6 dégâts avant de disparaître.
            slot: 'skill_2', name: 'Piège sans issue',
            desc: 'Détruit tout le bouclier d\'une cible, puis lui inflige 6 dégâts.',
            effects: [cleanse('shield', 'enemy_god'), dmg(6, 'same')],
        },
        {
            slot: 'utility_1', name: 'Maître du dédale',
            desc: 'Gagne 3 boucliers et devient inciblable 1 tour.',
            effects: [shield(3), status('untargetable', 1, 'self', 1)],
        },
    ],
);
