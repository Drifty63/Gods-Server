// Données de toutes les cartes sorts du jeu GODS
// Mise à jour progressive avec les cartes fournies

import { SpellCard } from '@/types/cards';

export const ALL_SPELLS: SpellCard[] = [
    // =====================================================
    // SORTS DE POSÉIDON (Eau 💧)
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'poseidon_generator_1',
        name: 'Trident de Poséidon',
        element: 'water',
        godId: 'poseidon',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_poseidon_trident.png',
        description: 'Inflige 3 dégâts à une cible.',
    },
    {
        id: 'poseidon_generator_2',
        name: 'Colère de Poséidon',
        element: 'water',
        godId: 'poseidon',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'enemy_god' },
            { type: 'damage', value: 1, target: 'enemy_god' },
            { type: 'mill', value: 2 }
        ],
        imageUrl: '/cards/spells/spell_poseidon_colere.png',
        description: 'Inflige 1 dégât à deux cibles et meule 2 cartes.',
    },

    // --- COMPÉTENCES ---
    {
        id: 'poseidon_skill_1',
        name: 'Grande Vague',
        element: 'water',
        godId: 'poseidon',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'discard', value: 2 }
        ],
        imageUrl: '/cards/spells/spell_poseidon_vague.png',
        description: 'Inflige 2 dégâts à deux cibles et défausse 2 cartes de la main de votre adversaire.',
    },
    {
        id: 'poseidon_skill_2',
        name: 'Tsunami',
        element: 'water',
        godId: 'poseidon',
        type: 'competence',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'mill', value: 5, target: 'enemy_god' },
            { type: 'custom', customEffectId: 'tsunami_damage', description: 'Inflige 3 dégâts par carte du dieu ciblé meulée' }
        ],
        imageUrl: '/cards/spells/spell_poseidon_tsunami.png',
        description: 'Ciblez un adversaire; Meule 5 cartes du dessus du deck (limité à un recyclage). Inflige 3 dégâts par carte du dieu ciblé.',
    },

    // --- UTILITAIRE ---
    {
        id: 'poseidon_utility_1',
        name: 'Prison Aquatique',
        element: 'water',
        godId: 'poseidon',
        type: 'utility',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' },
            { type: 'custom', customEffectId: 'prison_mill', description: 'Meule du nombre d\'ennemis touchés' }
        ],
        imageUrl: '/cards/spells/spell_poseidon_prison.png',
        description: 'Inflige 1 dégât à toutes les cibles et meule du nombre d\'ennemis touchés.',
    },

    // =====================================================
    // SORTS DE ZEUS (Foudre ⚡)
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'zeus_generator_1',
        name: 'Éclair de Zeus',
        element: 'lightning',
        godId: 'zeus',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_zeus_eclair.png',
        description: 'Inflige 3 dégâts à une cible.',
    },
    {
        id: 'zeus_generator_2',
        name: 'Foudre Conductrice',
        element: 'lightning',
        godId: 'zeus',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'custom', customEffectId: 'conductive_lightning', value: 1, target: 'enemy_god', description: 'Inflige 1 dégât et applique 1 marque de foudre' },
            { type: 'custom', customEffectId: 'conductive_lightning', value: 1, target: 'enemy_god', description: 'Inflige 1 dégât et applique 1 marque de foudre' }
        ],
        imageUrl: '/cards/spells/spell_zeus_conductrice.png',
        description: 'Inflige 1 dégât à deux cibles et leur applique 1 marque de foudre.',
    },

    // --- COMPÉTENCES ---
    {
        id: 'zeus_skill_1',
        name: 'Éclair foudroyant',
        element: 'lightning',
        godId: 'zeus',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 5, target: 'enemy_god' },
            { type: 'custom', customEffectId: 'lightning_toggle', description: 'Applique ou enlève ⚡ de la cible. +2 dégâts par ⚡ enlevée' }
        ],
        imageUrl: '/cards/spells/spell_zeus_foudroyant.png',
        description: 'Inflige 5 dégâts à une cible. Applique ou enlève ⚡ de la cible. Inflige 2 dégâts par ⚡ enlevée.',
    },
    {
        id: 'zeus_skill_2',
        name: 'Foudroiement',
        element: 'lightning',
        godId: 'zeus',
        type: 'competence',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 3, target: 'all_enemies' },
            { type: 'custom', customEffectId: 'lightning_toggle_all', description: 'Applique ou enlève ⚡ de toutes les cibles. +2 dégâts par ⚡ enlevée' }
        ],
        imageUrl: '/cards/spells/spell_zeus_foudroiement.png',
        description: 'Inflige 3 dégâts à toutes les cibles. Applique ou enlève ⚡ des cibles. Inflige 2 dégâts par ⚡ enlevée.',
    },

    // --- UTILITAIRE ---
    {
        id: 'zeus_utility_1',
        name: 'Chaine d\'éclair',
        element: 'lightning',
        godId: 'zeus',
        type: 'utility',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'custom', customEffectId: 'lightning_toggle_multi', description: 'Applique ou enlève ⚡ des cibles. +2 dégâts par ⚡ enlevée' }
        ],
        imageUrl: '/cards/spells/spell_zeus_chaine.png',
        description: 'Inflige 2 dégâts à 2 cibles. Applique ou enlève ⚡ des cibles. Inflige 2 dégâts par ⚡ enlevée.',
    },

    // =====================================================
    // SORTS DE NYX (Ténèbres 💀)
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'nyx_generator_1',
        name: 'Zone de vide',
        element: 'darkness',
        godId: 'nyx',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/spell_nyx_zonevide.png',
        description: 'Inflige 1 dégât à toutes les cibles.',
    },
    {
        id: 'nyx_generator_2',
        name: 'Ombres dévorantes',
        element: 'darkness',
        godId: 'nyx',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'custom', customEffectId: 'shuffle_hand_draw_blind', description: 'Mélange 1 carte adverse dans son deck, pioche 1 à l\'envers' }
        ],
        imageUrl: '/cards/spells/spell_nyx_ombres.png',
        description: 'Inflige 2 dégâts à une cible, mélangez une carte de la main adverse dans son deck et piochez 1 à l\'envers.',
    },

    // --- COMPÉTENCES ---
    {
        id: 'nyx_skill_1',
        name: 'Malédiction',
        element: 'darkness',
        godId: 'nyx',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' },
            { type: 'custom', customEffectId: 'shuffle_hand_draw_blind_2', description: 'Mélange 2 cartes adverses dans son deck, pioche 2 à l\'envers' }
        ],
        imageUrl: '/cards/spells/spell_nyx_malediction.png',
        description: 'Inflige 3 dégâts à une cible; Choisissez 2 cartes de la main adverse, les mélange dans son deck et pioche 2 à l\'envers.',
    },
    {
        id: 'nyx_skill_2',
        name: 'Nuit Sans Fin',
        element: 'darkness',
        godId: 'nyx',
        type: 'competence',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'shuffle_all_hand_draw_blind', description: 'L\'adversaire mélange sa main dans son deck et pioche 5 à l\'envers' }
        ],
        imageUrl: '/cards/spells/spell_nyx_nuitsansfin.png',
        description: 'L\'adversaire mélange sa main dans son deck et pioche 5 cartes à l\'envers.',
    },

    // --- UTILITAIRE ---
    {
        id: 'nyx_utility_1',
        name: 'Prophétie',
        element: 'darkness',
        godId: 'nyx',
        type: 'utility',
        energyCost: 1,
        energyGain: 1,
        effects: [
            { type: 'draw', value: 3 },
            { type: 'custom', customEffectId: 'put_cards_bottom', description: 'Placez 3 cartes en dessous de votre deck' }
        ],
        imageUrl: '/cards/spells/spell_nyx_prophetie.png',
        description: 'Piochez 3 cartes du dessus de votre deck et placez 3 cartes en dessous, gagne 1 énergie.',
    },

    // =====================================================
    // SORTS D'HESTIA (Feu 🔥)
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'hestia_generator_1',
        name: 'Flammes intérieur',
        element: 'fire',
        godId: 'hestia',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_hestia_flammes.png',
        description: 'Inflige 3 dégâts à une cible.',
    },
    {
        id: 'hestia_generator_2',
        name: 'Fumée cendrée',
        element: 'fire',
        godId: 'hestia',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' },
            { type: 'custom', customEffectId: 'remove_weakness_1_turn', target: 'ally_god', description: 'Retire la faiblesse d\'un allié pendant 1 tour' }
        ],
        imageUrl: '/cards/spells/spell_hestia_fumee.png',
        description: 'Inflige 1 dégât à toutes les cibles et fait perdre la faiblesse d\'un de vos dieux pendant 1 tour.',
    },

    // --- COMPÉTENCES ---
    {
        id: 'hestia_skill_1',
        name: 'Repas reconfortant',
        element: 'fire',
        godId: 'hestia',
        type: 'competence',
        energyCost: 1,
        energyGain: 2,
        effects: [
            { type: 'custom', customEffectId: 'heal_by_energy', target: 'ally_god', description: 'Soigne un allié de la valeur totale de votre énergie' }
        ],
        imageUrl: '/cards/spells/spell_hestia_repas.png',
        description: 'Donne 2 énergies et soigne un allié de la valeur totale de votre énergie.',
    },
    {
        id: 'hestia_skill_2',
        name: 'Foyer protecteur',
        element: 'fire',
        godId: 'hestia',
        type: 'competence',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'remove_all_weakness_3_turns', description: 'Tous les alliés perdent leurs faiblesses pendant 3 tours' }
        ],
        imageUrl: '/cards/spells/spell_hestia_foyer.png',
        description: 'Tous les alliés perdent leurs faiblesses pendant 3 tours.',
    },

    // --- UTILITAIRE ---
    {
        id: 'hestia_utility_1',
        name: 'Repos mérité',
        element: 'fire',
        godId: 'hestia',
        type: 'utility',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'recycle_from_discard', description: 'Choisissez 2 cartes de la défausse et remettez-les dans le deck' }
        ],
        imageUrl: '/cards/spells/spell_hestia_repos.png',
        description: 'Choisissez deux cartes dans votre défausse, faites-les revenir dans votre deck puis mélangez-le.',
    },

    // =====================================================
    // SORTS D'ATHÉNA (Lumière ☀️)
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'athena_generator_1',
        name: 'Serres acérées',
        element: 'light',
        godId: 'athena',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_athena_serres.png',
        description: 'Inflige 3 dégâts à une cible.',
    },
    {
        id: 'athena_generator_2',
        name: 'Nova protectrice',
        element: 'light',
        godId: 'athena',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' },
            { type: 'status', status: 'provocation', value: 1, statusDuration: 1, target: 'self' }
        ],
        imageUrl: '/cards/spells/spell_athena_nova.png',
        description: 'Inflige 1 dégât à toutes les cibles. Provoque les attaques adverses pendant 1 tour.',
    },

    // --- COMPÉTENCES ---
    {
        id: 'athena_skill_1',
        name: 'Provocation céleste',
        element: 'light',
        godId: 'athena',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'shield', value: 3, target: 'self' },
            { type: 'status', status: 'provocation', value: 1, statusDuration: 3, target: 'self' }
        ],
        imageUrl: '/cards/spells/spell_athena_provocation.png',
        description: 'Gagne 3 boucliers et provoque les attaques adverses pour 3 tours.',
    },
    {
        id: 'athena_skill_2',
        name: 'Rempart ultime',
        element: 'light',
        godId: 'athena',
        type: 'competence',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'shield', value: 5, target: 'all_allies' }
        ],
        imageUrl: '/cards/spells/spell_athena_rempart.png',
        description: 'Tous les alliés gagnent 5 boucliers.',
    },

    // --- UTILITAIRE ---
    {
        id: 'athena_utility_1',
        name: 'Faveur divine',
        element: 'light',
        godId: 'athena',
        type: 'utility',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'shield', value: 3, target: 'self' },
            { type: 'shield', value: 3, target: 'ally_god' }
        ],
        imageUrl: '/cards/spells/spell_athena_faveur.png',
        description: 'Donne 3 boucliers à Athéna et un allié.',
    },

    // =====================================================
    // SORTS DE DEMETER (Terre 🌿)
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'demeter_generator_1',
        name: 'Moisson',
        element: 'earth',
        godId: 'demeter',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_demeter_moisson.png',
        description: 'Inflige 3 dégâts à une cible.',
    },
    {
        id: 'demeter_generator_2',
        name: 'Sècheresse',
        element: 'earth',
        godId: 'demeter',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' },
            { type: 'heal', value: 2, target: 'any_god' }
        ],
        imageUrl: '/cards/spells/spell_demeter_secheresse.png',
        description: 'Inflige 1 dégâts à toutes les cibles et soigne 2 de façon souhaitée.',
    },

    // --- COMPÉTENCES ---
    {
        id: 'demeter_skill_1',
        name: 'Fertilisation',
        element: 'earth',
        godId: 'demeter',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'distribute_heal_5', description: 'Répartit 5 soins entre vos alliés' }
        ],
        imageUrl: '/cards/spells/spell_demeter_fertilisation.png',
        description: 'Soigne 5 de façon souhaitée.',
    },
    {
        id: 'demeter_skill_2',
        name: 'Graine de vie',
        element: 'earth',
        godId: 'demeter',
        type: 'competence',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'revive_god', target: 'dead_ally_god', description: 'Fait revenir un personnage d\'entre les morts avec 8 PV' }
        ],
        imageUrl: '/cards/spells/spell_demeter_graine.png',
        description: 'Fait revenir un personnage d\'entre les morts avec 8 points de vie.',
    },

    // --- UTILITAIRE ---
    {
        id: 'demeter_utility_1',
        name: 'Récolte',
        element: 'earth',
        godId: 'demeter',
        type: 'utility',
        energyCost: 1,
        energyGain: 1,
        effects: [
            { type: 'heal', value: 4, target: 'any_god' },
            { type: 'energy', value: 1 }
        ],
        imageUrl: '/cards/spells/spell_demeter_recolte.png',
        description: 'Soigne une cible de 4 et augmente l\'énergie de 1.',
    },

    // =====================================================
    // SORTS DE DIONYSOS (Terre 🌿)
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'dionysos_generator_1',
        name: 'Gueule de bois',
        element: 'earth',
        godId: 'dionysos',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_dionysos_gueule.png',
        description: 'Inflige 3 dégâts à une cible.',
    },
    {
        id: 'dionysos_generator_2',
        name: 'Ivresse',
        element: 'earth',
        godId: 'dionysos',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'enemy_god' },
            { type: 'status', status: 'poison', value: 1 },
            { type: 'damage', value: 1, target: 'enemy_god' },
            { type: 'status', status: 'poison', value: 1 }
        ],
        imageUrl: '/cards/spells/spell_dionysos_ivresse.png',
        description: 'Inflige 1 dégât à deux cibles et leur inflige 1 de poison.',
    },

    // --- COMPÉTENCES ---
    {
        id: 'dionysos_skill_1',
        name: 'Folie',
        element: 'earth',
        godId: 'dionysos',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'status', status: 'poison', value: 2 }
        ],
        imageUrl: '/cards/spells/spell_dionysos_folie.png',
        description: 'Inflige 2 dégâts et inflige 2 poisons à une cible.',
    },
    {
        id: 'dionysos_skill_2',
        name: 'Tournée Générale',
        element: 'earth',
        godId: 'dionysos',
        type: 'competence',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'status', status: 'poison', value: 2, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/spell_dionysos_tournee.png',
        description: 'Tous les ennemis subissent 2 de poison.',
    },

    // --- UTILITAIRE ---
    {
        id: 'dionysos_utility_1',
        name: 'Ambroisie',
        element: 'earth',
        godId: 'dionysos',
        type: 'utility',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'heal_by_poison', description: 'Soigne un personnage du nombre total de poisons sur les ennemis' }
        ],
        imageUrl: '/cards/spells/spell_dionysos_ambroisie.png',
        description: 'Soigne un personnage du nombre total de poisons sur les ennemis.',
    },

    // =====================================================
    // SORTS D'HADÈS (Feu 🔥)
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'hades_generator_1',
        name: 'Terre brulée',
        element: 'fire',
        godId: 'hades',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/spell_hades_terrebrulee.png',
        description: 'Inflige 1 dégâts à toutes les cibles.',
    },
    {
        id: 'hades_generator_2',
        name: 'Purgatoire',
        element: 'fire',
        godId: 'hades',
        type: 'generator',
        energyCost: 1,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'heal', value: 2, target: 'self' }
        ],
        imageUrl: '/cards/spells/spell_hades_purgatoire.png',
        description: 'Inflige 2 dégâts à une cible et regagne 2 points de vie.',
    },

    // --- COMPÉTENCES ---
    {
        id: 'hades_skill_1',
        name: 'Flammes infernales',
        element: 'fire',
        godId: 'hades',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 6, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_hades_flammes.png',
        description: 'Inflige 6 dégâts à une cible.',
    },
    {
        id: 'hades_skill_2',
        name: 'Syphon d\'âme',
        element: 'fire',
        godId: 'hades',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' },
            { type: 'custom', customEffectId: 'lifesteal_damage', description: 'Soigne du nombre de dégâts infligés' }
        ],
        imageUrl: '/cards/spells/spell_hades_syphon.png',
        description: 'Inflige 3 dégâts à une cible; Soigne du nombre de dégâts infligés.',
    },

    // --- UTILITAIRE ---
    {
        id: 'hades_utility_1',
        name: 'Chemin des âmes',
        element: 'fire',
        godId: 'hades',
        type: 'utility',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 8, target: 'enemy_god' },
            { type: 'custom', customEffectId: 'heal_if_kill_8', description: 'Si la cible meurt, gagne 8 PV' }
        ],
        imageUrl: '/cards/spells/spell_hades_chemin.png',
        description: 'Inflige 8 dégâts à une cible; Si la cible meurt de cette attaque, gagne 8 points de vie.',
    },

    // =====================================================
    // SORTS D'APOLLON (Air 💨)
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'apollon_generator_1',
        name: 'Cacophonie',
        element: 'air',
        godId: 'apollon',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/spell_apollon_cacophonie.png',
        description: 'Inflige 1 dégâts à toutes les cibles.',
    },
    {
        id: 'apollon_generator_2',
        name: 'Notes discordantes',
        element: 'air',
        godId: 'apollon',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'enemy_god' },
            { type: 'custom', customEffectId: 'remove_energy_1', description: 'Enlève 1 énergie à l\'adversaire' }
        ],
        imageUrl: '/cards/spells/spell_apollon_notes.png',
        description: 'Inflige 1 dégâts et enlève 1 énergie à votre adversaire.',
    },

    // --- COMPÉTENCES ---
    {
        id: 'apollon_skill_1',
        name: 'Récital',
        element: 'air',
        godId: 'apollon',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' },
            { type: 'custom', customEffectId: 'remove_energy_1', description: 'Fait perdre 1 énergie à l\'adversaire' }
        ],
        imageUrl: '/cards/spells/spell_apollon_recital.png',
        description: 'Inflige 1 dégâts à toutes les cibles et fait perdre 1 énergie à votre adversaire.',
    },
    {
        id: 'apollon_skill_2',
        name: 'Concerto',
        element: 'air',
        godId: 'apollon',
        type: 'competence',
        energyCost: 1,
        energyGain: 3,
        effects: [
            { type: 'status', status: 'stun', value: 1, statusDuration: 3, target: 'self' }
        ],
        imageUrl: '/cards/spells/spell_apollon_concerto.png',
        description: 'Apollon ne peut plus jouer pendant les 3 prochains tours, gagne 3 énergies.',
    },

    // --- UTILITAIRE ---
    {
        id: 'apollon_utility_1',
        name: 'Envolé Lyrique',
        element: 'air',
        godId: 'apollon',
        type: 'utility',
        energyCost: 3,
        energyGain: 1,
        effects: [
            { type: 'custom', customEffectId: 'remove_energy_2', description: 'Fait perdre 2 énergies à l\'adversaire' }
        ],
        imageUrl: '/cards/spells/spell_apollon_envole.png',
        description: 'Gagne 1 énergie et fait perdre 2 énergies à votre adversaire.',
    },

    // =====================================================
    // SORTS D'ARÈS (Terre 🌿)
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'ares_generator_1',
        name: 'Brisée les rangs',
        element: 'earth',
        godId: 'ares',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/spell_ares_brisee.png',
        description: 'Inflige 1 dégâts à toutes les cibles.',
    },
    {
        id: 'ares_generator_2',
        name: 'Entrainement martial',
        element: 'earth',
        godId: 'ares',
        type: 'generator',
        energyCost: 1,
        energyGain: 3,
        effects: [
            { type: 'damage', value: 3, target: 'self' }
        ],
        imageUrl: '/cards/spells/spell_ares_entrainement.png',
        description: 'Augmente l\'énergie de 3 et reçoit 3 dégâts.',
    },

    // --- COMPÉTENCES ---
    {
        id: 'ares_skill_1',
        name: 'Saut bestial',
        element: 'earth',
        godId: 'ares',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 4, target: 'enemy_god' },
            { type: 'damage', value: 2, target: 'self' }
        ],
        imageUrl: '/cards/spells/spell_ares_saut.png',
        description: 'Inflige 4 dégâts à une cible et reçoit 2 dégâts.',
    },
    {
        id: 'ares_skill_2',
        name: 'Frappe sauvage',
        element: 'earth',
        godId: 'ares',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 5, target: 'enemy_god' },
            { type: 'damage', value: 3, target: 'self' }
        ],
        imageUrl: '/cards/spells/spell_ares_frappe.png',
        description: 'Inflige 5 dégâts à une cible et reçoit 3 dégâts.',
    },

    // --- UTILITAIRE ---
    {
        id: 'ares_utility_1',
        name: 'Dernier recours',
        element: 'earth',
        godId: 'ares',
        type: 'utility',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'damage_equal_lost_health', target: 'enemy_god', description: 'Inflige des dégâts égaux aux points de vie perdus' },
            { type: 'damage', value: 5, target: 'self' }
        ],
        imageUrl: '/cards/spells/spell_ares_dernier.png',
        description: 'Inflige des dégâts égaux aux points de vie perdus. Subit 5 dégâts après l\'attaque.',
    },

    // =====================================================
    // SORTS D'ARTÉMIS (Air 💨)
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'artemis_generator_1',
        name: 'Flèches multiples',
        element: 'air',
        godId: 'artemis',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/spell_artemis_fleches_multiples.png',
        description: 'Inflige 1 dégâts à toutes les cibles.',
    },
    {
        id: 'artemis_generator_2',
        name: 'Tir bestial',
        element: 'air',
        godId: 'artemis',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'damage', value: 2, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_artemis_tir_bestial.png',
        description: 'Inflige 2 dégâts à deux cibles.',
    },

    // --- COMPÉTENCES ---
    {
        id: 'artemis_skill_1',
        name: 'Flèches traçantes',
        element: 'air',
        godId: 'artemis',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' },
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_artemis_fleches_tracantes.png',
        description: 'Inflige 3 dégâts à deux cibles.',
    },
    {
        id: 'artemis_skill_2',
        name: 'Coup critique',
        element: 'air',
        godId: 'artemis',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' },
            { type: 'custom', customEffectId: 'apply_weakness', description: 'Applique une faiblesse d\'un élément voulu' }
        ],
        imageUrl: '/cards/spells/spell_artemis_coup_critique.png',
        description: 'Inflige 3 dégâts à une cible et lui applique une faiblesse d\'un élément voulu.',
    },

    // --- UTILITAIRE ---
    {
        id: 'artemis_utility_1',
        name: 'Flèche d\'exécution',
        element: 'air',
        godId: 'artemis',
        type: 'utility',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 10, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_artemis_execution.png',
        description: 'Inflige 10 dégâts à une cible.',
    },

    // =====================================================
    // SORTS D'APHRODITE (Lumière ☀️)
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'aphrodite_generator_1',
        name: 'Etreinte chaleureuse',
        element: 'light',
        godId: 'aphrodite',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/spell_aphrodite_etreinte.png',
        description: 'Inflige 1 dégât à toutes les cibles.',
    },
    {
        id: 'aphrodite_generator_2',
        name: 'Cœur Brisé',
        element: 'light',
        godId: 'aphrodite',
        type: 'generator',
        energyCost: 1,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'status', status: 'stun', value: 1, statusDuration: 1, description: 'Stun pendant 1 tour' }
        ],
        imageUrl: '/cards/spells/spell_aphrodite_coeur_brise.png',
        description: 'Inflige 2 dégâts à une cible et l\'étourdit pendant 1 tour.',
    },

    // --- COMPÉTENCES ---
    {
        id: 'aphrodite_skill_1',
        name: 'Toucher sensuel',
        element: 'light',
        godId: 'aphrodite',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'cleanse', description: 'Enlève tous les effets négatifs' },
            { type: 'heal', value: 3, target: 'ally_god' }
        ],
        imageUrl: '/cards/spells/spell_aphrodite_toucher.png',
        description: 'Enlève tous les effets négatifs d\'un personnage souhaité et soigne 3 points de vie.',
    },
    {
        id: 'aphrodite_skill_2',
        name: 'Stun divin',
        element: 'light',
        godId: 'aphrodite',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'status', status: 'stun', value: 1, statusDuration: 2, target: 'enemy_god', description: 'Stun pendant 2 tours' }
        ],
        imageUrl: '/cards/spells/spell_aphrodite_charme.png',
        description: 'Étourdit une cible, l\'empêchant de jouer pendant 2 tours.',
    },

    // --- UTILITAIRE ---
    {
        id: 'aphrodite_utility_1',
        name: 'Désir suprême',
        element: 'light',
        godId: 'aphrodite',
        type: 'utility',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'cleanse_all_allies', description: 'Enlève tous les effets négatifs des alliés' },
            { type: 'heal', value: 3, target: 'all_allies' }
        ],
        imageUrl: '/cards/spells/spell_aphrodite_desir.png',
        description: 'Soigne tous les alliés de 3 et enlève tous leurs effets négatifs.',
    },
];

