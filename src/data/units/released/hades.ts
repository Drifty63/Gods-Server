import { released, dmg, heal, shield, status } from '../builders';

/**
 * Unités publiées rattachées à HADÈS (Ténèbres 💀).
 */

export const demonsTartare = released(
    {
        kind: 'servant', id: 'demons_tartare', name: 'Démon du Tartare',
        element: 'fire', hp: 16, god: 'hades',
        flavor: "« Le Tartare ne relâche rien. Il prête, et il reprend. » — Il fige et il brûle : chaque marque qu'il pose alourdit les coups de feu du camp.",
    },
    [
        {
            slot: 'generator_1', name: 'Chaîne brûlante', gain: 1,
            desc: '1 dégât à tous les ennemis.',
            effects: [dmg(1, 'all_enemies')],
        },
        {
            slot: 'generator_2', name: 'Griffe d\'obsidienne', gain: 1,
            desc: '3 dégâts à un ennemi.',
            effects: [dmg(3)],
        },
        {
            slot: 'skill_1', name: 'Étreinte du Tartare',
            desc: 'Étourdit une cible 1 tour et lui applique une marque de brûlure.',
            effects: [status('stun', 1, 'enemy_god', 1), status('burn', 1, 'same')],
        },
        {
            slot: 'skill_2', name: 'Fournaise abyssale',
            desc: '1 dégât à tous les ennemis et une marque de brûlure à chacun.',
            effects: [dmg(1, 'all_enemies'), status('burn', 1, 'all_enemies')],
        },
        {
            slot: 'utility_1', name: 'Peau de basalte', gain: 1,
            desc: 'Gagne 3 boucliers et rend 1 énergie.',
            effects: [shield(3)],
        },
    ],
);

export const cerbere = released(
    {
        kind: 'creature', id: 'cerbere', name: 'Cerbère',
        element: 'darkness', hp: 25, god: 'hades', arch: 'tank',
        flavor: "« Trois gueules, une seule consigne : personne ne passe. » — La créature la plus résistante du bestiaire. Elle provoque, elle encaisse, et sa triple morsure frappe trois cibles d'un coup.",
    },
    [
        {
            slot: 'generator_1', name: 'Hurlement du gardien', gain: 1,
            desc: '1 dégât à tous les ennemis.',
            effects: [dmg(1, 'all_enemies')],
        },
        {
            slot: 'generator_2', name: 'Griffe du seuil', gain: 1,
            desc: '3 dégâts à un ennemi.',
            effects: [dmg(3)],
        },
        {
            slot: 'skill_1', name: 'Traqueur intransigeant', gain: 1,
            desc: 'Se soigne de 2 PV et rend 1 énergie.',
            effects: [heal(2, 'self')],
        },
        {
            slot: 'skill_2', name: 'Triple morsure',
            desc: '3 dégâts à 3 cibles différentes.',
            effects: [dmg(3), dmg(3), dmg(3)],
        },
        {
            slot: 'utility_1', name: 'Vigilance maximale',
            desc: 'Gagne 3 boucliers et provoque pendant 2 tours.',
            effects: [shield(3), status('provocation', 1, 'self', 2)],
        },
    ],
);
