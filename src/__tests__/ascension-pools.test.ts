import { describe, it, expect } from 'vitest';
import { enemyPools, isTierBoundary, TIER_END_FLOORS, ascensionFloorBonus, TOTAL_FIRST_CLEAR_BONUS, TOTAL_FLOORS } from '@/data/ascension';
import { ALL_GODS } from '@/data/gods';

/**
 * Réservoirs d'adversaires et paliers de l'Ascension.
 *
 * Deux règles s'y croisent, et elles tirent en sens inverse :
 *  - il faut assez d'unités DISTINCTES pour remplir un étage, faute de quoi deux adversaires
 *    partageraient le même id et le ciblage — qui identifie les dieux par leur id — ne saurait
 *    plus lequel viser ;
 *  - il ne faut pas y admettre les variantes affaiblies du mode Histoire, qui contredisent la
 *    fiche publique de la carte.
 */

describe("réservoirs d'adversaires", () => {
    const pools = enemyPools();

    it("n'oppose jamais une variante affaiblie du mode Histoire", () => {
        // Les Araignées Géantes scénarisées ont 12 PV là où la carte publique en a 21 : les
        // croiser en Ascension contredit ce que la Collection annonce au joueur.
        const all = [...pools.servant, ...pools.creature, ...pools.god];
        for (const unit of all) {
            const twin = ALL_GODS.find(g => !g.hidden && !g.draft && g.name === unit.name && g.id !== unit.id);
            if (unit.hidden && twin) {
                expect(unit.maxHealth, `${unit.id} doit valoir sa jumelle publique`).toBe(twin.maxHealth);
                expect(unit.category, `${unit.id} doit avoir la catégorie de sa jumelle`).toBe(twin.category);
            }
        }
    });

    it('admet en revanche les copies conformes créées pour le mode Histoire', () => {
        // Les Soldats d'Arès 2 et 3 sont au mot près le soldat public : rien ne justifie de les
        // écarter, et ils sont indispensables pour remplir les étages sans doublon d'id.
        const servantIds = pools.servant.map(u => u.id);
        expect(servantIds).toContain('soldier_ares_2');
        expect(servantIds).toContain('soldier_ares_3');
    });

    it('écarte explicitement les araignées affaiblies', () => {
        const ids = [...pools.servant, ...pools.creature].map(u => u.id);
        expect(ids).not.toContain('giant_spider_2');
        expect(ids).not.toContain('giant_spider_3');
        expect(ids).toContain('giant_spider_1');
    });
});

describe('paliers et soin', () => {
    it('place les frontières de palier en fin de chaque tier', () => {
        // 1-5 serviteurs, 6-12 créatures, 13-15 dieux : on soigne donc après 5 et après 12.
        expect(TIER_END_FLOORS).toEqual([5, 12]);
        expect(isTierBoundary(5)).toBe(true);
        expect(isTierBoundary(12)).toBe(true);
    });

    it('ne soigne pas au milieu d\'un palier ni au sommet', () => {
        for (const floor of [1, 2, 4, 6, 11, 13, 14, 15]) {
            expect(isTierBoundary(floor), `étage ${floor}`).toBe(false);
        }
    });
});

describe('barème de première ascension', () => {
    it('applique 100 / 200 / 600 selon le palier', () => {
        expect([1, 5].map(ascensionFloorBonus)).toEqual([100, 100]);
        expect([6, 10].map(ascensionFloorBonus)).toEqual([200, 200]);
        expect([11, 15].map(ascensionFloorBonus)).toEqual([600, 600]);
    });

    it('ne rapporte rien hors de la tour', () => {
        expect(ascensionFloorBonus(0)).toBe(0);
        expect(ascensionFloorBonus(TOTAL_FLOORS + 1)).toBe(0);
    });

    it('totalise 4500 pour une tour entière', () => {
        expect(TOTAL_FIRST_CLEAR_BONUS).toBe(500 + 1000 + 3000);
    });
});
