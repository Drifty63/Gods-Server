/**
 * StatusSystem - Gestion centralisée des effets de statut
 * Poison, régénération, bouclier, stun, provocation, foudre, faiblesse
 */

import { GodState, PlayerState, GameState, StatusEffect } from '@/types/cards';
import { handleGodDeath } from './DamageSystem';

export type { StatusEffect };

export interface StatusEntry {
    type: StatusEffect;
    stacks: number;
    duration?: number;
}

// ─────────────────────────────────────────────
// Gestion des statuts
// ─────────────────────────────────────────────

/**
 * Ajouter un statut à un dieu. La régénération retire le poison.
 */
export function addStatus(god: GodState, status: StatusEffect, stacks: number, duration?: number): void {
    if (god.isDead || stacks <= 0) return;

    // La régénération retire le poison
    if (status === 'regen') {
        removeStatus(god, 'poison');
    }

    const existing = god.statusEffects.find(s => s.type === status);
    if (existing) {
        existing.stacks += stacks;
        if (duration !== undefined) existing.duration = duration;
    } else {
        god.statusEffects.push({ type: status, stacks, duration });
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
 * Vérifier si un dieu peut agir (pas stun)
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
