import { describe, it, expect } from 'vitest';
import { UNIT_CARDS, UNIT_SPELLS } from '@/data/units';
import { unitPower, POWER_CEILING } from '@/data/units/power';
import { HP_BANDS } from '@/data/units/builders';

/**
 * Garde-fou sur la règle de design : un dieu est plus fort qu'une créature, elle-même plus
 * forte qu'un serviteur.
 *
 * On compare des BUDGETS (PV + menace), pas des PV : une créature-mur de 26 PV qui tape
 * faiblement doit pouvoir exister sans être classée « plus forte » qu'une créature de 20 PV
 * qui frappe fort.
 */

const servants = () => UNIT_CARDS.filter(u => u.category === 'servant');
const creatures = () => UNIT_CARDS.filter(u => u.category === 'creature');
const power = (u: (typeof UNIT_CARDS)[number]) => unitPower(u, UNIT_SPELLS);

describe('Bestiaire — intégrité des unités', () => {
    it('chaque unité possède exactement 5 sorts', () => {
        for (const u of UNIT_CARDS) {
            const own = UNIT_SPELLS.filter(s => s.godId === u.id);
            expect(own.length, `${u.id} a ${own.length} sorts`).toBe(5);
        }
    });

    it("n'a aucun identifiant d'unité ou de sort en double", () => {
        const unitIds = UNIT_CARDS.map(u => u.id);
        expect(new Set(unitIds).size, 'ids d\'unités dupliqués').toBe(unitIds.length);
        const spellIds = UNIT_SPELLS.map(s => s.id);
        expect(new Set(spellIds).size, 'ids de sorts dupliqués').toBe(spellIds.length);
    });

    it('rattache chaque unité à un dieu et lui donne un coût de Duel', () => {
        for (const u of UNIT_CARDS) {
            expect(u.affiliatedTo, `${u.id} sans dieu de rattachement`).toBeTruthy();
            expect(u.duelCost, `${u.id} sans coût de Duel`).toBe(u.category === 'servant' ? 2 : 3);
        }
    });

    it('ne cumule jamais energyGain et un effet energy sur la même carte', () => {
        // Le moteur applique les DEUX (GameEngine: `energy - cost + energyGain`, puis le cas
        // 'energy' du registre d'effets). Déclarer les deux double silencieusement l'énergie
        // produite -- exactement le bug qui s'était glissé dans les 54 générateurs du bestiaire.
        for (const s of UNIT_SPELLS) {
            const hasEnergyEffect = s.effects.some(e => e.type === 'energy');
            expect(
                s.energyGain > 0 && hasEnergyEffect,
                `${s.id} cumule energyGain=${s.energyGain} et un effet energy`
            ).toBe(false);
        }
    });

    it('respecte les bandes de PV de sa catégorie', () => {
        for (const u of servants()) {
            expect(u.maxHealth, `${u.id}`).toBeGreaterThanOrEqual(HP_BANDS.servant.min);
            expect(u.maxHealth, `${u.id}`).toBeLessThanOrEqual(HP_BANDS.servant.max);
        }
        for (const u of creatures()) {
            expect(u.maxHealth, `${u.id}`).toBeGreaterThanOrEqual(HP_BANDS.creature.min);
            expect(u.maxHealth, `${u.id}`).toBeLessThanOrEqual(HP_BANDS.creature.max);
        }
    });
});

describe('Bestiaire — hiérarchie de puissance', () => {
    it('garde chaque unité sous le plafond de sa catégorie', () => {
        for (const u of servants()) {
            expect(power(u), `serviteur ${u.id} trop puissant`).toBeLessThanOrEqual(POWER_CEILING.servant);
        }
        for (const u of creatures()) {
            expect(power(u), `créature ${u.id} trop puissante`).toBeLessThanOrEqual(POWER_CEILING.creature);
        }
    });

    it('rend le serviteur le plus fort moins puissant que la créature la plus faible', () => {
        const strongestServant = Math.max(...servants().map(power));
        const weakestCreature = Math.min(...creatures().map(power));
        expect(strongestServant, `serviteur max ${strongestServant} vs créature min ${weakestCreature}`)
            .toBeLessThan(weakestCreature);
    });
});
