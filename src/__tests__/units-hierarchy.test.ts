import { describe, it, expect } from 'vitest';
import { UNIT_CARDS, UNIT_SPELLS } from '@/data/units';
import { unitPower, POWER_CEILING } from '@/data/units/power';
import { HP_BANDS } from '@/data/units/builders';
import { ALL_GODS } from '@/data/gods';
import { ALL_SPELLS } from '@/data/spells';
import type { GodCard } from '@/types/cards';

/**
 * Garde-fou sur la règle de design : un dieu est plus fort qu'une créature, elle-même plus
 * forte qu'un serviteur.
 *
 * La règle porte sur les PLAFONDS de chaque catégorie, pas sur chaque paire d'unités : une
 * créature-mur peut légitimement avoir plus de PV qu'un dieu fragile (Hadès et Artémis sont à
 * 20 PV, et Apollon plafonne à 1 dégât — leur puissance est dans le contrôle, pas dans la
 * frappe). Exiger l'ordre paire à paire serait d'ailleurs impossible sans réécrire le roster.
 *
 * Ce qui doit rester vrai, en revanche : aucun serviteur ne dépasse la meilleure créature, et
 * aucune créature ne dépasse le meilleur dieu — ni en PV, ni en dégâts.
 */

const servants = () => UNIT_CARDS.filter(u => u.category === 'servant');
const creatures = () => UNIT_CARDS.filter(u => u.category === 'creature');
const power = (u: (typeof UNIT_CARDS)[number]) => unitPower(u, UNIT_SPELLS);

/** Toutes les unités d'une catégorie, roster de base inclus (pas seulement le bestiaire). */
const inCategory = (c: 'god' | 'creature' | 'servant') =>
    ALL_GODS.filter(u => (u.category ?? 'god') === c);

const maxHp = (units: GodCard[]) => Math.max(...units.map(u => u.maxHealth));

/**
 * ANGLE MORT ASSUMÉ de toutes les mesures de ce fichier : seuls les effets *déclarés*
 * (`damage`, `heal`) sont visibles. Les effets `custom` ne portent pas de valeur lisible, et
 * la moitié des sorts de dieux en utilisent (ex: `tsunami_damage`, `cascade_heal_choice`)
 * contre aucun des 240 sorts du bestiaire.
 *
 * Conséquence : le plafond des DIEUX est systématiquement sous-estimé. L'erreur va donc dans
 * le sens prudent — un dépassement réel du bestiaire sera toujours détecté ; en revanche un
 * échec de ces tests peut être un faux positif dû à un dieu dont la puissance vit dans un
 * effet custom. À vérifier avant de « corriger » les données.
 */

/** Cibles adverses. Le reste (soi-même, alliés) n'est pas de l'offensive. */
const OFFENSIVE_TARGETS = new Set(['enemy_god', 'all_enemies', 'any_god', 'same', undefined]);

/** Sorts indexés par propriétaire : évite de reparcourir ALL_SPELLS pour chacune des 68 unités. */
const SPELLS_BY_OWNER = ALL_SPELLS.reduce((map, spell) => {
    const owned = map.get(spell.godId);
    if (owned) owned.push(spell); else map.set(spell.godId, [spell]);
    return map;
}, new Map<string, typeof ALL_SPELLS>());

const spellsOf = (unitId: string) => SPELLS_BY_OWNER.get(unitId) ?? [];

/**
 * Meilleur dégât OFFENSIF d'une unité pour une portée donnée.
 *
 * Les dégâts que l'unité s'inflige à elle-même sont exclus : « Dernier recours » d'Arès se
 * coûte 5 PV (`target: 'self'`), ce qui gonflait à tort son score de frappeur.
 */
