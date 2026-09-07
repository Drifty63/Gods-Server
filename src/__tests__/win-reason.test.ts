import { describe, it, expect } from 'vitest';
import { GameEngine } from '@/game-engine/GameEngine';
import { handleGodDeath } from '@/game-engine/DamageSystem';
import { getGodById } from '@/data/gods';
import { createDeck } from '@/data/spells';
import type { GameState, PlayerState } from '@/types/cards';

/**
 * Régression : `winReason` n'était jamais renseigné.
 *
 * Le champ existe dans GameState depuis l'origine et les règles officielles (gameRules.ts,
 * WIN_CONDITIONS) énumèrent ses quatre issues — mais AUCUN code ne l'assignait. L'écran de fin
 * ne pouvait donc pas distinguer une élimination d'une victoire aux points, et annonçait même
 * « DÉFAITE » aux deux joueurs en cas de match nul (winnerId absent).
 */

function setup(options?: { maxTurns?: number }) {
    const engine = new GameEngine(GameEngine.createInitialState(
        'player1', 'Vous', [getGodById('zeus')!], createDeck(['zeus']),
        'player2', 'IA', [getGodById('ares')!], createDeck(['ares']),
        'player1',
        options?.maxTurns ? { isOnlineGame: true, maxTurns: options.maxTurns } : undefined,
    ));
    return { engine, state: engine.getState() };
}

function killAll(player: PlayerState, state: GameState) {
    for (const god of player.gods) handleGodDeath(player, god, state);
}

describe('winReason', () => {
    it("vaut 'elimination' quand toute une équipe tombe", () => {
        const { state } = setup();

        killAll(state.players[1], state);

        expect(state.status).toBe('finished');
        expect(state.winnerId).toBe('player1');
        expect(state.winReason).toBe('elimination');
    });

    it("vaut 'turn_limit' quand la limite de tours départage aux PV", () => {
        const { engine, state } = setup({ maxTurns: 1 });

        // Le joueur 2 est plus bas en PV : il doit perdre aux points, pas par élimination.
        state.players[1].gods[0].currentHealth = 3;

        // Deux fins de tour : la seconde ramène la main au joueur 1 et incrémente le compteur
        // au-delà de maxTurns, ce qui déclenche la résolution aux PV.
        engine.executeAction({ type: 'end_turn', playerId: 'player1' });
        engine.executeAction({ type: 'end_turn', playerId: 'player2' });

        expect(state.status).toBe('finished');
        expect(state.winnerId).toBe('player1');
        expect(state.winReason).toBe('turn_limit');
    });

    it("vaut 'draw' quand la limite de tours arrive à PV égaux", () => {
        const { engine, state } = setup({ maxTurns: 1 });

        // Égalité stricte : aucun vainqueur ne doit être désigné.
        state.players[0].gods[0].currentHealth = 10;
        state.players[1].gods[0].currentHealth = 10;

        engine.executeAction({ type: 'end_turn', playerId: 'player1' });
        engine.executeAction({ type: 'end_turn', playerId: 'player2' });

        expect(state.status).toBe('finished');
        expect(state.winnerId).toBeUndefined();
        expect(state.winReason).toBe('draw');
    });

    it("reste absent tant que la partie est en cours", () => {
        const { state } = setup();
        expect(state.status).toBe('playing');
        expect(state.winReason).toBeUndefined();
    });
});
