/**
 * ============================================
 * GODS - MOTEUR DE JEU v2.0 (REFONTE COMPLÈTE)
 * ============================================
 *
 * Architecture modulaire :
 * - DamageSystem.ts  → Dégâts, boucliers, mort
 * - StatusSystem.ts  → Effets de statut (poison, regen, stun...)
 * - EffectResolver   → Registre d'effets custom (pattern Map)
 * - GameEngine.ts    → Orchestration propre
 *
 * Plus de switch/case de 1500 lignes. Plus de code dupliqué.
 */

import {
    GameState,
    PlayerState,
    GodState,
    SpellCard,
    GameAction,
    StatusEffect,
    GodCard
} from '@/types/cards';
import type { Element } from '@/types/cards';
import { calculateDamageWithDualWeakness } from './ElementSystem';
import { dealDamage, healGod, handleGodDeath, addShield } from './DamageSystem';
import { addStatus, removeStatus, getStatusStacks, canGodAct, tickStatusEffects } from './StatusSystem';

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────

const MAX_ENERGY = 10;
const HAND_LIMIT = 5;

// ─────────────────────────────────────────────
// UUID
// ─────────────────────────────────────────────

const generateUUID = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// ─────────────────────────────────────────────
// Types pour le registre d'effets
// ─────────────────────────────────────────────

export interface EffectContext {
    engine: GameEngine;
    player: PlayerState;
    opponent: PlayerState;
    castingGod: GodState | undefined;
    card: SpellCard;
    targets: GodState[];
    targetGodId?: string;
    targetGodIds?: string[];
    selectedCardIds?: string[];
    healDistribution?: { godId: string, amount: number }[];
    optionalChoice?: boolean;
    selectedElement?: Element;
    lightningAction?: 'apply' | 'remove';
    selectedPlayerTarget?: 'self' | 'opponent';
}

// ─────────────────────────────────────────────
// Effets custom nécessitant un choix du joueur humain (modale)
// ─────────────────────────────────────────────
// Quand une carte porteuse d'un de ces effets est jouée avec action.deferCustomEffect === true,
// playCard() paie le coût et défausse la carte MAIS n'exécute PAS le handler custom ci-dessous.
// Le store doit ensuite appeler engine.resolveDeferredEffect(cardId, choix) une fois le choix du
// joueur connu. Cela évite qu'un handler "auto" (pensé pour l'IA) s'exécute une première fois avec
// des valeurs par défaut, puis qu'une deuxième implémentation manuelle dans le store ne ré-applique
// l'effet une seconde fois avec le vrai choix du joueur (bug de double-exécution).
export const DEFERRED_CUSTOM_EFFECTS = new Set<string>([
    'free_recycle',
    'temp_resurrect',
    'vision_tartare',
    'cascade_heal_choice',
    'distribute_heal_5',
    'recycle_from_discard',
    'put_cards_bottom',
    'choose_discard_enemy',
    'shuffle_god_cards',
]);

type CustomEffectHandler = (ctx: EffectContext) => void;

// ─────────────────────────────────────────────
// Registre d'effets custom
// ─────────────────────────────────────────────

const customEffects = new Map<string, CustomEffectHandler>();

function registerEffect(id: string, handler: CustomEffectHandler) {
    customEffects.set(id, handler);
}

// === DEMETER ===
registerEffect('revive_god', (ctx) => {
    if (!ctx.targetGodId) return;
    const god = ctx.player.gods.find(g => g.card.id === ctx.targetGodId && g.isDead);
    if (!god) return;

    god.isDead = false;
    god.currentHealth = 8;
    god.statusEffects = [];
    god.temporaryWeakness = undefined;

    // Récupérer les cartes du dieu depuis removedCards
    const cardsToReturn: SpellCard[] = [];
    ctx.player.removedCards = ctx.player.removedCards.filter(card => {
        if (card.godId === god.card.id) {
            cardsToReturn.push(card);
            return false;
        }
        return true;
    });
    ctx.player.deck.push(...cardsToReturn);
    shuffleArray(ctx.player.deck);
});

registerEffect('distribute_heal_5', (ctx) => {
    const totalToHeal = 5;
    if (ctx.healDistribution && ctx.healDistribution.length > 0) {
        // Mode manuel (Joueur ou Action complète)
        for (const dist of ctx.healDistribution) {
            const god = ctx.player.gods.find(g => g.card.id === dist.godId);
            if (god && !god.isDead) {
                healGod(god, dist.amount);
            }
        }
    } else {
        // Mode automatique (IA ou fallback)
        const alive = ctx.player.gods.filter(g => !g.isDead);
        if (alive.length === 0) return;
        const healPer = Math.floor(totalToHeal / alive.length);
        const remainder = totalToHeal % alive.length;
        alive.forEach((ally, i) => {
            const amount = healPer + (i < remainder ? 1 : 0);
            healGod(ally, amount);
        });
    }
});

// === SÉLÉNÉ ===
registerEffect('cascade_heal_choice', (ctx) => {
    // accepted (true) = flux Gauche→Droite (Ouest), sinon flux Droite→Gauche (Est)
    // En mode auto (IA), pas de choix connu : on retient toujours le flux Ouest par défaut.
    const accepted = ctx.optionalChoice !== false;
    const aliveAllies = ctx.player.gods.filter(g => !g.isDead);
    const healAmounts = [3, 2, 1];
    const orderedAllies = accepted ? aliveAllies : [...aliveAllies].reverse();

    for (let i = 0; i < orderedAllies.length && i < healAmounts.length; i++) {
        healGod(orderedAllies[i], healAmounts[i]);
    }
});

registerEffect('resurrect_two', (ctx) => {
    const deadGods = ctx.player.gods.filter(g => g.isDead).slice(0, 2);
    for (const god of deadGods) {
        god.isDead = false;
        god.currentHealth = 3;
        god.statusEffects = [];
        god.temporaryWeakness = undefined;
        god.isZombie = false;
        god.zombieCard = undefined;
        god.zombieOwnerId = undefined;

        const cardsToReturn: SpellCard[] = [];
        ctx.player.removedCards = ctx.player.removedCards.filter(card => {
            if (card.godId === god.card.id) {
                cardsToReturn.push(card);
                return false;
            }
            return true;
        });
        ctx.player.deck.push(...cardsToReturn);
    }
    shuffleArray(ctx.player.deck);
});

