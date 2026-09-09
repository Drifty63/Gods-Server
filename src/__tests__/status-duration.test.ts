import { describe, it, expect } from 'vitest';
import { GameEngine } from '@/game-engine/GameEngine';
import { getGodById } from '@/data/gods';
import { createDeck, ALL_SPELLS } from '@/data/spells';
import type { GodState } from '@/types/cards';

/**
 * Durée des effets de statut.
 *
 * Les durées ne sont décrémentées qu'à la fin du tour du camp qui PORTE le statut
 * (`GameEngine.endTurn` → `tickStatusEffects(previousPlayer)`). Un sort lancé sur soi était donc
 * décrémenté quelques instants après sa pose, avant que l'adversaire ait pu jouer : une carte
 * annonçant « 2 tours » n'en donnait qu'un, et une carte annonçant « 1 tour » ne faisait rien.
 *
 * Ces tests fixent les DEUX côtés : les statuts défensifs récupèrent leur durée annoncée, et les
 * statuts offensifs — qui, eux, étaient déjà justes — ne doivent surtout pas gagner un tour.
 */

function makeGame(p1: string[], p2: string[]) {
    return new GameEngine(GameEngine.createInitialState(
        'player1', 'Vous', p1.map(g => getGodById(g)!), createDeck(p1),
        'player2', 'Adversaire', p2.map(g => getGodById(g)!), createDeck(p2),
        'player1',
    ));
}

/** Met la carte en main et donne de quoi la payer : on teste la durée, pas l'économie. */
function arm(engine: GameEngine, playerIndex: 0 | 1, cardId: string) {
    const player = engine.getState().players[playerIndex];
    const card = ALL_SPELLS.find(c => c.id === cardId);
    if (!card) throw new Error(`Carte introuvable : ${cardId}`);
    player.hand.push({ ...card });
    player.energy = 10;
}

const statusOf = (god: GodState, type: string) => god.statusEffects.find(s => s.type === type);

describe('statuts défensifs (posés sur son propre camp)', () => {
    it("ne consomme rien le tour même de la pose", () => {
        const engine = makeGame(['ulysses', 'hestia'], ['ares']);
        arm(engine, 0, 'ulysses_utility_1');
        engine.executeAction({ type: 'play_card', playerId: 'player1', cardId: 'ulysses_utility_1' });

        const ulysses = engine.getState().players[0].gods[0];
        expect(statusOf(ulysses, 'untargetable')?.duration).toBe(2);

        engine.executeAction({ type: 'end_turn', playerId: 'player1' });

        expect(statusOf(ulysses, 'untargetable')?.duration).toBe(2);
        // Et l'adversaire ne peut effectivement pas le viser pendant ce tour-là.
        expect(engine.getValidTargets('enemy_god').map(g => g.card.id)).not.toContain('ulysses');
    });

    it("protège Ulysse pendant les 2 tours adverses annoncés, puis expire", () => {
        const engine = makeGame(['ulysses', 'hestia'], ['ares']);
        arm(engine, 0, 'ulysses_utility_1');
        engine.executeAction({ type: 'play_card', playerId: 'player1', cardId: 'ulysses_utility_1' });
        const ulysses = engine.getState().players[0].gods[0];

        // 1er tour adverse
        engine.executeAction({ type: 'end_turn', playerId: 'player1' });
        expect(engine.getValidTargets('enemy_god').map(g => g.card.id)).not.toContain('ulysses');

        // 2e tour adverse
        engine.executeAction({ type: 'end_turn', playerId: 'player2' });
        engine.executeAction({ type: 'end_turn', playerId: 'player1' });
        expect(engine.getValidTargets('enemy_god').map(g => g.card.id)).not.toContain('ulysses');

        // 3e tour adverse : la ruse est retombée.
        engine.executeAction({ type: 'end_turn', playerId: 'player2' });
        engine.executeAction({ type: 'end_turn', playerId: 'player1' });
        expect(statusOf(ulysses, 'untargetable')).toBeUndefined();
        expect(engine.getValidTargets('enemy_god').map(g => g.card.id)).toContain('ulysses');
    });

    it("rend opérante une durée de 1, qui ne faisait auparavant rien du tout", () => {
        const engine = makeGame(['ulysses', 'hestia'], ['ares']);
        arm(engine, 0, 'ulysses_skill_2');
        engine.executeAction({ type: 'play_card', playerId: 'player1', cardId: 'ulysses_skill_2' });

        engine.executeAction({ type: 'end_turn', playerId: 'player1' });

        expect(engine.getState().currentPlayerId).toBe('player2');
        expect(engine.getValidTargets('enemy_god').map(g => g.card.id)).not.toContain('ulysses');
    });

    it("garde la provocation d'Athéna active pendant le tour adverse", () => {
        const engine = makeGame(['athena', 'hestia'], ['ares']);
        arm(engine, 0, 'athena_generator_2');
        engine.executeAction({ type: 'play_card', playerId: 'player1', cardId: 'athena_generator_2' });

        const athena = engine.getState().players[0].gods[0];
        expect(statusOf(athena, 'provocation')?.duration).toBe(1);

        engine.executeAction({ type: 'end_turn', playerId: 'player1' });

        expect(statusOf(athena, 'provocation')?.duration).toBe(1);
        // La provocation force le ciblage : Athéna est la seule cible offerte à l'adversaire.
        expect(engine.getValidTargets('enemy_god').map(g => g.card.id)).toEqual(['athena']);
    });
});

