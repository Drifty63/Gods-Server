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
        log: [],
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
// TESTS DE RÉGRESSION - FIX DOUBLE-EXÉCUTION (PERSÉPHONE / SÉLÉNÉ / DÉMÉTER / ZÉPHYR)
// =====================================================
// Ces sorts nécessitent un choix du joueur (cible, direction, distribution...). Avant le fix,
// gameStore.ts jouait la carte via engine.executeAction() SANS le choix (ce qui exécutait déjà
// le handler "auto" une première fois), puis ré-appliquait l'effet une seconde fois manuellement
// une fois le choix connu. Ces tests reproduisent exactement le flux en 2 temps que gameStore.ts
// utilise désormais : play_card avec deferCustomEffect: true, puis resolveDeferredEffect() une
// fois le choix connu — et vérifient qu'il n'y a bien qu'UNE seule application de l'effet.

describe('Perséphone - Vision du Tartare (vision_tartare)', () => {
    it('inflige exactement 1 dégât par cible quand le bonus est refusé (pas de double dégât)', () => {
        const engine = new GameEngine(createTestGameState(['persephone', 'zeus', 'hestia'], ['hades', 'ares', 'athena']));
        engine.getCurrentPlayer().energy = 10;
        addCardToHand(engine, 'persephone_generator_2');

        const enemies = engine.getOpponent().gods;
        const [t1, t2] = enemies;
        const h1 = t1.currentHealth;
        const h2 = t2.currentHealth;

        const playResult = engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'persephone_generator_2',
            targetGodIds: [t1.card.id, t2.card.id],
            deferCustomEffect: true,
        });
        expect(playResult.success).toBe(true);
        // Différé : aucun dégât ne doit encore avoir été appliqué
        expect(t1.currentHealth).toBe(h1);
        expect(t2.currentHealth).toBe(h2);

        const resolveResult = engine.resolveDeferredEffect('persephone_generator_2', {
            optionalChoice: false,
            targetGodIds: [t1.card.id, t2.card.id],
        });
        expect(resolveResult.success).toBe(true);

        expect(h1 - t1.currentHealth).toBe(1);
        expect(h2 - t2.currentHealth).toBe(1);
    });

    it('inflige exactement 2 dégâts par cible et défausse 2 cartes quand le bonus est accepté', () => {
        const engine = new GameEngine(createTestGameState(['persephone', 'zeus', 'hestia'], ['hades', 'ares', 'athena']));
        engine.getCurrentPlayer().energy = 10;
        addCardToHand(engine, 'persephone_generator_2');

        const enemies = engine.getOpponent().gods;
        const [t1, t2] = enemies;
        const h1 = t1.currentHealth;
        const h2 = t2.currentHealth;
        const deckSizeBefore = engine.getCurrentPlayer().deck.length;

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'persephone_generator_2',
            targetGodIds: [t1.card.id, t2.card.id],
            deferCustomEffect: true,
        });
        engine.resolveDeferredEffect('persephone_generator_2', {
            optionalChoice: true,
            targetGodIds: [t1.card.id, t2.card.id],
        });

        expect(h1 - t1.currentHealth).toBe(2);
        expect(h2 - t2.currentHealth).toBe(2);
        expect(engine.getCurrentPlayer().deck.length).toBe(deckSizeBefore - 2);
    });

    it('en mode auto (IA, sans deferCustomEffect) inflige le dégât de base une seule fois', () => {
        const engine = new GameEngine(createTestGameState(['persephone', 'zeus', 'hestia'], ['hades', 'ares', 'athena']));
        engine.getCurrentPlayer().energy = 10;
        addCardToHand(engine, 'persephone_generator_2');

        const enemies = engine.getOpponent().gods;
        const [t1, t2] = enemies;
        const h1 = t1.currentHealth;
        const h2 = t2.currentHealth;

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'persephone_generator_2',
            targetGodIds: [t1.card.id, t2.card.id],
        });

        expect(h1 - t1.currentHealth).toBe(1);
        expect(h2 - t2.currentHealth).toBe(1);
    });
});