// === DIONYSOS ===
registerEffect('heal_by_poison', (ctx) => {
    let totalPoison = 0;
    for (const god of ctx.opponent.gods) {
        if (!god.isDead) totalPoison += getStatusStacks(god, 'poison');
    }
    if (totalPoison > 0 && ctx.targets.length > 0) {
        healGod(ctx.targets[0], totalPoison);
    }
});

// === HADÈS ===
registerEffect('heal_if_kill_8', (ctx) => {
    if (!ctx.targetGodId || !ctx.castingGod) return;
    const target = ctx.opponent.gods.find(g => g.card.id === ctx.targetGodId);
    if (target?.isDead) {
        healGod(ctx.castingGod, 8);
    }
});

registerEffect('lifesteal_damage', (ctx) => {
    if (!ctx.castingGod || !ctx.targetGodId) return;
    const target = ctx.opponent.gods.find(g => g.card.id === ctx.targetGodId);
    if (!target) return;

    const hasImmunity = target.statusEffects.some(s => s.type === 'weakness_immunity');
    const { damage } = hasImmunity
        ? { damage: 3 }
        : calculateDamageWithDualWeakness(3, ctx.card.element, target.card.weakness, target.temporaryWeakness);
    healGod(ctx.castingGod, damage);
});

// === APOLLON ===
registerEffect('remove_energy_1', (ctx) => {
    ctx.opponent.energy = Math.max(0, ctx.opponent.energy - 1);
});

registerEffect('remove_energy_2', (ctx) => {
    ctx.opponent.energy = Math.max(0, ctx.opponent.energy - 2);
});

// === ARÈS ===
registerEffect('damage_equal_lost_health', (ctx) => {
    if (!ctx.castingGod || !ctx.targetGodId) return;
    const lostHealth = ctx.castingGod.card.maxHealth - ctx.castingGod.currentHealth;
    const target = ctx.opponent.gods.find(g => g.card.id === ctx.targetGodId && !g.isDead);
    if (!target || lostHealth <= 0) return;
    dealDamage(target, lostHealth, ctx.opponent, ctx.engine.getState(), { element: ctx.card.element });
});

// === ARTÉMIS ===
registerEffect('apply_weakness', (ctx) => {
    const element = ctx.selectedElement || ctx.card.element;
    for (const target of ctx.targets) {
        target.temporaryWeakness = element;
    }
});

// === APHRODITE ===
registerEffect('cleanse', (ctx) => {
    for (const target of ctx.targets) {
        target.statusEffects = target.statusEffects.filter(s => s.type === 'shield');
        target.temporaryWeakness = undefined;
    }
});

registerEffect('cleanse_all_allies', (ctx) => {
    for (const god of ctx.player.gods) {
        if (!god.isDead) {
            god.statusEffects = god.statusEffects.filter(s => s.type === 'shield');
            god.temporaryWeakness = undefined;
        }
    }
});

// === ZEUS ===
function handleLightningToggle(targets: GodState[], ctx: EffectContext) {
    for (const target of targets) {
        const stacks = getStatusStacks(target, 'lightning');
        const action = ctx.lightningAction !== undefined
            ? ctx.lightningAction
            : (stacks > 0 ? 'remove' : 'apply');

        if (action === 'remove' && stacks > 0) {
            const bonusDamage = stacks * 2;
            removeStatus(target, 'lightning');
            dealDamage(target, bonusDamage, findOwner(target, ctx), ctx.engine.getState(), { element: 'lightning' as Element });
        } else if (action === 'apply') {
            addStatus(target, 'lightning', 1);
        }
    }
}

registerEffect('lightning_toggle', (ctx) => handleLightningToggle(ctx.targets, ctx));
registerEffect('lightning_toggle_multi', (ctx) => handleLightningToggle(ctx.targets, ctx));

registerEffect('lightning_toggle_all', (ctx) => {
    const enemies = ctx.opponent.gods.filter(g => !g.isDead);
    handleLightningToggle(enemies, ctx);
});

// === POSÉIDON ===
registerEffect('conductive_lightning', (ctx) => {
    for (const target of ctx.targets) {
        dealDamage(target, 1, findOwner(target, ctx), ctx.engine.getState(), { element: ctx.card.element });
        addStatus(target, 'lightning', 1);
    }
});

registerEffect('tsunami_damage', (ctx) => {
    if (!ctx.targetGodId) return;
    const target = ctx.opponent.gods.find(g => g.card.id === ctx.targetGodId && !g.isDead);
    if (!target) return;

    const recentDiscard = ctx.opponent.discard.slice(-5);
    const cardsFromTarget = recentDiscard.filter(c => c.godId === ctx.targetGodId);
    const baseDamage = cardsFromTarget.length * 3;
    if (baseDamage > 0) {
        dealDamage(target, baseDamage, ctx.opponent, ctx.engine.getState(), { element: ctx.card.element });
    }
});

registerEffect('prison_mill', (ctx) => {
    const livingEnemies = ctx.opponent.gods.filter(g => !g.isDead).length;
    for (let i = 0; i < livingEnemies; i++) {
        if (ctx.opponent.deck.length > 0) {
            const card = ctx.opponent.deck.shift()!;
            cleanBlindCard(card);
            ctx.opponent.discard.push(card);
        }
    }
});

// === NYX ===
registerEffect('shuffle_hand_draw_blind', (ctx) => {
    if (ctx.opponent.hand.length === 0) return;
    const rndIdx = Math.floor(Math.random() * ctx.opponent.hand.length);
    const card = ctx.opponent.hand.splice(rndIdx, 1)[0];
    cleanBlindCard(card);
    ctx.opponent.deck.push(card);
    shuffleArray(ctx.opponent.deck);

    if (ctx.opponent.deck.length > 0) {
        const drawn = ctx.opponent.deck.shift()!;
        drawn.isHiddenFromOwner = true;
        drawn.revealedToPlayerId = ctx.player.id;
        ctx.opponent.hand.push(drawn);
    }
});

