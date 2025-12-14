import { SpellCard, GodCard } from '@/types/cards';

// Fonction utilitaire pour générer des sorts factices pour l'interface
export function getSpellsForGod(god: GodCard): SpellCard[] {
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
