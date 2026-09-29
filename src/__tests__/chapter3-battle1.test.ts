import { describe, it, expect } from 'vitest';
import { GameEngine } from '@/game-engine/GameEngine';
import { ZEUS_CAMPAIGN } from '@/data/story/campaign';
import { findBattleEvent } from '@/data/story/progression';
import { getGodById, ALL_GODS } from '@/data/gods';
import { createDeck } from '@/data/spells';
import { RELEASED_BESTIARY } from '@/data/units/released';

/**
 * Premier combat du chapitre 3 : trois dieux contre DEUX sirènes et DEUX harpies.
 *
 * Le piège est précis. Le moteur résout une cible par `card.id`
 * (`gods.find(g => g.card.id === targetGodId)`, une cinquantaine d'occurrences dans GameEngine).
 * Deux cartes portant le même identifiant dans une équipe : la première répondrait pour les deux,
 * et la seconde serait intouchable jusqu'à la mort de sa jumelle. Le combat serait injouable, et
 * rien dans les données ne le signalerait — d'où ces tests.
 */

const chapter3 = ZEUS_CAMPAIGN.chapters.find(c => c.number === 3)!;
const battle1 = chapter3.battles!.find(b => b.id === 'battle1')!;
const fight = findBattleEvent(chapter3, battle1)!.battle!;
const playerTeam = fight.playerTeam!;
const enemyTeam = fight.enemyTeam!;

describe('Chapitre 3, combat 1 — composition', () => {
    it('oppose trois dieux à quatre adversaires', () => {
        expect(fight.playerTeam).toEqual(['athena', 'artemis', 'ulysses']);
        expect(enemyTeam).toHaveLength(4);
    });

    it('donne à chaque adversaire un identifiant UNIQUE', () => {
        expect(new Set(enemyTeam).size).toBe(enemyTeam.length);
    });

    it('n’envoie que des cartes qui existent, des deux côtés', () => {
        for (const id of [...playerTeam, ...enemyTeam]) {
            expect(getGodById(id), `carte introuvable : ${id}`).toBeTruthy();
        }
    });

    it('donne un jeu complet à chaque adversaire, jumelles comprises', () => {
        // Une jumelle sans sorts laisserait l'IA sans rien à jouer : le combat se figerait sur
        // un adversaire qui passe son tour indéfiniment.
        for (const id of enemyTeam) {
            expect(createDeck([id]).length, `aucun sort pour ${id}`).toBe(5);
        }
    });
});

describe('Chapitre 3, combat 1 — les jumelles', () => {
    const twins = ['sirenes_2', 'harpies_2'];

    it('reprennent exactement les caractéristiques de leur originale', () => {
        for (const twinId of twins) {
            const twin = getGodById(twinId)!;
            const source = getGodById(twinId.replace('_2', ''))!;
            expect(twin.element).toBe(source.element);
            expect(twin.maxHealth).toBe(source.maxHealth);
            expect(twin.weakness).toBe(source.weakness);
            expect(twin.category).toBe(source.category);
            // Mêmes illustrations : une jumelle représente la même créature, elle ne réclame
            // aucun dessin supplémentaire.
            expect(twin.imageUrl).toBe(source.imageUrl);
        }
    });

    it('restent cachées de la Collection, du Duel et de l’Ascension', () => {
        for (const twinId of twins) {
            expect(getGodById(twinId)!.hidden, `${twinId} visible`).toBe(true);
        }
        // Et elles ne gonflent pas le décompte des cartes possédables.
        const visible = ALL_GODS.filter(g => !g.hidden).map(g => g.id);
        expect(visible).not.toContain('sirenes_2');
        expect(visible).not.toContain('harpies_2');
    });

    it('n’ajoutent aucun sort orphelin au bestiaire', () => {
        // Chaque sort d'une jumelle doit pointer vers ELLE, et non vers l'originale : un `godId`
        // resté en arrière rattacherait ses cartes au mauvais porteur.
        for (const twinId of twins) {
            const spells = RELEASED_BESTIARY.spells.filter(s => s.godId === twinId);
            expect(spells).toHaveLength(5);
            for (const s of spells) expect(s.id.startsWith(twinId)).toBe(true);
        }
    });
});

describe('Chapitre 3, combat 1 — jouabilité', () => {
    const engine = () => new GameEngine(GameEngine.createInitialState(
        'player1', 'Vous',
        playerTeam.map(id => getGodById(id)!), createDeck(playerTeam),
        'player2', 'Récifs',
        enemyTeam.map(id => getGodById(id)!), createDeck(enemyTeam),
        'player1',
    ));

    it('démarre sans que deux adversaires se confondent', () => {
        const foe = engine().getState().players[1];
        expect(foe.gods).toHaveLength(4);
        expect(new Set(foe.gods.map(g => g.card.id)).size).toBe(4);
    });

    it('permet de viser CHAQUE adversaire séparément', () => {
        // Le cœur de l'affaire : blesser la deuxième sirène ne doit pas blesser la première.
        const foe = engine().getState().players[1];
        for (const target of foe.gods) {
            const found = foe.gods.filter(g => g.card.id === target.card.id);
            expect(found, `${target.card.id} ambigu`).toHaveLength(1);
        }
    });

    it('laisse aux dieux de quoi tenir un long combat', () => {
        const me = engine().getState().players[0];
        expect(me.hand.length).toBeGreaterThan(0);
        expect(me.deck.length).toBeGreaterThan(0);
    });
});
