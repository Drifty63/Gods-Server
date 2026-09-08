import { describe, it, expect } from 'vitest';
import { ALL_GODS, getGodById, getOwnerGodId, ownsCard, getReleasedUnits, getDuelCards } from '@/data/gods';

/**
 * Possession des cartes.
 *
 * Règle : un dieu s'achète en boutique ; une créature ou un serviteur ne s'achète PAS, il est
 * acquis en même temps que le dieu auquel il est rattaché. Acheter Arès donne ses Soldats et
 * le Dragon de Thèbes.
 *
 * Rien n'est stocké en base pour ça : la possession se DÉDUIT de `gods_owned`, donc aucune
 * migration ni changement des fonctions d'achat. Ces tests verrouillent cette déduction, en
 * particulier la remontée de chaîne (les Araignées Géantes dépendent d'Arachné, qui dépend
 * elle-même d'Athéna).
 */

const unit = (id: string) => {
    const card = getGodById(id);
    if (!card) throw new Error(`Unité introuvable : ${id}`);
    return card;
};

describe('getOwnerGodId', () => {
    it('rattache une unité directement affiliée à son dieu', () => {
        expect(getOwnerGodId(unit('soldier_ares_1'))).toBe('ares');
        expect(getOwnerGodId(unit('dragon_thebes'))).toBe('ares');
        expect(getOwnerGodId(unit('athena_knight'))).toBe('athena');
        expect(getOwnerGodId(unit('ulysses'))).toBe('hestia');
    });

    it("remonte la chaîne quand l'unité est affiliée à une AUTRE unité", () => {
        // Araignée Géante → Arachné (créature, pas un dieu) → Athéna.
        // Sans cette remontée, elle n'appartiendrait à personne et resterait inaccessible.
        expect(unit('giant_spider_1').affiliatedTo).toBe('arachne');
        expect(getOwnerGodId(unit('giant_spider_1'))).toBe('athena');
    });

    it('ne rattache rien pour un dieu du roster', () => {
        expect(getOwnerGodId(unit('zeus'))).toBeUndefined();
    });
});

describe('ownsCard', () => {
    it("n'accorde un dieu que s'il figure dans les achats", () => {
        expect(ownsCard(unit('zeus'), ['zeus'])).toBe(true);
        expect(ownsCard(unit('zeus'), ['ares'])).toBe(false);
    });

    it('accorde créature et serviteur avec le dieu correspondant', () => {
        const withAres = ['ares'];
        expect(ownsCard(unit('soldier_ares_1'), withAres)).toBe(true);
        expect(ownsCard(unit('dragon_thebes'), withAres)).toBe(true);
    });

    it("refuse les unités d'un dieu que le joueur ne possède pas", () => {
        const withAres = ['ares'];
        expect(ownsCard(unit('athena_knight'), withAres)).toBe(false);
        expect(ownsCard(unit('arachne'), withAres)).toBe(false);
        expect(ownsCard(unit('ulysses'), withAres)).toBe(false);
    });

    it("débloque la progéniture d'Arachné en achetant Athéna", () => {
        expect(ownsCard(unit('giant_spider_1'), ['athena'])).toBe(true);
        expect(ownsCard(unit('giant_spider_1'), ['ares'])).toBe(false);
    });

    it('accorde tout à un compte créateur', () => {
        expect(ownsCard(unit('dragon_thebes'), [], true)).toBe(true);
        expect(ownsCard(unit('zeus'), [], true)).toBe(true);
    });
});

describe('mode Duel', () => {
    it("ne propose que les unités des dieux réellement possédés", () => {
        const { creatures, servants } = getDuelCards(['ares'], false);
        expect(servants.map(s => s.id)).toEqual(['soldier_ares_1']);
        expect(creatures.map(c => c.id)).toEqual(['dragon_thebes']);
    });

    it('élargit la sélection à mesure que le joueur acquiert des dieux', () => {
        const { creatures, servants } = getDuelCards(['ares', 'athena', 'hestia'], false);
        expect(servants.map(s => s.id).sort()).toEqual(['athena_knight', 'soldier_ares_1']);
        expect(creatures.map(c => c.id).sort()).toEqual(['arachne', 'dragon_thebes', 'giant_spider_1', 'ulysses']);
    });

    it('ne propose aucune unité à un joueur sans dieu', () => {
        const { creatures, servants } = getDuelCards([], false);
        expect(servants).toHaveLength(0);
        expect(creatures).toHaveLength(0);
    });
});

describe('périmètre de la v1.0', () => {
    it("n'expose aucune unité encore à l'état de brouillon", () => {
        const { creatures, servants } = getReleasedUnits();
        for (const u of [...creatures, ...servants]) {
            expect(u.draft, `${u.id} ne doit pas être un brouillon`).toBeFalsy();
            expect(u.hidden, `${u.id} ne doit pas être masquée`).toBeFalsy();
        }
    });

    it('rattache chaque unité livrée à un dieu du roster, sinon elle est inobtenable', () => {
        const { creatures, servants } = getReleasedUnits();
        const rosterGodIds = new Set(
            ALL_GODS.filter(g => (!g.category || g.category === 'god') && !g.hidden).map(g => g.id),
        );

        for (const u of [...creatures, ...servants]) {
            const owner = getOwnerGodId(u);
            expect(owner, `${u.id} n'est rattachée à aucun dieu`).toBeDefined();
            expect(rosterGodIds.has(owner!), `${u.id} dépend de ${owner}, absent du roster jouable`).toBe(true);
        }
    });
});