registerEffect('shuffle_hand_draw_blind_2', (ctx) => {
    for (let i = 0; i < 2; i++) {
        if (ctx.opponent.hand.length === 0) break;
        const rndIdx = Math.floor(Math.random() * ctx.opponent.hand.length);
        const card = ctx.opponent.hand.splice(rndIdx, 1)[0];
        cleanBlindCard(card);
        ctx.opponent.deck.push(card);
    }
    shuffleArray(ctx.opponent.deck);

    for (let i = 0; i < 2; i++) {
        if (ctx.opponent.deck.length > 0) {
            const drawn = ctx.opponent.deck.shift()!;
            drawn.isHiddenFromOwner = true;
            drawn.revealedToPlayerId = ctx.player.id;
            ctx.opponent.hand.push(drawn);
        }
    }
});

registerEffect('shuffle_all_hand_draw_blind', (ctx) => {
    while (ctx.opponent.hand.length > 0) {
        const card = ctx.opponent.hand.pop()!;
        card.isHiddenFromOwner = false;
        ctx.opponent.deck.push(card);
    }
    shuffleArray(ctx.opponent.deck);

    const count = Math.min(5, ctx.opponent.deck.length);
    for (let i = 0; i < count; i++) {
        if (ctx.opponent.deck.length > 0) {
            const drawn = ctx.opponent.deck.shift()!;
            drawn.isHiddenFromOwner = true;
            drawn.revealedToPlayerId = ctx.player.id;
            ctx.opponent.hand.push(drawn);
        }
    }
});

// === ATHÉNA ===
registerEffect('remove_weakness_1_turn', (ctx) => {
    for (const target of ctx.targets) {
        if (ctx.player.gods.includes(target) && !target.isDead) {
            addStatus(target, 'weakness_immunity', 1, 1);
        }
    }
});

registerEffect('remove_all_weakness_3_turns', (ctx) => {
    for (const god of ctx.player.gods) {
        if (!god.isDead) addStatus(god, 'weakness_immunity', 1, 3);
    }
});

// === HESTIA ===
registerEffect('heal_by_energy', (ctx) => {
    for (const target of ctx.targets) {
        if (ctx.player.gods.includes(target) && !target.isDead) {
            healGod(target, ctx.player.energy);
        }
    }
});

registerEffect('recycle_from_discard', (ctx) => {
    if (ctx.selectedCardIds && ctx.selectedCardIds.length > 0) {
        // Mode manuel
        for (const cardId of ctx.selectedCardIds) {
            const index = ctx.player.discard.findIndex(c => c.id === cardId);
            if (index !== -1) {
                const [card] = ctx.player.discard.splice(index, 1);
                ctx.player.deck.push(card);
            }
        }
    } else {
        // Mode auto (IA) : Prend les 2 dernières cartes (sauf celle qu'il vient de jouer)
        const candidates = ctx.player.discard.slice(0, -1);
        const count = Math.min(2, candidates.length);
        for (let i = 0; i < count; i++) {
            const card = ctx.player.discard.shift()!;
            ctx.player.deck.push(card);
        }
    }
    shuffleArray(ctx.player.deck);
});

registerEffect('put_cards_bottom', (ctx) => {
    if (ctx.selectedCardIds && ctx.selectedCardIds.length > 0) {
        for (const cardId of ctx.selectedCardIds) {
            const index = ctx.player.hand.findIndex(c => c.id === cardId);
            if (index !== -1) {
                const [card] = ctx.player.hand.splice(index, 1);
                ctx.player.deck.push(card);
            }
        }
    } else {
        // Mode auto (IA) : Met 3 cartes au hasard de la main en bas du deck
        const count = Math.min(3, ctx.player.hand.length);
        for (let i = 0; i < count; i++) {
            const [card] = ctx.player.hand.splice(0, 1);
            ctx.player.deck.push(card);
        }
    }
});

// === THANATOS ===
function damageWithDeadCount(ctx: EffectContext, baseDmg: number, multiplier: number, countSource: 'allies' | 'enemies') {
    const source = countSource === 'allies' ? ctx.player : ctx.opponent;
    const deadCount = source.gods.filter(g => g.isDead).length;
    const totalDmg = baseDmg + (multiplier * deadCount);
    if (totalDmg <= 0 || !ctx.targetGodId) return;

    const target = ctx.opponent.gods.find(g => g.card.id === ctx.targetGodId && !g.isDead);
    if (target) dealDamage(target, totalDmg, ctx.opponent, ctx.engine.getState(), { element: ctx.card.element });
}

function aoeDamageWithDeadCount(ctx: EffectContext, baseDmg: number, multiplier: number, countSource: 'allies' | 'enemies') {
    const source = countSource === 'allies' ? ctx.player : ctx.opponent;
    const deadCount = source.gods.filter(g => g.isDead).length;
    const totalDmg = baseDmg + (multiplier * deadCount);

    for (const enemy of ctx.opponent.gods.filter(g => !g.isDead)) {
        dealDamage(enemy, totalDmg, ctx.opponent, ctx.engine.getState(), { element: ctx.card.element });
    }
}

registerEffect('damage_plus_dead_allies', (ctx) => damageWithDeadCount(ctx, 2, 1, 'allies'));
registerEffect('damage_plus_2x_dead_allies', (ctx) => damageWithDeadCount(ctx, 2, 2, 'allies'));
registerEffect('aoe_damage_plus_dead_allies', (ctx) => aoeDamageWithDeadCount(ctx, 1, 1, 'allies'));
registerEffect('damage_5x_dead_allies', (ctx) => {
    const deadCount = ctx.player.gods.filter(g => g.isDead).length;
    const totalDmg = 5 * deadCount;
    if (totalDmg <= 0 || !ctx.targetGodId) return;
    const target = ctx.opponent.gods.find(g => g.card.id === ctx.targetGodId && !g.isDead);
    if (target) dealDamage(target, totalDmg, ctx.opponent, ctx.engine.getState(), { element: ctx.card.element });
});

// === NIKÉ ===
registerEffect('damage_plus_dead_enemies', (ctx) => damageWithDeadCount(ctx, 1, 1, 'enemies'));
registerEffect('damage_plus_2x_dead_enemies', (ctx) => damageWithDeadCount(ctx, 2, 2, 'enemies'));
registerEffect('aoe_damage_plus_dead_enemies', (ctx) => aoeDamageWithDeadCount(ctx, 1, 1, 'enemies'));
registerEffect('aoe_damage_plus_2x_dead_enemies', (ctx) => aoeDamageWithDeadCount(ctx, 2, 2, 'enemies'));