describe('Perséphone - Brûlure Rémanente (temp_resurrect)', () => {
    it('ressuscite le dieu choisi par le joueur, pas systématiquement le premier mort trouvé', () => {
        const engine = new GameEngine(createTestGameState(['persephone', 'zeus', 'hestia'], ['hades', 'ares', 'athena']));
        engine.getCurrentPlayer().energy = 10;
        addCardToHand(engine, 'persephone_skill_2');

        const player = engine.getCurrentPlayer();
        const [, zeus, hestia] = player.gods; // zeus = premier mort, hestia = choix du joueur
        zeus.isDead = true;
        zeus.currentHealth = 0;
        hestia.isDead = true;
        hestia.currentHealth = 0;

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'persephone_skill_2',
            deferCustomEffect: true,
        });

        // Différé : personne ne doit encore être ressuscité
        expect(zeus.isDead).toBe(true);
        expect(hestia.isDead).toBe(true);

        engine.resolveDeferredEffect('persephone_skill_2', { targetGodId: hestia.card.id });

        expect(hestia.isDead).toBe(false);
        expect(hestia.isZombie).toBe(true);
        expect(hestia.currentHealth).toBe(5);
        // Le dieu NON choisi doit rester mort (pas de résurrection en double)
        expect(zeus.isDead).toBe(true);
    });
});

describe('Séléné - Marée Basse (cascade_heal_choice)', () => {
    function setup() {
        const engine = new GameEngine(createTestGameState(['selene', 'zeus', 'hestia'], ['hades', 'ares', 'athena']));
        engine.getCurrentPlayer().energy = 10;
        addCardToHand(engine, 'selene_skill_2');
        const [selene, zeus, hestia] = engine.getCurrentPlayer().gods;
        selene.currentHealth = 1;
        zeus.currentHealth = 1;
        hestia.currentHealth = 1;
        return { engine, selene, zeus, hestia };
    }

    it('flux Ouest (choix accepté) soigne 3/2/1 dans l\'ordre des alliés', () => {
        const { engine, selene, zeus, hestia } = setup();
        engine.executeAction({
            type: 'play_card', playerId: 'player1', cardId: 'selene_skill_2', deferCustomEffect: true,
        });
        engine.resolveDeferredEffect('selene_skill_2', { optionalChoice: true });

        expect(selene.currentHealth).toBe(1 + 3);
        expect(zeus.currentHealth).toBe(1 + 2);
        expect(hestia.currentHealth).toBe(1 + 1);
    });

    it('flux Est (choix refusé) soigne 1/2/3 dans l\'ordre des alliés (inversé)', () => {
        const { engine, selene, zeus, hestia } = setup();
        engine.executeAction({
            type: 'play_card', playerId: 'player1', cardId: 'selene_skill_2', deferCustomEffect: true,
        });
        engine.resolveDeferredEffect('selene_skill_2', { optionalChoice: false });

        expect(selene.currentHealth).toBe(1 + 1);
        expect(zeus.currentHealth).toBe(1 + 2);
        expect(hestia.currentHealth).toBe(1 + 3);
    });

    it('soigne bien quand le sort est copié (cast_copied_spell) au lieu de ne rien faire', () => {
        // Reproduit le bug où "Marée Basse" copiée par Perséphone ne soignait personne :
        // neededTargets === 0 pour cascade_heal_choice, donc l'ancien code exécutait
        // cast_copied_spell sans jamais demander la direction, et l'effet n'était pas enregistré
        // dans GameEngine.ts (il retombait dans la branche "custom non implémenté").
        // Séléné doit être vivante dans l'équipe du joueur : castingGod (résolu depuis card.godId
        // de la carte copiée, ici 'selene') doit exister parmi les dieux du joueur pour que
        // playCard accepte de jouer la copie.
        const engine = new GameEngine(createTestGameState(['persephone', 'selene', 'hestia'], ['hades', 'ares', 'athena']));
        const player = engine.getCurrentPlayer();
        player.gods.forEach(g => { g.currentHealth = 1; });

        const mareeBasse = getSpellsByGodId('selene').find(s => s.id === 'selene_skill_2')!;
        player.discard.push({ ...mareeBasse, id: 'copied_maree_basse' });

        engine.executeAction({
            type: 'cast_copied_spell',
            playerId: 'player1',
            copiedCardId: 'copied_maree_basse',
            optionalChoice: true,
        });

        expect(player.gods[0].currentHealth).toBe(1 + 3);
        expect(player.gods[1].currentHealth).toBe(1 + 2);
        expect(player.gods[2].currentHealth).toBe(1 + 1);
    });
});

