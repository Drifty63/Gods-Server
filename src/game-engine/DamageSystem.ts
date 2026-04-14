/**
 * DamageSystem - Système centralisé de dégâts, bouclier et mort
 * Remplace les 15+ copies de logique de dégâts éparpillées dans l'ancien code
 */

import { GodState, PlayerState, GameState } from '@/types/cards';
import { calculateDamageWithDualWeakness } from './ElementSystem';
import type { Element } from '@/types/cards';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface DamageResult {
    rawDamage: number;
    finalDamage: number;
    shieldAbsorbed: number;
    healthLost: number;
    killed: boolean;
    wasWeak: boolean;
}

// ─────────────────────────────────────────────
// Fonctions publiques
// ─────────────────────────────────────────────

/**
 * Inflige des dégâts à une cible en gérant le bouclier et la mort.
 * C'est LA seule fonction à utiliser pour infliger des dégâts dans tout le jeu.
 */
export function dealDamage(
    target: GodState,
    rawDamage: number,
    owner: PlayerState,
    state: GameState,
    options?: {
        element?: Element;
        ignoreShield?: boolean;
        ignoreWeakness?: boolean;
    }
): DamageResult {
    if (target.isDead || rawDamage <= 0) {
        return { rawDamage, finalDamage: 0, shieldAbsorbed: 0, healthLost: 0, killed: false, wasWeak: false };
    }

    // 1. Calculer les dégâts avec faiblesses élémentaires
    let finalDamage = rawDamage;
    let wasWeak = false;

    if (options?.element && !options?.ignoreWeakness) {
        const result = calculateDamageWithDualWeakness(
            rawDamage,
            options.element,
            target.card.weakness,
            target.temporaryWeakness
        );
        finalDamage = result.damage;
        wasWeak = result.isWeakness;
    }

    // 2. Appliquer le bouclier
    let shieldAbsorbed = 0;
    let damageAfterShield = finalDamage;

    if (!options?.ignoreShield) {
        const shieldIndex = target.statusEffects.findIndex(s => s.type === 'shield');
        if (shieldIndex !== -1) {
            const shield = target.statusEffects[shieldIndex];
            shieldAbsorbed = Math.min(shield.stacks, damageAfterShield);
            shield.stacks -= shieldAbsorbed;
            damageAfterShield -= shieldAbsorbed;

            if (shield.stacks <= 0) {
                target.statusEffects.splice(shieldIndex, 1);
            }
        }
    }

    // 3. Appliquer les dégâts aux PV
    const healthBefore = target.currentHealth;
    target.currentHealth -= damageAfterShield;
    const healthLost = healthBefore - target.currentHealth;

    // 4. Gérer la mort
    let killed = false;
    if (target.currentHealth <= 0) {
        killed = true;
        handleGodDeath(owner, target, state);
    }

    return { rawDamage, finalDamage, shieldAbsorbed, healthLost, killed, wasWeak };
}

/**
 * Soigne une cible. Le soin retire le poison.
 */
export function healGod(target: GodState, amount: number): number {
    if (target.isDead || amount <= 0) return 0;

    // Retirer le poison
    const poisonIndex = target.statusEffects.findIndex(s => s.type === 'poison');
    if (poisonIndex !== -1) {
        const poisonToRemove = Math.min(amount, target.statusEffects[poisonIndex].stacks);
        target.statusEffects[poisonIndex].stacks -= poisonToRemove;
        if (target.statusEffects[poisonIndex].stacks <= 0) {
            target.statusEffects.splice(poisonIndex, 1);
        }
    }

    const healthBefore = target.currentHealth;
    target.currentHealth = Math.min(target.currentHealth + amount, target.card.maxHealth);
    return target.currentHealth - healthBefore;
}

/**
 * Gère la mort d'un dieu : met à jour son état et vérifie la victoire.
 */
export function handleGodDeath(owner: PlayerState, god: GodState, state: GameState): void {
    god.currentHealth = 0;
    god.isDead = true;
    god.statusEffects = [];

    // Retirer les cartes du dieu mort de la main, deck et défausse
    const godId = god.card.id;

    const removeFromArray = (arr: any[], predicate: (item: any) => boolean) => {
        for (let i = arr.length - 1; i >= 0; i--) {
            if (predicate(arr[i])) {
                arr.splice(i, 1);
            }
        }
    };

    removeFromArray(owner.hand, (c: any) => c.godId === godId);
    removeFromArray(owner.deck, (c: any) => c.godId === godId);
    removeFromArray(owner.discard, (c: any) => c.godId === godId);

    // Vérifier la condition de victoire
    const allDead = owner.gods.every(g => g.isDead);
    if (allDead) {
        state.status = 'finished';
        // Le gagnant est l'autre joueur
        state.winnerId = state.players.find(p => p.id !== owner.id)?.id;
    }
}

/**
 * Ajoute un bouclier à un dieu
 */
export function addShield(god: GodState, amount: number): void {
    if (god.isDead || amount <= 0) return;

    const existing = god.statusEffects.find(s => s.type === 'shield');
    if (existing) {
        existing.stacks += amount;
    } else {
        god.statusEffects.push({ type: 'shield', stacks: amount });
    }
}
