import { describe, it, expect } from 'vitest';
import { GameEngine } from '@/game-engine/GameEngine';
import { getGodById } from '@/data/gods';
import { createDeck, ALL_SPELLS } from '@/data/spells';

/**
 * Matchs miroir : le même `GodCard.id` dans les deux équipes.
 *
 * Ils existaient déjà en ligne (chaque joueur choisit son équipe sans voir celle de l'autre) et
 * en Ascension aux étages 13-15, mais l'écran d'Entraînement les interdisait. Le protocole
 * d'action ne transporte qu'un id de dieu, jamais le camp : tout consommateur qui cherche « dans
 * les deux camps » rend cet id ambigu. Ces tests verrouillent les endroits où ça comptait.
 */

function mirrorGame(godIds: string[]) {
    return new GameEngine(GameEngine.createInitialState(
        'player1', 'Vous', godIds.map(g => getGodById(g)!), createDeck(godIds),
        'player2', 'Adversaire', godIds.map(g => getGodById(g)!), createDeck(godIds),
        'player1',
    ));
}

function arm(engine: GameEngine, playerIndex: 0 | 1, cardId: string) {
    const player = engine.getState().players[playerIndex];
    const card = ALL_SPELLS.find(c => c.id === cardId);
    if (!card) throw new Error(`Carte introuvable : ${cardId}`);
    player.hand.push({ ...card });
    player.energy = 10;
}

describe('match miroir — isolation des camps', () => {
    it("n'inflige les dégâts qu'au dieu du camp visé", () => {
        const engine = mirrorGame(['zeus', 'hestia']);
        const state = engine.getState();
        const mine = state.players[0].gods[0];
        const theirs = state.players[1].gods[0];

        arm(engine, 0, 'zeus_generator_1');
        engine.executeAction({
            type: 'play_card', playerId: 'player1',
            cardId: 'zeus_generator_1', targetGodId: 'zeus',
        });

        expect(theirs.currentHealth).toBeLessThan(theirs.card.maxHealth);
        expect(mine.currentHealth).toBe(mine.card.maxHealth);
    });

    it('ne soigne que le dieu du camp qui lance le sort', () => {
        const engine = mirrorGame(['demeter', 'hestia']);
        const state = engine.getState();
        const mine = state.players[0].gods[0];
        const theirs = state.players[1].gods[0];
        mine.currentHealth = 10;
        theirs.currentHealth = 10;

        arm(engine, 0, 'demeter_utility_1');
        engine.executeAction({
            type: 'play_card', playerId: 'player1',
            cardId: 'demeter_utility_1', targetGodId: 'demeter',
        });

        // `any_god` privilégie votre propre copie : un soin, donc au pire un bonus.
        expect(mine.currentHealth).toBeGreaterThan(10);
        expect(theirs.currentHealth).toBe(10);
    });

    it('ne tue que le dieu du camp visé, et laisse le vôtre intact', () => {
        const engine = mirrorGame(['ares', 'hestia']);
        const state = engine.getState();
        const mine = state.players[0].gods[0];
        const theirs = state.players[1].gods[0];
        theirs.currentHealth = 1;

        arm(engine, 0, 'ares_generator_1');
        engine.executeAction({
            type: 'play_card', playerId: 'player1',
            cardId: 'ares_generator_1', targetGodId: 'ares',
        });

        expect(theirs.isDead).toBe(true);
        expect(mine.isDead).toBe(false);
        expect(state.status).toBe('playing');
    });

    it("renvoie les cartes de l'ENNEMI dans son deck, jamais les vôtres", () => {
        // Le lanceur DOIT être players[0] : c'est ce que l'ancien `find` sur state.players
        // renvoyait toujours, donc c'est la seule disposition où le bug se voit.
        const engine = mirrorGame(['zephyr', 'hestia']);
        const state = engine.getState();
        const caster = state.players[0];
        const victim = state.players[1];

        const zephyrCard = ALL_SPELLS.find(c => c.godId === 'zephyr')!;
        caster.hand.push({ ...zephyrCard }, { ...zephyrCard });
        victim.hand.push({ ...zephyrCard }, { ...zephyrCard });
        const casterZephyrCards = caster.hand.filter(c => c.godId === 'zephyr').length;

        arm(engine, 0, 'zephyr_skill_1');
        engine.executeAction({
            type: 'play_card', playerId: 'player1',
            cardId: 'zephyr_skill_1', targetGodId: 'zephyr',
        });

        // La victime est bien l'adversaire du lanceur.
        expect(victim.hand.filter(c => c.godId === 'zephyr')).toHaveLength(0);
        // Le lanceur garde sa main (moins la carte jouée, qui part à la défausse).
        expect(caster.hand.filter(c => c.godId === 'zephyr').length)
            .toBeGreaterThanOrEqual(casterZephyrCards - 1);
    });

    it('garde des cibles distinctes pour un même id de dieu selon le camp', () => {
        const engine = mirrorGame(['zeus', 'hestia']);
        const state = engine.getState();

        const enemies = engine.getValidTargets('enemy_god');
        const allies = engine.getValidTargets('ally_god');

        expect(enemies.every(g => state.players[1].gods.includes(g))).toBe(true);
        expect(allies.every(g => state.players[0].gods.includes(g))).toBe(true);
        // Même id des deux côtés, mais bien deux objets d'état différents.
        expect(enemies[0]).not.toBe(allies[0]);
        expect(enemies[0].card.id).toBe(allies[0].card.id);
    });
});