// === HÉPHAÏSTOS ===
registerEffect('gain_current_shield', (ctx) => {
    if (!ctx.castingGod || !ctx.targetGodId) return;
    const target = ctx.opponent.gods.find(g => g.card.id === ctx.targetGodId);
    if (!target) return;
    const { damage: realDmg } = calculateDamageWithDualWeakness(2, ctx.card.element, target.card.weakness, target.temporaryWeakness);
    addShield(ctx.castingGod, realDmg);
});

registerEffect('damage_plus_shield', (ctx) => {
    if (!ctx.castingGod || !ctx.targetGodId) return;
    const target = ctx.opponent.gods.find(g => g.card.id === ctx.targetGodId && !g.isDead);
    if (!target) return;
    const shieldStacks = ctx.castingGod.statusEffects.find(s => s.type === 'shield')?.stacks || 0;
    const totalDmg = 3 + shieldStacks;
    dealDamage(target, totalDmg, ctx.opponent, ctx.engine.getState(), { element: ctx.card.element });
});

// === CHIONÉ ===
registerEffect('splash_damage', (ctx) => {
    if (!ctx.targetGodId) return;
    const idx = ctx.opponent.gods.findIndex(g => g.card.id === ctx.targetGodId);
    if (idx === -1) return;

    const neighbors: GodState[] = [];
    if (idx > 0) neighbors.push(ctx.opponent.gods[idx - 1]);
    if (idx < ctx.opponent.gods.length - 1) neighbors.push(ctx.opponent.gods[idx + 1]);

    for (const neighbor of neighbors) {
        if (!neighbor.isDead) {
            dealDamage(neighbor, 2, ctx.opponent, ctx.engine.getState());
        }
    }
});

// === HERMÈS ===
registerEffect('replay_action', (ctx) => {
    ctx.player.hasPlayedCard = false;
});

registerEffect('choose_discard_enemy', (ctx) => {
    const target = ctx.opponent;
    const cardsToDiscard = ctx.selectedCardIds || [target.hand[0]?.id].filter(Boolean);
    
    for (const cardId of cardsToDiscard) {
        const idx = target.hand.findIndex(c => c.id === cardId);
        if (idx !== -1) {
            const card = target.hand.splice(idx, 1)[0];
            cleanBlindCard(card);
            target.discard.push(card);
        }
    }
});

registerEffect('shuffle_god_cards', (ctx) => {
    // Dans l'idéal, on a ctx.targetGodId du dieu dont on veut shuffler les cartes
    const targetGodId = ctx.targetGodId;
    if (!targetGodId) return;

    const targetPlayer = [...ctx.engine.getState().players].find(p => p.gods.some(g => g.card.id === targetGodId));
    if (!targetPlayer) return;

    const cardsToShuffle = targetPlayer.hand.filter(c => c.godId === targetGodId);
    if (cardsToShuffle.length > 0) {
        targetPlayer.hand = targetPlayer.hand.filter(c => c.godId !== targetGodId);
        targetPlayer.deck.push(...cardsToShuffle);
        shuffleArray(targetPlayer.deck);
    }
});

registerEffect('free_recycle', (ctx) => {
    // Si pas de choix (IA), cible soi-même. Sinon respecte le choix du joueur.
    const target = ctx.selectedPlayerTarget === 'opponent' ? ctx.opponent : ctx.player;
    target.deck.push(...target.discard);
    target.discard = [];
    shuffleArray(target.deck);
});

// === Store-managed effects (fallback for UI compatibility) ===
for (const id of [
    'retrieve_discard', 'copy_discard_spell'
]) {
    registerEffect(id, (_ctx) => { /* géré par le store via modal */ });
}

// === VISION DU TARTARE ===
registerEffect('vision_tartare', (ctx) => {
    // Si c'est un choix manuel (Joueur ou IA qui a déjà décidé)
    const bonus = ctx.optionalChoice === true;
    
    if (bonus && ctx.player.deck.length >= 2) {
        // Défausser 2 cartes
        for (let i = 0; i < 2; i++) {
            const card = ctx.player.deck.shift()!;
            ctx.player.discard.push(card);
        }
    }

    const damage = bonus ? 2 : 1;
    for (const target of ctx.targets) {
        dealDamage(target, damage, ctx.opponent, ctx.engine.getState(), { element: 'darkness' });
    }
});

// === PERSÉPHONE ZOMBIE ===
registerEffect('temp_resurrect', (ctx) => {
    // Priorité au choix du joueur (ctx.targetGodId) ; en auto (IA), prend le premier mort trouvé.
    const deadGod = ctx.targetGodId
        ? ctx.player.gods.find(g => g.card.id === ctx.targetGodId && g.isDead)
        : ctx.player.gods.find(g => g.isDead);
    if (!deadGod || ctx.player.deck.length === 0) return;

    const zombieCard = ctx.player.deck.shift()!;
    deadGod.isDead = false;
    deadGod.currentHealth = 5;
    deadGod.isZombie = true;
    deadGod.zombieCard = zombieCard;
    deadGod.zombieOwnerId = ctx.player.id;
    deadGod.statusEffects = [];
});

// ─────────────────────────────────────────────
// Utilitaires module
// ─────────────────────────────────────────────

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function cleanBlindCard(card: SpellCard): void {
    delete card.isHiddenFromOwner;
    delete card.revealedToPlayerId;
}

function findOwner(god: GodState, ctx: EffectContext): PlayerState {
    return ctx.player.gods.includes(god) ? ctx.player : ctx.opponent;
}

/**
 * Un dieu "inciblable" (statut untargetable, ex: Ruse d'Ulysse) ne peut pas être choisi comme
 * cible par un effet adverse (dégâts, statut négatif, etc). Il reste ciblable par les effets de
 * son propre camp (soin, buff) — seule la sélection PAR L'ADVERSAIRE doit être bloquée.
 */
function isUntargetable(god: GodState): boolean {
    return god.statusEffects.some(s => s.type === 'untargetable' && s.stacks > 0);
}