describe('Résurrection complète et deck (removedCards)', () => {
    it('les cartes d\'un dieu mort sont conservées dans removedCards (pas détruites)', () => {
        const engine = new GameEngine(createTestGameState(['demeter', 'zeus', 'hestia'], ['hades', 'ares', 'athena']));
        const player = engine.getCurrentPlayer();

        const countDemeterCards = () =>
            [...player.hand, ...player.deck, ...player.discard].filter(c => c.godId === 'demeter').length;

        const totalBefore = countDemeterCards();
        expect(totalBefore).toBeGreaterThan(0); // sanity check sur les données de test

        engine.killGod('player1', 'demeter');

        expect(countDemeterCards()).toBe(0);
        expect(player.removedCards.filter(c => c.godId === 'demeter').length).toBe(totalBefore);
    });

    it('Graine de vie (revive_god) rend au deck les cartes du dieu ressuscité et mélange', () => {
        const engine = new GameEngine(createTestGameState(['demeter', 'zeus', 'hestia'], ['hades', 'ares', 'athena']));
        engine.getCurrentPlayer().energy = 10;
        addCardToHand(engine, 'demeter_skill_2');

        const player = engine.getCurrentPlayer();
        const zeus = player.gods.find(g => g.card.id === 'zeus')!;
        engine.killGod('player1', 'zeus');
        expect(zeus.isDead).toBe(true);
        expect(player.removedCards.some(c => c.godId === 'zeus')).toBe(true);

        engine.executeAction({
            type: 'play_card',
            playerId: 'player1',
            cardId: 'demeter_skill_2',
            targetGodId: 'zeus',
        });

        expect(zeus.isDead).toBe(false);
        expect(zeus.currentHealth).toBe(8);
        expect(player.removedCards.some(c => c.godId === 'zeus')).toBe(false);
        expect(player.deck.some(c => c.godId === 'zeus')).toBe(true);
    });
});

describe('Déméter - Fertilisation (distribute_heal_5)', () => {
    it('respecte la distribution manuelle du joueur (pas de répartition auto écrasée)', () => {
        const engine = new GameEngine(createTestGameState(['demeter', 'zeus', 'hestia'], ['hades', 'ares', 'athena']));
        engine.getCurrentPlayer().energy = 10;
        addCardToHand(engine, 'demeter_skill_1');

        const [demeter, zeus, hestia] = engine.getCurrentPlayer().gods;
        demeter.currentHealth = 1;
        zeus.currentHealth = 1;
        hestia.currentHealth = 1;

        engine.executeAction({
            type: 'play_card', playerId: 'player1', cardId: 'demeter_skill_1', deferCustomEffect: true,
        });

        // Différé : aucun soin encore appliqué
        expect(demeter.currentHealth).toBe(1);

        engine.resolveDeferredEffect('demeter_skill_1', {
            healDistribution: [
                { godId: demeter.card.id, amount: 5 },
                { godId: zeus.card.id, amount: 0 },
                { godId: hestia.card.id, amount: 0 },
            ],
        });

        expect(demeter.currentHealth).toBe(6);
        expect(zeus.currentHealth).toBe(1);
        expect(hestia.currentHealth).toBe(1);
    });
});

describe('Zéphyr - Bourrasque Chanceuse (free_recycle)', () => {
    it('recycle la défausse de l\'adversaire quand le joueur choisit "adversaire", pas la sienne', () => {
        const engine = new GameEngine(createTestGameState(['zephyr', 'zeus', 'hestia'], ['hades', 'ares', 'athena']));
        engine.getCurrentPlayer().energy = 10;
        addCardToHand(engine, 'zephyr_utility_1');

        const player = engine.getCurrentPlayer();
        const opponent = engine.getOpponent();
        player.discard.push({ ...player.deck[0] });
        opponent.discard.push({ ...opponent.deck[0] });
        const playerDiscardBefore = player.discard.length;
        const opponentDiscardBefore = opponent.discard.length;

        engine.executeAction({
            type: 'play_card', playerId: 'player1', cardId: 'zephyr_utility_1', deferCustomEffect: true,
        });

        // Différé : aucune défausse ne doit encore avoir été recyclée
        expect(player.discard.length).toBe(playerDiscardBefore + 1); // +1 = zephyr_utility_1 lui-même
        expect(opponent.discard.length).toBe(opponentDiscardBefore);

        engine.resolveDeferredEffect('zephyr_utility_1', { selectedPlayerTarget: 'opponent' });

        expect(opponent.discard.length).toBe(0);
        // La défausse du joueur (avec zephyr_utility_1 dedans) ne doit PAS avoir été touchée
        expect(player.discard.length).toBe(playerDiscardBefore + 1);
    });
});

