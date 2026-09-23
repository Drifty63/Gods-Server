import { released, dmg, heal, status, custom } from '../builders';

/**
 * Unités publiées rattachées à APOLLON (Air 💨).
 */

/*
 * L'ORACLE RESTE EN BROUILLON, seule unité des dix-neuf dans ce cas.
 *
 * Sa prophétie est le premier effet du jeu qui SURVIVRAIT à son propre tour : le joueur prédit
 * l'action adverse, et c'est au tour suivant qu'on sait s'il avait raison. Tous les autres
 * effets sur mesure se résolvent immédiatement. Celui-ci demande un champ persistant dans
 * `GameState`, synchronisé dans le jsonb des parties en ligne, et une interception dans
 * `playCard` — la fonction la plus sensible du moteur.
 *
 * Plutôt que de livrer une carte dont le texte promet ce que le code ne fait pas, l'unité
 * attend. Le drapeau `draft` la rend invisible en Duel, en boutique et en Ascension ; il suffira
 * de le retirer quand les deux effets seront écrits.
 */
export const oracleDelphes = released(
    {
        kind: 'servant', id: 'oracle_delphes', name: 'Oracle de Delphes',
        element: 'light', hp: 16, god: 'apollon', arch: 'support', draft: true,
        flavor: "« J'ai vu ce que tu vas faire. Fais-le quand même, si tu l'oses. » — Elle ne frappe pas : elle lit la main adverse et parie sur le coup suivant.",
    },
    [
        {
            slot: 'generator_1', name: 'Braise sacrée', gain: 1,
            desc: '1 dégât à tous les ennemis.',
            effects: [dmg(1, 'all_enemies')],
        },
        {
            slot: 'generator_2', name: 'Tir prémonitoire', gain: 1,
            desc: '3 dégâts à un ennemi.',
            effects: [dmg(3)],
        },
        {
            slot: 'skill_1', name: 'Soin providentiel', gain: 1,
            desc: 'Se soigne de 2 PV et rend 1 énergie.',
            effects: [heal(2, 'self')],
        },
        {
            // `oracle_prophecy` et `oracle_vision` n'ont PAS de handler enregistré : c'est la
            // raison d'être du drapeau `draft` ci-dessus. Un effet custom sans handler ne fait
            // rien, en silence — inoffensif tant que l'unité reste hors du jeu.
            slot: 'skill_2', name: 'Destin contrarié',
            desc: 'Prédit l\'action adverse. Si l\'adversaire la joue, elle est annulée : +2 boucliers sur chaque allié vivant et 1 énergie.',
            effects: [custom('oracle_prophecy', 'Prédit l\'action adverse et l\'annule')],
        },
        {
            slot: 'utility_1', name: 'Lecture des présages',
            desc: 'Révèle 2 cartes de la main adverse pendant 3 secondes.',
            effects: [custom('oracle_vision', 'Révèle 2 cartes de la main adverse')],
        },
    ],
);

export const python = released(
    {
        kind: 'creature', id: 'python', name: 'Python de Delphes',
        element: 'earth', hp: 24, god: 'apollon',
        flavor: "« Je dormais sous la pierre avant qu'Apollon n'ait un nom. » — Il empoisonne, il étrangle, et son souffle fait payer d'un coup tout le venin accumulé.",
    },
    [
        {
            slot: 'generator_1', name: 'Balayage caudal', gain: 1,
            desc: '1 dégât à tous les ennemis.',
            effects: [dmg(1, 'all_enemies')],
        },
        {
            slot: 'generator_2', name: 'Crochets venimeux', gain: 1,
            desc: '2 dégâts à une cible et lui applique 1 poison.',
            effects: [dmg(2), status('poison', 1, 'same')],
        },
        {
            slot: 'skill_1', name: 'Constriction monstrueuse',
            desc: '3 dégâts à une cible et l\'étourdit 1 tour.',
            effects: [dmg(3), status('stun', 1, 'same', 1)],
        },
        {
            /*
             * Encaisse de force le poison accumulé. Le poison de GODS ne frappe qu'au moment où
             * un dieu LANCE un sort : un ennemi empoisonné qui se terre ne le paie jamais. Ce
             * souffle est la seule carte qui le lui fasse payer quoi qu'il fasse.
             */
            slot: 'skill_2', name: 'Souffle méphitique',
            desc: '1 dégât à tous les ennemis, +1 par marque de poison portée par chacun. Les marques ne sont pas consommées.',
            effects: [custom('poison_scaled_aoe', '1 dégât à tous, +1 par marque de poison')],
        },
        {
            slot: 'utility_1', name: 'Mue écailleuse',
            desc: 'Se purge de tous ses effets négatifs et se soigne de 2 PV.',
            effects: [custom('cleanse', 'Enlève tous les effets négatifs', 'self'), heal(2, 'self')],
        },
    ],
);