const LOG_HISTORY_LIMIT = 200;

/**
 * Ajoute une entrée au log de combat (consultable en jeu), pour qu'un joueur puisse vérifier
 * après coup quelle carte a été jouée — la sienne ou celle de l'adversaire — s'il l'a manquée.
 */
function logAction(state: GameState, player: PlayerState, message: string): void {
    state.log.push({
        turnNumber: state.turnNumber,
        playerId: player.id,
        playerName: player.name,
        message,
    });
    if (state.log.length > LOG_HISTORY_LIMIT) {
        state.log.splice(0, state.log.length - LOG_HISTORY_LIMIT);
    }
}

// ═══════════════════════════════════════════════
// GameEngine - Classe principale
// ═══════════════════════════════════════════════

export class GameEngine {
    private state: GameState;

    constructor(initialState: GameState) {
        this.state = JSON.parse(JSON.stringify(initialState));
    }

    // ─── Accesseurs ─────────────────────────

    getState(): GameState { return this.state; }

    getCurrentPlayer(): PlayerState {
        return this.state.players.find(p => p.id === this.state.currentPlayerId)!;
    }

    getOpponent(): PlayerState {
        return this.state.players.find(p => p.id !== this.state.currentPlayerId)!;
    }

    // ─── Point d'entrée des actions ─────────

    executeAction(action: GameAction): { success: boolean; message: string } {
        switch (action.type) {
            case 'play_card':
                return this.playCard(action);
            case 'discard_for_energy':
                return this.discardForEnergy(action);
            case 'end_turn':
                return this.endTurn();
            case 'zombie_attack':
                return this.zombieAttack(action);
            case 'cast_copied_spell':
                return this.castCopiedSpell(action);
            default:
                return { success: false, message: 'Action inconnue' };
        }
    }

    // ─── Jouer une carte ───────────────────

    private playCard(action: GameAction): { success: boolean; message: string } {
        const player = this.getCurrentPlayer();
        const cardIndex = player.hand.findIndex(c => c.id === action.cardId);

        if (cardIndex === -1) return { success: false, message: 'Carte non trouvée dans la main' };
        if (player.hasPlayedCard) return { success: false, message: 'Vous avez déjà joué une carte ce tour' };

        const card = player.hand[cardIndex];
        if (player.energy < card.energyCost) return { success: false, message: 'Pas assez d\'énergie' };

        const castingGod = player.gods.find(g => g.card.id === card.godId && !g.isDead);
        if (!castingGod) return { success: false, message: 'Le dieu de cette carte est mort' };

        // Payer et gagner l'énergie (plafonnée)
        player.energy = Math.min(player.energy - card.energyCost + card.energyGain, MAX_ENERGY);

        // Préparer les cibles
        const targetIds = action.targetGodIds || (action.targetGodId ? [action.targetGodId] : []);
        let targetIndex = 0;
        let lastUsedTargetId: string | undefined;

        player.hasPlayedCard = true;

        // Un effet custom nécessitant un choix humain est différé : on ne l'exécute pas ici,
        // le store rappellera engine.resolveDeferredEffect() une fois le choix connu.
        const isDeferred = (effect: SpellCard['effects'][0]) =>
            !!action.deferCustomEffect &&
            effect.type === 'custom' &&
            !!effect.customEffectId &&
            DEFERRED_CUSTOM_EFFECTS.has(effect.customEffectId);

        // Appliquer les effets
        for (const effect of card.effects) {
            if (isDeferred(effect)) continue;

            if (effect.target === 'same') {
                if (lastUsedTargetId) {
                    this.applyEffect(
                        effect, card, lastUsedTargetId, action.selectedElement,
                        action.lightningAction, [lastUsedTargetId],
                        action.selectedCardIds, action.healDistribution, action.optionalChoice,
                        action.selectedPlayerTarget
                    );
                }
                continue;
            }

            if (effect.target === 'self') {
                // La cible est implicitement le dieu qui lance le sort : resolveTargets('self', ...)
                // exige un targetGodId, qui n'est jamais fourni par l'appelant pour ce cas (aucune
                // sélection de cible n'est demandée au joueur). Sans ce cas, l'effet ne s'appliquait
                // jamais (bouclier/statut "sur soi" silencieusement ignorés).
                this.applyEffect(
                    effect, card, castingGod.card.id, action.selectedElement,
                    action.lightningAction, [castingGod.card.id],
                    action.selectedCardIds, action.healDistribution, action.optionalChoice,
                    action.selectedPlayerTarget
                );
                lastUsedTargetId = castingGod.card.id;
                continue;
            }

            const needsSingleTarget = ['enemy_god', 'ally_god', 'any_god', 'dead_ally_god'].includes(effect.target || '');

            if (needsSingleTarget && targetIds.length > 0) {
                if (targetIndex >= targetIds.length) {
                    lastUsedTargetId = undefined;
                    continue;
                }
                const currentTarget = targetIds[targetIndex];
                this.applyEffect(
                    effect, card, currentTarget, action.selectedElement,
                    action.lightningAction, [currentTarget],
                    action.selectedCardIds, action.healDistribution, action.optionalChoice,
                    action.selectedPlayerTarget
                );
                lastUsedTargetId = currentTarget;
                targetIndex++;
            } else if (!effect.target && effect.type === 'custom') {
                this.applyEffect(
                    effect, card, action.targetGodId, action.selectedElement,
                    action.lightningAction, targetIds.length > 0 ? targetIds : undefined,
                    action.selectedCardIds, action.healDistribution, action.optionalChoice,
                    action.selectedPlayerTarget
                );
            } else if (!effect.target && lastUsedTargetId) {
                this.applyEffect(
                    effect, card, lastUsedTargetId, action.selectedElement,
                    action.lightningAction, [lastUsedTargetId],
                    action.selectedCardIds, action.healDistribution, action.optionalChoice,
                    action.selectedPlayerTarget
                );
            } else {
                this.applyEffect(
                    effect, card, action.targetGodId, action.selectedElement,
                    action.lightningAction, action.targetGodIds,
                    action.selectedCardIds, action.healDistribution, action.optionalChoice,
                    action.selectedPlayerTarget
                );
            }
        }

        // Défausser la carte
        player.hand.splice(cardIndex, 1);
        cleanBlindCard(card);
        player.discard.push(card);

        logAction(this.state, player, `a joué ${card.name}`);

        return { success: true, message: `${card.name} joué avec succès` };
    }

