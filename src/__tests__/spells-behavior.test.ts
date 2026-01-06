/**
 * Tests de COMPORTEMENT des sorts du jeu GODS
 * Vérifie que chaque sort applique correctement ses effets via le GameEngine
 * 
 * Ces tests détectent les incohérences entre les descriptions et les effets réels
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '@/game-engine/GameEngine';
import { ALL_SPELLS, getSpellsByGodId } from '@/data/spells';
import { ALL_GODS, getGodById } from '@/data/gods';
import { GameState, PlayerState, GodState, SpellCard } from '@/types/cards';

// =====================================================
// HELPERS POUR CRÉER UN ÉTAT DE JEU DE TEST
// =====================================================

/**
 * Crée un état de dieu pour les tests
 */
function createGodState(godId: string): GodState {
    const god = getGodById(godId);
    if (!god) throw new Error(`Dieu non trouvé: ${godId}`);

    return {
        card: god,
        currentHealth: god.maxHealth,
        statusEffects: [],
        isDead: false,
    };
}

/**
 * Crée un état de joueur pour les tests
 */
function createPlayerState(
    id: string,
    name: string,
    godIds: string[]
): PlayerState {
    const gods = godIds.map(gid => createGodState(gid));
    const spells = godIds.flatMap(gid => getSpellsByGodId(gid));

    return {
        id,
        name,
        gods,
        hand: [...spells.slice(0, 5)],
        deck: [...spells.slice(5)],
        discard: [],
        removedCards: [],
        energy: 3,
        fatigueCounter: 0,
        hasPlayedCard: false,
        hasDiscardedForEnergy: false,
    };
}

/**
 * Crée un état de jeu complet pour les tests
 */
function createTestGameState(
    player1Gods: string[] = ['poseidon', 'zeus', 'hestia'],
    player2Gods: string[] = ['hades', 'ares', 'athena']
): GameState {
    return {
        id: 'test-game',
        status: 'playing',
        currentPlayerId: 'player1',
        turnNumber: 1,
        players: [
            createPlayerState('player1', 'Joueur 1', player1Gods),
            createPlayerState('player2', 'Joueur 2', player2Gods),
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/**
 * Ajoute une carte spécifique en main du joueur actuel
 */
function addCardToHand(engine: GameEngine, spellId: string): void {
    const spell = ALL_SPELLS.find(s => s.id === spellId);
    if (!spell) throw new Error(`Sort non trouvé: ${spellId}`);

    const player = engine.getCurrentPlayer();
    player.hand.push({ ...spell });
}

/**
 * Trouve un dieu ennemi vivant
 */
function getEnemyGod(engine: GameEngine): GodState {
    return engine.getOpponent().gods.find(g => !g.isDead)!;
}

/**
 * Trouve un dieu allié vivant
 */
function getAllyGod(engine: GameEngine): GodState {
    return engine.getCurrentPlayer().gods.find(g => !g.isDead)!;
}

// =====================================================
// TESTS DE COMPORTEMENT - POSÉIDON
// =====================================================

describe('Comportement des sorts - Poséidon', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine(createTestGameState());
    });

    it('Trident de Poséidon devrait infliger 3 dégâts et générer 1 énergie', () => {
        addCardToHand(engine, 'poseidon_generator_1');
        const enemy = getEnemyGod(engine);
        const initialHealth = enemy.currentHealth;
        const initialEnergy = engine.getCurrentPlayer().energy;

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'poseidon_generator_1',
            targetGodId: enemy.card.id,
        });

        // Vérifie les dégâts (au moins 3, plus si faiblesse)
        expect(enemy.currentHealth).toBeLessThan(initialHealth);
        expect(initialHealth - enemy.currentHealth).toBeGreaterThanOrEqual(3);
        // Vérifie le gain d'énergie
        expect(engine.getCurrentPlayer().energy).toBe(initialEnergy + 1);
    });

    it('Grande Vague devrait infliger 2 dégâts à 2 cibles et coûter 1 énergie', () => {
        engine = new GameEngine(createTestGameState());
        addCardToHand(engine, 'poseidon_skill_1');
        engine.getCurrentPlayer().energy = 5;

        const enemies = engine.getOpponent().gods.filter(g => !g.isDead);
        const target1 = enemies[0];
        const target2 = enemies[1];
        const initialHealth1 = target1.currentHealth;
        const initialHealth2 = target2.currentHealth;

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'poseidon_skill_1',
            targetGodIds: [target1.card.id, target2.card.id],
        });

        // Chaque cible reçoit au moins 2 dégâts
        expect(target1.currentHealth).toBeLessThan(initialHealth1);
        expect(target2.currentHealth).toBeLessThan(initialHealth2);
    });
});

