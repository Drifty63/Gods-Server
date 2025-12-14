// Moteur de jeu principal pour GODS

import {
    GameState,
    PlayerState,
    GodState,
    SpellCard,
    GameAction,
    StatusEffect,
    GodCard
} from '@/types/cards';
import { calculateDamage, getWeakness } from './ElementSystem';

// Fonction utilitaire pour générer un UUID compatible HTTP (non sécurisé)
const generateUUID = () => {
    // Vérifier si nous sommes dans un environnement navigateur sécurisé
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    // Fallback pour les environnements non sécurisés (HTTP) ou sans crypto
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * Classe principale du moteur de jeu
 */
export class GameEngine {
    private state: GameState;

    constructor(initialState: GameState) {
        this.state = JSON.parse(JSON.stringify(initialState)); // Deep clone
    }

    /**
     * Obtient l'état actuel du jeu
     */
    getState(): GameState {
        return this.state;
    }

    /**
     * Obtient le joueur actuel
     */
    getCurrentPlayer(): PlayerState {
        return this.state.players.find(p => p.id === this.state.currentPlayerId)!;
    }

    /**
     * Obtient le joueur adverse
     */
    getOpponent(): PlayerState {
        return this.state.players.find(p => p.id !== this.state.currentPlayerId)!;
    }

    /**
     * Exécute une action de jeu
     */
    executeAction(action: GameAction): { success: boolean; message: string } {
        switch (action.type) {
            case 'play_card':
                return this.playCard(action);
            case 'discard_for_energy':
                return this.discardForEnergy(action);
            case 'end_turn':
                return this.endTurn();
            default:
                return { success: false, message: 'Action inconnue' };
        }
    }

    /**
     * Joue une carte depuis la main
     */
    private playCard(action: GameAction): { success: boolean; message: string } {
        const player = this.getCurrentPlayer();
        const cardIndex = player.hand.findIndex(c => c.id === action.cardId);

        if (cardIndex === -1) {
            return { success: false, message: 'Carte non trouvée dans la main' };
        }

        const card = player.hand[cardIndex];

        // Vérifier le coût en énergie
        if (player.energy < card.energyCost) {
            return { success: false, message: 'Pas assez d\'énergie' };
        }

        // Trouver le dieu qui lance le sort
        const castingGod = player.gods.find(g => g.card.id === card.godId && !g.isDead);
        if (!castingGod) {
            return { success: false, message: 'Le dieu de cette carte est mort' };
        }

        // Appliquer les dégâts de poison avant le sort
        // Le poison est permanent et inflige des dégâts à chaque sort lancé par le dieu
        const poisonStacks = this.getStatusStacks(castingGod, 'poison');
        if (poisonStacks > 0) {
            castingGod.currentHealth -= poisonStacks;
            if (castingGod.currentHealth <= 0) {
                this.handleGodDeath(player, castingGod);

                // Le tour se termine immédiatement
                this.endTurn();

                return { success: true, message: `${castingGod.card.name} est mort du poison ! Le tour passe à l'adversaire.` };
            }
        }

        // Payer le coût
        player.energy -= card.energyCost;

        // Gagner l'énergie de la carte
        player.energy += card.energyGain;

        // Préparer les cibles multiples
        const targetIds = action.targetGodIds || (action.targetGodId ? [action.targetGodId] : []);
        let targetIndex = 0;
        let lastUsedTargetId: string | undefined = undefined;

        // Appliquer les effets
        for (const effect of card.effects) {
            // Pour les effets qui ciblent enemy_god ou ally_god, utiliser une cible de la liste
            const needsSingleTarget = effect.target === 'enemy_god' || effect.target === 'ally_god' || effect.target === 'any_god' || effect.target === 'dead_ally_god';

            if (needsSingleTarget && targetIds.length > 0) {
                // Utiliser la prochaine cible disponible dans la liste
                const currentTarget = targetIds[Math.min(targetIndex, targetIds.length - 1)];
                this.applyEffect(effect, card, currentTarget, action.selectedElement, action.lightningAction, [currentTarget]);
                lastUsedTargetId = currentTarget;
                targetIndex++;
            } else if (!effect.target && lastUsedTargetId) {
                // Effet sans target explicite : appliquer à la dernière cible utilisée
                this.applyEffect(effect, card, lastUsedTargetId, action.selectedElement, action.lightningAction, [lastUsedTargetId]);
            } else {
                // Effet sans ciblage spécifique ou ciblage de groupe (all_enemies, all_allies, self)
                this.applyEffect(effect, card, action.targetGodId, action.selectedElement, action.lightningAction, action.targetGodIds);
            }
        }

        // Déplacer la carte vers la défausse
        player.hand.splice(cardIndex, 1);
        player.discard.push(card);

        // Marquer que le joueur a joué une carte ce tour
        player.hasPlayedCard = true;

        return { success: true, message: `${card.name} joué avec succès` };
    }

    /**
     * Défausse une carte (plusieurs possibles par tour, mais +1 énergie max)
     * Exclusif avec jouer une carte : si on défausse, on ne peut plus jouer
     */
    private discardForEnergy(action: GameAction): { success: boolean; message: string } {
        const player = this.getCurrentPlayer();

        // Vérifier si le joueur a déjà joué une carte ce tour
        if (player.hasPlayedCard) {
            return { success: false, message: 'Vous avez déjà joué une carte ce tour. Défausse impossible.' };
        }

        const cardIndex = player.hand.findIndex(c => c.id === action.cardId);

        if (cardIndex === -1) {
            return { success: false, message: 'Carte non trouvée dans la main' };
        }

        const card = player.hand[cardIndex];

        // Retirer de la main et ajouter à la défausse
        player.hand.splice(cardIndex, 1);
        player.discard.push(card);

        // Gagner 1 énergie SEULEMENT si c'est la première défausse du tour
        if (!player.hasDiscardedForEnergy) {
            player.energy += 1;
            player.hasDiscardedForEnergy = true;
            return { success: true, message: `${card.name} défaussé, +1 énergie` };
        } else {
            return { success: true, message: `${card.name} défaussé (énergie déjà gagnée ce tour)` };
        }
    }

    /**
     * Termine le tour actuel
     */
    private endTurn(): { success: boolean; message: string } {
        // Récupérer le joueur qui finit son tour (avant de changer)
        const previousPlayer = this.getCurrentPlayer();

        // Passer au joueur suivant
        const currentIndex = this.state.players.findIndex(p => p.id === this.state.currentPlayerId);
        const nextIndex = (currentIndex + 1) % 2;

        const nextPlayer = this.state.players[nextIndex];
        this.state.currentPlayerId = nextPlayer.id;

        // Réinitialiser les flags de tour pour le nouveau joueur
        nextPlayer.hasPlayedCard = false;
        nextPlayer.hasDiscardedForEnergy = false;

        // Incrémenter le numéro de tour
        if (nextIndex === 0) {
            this.state.turnNumber++;
        }

        // Piocher pour le nouveau joueur actuel
        this.drawToHandLimit(this.getCurrentPlayer());

        // Réduire la durée des effets temporaires pour le joueur qui vient de finir
        // (les effets sont comptés en "tours du lanceur")
        this.tickStatusEffects(previousPlayer);

        return { success: true, message: 'Tour terminé' };
    }

    /**
     * Pioche des cartes jusqu'à avoir 5 cartes en main (ou le max possible)
     */
    private drawToHandLimit(player: PlayerState): void {
        const handLimit = 5;
        const livingGodIds = player.gods.filter(g => !g.isDead).map(g => g.card.id);

        while (player.hand.length < handLimit) {
            // Trouver une carte valide (d'un dieu vivant) dans le deck
            let validCardIndex = player.deck.findIndex(c => livingGodIds.includes(c.godId));

            // Si pas de carte valide dans le deck, essayer de recycler
            if (validCardIndex === -1) {
                if (player.discard.length > 0) {
                    // Recycler la défausse (applique fatigue)
                    this.recycleDeck(player);
                    // Réessayer de trouver une carte valide après recyclage
                    validCardIndex = player.deck.findIndex(c => livingGodIds.includes(c.godId));
                }

                // Toujours pas de carte valide après recyclage
                if (validCardIndex === -1) {
                    break;
                }
            }

            const card = player.deck.splice(validCardIndex, 1)[0];
            player.hand.push(card);
        }
    }

    /**
     * Recycle la défausse en nouveau deck (fatigue)
     */
    private recycleDeck(player: PlayerState): void {
        if (player.discard.length === 0) return;

        // Incrémenter le compteur de fatigue
        player.fatigueCounter++;

        // Infliger des dégâts de fatigue à tous les dieux vivants
        for (const god of player.gods) {
            if (!god.isDead) {
                god.currentHealth -= player.fatigueCounter;
                if (god.currentHealth <= 0) {
                    this.handleGodDeath(player, god);
                }
            }
        }

        // Mélanger la défausse et en faire le nouveau deck
        player.deck = this.shuffleArray([...player.discard]);
        player.discard = [];
    }

    /**
     * Gère la mort d'un dieu
     */
    private handleGodDeath(player: PlayerState, god: GodState): void {
        god.isDead = true;
        god.currentHealth = 0;

        // Retirer toutes les cartes de ce dieu de la main, du deck et de la défausse
        const godId = god.card.id;
        player.hand = player.hand.filter(c => c.godId !== godId);
        player.deck = player.deck.filter(c => c.godId !== godId);
        player.discard = player.discard.filter(c => c.godId !== godId);

        // Vérifier si le joueur a perdu (tous les dieux morts)
        // IMPORTANT: Ne pas écraser le gagnant si la partie est déjà terminée
        // Cela permet aux sorts comme ceux d'Arès d'infliger les dégâts d'abord
        // puis de recevoir les dégâts ensuite. Si l'ennemi meurt en premier,
        // le joueur actuel a gagné même s'il meurt ensuite du contrecoup.
        if (this.state.status !== 'finished') {
            const allDead = player.gods.every(g => g.isDead);
            if (allDead) {
                this.state.status = 'finished';
                this.state.winnerId = this.getOpponent().id;
            }
        }
    }

    /**
     * Applique un effet de sort
     */
    private applyEffect(
        effect: SpellCard['effects'][0],
        card: SpellCard,
        targetGodId?: string,
        selectedElement?: import('@/types/cards').Element,
        lightningAction?: 'apply' | 'remove',
        targetGodIds?: string[]
    ): void {
        const player = this.getCurrentPlayer();
        const opponent = this.getOpponent();

        const getTargetGods = (): GodState[] => {
            // Si une cible spécifique est définie dans l'effet
            if (effect.target) {
                switch (effect.target) {
                    case 'enemy_god':
                        if (targetGodId) {
                            const target = opponent.gods.find(g => g.card.id === targetGodId && !g.isDead);
                            return target ? [target] : [];
                        }
                        return [];
                    case 'all_enemies':
                        return opponent.gods.filter(g => !g.isDead);
                    case 'ally_god':
                        if (targetGodId) {
                            const target = player.gods.find(g => g.card.id === targetGodId && !g.isDead);
                            return target ? [target] : [];
                        }
                        return [];
                    case 'all_allies':
                        return player.gods.filter(g => !g.isDead);
                    case 'self':
                        const caster = player.gods.find(g => g.card.id === card.godId && !g.isDead);
                        return caster ? [caster] : [];
                    case 'all_gods':
                        return [...player.gods, ...opponent.gods].filter(g => !g.isDead);
                    case 'dead_ally_god':
                        if (targetGodId) {
                            const deadTarget = player.gods.find(g => g.card.id === targetGodId && g.isDead);
                            return deadTarget ? [deadTarget] : [];
                        }
                        return [];
                }
            }

            // Si pas de cible définie dans l'effet (ex: custom effect toggle), utiliser les cibles fournies
            if (targetGodIds && targetGodIds.length > 0) {
                const allGods = [...player.gods, ...opponent.gods];
                return allGods.filter(g => targetGodIds.includes(g.card.id) && !g.isDead);
            }

            if (targetGodId) {
                const allGods = [...player.gods, ...opponent.gods];
                const target = allGods.find(g => g.card.id === targetGodId && !g.isDead);
                return target ? [target] : [];
            }

            return [];
        };

        const targets = getTargetGods();

        switch (effect.type) {
            case 'damage':
                for (const target of targets) {
                    // Vérifier si la cible a l'immunité aux faiblesses
                    const hasWeaknessImmunity = target.statusEffects.some(s => s.type === 'weakness_immunity');
                    // Utiliser la faiblesse temporaire si elle existe, sinon la faiblesse naturelle
                    // Si immunité, utiliser l'élément d'attaque comme "faiblesse" pour éviter le bonus
                    const weakness = hasWeaknessImmunity
                        ? card.element  // Pas de bonus (même élément = multiplicateur 1)
                        : (target.temporaryWeakness || target.card.weakness);
                    const { damage, isWeakness } = calculateDamage(
                        effect.value || 0,
                        card.element,
                        weakness
                    );

                    let damageToInflict = damage;

                    // Vérifier s'il y a un bouclier actif
                    const shieldIndex = target.statusEffects.findIndex(s => s.type === 'shield');
                    if (shieldIndex !== -1) {
                        const shield = target.statusEffects[shieldIndex];
                        if (shield.stacks >= damageToInflict) {
                            shield.stacks -= damageToInflict;
                            damageToInflict = 0;
                        } else {
                            damageToInflict -= shield.stacks;
                            shield.stacks = 0;
                            // Retirer le statut si bouclier épuisé
                            target.statusEffects.splice(shieldIndex, 1);
                        }
                    }

                    target.currentHealth -= damageToInflict;

                    if (target.currentHealth <= 0) {
                        // Trouver le propriétaire du dieu
                        const owner = player.gods.includes(target) ? player : opponent;
                        this.handleGodDeath(owner, target);
                    }
                }
                break;

            case 'heal':
                for (const target of targets) {
                    const healAmount = effect.value || 0;

                    // Le soin fait les deux en même temps :
                    // - Soigne de la valeur du soin
                    // - ET retire du poison de la même valeur

                    // 1. Retirer le poison (min entre heal et stacks de poison)
                    const poisonIndex = target.statusEffects.findIndex(s => s.type === 'poison');
                    if (poisonIndex !== -1) {
                        const poisonToRemove = Math.min(healAmount, target.statusEffects[poisonIndex].stacks);
                        target.statusEffects[poisonIndex].stacks -= poisonToRemove;
                        if (target.statusEffects[poisonIndex].stacks <= 0) {
                            target.statusEffects.splice(poisonIndex, 1);
                        }
                    }

                    // 2. Soigner (indépendamment du poison), limité au max HP
                    target.currentHealth = Math.min(
                        target.currentHealth + healAmount,
                        target.card.maxHealth
                    );
                }
                break;

            case 'shield':
                for (const target of targets) {
                    // Ajouter uniquement le statut bouclier (pas de PV)
                    this.addStatus(target, 'shield', effect.value || 0);
                }
                break;

            case 'discard':
                // Défaussement aléatoire de cartes de la main
                const targetPlayer = targets.some(t => player.gods.includes(t)) ? player : opponent;
                const count = effect.value || 1;

                for (let i = 0; i < count; i++) {
                    if (targetPlayer.hand.length > 0) {
                        // Choisir une carte aléatoire à défausser
                        const randomIndex = Math.floor(Math.random() * targetPlayer.hand.length);
                        const card = targetPlayer.hand[randomIndex];
                        targetPlayer.hand.splice(randomIndex, 1);
                        targetPlayer.discard.push(card);
                    }
                }
                break;

            case 'energy':
                player.energy += effect.value || 0;
                break;

            case 'draw':
                for (let i = 0; i < (effect.value || 1); i++) {
                    if (player.deck.length > 0) {
                        const card = player.deck.shift()!;
                        player.hand.push(card);
                    }
                }
                break;

            case 'mill':
                // Fait défausser des cartes du deck adverse
                for (let i = 0; i < (effect.value || 1); i++) {
                    if (opponent.deck.length > 0) {
                        const card = opponent.deck.shift()!;
                        opponent.discard.push(card);
                    }
                }
                break;

            case 'status':
                for (const target of targets) {
                    if (effect.status) {
                        this.addStatus(target, effect.status, effect.value || 1, effect.statusDuration);
                    }
                }
                break;

            case 'remove_status':
                for (const target of targets) {
                    if (effect.status) {
                        this.removeStatus(target, effect.status);
                    }
                }
                break;

            case 'custom':
                this.applyCustomEffect(effect.customEffectId || '', card, player, opponent, targets, targetGodId, selectedElement, lightningAction);
                break;
        }
    }

    /**
     * Applique un effet personnalisé
     */
    private applyCustomEffect(
        effectId: string,
        card: SpellCard,
        player: PlayerState,
        opponent: PlayerState,
        targets: GodState[],
        targetGodId?: string,
        selectedElement?: import('@/types/cards').Element,
        lightningAction?: 'apply' | 'remove'
    ): void {
        const castingGod = player.gods.find(g => g.card.id === card.godId && !g.isDead);

        switch (effectId) {
            // ========================================
            // DEMETER - Résurrection
            // ========================================
            case 'revive_god':
                // Ressuscite le dieu mort ciblé avec 8 PV
                if (targetGodId) {
                    const godToRevive = player.gods.find(g => g.card.id === targetGodId && g.isDead);
                    if (godToRevive) {
                        godToRevive.isDead = false;
                        godToRevive.currentHealth = 8;
                        godToRevive.statusEffects = [];
                        godToRevive.temporaryWeakness = undefined;

                        // Récupérer les sorts du dieu depuis la défausse et les remettre dans le deck
                        const godId = godToRevive.card.id;
                        const cardsToReturn: SpellCard[] = [];

                        // Trouver les cartes du dieu dans la défausse
                        player.discard = player.discard.filter(card => {
                            if (card.godId === godId) {
                                cardsToReturn.push(card);
                                return false; // Retirer de la défausse
                            }
                            return true;
                        });

                        // Ajouter les cartes au deck
                        player.deck.push(...cardsToReturn);

                        // Mélanger le deck (Fisher-Yates)
                        for (let i = player.deck.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [player.deck[i], player.deck[j]] = [player.deck[j], player.deck[i]];
                        }
                    }
                }
                break;

            // ========================================
            // DIONYSOS - Soin par poison
            // ========================================
            case 'heal_by_poison':
                // Soigne un personnage du nombre total de poisons sur les ennemis
                let totalPoisonStacks = 0;
                for (const god of opponent.gods) {
                    if (!god.isDead) {
                        totalPoisonStacks += this.getStatusStacks(god, 'poison');
                    }
                }
                if (totalPoisonStacks > 0 && targets.length > 0) {
                    const healTarget = targets[0];
                    healTarget.currentHealth = Math.min(
                        healTarget.currentHealth + totalPoisonStacks,
                        healTarget.card.maxHealth
                    );
                }
                break;

            // ========================================
            // HADÈS - Soin si kill
            // ========================================
            case 'heal_if_kill_8':
                // Vérifie si la cible est morte après les dégâts de la carte
                if (targetGodId) {
                    const target = opponent.gods.find(g => g.card.id === targetGodId);
                    if (target && target.isDead && castingGod) {
                        castingGod.currentHealth = Math.min(
                            castingGod.currentHealth + 8,
                            castingGod.card.maxHealth
                        );
                    }
                }
                break;

            // ========================================
            // HADÈS - Vol de vie
            // ========================================
            case 'lifesteal_damage':
                // Soigne du nombre de dégâts infligés (déjà appliqués par l'effet damage)
                // Note: On prend la valeur de dégâts de l'effet damage précédent (3)
                if (castingGod) {
                    castingGod.currentHealth = Math.min(
                        castingGod.currentHealth + 3,
                        castingGod.card.maxHealth
                    );
                }
                break;

            // ========================================
            // APOLLON - Drain d'énergie
            // ========================================
            case 'remove_energy_1':
                opponent.energy = Math.max(0, opponent.energy - 1);
                break;

            case 'remove_energy_2':
                opponent.energy = Math.max(0, opponent.energy - 2);
                break;

            // ========================================
            // ARÈS - Dégâts égaux aux PV perdus
            // ========================================
            case 'damage_equal_lost_health':
                if (castingGod && targetGodId) {
                    const lostHealth = castingGod.card.maxHealth - castingGod.currentHealth;
                    const target = opponent.gods.find(g => g.card.id === targetGodId && !g.isDead);
                    if (target && lostHealth > 0) {
                        target.currentHealth -= lostHealth;
                        if (target.currentHealth <= 0) {
                            this.handleGodDeath(opponent, target);
                        }
                    }
                }
                break;

            // ========================================
            // ARTÉMIS - Appliquer faiblesse
            // ========================================
            case 'apply_weakness':
                // Applique une faiblesse temporaire à la cible
                // L'élément est passé via selectedElement dans l'action
                if (selectedElement) {
                    for (const target of targets) {
                        target.temporaryWeakness = selectedElement;
                    }
                } else {
                    // Si aucun élément sélectionné, applique la faiblesse de l'attaquant par défaut
                    for (const target of targets) {
                        target.temporaryWeakness = card.element;
                    }
                }
                break;

            // ========================================
            // APHRODITE - Nettoyage des effets négatifs
            // ========================================
            case 'cleanse':
                // Enlève tous les effets négatifs d'une cible
                for (const target of targets) {
                    target.statusEffects = target.statusEffects.filter(
                        s => s.type === 'shield' // Garde uniquement le bouclier (effet positif)
                    );
                    target.temporaryWeakness = undefined; // Retire aussi la faiblesse temporaire
                }
                break;

            case 'cleanse_all_allies':
                // Enlève tous les effets négatifs de tous les alliés
                for (const god of player.gods) {
                    if (!god.isDead) {
                        god.statusEffects = god.statusEffects.filter(
                            s => s.type === 'shield'
                        );
                        god.temporaryWeakness = undefined;
                    }
                }
                break;

            // ========================================
            // ZEUS - Effets de foudre (toggle)
            // ========================================
            case 'lightning_toggle':
            case 'lightning_toggle_multi':
                // Applique ou enlève ⚡ de cibles selon le choix du joueur. +2 dégâts par ⚡ enlevée
                for (const target of targets) {
                    const lightningStacks = this.getStatusStacks(target, 'lightning');
                    // Respecter le choix de l'utilisateur s'il est défini
                    const action = lightningAction !== undefined
                        ? lightningAction
                        : (lightningStacks > 0 ? 'remove' : 'apply');

                    if (action === 'remove' && lightningStacks > 0) {
                        // Calcul des dégâts bonus avec prise en compte de la faiblesse (élément Lightning)
                        const defenderWeakness = target.temporaryWeakness || target.card.weakness;
                        const { damage: bonusDamage } = calculateDamage(
                            lightningStacks * 2,
                            'lightning',
                            defenderWeakness
                        );

                        // Gestion bouclier et dégâts
                        let damageToInflict = bonusDamage;
                        const shieldIndex = target.statusEffects.findIndex(s => s.type === 'shield');
                        if (shieldIndex !== -1) {
                            const shield = target.statusEffects[shieldIndex];
                            if (shield.stacks >= damageToInflict) {
                                shield.stacks -= damageToInflict;
                                damageToInflict = 0;
                            } else {
                                damageToInflict -= shield.stacks;
                                shield.stacks = 0;
                                target.statusEffects.splice(shieldIndex, 1);
                            }
                        }

                        target.currentHealth -= damageToInflict;
                        this.removeStatus(target, 'lightning');

                        if (target.currentHealth <= 0) {
                            const owner = player.gods.includes(target) ? player : opponent;
                            this.handleGodDeath(owner, target);
                        }
                    } else if (action === 'apply') {
                        this.addStatus(target, 'lightning', 1);
                    }
                    // Si action === 'remove' mais pas de marques, ne rien faire
                }
                break;

            case 'lightning_toggle_all':
                for (const god of opponent.gods) {
                    if (!god.isDead) {
                        const lightningStacks = this.getStatusStacks(god, 'lightning');
                        // Respecter le choix de l'utilisateur s'il est défini
                        // Fallback auto seulement si aucune action choisie
                        const action = lightningAction !== undefined
                            ? lightningAction
                            : (lightningStacks > 0 ? 'remove' : 'apply');

                        if (action === 'remove' && lightningStacks > 0) {
                            const defenderWeakness = god.temporaryWeakness || god.card.weakness;
                            const { damage: bonusDamage } = calculateDamage(
                                lightningStacks * 2,
                                'lightning',
                                defenderWeakness
                            );

                            let damageToInflict = bonusDamage;
                            const shieldIndex = god.statusEffects.findIndex(s => s.type === 'shield');
                            if (shieldIndex !== -1) {
                                const shield = god.statusEffects[shieldIndex];
                                if (shield.stacks >= damageToInflict) {
                                    shield.stacks -= damageToInflict;
                                    damageToInflict = 0;
                                } else {
                                    damageToInflict -= shield.stacks;
                                    shield.stacks = 0;
                                    god.statusEffects.splice(shieldIndex, 1);
                                }
                            }

                            god.currentHealth -= damageToInflict;
                            this.removeStatus(god, 'lightning');

                            if (god.currentHealth <= 0) {
                                this.handleGodDeath(opponent, god);
                            }
                        } else if (action === 'apply') {
                            this.addStatus(god, 'lightning', 1);
                        }
                        // Si action === 'remove' mais pas de marques, ne rien faire
                    }
                }
                break;



            // ========================================
            // POSEIDON - Effets spéciaux
            // ========================================
            case 'conductive_lightning':
                // Inflige 1 dégât et applique 1 marque de foudre à chaque cible
                for (const target of targets) {
                    const defenderWeakness = target.temporaryWeakness || target.card.weakness;
                    const { damage: finalDamage } = calculateDamage(
                        1,
                        card.element,
                        defenderWeakness
                    );

                    let damageToInflict = finalDamage;
                    const shieldIndex = target.statusEffects.findIndex(s => s.type === 'shield');
                    if (shieldIndex !== -1) {
                        const shield = target.statusEffects[shieldIndex];
                        if (shield.stacks >= damageToInflict) {
                            shield.stacks -= damageToInflict;
                            damageToInflict = 0;
                        } else {
                            damageToInflict -= shield.stacks;
                            shield.stacks = 0;
                            target.statusEffects.splice(shieldIndex, 1);
                        }
                    }

                    target.currentHealth -= damageToInflict;
                    this.addStatus(target, 'lightning', 1);

                    if (target.currentHealth <= 0) {
                        const owner = player.gods.includes(target) ? player : opponent;
                        this.handleGodDeath(owner, target);
                    }
                }
                break;

            case 'tsunami_damage':
                // Inflige 3 dégâts par carte du dieu ciblé qui a été meulée
                // Note: L'effet mill a déjà été appliqué, on compte les cartes dans la défausse
                if (targetGodId) {
                    const targetGod = opponent.gods.find(g => g.card.id === targetGodId);
                    if (targetGod) {
                        // Compter les cartes du dieu ciblé dans la défausse (récemment meulées)
                        const cardsInDiscard = opponent.discard.filter(c => c.godId === targetGodId).length;
                        // Limiter à 5 (le nombre de cartes meulées max)
                        const damageCards = Math.min(cardsInDiscard, 5);
                        const totalDamage = damageCards * 3;

                        if (totalDamage > 0) {
                            let damageToInflict = totalDamage;
                            const shieldIndex = targetGod.statusEffects.findIndex(s => s.type === 'shield');
                            if (shieldIndex !== -1) {
                                const shield = targetGod.statusEffects[shieldIndex];
                                if (shield.stacks >= damageToInflict) {
                                    shield.stacks -= damageToInflict;
                                    damageToInflict = 0;
                                } else {
                                    damageToInflict -= shield.stacks;
                                    shield.stacks = 0;
                                    targetGod.statusEffects.splice(shieldIndex, 1);
                                }
                            }

                            targetGod.currentHealth -= damageToInflict;
                            if (targetGod.currentHealth <= 0) {
                                this.handleGodDeath(opponent, targetGod);
                            }
                        }
                    }
                }
                break;

            case 'prison_mill':
                // Meule du nombre d'ennemis touchés (vivants)
                const livingEnemies = opponent.gods.filter(g => !g.isDead).length;
                for (let i = 0; i < livingEnemies; i++) {
                    if (opponent.deck.length > 0) {
                        const card = opponent.deck.shift()!;
                        opponent.discard.push(card);
                    }
                }
                break;

            case 'damage_equal_lost_health':
                if (castingGod) {
                    const lostHealth = castingGod.card.maxHealth - castingGod.currentHealth;
                    if (lostHealth > 0) {
                        for (const target of targets) {
                            const weakness = target.temporaryWeakness || target.card.weakness;
                            const { damage } = calculateDamage(lostHealth, card.element, weakness);

                            let damageToInflict = damage;
                            const shieldIndex = target.statusEffects.findIndex(s => s.type === 'shield');
                            if (shieldIndex !== -1) {
                                const shield = target.statusEffects[shieldIndex];
                                if (shield.stacks >= damageToInflict) {
                                    shield.stacks -= damageToInflict;
                                    damageToInflict = 0;
                                } else {
                                    damageToInflict -= shield.stacks;
                                    shield.stacks = 0;
                                    target.statusEffects.splice(shieldIndex, 1);
                                }
                            }

                            target.currentHealth -= damageToInflict;
                            if (target.currentHealth <= 0) {
                                const owner = player.gods.includes(target) ? player : opponent;
                                this.handleGodDeath(owner, target);
                            }
                        }
                    }
                }
                break;

            // ========================================
            // NYX - Effets de manipulation de main
            // ========================================
            case 'shuffle_hand_draw_blind':
                // Mélange 1 carte adverse aléatoire dans son deck, l'adversaire pioche 1
                if (opponent.hand.length > 0) {
                    const randomIndex = Math.floor(Math.random() * opponent.hand.length);
                    const cardToShuffle = opponent.hand.splice(randomIndex, 1)[0];
                    opponent.deck.push(cardToShuffle);
                    opponent.deck = this.shuffleArray(opponent.deck);
                    // L'adversaire pioche 1 carte
                    if (opponent.deck.length > 0) {
                        const drawnCard = opponent.deck.shift()!;
                        opponent.hand.push(drawnCard);
                    }
                }
                break;

            case 'shuffle_hand_draw_blind_2':
                // Mélange 2 cartes adverses aléatoires dans son deck, l'adversaire pioche 2
                for (let i = 0; i < 2; i++) {
                    if (opponent.hand.length > 0) {
                        const randomIndex = Math.floor(Math.random() * opponent.hand.length);
                        const cardToShuffle = opponent.hand.splice(randomIndex, 1)[0];
                        opponent.deck.push(cardToShuffle);
                    }
                }
                opponent.deck = this.shuffleArray(opponent.deck);
                // L'adversaire pioche 2 cartes
                for (let i = 0; i < 2; i++) {
                    if (opponent.deck.length > 0) {
                        const drawnCard = opponent.deck.shift()!;
                        opponent.hand.push(drawnCard);
                    }
                }
                break;

            // ========================================
            // HESTIA - Effets de recyclage
            // Ces effets sont gérés par le store après sélection des cartes par le joueur
            // ========================================
            case 'recycle_from_discard':
                // Géré par le store via CardSelectionModal
                // Ne rien faire ici - le store appellera confirmCardSelection
                break;

            case 'put_cards_bottom':
                // Géré par le store via CardSelectionModal
                // Ne rien faire ici - le store appellera confirmCardSelection
                break;

            // ========================================
            // ATHÉNA - Effets de protection contre faiblesse
            // ========================================
            case 'remove_weakness_1_turn':
                // Retire la faiblesse d'un allié pendant 1 tour
                for (const target of targets) {
                    if (player.gods.includes(target) && !target.isDead) {
                        // Sauvegarder la faiblesse naturelle et la remplacer temporairement par "none"
                        // On utilise un status effect spécial pour tracker ça
                        this.addStatus(target, 'weakness_immunity', 1, 1);
                    }
                }
                break;

            case 'remove_all_weakness_3_turns':
                // Tous les alliés perdent leur faiblesse pendant 3 tours
                for (const god of player.gods) {
                    if (!god.isDead) {
                        this.addStatus(god, 'weakness_immunity', 1, 3);
                    }
                }
                break;

            // ========================================
            // DEMETER - Soins basés sur l'énergie
            // ========================================
            case 'heal_by_energy':
                // Soigne un allié de la valeur totale de l'énergie
                for (const target of targets) {
                    if (player.gods.includes(target) && !target.isDead) {
                        const healAmount = player.energy;
                        // Retirer le poison d'abord
                        const poisonIndex = target.statusEffects.findIndex(s => s.type === 'poison');
                        if (poisonIndex !== -1) {
                            const poisonToRemove = Math.min(healAmount, target.statusEffects[poisonIndex].stacks);
                            target.statusEffects[poisonIndex].stacks -= poisonToRemove;
                            const remainingHeal = healAmount - poisonToRemove;
                            target.currentHealth = Math.min(target.currentHealth + remainingHeal, target.card.maxHealth);
                            if (target.statusEffects[poisonIndex].stacks <= 0) {
                                target.statusEffects.splice(poisonIndex, 1);
                            }
                        } else {
                            target.currentHealth = Math.min(target.currentHealth + healAmount, target.card.maxHealth);
                        }
                    }
                }
                break;

            // ========================================
            // NYX - Mélange main adverse et pioche à l'envers
            // ========================================
            case 'shuffle_hand_draw_blind':
                // Mélange 1 carte aléatoire de la main adverse dans son deck, pioche 1 à l'envers
                if (opponent.hand.length > 0) {
                    const randomIndex = Math.floor(Math.random() * opponent.hand.length);
                    const cardToShuffle = opponent.hand.splice(randomIndex, 1)[0];
                    // Retirer le flag hidden s'il existait
                    cardToShuffle.isHiddenFromOwner = false;
                    opponent.deck.push(cardToShuffle);
                    this.shuffleArray(opponent.deck);

                    // Piocher 1 carte à l'envers
                    if (opponent.deck.length > 0) {
                        const drawnCard = opponent.deck.shift()!;
                        drawnCard.isHiddenFromOwner = true;
                        drawnCard.revealedToPlayerId = player.id; // Le joueur qui a lancé Nyx peut voir cette carte
                        opponent.hand.push(drawnCard);
                    }
                }
                break;

            case 'shuffle_hand_draw_blind_2':
                // Cet effet est géré par le store via le modal de sélection de cartes adverses
                // Le joueur choisit les cartes, et confirmEnemyCardSelection applique l'effet
                break;

            case 'shuffle_all_hand_draw_blind':
                // Mélange TOUTE la main adverse dans son deck, pioche 5 à l'envers
                const handSize = opponent.hand.length;
                while (opponent.hand.length > 0) {
                    const card = opponent.hand.pop()!;
                    card.isHiddenFromOwner = false;
                    opponent.deck.push(card);
                }
                this.shuffleArray(opponent.deck);

                // Piocher 5 cartes à l'envers (ou moins si deck insuffisant)
                const cardsToDraw = Math.min(5, opponent.deck.length);
                for (let i = 0; i < cardsToDraw; i++) {
                    if (opponent.deck.length > 0) {
                        const drawnCard = opponent.deck.shift()!;
                        drawnCard.isHiddenFromOwner = true;
                        drawnCard.revealedToPlayerId = player.id; // Le joueur qui a lancé Nyx peut voir cette carte
                        opponent.hand.push(drawnCard);
                    }
                }
                break;

            // ========================================
            // POSÉIDON - Tsunami (dégâts par carte meulée du dieu ciblé)
            // ========================================
            case 'tsunami_damage':
                // Le mill a déjà été fait par l'effet précédent
                // Nous devons compter les cartes du dieu ciblé qui ont été meulées
                // et infliger 3 dégâts par carte
                if (targetGodId) {
                    const targetGod = opponent.gods.find(g => g.card.id === targetGodId && !g.isDead);
                    if (targetGod) {
                        // Compter les cartes récemment meulées appartenant à ce dieu
                        const recentDiscard = opponent.discard.slice(-5);
                        const cardsFromTargetGod = recentDiscard.filter(c => c.godId === targetGodId);
                        const baseDamage = cardsFromTargetGod.length * 3;

                        if (baseDamage > 0) {
                            // Appliquer les dégâts avec le système d'éléments
                            // La faiblesse est soit temporaire (appliquée par un autre sort) soit naturelle
                            const defenderWeakness = targetGod.temporaryWeakness ||
                                getWeakness(targetGod.card.element);

                            const damageResult = calculateDamage(baseDamage, card.element, defenderWeakness);

                            targetGod.currentHealth -= damageResult.damage;
                            if (targetGod.currentHealth <= 0) {
                                this.handleGodDeath(opponent, targetGod);
                            }
                        }
                    }
                }
                break;

            // ========================================
            // POSÉIDON - Prison Aquatique (meule du nombre d'ennemis touchés)
            // ========================================
            case 'prison_mill':
                // Compte les ennemis vivants (qui ont été touchés par les dégâts all_enemies)
                const enemyCount = opponent.gods.filter(g => !g.isDead).length;
                // Meule ce nombre de cartes
                for (let i = 0; i < enemyCount; i++) {
                    if (opponent.deck.length > 0) {
                        const milledCard = opponent.deck.shift()!;
                        opponent.discard.push(milledCard);
                    }
                }
                break;

            // ========================================
            // DEMETER - Distribution de soins
            // ========================================
            case 'distribute_heal_5':
                // Distribue 5 soins également entre tous les alliés vivants
                const aliveAllies = player.gods.filter(g => !g.isDead);
                if (aliveAllies.length > 0) {
                    const healPerAlly = Math.floor(5 / aliveAllies.length);
                    const remainder = 5 % aliveAllies.length;

                    aliveAllies.forEach((ally, index) => {
                        // Les premiers alliés reçoivent 1 soin de plus pour distribuer le reste
                        const healAmount = healPerAlly + (index < remainder ? 1 : 0);
                        ally.currentHealth = Math.min(
                            ally.currentHealth + healAmount,
                            ally.card.maxHealth
                        );
                    });
                }
                break;

            // ========================================
            // ARTÉMIS - Appliquer une faiblesse
            // ========================================
            case 'apply_weakness':
                // Applique une faiblesse temporaire de l'élément choisi à la cible
                if (targetGodId && selectedElement) {
                    const target = opponent.gods.find(g => g.card.id === targetGodId);
                    if (target && !target.isDead) {
                        // Ajouter la faiblesse temporaire
                        target.temporaryWeakness = selectedElement;
                    }
                }
                break;

            default:
                console.warn(`Effet custom non implémenté: ${effectId}`);
                break;
        }
    }

    /**
     * Ajoute un effet de statut à un dieu
     */
    private addStatus(god: GodState, status: StatusEffect, stacks: number, duration?: number): void {
        const existing = god.statusEffects.find(s => s.type === status);
        if (existing) {
            existing.stacks += stacks;
            if (duration) existing.duration = duration;
        } else {
            god.statusEffects.push({ type: status, stacks, duration });
        }
    }

    /**
     * Retire un effet de statut
     */
    private removeStatus(god: GodState, status: StatusEffect): void {
        god.statusEffects = god.statusEffects.filter(s => s.type !== status);
    }

    /**
     * Obtient le nombre de stacks d'un statut
     */
    private getStatusStacks(god: GodState, status: StatusEffect): number {
        return god.statusEffects
            .filter(s => s.type === status)
            .reduce((sum, effect) => sum + effect.stacks, 0);
    }

    /**
     * Réduit la durée des effets temporaires pour un joueur donné
     * Les effets temporaires ne sont réduits que quand le joueur qui les a lancés finit son tour
     */
    private tickStatusEffects(casterPlayer: PlayerState): void {
        // Réduire les effets sur les dieux de l'adversaire (effets lancés par casterPlayer sur lui)
        // et sur les dieux du casterPlayer (auto-buffs)
        for (const player of this.state.players) {
            for (const god of player.gods) {
                god.statusEffects = god.statusEffects.filter(effect => {
                    if (effect.duration !== undefined) {
                        effect.duration--;
                        return effect.duration > 0;
                    }
                    return true;
                });
            }
        }
    }

    /**
     * Vérifie si un dieu peut attaquer (pas gelé/étourdi)
     */
    canGodAct(god: GodState): boolean {
        const isStunned = god.statusEffects.some(
            s => s.type === 'stun'
        );
        return !god.isDead && !isStunned;
    }

    /**
     * Obtient les cibles valides pour une attaque
     * Pour les sorts mono-cible avec provocation : seul le provocateur est ciblable
     * Pour les sorts multi-cibles avec provocation : tous les dieux sont ciblables
     * (mais getRequiredTargets() retournera le provocateur qui doit être inclus)
     */
    getValidTargets(targetType: SpellCard['effects'][0]['target'], isMultiTarget: boolean = false): GodState[] {
        const player = this.getCurrentPlayer();
        const opponent = this.getOpponent();

        // Vérifier la provocation
        const provokers = opponent.gods.filter(
            g => !g.isDead && g.statusEffects.some(s => s.type === 'provocation')
        );

        // Pour les sorts mono-cible avec provocation : seul le provocateur
        // Pour les sorts multi-cibles avec provocation : tous les dieux (le provocateur sera forcé)
        if (provokers.length > 0 && targetType === 'enemy_god' && !isMultiTarget) {
            return provokers; // Doit cibler un provocateur
        }

        switch (targetType) {
            case 'enemy_god':
                return opponent.gods.filter(g => !g.isDead);
            case 'ally_god':
                return player.gods.filter(g => !g.isDead);
            case 'dead_ally_god':
                return player.gods.filter(g => g.isDead);
            case 'any_god':
                return [...player.gods, ...opponent.gods].filter(g => !g.isDead);
            default:
                return [];
        }
    }

    /**
     * Obtient les cibles qui DOIVENT être incluses (provocateurs pour enemy_god)
     */
    getRequiredTargets(targetType: SpellCard['effects'][0]['target']): GodState[] {
        const opponent = this.getOpponent();

        if (targetType === 'enemy_god') {
            // Les provocateurs doivent être inclus dans les cibles
            return opponent.gods.filter(
                g => !g.isDead && g.statusEffects.some(s => s.type === 'provocation')
            );
        }

        return [];
    }

    /**
     * Mélange un tableau (Fisher-Yates)
     */
    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Crée un état de jeu initial
     */
    static createInitialState(
        player1Id: string,
        player1Name: string,
        player1Gods: GodCard[],
        player1Deck: SpellCard[],
        player2Id: string,
        player2Name: string,
        player2Gods: GodCard[],
        player2Deck: SpellCard[],
        firstPlayerId: string
    ): GameState {
        const createPlayerState = (
            id: string,
            name: string,
            gods: GodCard[],
            deck: SpellCard[],
            isFirst: boolean
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
            deck: GameEngine.prototype.shuffleArray(deck),
            discard: [],
            energy: isFirst ? 0 : 1, // Premier joueur: 0, Second: 1
            fatigueCounter: 0,
            hasPlayedCard: false,
            hasDiscardedForEnergy: false,
        });

        const isPlayer1First = firstPlayerId === player1Id;



        const state: GameState = {
            id: generateUUID(),
            status: 'playing',
            currentPlayerId: firstPlayerId,
            turnNumber: 1,
            players: [
                createPlayerState(player1Id, player1Name, player1Gods, player1Deck, isPlayer1First),
                createPlayerState(player2Id, player2Name, player2Gods, player2Deck, !isPlayer1First),
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Piocher 5 cartes pour chaque joueur
        const engine = new GameEngine(state);
        engine.drawToHandLimit(engine.state.players[0]);
        engine.drawToHandLimit(engine.state.players[1]);

        return engine.getState();
    }
}