    // ─── Résolution différée d'un effet custom (choix du joueur) ─────

    /**
     * Résout un effet custom qui avait été différé (deferCustomEffect: true) lors du play_card
     * initial, une fois le choix du joueur connu (cible, direction, distribution, etc.).
     * Recherche la carte dans la défausse du joueur courant (elle y a déjà été mise par playCard).
     */
    resolveDeferredEffect(
        cardId: string,
        extra: {
            targetGodId?: string;
            targetGodIds?: string[];
            selectedCardIds?: string[];
            healDistribution?: { godId: string, amount: number }[];
            optionalChoice?: boolean;
            selectedElement?: Element;
            lightningAction?: 'apply' | 'remove';
            selectedPlayerTarget?: 'self' | 'opponent';
        }
    ): { success: boolean; message: string } {
        const player = this.getCurrentPlayer();
        const card = player.discard.find(c => c.id === cardId);
        if (!card) return { success: false, message: 'Carte introuvable dans la défausse' };

        const effect = card.effects.find(
            e => e.type === 'custom' && e.customEffectId && DEFERRED_CUSTOM_EFFECTS.has(e.customEffectId)
        );
        if (!effect) return { success: false, message: 'Aucun effet différé sur cette carte' };

        this.applyEffect(
            effect, card,
            extra.targetGodId, extra.selectedElement, extra.lightningAction,
            extra.targetGodIds, extra.selectedCardIds, extra.healDistribution, extra.optionalChoice,
            extra.selectedPlayerTarget
        );

        return { success: true, message: `${card.name} résolu` };
    }

    // ─── Défausser pour énergie ────────────

    private discardForEnergy(action: GameAction): { success: boolean; message: string } {
        const player = this.getCurrentPlayer();
        if (player.hasPlayedCard) return { success: false, message: 'Vous avez déjà joué une carte ce tour. Défausse impossible.' };

        const cardIndex = player.hand.findIndex(c => c.id === action.cardId);
        if (cardIndex === -1) return { success: false, message: 'Carte non trouvée dans la main' };

        const card = player.hand[cardIndex];
        player.hand.splice(cardIndex, 1);
        cleanBlindCard(card);
        player.discard.push(card);

        if (!player.hasDiscardedForEnergy) {
            player.energy = Math.min(player.energy + 1, MAX_ENERGY);
            player.hasDiscardedForEnergy = true;
            logAction(this.state, player, `a défaussé ${card.name} (+1 énergie)`);
            return { success: true, message: `${card.name} défaussé, +1 énergie` };
        }
        logAction(this.state, player, `a défaussé ${card.name}`);
        return { success: true, message: `${card.name} défaussé (énergie déjà gagnée ce tour)` };
    }

    // ─── Attaque zombie ──────────────────

    private zombieAttack(action: GameAction): { success: boolean; message: string } {
        const opponent = this.getOpponent();
        if (!action.targetGodId) return { success: false, message: 'Aucune cible spécifiée pour l\'attaque zombie' };

        const target = opponent.gods.find(g => g.card.id === action.targetGodId && !g.isDead);
        if (!target) return { success: false, message: 'Cible invalide ou déjà morte' };

        const player = this.getCurrentPlayer();
        const zombieCount = player.gods.filter(g => g.isZombie && !g.isDead).length;
        const damage = Math.max(1, zombieCount);

        dealDamage(target, damage, opponent, this.state, { element: 'darkness' as Element });

        return { success: true, message: 'Attaque zombie effectuée' };
    }

    // ─── Sort copié ─────────────────────

    private castCopiedSpell(action: GameAction): { success: boolean; message: string } {
        const player = this.getCurrentPlayer();
        const copiedCard = player.discard.find(c => c.id === action.copiedCardId);
        if (!copiedCard) return { success: false, message: "Carte à copier non trouvée" };

        const clonedCard = JSON.parse(JSON.stringify(copiedCard));
        clonedCard.id = `copy_${Date.now()}_${clonedCard.id}`;
        clonedCard.element = 'darkness';
        clonedCard.energyCost = 0;

        player.hand.push(clonedCard);
        player.hasPlayedCard = false;

        const playAction: GameAction = {
            type: 'play_card',
            playerId: action.playerId,
            cardId: clonedCard.id,
            targetGodId: action.targetGodId,
            targetGodIds: action.targetGodIds,
            selectedElement: action.selectedElement,
            lightningAction: action.lightningAction,
            selectedCardIds: action.selectedCardIds,
            healDistribution: action.healDistribution,
            optionalChoice: action.optionalChoice
        };

        const result = this.playCard(playAction);

        if (!result.success) {
            player.hasPlayedCard = true;
            const copyIndex = player.hand.findIndex(c => c.id === clonedCard.id);
            if (copyIndex !== -1) player.hand.splice(copyIndex, 1);
            return result;
        }

        return { success: true, message: `Sort copié lancé: ${result.message}` };
    }

    // ─── Fin de tour ─────────────────────

    endTurn(): { success: boolean; message: string } {
        if (this.state.status !== 'playing') return { success: false, message: 'La partie est terminée' };

        const previousPlayer = this.getCurrentPlayer();

        // Tick des effets de statut (regen, poison, durées)
        tickStatusEffects(previousPlayer, this.state);

        // Vérifier si la partie est terminée après les effets
        if (this.state.status !== 'playing') {
            return { success: true, message: 'La partie est terminée' };
        }

        // Passer au joueur suivant
        const nextPlayer = this.getOpponent();
        this.state.currentPlayerId = nextPlayer.id;

        // Incrémenter le compteur de tours
        if (nextPlayer.id === this.state.players[0].id) {
            this.state.turnNumber++;

            // Vérifier limite de tours (online)
            if (this.state.maxTurns && this.state.turnNumber > this.state.maxTurns) {
                this.state.status = 'finished';
                this.resolveByHealthTotal();
                return { success: true, message: 'Limite de tours atteinte' };
            }
        }

        // Réinitialiser les flags du nouveau joueur
        nextPlayer.hasPlayedCard = false;
        nextPlayer.hasDiscardedForEnergy = false;

        // Pas de gain d'énergie passif en début de tour : l'énergie ne vient que des cartes
        // générateurs (energyGain) et de la défausse volontaire contre énergie
        // (discardForEnergy, une fois par tour).

        // Piocher jusqu'à la limite
        this.drawToHandLimit(nextPlayer);

        return { success: true, message: `Tour de ${nextPlayer.name}` };
    }

