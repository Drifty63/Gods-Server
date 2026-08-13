/**
 * DamageSystem - Système centralisé de dégâts, bouclier et mort
 * Remplace les 15+ copies de logique de dégâts éparpillées dans l'ancien code
 */

import { GodState, PlayerState, GameState, SpellCard } from '@/types/cards';
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
    /** Dégâts supplémentaires apportés par la pétrification consommée sur ce coup. */
    petrifyBonus: number;
}

/** Dégâts supplémentaires par marque de pétrification, consommés au premier coup reçu. */
export const PETRIFY_DAMAGE_BONUS = 2;

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
        /**
         * Ce coup peut-il consommer la pétrification ? `false` pour les dégâts passifs
         * (saignement) : la marque est une mise en place pour une ATTAQUE, il serait
         * incompréhensible qu'un tick de fin de tour la gaspille.
         */
        consumesPetrify?: boolean;
    }
): DamageResult {
    if (target.isDead || rawDamage <= 0) {
        return { rawDamage, finalDamage: 0, shieldAbsorbed: 0, healthLost: 0, killed: false, wasWeak: false, petrifyBonus: 0 };
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

    // 1bis. Pétrification : la pierre encaisse mal. Chaque marque ajoute PETRIFY_DAMAGE_BONUS
    // aux dégâts, puis le statut est ENTIÈREMENT consommé -- il ne s'use pas au fil des tours,
    // seul un coup encaissé (ou un cleanse type Aphrodite) le retire. Appliqué après la faiblesse
    // pour que le bonus soit un ajout fixe et non un montant doublé par la faiblesse.
    //
    // Deux garde-fous, pour que la marque ne soit jamais gaspillée à l'insu du joueur :
    //  - les dégâts passifs (saignement) ne la consomment pas (`consumesPetrify: false`) ;
    //  - un coup que le bouclier absorbe INTÉGRALEMENT ne la consomme pas non plus : le dieu
    //    n'a rien encaissé, la marque continue d'attendre le coup qui passera vraiment.
    const shieldEntry = options?.ignoreShield
        ? undefined
        : target.statusEffects.find(s => s.type === 'shield');
    const fullyBlocked = (shieldEntry?.stacks ?? 0) >= finalDamage;

    const petrifyIndex = target.statusEffects.findIndex(s => s.type === 'petrify');
    let petrifyBonus = 0;
    if (petrifyIndex !== -1 && options?.consumesPetrify !== false && !fullyBlocked) {
        petrifyBonus = target.statusEffects[petrifyIndex].stacks * PETRIFY_DAMAGE_BONUS;
        finalDamage += petrifyBonus;
        target.statusEffects.splice(petrifyIndex, 1);
    }

    // 2. Appliquer le bouclier
    let shieldAbsorbed = 0;
    let damageAfterShield = finalDamage;

    if (shieldEntry) {
        shieldAbsorbed = Math.min(shieldEntry.stacks, damageAfterShield);
        shieldEntry.stacks -= shieldAbsorbed;
        damageAfterShield -= shieldAbsorbed;

        if (shieldEntry.stacks <= 0) {
            target.statusEffects = target.statusEffects.filter(s => s !== shieldEntry);
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

    return { rawDamage, finalDamage, shieldAbsorbed, healthLost, killed, wasWeak, petrifyBonus };
}

/**
 * Soigne une cible. Le soin referme les plaies : il retire le poison ET le saignement,
 * à raison d'une marque par point de soin.
 */
export function healGod(target: GodState, amount: number): number {
    if (target.isDead || amount <= 0) return 0;

    // Retirer le poison et le saignement (soigner referme les plaies)
    for (const cleansable of ['poison', 'bleed'] as const) {
        const index = target.statusEffects.findIndex(s => s.type === cleansable);
        if (index !== -1) {
            const toRemove = Math.min(amount, target.statusEffects[index].stacks);
            target.statusEffects[index].stacks -= toRemove;
            if (target.statusEffects[index].stacks <= 0) {
                target.statusEffects.splice(index, 1);
            }
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

    // Gérer les zombies (Perséphone)
    if (god.isZombie && god.zombieCard) {
        owner.discard.push(god.zombieCard);
        god.zombieCard = undefined;
        god.isZombie = false;
        god.zombieOwnerId = undefined;
    }

    // Retirer les cartes du dieu mort de la main, deck et défausse, et les conserver
    // dans removedCards (au lieu de les détruire) : c'est ce qui permet aux sorts de
    // résurrection complète (revive_god, resurrect_two) de les rendre au deck ensuite.
    const godId = god.card.id;

    const moveToRemoved = (arr: SpellCard[]) => {
        for (let i = arr.length - 1; i >= 0; i--) {
            if (arr[i].godId === godId) {
                const [card] = arr.splice(i, 1);
                delete card.isHiddenFromOwner;
                delete card.revealedToPlayerId;
                owner.removedCards.push(card);
            }
        }
    };

    moveToRemoved(owner.hand);
    moveToRemoved(owner.deck);
    moveToRemoved(owner.discard);

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