function maxDamage(units: GodCard[], scope: 'mono' | 'aoe'): number {
    let best = 0;
    for (const unit of units) {
        for (const spell of spellsOf(unit.id)) {
            for (const effect of spell.effects) {
                if (effect.type !== 'damage') continue;
                if (!OFFENSIVE_TARGETS.has(effect.target)) continue;
                const isAoe = effect.target === 'all_enemies';
                if (isAoe === (scope === 'aoe')) best = Math.max(best, effect.value ?? 0);
            }
        }
    }
    return best;
}

/**
 * Refuse une mesure vide. `maxDamage`/`Math.max` renvoient 0 ou -Infinity quand rien ne
 * correspond, ce qui ferait passer une comparaison sans rien vérifier le jour où une
 * catégorie se vide.
 */
function measured(value: number, label: string): number {
    expect(Number.isFinite(value) && value > 0, `mesure vide pour ${label}`).toBe(true);
    return value;
}

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

    /**
     * Plafond de dégâts de ZONE, relevé sur les 20 dieux du roster : toutes leurs cartes de zone
     * à 0 ou 1 énergie infligent 1 dégât (17 cartes, sans exception), et seul le coût 3 monte à 3
     * (le Foudroiement de Zeus, son ultime).
     *
     * Une créature ou un serviteur ne doit jamais dépasser ce qu'un DIEU se permet au même prix.
     * Sans ce garde-fou, deux créatures faisaient 3 dégâts de zone pour 1 énergie — soit jusqu'à
     * 12 dégâts sur une équipe de 4, là où un dieu en fait 1.
     */
    const AOE_CEILING: Record<number, { servant: number; creature: number }> = {
        0: { servant: 1, creature: 1 },
        1: { servant: 1, creature: 1 },
        3: { servant: 2, creature: 3 },
    };

    it('ne laisse aucune carte de zone dépasser le plafond du roster', () => {
        for (const spell of UNIT_SPELLS) {
            const unit = UNIT_CARDS.find(u => u.id === spell.godId);
            if (!unit || unit.category === 'god') continue;
            const ceiling = AOE_CEILING[spell.energyCost]?.[unit.category === 'servant' ? 'servant' : 'creature'];
            if (ceiling === undefined) continue;

            for (const effect of spell.effects) {
                if (effect.type !== 'damage' || effect.target !== 'all_enemies') continue;
                expect(
                    effect.value ?? 0,
                    `${spell.id} (${unit.category}, ${spell.energyCost}⚡) : ${effect.value} dégâts de zone > plafond ${ceiling}`,
                ).toBeLessThanOrEqual(ceiling);
            }
        }
    });

    it('respecte la courbe de coûts 0/0/1/1/3 de tout le roster', () => {
        for (const u of UNIT_CARDS) {
            const costs = UNIT_SPELLS.filter(s => s.godId === u.id)
                .map(s => s.energyCost)
                .sort((a, b) => a - b);
            expect(costs, `${u.id} : courbe de coûts ${costs.join(',')}`).toEqual([0, 0, 1, 1, 3]);
        }
    });

    it('donne 2 générateurs, 2 compétences et 1 utilitaire à chaque unité', () => {
        for (const u of UNIT_CARDS) {
            const own = UNIT_SPELLS.filter(s => s.godId === u.id);
            const count = (t: string) => own.filter(s => s.type === t).length;
            expect(count('generator'), `${u.id} générateurs`).toBe(2);
            expect(count('competence'), `${u.id} compétences`).toBe(2);
            expect(count('utility'), `${u.id} utilitaires`).toBe(1);
        }
    });

    it('ne fait produire de l\'énergie qu\'aux générateurs, jamais aux cartes payantes', () => {
        for (const s of UNIT_SPELLS) {
            if (s.type === 'generator') {
                expect(s.energyGain, `${s.id} devrait produire de l'énergie`).toBeGreaterThan(0);
            } else {
                expect(s.energyGain, `${s.id} ne devrait pas produire d'énergie`).toBe(0);
            }
        }
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

/**
 * Ordre dieu > créature > serviteur À ARCHÉTYPE ÉGAL.
 *
 * C'est la lecture juste de la règle : on ne compare que ce qui est comparable. Apollon
 * plafonne à 1 dégât sans être faible (c'est un dieu de contrôle), donc le confronter à une
 * créature frappeuse ne prouve rien. En revanche, un serviteur glass cannon qui tape aussi fort
 * que la meilleure créature glass cannon est une vraie anomalie — c'était le cas avant ce test
 * (5 contre 5).
 *
 * Chaque archétype est jugé sur la statistique qui le définit.
 */
describe('Hiérarchie à archétype égal', () => {
    /**
     * Somme des soins d'une unité : soin direct ET régénération, celle-ci comptée sur toute sa
     * durée (elle rend `stacks` PV par tour). Un soin de zone touche jusqu'à 4 alliés : ×3.
     *
     * Ne voit toujours pas les soins portés par un effet `custom` — c'est le cas de Sélène
     * (cascade, résurrection) et d'une partie de Déméter, qui sont donc sous-évaluées. Voir
     * l'avertissement en tête de fichier.
     */
    function totalHeal(unit: GodCard): number {
        let total = 0;
        for (const spell of spellsOf(unit.id)) {
            for (const e of spell.effects) {
                const spread = e.target === 'all_allies' ? 3 : 1;
                if (e.type === 'heal') total += (e.value ?? 0) * spread;
                if (e.type === 'status' && e.status === 'regen') {
                    total += (e.value ?? 0) * (e.statusDuration ?? 1) * spread;
                }
            }
        }
        return total;
    }

    const withArchetype = (c: 'god' | 'creature' | 'servant', a: string) =>
        inCategory(c).filter(u => u.archetype === a);

    /** Plafond d'un archétype dans une catégorie, en échouant si la case est vide. */
    function ceiling(
        archetype: 'glass_cannon' | 'tank' | 'support',
        category: 'god' | 'creature' | 'servant',
        metric: (u: GodCard) => number,
    ): number {
        const units = withArchetype(category, archetype);
        // Deux façons de mesurer du vide, toutes deux fatales au test : plus aucune unité de cet
        // archétype, ou des unités dont la statistique mesurée est nulle (voir `measured`).
        expect(units.length, `aucun ${archetype} chez les ${category}`).toBeGreaterThan(0);
        return measured(Math.max(...units.map(metric)), `${archetype} ${category}`);
    }

    it('fait frapper les glass cannons plus fort à chaque palier', () => {
        const metric = (u: GodCard) => maxDamage([u], 'mono');
        const s = ceiling('glass_cannon', 'servant', metric);
        const c = ceiling('glass_cannon', 'creature', metric);
        const g = ceiling('glass_cannon', 'god', metric);

        expect(s, `serviteur ${s} vs créature ${c}`).toBeLessThan(c);
        expect(c, `créature ${c} vs dieu ${g}`).toBeLessThan(g);
    });

    it('rend les tanks plus robustes à chaque palier', () => {
        const metric = (u: GodCard) => u.maxHealth;
        const s = ceiling('tank', 'servant', metric);
        const c = ceiling('tank', 'creature', metric);
        const g = ceiling('tank', 'god', metric);

        expect(s, `serviteur ${s} PV vs créature ${c} PV`).toBeLessThan(c);
        expect(c, `créature ${c} PV vs dieu ${g} PV`).toBeLessThan(g);
    });

    it('rend les supports plus efficaces à chaque palier', () => {
        const s = ceiling('support', 'servant', totalHeal);
        const c = ceiling('support', 'creature', totalHeal);
        const g = ceiling('support', 'god', totalHeal);

        expect(s, `serviteur ${s} soins vs créature ${c}`).toBeLessThan(c);
        expect(c, `créature ${c} soins vs dieu ${g}`).toBeLessThan(g);
    });

    /**
     * L'étiquette doit vouloir dire quelque chose DANS son propre palier : sans ce contrôle, un
     * tank n'est jugé que sur ses PV et ses dégâts ne sont bornés par rien. L'Hoplite (tank)
     * égalait ainsi les meilleurs serviteurs glass cannon, et Pégase (support) frappait aussi
     * fort que Persée, le glass cannon de sa catégorie.
     */
    it('laisse le glass cannon frapper plus fort que les autres rôles de son palier', () => {
        for (const category of ['servant', 'creature', 'god'] as const) {
            const glass = ceiling('glass_cannon', category, u => maxDamage([u], 'mono'));

            for (const other of ['tank', 'support'] as const) {
                const rival = ceiling(other, category, u => maxDamage([u], 'mono'));
                expect(rival, `${other} ${category} frappe à ${rival}, le glass cannon à ${glass}`)
                    .toBeLessThan(glass);
            }
        }
    });
});

/**
 * Ordre dieu > créature > serviteur sur les statistiques brutes, catégorie par catégorie.
 *
 * Ces bornes n'étaient vérifiées par rien : le bestiaire pouvait grossir jusqu'à produire un
 * serviteur plus robuste que la meilleure créature, ou une créature frappant plus fort que
 * n'importe quel dieu, sans qu'aucun test ne bronche.
 */
describe('Hiérarchie dieu > créature > serviteur (PV et dégâts)', () => {
    it('ordonne les PV maximum des trois catégories', () => {
        const s = maxHp(inCategory('servant'));
        const c = maxHp(inCategory('creature'));
        const g = maxHp(inCategory('god'));

        expect(s, `serviteur le plus robuste ${s} PV vs créature ${c} PV`).toBeLessThan(c);
        expect(c, `créature la plus robuste ${c} PV vs dieu ${g} PV`).toBeLessThan(g);
    });

    it('ne laisse aucune créature être plus frêle que le meilleur serviteur', () => {
        const toughestServant = maxHp(inCategory('servant'));
        const frailestCreature = Math.min(...inCategory('creature').map(u => u.maxHealth));

        // C'est ce contrôle qui manquait : la nuée d'araignées d'Arachné était classée
        // « créature » à 12 PV, donc plus fragile que n'importe quel serviteur du jeu. Ces
        // figurantes sont désormais des serviteurs, et l'araignée jouable une vraie créature.
        expect(frailestCreature, `créature la plus frêle ${frailestCreature} PV vs serviteur ${toughestServant} PV`)
            .toBeGreaterThan(toughestServant);
    });

    it('ordonne les dégâts mono-cible maximum des trois catégories', () => {
        const s = measured(maxDamage(inCategory('servant'), 'mono'), 'dégâts serviteurs');
        const c = measured(maxDamage(inCategory('creature'), 'mono'), 'dégâts créatures');
        const g = measured(maxDamage(inCategory('god'), 'mono'), 'dégâts dieux');

        expect(s, `serviteur frappe à ${s} vs créature ${c}`).toBeLessThan(c);
        expect(c, `créature frappe à ${c} vs dieu ${g}`).toBeLessThan(g);
    });

    it('ne laisse aucune catégorie dépasser la suivante en dégâts de zone', () => {
        const s = measured(maxDamage(inCategory('servant'), 'aoe'), 'zone serviteurs');
        const c = measured(maxDamage(inCategory('creature'), 'aoe'), 'zone créatures');
        const g = measured(maxDamage(inCategory('god'), 'aoe'), 'zone dieux');

        // Non strict ici : l'ultime d'une créature peut égaler le Foudroiement de Zeus (3 de
        // zone), ce qui reste cohérent puisque le dieu garde l'avantage sur tout le reste.
        expect(s, `serviteur ${s} de zone vs créature ${c}`).toBeLessThan(c);
        expect(c, `créature ${c} de zone vs dieu ${g}`).toBeLessThanOrEqual(g);
    });
});