describe('statuts offensifs (posés sur le camp adverse) — non-régression', () => {
    it("laisse le stun d'Aphrodite à exactement 2 tours, sans en gagner un", () => {
        const engine = makeGame(['aphrodite', 'hestia'], ['ares', 'zeus']);
        arm(engine, 0, 'aphrodite_skill_2');
        engine.executeAction({
            type: 'play_card', playerId: 'player1',
            cardId: 'aphrodite_skill_2', targetGodId: 'ares',
        });

        const ares = engine.getState().players[1].gods[0];
        expect(statusOf(ares, 'stun')?.duration).toBe(2);

        // Le stun a été posé pendant le tour de player1 : le tick de fin de tour de player2
        // doit bel et bien le décrémenter, sinon le correctif défensif offrirait un tour gratuit.
        engine.executeAction({ type: 'end_turn', playerId: 'player1' });
        expect(statusOf(ares, 'stun')?.duration).toBe(2);
        engine.executeAction({ type: 'end_turn', playerId: 'player2' });
        expect(statusOf(ares, 'stun')?.duration).toBe(1);

        engine.executeAction({ type: 'end_turn', playerId: 'player1' });
        engine.executeAction({ type: 'end_turn', playerId: 'player2' });
        expect(statusOf(ares, 'stun')).toBeUndefined();
    });
});

describe('immunité à la faiblesse (Hestia)', () => {
    it('supprime le doublement des dégâts, au lieu de rester décorative', () => {
        // Ulysse est Eau, donc faible à la Foudre : sans immunité, 3 dégâts en valent 6.
        const engine = makeGame(['hestia', 'ulysses'], ['zeus']);
        arm(engine, 0, 'hestia_skill_2');
        engine.executeAction({ type: 'play_card', playerId: 'player1', cardId: 'hestia_skill_2' });

        const ulysses = engine.getState().players[0].gods[1];
        expect(statusOf(ulysses, 'weakness_immunity')).toBeDefined();

        const before = ulysses.currentHealth;
        engine.executeAction({ type: 'end_turn', playerId: 'player1' });
        arm(engine, 1, 'zeus_generator_1');
        engine.executeAction({
            type: 'play_card', playerId: 'player2',
            cardId: 'zeus_generator_1', targetGodId: 'ulysses',
        });

        expect(before - ulysses.currentHealth).toBe(3);
    });
});
