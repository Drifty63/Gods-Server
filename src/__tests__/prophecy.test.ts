/**
 * La prophétie de l'Oracle — le seul effet du jeu qui SURVIVE au tour qui l'a posé.
 *
 * Tous les autres se résolvent immédiatement, donc un test d'effet ordinaire se contente de
 * jouer une carte et de regarder l'état juste après. Ici il faut faire passer un tour, puis
 * observer ce que l'adversaire peut ou ne peut plus faire. C'est aussi le seul effet qui
 * traverse `playCard` et `discardForEnergy`, les deux fonctions les plus sensibles du moteur —
 * d'où ce fichier à part.
 */
import { describe, it, expect } from 'vitest';
import { GameEngine, PROPHECY_SHIELD } from '@/game-engine/GameEngine';
import { ALL_SPELLS, getSpellsByGodId } from '@/data/spells';
import { getGodById } from '@/data/gods';
import type { GameState, PlayerState, GodState, ProphecyAction } from '@/types/cards';

function god(id: string): GodState {
    const c = getGodById(id)!;
    return { card: c, currentHealth: c.maxHealth, statusEffects: [], isDead: false };
}

function player(id: string, ids: string[]): PlayerState {
    const spells = ids.flatMap(getSpellsByGodId);
    return {
        id, name: id, gods: ids.map(god),
        hand: [], deck: [...spells],
        discard: [], removedCards: [], energy: 10, fatigueCounter: 0,
        hasPlayedCard: false, hasDiscardedForEnergy: false, godsCastThisMatch: [],
    };
}

/** L'Oracle est chez p1 ; p2 est la cible de la prophétie. */
function makeEngine(): GameEngine {
    const state: GameState = {
        id: 't', status: 'playing', currentPlayerId: 'p1', turnNumber: 1, turnSequence: 0,
        players: [player('p1', ['oracle_delphes', 'zeus']), player('p2', ['hades', 'ares'])],
        log: [], createdAt: new Date(), updatedAt: new Date(),
    };
    return new GameEngine(state);
}

/** Pose une prophétie au nom de p1, comme le ferait la carte une fois le choix connu. */
function castProphecy(e: GameEngine, choice: ProphecyAction): void {
    const card = ALL_SPELLS.find(s => s.id === 'oracle_delphes_skill_2')!;
    e.getCurrentPlayer().hand.push({ ...card });
    e.executeAction({ type: 'play_card', playerId: 'p1', cardId: card.id, deferCustomEffect: true });
    e.resolveDeferredEffect(card.id, { prophecyChoice: choice });
}

/** Passe la main à p2. */
function handOver(e: GameEngine): void {
    e.endTurn();
}

/**
 * Met une carte en main et renvoie son identifiant.
 *
 * L'identifiant est rendu UNIQUE : le deck de test contient déjà un exemplaire de chaque sort,
 * et la fin de tour fait piocher. Sans ce suffixe, chercher « la carte a-t-elle quitté la
 * main ? » retombait sur l'exemplaire pioché entre-temps, et le test échouait pour une raison
 * qui n'avait rien à voir avec la prophétie.
 */
function giveTo(e: GameEngine, playerId: string, spellId: string): string {
    const s = ALL_SPELLS.find(x => x.id === spellId)!;
    const unique = `${s.id}__test`;
    e.getState().players.find(p => p.id === playerId)!.hand.push({ ...s, id: unique });
    return unique;
}

