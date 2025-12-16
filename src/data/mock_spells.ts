import { SpellCard, GodCard } from '@/types/cards';
export type { SpellCard } from '@/types/cards';

// Fonction utilitaire pour générer des sorts factices pour l'interface
export function getSpellsForGod(god: GodCard): SpellCard[] {
    // Spécifique pour Poséidon - Cartes Officielles
    if (god.id === 'poseidon') {
        return [
            {
                id: 'poseidon_s1',
                name: 'Trident de Poséidon',
                element: 'water',
                godId: 'poseidon',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 3 }],
                imageUrl: '/cards/spells/poseidon/trident.png',
                description: "Inflige 3 dégâts à une cible."
            },
            {
                id: 'poseidon_s2',
                name: 'Colère de Poséidon',
                element: 'water',
                godId: 'poseidon',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'custom', description: "Multi-cible et Meule" }],
                imageUrl: '/cards/spells/poseidon/wrath.png',
                description: "Inflige 1 dégâts à deux cibles et meule 2 cartes."
            },
            {
                id: 'poseidon_s3',
                name: 'Grande Vague',
                element: 'water',
                godId: 'poseidon',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'custom', description: "Dégâts et Défausse" }],
                imageUrl: '/cards/spells/poseidon/grand_wave.png',
                description: "Inflige 2 dégâts à deux cibles et défausse 2 cartes de la main de votre adversaire."
            },
            {
                id: 'poseidon_s4',
                name: 'Prison Aquatique',
                element: 'water',
                godId: 'poseidon',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'custom', description: "AOE et Meule" }],
                imageUrl: '/cards/spells/poseidon/water_prison.png',
                description: "Inflige 1 dégât à toutes les cibles et meule du nombre d'ennemis touchés."
            },
            {
                id: 'poseidon_s5',
                name: 'Tsunami',
                element: 'water',
                godId: 'poseidon',
                type: 'competence',
                energyCost: 3,
                energyGain: 0,
                effects: [{ type: 'custom', description: "Grosse Meule et Dégâts" }],
                imageUrl: '/cards/spells/poseidon/tsunami.png',
                description: "Ciblez un adversaire; Meule 5 cartes du dessus du deck... Inflige 3 dégâts par carte du dieu ciblé."
            }
        ];
    }

    // Spécifique pour Zeus - Cartes Officielles
    if (god.id === 'zeus') {
        return [
            {
                id: 'zeus_s1',
                name: 'Éclair de Zeus',
                element: 'lightning',
                godId: 'zeus',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 3 }],
                imageUrl: '/cards/spells/zeus/zeus_bolt.png',
                description: "Inflige 3 dégâts à une cible."
            },
            {
                id: 'zeus_s2',
                name: 'Foudre Conductrice',
                element: 'lightning',
                godId: 'zeus',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'custom', description: "Dégâts et Marque" }],
                imageUrl: '/cards/spells/zeus/conductive_lightning.png',
                description: "Inflige 1 dégâts à deux cibles et leurs applique 1 marque de foudre."
            },
            {
                id: 'zeus_s3',
                name: 'Éclair foudroyant',
                element: 'lightning',
                godId: 'zeus',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 5 }, { type: 'custom', description: "Explosion Marque" }],
                imageUrl: '/cards/spells/zeus/lightning_bolt.png',
                description: "Inflige 5 dégâts à une cible. Applique ou enlève ⚡. Inflige 2 dégâts par ⚡ enlevée."
            },
            {
                id: 'zeus_s4',
                name: "Chaîne d'éclair",
                element: 'lightning',
                godId: 'zeus',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'custom', description: "Multi-cible et Explosion Marque" }],
                imageUrl: '/cards/spells/zeus/chain_lightning.png',
                description: "Inflige 2 dégâts à 2 cibles. Applique ou enlève ⚡. Inflige 2 dégâts par ⚡ enlevée."
            },
            {
                id: 'zeus_s5',
                name: 'Foudroiement',
                element: 'lightning',
                godId: 'zeus',
                type: 'competence',
                energyCost: 3,
                energyGain: 0,
                effects: [{ type: 'damage', value: 3, target: 'all_enemies' }, { type: 'custom', description: "AOE et Explosion Marque" }],
                imageUrl: '/cards/spells/zeus/thunderstruck.png',
                description: "Inflige 3 dégâts à toutes les cibles. Applique ou enlève ⚡. Inflige 2 dégâts par ⚡ enlevée."
            }
        ];
    }

    // Spécifique pour Nyx - Cartes Officielles
    if (god.id === 'nyx') {
        return [
            {
                id: 'nyx_s1',
                name: 'Ombres dévorantes',
                element: 'darkness',
                godId: 'nyx',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'custom', description: "Dégâts et Perturbation Main" }],
                imageUrl: '/cards/spells/nyx/devouring_shadows.png',
                description: "Inflige 2 dégâts à une cible, mélangez une carte de la main de votre adversaire dans son deck et piochez 1 à l'envers."
            },
            {
                id: 'nyx_s2',
                name: 'Zone de vide',
                element: 'darkness',
                godId: 'nyx',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 1, target: 'all_enemies' }],
                imageUrl: '/cards/spells/nyx/void_zone.png',
                description: "Inflige 1 dégâts à toutes les cibles."
            },
            {
                id: 'nyx_s3',
                name: "Prophétie",
                element: 'darkness',
                godId: 'nyx',
                type: 'utility',
                energyCost: 1,
                energyGain: 1,
                effects: [{ type: 'custom', description: "Manipulation Deck et Gain Energie" }],
                imageUrl: '/cards/spells/nyx/prophecy.png',
                description: "Piochez 3 cartes du dessus de votre deck et placez 3 cartes en dessous, gagne 1 d'énergie."
            },
            {
                id: 'nyx_s4',
                name: 'Malédiction',
                element: 'darkness',
                godId: 'nyx',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 3 }, { type: 'custom', description: "Perturbation Ciblée" }],
                imageUrl: '/cards/spells/nyx/curse.png',
                description: "Inflige 3 dégâts à une cible; Choisissez 2 cartes de la main de votre adversaire, les mélange dans son deck et pioche 2 à l'envers."
            },
            {
                id: 'nyx_s5',
                name: 'Nuit Sans Fin',
                element: 'darkness',
                godId: 'nyx',
                type: 'competence',
                energyCost: 3,
                energyGain: 0,
                effects: [{ type: 'custom', description: "Reset Main Adversaire" }],
                imageUrl: '/cards/spells/nyx/endless_night.png',
                description: "L'adversaire mélange sa main dans son deck et pioche 5 cartes à l'envers"
            }
        ];
    }

    // Spécifique pour Hestia - Cartes Officielles
    if (god.id === 'hestia') {
        return [
            {
                id: 'hestia_s1',
                name: 'Flammes intérieur',
                element: 'fire',
                godId: 'hestia',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 3 }],
                imageUrl: '/cards/spells/hestia/inner_flames.png',
                description: "Inflige 3 dégâts à une cible."
            },
            {
                id: 'hestia_s2',
                name: 'Fumée cendrée',
                element: 'fire',
                godId: 'hestia',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 1, target: 'all_enemies' }, { type: 'custom', description: "Purification Ciblée" }],
                imageUrl: '/cards/spells/hestia/ash_smoke.png',
                description: "Inflige 1 dégâts à toutes les cibles et fait perdre la faiblesse d'un de vos dieux pendant 1 tour."
            },
            {
                id: 'hestia_s3',
                name: 'Repas reconfortant',
                element: 'fire',
                godId: 'hestia',
                type: 'utility',
                energyCost: 1,
                energyGain: 2,
                effects: [{ type: 'heal', value: 0 }, { type: 'energy', value: 2 }],
                imageUrl: '/cards/spells/hestia/comfort_meal.png',
                description: "Donne 2 énergies et soigne un allié de la valeur total de votre énergie."
            },
            {
                id: 'hestia_s4',
                name: 'Repos mérité',
                element: 'fire',
                godId: 'hestia',
                type: 'utility',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'custom', description: "Recyclage Défausse" }],
                imageUrl: '/cards/spells/hestia/deserved_rest.png',
                description: "Choisissez deux cartes dans votre défausse, faite les revenir dans votre deck puis mélangez le."
            },
            {
                id: 'hestia_s5',
                name: 'Foyer protecteur',
                element: 'fire',
                godId: 'hestia',
                type: 'utility',
                energyCost: 3,
                energyGain: 0,
                effects: [{ type: 'custom', description: "Purification Faiblesses Global" }],
                imageUrl: '/cards/spells/hestia/protective_hearth.png',
                description: "Tout les alliées perdent leurs faiblesses pendant 3 tours."
            }
        ];
    }

    // Spécifique pour Athéna - Cartes Officielles
    if (god.id === 'athena') {
        return [
            {
                id: 'athena_s1',
                name: 'Serres acérées',
                element: 'light',
                godId: 'athena',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 3 }],
                imageUrl: '/cards/spells/athena/sharp_talons.png',
                description: "Inflige 3 dégâts à une cible."
            },
            {
                id: 'athena_s2',
                name: 'Nova protectrice',
                element: 'light',
                godId: 'athena',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 1, target: 'all_enemies' }, { type: 'custom', description: "Provocation 1 tour" }],
                imageUrl: '/cards/spells/athena/protective_nova.png',
                description: "Inflige 1 dégâts à toutes les cibles. Provoque les attaques adverses pendant 1 tour."
            },
            {
                id: 'athena_s3',
                name: 'Faveur divine',
                element: 'light',
                godId: 'athena',
                type: 'utility',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'shield', value: 3 }],
                imageUrl: '/cards/spells/athena/divine_favor.png',
                description: "Donne 3 boucliers à elle et un allié."
            },
            {
                id: 'athena_s4',
                name: 'Provocation céleste',
                element: 'light',
                godId: 'athena',
                type: 'utility',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'shield', value: 3 }, { type: 'custom', description: "Provocation 3 tours" }],
                imageUrl: '/cards/spells/athena/celestial_taunt.png',
                description: "Gagne 3 de bouclier et provoque les attaques adverses pour 3 tours."
            },
            {
                id: 'athena_s5',
                name: 'Rempart ultime',
                element: 'light',
                godId: 'athena',
                type: 'utility',
                energyCost: 3,
                energyGain: 0,
                effects: [{ type: 'shield', value: 5, target: 'all_allies' }],
                imageUrl: '/cards/spells/athena/ultimate_bulwark.png',
                description: "Tous les alliés gagnent 5 boucliers."
            }
        ];
    }

    // Spécifique pour Demeter - Cartes Officielles
    if (god.id === 'demeter') {
        return [
            {
                id: 'demeter_s1',
                name: 'Moisson',
                element: 'earth',
                godId: 'demeter',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [],
                imageUrl: '/cards/spells/demeter/harvest.png',
                description: "Inflige 3 dégâts à une cible."
            },
            {
                id: 'demeter_s2',
                name: 'Sècheresse',
                element: 'earth',
                godId: 'demeter',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [],
                imageUrl: '/cards/spells/demeter/drought.png',
                description: "Inflige 1 dégâts à toutes les cibles et soigne 2 de façon souhaitée."
            },
            {
                id: 'demeter_s3',
                name: 'Fertilisation',
                element: 'earth',
                godId: 'demeter',
                type: 'utility',
                energyCost: 1,
                energyGain: 0,
                effects: [],
                imageUrl: '/cards/spells/demeter/fertilization.png',
                description: "Soigne 5 de façon souhaitée"
            },
            {
                id: 'demeter_s4',
                name: 'Récolte',
                element: 'earth',
                godId: 'demeter',
                type: 'utility',
                energyCost: 1,
                energyGain: 1,
                effects: [],
                imageUrl: '/cards/spells/demeter/recolte.png',
                description: "Soigne une cible de 4 et augmente l'énergie de 1"
            },
            {
                id: 'demeter_s5',
                name: 'Graine de vie',
                element: 'earth',
                godId: 'demeter',
                type: 'utility',
                energyCost: 3,
                energyGain: 0,
                effects: [],
                imageUrl: '/cards/spells/demeter/seed_of_life.png',
                description: "Fait revenir un personnage d'entre les morts avec 8 points de vie."
            }
        ];
    }

    // Spécifique pour Dionysos - Cartes Officielles
    if (god.id === 'dionysos') {
        return [
            {
                id: 'dionysos_s1',
                name: 'Gueule de bois',
                element: 'earth',
                godId: 'dionysos',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 3 }],
                imageUrl: '/cards/spells/dionysos/hangover.png',
                description: "Inflige 3 dégâts à une cible."
            },
            {
                id: 'dionysos_s2',
                name: 'Ivresse',
                element: 'earth',
                godId: 'dionysos',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 1 }, { type: 'custom', description: "1 poison à deux cibles" }],
                imageUrl: '/cards/spells/dionysos/drunkenness.png',
                description: "Inflige 1 dégâts à deux cibles et leurs inflige 1 de poison."
            },
            {
                id: 'dionysos_s3',
                name: 'Folie',
                element: 'earth',
                godId: 'dionysos',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 2 }, { type: 'custom', description: "2 poisons" }],
                imageUrl: '/cards/spells/dionysos/madness.png',
                description: "Inflige 2 dégâts et inflige 2 poison à une cible."
            },
            {
                id: 'dionysos_s4',
                name: 'Ambroisie',
                element: 'earth',
                godId: 'dionysos',
                type: 'utility',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'heal', value: 0 }, { type: 'custom', description: "Soin = Total Poisons" }],
                imageUrl: '/cards/spells/dionysos/ambrosia.png',
                description: "Soigne un personnage du nombre total de poisons sur les ennemis."
            },
            {
                id: 'dionysos_s5',
                name: 'Tournée Générale',
                element: 'earth',
                godId: 'dionysos',
                type: 'utility',
                energyCost: 3,
                energyGain: 0,
                effects: [{ type: 'custom', description: "2 poisons à tous les ennemis" }],
                imageUrl: '/cards/spells/dionysos/rounds_on_me.png',
                description: "Tous les ennemis subissent 2 de poison."
            }
        ];
    }

    // Spécifique pour Hadès - Cartes Officielles
    if (god.id === 'hades') {
        return [
            {
                id: 'hades_s1',
                name: 'Purgatoire',
                element: 'fire',
                godId: 'hades',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 2 }, { type: 'heal', value: 2, target: 'self' }],
                imageUrl: '/cards/spells/hades/purgatory.png',
                description: "Inflige 2 dégâts à une cible et regagne 2 points de vie."
            },
            {
                id: 'hades_s2',
                name: 'Terre brulée',
                element: 'fire',
                godId: 'hades',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 1, target: 'all_enemies' }],
                imageUrl: '/cards/spells/hades/scorched_earth.png',
                description: "Inflige 1 dégâts à toutes les cibles."
            },
            {
                id: 'hades_s3',
                name: 'Flammes infernales',
                element: 'fire',
                godId: 'hades',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 6 }],
                imageUrl: '/cards/spells/hades/hellfire.png',
                description: "Inflige 6 dégâts à une cible"
            },
            {
                id: 'hades_s4',
                name: 'Syphon d\'âme',
                element: 'fire',
                godId: 'hades',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 3 }, { type: 'heal', value: 3, target: 'self' }],
                imageUrl: '/cards/spells/hades/soul_siphon.png',
                description: "Inflige 3 dégâts à une cible ; Soigne du nombre de dégâts infligés"
            },
            {
                id: 'hades_s5',
                name: 'Chemin des âmes',
                element: 'fire',
                godId: 'hades',
                type: 'competence',
                energyCost: 3,
                energyGain: 0,
                effects: [{ type: 'damage', value: 8 }, { type: 'custom', description: "Soin si mortel" }],
                imageUrl: '/cards/spells/hades/path_of_souls.png',
                description: "Inflige 8 dégâts à une cible; Si la cible meurt de cette attaque, gagne 8 points de vie."
            }
        ];
    }

    // Spécifique pour Apollon - Cartes Officielles
    if (god.id === 'apollon') {
        return [
            {
                id: 'apollon_s1',
                name: 'Notes discordantes',
                element: 'air',
                godId: 'apollon',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 1 }],
                imageUrl: '/cards/spells/apollon/discordant_notes.png',
                description: "Inflige 1 dégâts et enlève 1 énergie à votre adversaire."
            },
            {
                id: 'apollon_s2',
                name: 'Cacophonie',
                element: 'air',
                godId: 'apollon',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 1, target: 'all_enemies' }],
                imageUrl: '/cards/spells/apollon/cacophony.png',
                description: "Inflige 1 dégâts à toutes les cibles."
            },
            {
                id: 'apollon_s3',
                name: 'Récital',
                element: 'air',
                godId: 'apollon',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 1, target: 'all_enemies' }],
                imageUrl: '/cards/spells/apollon/recital.png',
                description: "Inflige 1 dégâts à toutes les cibles et fait perdre 1 énergie à votre adversaire."
            },
            {
                id: 'apollon_s4',
                name: 'Concerto',
                element: 'air',
                godId: 'apollon',
                type: 'utility',
                energyCost: 1,
                energyGain: 3,
                effects: [{ type: 'custom', description: "Stun self 3 tours" }],
                imageUrl: '/cards/spells/apollon/concerto.png',
                description: "Apollon ne peut plus jouer pendant les 3 prochains tour, gagne 3 énergies."
            },
            {
                id: 'apollon_s5',
                name: 'Envolé Lyrique',
                element: 'air',
                godId: 'apollon',
                type: 'utility',
                energyCost: 3,
                energyGain: 1,
                effects: [{ type: 'custom', description: "-2 énergie adverse" }],
                imageUrl: '/cards/spells/apollon/lyrical_flight.png',
                description: "Gagne 1 énergie et fait perdre 2 énergies à votre adversaire."
            }
        ];
    }

    // Spécifique pour Arès - Cartes Officielles
    if (god.id === 'ares') {
        return [
            {
                id: 'ares_s1',
                name: 'Saut bestial',
                element: 'earth',
                godId: 'ares',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 4 }, { type: 'damage', value: 2, target: 'self' }],
                imageUrl: '/cards/spells/ares/bestial_leap.png',
                description: "Inflige 4 dégâts à une cible et reçoit 2 dégâts."
            },
            {
                id: 'ares_s2',
                name: 'Brisée les rangs',
                element: 'earth',
                godId: 'ares',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 1, target: 'all_enemies' }],
                imageUrl: '/cards/spells/ares/break_ranks.png',
                description: "Inflige 1 dégâts à toutes les cibles."
            },
            {
                id: 'ares_s3',
                name: 'Entrainement martial',
                element: 'earth',
                godId: 'ares',
                type: 'utility',
                energyCost: 1,
                energyGain: 3,
                effects: [{ type: 'damage', value: 3, target: 'self' }],
                imageUrl: '/cards/spells/ares/martial_training.png',
                description: "Augmente l'énergie de 3 et reçoit 3 dégâts."
            },
            {
                id: 'ares_s4',
                name: 'Frappe sauvage',
                element: 'earth',
                godId: 'ares',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 5 }, { type: 'damage', value: 3, target: 'self' }],
                imageUrl: '/cards/spells/ares/savage_strike.png',
                description: "Inflige 5 dégâts à une cible et reçoit 3 dégâts."
            },
            {
                id: 'ares_s5',
                name: 'Dernier recours',
                element: 'earth',
                godId: 'ares',
                type: 'competence',
                energyCost: 3,
                energyGain: 0,
                effects: [{ type: 'custom', description: "Dégâts = PV perdus" }, { type: 'damage', value: 5, target: 'self' }],
                imageUrl: '/cards/spells/ares/last_resort.png',
                description: "Inflige des dégâts égaux aux points de vie perdus. Subit 5 dégâts après l'attaque."
            }
        ];
    }

    // Spécifique pour Artémis - Cartes Officielles
    if (god.id === 'artemis') {
        return [
            {
                id: 'artemis_s1',
                name: 'Tir bestial',
                element: 'air',
                godId: 'artemis',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 2 }, { type: 'custom', description: "2 cibles" }],
                imageUrl: '/cards/spells/artemis/bestial_shot.png',
                description: "Inflige 2 dégâts à deux cibles."
            },
            {
                id: 'artemis_s2',
                name: 'Flèches multiples',
                element: 'air',
                godId: 'artemis',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 1, target: 'all_enemies' }],
                imageUrl: '/cards/spells/artemis/multiple_arrows.png',
                description: "Inflige 1 dégâts à toutes les cibles."
            },
            {
                id: 'artemis_s3',
                name: 'Coup critique',
                element: 'air',
                godId: 'artemis',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 3 }, { type: 'custom', description: "Applique Faiblesse" }],
                imageUrl: '/cards/spells/artemis/critical_hit.png',
                description: "Inflige 3 dégâts à une cible et lui applique une faiblesse d'un élément voulu."
            },
            {
                id: 'artemis_s4',
                name: 'Flèches traçantes',
                element: 'air',
                godId: 'artemis',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 3 }, { type: 'custom', description: "2 cibles" }],
                imageUrl: '/cards/spells/artemis/seeking_arrows.png',
                description: "Inflige 3 dégâts à deux cibles."
            },
            {
                id: 'artemis_s5',
                name: 'Flèche d\'exécution',
                element: 'air',
                godId: 'artemis',
                type: 'competence',
                energyCost: 3,
                energyGain: 0,
                effects: [{ type: 'damage', value: 10 }],
                imageUrl: '/cards/spells/artemis/execution_arrow.png',
                description: "Inflige 10 dégâts à une cible."
            }
        ];
    }

    // Spécifique pour Aphrodite - Cartes Officielles
    if (god.id === 'aphrodite') {
        return [
            {
                id: 'aphrodite_s1',
                name: 'Etreinte chaleureuse',
                element: 'light',
                godId: 'aphrodite',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 1, target: 'all_enemies' }],
                imageUrl: '/cards/spells/aphrodite/warm_embrace.png',
                description: "Inflige 1 dégât à toutes les cibles."
            },
            {
                id: 'aphrodite_s2',
                name: 'Cœur Brisé',
                element: 'light',
                godId: 'aphrodite',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 2 }, { type: 'status', status: 'stun', statusDuration: 1 }],
                imageUrl: '/cards/spells/aphrodite/broken_heart.png',
                description: "Inflige 2 dégâts à une cible et la charme pendant 1 tour."
            },
            {
                id: 'aphrodite_s3',
                name: 'Toucher sensuel',
                element: 'light',
                godId: 'aphrodite',
                type: 'utility',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'heal', value: 3 }, { type: 'custom', description: "Purification" }],
                imageUrl: '/cards/spells/aphrodite/sensual_touch.png',
                description: "Enlève tous les effets négatifs d'un personnage souhaité et soigne 3 points de vie."
            },
            {
                id: 'aphrodite_s4',
                name: 'Charme divin',
                element: 'light',
                godId: 'aphrodite',
                type: 'utility',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'status', status: 'stun', statusDuration: 2 }],
                imageUrl: '/cards/spells/aphrodite/divine_charm.png',
                description: "Charme une cible, l'empêchant de jouer pendant 2 tours"
            },
            {
                id: 'aphrodite_s5',
                name: 'Désir suprême',
                element: 'light',
                godId: 'aphrodite',
                type: 'utility',
                energyCost: 3,
                energyGain: 0,
                effects: [{ type: 'heal', value: 3, target: 'all_allies' }, { type: 'custom', description: "Purification de groupe" }],
                imageUrl: '/cards/spells/aphrodite/supreme_desire.png',
                description: "Soigne tous les alliés de 3 et enlève tous leurs effets négatifs."
            }
        ];
    }

    const spells: SpellCard[] = [
        // Carte 1 : Générateur d'énergie (Coût 0)
        {
            id: `${god.id}_s1`,
            name: `Canalisation ${god.element === 'fire' ? 'Ardente' : god.element === 'water' ? 'Aquatique' : 'Divine'}`,
            element: god.element,
            godId: god.id,
            type: 'generator',
            energyCost: 0,
            energyGain: 2,
            effects: [{ type: 'energy', value: 2, target: 'self' }],
            imageUrl: god.imageUrl, // On utilise l'image du dieu par défaut pour l'instant
            description: "Génère 2 points d'énergie divine."
        },
        // Carte 2 : Attaque Mineure (Coût 2)
        {
            id: `${god.id}_s2`,
            name: `Frappe de ${god.name.split(',')[0]}`,
            element: god.element,
            godId: god.id,
            type: 'competence',
            energyCost: 2,
            energyGain: 0,
            effects: [{ type: 'damage', value: 3, target: 'enemy_god' }],
            imageUrl: god.imageUrl,
            description: "Inflige 3 dégâts à l'adversaire."
        },
        // Carte 3 : Défense / Utilitaire (Coût 3)
        {
            id: `${god.id}_s3`,
            name: `Protection ${god.element}`,
            element: god.element,
            godId: god.id,
            type: 'utility',
            energyCost: 3,
            energyGain: 0,
            effects: [{ type: 'shield', value: 5, target: 'self' }],
            imageUrl: god.imageUrl,
            description: "Confère 5 points de bouclier."
        },
        // Carte 4 : Attaque Majeure (Coût 5)
        {
            id: `${god.id}_s4`,
            name: `Colère de ${god.name.split(',')[0]}`,
            element: god.element,
            godId: god.id,
            type: 'competence',
            energyCost: 5,
            energyGain: 0,
            effects: [{ type: 'damage', value: 7, target: 'enemy_god' }],
            imageUrl: god.imageUrl,
            description: "Une attaque puissante qui inflige 7 dégâts."
        },
        // Carte 5 : Ultime (Coût 8)
        {
            id: `${god.id}_s5`,
            name: `Avènement Divin`,
            element: god.element,
            godId: god.id,
            type: 'competence',
            energyCost: 8,
            energyGain: 0,
            effects: [{ type: 'damage', value: 12, target: 'enemy_god' }],
            imageUrl: god.imageUrl,
            description: "L'attaque ultime. Inflige des dégâts massifs."
        }
    ];

    return spells;
}
