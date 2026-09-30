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
    findBattleEvent, defeatAdvancesStory, isBattleCleared, isBattleUnlocked, isChapterFinished,
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
                // Un combat annoncé mais pas encore écrit n'a pas d'événement : c'est justement
                // ce que `comingSoon` déclare, et ce qui l'empêche de se débloquer.
                if (battle.comingSoon) continue;
                const event = findBattleEvent(chapter, battle);
                expect(event, `${chapter.id} / ${battle.id} : combat introuvable`).not.toBeNull();
                expect(event!.type).toBe('battle');
            }
        }
    });

    /*
     * Le garde-fou qui compte : `isBattleCleared` renvoie `true` quand elle ne retrouve pas
     * l'événement d'un combat, pour ne pas verrouiller un chapitre sur une erreur de données. Un
     * combat à venir, dont l'événement n'existe PAS encore, tomberait donc dans cette branche et
     * débloquerait tout ce qui le suit.
     */
    it('un combat à venir reste fermé et ne débloque rien derrière lui', () => {
        const chapter3 = ZEUS_CAMPAIGN.chapters.find(c => c.number === 3)!;
        const pending = (chapter3.battles ?? []).filter(b => b.comingSoon);
        expect(pending.length).toBeGreaterThan(0);

        // Même en ayant gagné tout ce qui existe, rien de ce qui reste à écrire ne s'ouvre.
        const battle1 = chapter3.battles!.find(b => b.id === 'battle1')!;
        const allWon = [won(findBattleEvent(chapter3, battle1)!.id)];

        for (const battle of pending) {
            expect(isBattleCleared(chapter3, battle, allWon), `${battle.id} franchi`).toBe(false);
            expect(isBattleUnlocked(chapter3, battle, allWon), `${battle.id} ouvert`).toBe(false);
        }
    });

    it('ne considère pas le chapitre 3 comme terminé tant que son dernier combat n’existe pas', () => {
        const chapter3 = ZEUS_CAMPAIGN.chapters.find(c => c.number === 3)!;
        const battle1 = chapter3.battles!.find(b => b.id === 'battle1')!;
        const allWon = [won(findBattleEvent(chapter3, battle1)!.id)];
        expect(isChapterFinished(chapter3, allWon)).toBe(false);
    });

    /*
     * Ce que l'écran de combat lit désormais pour choisir son dialogue de fin.
     *
     * Il tenait avant sa propre chaîne de `if` sur l'identifiant du combat, avec le duel
     * Zeus-Hadès en repli : tout combat oublié dans cette chaîne rejouait le dialogue du combat 1
     * du chapitre 1, à la victoire comme à la défaite. Maintenant qu'il lit `nextEventOnWin` et
     * `nextEventOnLose`, ces deux champs doivent exister partout et mener à des dialogues.
     */
    it('donne à CHAQUE combat un dialogue de victoire ET un de défaite', () => {
        for (const chapter of ZEUS_CAMPAIGN.chapters) {
            const byId = new Map(chapter.events.map(e => [e.id, e]));

            for (const event of chapter.events.filter(e => e.type === 'battle')) {
                for (const [issue, nextId] of [
                    ['victoire', event.nextEventOnWin],
                    ['défaite', event.nextEventOnLose],
                ] as const) {
                    const where = `${chapter.id} / ${event.id} / ${issue}`;
                    expect(nextId, `${where} : aucune suite`).toBeTruthy();

                    const outcome = byId.get(nextId!);
                    expect(outcome, `${where} : « ${nextId} » n'existe pas`).toBeTruthy();
                    expect(outcome!.dialogues?.length ?? 0, `${where} : sans dialogue`).toBeGreaterThan(0);
                }
            }
        }
    });

    /*
     * L'écran de fin de combat lit ce fond directement sur l'événement d'issue.
     *
     * Il venait avant de DEUX cascades de `if` — une pour le dialogue d'après-combat, une pour
     * l'écran de victoire/défaite — qui recopiaient la même table que celle des dialogues.
     * Corriger la première laissait donc les deux autres en place, et le Chant des Récifs
     * affichait ses bonnes répliques sur l'image du duel Zeus-Hadès.
     */
    it('donne un FOND à chaque issue de combat', () => {
        for (const chapter of ZEUS_CAMPAIGN.chapters) {
            const byId = new Map(chapter.events.map(e => [e.id, e]));
            for (const event of chapter.events.filter(e => e.type === 'battle')) {
                for (const nextId of [event.nextEventOnWin, event.nextEventOnLose]) {
                    const outcome = byId.get(nextId!);
                    expect(outcome?.backgroundImage, `${chapter.id} / ${nextId} : sans fond`).toBeTruthy();
                }
            }
        }
    });

    it('ne fait pas mener deux combats au MÊME dialogue de fin', () => {
        // Le symptôme du défaut corrigé : plusieurs combats affichaient la même scène de fin.
        for (const chapter of ZEUS_CAMPAIGN.chapters) {
            const outcomes = chapter.events
                .filter(e => e.type === 'battle')
                .flatMap(e => [e.nextEventOnWin, e.nextEventOnLose])
                .filter(Boolean);
            expect(new Set(outcomes).size, `${chapter.id} : dialogue de fin partagé`).toBe(outcomes.length);
        }
    });

    /*
     * Une chaîne d'événements se rompt sur une faute de frappe, et le symptôme est muet :
     * `getNextEvent` renvoie `undefined`, et le mode Histoire conclut « fin de séquence » au
     * milieu d'une scène. Le combat 1 du chapitre 3 en enchaîne dix, dont trois pour la seule
     * embuscade.
     */
    it('ne laisse aucun enchaînement pointer dans le vide', () => {
        for (const chapter of ZEUS_CAMPAIGN.chapters) {
            const ids = new Set(chapter.events.map(e => e.id));
            for (const event of chapter.events) {
                if (!event.nextEventId) continue;
                expect(ids.has(event.nextEventId), `${chapter.id} / ${event.id} → « ${event.nextEventId} » n'existe pas`).toBe(true);
            }
        }
    });

    it('n’attribue pas deux fois le même identifiant d’événement', () => {
        for (const chapter of ZEUS_CAMPAIGN.chapters) {
            const ids = chapter.events.map(e => e.id);
            expect(new Set(ids).size, `${chapter.id} : identifiant en double`).toBe(ids.length);
        }
    });

    it('mène la séquence du combat 1 du chapitre 3 jusqu’au combat', () => {
        const chapter3 = ZEUS_CAMPAIGN.chapters.find(c => c.number === 3)!;
        const battle1 = chapter3.battles!.find(b => b.id === 'battle1')!;
        expect(findBattleEvent(chapter3, battle1)?.id).toBe('ch3_battle1_fight');
    });

    it('ouvre bien le premier combat du chapitre 3', () => {
        const chapter3 = ZEUS_CAMPAIGN.chapters.find(c => c.number === 3)!;
        const battle1 = chapter3.battles!.find(b => b.id === 'battle1')!;
        expect(chapter3.comingSoon).toBeFalsy();
        expect(isBattleUnlocked(chapter3, battle1, [])).toBe(true);
        expect(findBattleEvent(chapter3, battle1)!.battle!.enemyTeam).toHaveLength(4);
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
