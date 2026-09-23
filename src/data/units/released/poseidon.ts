import { released, dmg, shield, status } from '../builders';

/**
 * Unités publiées rattachées à POSÉIDON (Eau 💧).
 *
 * Les deux sont de Terre : ce sont les créatures de ses rivages, pas de ses flots. Le Cyclope
 * frappe et immobilise ; Méduse ne tue presque personne et rend toute l'équipe adverse
 * vulnérable — c'est elle qui alimente les frappeurs du camp.
 */

export const cyclopes = released(
    {
        /*
         * 18 PV, comme au tableur : le Cyclope reste le serviteur le plus résistant du jeu.
         *
         * Il avait d'abord été descendu à 15, parce qu'à 18 il pesait plus lourd qu'une
         * créature tout en coûtant 2 points en Duel contre 3 — personne n'aurait payé la
         * créature. Mais raboter des PV traitait le symptôme : le déséquilibre venait
         * d'« Étreinte du colosse », corrigée ci-dessous. L'auteur a tranché pour la cause.
         */
        kind: 'servant', id: 'cyclopes', name: 'Cyclope',
        element: 'earth', hp: 18, god: 'poseidon', arch: 'tank',
        flavor: "« Ma caverne, mon troupeau, ma montagne. Tourne les talons. » — Le serviteur le plus résistant du jeu, et le seul qui puisse disparaître derrière son rocher.",
    },
    [
        {
            slot: 'generator_1', name: 'Éboulement furieux', gain: 1,
            desc: '1 dégât à tous les ennemis.',
            effects: [dmg(1, 'all_enemies')],
        },
        {
            slot: 'generator_2', name: 'Coup de gourdin', gain: 1,
            desc: '3 dégâts à un ennemi.',
            effects: [dmg(3)],
        },
        {
            /*
             * 3 dégâts : à mi-chemin entre les 4 d'origine et les 2 d'un premier correctif.
             *
             * À 4, la carte donnait pour 1 énergie ce que la « Morsure tenace » du Loup
             * d'Artémis fait payer 3 — mêmes dégâts, même étourdissement.
             *
             * À 2, on la comparait au « Cœur Brisé » d'Aphrodite. Le rapprochement était faux :
             * le Cœur Brisé est un GÉNÉRATEUR (coût 1, gain 1), donc gratuit. Cette étreinte-ci
             * coûte une vraie énergie et doit rendre davantage.
             *
             * Le coût aurait aussi pu passer à 3, mais les emplacements nomment les fichiers
             * d'images : intervertir skill_1 et skill_2 aurait mis l'illustration de l'étreinte
             * sur le jet de rocher.
             */
            slot: 'skill_1', name: 'Étreinte du colosse',
            desc: '3 dégâts à une cible et l\'étourdit 1 tour.',
            effects: [dmg(3), status('stun', 1, 'same', 1)],
        },
        {
            slot: 'skill_2', name: 'Jet de rocher',
            desc: '4 dégâts à 2 cibles différentes.',
            effects: [dmg(4), dmg(4)],
        },
        {
            slot: 'utility_1', name: 'Abri du berger',
            desc: 'Gagne 3 boucliers et devient inciblable 1 tour.',
            effects: [shield(3), status('untargetable', 1, 'self', 1)],
        },
    ],
);

export const meduse = released(
    {
        kind: 'creature', id: 'meduse', name: 'Méduse',
        element: 'earth', hp: 22, god: 'poseidon',
        flavor: "« Regarde-moi. Tu n'auras pas à le faire deux fois. » — Elle n'inflige presque rien elle-même : elle pétrifie, et chaque marque rend les coups de ses alliés plus lourds.",
    },
    [
        {
            slot: 'generator_1', name: 'Regard perçant', gain: 1,
            desc: '1 dégât à tous les ennemis.',
            effects: [dmg(1, 'all_enemies')],
        },
        {
            slot: 'generator_2', name: 'Toucher de la Gorgone', gain: 1,
            desc: '3 dégâts à un ennemi.',
            effects: [dmg(3)],
        },
        {
            slot: 'skill_1', name: 'Crocs des vipères',
            desc: '2 dégâts et 1 poison à 2 cibles différentes.',
            effects: [dmg(2), status('poison', 1, 'same'), dmg(2), status('poison', 1, 'same')],
        },
        {
            /*
             * La carte la plus forte de l'unité, et son texte ne le dit pas : POSER une marque
             * de pétrification étourdit aussi la cible un tour (StatusSystem.addStatus). Elle
             * gèle donc l'équipe adverse entière en plus de la marquer à vie.
             */
            slot: 'skill_2', name: 'Jardin des condamnés',
            desc: '1 dégât à tous les ennemis et une marque de pétrification à chacun.',
            effects: [dmg(1, 'all_enemies'), status('petrify', 1, 'all_enemies')],
        },
        {
            slot: 'utility_1', name: 'Pétrification',
            desc: 'Une marque de pétrification à 2 cibles.',
            effects: [status('petrify', 1), status('petrify', 1)],
        },
    ],
);
