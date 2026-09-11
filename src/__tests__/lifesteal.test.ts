import { describe, it, expect } from 'vitest';
import { GameEngine } from '@/game-engine/GameEngine';
import { getGodById } from '@/data/gods';
import { createDeck, ALL_SPELLS } from '@/data/spells';

/**
 * Vol de vie (« Syphon d'âme », Hadès).
 *
 * L'effet recalculait les dégâts dans son coin au lieu de regarder ce que la cible avait
 * réellement perdu. Il ignorait donc le bouclier : un coup intégralement absorbé par une armure
 * soignait quand même son lanceur à plein, alors que personne n'avait été blessé.
 */

function makeGame() {
    return new GameEngine(GameEngine.createInitialState(
        'player1', 'Vous', [getGodById('hades')!, getGodById('hestia')!], createDeck(['hades', 'hestia']),
        'player2', 'Adversaire', [getGodById('ares')!], createDeck(['ares']),
        'player1',
    ));
}

function arm(engine: GameEngine, cardId: string) {
    const player = engine.getState().players[0];
    const card = ALL_SPELLS.find(c => c.id === cardId);
    if (!card) throw new Error(`Carte introuvable : ${cardId}`);
    player.hand.push({ ...card });
    player.energy = 10;
}

describe("Syphon d'âme", () => {
    it('soigne le lanceur des points de vie réellement perdus par la cible', () => {
        const engine = makeGame();
        const state = engine.getState();
        const hades = state.players[0].gods[0];
        const ares = state.players[1].gods[0];

        hades.currentHealth = 5;
        const aresBefore = ares.currentHealth;

        arm(engine, 'hades_skill_2');
        engine.executeAction({
            type: 'play_card', playerId: 'player1',
            cardId: 'hades_skill_2', targetGodId: 'ares',
        });

        const healthLost = aresBefore - ares.currentHealth;
        expect(healthLost).toBeGreaterThan(0);
        expect(hades.currentHealth).toBe(5 + healthLost);
    });

    it("ne soigne RIEN quand le bouclier absorbe tout le coup", () => {
        const engine = makeGame();
        const state = engine.getState();
        const hades = state.players[0].gods[0];
        const ares = state.players[1].gods[0];

        hades.currentHealth = 5;
        // Bouclier largement supérieur au coup : la cible ne perdra aucun point de vie.
        ares.statusEffects.push({ type: 'shield', stacks: 50 });
        const aresBefore = ares.currentHealth;

        arm(engine, 'hades_skill_2');
        engine.executeAction({
            type: 'play_card', playerId: 'player1',
            cardId: 'hades_skill_2', targetGodId: 'ares',
        });

        expect(ares.currentHealth).toBe(aresBefore);
        expect(hades.currentHealth).toBe(5);
    });

    it('ne dépasse jamais les points de vie maximum du lanceur', () => {
        const engine = makeGame();
        const state = engine.getState();
        const hades = state.players[0].gods[0];

        arm(engine, 'hades_skill_2');
        engine.executeAction({
            type: 'play_card', playerId: 'player1',
            cardId: 'hades_skill_2', targetGodId: 'ares',
        });

        expect(hades.currentHealth).toBeLessThanOrEqual(hades.card.maxHealth);
    });
});