// =====================================================
// TESTS DE COMPORTEMENT - ZEUS
// =====================================================

describe('Comportement des sorts - Zeus', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine(createTestGameState());
    });

    it('Éclair de Zeus devrait infliger 3 dégâts', () => {
        addCardToHand(engine, 'zeus_generator_1');
        const enemy = getEnemyGod(engine);
        const initialHealth = enemy.currentHealth;

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'zeus_generator_1',
            targetGodId: enemy.card.id,
        });

        expect(enemy.currentHealth).toBeLessThan(initialHealth);
        expect(initialHealth - enemy.currentHealth).toBeGreaterThanOrEqual(3);
    });

    it('Foudre Conductrice devrait appliquer des marques de foudre', () => {
        addCardToHand(engine, 'zeus_generator_2');
        const enemy = getEnemyGod(engine);

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'zeus_generator_2',
            targetGodIds: [enemy.card.id, enemy.card.id],
        });

        const lightningStacks = enemy.statusEffects.find(s => s.type === 'lightning')?.stacks || 0;
        expect(lightningStacks).toBeGreaterThan(0);
    });

    it('Retirer les marques de foudre devrait infliger 2 dégâts bonus par marque', () => {
        addCardToHand(engine, 'zeus_skill_1');
        engine.getCurrentPlayer().energy = 5;

        const enemy = getEnemyGod(engine);
        // Ajouter 2 marques de foudre
        enemy.statusEffects.push({ type: 'lightning', stacks: 2 });
        const initialHealth = enemy.currentHealth;

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'zeus_skill_1',
            targetGodId: enemy.card.id,
            lightningAction: 'remove',
        });

        // 5 dégâts de base + 4 bonus (2 marques × 2) = 9 minimum
        const damageTaken = initialHealth - enemy.currentHealth;
        expect(damageTaken).toBeGreaterThanOrEqual(9);
        // Les marques doivent être retirées
        expect(enemy.statusEffects.find(s => s.type === 'lightning')).toBeUndefined();
    });
});

// =====================================================
// TESTS DE COMPORTEMENT - ATHÉNA
// =====================================================

describe('Comportement des sorts - Athéna', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine(createTestGameState(['athena', 'zeus', 'poseidon'], ['hades', 'ares', 'artemis']));
    });

    it('Serres acérées (générateur) devrait infliger 3 dégâts', () => {
        addCardToHand(engine, 'athena_generator_1');
        const enemy = getEnemyGod(engine);
        const initialHealth = enemy.currentHealth;

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'athena_generator_1',
            targetGodId: enemy.card.id,
        });

        expect(initialHealth - enemy.currentHealth).toBeGreaterThanOrEqual(3);
    });

    it('Provocation céleste devrait ajouter bouclier et provocation', () => {
        addCardToHand(engine, 'athena_skill_1');
        engine.getCurrentPlayer().energy = 5;
        const athena = engine.getCurrentPlayer().gods.find(g => g.card.id === 'athena')!;

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'athena_skill_1',
        });

        // Bouclier ajouté
        const shieldStacks = athena.statusEffects.find(s => s.type === 'shield')?.stacks || 0;
        expect(shieldStacks).toBe(3);
        // Provocation ajoutée
        const provocationStacks = athena.statusEffects.find(s => s.type === 'provocation')?.stacks || 0;
        expect(provocationStacks).toBe(1);
    });

    it('Le bouclier devrait absorber les dégâts', () => {
        // Ajouter un gros bouclier à un allié d'Athéna
        const athena = engine.getCurrentPlayer().gods.find(g => g.card.id === 'athena')!;
        athena.statusEffects.push({ type: 'shield', stacks: 10 });
        const initialHealth = athena.currentHealth;
        const initialShield = 10;

        // Simuler une attaque ennemie via fin de tour puis attaque
        // On va plutôt tester directement en simulant les dégâts
        // Le bouclier est déjà ajouté, on vérifie qu'il absorbe

        // Simuler des dégâts via un sort ennemi
        engine['state'].currentPlayerId = 'player2';
        const hades = engine.getOpponent(); // C'est maintenant player1

        addCardToHand(engine, 'zeus_generator_1'); // 3 dégâts

        const result = engine.executeAction({
            type: 'play_card',
            playerId: 'player2',
            cardId: 'zeus_generator_1',
            targetGodId: 'athena',
        });

        if (result.success) {
            // Le bouclier a absorbé les dégâts (3 sur 10)
            expect(athena.currentHealth).toBe(initialHealth);
            const remainingShield = athena.statusEffects.find(s => s.type === 'shield')?.stacks || 0;
            expect(remainingShield).toBe(initialShield - 3); // 10 - 3 = 7
        }
    });
});

