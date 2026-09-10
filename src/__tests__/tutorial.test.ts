import { describe, it, expect } from 'vitest';
import { TUTORIAL_STEPS, shouldAdvance, type SpotlightTarget, type TutorialStep } from '@/data/tutorial';
import { getSpellsByGodId, createDeck } from '@/data/spells';
import { GAME_CONFIG } from '@/data/gameRules';
import { GameEngine } from '@/game-engine/GameEngine';
import { getGodById } from '@/data/gods';
import type { GameState } from '@/types/cards';

/**
 * Cohérence du scénario du didacticiel.
 *
 * Deux familles de défauts ont motivé ces tests, toutes deux invisibles jusque-là :
 *  - l'étape « À vous de jouer » était infranchissable parce qu'elle n'éclairait pas tout ce que
 *    le geste demandé exige de toucher ;
 *  - le didacticiel sautait une étape sur deux (7 → 9, 9 → 11), parce que les prédicats
 *    d'avancement décrivent un ÉTAT et sont réévalués à chaque notification du store.
 */

const spotlightOf = (step: { spotlight: SpotlightTarget | SpotlightTarget[] }): SpotlightTarget[] =>
    Array.isArray(step.spotlight) ? step.spotlight : [step.spotlight];

const stepById = (id: string): TutorialStep => {
    const step = TUTORIAL_STEPS.find(s => s.id === id);
    if (!step) throw new Error(`Étape introuvable : ${id}`);
    return step;
};

