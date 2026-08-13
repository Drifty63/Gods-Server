import { describe, it, expect } from 'vitest';
import { GameEngine } from '@/game-engine/GameEngine';
import { addStatus, canGodAct, tickStatusEffects } from '@/game-engine/StatusSystem';
import { healGod, addShield, dealDamage, PETRIFY_DAMAGE_BONUS } from '@/game-engine/DamageSystem';
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
        addStatus(god, 'bleed', 2);
        const before = god.currentHealth;

        tickStatusEffects(player, state);

        expect(god.currentHealth).toBe(before - 2);
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
        addStatus(god, 'bleed', 2);

        tickStatusEffects(player, state);
        tickStatusEffects(player, state);

        expect(god.isDead).toBe(true);
    });

    it('ne dépasse jamais 2 marques, même en empilant', () => {
        const god = godState('zeus');
        addStatus(god, 'bleed', 1);
        addStatus(god, 'bleed', 1);
        addStatus(god, 'bleed', 5);

        expect(god.statusEffects.find(s => s.type === 'bleed')?.stacks).toBe(2);
    });

    it('applique le plafond dès la première pose', () => {
        const god = godState('zeus');
        addStatus(god, 'bleed', 9);
        expect(god.statusEffects.find(s => s.type === 'bleed')?.stacks).toBe(2);
    });

    it('se soigne : chaque point de soin retire une marque', () => {
        const god = godState('zeus');
        god.currentHealth = 10;
        addStatus(god, 'bleed', 2);

        healGod(god, 1);
        expect(god.statusEffects.find(s => s.type === 'bleed')?.stacks).toBe(1);

        healGod(god, 1);
        expect(god.statusEffects.find(s => s.type === 'bleed')).toBeUndefined();
    });
});

describe('Pétrification', () => {
    /** Dégâts bruts sans élément : pas de faiblesse en jeu, le calcul reste lisible. */
    const hit = (god: GodState, raw: number) => {
        const { player, state } = soloState(god);
        return dealDamage(god, raw, player, state);
    };

    it('n\'empêche PAS d\'agir : c\'est une vulnérabilité, pas une immobilisation', () => {
        const god = godState('zeus');
        addStatus(god, 'petrify', 1);
        expect(canGodAct(god)).toBe(true);
    });

    it('n\'empêche pas les soins', () => {
        const god = godState('zeus');
        god.currentHealth = 10;
        addStatus(god, 'petrify', 1);
        expect(healGod(god, 5)).toBe(5);
    });

    it('ajoute +2 aux dégâts du prochain coup reçu', () => {
        const god = godState('zeus');
        addStatus(god, 'petrify', 1);

        const result = hit(god, 4);

        expect(result.petrifyBonus).toBe(PETRIFY_DAMAGE_BONUS);
        expect(result.healthLost).toBe(4 + PETRIFY_DAMAGE_BONUS);
    });

    it('est consommée par ce coup : le suivant est normal', () => {
        const god = godState('zeus');
        addStatus(god, 'petrify', 1);

        hit(god, 4);
        const second = hit(god, 4);

        expect(second.petrifyBonus).toBe(0);
        expect(second.healthLost).toBe(4);
        expect(god.statusEffects.find(s => s.type === 'petrify')).toBeUndefined();
    });

    it('cumule +2 par marque', () => {
        const god = godState('zeus');
        addStatus(god, 'petrify', 2);
        expect(hit(god, 3).healthLost).toBe(3 + 2 * PETRIFY_DAMAGE_BONUS);
    });

    it('ne s\'use pas au fil des tours tant qu\'aucun dégât n\'est reçu', () => {
        const god = godState('zeus');
        const { player, state } = soloState(god);
        // Même en demandant une durée, la pétrification doit persister : seuls des dégâts
        // (ou un cleanse) la retirent.
        addStatus(god, 'petrify', 1, 1);

        tickStatusEffects(player, state);
        tickStatusEffects(player, state);
        tickStatusEffects(player, state);

        expect(god.statusEffects.find(s => s.type === 'petrify')?.stacks).toBe(1);
        expect(hit(god, 1).petrifyBonus).toBe(PETRIFY_DAMAGE_BONUS);
    });

    it('n\'est PAS consommée par le saignement : la marque attend une attaque', () => {
        const god = godState('zeus');
        const { player, state } = soloState(god);
        addStatus(god, 'petrify', 1);
        addStatus(god, 'bleed', 2);
        const before = god.currentHealth;

        tickStatusEffects(player, state);

        // Le saignement inflige ses 2 dégâts sans profiter du +2 ni gaspiller la marque.
        expect(god.currentHealth).toBe(before - 2);
        expect(god.statusEffects.find(s => s.type === 'petrify')?.stacks).toBe(1);
        // Elle reste donc disponible pour la vraie attaque.
        expect(hit(god, 3).petrifyBonus).toBe(PETRIFY_DAMAGE_BONUS);
    });

    it('n\'est PAS consommée par un coup que le bouclier absorbe entièrement', () => {
        const god = godState('zeus');
        addStatus(god, 'petrify', 1);
        addShield(god, 10);
        const before = god.currentHealth;

        const blocked = hit(god, 4);

        expect(blocked.petrifyBonus).toBe(0);
        expect(god.currentHealth).toBe(before);
        // Le bouclier n'absorbe que le coup lui-même, jamais le bonus non appliqué.
        expect(god.statusEffects.find(s => s.type === 'shield')?.stacks).toBe(6);
        expect(god.statusEffects.find(s => s.type === 'petrify')?.stacks).toBe(1);
    });

    it('est consommée dès qu\'un coup traverse le bouclier', () => {
        const god = godState('zeus');
        addStatus(god, 'petrify', 1);
        addShield(god, 2);

        const through = hit(god, 4);

        expect(through.petrifyBonus).toBe(PETRIFY_DAMAGE_BONUS);
        // 4 + 2 de bonus = 6, dont 2 absorbés par le bouclier.
        expect(through.healthLost).toBe(4);
        expect(god.statusEffects.find(s => s.type === 'petrify')).toBeUndefined();
    });

    it('est retirée par un cleanse (façon Aphrodite), qui ne garde que le bouclier', () => {
        const god = godState('zeus');
        addStatus(god, 'petrify', 2);
        addShield(god, 4);

        // Réplique de l'effet `cleanse` : tout saute sauf le bouclier.
        god.statusEffects = god.statusEffects.filter(s => s.type === 'shield');

        expect(hit(god, 3).petrifyBonus).toBe(0);
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

    it('exempte le grimpeur de fatigue SANS en exempter l\'adversaire', () => {
        const state = start({}, 0, true);
        expect(state.players[0].noFatigueDamage).toBe(true);
        // Le point clé : l'étage adverse reste soumis à la fatigue, sinon un combat contre
        // 4 dieux pourrait durer indéfiniment sans qu'aucun camp ne s'épuise.
        expect(state.players[1].noFatigueDamage).toBe(false);
    });

    it('laisse la fatigue active pour tout le monde hors Ascension', () => {
        const state = start({}, 0, false);
        expect(state.players[0].noFatigueDamage).toBe(false);
        expect(state.players[1].noFatigueDamage).toBe(false);
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
