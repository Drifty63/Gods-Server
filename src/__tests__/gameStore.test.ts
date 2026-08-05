/**
 * Tests du store (Zustand) pour les flux qui ne peuvent pas être exercés au seul niveau de
 * GameEngine : ici, "Pouvoirs des Âmes" (copy_discard_spell) de Perséphone, dont la sélection
 * de carte à copier est un état du store (cardSelectionSource / getCardsForSelection), pas du
 * moteur.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { GameEngine } from '@/game-engine/GameEngine';
import { ALL_SPELLS, getSpellsByGodId } from '@/data/spells';
import { getGodById } from '@/data/gods';
import { GameState, PlayerState, GodState } from '@/types/cards';

/** Ajoute une copie d'un sort donné (par id) à la main du joueur courant, pour les tests. */
function addCardToHand(engine: GameEngine, spellId: string): void {
    const spell = ALL_SPELLS.find(s => s.id === spellId);
    if (!spell) throw new Error(`Sort non trouvé: ${spellId}`);
    engine.getCurrentPlayer().hand.push({ ...spell });
}

function createGodState(godId: string): GodState {
    const god = getGodById(godId);
    if (!god) throw new Error(`Dieu non trouvé: ${godId}`);
    return { card: god, currentHealth: god.maxHealth, statusEffects: [], isDead: false };
}

function createPlayerState(id: string, name: string, godIds: string[]): PlayerState {
    const gods = godIds.map(createGodState);
    const spells = godIds.flatMap(gid => getSpellsByGodId(gid));
    return {
        id,
        name,
        gods,
        hand: [...spells.slice(0, 5)],
        deck: [...spells.slice(5)],
        discard: [],
        removedCards: [],
        energy: 10,
        fatigueCounter: 0,
        hasPlayedCard: false,
        hasDiscardedForEnergy: false,
        godsCastThisMatch: [],
    };
}

