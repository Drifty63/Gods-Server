import { servant, creature, kit, mergeKits, dmg, heal, shield, mill, discard, status } from './builders';

/**
 * Bestiaire d'HADÈS (Feu 🔥)
 *
 * Serviteurs : l'Ombre des Enfers, âme sans poids faite pour le nombre (PV les plus bas du
 * bestiaire, pensée pour les nuées) ; Charon, le passeur qui exige son obole (péage : défausse
 * et meule).
 *
 * Créatures : Cerbère, dont les trois gueules mordent ensemble (zone + saignement) ; Alecto
 * l'Érinye, qui poursuit les parjures d'une malédiction qui ronge (poison + saignement).
 */

const ombre = kit(
    servant({
        id: 'ombre_enfers', name: 'Ombre des Enfers', element: 'fire', hp: 10, god: 'hades',
        flavor: '"Je n\'ai plus de nom. Nous sommes légion, et nous avons tout le temps."',
    }),
    {
        generators: [
            { id: 'murmure', name: 'Murmure d\'Outre-Tombe', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'brume', name: 'Brume de Cendres', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 2.', effects: [dmg(1), shield(2)] },
        ],
        competences: [
            { id: 'griffe', name: 'Griffe Spectrale', desc: 'Inflige 3 dégâts.', effects: [dmg(3)] },
            { id: 'effroi', name: 'Effroi', desc: '1 saignement à un ennemi et bouclier 2.', effects: [status('bleed', 1), shield(2)] },
        ],
        utility: {
            id: 'lamentation', name: 'Lamentation', desc: '2 dégâts à tous les ennemis.', effects: [dmg(2, 'all_enemies')],
        },
    },
);

const charon = kit(
    servant({
        id: 'charon', name: 'Charon, le Passeur', element: 'fire', hp: 15, god: 'hades',
        flavor: '"Une obole, ou tu erreras mille ans sur cette rive."',
    }),
    {
        generators: [
            { id: 'obole', name: 'Obole du Passeur', gain: 3, desc: '+3 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'nage', name: 'Coup de Rame', gain: 2, desc: '+2 énergie et 2 dégâts.', effects: [dmg(2)] },
        ],
        competences: [
            { id: 'peage', name: 'Péage du Styx', desc: 'L\'adversaire défausse 1 carte.', effects: [discard(1)] },
            { id: 'traversee', name: 'Traversée Sans Retour', desc: '3 dégâts et meule 2 cartes.', effects: [dmg(3), mill(2)] },
        ],
        utility: {
            id: 'rive', name: 'Rive des Oubliés', desc: 'Bouclier 4 sur soi et se soigne de 2.', effects: [shield(4), heal(2, 'self')],
        },
    },
);

const cerbere = kit(
    creature({
        id: 'cerbere', name: 'Cerbère', element: 'fire', hp: 25, god: 'hades',
        flavor: '"Trois gueules pour la même faim. On entre par moi, on ne sort jamais."',
    }),
    {
        generators: [
            { id: 'grondement', name: 'Grondement', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'crocs_vifs', name: 'Crocs Vifs', gain: 2, desc: '+2 énergie et 2 dégâts.', effects: [dmg(2)] },
        ],
        competences: [
            { id: 'garde_porte', name: 'Garde de la Porte', desc: 'Provocation sur soi 2 tours et bouclier 4.', effects: [status('provocation', 1, 'self', 2), shield(4)] },
            { id: 'morsure', name: 'Morsure Tenace', desc: '3 dégâts et 2 saignements.', effects: [dmg(3), status('bleed', 2, 'same')] },
        ],
        utility: {
            id: 'trois_gueules', name: 'Trois Gueules', desc: '3 dégâts à tous les ennemis.', effects: [dmg(3, 'all_enemies')],
        },
    },
);

const alecto = kit(
    creature({
        id: 'alecto', name: 'Alecto, l\'Implacable', element: 'darkness', hp: 22, god: 'hades',
        flavor: '"Tu as juré faux. Désormais je marche derrière toi, et je ne dors pas."',
    }),
    {
        generators: [
            { id: 'serment', name: 'Serment Rompu', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'traque', name: 'Traque Silencieuse', gain: 2, desc: '+2 énergie, 1 dégât et 1 saignement.', effects: [dmg(1), status('bleed', 1)] },
        ],
        competences: [
            { id: 'fouet', name: 'Fouet d\'Airain', desc: '2 dégâts et 2 saignements.', effects: [dmg(2), status('bleed', 2, 'same')] },
            { id: 'malediction', name: 'Malédiction Rongeante', desc: '3 poisons et 1 saignement.', effects: [status('poison', 3), status('bleed', 1, 'same')] },
        ],
        utility: {
            id: 'chatiment', name: 'Châtiment', desc: '1 saignement à tous les ennemis.', effects: [status('bleed', 1, 'all_enemies')],
        },
    },
);

export const hadesBestiary = mergeKits(ombre, charon, cerbere, alecto);
