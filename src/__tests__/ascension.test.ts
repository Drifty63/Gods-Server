import { describe, it, expect } from 'vitest';
import { GameEngine } from '@/game-engine/GameEngine';
import { addStatus, canGodAct, tickStatusEffects, isPetrified } from '@/game-engine/StatusSystem';
import { healGod, addShield } from '@/game-engine/DamageSystem';
import { getGodById } from '@/data/gods';
import { createDeck } from '@/data/spells';
import {
    generateAscensionRun, enemyPools, floorReward, TOTAL_FLOORS, ENEMIES_PER_FLOOR,
} from '@/data/ascension';
import type { GodState, PlayerState, GameState } from '@/types/cards';

function godState(id: string): GodState {
    const card = getGodById(id);
    if (!card) throw new Error(`Unité introuvable : ${id}`);
    return { card, currentHealth: card.maxHealth, statusEffects: [], isDead: false };
}

/** État minimal suffisant pour faire tourner le tick de fin de tour. */
function soloState(god: GodState): { player: PlayerState; state: GameState } {
    const player: PlayerState = {
        id: 'player1', name: 'Vous', gods: [god], hand: [], deck: [], discard: [], removedCards: [],
        energy: 0, fatigueCounter: 0, hasPlayedCard: false, hasDiscardedForEnergy: false, godsCastThisMatch: [],
    };
    const state = {
        id: 'test', status: 'playing', currentPlayerId: 'player1', turnNumber: 1,
        players: [player, player], log: [], createdAt: new Date(), updatedAt: new Date(),
    } as unknown as GameState;
    return { player, state };
}

describe('Saignement', () => {
    it('inflige ses dégâts en fin de tour', () => {
        const god = godState('zeus');
        const { player, state } = soloState(god);
        addStatus(god, 'bleed', 3);
        const before = god.currentHealth;

        tickStatusEffects(player, state);

        expect(god.currentHealth).toBe(before - 3);
    });

    it('ignore le bouclier, contrairement aux dégâts de sorts', () => {
        const god = godState('zeus');
        const { player, state } = soloState(god);
        addShield(god, 10);
        addStatus(god, 'bleed', 2);
        const before = god.currentHealth;

        tickStatusEffects(player, state);

        expect(god.currentHealth).toBe(before - 2);
        // Le bouclier n'a rien absorbé : il est intact.
        expect(god.statusEffects.find(s => s.type === 'shield')?.stacks).toBe(10);
    });

    it('peut tuer et déclenche alors la mort du dieu', () => {
        const god = godState('zeus');
        const { player, state } = soloState(god);
        god.currentHealth = 2;
        addStatus(god, 'bleed', 5);

        tickStatusEffects(player, state);

        expect(god.isDead).toBe(true);
    });
});

describe('Pétrification', () => {
    it('empêche le dieu d\'agir, comme l\'étourdissement', () => {
        const god = godState('zeus');
        expect(canGodAct(god)).toBe(true);
        addStatus(god, 'petrify', 1, 1);
        expect(canGodAct(god)).toBe(false);
        expect(isPetrified(god)).toBe(true);
    });

    it('empêche AUSSI les soins -- ce qui la distingue de l\'étourdissement', () => {
        const petrified = godState('zeus');
        petrified.currentHealth = 10;
        addStatus(petrified, 'petrify', 1, 1);
        expect(healGod(petrified, 8)).toBe(0);
        expect(petrified.currentHealth).toBe(10);

        const stunned = godState('zeus');
        stunned.currentHealth = 10;
        addStatus(stunned, 'stun', 1, 1);
        expect(healGod(stunned, 8)).toBe(8);
    });

    it('annule la régénération de fin de tour', () => {
        const god = godState('zeus');
        const { player, state } = soloState(god);
        god.currentHealth = 10;
        addStatus(god, 'regen', 3, 3);
        addStatus(god, 'petrify', 1, 2);

        tickStatusEffects(player, state);

        expect(god.currentHealth).toBe(10);
    });
});

