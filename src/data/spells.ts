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
        description: '3🩸 → ⚔️',
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
        description: '1🩸 → ⚔️⚔️ | 2📤',
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
            { type: 'discard', value: 2 } // Cible implicite : adversaire (via la logique discard)
        ],
        imageUrl: '/cards/spells/spell_poseidon_vague.png',
        description: '2🩸 → ⚔️⚔️ | 2🎴🃏⚔️ → 🗑️',
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
        description: '5📤 → ⚔️ | 3🩸 ✖️ 🎴📤',
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
        description: '1🩸 → 👊 | 📤 ✖️ ⚔️',
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
        description: '3🩸 → ⚔️',
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
        description: '1🩸 +1⚡ → ⚔️⚔️',
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
        description: '5🩸 → ⚔️ | ❓+⚡/-⚡ | -⚡ ✖️ 2🩸',
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
        description: '3🩸 → 👊 | ❓+⚡/-⚡ | -⚡ ✖️ 2🩸',
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
        description: '2🩸 → ⚔️⚔️ | ❓+⚡/-⚡ | -⚡ ✖️ 2🩸',
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
        description: '1🩸 → 👊',
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
        description: '2🩸 → ⚔️ | 1🎴🃏⚔️ → 🔀📚 | +1🎴👁️',
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
        description: '3🩸 → ⚔️ | 2🎴🃏⚔️ → 🔀📚 | +2🎴👁️',
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
        description: '🃏⚔️ → 🔀📚 | +5🎴👁️',
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
        description: '+3🎴 | 3🎴 → 📚⬇️ | +1⚡',
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
        description: '3🩸 → ⚔️',
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
        description: '1🩸 → 👊 | ➖🌊1⏳ → 👤',
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
        description: '+2⚡ | ⚡🔗💚 → 👤',
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
        description: '➖🌊3⏳ → 👥',
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
        description: '2🎴🗑️ → 🔀📚',
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
        description: '3🩸 → ⚔️',
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
        description: '1🩸 → 👊 | +🗡️1⏳ → 🔄',
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
        description: '+3🛡️🔄 | +🗡️3⏳🔄',
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
        description: '+5🛡️ → 👥',
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
        description: '+3🛡️🔄 | +3🛡️ → 👤',
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
        description: '3🩸 → ⚔️',
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
        description: '1🩸 → 👊 | 2💚 → 👤',
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
        description: '5💚 → 👥 (répartir)',
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
        description: '❤️‍🩹 8PV → ☠️',
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
        description: '4💚 → 👤 | +1⚡',
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
        description: '3🩸 → ⚔️',
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
            { type: 'status', status: 'poison', value: 1, target: 'same' }, // 1 poison sur la 1ère cible
            { type: 'damage', value: 1, target: 'enemy_god' },
            { type: 'status', status: 'poison', value: 1, target: 'same' }  // 1 poison sur la 2ème cible
        ],
        imageUrl: '/cards/spells/spell_dionysos_ivresse.png',
        description: '1🩸 +1💀 → ⚔️⚔️',
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
            { type: 'status', status: 'poison', value: 2 } // S'applique à la même cible
        ],
        imageUrl: '/cards/spells/spell_dionysos_folie.png',
        description: '2🩸 +2💀 → ⚔️',
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
        description: '+2💀 → 👊',
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
            { type: 'custom', customEffectId: 'heal_by_poison', target: 'ally_god', description: 'Soigne un personnage du nombre total de poisons sur les ennemis' }
        ],
        imageUrl: '/cards/spells/spell_dionysos_ambroisie.png',
        description: '💀🔗💚 → 👤',
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
        description: '1🩸 → 👊',
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
        description: '2🩸 → ⚔️ | +2💚🔄',
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
        description: '6🩸 → ⚔️',
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
        description: '3🩸 → ⚔️ | 🩸🔗💚🔄',
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
        description: '8🩸 → ⚔️ | ☠️ → +8💚🔄',
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
        description: '1🩸 → 👊',
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
        description: '1🩸 → ⚔️ | -1⚡⚔️',
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
        description: '1🩸 → 👊 | -1⚡⚔️',
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
        description: '+3⚡ | +😵 3⏳🔄',
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
        description: '+1⚡ | -2⚡⚔️',
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
        description: '1🩸 → 👊',
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
        description: '+3⚡ | 3🩸 → 🔄',
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
        description: '4🩸 → ⚔️ | 2🩸 → 🔄',
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
        description: '5🩸 → ⚔️ | 3🩸 → 🔄',
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
        description: 'PV➖🔗🩸 → ⚔️ | 5🩸 → 🔄',
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
        description: '1🩸 → 👊',
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
        description: '2🩸 → ⚔️⚔️',
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
        description: '3🩸 → ⚔️⚔️',
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
        description: '3🩸 +🌊 → ⚔️',
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
        description: '10🩸 → ⚔️',
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
        description: '1🩸 → 👊',
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
            { type: 'status', status: 'stun', value: 1, statusDuration: 1, target: 'same', description: 'Stun pendant 1 tour' }
        ],
        imageUrl: '/cards/spells/spell_aphrodite_coeur_brise.png',
        description: '2🩸 +😵1⏳ → ⚔️',
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
        description: '➖🟠 +3💚 → 👤',
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
        description: '+😵2⏳ → ⚔️',
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
        description: '➖🟠 +3💚 → 👥',
    },

    // =====================================================
    // SORTS DE PERSÉPHONE (Ténèbres 💀) - CACHÉ
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'persephone_generator_1',
        name: 'Gifle Réginale',
        element: 'darkness',
        godId: 'persephone',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_persephone_gifle.png',
        description: '3🩸 → ⚔️',
    },
    {
        id: 'persephone_generator_2',
        name: 'Vision du Tartare',
        element: 'darkness',
        godId: 'persephone',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            // Effet custom unifié : inflige 1 dégât à 2 cibles, avec choix optionnel de +1 dégât
            { type: 'custom', customEffectId: 'vision_tartare', description: '1 dégât à 2 cibles, +1 si défausse 2 cartes' }
        ],
        imageUrl: '/cards/spells/spell_persephone_vision.png',
        description: '1🩸 → ⚔️⚔️ | 2📤 → +1🩸',
    },

    // --- COMPÉTENCES ---
    {
        id: 'persephone_skill_1',
        name: 'Échange d\'Âme',
        element: 'darkness',
        godId: 'persephone',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'retrieve_discard', description: 'Récupérez une carte de la défausse' },
            { type: 'mill', value: 3, target: 'self' }
        ],
        imageUrl: '/cards/spells/spell_persephone_echange.png',
        description: '🗑️ → 🖐️ | 3📤',
    },
    {
        id: 'persephone_skill_2',
        name: 'Brûlure Rémanente',
        element: 'darkness',
        godId: 'persephone',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'temp_resurrect', description: 'Ressuscite un dieu avec 5 PV, inflige 1 dégât chaque tour' }
        ],
        imageUrl: '/cards/spells/spell_persephone_brulure.png',
        description: '☠️ → 💀5💚 | 1🩸⏳',
    },

    // --- UTILITAIRE ---
    {
        id: 'persephone_utility_1',
        name: 'Pouvoirs des Âmes',
        element: 'darkness',
        godId: 'persephone',
        type: 'utility',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'copy_discard_spell', description: 'Copie un sort de la défausse en ténèbres' }
        ],
        imageUrl: '/cards/spells/spell_persephone_ames.png',
        description: '🗑️🎴 → 📋💀',
    },

    // =====================================================
    // SORTS D'HÉPHAÏSTOS (Feu 🔥) - CACHÉ
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'hephaistos_generator_1',
        name: 'Martellement',
        element: 'fire',
        godId: 'hephaistos',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'shield', value: 2, target: 'self' }
        ],
        imageUrl: '/cards/spells/spell_hephaistos_martellement.png',
        description: '2🩸 → ⚔️ | +2🛡️',
    },
    {
        id: 'hephaistos_generator_2',
        name: 'Étincelle Divine',
        element: 'fire',
        godId: 'hephaistos',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/spell_hephaistos_etincelle.png',
        description: '1🩸 → 👊',
    },

    // --- COMPÉTENCES ---
    {
        id: 'hephaistos_skill_1',
        name: 'Forge d\'Héphaïstos',
        element: 'fire',
        godId: 'hephaistos',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'shield', value: 6, target: 'self' }
        ],
        imageUrl: '/cards/spells/spell_hephaistos_forge.png',
        description: '+6🛡️',
    },
    {
        id: 'hephaistos_skill_2',
        name: 'Absorption d\'Armure',
        element: 'fire',
        godId: 'hephaistos',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'custom', customEffectId: 'gain_current_shield', description: 'Gagne en bouclier le nombre de boucliers actuels' }
        ],
        imageUrl: '/cards/spells/spell_hephaistos_absorption.png',
        description: '2🩸 → ⚔️ | +🛡️=🛡️',
    },

    // --- UTILITAIRE ---
    {
        id: 'hephaistos_utility_1',
        name: 'Armure de Destruction',
        element: 'fire',
        godId: 'hephaistos',
        type: 'utility',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'damage_plus_shield', target: 'enemy_god', description: 'Inflige 3 + nombre de boucliers' }
        ],
        imageUrl: '/cards/spells/spell_hephaistos_destruction.png',
        description: '3+🛡️🩸 → ⚔️',
    },

    // =====================================================
    // SORTS DE THANATOS (Ténèbres 💀) - CACHÉ
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'thanatos_generator_1',
        name: 'Coup Mortel',
        element: 'darkness',
        godId: 'thanatos',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'custom', customEffectId: 'damage_plus_dead_allies', target: 'enemy_god', description: 'Inflige 2 + 1 par allié mort' }
        ],
        imageUrl: '/cards/spells/spell_thanatos_coup.png',
        description: '2+☠️🩸 → ⚔️',
    },
    {
        id: 'thanatos_generator_2',
        name: 'Nova Sombre',
        element: 'darkness',
        godId: 'thanatos',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/spell_thanatos_nova.png',
        description: '1🩸 → 👊',
    },

    // --- COMPÉTENCES ---
    {
        id: 'thanatos_skill_1',
        name: 'Décharge Mortelle',
        element: 'darkness',
        godId: 'thanatos',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'damage_plus_2x_dead_allies', target: 'enemy_god', description: 'Inflige 2 + 2 par allié mort' }
        ],
        imageUrl: '/cards/spells/spell_thanatos_decharge.png',
        description: '2+2☠️🩸 → ⚔️',
    },
    {
        id: 'thanatos_skill_2',
        name: 'Happement Mortuaire',
        element: 'darkness',
        godId: 'thanatos',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'aoe_damage_plus_dead_allies', description: 'Inflige 1 + 1 par allié mort à tous' }
        ],
        imageUrl: '/cards/spells/spell_thanatos_happement.png',
        description: '1+☠️🩸 → 👊',
    },

    // --- UTILITAIRE ---
    {
        id: 'thanatos_utility_1',
        name: 'Faucheuse d\'Âme',
        element: 'darkness',
        godId: 'thanatos',
        type: 'utility',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'damage_5x_dead_allies', target: 'enemy_god', description: 'Inflige 5 × nombre d\'alliés morts' }
        ],
        imageUrl: '/cards/spells/spell_thanatos_faucheuse.png',
        description: '5×☠️🩸 → ⚔️',
    },

    // =====================================================
    // SORTS D'HERMÈS (Foudre ⚡) - CACHÉ
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'hermes_generator_1',
        name: 'Frappe Rapide',
        element: 'lightning',
        godId: 'hermes',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'enemy_god' },
            { type: 'custom', customEffectId: 'replay_action', description: 'Rejoue une action' }
        ],
        imageUrl: '/cards/spells/spell_hermes_frappe.png',
        description: '1🩸 → ⚔️ | 🔄',
    },
    {
        id: 'hermes_generator_2',
        name: 'Balayage Fulgurant',
        element: 'lightning',
        godId: 'hermes',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/spell_hermes_balayage.png',
        description: '1🩸 → 👊',
    },

    // --- COMPÉTENCES ---
    {
        id: 'hermes_skill_1',
        name: 'Bim !',
        element: 'lightning',
        godId: 'hermes',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'custom', customEffectId: 'replay_action', description: 'Rejoue une action' }
        ],
        imageUrl: '/cards/spells/spell_hermes_bim.png',
        description: '2🩸 → ⚔️ | 🔄',
    },
    {
        id: 'hermes_skill_2',
        name: 'Bam !',
        element: 'lightning',
        godId: 'hermes',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' },
            { type: 'custom', customEffectId: 'replay_action', description: 'Rejoue une action' }
        ],
        imageUrl: '/cards/spells/spell_hermes_bam.png',
        description: '1🩸 → 👊 | 🔄',
    },

    // --- UTILITAIRE ---
    {
        id: 'hermes_utility_1',
        name: 'Boom !',
        element: 'lightning',
        godId: 'hermes',
        type: 'utility',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' },
            { type: 'energy', value: 2 },
            { type: 'custom', customEffectId: 'replay_action', description: 'Rejoue une action' }
        ],
        imageUrl: '/cards/spells/spell_hermes_boom.png',
        description: '3🩸 → ⚔️ | +2⚡ | 🔄',
    },

    // =====================================================
    // SORTS DE SÉLÉNÉ (Eau 💧) - CACHÉ
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'selene_generator_1',
        name: 'Rayon de Lune',
        element: 'water',
        godId: 'selene',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_selene_rayon.png',
        description: '3🩸 → ⚔️',
    },
    {
        id: 'selene_generator_2',
        name: 'Rivière',
        element: 'water',
        godId: 'selene',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'enemy_god' },
            { type: 'damage', value: 1, target: 'enemy_god' },
            { type: 'heal', value: 1, target: 'all_allies' }
        ],
        imageUrl: '/cards/spells/spell_selene_riviere.png',
        description: '1🩸 → ⚔️⚔️ | +1💚 → 👥',
    },

    // --- COMPÉTENCES ---
    {
        id: 'selene_skill_1',
        name: 'Pluie de Lune',
        element: 'water',
        godId: 'selene',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'status', status: 'regen', value: 1, statusDuration: 2, target: 'all_allies' }
        ],
        imageUrl: '/cards/spells/spell_selene_pluie.png',
        description: '+1💚2⏳ → 👥',
    },
    {
        id: 'selene_skill_2',
        name: 'Marée Basse',
        element: 'water',
        godId: 'selene',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'cascade_heal_choice', description: 'Choisissez la direction du soin (3/2/1 ou 1/2/3)' }
        ],
        imageUrl: '/cards/spells/spell_selene_maree.png',
        description: '⬅️➡️ +3/2/1💚 → 👥',
    },

    // --- UTILITAIRE ---
    {
        id: 'selene_utility_1',
        name: 'Renaissance Bénéfique',
        element: 'water',
        godId: 'selene',
        type: 'utility',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'resurrect_two', description: 'Ressuscite 2 alliés avec 3 PV' }
        ],
        imageUrl: '/cards/spells/spell_selene_renaissance.png',
        description: '☠️☠️ → 3💚',
    },

    // =====================================================
    // SORTS DE ZÉPHYR (Air 💨) - CACHÉ
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'zephyr_generator_1',
        name: 'Envol Printanier',
        element: 'air',
        godId: 'zephyr',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_zephyr_envol.png',
        description: '3🩸 → ⚔️',
    },
    {
        id: 'zephyr_generator_2',
        name: 'Vent d\'Ouest',
        element: 'air',
        godId: 'zephyr',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' },
            { type: 'custom', customEffectId: 'choose_discard_enemy', description: 'Défaussez 1 carte de la main adverse (au choix)' }
        ],
        imageUrl: '/cards/spells/spell_zephyr_vent.png',
        description: '1🩸 → 👊 | 1🃏⚔️ → 🗑️',
    },

    // --- COMPÉTENCES ---
    {
        id: 'zephyr_skill_1',
        name: 'Vent de Face',
        element: 'air',
        godId: 'zephyr',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'shuffle_god_cards', description: 'Replace les cartes d\'un dieu dans le deck' }
        ],
        imageUrl: '/cards/spells/spell_zephyr_face.png',
        description: '⚔️🎴 → 🔀📚',
    },
    {
        id: 'zephyr_skill_2',
        name: 'Lame d\'Air',
        element: 'air',
        godId: 'zephyr',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' },
            { type: 'discard', value: 2, target: 'enemy_hand' }
        ],
        imageUrl: '/cards/spells/spell_zephyr_lame.png',
        description: '3🩸 → ⚔️ | 2🎴🃏⚔️ → 🗑️',
    },

    // --- UTILITAIRE ---
    {
        id: 'zephyr_utility_1',
        name: 'Bourrasque Chanceuse',
        element: 'air',
        godId: 'zephyr',
        type: 'utility',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'free_recycle', description: 'Mélange défausse et deck sans fatigue' }
        ],
        imageUrl: '/cards/spells/spell_zephyr_bourrasque.png',
        description: '🔀📚 (pas de fatigue)',
    },

    // =====================================================
    // SORTS DE NIKÉ (Lumière ☀️) - CACHÉ
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'nike_generator_1',
        name: 'Frappe Victorieuse',
        element: 'light',
        godId: 'nike',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_nike_frappe.png',
        description: '3🩸 → ⚔️',
    },
    {
        id: 'nike_generator_2',
        name: 'Succès Flamboyant',
        element: 'light',
        godId: 'nike',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'custom', customEffectId: 'damage_plus_dead_enemies', target: 'enemy_god', description: 'Inflige 1 + 1 par ennemi mort' }
        ],
        imageUrl: '/cards/spells/spell_nike_succes.png',
        description: '1+💀🩸 → ⚔️⚔️',
    },

    // --- COMPÉTENCES ---
    {
        id: 'nike_skill_1',
        name: 'Coup Triomphant',
        element: 'light',
        godId: 'nike',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'damage_plus_2x_dead_enemies', target: 'enemy_god', description: 'Inflige 2 + 2 par ennemi mort' }
        ],
        imageUrl: '/cards/spells/spell_nike_coup.png',
        description: '2+2💀🩸 → ⚔️',
    },
    {
        id: 'nike_skill_2',
        name: 'Consécration',
        element: 'light',
        godId: 'nike',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'aoe_damage_plus_dead_enemies', description: 'Inflige 1 + 1 par ennemi mort à tous' }
        ],
        imageUrl: '/cards/spells/spell_nike_consecration.png',
        description: '1+💀🩸 → 👊',
    },

    // --- UTILITAIRE ---
    {
        id: 'nike_utility_1',
        name: 'Apothéose',
        element: 'light',
        godId: 'nike',
        type: 'utility',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'custom', customEffectId: 'aoe_damage_plus_2x_dead_enemies', description: 'Inflige 2 + 2 par ennemi mort à tous' }
        ],
        imageUrl: '/cards/spells/spell_nike_apotheose.png',
        description: '2+2💀🩸 → 👊',
    },

    // =====================================================
    // SORTS DE CHIONÉ (Eau 💧) - CACHÉ
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'chione_generator_1',
        name: 'Toucher Glacial',
        element: 'water',
        godId: 'chione',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'status', status: 'stun', value: 1, statusDuration: 1, target: 'same' }
        ],
        imageUrl: '/cards/spells/spell_chione_toucher.png',
        description: '2🩸 → ⚔️ | +❄️1⏳',
    },
    {
        id: 'chione_generator_2',
        name: 'Tempête de Neige',
        element: 'water',
        godId: 'chione',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/spell_chione_tempete.png',
        description: '1🩸 → 👊',
    },

    // --- COMPÉTENCES ---
    {
        id: 'chione_skill_1',
        name: 'Lance de Glace',
        element: 'water',
        godId: 'chione',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 4, target: 'enemy_god' },
            { type: 'status', status: 'stun', value: 1, statusDuration: 1, target: 'same' }
        ],
        imageUrl: '/cards/spells/spell_chione_lance.png',
        description: '4🩸 → ⚔️ | +❄️1⏳',
    },
    {
        id: 'chione_skill_2',
        name: 'Cône de Froid',
        element: 'water',
        godId: 'chione',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            // Première cible : 2 dégâts + stun
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'status', status: 'stun', value: 1, statusDuration: 1, target: 'same' },
            // Deuxième cible : 2 dégâts + stun
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'status', status: 'stun', value: 1, statusDuration: 1, target: 'same' }
        ],
        imageUrl: '/cards/spells/spell_chione_cone.png',
        description: '2🩸 → ⚔️⚔️ | +❄️1⏳',
    },

    // --- UTILITAIRE ---
    {
        id: 'chione_utility_1',
        name: 'Âge de Glace',
        element: 'water',
        godId: 'chione',
        type: 'utility',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 8, target: 'enemy_god' },
            { type: 'custom', customEffectId: 'splash_damage', description: 'Inflige 2 aux cibles adjacentes' }
        ],
        imageUrl: '/cards/spells/spell_chione_age.png',
        description: '8🩸 → ⚔️ | 2🩸 → ⚔️↔️',
    },

    // =====================================================
    // SORTS DU SOLDAT D'ARÈS (Terre 🌿) - Ennemi mode histoire
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'soldier_ares_1_generator_1',
        name: 'Pluie de Lances',
        element: 'earth',
        godId: 'soldier_ares_1',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/soldier_rain_of_spears.png',
        description: '1🩸 → 👊',
    },
    {
        id: 'soldier_ares_1_generator_2',
        name: 'Coup de Lance',
        element: 'earth',
        godId: 'soldier_ares_1',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/soldier_precise_thrust.png',
        description: '3🩸 → ⚔️',
    },

    // --- COMPÉTENCES ---
    {
        id: 'soldier_ares_1_skill_1',
        name: 'Double Frappe',
        element: 'earth',
        godId: 'soldier_ares_1',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'damage', value: 2, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/soldier_double_strike.png',
        description: '2🩸 → ⚔️⚔️',
    },
    {
        id: 'soldier_ares_1_skill_2',
        name: 'Coup Dévastateur',
        element: 'earth',
        godId: 'soldier_ares_1',
        type: 'competence',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 5, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/soldier_heavy_blow.png',
        description: '5🩸 → ⚔️',
    },

    // --- UTILITAIRE ---
    {
        id: 'soldier_ares_1_utility_1',
        name: 'Mur de Boucliers',
        element: 'earth',
        godId: 'soldier_ares_1',
        type: 'utility',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'shield', value: 3, target: 'self' },
            { type: 'status', status: 'provocation', value: 1, statusDuration: 2, target: 'self' }
        ],
        imageUrl: '/cards/spells/soldier_shield_wall.png',
        description: '+3🛡️🔄 | +🗡️2⏳🔄',
    },

    // =====================================================
    // SORTS DU SOLDAT D'ARÈS 2 (Terre 🌿) - Ennemi mode histoire
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'soldier_ares_2_generator_1',
        name: 'Pluie de Lances',
        element: 'earth',
        godId: 'soldier_ares_2',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/soldier_rain_of_spears.png',
        description: '1🩸 → 👊',
    },
    {
        id: 'soldier_ares_2_generator_2',
        name: 'Coup de Lance',
        element: 'earth',
        godId: 'soldier_ares_2',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/soldier_precise_thrust.png',
        description: '3🩸 → ⚔️',
    },

    // --- COMPÉTENCES ---
    {
        id: 'soldier_ares_2_skill_1',
        name: 'Double Frappe',
        element: 'earth',
        godId: 'soldier_ares_2',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'damage', value: 2, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/soldier_double_strike.png',
        description: '2🩸 → ⚔️⚔️',
    },
    {
        id: 'soldier_ares_2_skill_2',
        name: 'Coup Dévastateur',
        element: 'earth',
        godId: 'soldier_ares_2',
        type: 'competence',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 5, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/soldier_heavy_blow.png',
        description: '5🩸 → ⚔️',
    },

    // --- UTILITAIRE ---
    {
        id: 'soldier_ares_2_utility_1',
        name: 'Mur de Boucliers',
        element: 'earth',
        godId: 'soldier_ares_2',
        type: 'utility',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'shield', value: 3, target: 'self' },
            { type: 'status', status: 'provocation', value: 1, statusDuration: 2, target: 'self' }
        ],
        imageUrl: '/cards/spells/soldier_shield_wall.png',
        description: '+3🛡️🔄 | +🗡️2⏳🔄',
    },

    // =====================================================
    // SORTS DU SOLDAT D'ARÈS 3 (Terre 🌿) - Ennemi histoire
    // Mêmes sorts que les autres soldats
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'soldier_ares_3_generator_1',
        name: 'Pluie de Lances',
        element: 'earth',
        godId: 'soldier_ares_3',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/soldier_rain_of_spears.png',
        description: '1🩸 → 👊',
    },
    {
        id: 'soldier_ares_3_generator_2',
        name: 'Coup de Lance',
        element: 'earth',
        godId: 'soldier_ares_3',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/soldier_precise_thrust.png',
        description: '3🩸 → ⚔️',
    },

    // --- COMPÉTENCES ---
    {
        id: 'soldier_ares_3_skill_1',
        name: 'Double Frappe',
        element: 'earth',
        godId: 'soldier_ares_3',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'damage', value: 2, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/soldier_double_strike.png',
        description: '2🩸 → ⚔️⚔️',
    },
    {
        id: 'soldier_ares_3_skill_2',
        name: 'Coup Dévastateur',
        element: 'earth',
        godId: 'soldier_ares_3',
        type: 'competence',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 5, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/soldier_heavy_blow.png',
        description: '5🩸 → ⚔️',
    },

    // --- UTILITAIRE ---
    {
        id: 'soldier_ares_3_utility_1',
        name: 'Mur de Boucliers',
        element: 'earth',
        godId: 'soldier_ares_3',
        type: 'utility',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'shield', value: 3, target: 'self' },
            { type: 'status', status: 'provocation', value: 1, statusDuration: 2, target: 'self' }
        ],
        imageUrl: '/cards/spells/soldier_shield_wall.png',
        description: '+3🛡️🔄 | +🗡️2⏳🔄',
    },

    // =====================================================
    // SORTS DU DRAGON DE THÈBES (Air 💨) - Boss mode histoire
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    // Générateur 1 : 1 dégât à tous les ennemis, génère 1 énergie
    {
        id: 'dragon_thebes_generator_1',
        name: 'Souffle Dévastateur',
        element: 'air',
        godId: 'dragon_thebes',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/spell_dragon_souffle.png',
        description: '1🩸 → 👊',
    },
    // Générateur 2 : 3 dégâts à une cible, génère 1 énergie
    {
        id: 'dragon_thebes_generator_2',
        name: 'Morsure du Dragon',
        element: 'air',
        godId: 'dragon_thebes',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_dragon_morsure.png',
        description: '3🩸 → ⚔️',
    },

    // --- COMPÉTENCES ---
    // Compétence 1 : 3 dégâts à 2 cibles + stun 1 tour
    {
        id: 'dragon_thebes_skill_1',
        name: 'Griffes Foudroyantes',
        element: 'air',
        godId: 'dragon_thebes',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' },
            { type: 'status', status: 'stun', value: 1, statusDuration: 1, target: 'same' },
            { type: 'damage', value: 3, target: 'enemy_god' },
            { type: 'status', status: 'stun', value: 1, statusDuration: 1, target: 'same' }
        ],
        imageUrl: '/cards/spells/spell_dragon_griffes.png',
        description: '3🩸 → ⚔️⚔️ | +❄️1⏳',
    },
    // Compétence 2 (Ultime) : 2 dégâts à tous + 3 bouclier
    {
        id: 'dragon_thebes_skill_2',
        name: 'Tempête Draconique',
        element: 'air',
        godId: 'dragon_thebes',
        type: 'competence',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 2, target: 'all_enemies' },
            { type: 'shield', value: 2, target: 'self' }
        ],
        imageUrl: '/cards/spells/spell_dragon_tempete.png',
        description: '2🩸 → 👊 | +2🛡️🔄',
    },

    // --- UTILITAIRE ---
    // Utilitaire : 3 bouclier + provocation 2 tours
    {
        id: 'dragon_thebes_utility_1',
        name: 'Écailles d\'Arès',
        element: 'air',
        godId: 'dragon_thebes',
        type: 'utility',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'shield', value: 3, target: 'self' },
            { type: 'status', status: 'provocation', value: 1, statusDuration: 2, target: 'self' }
        ],
        imageUrl: '/cards/spells/spell_dragon_ecailles.png',
        description: '+3🛡️🔄 | +🗡️2⏳🔄',
    },

    // ===========================================
    // ARACHNÉ - Créature des Ténèbres
    // ===========================================
    // Générateur 1 : 1 dégât à tous, génère 1 énergie
    {
        id: 'arachne_generator_1',
        name: 'Toile Mortelle',
        element: 'darkness',
        godId: 'arachne',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/spell_arachne_toile.png',
        description: '1🩸 → 👊',
    },
    // Générateur 2 : 3 dégâts à une cible, génère 1 énergie
    {
        id: 'arachne_generator_2',
        name: 'Morsure Venimeuse',
        element: 'darkness',
        godId: 'arachne',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_arachne_morsure.png',
        description: '3🩸 → ⚔️',
    },
    // Utilitaire : 1 poison à 2 cibles
    {
        id: 'arachne_utility_1',
        name: 'Venin Paralysant',
        element: 'darkness',
        godId: 'arachne',
        type: 'utility',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'status', status: 'poison', value: 1, target: 'enemy_god' },
            { type: 'status', status: 'poison', value: 1, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_arachne_venin.png',
        description: '+1💀 → ⚔️⚔️',
    },
    // Compétence 1 : 2 dégâts à 2 cibles + stun 1 tour
    {
        id: 'arachne_skill_1',
        name: 'Fils Maudits',
        element: 'darkness',
        godId: 'arachne',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'status', status: 'stun', value: 1, statusDuration: 2, target: 'same' },
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'status', status: 'stun', value: 1, statusDuration: 2, target: 'same' }
        ],
        imageUrl: '/cards/spells/spell_arachne_fils.png',
        description: '2🩸 +❄️1⏳ → ⚔️⚔️',
    },
    // Ultime : 1 poison à tous les ennemis
    {
        id: 'arachne_skill_2',
        name: 'Nuée Toxique',
        element: 'darkness',
        godId: 'arachne',
        type: 'competence',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'status', status: 'poison', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/spell_arachne_nuee.png',
        description: '+1💀 → 👊',
    },

    // ===========================================
    // ARAIGNÉE GÉANTE 1 - Créature des Ténèbres
    // ===========================================
    // Générateur 1 : 1 dégât à tous, génère 1 énergie
    {
        id: 'giant_spider_1_generator_1',
        name: 'Toile Rapide',
        element: 'darkness',
        godId: 'giant_spider_1',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/spell_spider_toile.png',
        description: '1🩸 → 👊',
    },
    // Générateur 2 : 3 dégâts à une cible, génère 1 énergie
    {
        id: 'giant_spider_1_generator_2',
        name: 'Crocs Géants',
        element: 'darkness',
        godId: 'giant_spider_1',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_spider_crocs.png',
        description: '3🩸 → ⚔️',
    },
    // Utilitaire : 3 bouclier + provocation 1 tour
    {
        id: 'giant_spider_1_utility_1',
        name: 'Carapace Protectrice',
        element: 'darkness',
        godId: 'giant_spider_1',
        type: 'utility',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'shield', value: 3, target: 'self' },
            { type: 'status', status: 'provocation', value: 1, statusDuration: 2, target: 'self' }
        ],
        imageUrl: '/cards/spells/spell_spider_carapace.png',
        description: '+3🛡️🔄 | +🗡️1⏳🔄',
    },
    // Compétence 1 : 2 dégâts à 2 cibles
    {
        id: 'giant_spider_1_skill_1',
        name: 'Attaque Coordonnée',
        element: 'darkness',
        godId: 'giant_spider_1',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'damage', value: 2, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_spider_attaque.png',
        description: '2🩸 → ⚔️⚔️',
    },
    // Ultime : 4 dégâts + 2 poison à 1 cible
    {
        id: 'giant_spider_1_skill_2',
        name: 'Injection Fatale',
        element: 'darkness',
        godId: 'giant_spider_1',
        type: 'competence',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 4, target: 'enemy_god' },
            { type: 'status', status: 'poison', value: 2, target: 'same' }
        ],
        imageUrl: '/cards/spells/spell_spider_injection.png',
        description: '4🩸 +2💀 → ⚔️',
    },

    // ===========================================
    // ARAIGNÉE GÉANTE 2 - Créature des Ténèbres
    // ===========================================
    {
        id: 'giant_spider_2_generator_1',
        name: 'Toile Rapide',
        element: 'darkness',
        godId: 'giant_spider_2',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/spell_spider_toile.png',
        description: '1🩸 → 👊',
    },
    {
        id: 'giant_spider_2_generator_2',
        name: 'Crocs Géants',
        element: 'darkness',
        godId: 'giant_spider_2',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_spider_crocs.png',
        description: '3🩸 → ⚔️',
    },
    {
        id: 'giant_spider_2_utility_1',
        name: 'Carapace Protectrice',
        element: 'darkness',
        godId: 'giant_spider_2',
        type: 'utility',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'shield', value: 3, target: 'self' },
            { type: 'status', status: 'provocation', value: 1, statusDuration: 2, target: 'self' }
        ],
        imageUrl: '/cards/spells/spell_spider_carapace.png',
        description: '+3🛡️🔄 | +🗡️1⏳🔄',
    },
    {
        id: 'giant_spider_2_skill_1',
        name: 'Attaque Coordonnée',
        element: 'darkness',
        godId: 'giant_spider_2',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'damage', value: 2, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_spider_attaque.png',
        description: '2🩸 → ⚔️⚔️',
    },
    {
        id: 'giant_spider_2_skill_2',
        name: 'Injection Fatale',
        element: 'darkness',
        godId: 'giant_spider_2',
        type: 'competence',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 4, target: 'enemy_god' },
            { type: 'status', status: 'poison', value: 2, target: 'same' }
        ],
        imageUrl: '/cards/spells/spell_spider_injection.png',
        description: '4🩸 +2💀 → ⚔️',
    },

    // ===========================================
    // ARAIGNÉE GÉANTE 3 - Créature des Ténèbres
    // ===========================================
    {
        id: 'giant_spider_3_generator_1',
        name: 'Toile Rapide',
        element: 'darkness',
        godId: 'giant_spider_3',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/spell_spider_toile.png',
        description: '1🩸 → 👊',
    },
    {
        id: 'giant_spider_3_generator_2',
        name: 'Crocs Géants',
        element: 'darkness',
        godId: 'giant_spider_3',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_spider_crocs.png',
        description: '3🩸 → ⚔️',
    },
    {
        id: 'giant_spider_3_utility_1',
        name: 'Carapace Protectrice',
        element: 'darkness',
        godId: 'giant_spider_3',
        type: 'utility',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'shield', value: 3, target: 'self' },
            { type: 'status', status: 'provocation', value: 1, statusDuration: 2, target: 'self' }
        ],
        imageUrl: '/cards/spells/spell_spider_carapace.png',
        description: '+3🛡️🔄 | +🗡️1⏳🔄',
    },
    {
        id: 'giant_spider_3_skill_1',
        name: 'Attaque Coordonnée',
        element: 'darkness',
        godId: 'giant_spider_3',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 2, target: 'enemy_god' },
            { type: 'damage', value: 2, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_spider_attaque.png',
        description: '2🩸 → ⚔️⚔️',
    },
    {
        id: 'giant_spider_3_skill_2',
        name: 'Injection Fatale',
        element: 'darkness',
        godId: 'giant_spider_3',
        type: 'competence',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 4, target: 'enemy_god' },
            { type: 'status', status: 'poison', value: 2, target: 'same' }
        ],
        imageUrl: '/cards/spells/spell_spider_injection.png',
        description: '4🩸 +2💀 → ⚔️',
    },

    // =====================================================
    // SORTS D'ULYSSE (Eau 💧) - Combat 4 Chapitre 2
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'ulysses_generator_1',
        name: 'Vague Déferlante',
        element: 'water',
        godId: 'ulysses',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/spell_ulysses_wave_strike.png',
        description: '1🩸 → ALL⚔️',
    },
    {
        id: 'ulysses_generator_2',
        name: 'Flèche Précise',
        element: 'water',
        godId: 'ulysses',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_ulysses_arrow_shot.png',
        description: '3🩸 → ⚔️',
    },

    // --- UTILITAIRE ---
    {
        id: 'ulysses_utility_1',
        name: 'Ruse d\'Ulysse',
        element: 'water',
        godId: 'ulysses',
        type: 'utility',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'status', status: 'untargetable', value: 1, statusDuration: 2, target: 'self' }
        ],
        imageUrl: '/cards/spells/spell_ulysses_cunning.png',
        description: '+🚫2⏳🔄',
    },

    // --- COMPÉTENCES ---
    {
        id: 'ulysses_skill_1',
        name: 'Coup Étourdissant',
        element: 'water',
        godId: 'ulysses',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' },
            { type: 'status', status: 'stun', value: 1, statusDuration: 2, target: 'same' }
        ],
        imageUrl: '/cards/spells/spell_ulysses_stunning_blow.png',
        description: '3🩸 +💫2⏳ → ⚔️',
    },
    {
        id: 'ulysses_skill_2',
        name: 'Raz-de-Marée',
        element: 'water',
        godId: 'ulysses',
        type: 'competence',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 2, target: 'all_enemies' },
            { type: 'status', status: 'untargetable', value: 1, statusDuration: 1, target: 'self' }
        ],
        imageUrl: '/cards/spells/spell_ulysses_tidal_wave.png',
        description: '2🩸 → ALL⚔️ | +🚫1⏳🔄',
    },

    // =====================================================
    // SORTS DU CHEVALIER D'ATHÉNA (Lumière ☀️) - Combat 4 Chapitre 2
    // 2 générateurs + 2 compétences + 1 utilitaire
    // =====================================================

    // --- GÉNÉRATEURS ---
    {
        id: 'athena_knight_generator_1',
        name: 'Balayage Lumineux',
        element: 'light',
        godId: 'athena_knight',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' }
        ],
        imageUrl: '/cards/spells/spell_knight_light_sweep.png',
        description: '1🩸 → ALL⚔️',
    },
    {
        id: 'athena_knight_generator_2',
        name: 'Frappe de Lance',
        element: 'light',
        godId: 'athena_knight',
        type: 'generator',
        energyCost: 0,
        energyGain: 1,
        effects: [
            { type: 'damage', value: 3, target: 'enemy_god' }
        ],
        imageUrl: '/cards/spells/spell_knight_spear_thrust.png',
        description: '3🩸 → ⚔️',
    },

    // --- UTILITAIRE ---
    {
        id: 'athena_knight_utility_1',
        name: 'Mur de Boucliers',
        element: 'light',
        godId: 'athena_knight',
        type: 'utility',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'shield', value: 3, target: 'self' },
            { type: 'status', status: 'provocation', value: 1, statusDuration: 2, target: 'self' }
        ],
        imageUrl: '/cards/spells/spell_knight_shield_wall.png',
        description: '+3🛡️🔄 | +🗡️2⏳🔄',
    },

    // --- COMPÉTENCES ---
    {
        id: 'athena_knight_skill_1',
        name: 'Double Estocade',
        element: 'light',
        godId: 'athena_knight',
        type: 'competence',
        energyCost: 1,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 1, target: 'enemy_god' },
            { type: 'status', status: 'stun', value: 1, statusDuration: 1, target: 'same' },
            { type: 'damage', value: 1, target: 'enemy_god' },
            { type: 'status', status: 'stun', value: 1, statusDuration: 1, target: 'same' }
        ],
        imageUrl: '/cards/spells/spell_knight_light_sweep.png',
        description: '1🩸 +💫1⏳ → ⚔️⚔️',
    },
    {
        id: 'athena_knight_skill_2',
        name: 'Ralliement Divin',
        element: 'light',
        godId: 'athena_knight',
        type: 'competence',
        energyCost: 3,
        energyGain: 0,
        effects: [
            { type: 'damage', value: 1, target: 'all_enemies' },
            { type: 'shield', value: 1, target: 'all_allies' }
        ],
        imageUrl: '/cards/spells/spell_knight_spear_thrust.png',
        description: '1🩸 → ALL⚔️ | +1🛡️ → ALL👥',
    },
];

// Helper pour obtenir les sorts d'un dieu
export function getSpellsByGodId(godId: string): SpellCard[] {
    return ALL_SPELLS.filter(spell => spell.godId === godId);
}

// Helper pour créer un deck complet pour un joueur (1 à 4 dieux = 5 à 20 cartes)
export function createDeck(godIds: string[]): SpellCard[] {
    if (godIds.length === 0 || godIds.length > 4) {
        throw new Error('Un deck doit contenir entre 1 et 4 dieux');
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