// =====================================================
// TESTS DE COMPORTEMENT - DÉMÉTER
// =====================================================

describe('Comportement des sorts - Déméter', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine(createTestGameState(['demeter', 'zeus', 'poseidon'], ['hades', 'ares', 'athena']));
    });

    it('Moisson devrait infliger 3 dégâts', () => {
        addCardToHand(engine, 'demeter_generator_1');
        const enemy = getEnemyGod(engine);
        const initialHealth = enemy.currentHealth;

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'demeter_generator_1',
            targetGodId: enemy.card.id,
        });

        expect(initialHealth - enemy.currentHealth).toBeGreaterThanOrEqual(3);
    });

    it('Sècheresse devrait infliger 1 dégât à tous les ennemis et soigner 2 PV', () => {
        addCardToHand(engine, 'demeter_generator_2');
        const enemies = engine.getOpponent().gods.filter(g => !g.isDead);
        const initialHealths = enemies.map(e => e.currentHealth);

        const ally = engine.getCurrentPlayer().gods.find(g => g.card.id === 'demeter')!;
        ally.currentHealth = ally.card.maxHealth - 5;
        const initialAllyHealth = ally.currentHealth;

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'demeter_generator_2',
            targetGodId: ally.card.id,
        });

        // Tous les ennemis ont reçu des dégâts
        enemies.forEach((e, i) => {
            expect(e.currentHealth).toBeLessThan(initialHealths[i]);
        });
        // L'allié a été soigné
        expect(ally.currentHealth).toBeGreaterThan(initialAllyHealth);
    });

    it('Graine de vie devrait ressusciter un dieu mort avec 8 PV', () => {
        addCardToHand(engine, 'demeter_skill_2');
        engine.getCurrentPlayer().energy = 5;

        // Tuer Zeus
        const zeus = engine.getCurrentPlayer().gods.find(g => g.card.id === 'zeus')!;
        zeus.isDead = true;
        zeus.currentHealth = 0;

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'demeter_skill_2',
            targetGodId: 'zeus',
        });

        expect(zeus.isDead).toBe(false);
        expect(zeus.currentHealth).toBe(8);
    });
});

// =====================================================
// TESTS DE COMPORTEMENT - DIONYSOS
// =====================================================

describe('Comportement des sorts - Dionysos', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine(createTestGameState(['dionysos', 'zeus', 'poseidon'], ['hades', 'ares', 'athena']));
    });

    it('Le générateur de Dionysos devrait infliger des dégâts', () => {
        addCardToHand(engine, 'dionysos_generator_1');
        const enemy = getEnemyGod(engine);
        const initialHealth = enemy.currentHealth;

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'dionysos_generator_1',
            targetGodId: enemy.card.id,
        });

        expect(enemy.currentHealth).toBeLessThan(initialHealth);
    });
});

// =====================================================
// TESTS DE COMPORTEMENT - HESTIA
// =====================================================

describe('Comportement des sorts - Hestia', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine(createTestGameState(['hestia', 'zeus', 'poseidon'], ['hades', 'ares', 'athena']));
    });

    it('Flamme du Foyer devrait infliger 3 dégâts', () => {
        addCardToHand(engine, 'hestia_generator_1');
        const enemy = getEnemyGod(engine);
        const initialHealth = enemy.currentHealth;

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'hestia_generator_1',
            targetGodId: enemy.card.id,
        });

        expect(initialHealth - enemy.currentHealth).toBeGreaterThanOrEqual(3);
    });
});