    // ─── Pioche ──────────────────────────

    drawToHandLimit(player: PlayerState): void {
        while (player.hand.length < HAND_LIMIT) {
            if (player.deck.length === 0) {
                // Recycler la défausse
                if (player.discard.length === 0) break; // Plus de cartes du tout

                player.fatigueCounter++;
                const fatigueDamage = player.fatigueCounter;

                // Recycler les cartes de dieux encore vivants
                const aliveGodIds = new Set(player.gods.filter(g => !g.isDead).map(g => g.card.id));
                const recyclableCards = player.discard.filter(c => aliveGodIds.has(c.godId));

                if (recyclableCards.length === 0) break;

                // Retirer les cartes recyclables de la défausse et les remettre dans le deck
                player.discard = player.discard.filter(c => !aliveGodIds.has(c.godId));
                player.deck.push(...recyclableCards);
                shuffleArray(player.deck);

                // Appliquer les dégâts de fatigue à tous les dieux vivants
                for (const god of player.gods) {
                    if (!god.isDead) {
                        god.currentHealth -= fatigueDamage;
                        if (god.currentHealth <= 0) {
                            handleGodDeath(player, god, this.state);
                        }
                    }
                }

                if (this.state.status !== 'playing') return;
            }

            if (player.deck.length > 0) {
                const card = player.deck.shift()!;
                player.hand.push(card);
            } else {
                break;
            }
        }
    }

    // ─── Application des effets ─────────

    private applyEffect(
        effect: SpellCard['effects'][0],
        card: SpellCard,
        targetGodId?: string,
        selectedElement?: Element,
        lightningAction?: 'apply' | 'remove',
        targetGodIds?: string[],
        selectedCardIds?: string[],
        healDistribution?: { godId: string, amount: number }[],
        optionalChoice?: boolean,
        selectedPlayerTarget?: 'self' | 'opponent'
    ): void {
        const player = this.getCurrentPlayer();
        const opponent = this.getOpponent();
        const targets = this.resolveTargets(effect.target, player, opponent, targetGodId, targetGodIds);

        const ctx: EffectContext = {
            engine: this,
            player,
            opponent,
            castingGod: player.gods.find(g => g.card.id === card.godId && !g.isDead),
            card,
            targets,
            targetGodId,
            targetGodIds,
            selectedElement,
            lightningAction,
            selectedCardIds,
            healDistribution,
            optionalChoice,
            selectedPlayerTarget
        };

        switch (effect.type) {
            case 'damage':
                for (const target of targets) {
                    dealDamage(target, effect.value || 0,
                        player.gods.includes(target) ? player : opponent,
                        this.state,
                        { element: card.element }
                    );
                }
                break;

            case 'heal':
                for (const target of targets) {
                    healGod(target, effect.value || 0);
                }
                break;

            case 'shield':
                for (const target of targets) {
                    addShield(target, effect.value || 0);
                }
                break;

            case 'discard': {
                let discardPlayer: PlayerState;
                if (effect.target === 'enemy_god' || effect.target === 'all_enemies') {
                    discardPlayer = opponent;
                } else if (effect.target === 'ally_god' || effect.target === 'all_allies' || effect.target === 'self') {
                    discardPlayer = player;
                } else {
                    discardPlayer = targets.some(t => player.gods.includes(t)) ? player : opponent;
                }
                const count = effect.value || 1;
                for (let i = 0; i < count; i++) {
                    if (discardPlayer.hand.length > 0) {
                        const rndIdx = Math.floor(Math.random() * discardPlayer.hand.length);
                        const c = discardPlayer.hand[rndIdx];
                        discardPlayer.hand.splice(rndIdx, 1);
                        cleanBlindCard(c);
                        discardPlayer.discard.push(c);
                    }
                }
                break;
            }

            case 'energy':
                player.energy = Math.min(player.energy + (effect.value || 0), MAX_ENERGY);
                break;

            case 'draw':
                for (let i = 0; i < (effect.value || 1); i++) {
                    if (player.deck.length > 0) {
                        player.hand.push(player.deck.shift()!);
                    }
                }
                break;

            case 'mill': {
                const millTarget = effect.target === 'self' ? player : opponent;
                for (let i = 0; i < (effect.value || 1); i++) {
                    if (millTarget.deck.length > 0) {
                        const c = millTarget.deck.shift()!;
                        cleanBlindCard(c);
                        millTarget.discard.push(c);
                    }
                }
                break;
            }

            case 'status':
                for (const target of targets) {
                    if (effect.status) {
                        addStatus(target, effect.status as any, effect.value || 1, effect.statusDuration);
                    }
                }
                break;

            case 'remove_status':
                for (const target of targets) {
                    if (effect.status) {
                        removeStatus(target, effect.status as any);
                    }
                }
                break;

            case 'custom': {
                const effectId = effect.customEffectId || '';
                const handler = customEffects.get(effectId);
                if (handler) {
                    // Réutilise ctx tel quel : il porte déjà selectedCardIds/healDistribution/
                    // optionalChoice/selectedPlayerTarget/targetGodIds nécessaires aux handlers
                    // en mode "choix du joueur" (avant cette correction, ces champs étaient
                    // silencieusement perdus ici, ce qui forçait les handlers custom à toujours
                    // retomber sur leur branche "auto").
                    handler(ctx);
                } else {
                    console.warn(`Effet custom non implémenté: ${effectId}`);
                }
                break;
            }
        }
    }

    // ─── Résolution des cibles ──────────