describe('scénario du didacticiel', () => {
    it("a des identifiants d'étape uniques", () => {
        const ids = TUTORIAL_STEPS.map(s => s.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("ne gèle jamais le plateau sur une étape où le joueur doit agir", () => {
        // `blocking` rend l'interface inerte : sur une étape d'action, il empêcherait le geste
        // demandé. Seule exception : les étapes où le joueur ATTEND (l'IA joue), signalées par
        // un `waitingLabel`.
        const frozen = TUTORIAL_STEPS.filter(
            s => typeof s.advance === 'function' && s.blocking && !s.waitingLabel
        );
        expect(frozen.map(s => s.id)).toEqual([]);
    });

    it('éclaire tout ce que le geste exige sur les étapes où il faut lancer un sort', () => {
        for (const id of ['play-generator', 'finish']) {
            const spotlight = spotlightOf(stepById(id));
            expect(spotlight, `étape ${id}`).toContain('hand');
            expect(spotlight, `étape ${id}`).toContain('card-action-primary');
            expect(spotlight, `étape ${id}`).toContain('enemy-gods');
        }
    });

    it("n'éclaire QUE le bouton demandé, jamais son voisin", () => {
        // Éclairer toute la rangée revenait à entourer CIBLER et DÉFAUSSER en même temps :
        // le joueur ne savait pas lequel on lui demandait.
        for (const id of ['play-generator', 'finish']) {
            expect(spotlightOf(stepById(id)), `étape ${id}`).not.toContain('card-action-discard');
        }
        for (const id of ['discard', 'discard-more']) {
            const spotlight = spotlightOf(stepById(id));
            expect(spotlight, `étape ${id}`).toContain('card-action-discard');
            expect(spotlight, `étape ${id}`).not.toContain('card-action-primary');
        }
    });

    it("confirme que les générateurs de Zeus exigent bien une cible ennemie", () => {
        // C'est la raison de fond pour laquelle « enemy-gods » ne peut pas être omis.
        const generators = getSpellsByGodId('zeus').filter(s => s.type === 'generator');
        expect(generators.length).toBeGreaterThan(0);
        for (const spell of generators) {
            expect(
                spell.effects.some(e => e.target === 'enemy_god' || e.target === 'all_enemies'),
                `${spell.id} doit viser l'ennemi`,
            ).toBe(true);
        }
    });

    it('met la fatigue en scène plutôt que de seulement la décrire', () => {
        const fatigue = stepById('fatigue');
        expect(fatigue.script).toBe('fatigue');
        // Une mise en scène se joue pendant que le joueur regarde : l'étape doit être bloquante.
        expect(fatigue.blocking).toBe(true);
        // Et elle doit désigner le compteur, sinon le joueur ne sait pas où regarder.
        expect(spotlightOf(fatigue)).toContain('player-fatigue');
    });

    it("annonce la pioche vide AVANT de la vider", () => {
        const ids = TUTORIAL_STEPS.map(s => s.id);
        expect(ids.indexOf('deck-empty')).toBeGreaterThan(-1);
        expect(ids.indexOf('deck-empty')).toBeLessThan(ids.indexOf('fatigue'));
    });

    it("explique la couleur du cadre, et pas seulement l'icône de faiblesse", () => {
        const ids = TUTORIAL_STEPS.map(s => s.id);
        expect(ids).toContain('god-anatomy');
        // La lecture de la carte vient AVANT qu'on demande de viser une faiblesse.
        expect(ids.indexOf('god-anatomy')).toBeLessThan(ids.indexOf('play-generator'));
    });

    it("laisse le joueur conclure le combat sans guidage devant les yeux", () => {
        expect(stepById('finish').dismissible).toBe(true);
    });

    it('place la bulle hors des zones à toucher quand elles couvrent tout l\'écran', () => {
        // Quand le spotlight couvre à la fois le haut et le bas, le placement automatique n'a
        // plus d'issue et renvoie la bulle sur la rangée ennemie.
        for (const id of ['play-generator', 'finish']) {
            expect(stepById(id).bubbleAnchor, `étape ${id}`).toBe('middle');
        }
    });
});

describe('avancement des étapes', () => {
    /** État minimal : seuls les champs lus par les prédicats comptent. */
    const state = (over: Record<string, unknown> = {}) => ({
        status: 'playing',
        currentPlayerId: 'p1',
        players: [
            { id: 'p1', hasPlayedCard: false, hasDiscardedForEnergy: false, gods: [] },
            { id: 'p2', gods: [{ currentHealth: 16, card: { maxHealth: 16 } }] },
        ],
        ...over,
    }) as unknown as GameState;

    it("ne franchit une étape QU'UNE seule fois, même réévaluée en boucle", () => {
        // Le cœur du bug : le store notifie plusieurs fois pour une seule action, et les
        // prédicats restent vrais après coup. Sans garde, on avançait de deux étapes.
        const step = stepById('play-generator');
        const played = state({
            players: [
                { id: 'p1', hasPlayedCard: true, hasDiscardedForEnergy: false, gods: [] },
                { id: 'p2', gods: [{ currentHealth: 16, card: { maxHealth: 16 } }] },
            ],
        });

        let advancedFrom: string | null = null;
        let advances = 0;
        for (let i = 0; i < 10; i++) {
            if (shouldAdvance(step, advancedFrom, played)) {
                advancedFrom = step.id;
                advances++;
            }
        }
        expect(advances).toBe(1);
    });

    it('en fait autant pour la défausse', () => {
        const step = stepById('discard');
        const discarded = state({
            players: [
                { id: 'p1', hasPlayedCard: false, hasDiscardedForEnergy: true, gods: [] },
                { id: 'p2', gods: [{ currentHealth: 16, card: { maxHealth: 16 } }] },
            ],
        });

        let advancedFrom: string | null = null;
        let advances = 0;
        for (let i = 0; i < 10; i++) {
            if (shouldAdvance(step, advancedFrom, discarded)) {
                advancedFrom = step.id;
                advances++;
            }
        }
        expect(advances).toBe(1);
    });

    it("n'avance pas tant que la condition n'est pas remplie", () => {
        expect(shouldAdvance(stepById('play-generator'), null, state())).toBe(false);
        expect(shouldAdvance(stepById('discard'), null, state())).toBe(false);
    });

    it('ignore les étapes explicatives, qui avancent au bouton Suivant', () => {
        expect(shouldAdvance(stepById('welcome'), null, state())).toBe(false);
    });
});

describe('mise en place du combat scripté', () => {
    it('donne au joueur plus de cartes que sa main ne peut en contenir', () => {
        // Avec un seul dieu, le deck comptait 5 cartes pour une main de 5 : la pioche était vide
        // dès le premier tour, la fatigue se déclenchait toute seule dès le tour 2, et l'étape
        // qui montre « vos cartes restantes en pioche » affichait invariablement 0.
        const deck = createDeck(['zeus', 'athena']);
        expect(deck.length).toBeGreaterThan(GAME_CONFIG.MAX_HAND_SIZE);
    });

    it('laisse une pioche non vide après la distribution initiale', () => {
        const engine = new GameEngine(GameEngine.createInitialState(
            'player1', 'Vous',
            ['zeus', 'athena'].map(g => getGodById(g)!), createDeck(['zeus', 'athena']),
            'player2', 'Adversaire',
            [getGodById('soldier_ares_1')!], createDeck(['soldier_ares_1']),
            'player1',
        ));

        const me = engine.getState().players[0];
        expect(me.hand.length).toBe(GAME_CONFIG.MAX_HAND_SIZE);
        expect(me.deck.length).toBeGreaterThan(0);
        expect(me.fatigueCounter).toBe(0);
    });
});
