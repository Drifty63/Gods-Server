import { describe, it, expect } from 'vitest';
import { TUTORIAL_STEPS, type SpotlightTarget } from '@/data/tutorial';
import { getSpellsByGodId } from '@/data/spells';

/**
 * Cohérence du scénario du didacticiel.
 *
 * Le didacticiel était infranchissable à l'étape « À vous de jouer » : elle demandait de lancer
 * un sort, mais n'éclairait que la main. Les dieux ennemis — qu'il faut obligatoirement toucher,
 * les deux générateurs de Zeus ciblant `enemy_god` — restaient sous un voile qui, à l'époque,
 * captait les clics. L'écran devenait totalement inerte.
 *
 * Ces tests verrouillent les deux conditions qui rendaient l'étape impossible.
 */

const spotlightOf = (step: { spotlight: SpotlightTarget | SpotlightTarget[] }): SpotlightTarget[] =>
    Array.isArray(step.spotlight) ? step.spotlight : [step.spotlight];

const stepById = (id: string) => {
    const step = TUTORIAL_STEPS.find(s => s.id === id);
    if (!step) throw new Error(`Étape introuvable : ${id}`);
    return step;
};

describe('scénario du didacticiel', () => {
    it('a des identifiants d\'étape uniques', () => {
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
            expect(spotlight, `étape ${id}`).toContain('card-actions');
            expect(spotlight, `étape ${id}`).toContain('enemy-gods');
        }
    });

    it('éclaire la main ET les boutons du panneau sur l\'étape de défausse', () => {
        const spotlight = spotlightOf(stepById('discard'));
        expect(spotlight).toContain('hand');
        expect(spotlight).toContain('card-actions');
    });

    it("confirme que les générateurs de Zeus exigent bien une cible ennemie", () => {
        // C'est la raison de fond pour laquelle « enemy-gods » ne peut pas être omis : si un jour
        // les générateurs de Zeus cessaient de cibler l'ennemi, ce test le signalerait.
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
    });

    it("explique la couleur du cadre, et pas seulement l'icône de faiblesse", () => {
        const ids = TUTORIAL_STEPS.map(s => s.id);
        expect(ids).toContain('god-anatomy');
        // La lecture de la carte vient AVANT qu'on demande de viser une faiblesse.
        expect(ids.indexOf('god-anatomy')).toBeLessThan(ids.indexOf('play-generator'));
    });
});
