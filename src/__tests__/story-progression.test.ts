/**
 * Règles de progression du mode Histoire : ce qui débloque quoi.
 *
 * Trois bugs sont sortis d'ici le même jour — perdre un combat ouvrait le suivant, terminer
 * n'importe quel combat achevait le chapitre entier, et les identifiants codés en dur ne
 * couvraient que le chapitre 1. Tous partageaient une cause : la règle était déduite à trois
 * endroits au lieu d'être écrite une fois. Ces tests la fixent sur les VRAIES données de la
 * campagne, pas sur un décor de test — c'est la campagne qui doit rester cohérente.
 */
import { describe, it, expect } from 'vitest';
import { ZEUS_CAMPAIGN } from '@/data/story/campaign';
import {
    findBattleEvent, defeatAdvancesStory, isBattleUnlocked, isChapterFinished,
} from '@/data/story/progression';
import type { BattleResult, Chapter } from '@/types/story';

const chapter1 = ZEUS_CAMPAIGN.chapters.find(c => c.number === 1)!;
const won = (eventId: string): BattleResult => ({ eventId, won: true, attempts: 1 });
const lost = (eventId: string): BattleResult => ({ eventId, won: false, attempts: 1 });

/** L'identifiant de l'événement de combat d'une entrée de menu. */
const eventOf = (chapter: Chapter, battleId: string) =>
    findBattleEvent(chapter, chapter.battles!.find(b => b.id === battleId)!)!.id;

describe('Progression — reliage des combats', () => {
    it('retrouve l’événement de combat de chaque entrée de menu', () => {
        for (const chapter of ZEUS_CAMPAIGN.chapters) {
            if (chapter.comingSoon) continue;
            for (const battle of chapter.battles ?? []) {
                const event = findBattleEvent(chapter, battle);
                expect(event, `${chapter.id} / ${battle.id} : combat introuvable`).not.toBeNull();
                expect(event!.type).toBe('battle');
            }
        }
    });
});

describe('Progression — déblocage des combats', () => {
    it('ne débloque rien tant que le combat requis n’a pas été joué', () => {
        const battle2 = chapter1.battles!.find(b => b.id === 'battle2')!;
        expect(isBattleUnlocked(chapter1, battle2, [])).toBe(false);
    });

    it('PERDRE le combat 2 ne débloque pas le combat 3', () => {
        const battle3 = chapter1.battles!.find(b => b.id === 'battle3')!;
        expect(isBattleUnlocked(chapter1, battle3, [lost(eventOf(chapter1, 'battle2'))])).toBe(false);
    });

    it('gagner le combat 2 débloque le combat 3', () => {
        const battle3 = chapter1.battles!.find(b => b.id === 'battle3')!;
        expect(isBattleUnlocked(chapter1, battle3, [won(eventOf(chapter1, 'battle2'))])).toBe(true);
    });

    /*
     * Le prologue fait exception, et c'est voulu : ses deux issues convergent vers « Hadès prend
     * le trône ». Perdre y fait avancer l'histoire, donc la suite s'ouvre quand même.
     */
    it('perdre le combat 1 débloque quand même le combat 2, car l’histoire continue', () => {
        const battle2 = chapter1.battles!.find(b => b.id === 'battle2')!;
        expect(isBattleUnlocked(chapter1, battle2, [lost(eventOf(chapter1, 'battle1'))])).toBe(true);
    });

    it('reconnaît une défaite écrite d’une défaite qui impose de recommencer', () => {
        const ev1 = findBattleEvent(chapter1, chapter1.battles!.find(b => b.id === 'battle1')!)!;
        const ev2 = findBattleEvent(chapter1, chapter1.battles!.find(b => b.id === 'battle2')!)!;
        expect(defeatAdvancesStory(chapter1, ev1)).toBe(true);
        expect(defeatAdvancesStory(chapter1, ev2)).toBe(false);
    });
});

describe('Progression — fin de chapitre', () => {
    it('gagner un combat intermédiaire N’ACHÈVE PAS le chapitre', () => {
        for (const id of ['battle1', 'battle2', 'battle3']) {
            expect(
                isChapterFinished(chapter1, [won(eventOf(chapter1, id))]),
                `${id} ne doit pas suffire à terminer le chapitre`,
            ).toBe(false);
        }
    });

    it('seul le DERNIER combat remporté achève le chapitre', () => {
        const last = chapter1.battles![chapter1.battles!.length - 1];
        expect(isChapterFinished(chapter1, [won(eventOf(chapter1, last.id))])).toBe(true);
    });

    it('perdre le dernier combat n’achève pas le chapitre', () => {
        const last = chapter1.battles![chapter1.battles!.length - 1];
        expect(isChapterFinished(chapter1, [lost(eventOf(chapter1, last.id))])).toBe(false);
    });
});
