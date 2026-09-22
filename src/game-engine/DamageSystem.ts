/**
 * DamageSystem - Système centralisé de dégâts, bouclier et mort
 * Remplace les 15+ copies de logique de dégâts éparpillées dans l'ancien code
 */

import { GodState, PlayerState, GameState, SpellCard } from '@/types/cards';
import { calculateDamageWithDualWeakness } from './ElementSystem';
import type { Element, StatusEffect } from '@/types/cards';

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
    /** Dégâts supplémentaires apportés par les marques de pétrification et de brûlure. */
    markBonus: number;
}

/**
 * Dégâts supplémentaires par marque de PÉTRIFICATION, sur n'importe quel sort offensif.
 *
 * La marque n'est pas consommée : elle amplifie chaque coup jusqu'à ce qu'un nettoyage la
 * retire. Une pétrification est donc une dette durable, pas une mise en place à usage unique.
 */
export const PETRIFY_DAMAGE_BONUS = 1;

/**
 * Dégâts supplémentaires par marque de BRÛLURE, mais seulement pour un sort de FEU.
 *
 * C'est ce qui distingue la brûlure de la pétrification : la pierre encaisse mal tous les
 * coups, alors que la brûlure n'aide que celui qui attise le feu. Elle récompense une équipe
 * bâtie autour du feu au lieu d'être un bonus universel.
 */
export const BURN_DAMAGE_BONUS = 1;

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
         * Ce coup profite-t-il des marques de pétrification et de brûlure ? `false` pour les
         * dégâts passifs (saignement) : les marques amplifient les SORTS OFFENSIFS, pas les
         * ticks de fin de tour. Sans ce garde-fou, saignement et brûlure s'empileraient en
         * une spirale que rien ne rattrape.
         */
        amplifiedByMarks?: boolean;
    }
): DamageResult {
    if (target.isDead || rawDamage <= 0) {
        return { rawDamage, finalDamage: 0, shieldAbsorbed: 0, healthLost: 0, killed: false, wasWeak: false, markBonus: 0 };
    }

    // 1. Calculer les dégâts avec faiblesses élémentaires
    let finalDamage = rawDamage;
    let wasWeak = false;

    // Immunité à la faiblesse (Hestia, « Fumée cendrée » et « Foyer protecteur ») : pendant la
    // durée du statut, le dieu n'a plus de faiblesse élémentaire du tout — c'est exactement ce
    // que les deux cartes annoncent (« Retire la faiblesse d'un allié pendant 1 tour »).
    // Ce statut n'était lu NULLE PART dans le calcul des dégâts : les deux sorts ne faisaient
    // rien, indépendamment du bug de durée corrigé par ailleurs.
    const weaknessImmune = target.statusEffects.some(
        s => s.type === 'weakness_immunity' && s.stacks > 0
    );

    if (options?.element && !options?.ignoreWeakness && !weaknessImmune) {
        const result = calculateDamageWithDualWeakness(
            rawDamage,
            options.element,
            target.card.weakness,
            target.temporaryWeakness
        );
        finalDamage = result.damage;
        wasWeak = result.isWeakness;
    }

    /*
     * 1bis. MARQUES D'AMPLIFICATION — pétrification et brûlure.
     *
     * Les deux ajoutent des dégâts fixes par marque, et ne sont JAMAIS consommées : elles
     * amplifient chaque sort offensif jusqu'à ce qu'un nettoyage les retire. C'est ce qui en
     * fait une pression durable plutôt qu'une mise en place à usage unique.
     *
     * Ce qui les sépare : la pétrification aide n'importe quel attaquant — la pierre encaisse
     * mal — là où la brûlure n'aide QUE les sorts de feu. La seconde récompense donc une
     * équipe bâtie autour d'un élément, la première non.
     *
     * Appliqué APRÈS la faiblesse élémentaire, pour que le bonus reste un ajout fixe au lieu
     * d'être doublé par elle : deux marques valent +2 dégâts, jamais +4.
     *
     * Un coup entièrement absorbé par le bouclier profite quand même du bonus — il creuse le
     * bouclier d'autant. Rien n'est gaspillé puisque rien n'est consommé.
     */
    const marks = (type: StatusEffect) =>
        target.statusEffects.find(s => s.type === type)?.stacks ?? 0;

    let markBonus = 0;
    if (options?.amplifiedByMarks !== false) {
        markBonus += marks('petrify') * PETRIFY_DAMAGE_BONUS;
        if (options?.element === 'fire') {
            markBonus += marks('burn') * BURN_DAMAGE_BONUS;
        }
        finalDamage += markBonus;
    }

    const shieldEntry = options?.ignoreShield
        ? undefined
        : target.statusEffects.find(s => s.type === 'shield');

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

    return { rawDamage, finalDamage, shieldAbsorbed, healthLost, killed, wasWeak, markBonus };
}

/**
 * Soigne une cible.
 *
 * Le soin referme les plaies : il retire le poison, le saignement ET la brûlure, à raison
 * d'une marque par point de soin. Soigner éteint le feu autant que ça referme une coupure.
 *
 * La PÉTRIFICATION, elle, y résiste : on ne soigne pas de la pierre. Seul un nettoyage
 * d'effets négatifs (`cleanse`, chez Aphrodite) l'enlève.
 */
export function healGod(target: GodState, amount: number): number {
    if (target.isDead || amount <= 0) return 0;

    for (const cleansable of ['poison', 'bleed', 'burn'] as const) {
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
        // `winReason` est déclaré dans GameState et documenté dans gameRules (WIN_CONDITIONS)
        // mais n'était renseigné NULLE PART : l'écran de fin ne pouvait donc pas distinguer une
        // élimination d'une victoire aux points ou d'un abandon.
        state.winReason = 'elimination';
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