describe('Prophétie de l’Oracle', () => {
    it('inscrit la prédiction dans l’état de partie sans rien faire d’autre', () => {
        const e = makeEngine();
        castProphecy(e, 'competence');

        const st = e.getState();
        expect(st.prophecy).toBeDefined();
        expect(st.prophecy!.casterPlayerId).toBe('p1');
        expect(st.prophecy!.choice).toBe('competence');
        // Aucune récompense tant que le pari n'est pas gagné.
        expect(st.players[0].gods.every(g => !g.statusEffects.some(s => s.type === 'shield'))).toBe(true);
    });

    it('annule la carte annoncée, sans effet ni gain d’énergie', () => {
        const e = makeEngine();
        castProphecy(e, 'generator');
        handOver(e);

        // Un générateur d'Hadès : il inflige des dégâts ET rapporte de l'énergie.
        const gen = ALL_SPELLS.find(s => s.godId === 'hades' && s.type === 'generator')!;
        const genId = giveTo(e, 'p2', gen.id);
        const p2 = e.getState().players[1];
        const energieAvant = p2.energy;
        const pvAvant = e.getState().players[0].gods.map(g => g.currentHealth);

        const r = e.executeAction({ type: 'play_card', playerId: 'p2', cardId: genId, targetGodId: 'zeus' });

        expect(r.success).toBe(true);
        expect(r.message).toContain('annulée');
        // La carte est partie, mais elle n'a rien produit.
        expect(p2.hand.find(c => c.id === genId)).toBeUndefined();
        expect(p2.discard.some(c => c.id === genId)).toBe(true);
        expect(p2.energy).toBe(energieAvant - gen.energyCost);
        expect(e.getState().players[0].gods.map(g => g.currentHealth)).toEqual(pvAvant);
        // Le tour est bien consommé : pas de seconde tentative.
        expect(p2.hasPlayedCard).toBe(true);
    });

    it('récompense le lanceur : boucliers sur chaque dieu vivant, et une énergie', () => {
        const e = makeEngine();
        castProphecy(e, 'competence');
        handOver(e);

        const p1 = e.getState().players[0];
        p1.energy = 5;
        const comp = ALL_SPELLS.find(s => s.godId === 'hades' && s.type === 'competence')!;
        const idcomp = giveTo(e, 'p2', comp.id);
        e.executeAction({ type: 'play_card', playerId: 'p2', cardId: idcomp, targetGodId: 'zeus' });

        for (const g of p1.gods) {
            const shield = g.statusEffects.find(s => s.type === 'shield');
            expect(shield?.stacks, `${g.card.id} sans bouclier`).toBe(PROPHECY_SHIELD);
        }
        expect(p1.energy).toBe(6);
        // Consommée : elle ne peut pas se réaliser deux fois.
        expect(e.getState().prophecy).toBeUndefined();
    });

    it('ne touche pas un dieu mort du lanceur', () => {
        const e = makeEngine();
        const zeus = e.getState().players[0].gods.find(g => g.card.id === 'zeus')!;
        zeus.isDead = true;
        zeus.currentHealth = 0;

        castProphecy(e, 'competence');
        handOver(e);
        const comp = ALL_SPELLS.find(s => s.godId === 'hades' && s.type === 'competence')!;
        const idcomp = giveTo(e, 'p2', comp.id);
        e.executeAction({ type: 'play_card', playerId: 'p2', cardId: idcomp, targetGodId: 'oracle_delphes' });

        expect(zeus.statusEffects.some(s => s.type === 'shield')).toBe(false);
    });

    it('laisse passer une action qui n’était pas celle annoncée', () => {
        const e = makeEngine();
        castProphecy(e, 'utility');
        handOver(e);

        const gen = ALL_SPELLS.find(s => s.godId === 'hades' && s.type === 'generator')!;
        const id2 = giveTo(e, 'p2', gen.id);
        const r = e.executeAction({ type: 'play_card', playerId: 'p2', cardId: id2, targetGodId: 'zeus' });

        expect(r.message).not.toContain('annulée');
        // Toujours en attente : elle ne se déclenche que sur l'action annoncée.
        expect(e.getState().prophecy).toBeDefined();
    });

    it('n’annule JAMAIS les cartes de celui qui l’a lancée', () => {
        const e = makeEngine();
        castProphecy(e, 'generator');
        // Sans passer la main : l'Oracle rejoue lui-même un générateur.
        e.getState().players[0].hasPlayedCard = false;
        const gen = ALL_SPELLS.find(s => s.godId === 'zeus' && s.type === 'generator')!;
        const id3 = giveTo(e, 'p1', gen.id);

        const r = e.executeAction({ type: 'play_card', playerId: 'p1', cardId: id3, targetGodId: 'hades' });
        expect(r.message).not.toContain('annulée');
    });

    it('annule la défausse contre énergie quand c’est elle qui était annoncée', () => {
        const e = makeEngine();
        castProphecy(e, 'discard');
        handOver(e);

        const gen = ALL_SPELLS.find(s => s.godId === 'hades' && s.type === 'generator')!;
        const id4 = giveTo(e, 'p2', gen.id);
        const p2 = e.getState().players[1];
        const energieAvant = p2.energy;

        const r = e.executeAction({ type: 'discard_for_energy', playerId: 'p2', cardId: id4 });

        expect(r.message).toContain('annulée');
        expect(p2.energy).toBe(energieAvant);
        expect(p2.discard.some(c => c.id === id4)).toBe(true);
        // Le drapeau est posé : sinon le joueur réessaierait avec une autre carte.
        expect(p2.hasDiscardedForEnergy).toBe(true);
    });

    it('échoue si l’adversaire passe son tour sans rien faire', () => {
        const e = makeEngine();
        castProphecy(e, 'competence');
        handOver(e);

        // p2 ne joue rien et rend la main.
        e.executeAction({ type: 'end_turn', playerId: 'p2' });

        expect(e.getState().prophecy).toBeUndefined();
        expect(e.getState().players[0].gods.some(g => g.statusEffects.some(s => s.type === 'shield'))).toBe(false);
    });
});
