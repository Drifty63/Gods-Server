import type { GodCard, SpellCard, SpellEffect, StatusEffect } from '@/types/cards';

/**
 * Budget de puissance d'une unité — la façon dont on encode « un dieu > une créature > un
 * serviteur ».
 *
 * Les PV seuls ne suffisent pas : une créature peut être un mur de 26 PV qui tape faiblement,
 * tandis qu'une autre a 20 PV mais frappe fort. Comparer les PV classerait la première comme
 * « plus forte », ce qui est faux. On additionne donc l'encaisse ET la menace, et c'est ce
 * total qui doit respecter la hiérarchie (voir le test units-hierarchy).
 */

/** Combien vaut 1 pile de chaque statut, en « points de dégâts équivalents ». */
const STATUS_WEIGHT: Record<StatusEffect, number> = {
    poison: 1.5,
    bleed: 1.5,
    lightning: 1,
    shield: 0.8,
    provocation: 1,
    stun: 3,
    petrify: 3.5,
    weakness: 1.5,
    weakness_immunity: 1,
    regen: 1.2,
    untargetable: 2,
};

/** Une frappe de zone vaut plus cher qu'une frappe simple : elle touche jusqu'à 4 cibles. */
function targetMultiplier(effect: SpellEffect): number {
    switch (effect.target) {
        case 'all_enemies':
        case 'all_allies':
        case 'all_gods':
            return 2.5;
        case 'same':
            return 0.5;
        default:
            return 1;
    }
}

function effectPower(e: SpellEffect): number {
    const m = targetMultiplier(e);
    const v = e.value ?? 0;
    switch (e.type) {
        case 'damage': return v * m;
        case 'heal': return v * 0.8 * m;
        case 'shield': return v * 0.8 * m;
        case 'status': return v * (e.status ? STATUS_WEIGHT[e.status] : 1) * m;
        case 'remove_status': return 1;
        case 'draw': return v * 1.5;
        case 'energy': return v * 1.5;
        case 'mill':
        case 'discard': return v * m;
        // Les effets `custom` sont propres à un dieu du roster et n'existent pas dans le
        // bestiaire ; on les compte forfaitairement plutôt que de renvoyer 0 silencieusement.
        case 'custom': return 3;
        default: return 0;
    }
}

/** Puissance nette d'un sort : ce qu'il fait, moins ce qu'il coûte, plus ce qu'il rapporte. */
export function spellPower(s: SpellCard): number {
    const raw = s.effects.reduce((sum, e) => sum + effectPower(e), 0);
    return raw - s.energyCost * 1.5 + s.energyGain * 1.5;
}

/** Budget total = encaisse (PV) + menace (somme des 5 sorts). */
export function unitPower(unit: GodCard, spells: SpellCard[]): number {
    const own = spells.filter(s => s.godId === unit.id);
    return unit.maxHealth + own.reduce((sum, s) => sum + spellPower(s), 0);
}

/**
 * Plafond de budget par catégorie. Un serviteur ne doit jamais atteindre le budget d'une
 * créature, quelle que soit la répartition entre PV et dégâts.
 */
export const POWER_CEILING = {
    servant: 40,
    creature: 62,
} as const;