describe('Report d\'état entre étages (Ascension)', () => {
    const start = (carry?: Record<string, number>, energy?: number, noFatigue = true) =>
        GameEngine.createInitialState(
            'player1', 'Vous', [getGodById('zeus')!, getGodById('athena')!], createDeck(['zeus', 'athena']),
            'player2', 'Étage', [getGodById('hades')!], createDeck(['hades']),
            'player1',
            { carryOverHealth: carry, carryOverEnergy: energy, noFatigueDamage: noFatigue },
        );

    it('reprend les PV entamés sans toucher aux PV maximum', () => {
        const state = start({ zeus: 7 });
        const zeus = state.players[0].gods.find(g => g.card.id === 'zeus')!;

        expect(zeus.currentHealth).toBe(7);
        // Le point clé : la barre de vie doit afficher 7/25, pas 7/7.
        expect(zeus.card.maxHealth).toBeGreaterThan(7);
    });

    it('laisse les dieux non reportés à leurs PV maximum', () => {
        const state = start({ zeus: 7 });
        const athena = state.players[0].gods.find(g => g.card.id === 'athena')!;
        expect(athena.currentHealth).toBe(athena.card.maxHealth);
    });

    it('borne le report entre 1 PV et les PV maximum', () => {
        const state = start({ zeus: 0, athena: 9999 });
        const zeus = state.players[0].gods.find(g => g.card.id === 'zeus')!;
        const athena = state.players[0].gods.find(g => g.card.id === 'athena')!;
        expect(zeus.currentHealth).toBe(1);
        expect(athena.currentHealth).toBe(athena.card.maxHealth);
    });

    it('reporte l\'énergie non dépensée', () => {
        expect(start({}, 4).players[0].energy).toBe(4);
    });

    it('n\'applique le report qu\'au joueur, pas à l\'adversaire', () => {
        const state = start({ hades: 3 }, 4);
        const enemy = state.players[1];
        expect(enemy.gods[0].currentHealth).toBe(enemy.gods[0].card.maxHealth);
        expect(enemy.energy).toBe(1); // second joueur : règle normale
    });

    it('désactive les dégâts de fatigue quand demandé', () => {
        expect(start({}, 0, true).noFatigueDamage).toBe(true);
        expect(start({}, 0, false).noFatigueDamage).toBe(false);
    });
});

describe('Génération des étages', () => {
    it('produit 15 étages de 4 adversaires', () => {
        const run = generateAscensionRun(1234);
        expect(run).toHaveLength(TOTAL_FLOORS);
        for (const floor of run) {
            expect(floor.enemyIds, `étage ${floor.floor}`).toHaveLength(ENEMIES_PER_FLOOR);
        }
    });

    it('ne référence que des unités existantes', () => {
        for (const floor of generateAscensionRun(42)) {
            for (const id of floor.enemyIds) {
                expect(getGodById(id), `${id} (étage ${floor.floor})`).toBeDefined();
            }
        }
    });

    it('permet de construire un deck ennemi pour chaque étage', () => {
        // createDeck refuse plus de 4 unités : c'est la contrainte qui fixe ENEMIES_PER_FLOOR.
        for (const floor of generateAscensionRun(7)) {
            expect(() => createDeck(floor.enemyIds)).not.toThrow();
            expect(createDeck(floor.enemyIds)).toHaveLength(ENEMIES_PER_FLOOR * 5);
        }
    });

    it('rejoue la même tour pour un même seed, et une autre sinon', () => {
        const a = generateAscensionRun(99).map(f => f.enemyIds.join(','));
        const b = generateAscensionRun(99).map(f => f.enemyIds.join(','));
        const c = generateAscensionRun(100).map(f => f.enemyIds.join(','));
        expect(a).toEqual(b);
        expect(a).not.toEqual(c);
    });

    it('termine par trois étages de dieux uniquement', () => {
        const run = generateAscensionRun(5);
        const gods = new Set(enemyPools().god.map(g => g.id));
        for (const floor of run.slice(-3)) {
            expect(floor.tier).toBe('god');
            for (const id of floor.enemyIds) expect(gods.has(id)).toBe(true);
        }
    });

    it('commence par un étage de serviteurs uniquement', () => {
        const servants = new Set(enemyPools().servant.map(g => g.id));
        for (const id of generateAscensionRun(5)[0].enemyIds) {
            expect(servants.has(id)).toBe(true);
        }
    });

    it('récompense davantage les étages élevés', () => {
        expect(floorReward(15)).toBeGreaterThan(floorReward(1));
    });
});
