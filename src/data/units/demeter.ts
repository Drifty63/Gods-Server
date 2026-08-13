import { servant, creature, kit, mergeKits, dmg, heal, shield, draw, mill, status, cleanse } from './builders';

/**
 * Bestiaire de DÉMÉTER (Terre 🌿)
 *
 * Serviteurs : la Dryade, nymphe liée à son arbre, qui fait repousser ce qu'on abîme
 * (régénération) ; le Moissonneur d'Éleusis, initié aux mystères, qui fauche ce qui est mûr.
 *
 * Créatures : le Sanglier de Calydon, envoyé par une déesse offensée pour ravager un royaume entier
 * (zone, saignement) ; Triptolème, à qui Déméter enseigna l'agriculture et qui fait pousser la vie
 * autour de lui (soin de groupe).
 */

const dryade = kit(
    servant({
        id: 'dryade', name: 'Dryade', element: 'earth', hp: 13, god: 'demeter',
        flavor: '"Coupe la branche. L\'arbre, lui, se souvient et repousse."',
    }),
    {
        generators: [
            { id: 'seve', name: 'Montée de Sève', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'ecorce', name: 'Écorce Protectrice', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 2.', effects: [dmg(1), shield(2)] },
        ],
        competences: [
            { id: 'racines', name: 'Racines Étrangleuses', desc: 'Inflige 3 dégâts.', effects: [dmg(3)] },
            { id: 'ronces', name: 'Ronces', desc: '2 dégâts et 1 saignement.', effects: [dmg(2), status('bleed', 1, 'same')] },
        ],
        utility: {
            id: 'repousse', name: 'Repousse', desc: 'Régénération 2 sur un allié et retire son poison.', effects: [status('regen', 2, 'ally_god', 3), cleanse('poison')],
        },
    },
);

const moissonneur = kit(
    servant({
        id: 'moissonneur_eleusis', name: 'Moissonneur d\'Éleusis', element: 'earth', hp: 16, god: 'demeter',
        flavor: '"Toute chose mûrit, et toute chose se fauche. C\'est le mystère."',
    }),
    {
        generators: [
            { id: 'gerbe', name: 'Gerbe Liée', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'glanage', name: 'Glanage', gain: 2, desc: '+2 énergie, 1 dégât et pioche 1 carte.', effects: [dmg(1), draw(1)] },
        ],
        competences: [
            { id: 'faux', name: 'Coup de Faux', desc: '3 dégâts et 1 saignement.', effects: [dmg(3), status('bleed', 1, 'same')] },
            { id: 'battage', name: 'Battage', desc: '2 dégâts et meule 2 cartes.', effects: [dmg(2), mill(2)] },
        ],
        utility: {
            id: 'recolte', name: 'Grande Récolte', desc: 'Inflige 5 dégâts.', effects: [dmg(5)],
        },
    },
);

const sanglier = kit(
    creature({
        id: 'sanglier_calydon', name: 'Sanglier de Calydon', element: 'earth', hp: 25, god: 'demeter',
        flavor: '"Un royaume a oublié de rendre grâce. J\'ai été la réponse."',
    }),
    {
        generators: [
            { id: 'furie', name: 'Furie du Fauve', gain: 2, desc: '+2 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'soies', name: 'Soies Dures', gain: 2, desc: '+2 énergie, 1 dégât et bouclier 3.', effects: [dmg(1), shield(3)] },
        ],
        competences: [
            { id: 'defenses', name: 'Défenses d\'Ivoire', desc: '3 dégâts et 2 saignements.', effects: [dmg(3), status('bleed', 2, 'same')] },
            { id: 'ravage', name: 'Ravage des Champs', desc: '1 dégât à tous les ennemis et 1 saignement.', effects: [dmg(1, 'all_enemies'), status('bleed', 1)] },
        ],
        utility: {
            id: 'bourrade', name: 'Bourrade', desc: 'Inflige 6 dégâts.', effects: [dmg(6)],
        },
    },
);

const triptoleme = kit(
    creature({
        id: 'triptoleme', name: 'Triptolème', element: 'earth', hp: 21, god: 'demeter',
        flavor: '"La déesse m\'a confié le blé. Là où je passe, la terre se souvient de vivre."',
    }),
    {
        generators: [
            { id: 'semailles', name: 'Semailles', gain: 3, desc: '+3 énergie et 1 dégât.', effects: [dmg(1)] },
            { id: 'epi', name: 'Épi Tranchant', gain: 2, desc: '+2 énergie et 2 dégâts.', effects: [dmg(2)] },
        ],
        competences: [
            { id: 'char', name: 'Char aux Dragons', desc: 'Inflige 5 dégâts.', effects: [dmg(5)] },
            { id: 'abondance', name: 'Abondance', desc: 'Soigne tous les alliés de 3.', effects: [heal(3, 'all_allies')] },
        ],
        utility: {
            id: 'moisson', name: 'Moisson Sacrée', desc: 'Inflige 6 dégâts.', effects: [dmg(6)],
        },
    },
);

export const demeterBestiary = mergeKits(dryade, moissonneur, sanglier, triptoleme);
