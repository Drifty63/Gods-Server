/**
 * StatusSystem - Gestion centralisée des effets de statut
 * Poison, régénération, bouclier, stun, provocation, foudre, faiblesse
 */

import { GodState, PlayerState, GameState, StatusEffect } from '@/types/cards';
import { handleGodDeath, dealDamage } from './DamageSystem';

export type { StatusEffect };

export interface StatusEntry {
    type: StatusEffect;
    stacks: number;
    duration?: number;
}

/**
 * Plafond de cumul par statut. Le saignement est borné à 2 marques : au-delà, une cible focalisée
 * mourait de saignement seul sans que l'adversaire puisse rien y faire, alors que le saignement
 * est censé être une pression secondaire (voir /rules).
 */
const STATUS_STACK_CAPS: Partial<Record<StatusEffect, number>> = {
    bleed: 2,
};

// ─────────────────────────────────────────────
// Gestion des statuts
// ─────────────────────────────────────────────

/**
 * Ajouter un statut à un dieu. La régénération retire le poison.
 * Les statuts listés dans STATUS_STACK_CAPS sont bornés (ex: saignement max 2).
 */
export function addStatus(god: GodState, status: StatusEffect, stacks: number, duration?: number): void {
    if (god.isDead || stacks <= 0) return;

    // La régénération retire le poison
    if (status === 'regen') {
        removeStatus(god, 'poison');
    }

    // La pétrification est une vulnérabilité qui attend le prochain coup : elle ne doit jamais
    // expirer au fil des tours, seuls des dégâts reçus (ou un cleanse) la retirent.
    const effectiveDuration = status === 'petrify' ? undefined : duration;

    const cap = STATUS_STACK_CAPS[status];
    const existing = god.statusEffects.find(s => s.type === status);
    if (existing) {
        existing.stacks = cap !== undefined
            ? Math.min(existing.stacks + stacks, cap)
            : existing.stacks + stacks;
        if (effectiveDuration !== undefined) existing.duration = effectiveDuration;
    } else {
        god.statusEffects.push({
            type: status,
            stacks: cap !== undefined ? Math.min(stacks, cap) : stacks,
            duration: effectiveDuration,
        });
    }
}

/**
 * Retirer un statut d'un dieu
 */
export function removeStatus(god: GodState, status: StatusEffect): void {
    god.statusEffects = god.statusEffects.filter(s => s.type !== status);
}

/**
 * Obtenir le nombre total de stacks d'un statut
 */
export function getStatusStacks(god: GodState, status: StatusEffect): number {
    return god.statusEffects
        .filter(s => s.type === status)
        .reduce((sum, effect) => sum + effect.stacks, 0);
}

/**
 * Vérifier si un dieu peut agir (pas étourdi).
 *
 * La pétrification ne bloque PAS l'action : c'est une vulnérabilité (+2 dégâts au prochain coup
 * reçu, voir PETRIFY_DAMAGE_BONUS dans DamageSystem), pas une immobilisation.
 */
export function canGodAct(god: GodState): boolean {
    return !god.isDead && !god.statusEffects.some(s => s.type === 'stun');
}

// ─────────────────────────────────────────────
// Tick de fin de tour
// ─────────────────────────────────────────────

/**
 * Applique les effets de fin de tour pour un joueur :
 * 1. Régénération (soin)
 * 2. Décrémente les durées et retire les statuts expirés
 *
 * Le poison n'est PAS traité ici : il ne frappe que le dieu qui lance un sort, juste avant
 * que celui-ci ne s'applique (voir applyPoisonOnCast, appelé depuis GameEngine.playCard).
 */
export function tickStatusEffects(player: PlayerState, state: GameState): void {
    for (const god of player.gods) {
        if (god.isDead) continue;

        // 1. Régénération
        const regenEffect = god.statusEffects.find(s => s.type === 'regen');
        if (regenEffect && regenEffect.stacks > 0) {
            const healAmount = regenEffect.stacks;
            god.currentHealth = Math.min(god.currentHealth + healAmount, god.card.maxHealth);
        }

        // 1bis. Saignement : dégâts en fin de tour qui IGNORENT le bouclier -- c'est ce qui le
        // distingue du poison, lequel ne frappe qu'au moment où le dieu lance un sort (voir
        // applyPoisonOnCast). Un dieu qui se terre derrière un bouclier saigne quand même.
        const bleedEffect = god.statusEffects.find(s => s.type === 'bleed');
        if (bleedEffect && bleedEffect.stacks > 0) {
            dealDamage(god, bleedEffect.stacks, player, state, { ignoreShield: true, consumesPetrify: false });
            if (god.isDead) continue;
        }

        // 2. Zombie Tick (Perséphone) - Inflige 1 dégât chaque tour
        if (god.isZombie && !god.isDead) {
            god.currentHealth -= 1;
            if (god.currentHealth <= 0) {
                handleGodDeath(player, god, state);
            }
        }

        // 3. Décrémenter les durées
        god.statusEffects = god.statusEffects.filter(effect => {
            if (effect.duration !== undefined) {
                effect.duration--;
                return effect.duration > 0;
            }
            return true;
        });
    }
}

/**
 * Poison : "Avant chaque sort, le dieu subit des dégâts égaux aux marques de poison" (voir
 * /rules). Appelé depuis GameEngine.playCard juste avant que les effets du sort ne
 * s'appliquent -- ignore le bouclier. Retourne true si ces dégâts tuent le dieu (le sort
 * n'a alors pas lieu).
 */
export function applyPoisonOnCast(castingGod: GodState, player: PlayerState, state: GameState): boolean {
    if (castingGod.isDead) return false;

    const poisonEffect = castingGod.statusEffects.find(s => s.type === 'poison');
    if (!poisonEffect || poisonEffect.stacks <= 0) return false;

    castingGod.currentHealth -= poisonEffect.stacks;
    if (castingGod.currentHealth <= 0) {
        handleGodDeath(player, castingGod, state);
        return true;
    }
    return false;
}
