import type { Chapter, ChapterBattle, StoryEvent, BattleResult } from '@/types/story';

/**
 * Règles de PROGRESSION du mode Histoire : ce qui débloque quoi.
 *
 * Elles vivaient en trois endroits — le magasin, la page de sélection, et implicitement dans
 * les données — avec des définitions divergentes, ce qui a produit deux bugs le même jour :
 * perdre un combat débloquait le suivant, et terminer n'importe quel combat marquait le
 * chapitre entier comme achevé. Une seule définition, ici, et les deux appelants la lisent.
 */

/**
 * L'événement de COMBAT contenu dans une entrée de menu.
 *
 * `firstEventId` désigne le début d'une séquence — une narration, le plus souvent. On suit la
 * chaîne jusqu'à l'affrontement lui-même. `seen` protège d'une boucle dans les données, qui
 * figerait la page au lieu de signaler l'erreur.
 */
export function findBattleEvent(chapter: Chapter, battle: ChapterBattle): StoryEvent | null {
    const byId = new Map(chapter.events.map(e => [e.id, e]));
    const seen = new Set<string>();
    let id: string | undefined = battle.firstEventId;

    while (id && !seen.has(id)) {
        seen.add(id);
        const event: StoryEvent | undefined = byId.get(id);
        if (!event) return null;
        if (event.type === 'battle') return event;
        id = event.nextEventId ?? event.nextEventOnWin;
    }
    return null;
}

/**
 * Une défaite fait-elle AVANCER l'histoire, ou faut-il recommencer ?
 *
 * La question se lit dans les données, sans identifiant codé en dur : si la branche de défaite
 * mène quelque part, la défaite était écrite — c'est le cas du premier combat du prologue,
 * après lequel Hadès prend le trône qu'on ait gagné ou non. Si elle ne mène nulle part, le
 * joueur doit réessayer.
 */
export function defeatAdvancesStory(chapter: Chapter, battleEvent: StoryEvent): boolean {
    if (!battleEvent.nextEventOnLose) return false;
    const afterDefeat = chapter.events.find(e => e.id === battleEvent.nextEventOnLose);
    return !!afterDefeat?.nextEventId;
}

/** Ce combat de menu a-t-il été franchi ? */
export function isBattleCleared(
    chapter: Chapter,
    battle: ChapterBattle,
    results: BattleResult[],
): boolean {
    // Un combat pas encore écrit ne peut pas être franchi — et ne débloque donc rien derrière lui.
    if (battle.comingSoon) return false;

    const event = findBattleEvent(chapter, battle);
    // Données incomplètes : on ne verrouille pas faute d'avoir su relier le combat.
    if (!event) return true;

    const result = results.find(r => r.eventId === event.id);
    if (!result) return false;

    return result.won || defeatAdvancesStory(chapter, event);
}

/** Ce combat est-il accessible depuis le menu du chapitre ? */
export function isBattleUnlocked(
    chapter: Chapter,
    battle: ChapterBattle,
    results: BattleResult[],
): boolean {
    // Prioritaire sur `unlocked` : un combat à venir reste fermé quoi qu'annoncent ses données.
    if (battle.comingSoon) return false;
    if (battle.unlocked) return true;
    if (!battle.requiresBattleId) return true;

    const required = chapter.battles?.find(b => b.id === battle.requiresBattleId);
    if (!required) return true;

    return isBattleCleared(chapter, required, results);
}

/**
 * Le chapitre est-il RÉELLEMENT terminé ?
 *
 * La question se posait autrement, et c'était le bug : le magasin concluait « fin du chapitre »
 * dès qu'un événement n'avait plus de suite. Or la séquence de CHAQUE combat se termine ainsi —
 * le dialogue de victoire du combat 3 ne mène nulle part, exactement comme celui du dernier.
 * Gagner le troisième combat ouvrait donc le chapitre suivant, et réclamait sa récompense.
 *
 * Un chapitre s'achève avec son DERNIER combat, et seulement en le remportant : une victoire,
 * jamais une défaite scénarisée, parce qu'on ne termine pas une histoire en la perdant.
 */
export function isChapterFinished(chapter: Chapter, results: BattleResult[]): boolean {
    const battles = chapter.battles;
    // Un chapitre sans combats est purement narratif : le traverser suffit à l'achever.
    if (!battles || battles.length === 0) return true;

    const last = battles[battles.length - 1];
    const event = findBattleEvent(chapter, last);
    if (!event) return false;

    return results.some(r => r.eventId === event.id && r.won);
}
