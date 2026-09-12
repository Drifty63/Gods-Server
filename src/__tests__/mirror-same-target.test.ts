import { describe, it, expect } from 'vitest';
import { GameEngine } from '@/game-engine/GameEngine';
import { getGodById } from '@/data/gods';
import { createDeck, ALL_SPELLS } from '@/data/spells';

/**
 * Résolution de cible en match miroir, et cibles manquantes.
 *
 * Deux défauts observés en partie réelle, tous deux dans la résolution des cibles :
 *
 *  - `target: 'same'` n'avait aucun cas dans le switch et retombait sur la branche par défaut,
 *    qui réunit les deux camps et filtre par identifiant. Deux équipes portant le même Chevalier
 *    d'Athéna : un poison posé sur celui d'en face empoisonnait aussi le sien.
 *  - quand une carte à deux cibles n'en trouvait qu'une, l'interface complétait la liste en
 *    répétant la dernière : les deux coups tombaient sur le même dieu, soit le double des dégâts
 *    annoncés par la carte.
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

const poisonOn = (god: { statusEffects: { type: string; stacks: number }[] }) =>
    god.statusEffects.find(s => s.type === 'poison')?.stacks ?? 0;

describe("target: 'same' en match miroir", () => {
    it("n'applique le statut qu'au dieu du camp visé", () => {
        // « Injection Fatale » : dégâts puis poison sur la MÊME cible.
        const engine = mirrorGame(['giant_spider_1', 'athena_knight']);
        const state = engine.getState();
        const mine = state.players[0].gods[0];
        const theirs = state.players[1].gods[0];

        arm(engine, 0, 'giant_spider_1_skill_2');
        engine.executeAction({
            type: 'play_card', playerId: 'player1',
            cardId: 'giant_spider_1_skill_2', targetGodId: 'giant_spider_1',
        });

        expect(poisonOn(theirs), "l'ennemi visé doit être empoisonné").toBeGreaterThan(0);
        expect(poisonOn(mine), 'le lanceur ne doit RIEN subir').toBe(0);
        expect(mine.currentHealth).toBe(mine.card.maxHealth);
    });
});

describe('cartes à plusieurs cibles', () => {
    it('ne concentre pas les coups manquants sur une seule cible', () => {
        // « Attaque Coordonnée » : 2 dégâts sur DEUX cibles. Face à un seul survivant, elle ne
        // doit infliger que 2 dégâts, pas 4.
        const engine = new GameEngine(GameEngine.createInitialState(
            'player1', 'Vous', [getGodById('giant_spider_1')!], createDeck(['giant_spider_1']),
            // Arès est Terre, faible à l'Air : les Ténèbres de l'araignée ne le doublent pas.
            'player2', 'Adversaire', [getGodById('ares')!], createDeck(['ares']),
            'player1',
        ));
        const target = engine.getState().players[1].gods[0];
        const before = target.currentHealth;

        arm(engine, 0, 'giant_spider_1_skill_1');
        engine.executeAction({
            type: 'play_card', playerId: 'player1',
            cardId: 'giant_spider_1_skill_1', targetGodIds: ['ares'],
        });

        expect(before - target.currentHealth).toBe(2);
    });

    it('inflige bien les deux coups quand deux cibles sont disponibles', () => {
        const engine = new GameEngine(GameEngine.createInitialState(
            'player1', 'Vous', [getGodById('giant_spider_1')!], createDeck(['giant_spider_1']),
            // Ni Arès ni Zeus ne sont faibles aux Ténèbres : les dégâts restent bruts.
            'player2', 'Adversaire', [getGodById('ares')!, getGodById('zeus')!], createDeck(['ares', 'zeus']),
            'player1',
        ));
        const [first, second] = engine.getState().players[1].gods;
        const before = [first.currentHealth, second.currentHealth];

        arm(engine, 0, 'giant_spider_1_skill_1');
        engine.executeAction({
            type: 'play_card', playerId: 'player1',
            cardId: 'giant_spider_1_skill_1', targetGodIds: ['ares', 'zeus'],
        });

        expect(before[0] - first.currentHealth).toBe(2);
        expect(before[1] - second.currentHealth).toBe(2);
    });
});

describe('provocation', () => {
    it('place le provocateur en tête des cibles proposées, même en multi-cibles', () => {
        const engine = new GameEngine(GameEngine.createInitialState(
            'player1', 'Vous', [getGodById('zeus')!], createDeck(['zeus']),
            'player2', 'Adversaire',
            [getGodById('athena')!, getGodById('ares')!], createDeck(['athena', 'ares']),
            'player1',
        ));
        const provoker = engine.getState().players[1].gods[1];
        provoker.statusEffects.push({ type: 'provocation', stacks: 1, duration: 3 });

        const single = engine.getValidTargets('enemy_god', false);
        expect(single.map(g => g.card.id)).toEqual([provoker.card.id]);

        const multi = engine.getValidTargets('enemy_god', true);
        expect(multi[0].card.id, 'le provocateur vient en premier').toBe(provoker.card.id);
        expect(multi.length, 'les autres restent visables').toBeGreaterThan(1);
    });
});