    private resolveTargets(
        targetType: string | undefined,
        player: PlayerState,
        opponent: PlayerState,
        targetGodId?: string,
        targetGodIds?: string[]
    ): GodState[] {
        switch (targetType) {
            case 'enemy_god':
                if (targetGodId) {
                    const t = opponent.gods.find(g => g.card.id === targetGodId && !g.isDead && !isUntargetable(g));
                    return t ? [t] : [];
                }
                return [];

            case 'ally_god':
                if (targetGodId) {
                    const t = player.gods.find(g => g.card.id === targetGodId && !g.isDead);
                    return t ? [t] : [];
                }
                return [];

            case 'any_god':
                if (targetGodId) {
                    const t = [...player.gods, ...opponent.gods].find(g => g.card.id === targetGodId && !g.isDead);
                    if (t && opponent.gods.includes(t) && isUntargetable(t)) return [];
                    return t ? [t] : [];
                }
                return [];

            case 'dead_ally_god':
                if (targetGodId) {
                    const t = player.gods.find(g => g.card.id === targetGodId && g.isDead);
                    return t ? [t] : [];
                }
                return [];

            case 'all_enemies':
                return opponent.gods.filter(g => !g.isDead && !isUntargetable(g));

            case 'all_allies':
                return player.gods.filter(g => !g.isDead);

            case 'self':
                if (targetGodId) {
                    const self = player.gods.find(g => g.card.id === targetGodId && !g.isDead);
                    return self ? [self] : [];
                }
                return [];

            default:
                if (targetGodIds && targetGodIds.length > 0) {
                    return [...player.gods, ...opponent.gods].filter(
                        g => targetGodIds.includes(g.card.id) && !g.isDead && !(opponent.gods.includes(g) && isUntargetable(g))
                    );
                }
                if (targetGodId) {
                    const all = [...player.gods, ...opponent.gods];
                    const t = all.find(g => g.card.id === targetGodId && !g.isDead);
                    if (t && opponent.gods.includes(t) && isUntargetable(t)) return [];
                    return t ? [t] : [];
                }
                return [];
        }
    }

    // ─── API publiques ──────────────────

    canGodAct(god: GodState): boolean {
        return canGodAct(god);
    }

    killGod(playerId: string, godId: string): void {
        const player = this.state.players.find(p => p.id === playerId);
        if (!player) return;
        const god = player.gods.find(g => g.card.id === godId);
        if (!god) return;
        handleGodDeath(player, god, this.state);
    }

    getValidTargets(targetType: SpellCard['effects'][0]['target'], isMultiTarget: boolean = false): GodState[] {
        const player = this.getCurrentPlayer();
        const opponent = this.getOpponent();

        const provokers = opponent.gods.filter(
            g => !g.isDead && !isUntargetable(g) && g.statusEffects.some(s => s.type === 'provocation')
        );

        if (provokers.length > 0 && targetType === 'enemy_god' && !isMultiTarget) {
            return provokers;
        }

        switch (targetType) {
            case 'enemy_god': return opponent.gods.filter(g => !g.isDead && !isUntargetable(g));
            case 'ally_god': return player.gods.filter(g => !g.isDead);
            case 'dead_ally_god': return player.gods.filter(g => g.isDead);
            case 'any_god': return [
                ...player.gods.filter(g => !g.isDead),
                ...opponent.gods.filter(g => !g.isDead && !isUntargetable(g)),
            ];
            default: return [];
        }
    }

    getRequiredTargets(targetType: SpellCard['effects'][0]['target']): GodState[] {
        const opponent = this.getOpponent();
        if (targetType === 'enemy_god') {
            return opponent.gods.filter(
                g => !g.isDead && !isUntargetable(g) && g.statusEffects.some(s => s.type === 'provocation')
            );
        }
        return [];
    }

    // ─── Résolution par PV (online) ────

    private resolveByHealthTotal(): void {
        const p1 = this.state.players[0];
        const p2 = this.state.players[1];
        const p1Health = p1.gods.reduce((sum, g) => sum + (g.isDead ? 0 : g.currentHealth), 0);
        const p2Health = p2.gods.reduce((sum, g) => sum + (g.isDead ? 0 : g.currentHealth), 0);

        if (p1Health > p2Health) this.state.winnerId = p1.id;
        else if (p2Health > p1Health) this.state.winnerId = p2.id;
        else this.state.winnerId = undefined; // Égalité
    }

    // ─── Gestion de la mort (privée) ───
    // Gardée pour compatibilité interne, délègue au DamageSystem
    private handleGodDeath(owner: PlayerState, god: GodState): void {
        handleGodDeath(owner, god, this.state);
    }

    // ─── Création d'état initial ────────

    static createInitialState(
        player1Id: string,
        player1Name: string,
        player1Gods: GodCard[],
        player1Deck: SpellCard[],
        player2Id: string,
        player2Name: string,
        player2Gods: GodCard[],
        player2Deck: SpellCard[],
        firstPlayerId: string,
        options?: { isOnlineGame?: boolean; maxTurns?: number }
    ): GameState {
        const createPlayerState = (
            id: string, name: string, gods: GodCard[], deck: SpellCard[], isFirst: boolean
        ): PlayerState => ({
            id,
            name,
            gods: gods.map(god => ({
                card: god,
                currentHealth: god.maxHealth,
                statusEffects: [],
                isDead: false,
            })),
            hand: [],
            deck: shuffleArray([...deck]),
            discard: [],
            removedCards: [],
            energy: isFirst ? 0 : 1,
            fatigueCounter: 0,
            hasPlayedCard: false,
            hasDiscardedForEnergy: false,
        });

        const isPlayer1First = firstPlayerId === player1Id;
        const isOnline = options?.isOnlineGame ?? false;
        const maxTurns = options?.maxTurns ?? (isOnline ? 50 : undefined);

        const state: GameState = {
            id: generateUUID(),
            status: 'playing',
            currentPlayerId: firstPlayerId,
            turnNumber: 1,
            maxTurns,
            isOnlineGame: isOnline,
            players: [
                createPlayerState(player1Id, player1Name, player1Gods, player1Deck, isPlayer1First),
                createPlayerState(player2Id, player2Name, player2Gods, player2Deck, !isPlayer1First),
            ],
            log: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const engine = new GameEngine(state);
        engine.drawToHandLimit(engine.state.players[0]);
        engine.drawToHandLimit(engine.state.players[1]);

        return engine.getState();
    }
}