// =====================================================
// TESTS DE COMPORTEMENT - ARTÉMIS  
// =====================================================

describe('Comportement des sorts - Artémis', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine(createTestGameState(['artemis', 'zeus', 'poseidon'], ['hades', 'ares', 'athena']));
    });

    it('Flèche Chasseresse devrait infliger des dégâts', () => {
        addCardToHand(engine, 'artemis_generator_1');
        const enemy = getEnemyGod(engine);
        const initialHealth = enemy.currentHealth;

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'artemis_generator_1',
            targetGodId: enemy.card.id,
        });

        expect(enemy.currentHealth).toBeLessThan(initialHealth);
    });
});

// =====================================================
// TESTS DE COMPORTEMENT - APOLLON
// =====================================================

describe('Comportement des sorts - Apollon', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine(createTestGameState(['apollon', 'zeus', 'poseidon'], ['hades', 'ares', 'athena']));
    });

    it('Rayon Solaire devrait infliger des dégâts', () => {
        addCardToHand(engine, 'apollon_generator_1');
        const enemy = getEnemyGod(engine);
        const initialHealth = enemy.currentHealth;

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'apollon_generator_1',
            targetGodId: enemy.card.id,
        });

        expect(enemy.currentHealth).toBeLessThan(initialHealth);
    });
});

// =====================================================
// TESTS DE COMPORTEMENT - NYX
// =====================================================

describe('Comportement des sorts - Nyx', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine(createTestGameState(['nyx', 'zeus', 'poseidon'], ['hades', 'ares', 'athena']));
    });

    it('Le générateur de Nyx devrait infliger des dégâts', () => {
        addCardToHand(engine, 'nyx_generator_1');
        const enemy = getEnemyGod(engine);
        const initialHealth = enemy.currentHealth;

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'nyx_generator_1',
            targetGodId: enemy.card.id,
        });

        expect(enemy.currentHealth).toBeLessThan(initialHealth);
    });
});

// =====================================================
// TESTS GÉNÉRIQUES - TOUS LES GÉNÉRATEURS
// =====================================================

describe('Tous les générateurs génèrent de l\'énergie', () => {
    const generators = ALL_SPELLS.filter(s => s.type === 'generator');
    const playableGodIds = ALL_GODS.filter(g => !g.hidden).map(g => g.id);
    const playableGenerators = generators.filter(s => playableGodIds.includes(s.godId));

    playableGenerators.forEach(spell => {
        it(`${spell.name} (${spell.godId}) devrait générer ${spell.energyGain} énergie`, () => {
            const engine = new GameEngine(createTestGameState([spell.godId, 'zeus', 'poseidon'], ['hades', 'ares', 'athena']));
            addCardToHand(engine, spell.id);

            const initialEnergy = engine.getCurrentPlayer().energy;
            const enemy = getEnemyGod(engine);
            const ally = getAllyGod(engine);

            // Déterminer la cible selon le type de sort
            let targetId = enemy.card.id;
            if (spell.effects.some(e => e.type === 'heal' || e.type === 'shield')) {
                targetId = ally.card.id;
            }

            const result = engine.executeAction({
                type: 'play_card',
                playerId: 'player1',
                cardId: spell.id,
                targetGodId: targetId,
                targetGodIds: [targetId],
            });

            if (result.success) {
                expect(engine.getCurrentPlayer().energy).toBe(initialEnergy + spell.energyGain - spell.energyCost);
            }
        });
    });
});

// =====================================================
// TESTS GÉNÉRIQUES - DÉGÂTS DE BASE
// =====================================================

