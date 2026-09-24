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
export function addStatus(
    god: GodState,
    status: StatusEffect,
    stacks: number,
    duration?: number,
    appliedTurn?: number,
): void {
    if (god.isDead || stacks <= 0) return;

    // La régénération retire le poison
    if (status === 'regen') {
        removeStatus(god, 'poison');
    }

    /*
     * Se faire pétrifier FIGE : la marque s'accompagne d'un étourdissement d'un tour.
     *
     * Les deux moitiés sont volontairement dissociées. L'étourdissement est le choc, et il
     * passe au bout d'un tour ; la marque, elle, reste et continue d'amplifier les coups
     * reçus. Sans ça, pétrifier reviendrait à poser une vulnérabilité que la cible peut
     * ignorer en continuant de jouer normalement.
     *
     * Une seule récursion, sans risque de boucle : la branche 'stun' ne rappelle rien.
     */
    if (status === 'petrify') {
        addStatus(god, 'stun', 1, 1, appliedTurn);
    }

    /*
     * Marques PERMANENTES : ni la pétrification ni la brûlure ne s'usent au fil des tours.
     *
     * Ce sont des vulnérabilités qui pèsent jusqu'à ce qu'on s'en occupe — un nettoyage
     * d'effets négatifs pour la pierre, un soin pour le feu. Leur donner une durée les ferait
     * disparaître toutes seules et viderait de leur sens les cartes bâties autour.
     *
     * Trois autres les rejoignent, pour des raisons distinctes :
     *  - `fear` s'efface bien, mais UNE MARQUE PAR TOUR, pas d'un bloc à l'expiration d'une
     *    durée (voir tickStatusEffects). Lui donner une durée la supprimerait entièrement d'un
     *    coup, ce qui n'est pas la règle.
     *  - `dreaded` dure ce que dure son porteur : on n'oublie pas celui qui vous a terrifié.
     *  - `empowered` et `blunted` ATTENDENT leur cible. Une durée les ferait expirer avant que
     *    leur porteur ait eu l'occasion de frapper — or ils ne se consomment que sur une
     *    attaque mono-cible. Les deux fonctionnent en miroir, donc ils vivent à l'identique.
     */
    const permanent = status === 'petrify' || status === 'burn'
        || status === 'fear' || status === 'dreaded'
        || status === 'empowered' || status === 'blunted';
    const effectiveDuration = permanent ? undefined : duration;

    const cap = STATUS_STACK_CAPS[status];
    const existing = god.statusEffects.find(s => s.type === status);
    if (existing) {
        existing.stacks = cap !== undefined
            ? Math.min(existing.stacks + stacks, cap)
            : existing.stacks + stacks;
        if (effectiveDuration !== undefined) {
            existing.duration = effectiveDuration;
            // Reposer un statut le redate : sa nouvelle durée doit être comptée en entier.
            existing.appliedTurn = appliedTurn;
        }
    } else {
        god.statusEffects.push({
            type: status,
            stacks: cap !== undefined ? Math.min(stacks, cap) : stacks,
            duration: effectiveDuration,
            appliedTurn,
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
 * Vérifier si un dieu peut agir : seul l'étourdissement l'en empêche.
 *
 * La marque de pétrification ne bloque rien par elle-même — c'est une vulnérabilité durable
 * (+1 dégât par marque sur chaque sort reçu, voir PETRIFY_DAMAGE_BONUS). L'immobilisation
 * vient de l'étourdissement d'un tour que `addStatus` pose EN MÊME TEMPS que la marque : la
 * cible est figée le temps du choc, puis rejoue en restant vulnérable.
 */
export function canGodAct(god: GodState): boolean {
    return !god.isDead && !god.statusEffects.some(s => s.type === 'stun');
}

/**
 * Un dieu réduit au silence ne peut plus jouer ses cartes COMPÉTENCE. Ses générateurs et son
 * utilitaire restent jouables — c'est toute la différence avec l'étourdissement, qui ferme les
 * cinq cartes.
 *
 * Le filtre porte sur le TYPE de carte et non sur « les cartes qui infligent des dégâts » :
 * 56 des 60 générateurs du jeu en infligent au passage, si bien que la seconde formulation
 * aurait fermé deux cartes sur trois et coupé la production d'énergie du dieu. Le type, lui,
 * est imprimé sur la carte : le joueur voit d'un coup d'œil ce qui est scellé.
 */
export function isSilenced(god: GodState): boolean {
    return god.statusEffects.some(s => s.type === 'silence');
}

/**
 * Un dieu qui porte de l'effroi n'ose plus viser celui qui le lui a inspiré, tant qu'il s'agit
 * d'une attaque MONO-CIBLE. Les attaques de zone l'atteignent normalement.
 *
 * C'est ce qui sépare l'effroi de `untargetable`, lequel ferme aussi la zone : la protection
 * se contourne en frappant large, au prix de la précision.
 */
export function isShieldedByFear(caster: GodState | undefined, target: GodState): boolean {
    if (!caster) return false;
    const afraid = caster.statusEffects.some(s => s.type === 'fear' && s.stacks > 0);
    return afraid && target.statusEffects.some(s => s.type === 'dreaded' && s.stacks > 0);
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
            dealDamage(god, bleedEffect.stacks, player, state, { ignoreShield: true, amplifiedByMarks: false });
            if (god.isDead) continue;
        }

        // 2. Zombie Tick (Perséphone) - Inflige 1 dégât chaque tour
        if (god.isZombie && !god.isDead) {
            god.currentHealth -= 1;
            if (god.currentHealth <= 0) {
                handleGodDeath(player, god, state);
            }
        }

        /*
         * 2bis. EFFROI : une marque s'efface, pas le statut entier.
         *
         * C'est la seule décroissance de ce type dans le jeu, et elle est le garde-fou de toute
         * la mécanique. Sans elle, un joueur poserait une marque sur chaque ennemi et Actéon
         * ne serait plus jamais mono-ciblable de la partie. Avec elle, entretenir la protection
         * coûte une carte par tour — donc TOUT le tour d'Actéon, qui ne frappe alors jamais.
         *
         * Comme le reste du tick, ça n'a lieu qu'à la fin du tour du camp qui PORTE la marque :
         * une marque posée pendant le tour d'Actéon reste donc vivante tout le tour adverse
         * suivant, et deux marques couvrent deux tours.
         */
        const fearEffect = god.statusEffects.find(s => s.type === 'fear');
        if (fearEffect && fearEffect.appliedTurn !== state.turnSequence) {
            fearEffect.stacks -= 1;
            if (fearEffect.stacks <= 0) removeStatus(god, 'fear');
        }

        // 3. Décrémenter les durées
        god.statusEffects = god.statusEffects.filter(effect => {
            if (effect.duration === undefined) return true;

            // Un statut n'est JAMAIS décrémenté le demi-tour où il a été posé.
            //
            // Ce tick n'a lieu qu'à la fin du tour du camp qui PORTE le statut. Un sort lancé
            // sur soi ou un allié était donc décrémenté quelques instants après sa pose, avant
            // que l'adversaire ait pu jouer : une durée de 1 ne protégeait de rien, une durée
            // de 2 ne valait qu'un tour. Les statuts posés sur l'ennemi (stun) ne connaissent
            // pas ce problème — ils sont posés pendant le tour de l'autre camp — et ce garde
            // les laisse strictement inchangés.
            if (effect.appliedTurn !== undefined && effect.appliedTurn === state.turnSequence) {
                return true;
            }

            effect.duration--;
            return effect.duration > 0;
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