function setupStore(player1Gods: string[], player2Gods: string[]) {
    const gameState: GameState = {
        id: 'store-test-game',
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
    const engine = new GameEngine(gameState);
    useGameStore.setState({
        gameState: engine.getState(),
        engine,
        aiPlayer: null,
        playerId: 'player1',
        isSoloMode: false,
        selectedCard: null,
        selectedTargetGods: [],
        requiredTargets: 0,
        isSelectingTarget: false,
    });
    return engine;
}

describe('gameStore - Pouvoirs des Âmes (copy_discard_spell)', () => {
    beforeEach(() => {
        setupStore(['persephone', 'zeus', 'hestia'], ['hades', 'ares', 'athena']);
    });

    it('cible la défausse du joueur qui vient de la jouer (pas celle de l\'adversaire)', () => {
        useGameStore.getState().playCard('persephone_utility_1');

        const state = useGameStore.getState();
        expect(state.isSelectingCards).toBe(true);
        expect(state.cardSelectionSource).toBe('discard');

        const player = state.engine!.getState().players.find(p => p.id === 'player1')!;
        expect(player.discard.some(c => c.id === 'persephone_utility_1')).toBe(true);
        // La liste proposée doit provenir de SA propre défausse (pas celle de l'adversaire)
        const selectable = state.getCardsForSelection();
        expect(selectable.every(c => player.discard.includes(c))).toBe(true);
    });

    it('exclut "Pouvoirs des Âmes" elle-même de la liste des cartes copiables', () => {
        useGameStore.getState().playCard('persephone_utility_1');

        const state = useGameStore.getState();
        const selectable = state.getCardsForSelection();

        // La carte vient d'être défaussée (donc présente dans player.discard)...
        const player = state.engine!.getState().players.find(p => p.id === 'player1')!;
        expect(player.discard.some(c => c.id === 'persephone_utility_1')).toBe(true);
        // ...mais ne doit pas apparaître comme choix (on ne peut pas se copier soi-même)
        expect(selectable.some(c => c.id === 'persephone_utility_1')).toBe(false);
    });

    it('recycle_from_discard (Hestia) exclut toujours la carte jouée (non-régression)', () => {
        addCardToHand(useGameStore.getState().engine!, 'hestia_utility_1');
        useGameStore.getState().playCard('hestia_utility_1');

        const state = useGameStore.getState();
        expect(state.cardSelectionSource).toBe('discard');
        const player = state.engine!.getState().players.find(p => p.id === 'player1')!;
        const selectable = state.getCardsForSelection();
        expect(player.discard.some(c => c.id === 'hestia_utility_1')).toBe(true);
        expect(selectable.some(c => c.id === 'hestia_utility_1')).toBe(false);
    });

    it('rejoue instantanément le sort copié (sans étape supplémentaire) quand il ne nécessite pas de cible', () => {
        // "Repos mérité" (Hestia, recycle_from_discard) doit être dans la défausse AVANT de
        // jouer "Pouvoirs des Âmes" pour pouvoir être copiée. On la défausse contre énergie
        // d'abord (hasPlayedCard n'est pas encore vrai à ce stade du tour).
        addCardToHand(useGameStore.getState().engine!, 'hestia_utility_1');
        useGameStore.getState().discardForEnergy('hestia_utility_1');

        useGameStore.getState().playCard('persephone_utility_1');

        const stateBeforeCopy = useGameStore.getState();
        expect(stateBeforeCopy.isSelectingCards).toBe(true);
        const playerBeforeCopy = stateBeforeCopy.engine!.getState().players.find(p => p.id === 'player1')!;
        const hestiaCard = playerBeforeCopy.discard.find(c => c.id === 'hestia_utility_1')!;
        expect(hestiaCard).toBeTruthy();

        stateBeforeCopy.confirmCardSelection([hestiaCard]);

        const stateAfter = useGameStore.getState();
        // La modale de sélection doit s'être refermée...
        expect(stateAfter.isSelectingCards).toBe(false);
        // ...et le sort copié (clone d'id "copy_...") doit déjà être dans la défausse : il a
        // donc bien été résolu dans le même appel, sans étape d'interaction supplémentaire.
        const playerAfter = stateAfter.engine!.getState().players.find(p => p.id === 'player1')!;
        expect(playerAfter.discard.some(c => c.id.startsWith('copy_') && c.godId === 'hestia')).toBe(true);
    });
});

describe('gameStore - sorts de Zeus (lightning_toggle) : ne se jouent qu\'une seule fois', () => {
    beforeEach(() => {
        setupStore(['zeus', 'poseidon', 'hestia'], ['hades', 'ares', 'athena']);
    });

    it('la première tentative ouvre la modale de choix sans jouer la carte (pending), et préserve la sélection', () => {
        const enemy = useGameStore.getState().engine!.getState().players
            .find(p => p.id === 'player2')!.gods[0];

        const result = useGameStore.getState().playCard('zeus_skill_1', undefined, [enemy.card.id]);

        expect(result.success).toBe(true);
        expect(result.pending).toBe(true);

        const state = useGameStore.getState();
        expect(state.isSelectingLightningAction).toBe(true);
        // La carte ne doit PAS encore être défaussée : le sort n'est pas joué.
        const player = state.engine!.getState().players.find(p => p.id === 'player1')!;
        expect(player.discard.some(c => c.id === 'zeus_skill_1')).toBe(false);
        // La sélection doit être préservée pour le second appel (sinon "il faut lancer 2 fois").
        expect(state.selectedCard?.id).toBe('zeus_skill_1');
    });

    it('le second appel (avec le choix foudre) joue réellement le sort, une seule fois', () => {
        const enemy = useGameStore.getState().engine!.getState().players
            .find(p => p.id === 'player2')!.gods[0];
        const initialHealth = enemy.currentHealth;

        useGameStore.getState().playCard('zeus_skill_1', undefined, [enemy.card.id]);
        // Reproduit exactement ce que fait LightningActionModal.onSelect dans GameBoard.tsx
        useGameStore.getState().setLightningAction('apply');
        const result = useGameStore.getState().playCard('zeus_skill_1', undefined, [enemy.card.id], 'apply');

        expect(result.success).toBe(true);
        expect(result.pending).toBeUndefined();

        const state = useGameStore.getState();
        const player = state.engine!.getState().players.find(p => p.id === 'player1')!;
        // La carte est bien défaussée (jouée) une seule fois.
        expect(player.discard.filter(c => c.id === 'zeus_skill_1').length).toBe(1);
        // Les 5 dégâts de base ont bien été appliqués une seule fois (pas de double-exécution).
        expect(initialHealth - enemy.currentHealth).toBe(5);
        expect(enemy.statusEffects.some(s => s.type === 'lightning')).toBe(true);
    });
});

describe('gameStore - pas de gain d\'énergie passif en fin de tour', () => {
    it('endTurn() ne donne plus +1 énergie automatique au joueur suivant', () => {
        const engine = setupStore(['zeus', 'poseidon', 'hestia'], ['hades', 'ares', 'athena']);
        const player2 = engine.getState().players.find(p => p.id === 'player2')!;
        player2.energy = 3; // volontairement loin du plafond pour bien isoler le +1 automatique

        useGameStore.getState().endTurn();

        const player2After = useGameStore.getState().engine!.getState().players.find(p => p.id === 'player2')!;
        expect(player2After.energy).toBe(3);
    });
});