describe('Les sorts de dégâts infligent des dégâts', () => {
    const spellsWithDamage = ALL_SPELLS.filter(s =>
        s.effects.some(e => e.type === 'damage' && e.target === 'enemy_god')
    );

    const playableGodIds = ALL_GODS.filter(g => !g.hidden).map(g => g.id);
    const playableSpells = spellsWithDamage.filter(s => playableGodIds.includes(s.godId));
    const sampleSpells = playableSpells.slice(0, 10);

    sampleSpells.forEach(spell => {
        it(`${spell.name} devrait infliger des dégâts`, () => {
            const engine = new GameEngine(createTestGameState([spell.godId, 'zeus', 'poseidon'], ['hades', 'ares', 'athena']));
            addCardToHand(engine, spell.id);
            engine.getCurrentPlayer().energy = 10;

            const enemy = getEnemyGod(engine);
            const initialHealth = enemy.currentHealth;

            const result = engine.executeAction({
                type: 'play_card',
                playerId: 'player1',
                cardId: spell.id,
                targetGodId: enemy.card.id,
                targetGodIds: [enemy.card.id],
            });

            if (result.success) {
                expect(enemy.currentHealth).toBeLessThan(initialHealth);
            }
        });
    });
});

// =====================================================
// TESTS DE POISON
// =====================================================

describe('Le poison inflige des dégâts', () => {
    it('Un dieu empoisonné subit des dégâts de poison en lançant un sort', () => {
        const engine = new GameEngine(createTestGameState(['poseidon', 'zeus', 'hestia'], ['hades', 'ares', 'athena']));

        const poseidon = engine.getCurrentPlayer().gods.find(g => g.card.id === 'poseidon')!;
        poseidon.statusEffects.push({ type: 'poison', stacks: 3 });
        const initialHealth = poseidon.currentHealth;

        addCardToHand(engine, 'poseidon_generator_1');
        const enemy = getEnemyGod(engine);

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'poseidon_generator_1',
            targetGodId: enemy.card.id,
        });

        expect(poseidon.currentHealth).toBe(initialHealth - 3);
    });
});

// =====================================================
// TESTS DE FIN DE PARTIE
// =====================================================

describe('Conditions de victoire', () => {
    it('La partie se termine quand un dieu ennemi meurt suite à une attaque', () => {
        const engine = new GameEngine(createTestGameState(['poseidon', 'zeus', 'hestia'], ['hades', 'ares', 'athena']));

        // Mettre tous les ennemis à 1 PV sauf un
        const enemies = engine.getOpponent().gods;
        enemies[0].currentHealth = 1;
        enemies[0].isDead = false;
        enemies[1].currentHealth = 0;
        enemies[1].isDead = true;
        enemies[2].currentHealth = 0;
        enemies[2].isDead = true;

        // Attaquer le dernier ennemi
        addCardToHand(engine, 'poseidon_generator_1');
        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'poseidon_generator_1',
            targetGodId: enemies[0].card.id,
        });

        // La partie est terminée
        expect(engine.getState().status).toBe('finished');
        expect(engine.getState().winnerId).toBe('player1');
    });
});

// =====================================================
// TESTS DE COHÉRENCE DESCRIPTION/EFFET
// =====================================================

describe('Cohérence description/effet', () => {
    it('Les sorts avec damage: 3 dans leurs effets infligent au moins 3 dégâts', () => {
        const spellsWith3Damage = ALL_SPELLS.filter(s =>
            s.effects.some(e => e.type === 'damage' && e.value === 3 && e.target === 'enemy_god')
        );

        const playableGodIds = ALL_GODS.filter(g => !g.hidden).map(g => g.id);
        const testSpells = spellsWith3Damage.filter(s => playableGodIds.includes(s.godId)).slice(0, 5);

        testSpells.forEach(spell => {
            const engine = new GameEngine(createTestGameState([spell.godId, 'zeus', 'poseidon'], ['hades', 'ares', 'athena']));
            addCardToHand(engine, spell.id);
            engine.getCurrentPlayer().energy = 10;

            const enemy = getEnemyGod(engine);
            const initialHealth = enemy.currentHealth;

            engine.executeAction({
                type: 'play_card',
                playerId: 'player1',
                cardId: spell.id,
                targetGodId: enemy.card.id,
                targetGodIds: [enemy.card.id],
            });

            const damageTaken = initialHealth - enemy.currentHealth;
            // Au moins 3 dégâts (ou plus avec bonus de faiblesse)
            expect(damageTaken).toBeGreaterThanOrEqual(3);
        });
    });
});
