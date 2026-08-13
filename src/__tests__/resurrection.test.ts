import { describe, it, expect } from 'vitest';
import { GameEngine } from '@/game-engine/GameEngine';
import { handleGodDeath } from '@/game-engine/DamageSystem';
import { getGodById } from '@/data/gods';
import { createDeck, ALL_SPELLS } from '@/data/spells';
import type { GameState, PlayerState } from '@/types/cards';

/**
 * Régression : les sorts de résurrection étaient sans effet.
 *
 * `revive_god` cible un dieu mort choisi par le joueur, mais n'était pas déclaré dans
 * DEFERRED_CUSTOM_EFFECTS : il s'exécutait dès la pose de la carte, alors que le choix
 * n'était pas encore connu. Le handler sortait donc immédiatement sur `!ctx.targetGodId`,
 * et la carte partait à la défausse en ayant coûté 3 énergie pour rien.
 *
 * Un effet de ce genre n'est correct que si les TROIS maillons sont en place : présence dans
 * DEFERRED_CUSTOM_EFFECTS, ouverture de la modale par le store, puis resolveDeferredEffect().
 */

const REVIVE_CARD = 'demeter_skill_2';
const RESURRECT_TWO_CARD = 'selene_utility_1';

/**
 * Partie avec le lanceur en premier dieu, suivi d'alliés qu'on peut tuer, la carte testée en main.
 *
 * On travaille sur `engine.getState()` et non sur l'état passé au constructeur : celui-ci en fait
 * une copie profonde, donc muter l'original ne toucherait pas le moteur.
 */
function setup(cardId: string, casterId: string, ...allyIds: string[]) {
    const spell = ALL_SPELLS.find(s => s.id === cardId);
    if (!spell) throw new Error(`Sort introuvable : ${cardId}`);

    const godIds = [casterId, ...allyIds];
    const engine = new GameEngine(GameEngine.createInitialState(
        'player1', 'Vous', godIds.map(id => getGodById(id)!), createDeck(godIds),
        'player2', 'IA', [getGodById('ares')!], createDeck(['ares']),
        'player1',
    ));

    const state = engine.getState();
    const player = state.players[0];

    // Main maîtrisée : uniquement la carte testée, et assez d'énergie pour la jouer.
    player.hand = [{ ...spell }];
    player.energy = 9;

    return { engine, state, player };
}

function killGod(player: PlayerState, state: GameState, godId: string) {
    const god = player.gods.find(g => g.card.id === godId)!;
    handleGodDeath(player, god, state);
    return god;
}

describe('revive_god (Déméter — Graine de vie)', () => {
    it('ressuscite le dieu choisi une fois le choix du joueur connu', () => {
        const { engine, state, player } = setup(REVIVE_CARD, 'demeter', 'zeus');
        const zeus = killGod(player, state, 'zeus');
        expect(zeus.isDead).toBe(true);

        // 1. Le joueur pose la carte : l'effet est différé, la cible n'est pas encore choisie.
        const played = engine.executeAction({
            type: 'play_card', playerId: 'player1', cardId: REVIVE_CARD, deferCustomEffect: true,
        });
        expect(played.success).toBe(true);
        expect(zeus.isDead, 'ne doit pas ressusciter avant le choix').toBe(true);

        // 2. Le joueur choisit son dieu dans la modale.
        engine.resolveDeferredEffect(REVIVE_CARD, { targetGodId: 'zeus' });

        expect(zeus.isDead).toBe(false);
        expect(zeus.currentHealth).toBe(8);
    });

    it('rend au deck les cartes du dieu ressuscité', () => {
        const { engine, state, player } = setup(REVIVE_CARD, 'demeter', 'zeus');
        killGod(player, state, 'zeus');
        // La mort met les cartes de côté dans removedCards, elle ne les détruit pas.
        expect(player.removedCards.some(c => c.godId === 'zeus')).toBe(true);

        engine.executeAction({
            type: 'play_card', playerId: 'player1', cardId: REVIVE_CARD, deferCustomEffect: true,
        });
        engine.resolveDeferredEffect(REVIVE_CARD, { targetGodId: 'zeus' });

        expect(player.removedCards.some(c => c.godId === 'zeus')).toBe(false);
        expect(player.deck.some(c => c.godId === 'zeus')).toBe(true);
    });

    it('fonctionne aussi pour l\'IA, qui joue sa cible sans passer par une modale', () => {
        const { engine, state, player } = setup(REVIVE_CARD, 'demeter', 'zeus');
        const zeus = killGod(player, state, 'zeus');

        // L'IA n'ouvre pas de modale : elle fournit sa cible et l'effet s'applique aussitôt.
        engine.executeAction({
            type: 'play_card', playerId: 'player1', cardId: REVIVE_CARD, targetGodId: 'zeus',
        });

        expect(zeus.isDead).toBe(false);
        expect(zeus.currentHealth).toBe(8);
    });

    it('ne ressuscite personne si le dieu visé est vivant', () => {
        const { engine, player } = setup(REVIVE_CARD, 'demeter', 'zeus');
        const zeus = player.gods.find(g => g.card.id === 'zeus')!;

        engine.executeAction({
            type: 'play_card', playerId: 'player1', cardId: REVIVE_CARD, targetGodId: 'zeus',
        });

        expect(zeus.currentHealth).toBe(zeus.card.maxHealth);
    });
});

describe('resurrect_two (Séléné — Renaissance Bénéfique)', () => {
    it('ressuscite jusqu\'à deux alliés morts à 3 PV', () => {
        // Séléné doit rester vivante : c'est elle qui lance le sort.
        const { engine, state, player } = setup(RESURRECT_TWO_CARD, 'selene', 'zeus', 'athena');
        const zeus = killGod(player, state, 'zeus');
        const athena = killGod(player, state, 'athena');

        // Aucune cible à choisir : l'effet prend les morts lui-même, donc pas de report.
        const played = engine.executeAction({ type: 'play_card', playerId: 'player1', cardId: RESURRECT_TWO_CARD });
        expect(played.success).toBe(true);

        expect(zeus.isDead).toBe(false);
        expect(zeus.currentHealth).toBe(3);
        expect(athena.isDead).toBe(false);
        expect(athena.currentHealth).toBe(3);
    });
});
