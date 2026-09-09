import { describe, it, expect } from 'vitest';
import { GameEngine } from '@/game-engine/GameEngine';
import { getGodById } from '@/data/gods';
import { createDeck } from '@/data/spells';
import { GAME_CONFIG } from '@/data/gameRules';
import { generateAscensionRun, enemyPools, TOTAL_FLOORS } from '@/data/ascension';

/**
 * Déroulement du tour : chrono des modes compétitifs, limite de tours, et paliers d'Ascension.
 */

function onlineGame() {
    return new GameEngine(GameEngine.createInitialState(
        'player1', 'Vous', [getGodById('zeus')!], createDeck(['zeus']),
        'player2', 'Adversaire', [getGodById('ares')!], createDeck(['ares']),
        'player1',
        { isOnlineGame: true },
    ));
}

describe('chrono de tour (modes compétitifs)', () => {
    it('passe la main sans conclure au premier dépassement', () => {
        const engine = onlineGame();
        const state = engine.getState();

        engine.executeAction({ type: 'timeout_turn', playerId: 'player1' });

        expect(state.players[0].afkTurns).toBe(1);
        expect(state.status).toBe('playing');
        expect(state.currentPlayerId).toBe('player2');
    });

    it('fait perdre la partie au troisième dépassement consécutif', () => {
        const engine = onlineGame();
        const state = engine.getState();

        // Trois dépassements du joueur 1, entrecoupés des fins de tour de son adversaire.
        for (let i = 0; i < GAME_CONFIG.MAX_TURN_TIMEOUTS; i++) {
            engine.executeAction({ type: 'timeout_turn', playerId: 'player1' });
            if (state.status !== 'playing') break;
            engine.executeAction({ type: 'end_turn', playerId: 'player2' });
        }

        expect(state.status).toBe('finished');
        expect(state.winnerId).toBe('player2');
        expect(state.winReason).toBe('timeout');
    });

    it('remet le compteur à zéro dès que le joueur joue une carte', () => {
        const engine = onlineGame();
        const state = engine.getState();

        engine.executeAction({ type: 'timeout_turn', playerId: 'player1' });
        expect(state.players[0].afkTurns).toBe(1);

        engine.executeAction({ type: 'end_turn', playerId: 'player2' });

        // Un générateur de Zeus, gratuit : le seul but est de prouver que jouer réinitialise.
        const card = state.players[0].hand.find(c => c.energyCost === 0)!;
        const target = state.players[1].gods[0].card.id;
        engine.executeAction({ type: 'play_card', playerId: 'player1', cardId: card.id, targetGodId: target });

        expect(state.players[0].afkTurns).toBe(0);
    });

    it('remet aussi le compteur à zéro après une simple défausse', () => {
        const engine = onlineGame();
        const state = engine.getState();

        engine.executeAction({ type: 'timeout_turn', playerId: 'player1' });
        engine.executeAction({ type: 'end_turn', playerId: 'player2' });

        // Défausser POUR de l'énergie reste une action : le joueur est bien présent.
        engine.executeAction({
            type: 'discard_for_energy', playerId: 'player1', cardId: state.players[0].hand[0].id,
        });

        expect(state.players[0].afkTurns).toBe(0);
    });

    it("n'a aucun effet une fois la partie terminée", () => {
        const engine = onlineGame();
        const state = engine.getState();
        state.status = 'finished';

        const result = engine.executeAction({ type: 'timeout_turn', playerId: 'player1' });
        expect(result.success).toBe(false);
    });
});

describe('limite de tours', () => {
    it("est celle des règles officielles, et non une valeur codée en dur ailleurs", () => {
        const engine = onlineGame();
        expect(engine.getState().maxTurns).toBe(GAME_CONFIG.MAX_TURNS);
    });

    it("ne s'applique pas hors des modes compétitifs", () => {
        const solo = new GameEngine(GameEngine.createInitialState(
            'player1', 'Vous', [getGodById('zeus')!], createDeck(['zeus']),
            'player2', 'IA', [getGodById('ares')!], createDeck(['ares']),
            'player1',
        ));
        expect(solo.getState().maxTurns).toBeUndefined();
    });
});

describe('paliers de l\'Ascension', () => {
    /** Ce que l'écran d'accueil du mode promet au joueur. */
    const EXPECTED = [
        ...Array(5).fill('servant'),
        ...Array(7).fill('creature'),
        ...Array(3).fill('god'),
    ];

    it('respecte la progression annoncée : serviteurs, puis créatures, puis dieux', () => {
        const run = generateAscensionRun(2026);
        expect(run).toHaveLength(TOTAL_FLOORS);
        expect(run.map(f => f.tier)).toEqual(EXPECTED);
    });

    it("n'oppose jamais deux familles dans le même étage", () => {
        const pools = enemyPools();
        const familyOf = (id: string) => {
            if (pools.servant.some(u => u.id === id)) return 'servant';
            if (pools.creature.some(u => u.id === id)) return 'creature';
            return 'god';
        };

        // Plusieurs graines : la composition est tirée au hasard, un seul run ne prouverait rien.
        for (let seed = 0; seed < 50; seed++) {
            for (const floor of generateAscensionRun(seed)) {
                const families = new Set(floor.enemyIds.map(familyOf));
                expect(families.size, `étage ${floor.floor} (graine ${seed}) mélange ${[...families]}`).toBe(1);
                expect([...families][0]).toBe(floor.tier);
            }
        }
    });

    it("n'aligne jamais deux fois le même adversaire dans un étage", () => {
        // Des ids en double casseraient le ciblage, qui identifie les dieux par leur id.
        for (let seed = 0; seed < 50; seed++) {
            for (const floor of generateAscensionRun(seed)) {
                expect(new Set(floor.enemyIds).size).toBe(floor.enemyIds.length);
            }
        }
    });

    it('dispose d\'assez d\'unités validées pour remplir chaque étage', () => {
        const pools = enemyPools();
        expect(pools.servant.length).toBeGreaterThanOrEqual(4);
        expect(pools.creature.length).toBeGreaterThanOrEqual(4);
        expect(pools.god.length).toBeGreaterThanOrEqual(4);
    });
});