// Helper pour obtenir les sorts d'un dieu
export function getSpellsByGodId(godId: string): SpellCard[] {
    return ALL_SPELLS.filter(spell => spell.godId === godId);
}

// Helper pour créer un deck complet pour un joueur (4 dieux = 20 cartes)
export function createDeck(godIds: string[]): SpellCard[] {
    if (godIds.length !== 4) {
        throw new Error('Un deck doit contenir exactement 4 dieux');
    }

    const deck: SpellCard[] = [];
    for (const godId of godIds) {
        const godSpells = getSpellsByGodId(godId);
        if (godSpells.length !== 5) {
            console.warn(`Le dieu ${godId} n'a pas exactement 5 sorts (${godSpells.length} trouvés)`);
        }
        deck.push(...godSpells);
    }

    return deck;
}

// Helper pour valider un deck
export function validateDeck(godIds: string[], spells: SpellCard[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (godIds.length !== 4) {
        errors.push('Le deck doit contenir exactement 4 dieux');
    }

    for (const godId of godIds) {
        const godSpells = spells.filter(s => s.godId === godId);
        const generators = godSpells.filter(s => s.type === 'generator');
        const competences = godSpells.filter(s => s.type === 'competence');
        const utilities = godSpells.filter(s => s.type === 'utility');

        if (generators.length !== 2) {
            errors.push(`${godId}: doit avoir exactement 2 générateurs (${generators.length} trouvés)`);
        }
        if (competences.length !== 2) {
            errors.push(`${godId}: doit avoir exactement 2 compétences (${competences.length} trouvés)`);
        }
        if (utilities.length !== 1) {
            errors.push(`${godId}: doit avoir exactement 1 utilitaire (${utilities.length} trouvé)`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
