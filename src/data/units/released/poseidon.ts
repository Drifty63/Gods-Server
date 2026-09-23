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
         * 15 PV et non les 18 du tableur. C'est le seul chiffre de l'auteur qui ait bougé, avec
         * ceux de la Harpie, et voici pourquoi : à 18 PV le Cyclope pesait 36,9 de budget
         * contre 32 à la Harpie — un SERVITEUR plus fort qu'une CRÉATURE, alors qu'il coûte
         * 2 points en Duel contre 3. Le joueur n'aurait jamais eu de raison de payer la créature.
         *
         * La cause de fond n'est pas les PV : c'est « Étreinte du colosse », qui donne 4 dégâts
         * ET un étourdissement pour 1 énergie, là où le Loup d'Artémis paie 3 pour la même
         * chose. Corriger le coût serait plus juste, mais c'est une décision d'auteur — les PV
         * sont le seul bouton qu'on puisse tourner sans réécrire une carte.
         */
        kind: 'servant', id: 'cyclopes', name: 'Cyclope',
        element: 'earth', hp: 15, god: 'poseidon', arch: 'tank',
        flavor: "« Ma caverne, mon troupeau, ma montagne. Tourne les talons. » — Il frappe comme une créature et disparaît derrière son rocher quand on riposte.",
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
            slot: 'skill_1', name: 'Étreinte du colosse',
            desc: '4 dégâts à une cible et l\'étourdit 1 tour.',
            effects: [dmg(4), status('stun', 1, 'same', 1)],
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