describe('Zéphyr - Vent d\'Ouest (choose_discard_enemy)', () => {
    it('défausse uniquement la carte choisie par le joueur, pas une carte automatique en plus', () => {
        const engine = new GameEngine(createTestGameState(['zephyr', 'zeus', 'hestia'], ['hades', 'ares', 'athena']));
        engine.getCurrentPlayer().energy = 10;
        addCardToHand(engine, 'zephyr_generator_2');

        const opponent = engine.getOpponent();
        const handSizeBefore = opponent.hand.length;
        const chosenCard = opponent.hand[opponent.hand.length - 1]; // volontairement pas hand[0]

        engine.executeAction({
            type: 'play_card', playerId: 'player1', cardId: 'zephyr_generator_2', deferCustomEffect: true,
        });

        // Différé : aucune carte adverse défaussée pour l'instant
        expect(opponent.hand.length).toBe(handSizeBefore);

        engine.resolveDeferredEffect('zephyr_generator_2', { selectedCardIds: [chosenCard.id] });

        expect(opponent.hand.length).toBe(handSizeBefore - 1);
        expect(opponent.hand.some(c => c.id === chosenCard.id)).toBe(false);
    });
});

describe('Statut untargetable (Ruse d\'Ulysse)', () => {
    it('un dieu inciblable ne peut pas être choisi comme cible ennemie', () => {
        const engine = new GameEngine(createTestGameState(['poseidon', 'zeus', 'hestia'], ['ulysses', 'ares', 'athena']));
        const ulysses = engine.getOpponent().gods.find(g => g.card.id === 'ulysses')!;
        ulysses.statusEffects.push({ type: 'untargetable', stacks: 1, duration: 2 });

        const validTargets = engine.getValidTargets('enemy_god');
        expect(validTargets.some(g => g.card.id === 'ulysses')).toBe(false);

        engine.getCurrentPlayer().energy = 10;
        addCardToHand(engine, 'poseidon_generator_1');
        const initialHealth = ulysses.currentHealth;

        engine.executeAction({
            type: 'play_card', playerId: 'player1', cardId: 'poseidon_generator_1', targetGodId: 'ulysses',
        });

        // La résolution de cible doit échouer silencieusement : pas de dégâts appliqués
        expect(ulysses.currentHealth).toBe(initialHealth);
    });

    it('un dieu inciblable reste ciblable et soignable par son propre camp', () => {
        const engine = new GameEngine(createTestGameState(['ulysses', 'aphrodite', 'hestia'], ['ares', 'hades', 'athena']));
        const ulysses = engine.getCurrentPlayer().gods.find(g => g.card.id === 'ulysses')!;
        ulysses.statusEffects.push({ type: 'untargetable', stacks: 1, duration: 2 });
        ulysses.currentHealth = 1;

        // getValidTargets('ally_god') ne doit pas exclure les alliés inciblables (untargetable
        // ne protège que contre l'adversaire, pas contre les soins de son propre camp)
        expect(engine.getValidTargets('ally_god').some(g => g.card.id === 'ulysses')).toBe(true);

        engine.getCurrentPlayer().energy = 10;
        addCardToHand(engine, 'aphrodite_skill_1'); // heal: 3, target: ally_god

        engine.executeAction({
            type: 'play_card', playerId: 'player1', cardId: 'aphrodite_skill_1', targetGodId: 'ulysses',
        });

        expect(ulysses.currentHealth).toBe(4);
    });
});

describe('Journal de combat', () => {
    it('enregistre une carte jouée avec le bon joueur, tour et nom de carte', () => {
        const engine = new GameEngine(createTestGameState());
        engine.getCurrentPlayer().energy = 10;
        addCardToHand(engine, 'poseidon_generator_1');
        const enemy = getEnemyGod(engine);

        engine.executeAction({
            type: 'play_card', playerId: 'player1', cardId: 'poseidon_generator_1', targetGodId: enemy.card.id,
        });

        const log = engine.getState().log;
        expect(log.length).toBe(1);
        expect(log[0].playerId).toBe('player1');
        expect(log[0].turnNumber).toBe(1);
        expect(log[0].message).toContain('Trident de Poséidon');
    });

    it('enregistre une carte défaussée pour énergie', () => {
        const engine = new GameEngine(createTestGameState());
        const cardToDiscard = engine.getCurrentPlayer().hand[0];

        engine.executeAction({ type: 'discard_for_energy', playerId: 'player1', cardId: cardToDiscard.id });

        const log = engine.getState().log;
        expect(log.length).toBe(1);
        expect(log[0].message).toContain(cardToDiscard.name);
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
