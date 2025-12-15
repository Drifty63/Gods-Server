import { SpellCard, GodCard } from '@/types/cards';

// Fonction utilitaire pour générer des sorts factices pour l'interface
export function getSpellsForGod(god: GodCard): SpellCard[] {
    // Spécifique pour Poséidon - Cartes Officielles
    if (god.id === 'poseidon') {
        return [
            {
                id: 'poseidon_s1',
                name: 'Grande Vague',
                element: 'water',
                godId: 'poseidon',
                type: 'competence', // ou 'utility' selon logique jeu, mais competence pour dégâts
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'custom', description: "Dégâts et Défausse" }],
                imageUrl: '/cards/spells/poseidon/grand_wave.png',
                description: "Inflige 2 dégâts à deux cibles et défausse 2 cartes de la main de votre adversaire."
            },
            {
                id: 'poseidon_s2',
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
                id: 'poseidon_s3',
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
                id: 'poseidon_s4',
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
                id: 'zeus_s2',
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
                id: 'zeus_s3',
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
                id: 'zeus_s4',
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
                id: 'nyx_s3',
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
                id: 'nyx_s4',
                name: 'Nuit Sans Fin',
                element: 'darkness',
                godId: 'nyx',
                type: 'competence',
                energyCost: 3,
                energyGain: 0,
                effects: [{ type: 'custom', description: "Reset Main Adversaire" }],
                imageUrl: '/cards/spells/nyx/endless_night.png',
                description: "L'adversaire mélange sa main dans son deck et pioche 5 cartes à l'envers"
            },
            {
                id: 'nyx_s5',
                name: 'Malédiction',
                element: 'darkness',
                godId: 'nyx',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 3 }, { type: 'custom', description: "Perturbation Ciblée" }],
                imageUrl: '/cards/spells/nyx/curse.png',
                description: "Inflige 3 dégâts à une cible; Choisissez 2 cartes de la main de votre adversaire, les mélange dans son deck et pioche 2 à l'envers."
            }
        ];
    }

    // Spécifique pour Hestia - Cartes Officielles
    if (god.id === 'hestia') {
        return [
            {
                id: 'hestia_s1',
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
                id: 'hestia_s2',
                name: 'Foyer protecteur',
                element: 'fire',
                godId: 'hestia',
                type: 'utility',
                energyCost: 3,
                energyGain: 0,
                effects: [{ type: 'custom', description: "Purification Faiblesses Global" }],
                imageUrl: '/cards/spells/hestia/protective_hearth.png',
                description: "Tout les alliées perdent leurs faiblesses pendant 3 tours."
            },
            {
                id: 'hestia_s3',
                name: 'Repas reconfortant',
                element: 'fire',
                godId: 'hestia',
                type: 'utility',
                energyCost: 1, // Supposition basée sur l'icone gauche "1"
                energyGain: 2,
                effects: [{ type: 'heal', value: 0 }, { type: 'energy', value: 2 }], // Heal dynamique
                imageUrl: '/cards/spells/hestia/comfort_meal.png',
                description: "Donne 2 énergies et soigne un allié de la valeur total de votre énergie."
            },
            {
                id: 'hestia_s4',
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
                id: 'hestia_s5',
                name: 'Fumée cendrée',
                element: 'fire',
                godId: 'hestia',
                type: 'competence',
                energyCost: 1,
                energyGain: 0,
                effects: [{ type: 'damage', value: 1, target: 'all_enemies' }, { type: 'custom', description: "Purification Ciblée" }],
                imageUrl: '/cards/spells/hestia/ash_smoke.png',
                description: "Inflige 1 dégâts à toutes les cibles et fait perdre la faiblesse d'un de vos dieux pendant 1 tour."
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
