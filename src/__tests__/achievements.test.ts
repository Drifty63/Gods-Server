import { describe, it, expect } from 'vitest';
import {
    ACHIEVEMENTS, FAMILY_LABELS, newlyUnlocked, getAchievement,
    type AchievementProfile,
} from '@/data/achievements';

/** Profil témoin : rien de débloqué, aucun prédicat ne doit s'y déclencher. */
function blankProfile(over: Partial<AchievementProfile> = {}): AchievementProfile {
    return {
        gods_owned: [],
        stats: { victories: 0, defeats: 0, totalGames: 0, currentStreak: 0, bestStreak: 0 },
        ferveur: 0,
        ferveur_max: 0,
        ascension_best_floor: 0,
        god_play_counts: {},
        completedChapters: [],
        ...over,
    };
}

describe('catalogue des hauts faits', () => {
    it('un profil vierge ne débloque rien', () => {
        const p = blankProfile();
        for (const a of ACHIEVEMENTS) {
            expect(a.isUnlocked(p), `${a.id} ne devrait pas se déclencher sur un profil vierge`).toBe(false);
        }
    });

    it('chaque identifiant est unique', () => {
        const ids = ACHIEVEMENTS.map(a => a.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('chaque haut fait appartient à une famille nommée', () => {
        for (const a of ACHIEVEMENTS) {
            expect(FAMILY_LABELS[a.family], `famille manquante pour ${a.id}`).toBeTruthy();
        }
    });

    it('chaque prédicat se déclenche sur le profil qui le mérite', () => {
        // Un profil « tout accompli » : chaque seuil du catalogue est franchi.
        const complete = blankProfile({
            gods_owned: [
                'poseidon', 'zeus', 'nyx', 'hestia', 'athena', 'demeter',
                'dionysos', 'hades', 'apollon', 'ares', 'artemis', 'aphrodite',
            ],
            stats: { victories: 100, defeats: 10, totalGames: 110, currentStreak: 10, bestStreak: 10 },
            ferveur: 3000,
            ferveur_max: 3000,
            ascension_best_floor: 15,
            god_play_counts: { zeus: 50 },
            completedChapters: ['chapter1', 'chapter2', 'chapter3', 'chapter4'],
            friendCount: 25,
        });
        for (const a of ACHIEVEMENTS) {
            expect(a.isUnlocked(complete), `${a.id} devrait se déclencher`).toBe(true);
        }
    });
});

describe('hauts faits de collection', () => {
    it('les créatures et serviteurs ne comptent pas comme des dieux', () => {
        // Le piège : `gods_owned` mélange les trois familles. Sans filtre, douze unités
        // débloqueraient « Panthéon complet » sans posséder un seul dieu.
        const units = blankProfile({
            gods_owned: [
                'soldier_ares_1', 'soldier_ares_2', 'soldier_ares_3', 'dragon_thebes',
                'giant_spider_1', 'giant_spider_2', 'giant_spider_3', 'athena_knight',
                'arachne', 'card_ulysses', 'soldier_ares_1', 'dragon_thebes',
            ],
        });
        expect(getAchievement('collection_full')!.isUnlocked(units)).toBe(false);
        expect(getAchievement('collection_first')!.isUnlocked(units)).toBe(false);
    });

    it('douze dieux de base débloquent le panthéon complet', () => {
        const p = blankProfile({
            gods_owned: [
                'poseidon', 'zeus', 'nyx', 'hestia', 'athena', 'demeter',
                'dionysos', 'hades', 'apollon', 'ares', 'artemis', 'aphrodite',
            ],
        });
        expect(getAchievement('collection_full')!.isUnlocked(p)).toBe(true);
        expect(getAchievement('collection_half')!.isUnlocked(p)).toBe(true);
    });
});

describe('hauts faits de classement', () => {
    it('une remise à zéro de saison ne retire pas le palier atteint', () => {
        // C'est tout l'intérêt de `ferveur_max` : après la clôture d'une saison, `ferveur`
        // repart de zéro, mais le joueur a bel et bien atteint le Diamant.
        const p = blankProfile({ ferveur: 0, ferveur_max: 1600 });
        expect(getAchievement('rank_diamant')!.isUnlocked(p)).toBe(true);
        expect(getAchievement('rank_demigod')!.isUnlocked(p)).toBe(false);
    });
});

describe('newlyUnlocked', () => {
    it('ne renvoie que ce qui manque au profil', () => {
        const p = blankProfile({
            stats: { victories: 1, defeats: 0, totalGames: 1, currentStreak: 1, bestStreak: 1 },
        });
        expect(newlyUnlocked(p, [])).toEqual(['combat_first_win']);
        expect(newlyUnlocked(p, ['combat_first_win'])).toEqual([]);
    });

    it('ignore un identifiant enregistré qui ne figure plus au catalogue', () => {
        // Un haut fait retiré du catalogue ne doit pas faire échouer l'évaluation des autres.
        const p = blankProfile();
        expect(newlyUnlocked(p, ['haut_fait_disparu'])).toEqual([]);
    });
});
