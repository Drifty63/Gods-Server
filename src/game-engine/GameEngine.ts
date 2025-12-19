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
import { calculateDamage, calculateDamageWithDualWeakness, getWeakness } from './ElementSystem';

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

        // Vérifier si le joueur a déjà joué une carte ce tour
        if (player.hasPlayedCard) {
            return { success: false, message: 'Vous avez déjà joué une carte ce tour' };
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
            // Pour target 'same', utiliser la dernière cible
            if (effect.target === 'same' && lastUsedTargetId) {
                this.applyEffect(effect, card, lastUsedTargetId, action.selectedElement, action.lightningAction, [lastUsedTargetId]);
                continue;
            }

            // Pour les effets qui ciblent enemy_god ou ally_god, utiliser une cible de la liste
            const needsSingleTarget = effect.target === 'enemy_god' || effect.target === 'ally_god' || effect.target === 'any_god' || effect.target === 'dead_ally_god';

            if (needsSingleTarget && targetIds.length > 0) {
                // Utiliser la prochaine cible disponible dans la liste
                const currentTarget = targetIds[Math.min(targetIndex, targetIds.length - 1)];
                this.applyEffect(effect, card, currentTarget, action.selectedElement, action.lightningAction, [currentTarget]);
                lastUsedTargetId = currentTarget;
                targetIndex++;
            } else if (!effect.target && effect.type === 'custom') {
                // Effet custom sans target explicite : passer TOUTES les cibles
                // Cela permet à lightning_toggle_multi de toucher toutes les cibles sélectionnées
                this.applyEffect(effect, card, action.targetGodId, action.selectedElement, action.lightningAction, targetIds.length > 0 ? targetIds : undefined);
            } else if (!effect.target && lastUsedTargetId) {
                // Autre effet sans target explicite : appliquer à la dernière cible utilisée
                this.applyEffect(effect, card, lastUsedTargetId, action.selectedElement, action.lightningAction, [lastUsedTargetId]);
            } else {
                // Effet sans ciblage spécifique ou ciblage de groupe (all_enemies, all_allies, self)
                this.applyEffect(effect, card, action.targetGodId, action.selectedElement, action.lightningAction, action.targetGodIds);
            }
        }

        // Déplacer la carte vers la défausse (nettoyer les propriétés "blind" d'abord)
        player.hand.splice(cardIndex, 1);
        this.cleanBlindCard(card);
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

        // Retirer de la main et ajouter à la défausse (nettoyer les propriétés "blind")
        player.hand.splice(cardIndex, 1);
        this.cleanBlindCard(card);
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

        // Réduire la durée des effets temporaires de l'ADVERSAIRE du joueur qui vient de jouer
        // Logique : "3 tours" = 3 tours où l'adversaire joue = tick après chaque tour adverse
        this.tickStatusEffects(nextPlayer);

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
                let damageToInflict = player.fatigueCounter;

                // Vérifier s'il y a un bouclier actif
                const shieldIndex = god.statusEffects.findIndex(s => s.type === 'shield');
                if (shieldIndex !== -1) {
                    const shield = god.statusEffects[shieldIndex];
                    if (shield.stacks >= damageToInflict) {
                        shield.stacks -= damageToInflict;
                        damageToInflict = 0;
                    } else {
                        damageToInflict -= shield.stacks;
                        shield.stacks = 0;
                        // Retirer le statut si bouclier épuisé
                        god.statusEffects.splice(shieldIndex, 1);
                    }
                }

                // Appliquer les dégâts restants à la santé
                if (damageToInflict > 0) {
                    god.currentHealth -= damageToInflict;
                    if (god.currentHealth <= 0) {
                        this.handleGodDeath(player, god);
                    }
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

        // Retirer toutes les cartes de ce dieu et les stocker dans removedCards
        const godId = god.card.id;

        // Depuis la main
        const handCards = player.hand.filter(c => c.godId === godId);
        player.hand = player.hand.filter(c => c.godId !== godId);

        // Depuis le deck
        const deckCards = player.deck.filter(c => c.godId === godId);
        player.deck = player.deck.filter(c => c.godId !== godId);

        // Depuis la défausse
        const discardCards = player.discard.filter(c => c.godId === godId);
        player.discard = player.discard.filter(c => c.godId !== godId);

        // Stocker toutes les cartes retirées
        player.removedCards.push(...handCards, ...deckCards, ...discardCards);

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
                    case 'any_god':
                        // Pour any_god, chercher d'abord chez le JOUEUR (alliés) pour les heals
                        // puis chez l'adversaire si pas trouvé
                        // Cela évite le bug en match miroir où on soignerait l'ennemi
                        if (targetGodId) {
                            const allyTarget = player.gods.find(g => g.card.id === targetGodId && !g.isDead);
                            if (allyTarget) return [allyTarget];
                            const enemyTarget = opponent.gods.find(g => g.card.id === targetGodId && !g.isDead);
                            if (enemyTarget) return [enemyTarget];
                        }
                        return [];
                    case 'same':
                        // Le cas 'same' est géré en amont dans executeAction
                        // Si on arrive ici, utiliser la cible fournie
                        if (targetGodId) {
                            const sameTarget = [...opponent.gods, ...player.gods].find(g => g.card.id === targetGodId && !g.isDead);
                            return sameTarget ? [sameTarget] : [];
                        }
                        return [];
                }
            }

            // Si pas de cible définie dans l'effet (ex: custom effect toggle), utiliser les cibles fournies
            // IMPORTANT: Pour éviter les bugs quand les deux joueurs ont le même dieu,
            // on cherche d'abord chez l'adversaire (cas le plus courant pour les sorts offensifs)
            if (targetGodIds && targetGodIds.length > 0) {
                // Priorité: chercher d'abord chez l'adversaire
                const opponentTargets = opponent.gods.filter(g => targetGodIds.includes(g.card.id) && !g.isDead);
                const playerTargets = player.gods.filter(g => targetGodIds.includes(g.card.id) && !g.isDead);

                // Retourner les cibles ennemies correspondantes en priorité
                // Si on en trouve le bon nombre, on les retourne
                // Sinon on retourne tout ce qu'on a trouvé
                if (opponentTargets.length >= targetGodIds.length) {
                    return opponentTargets.slice(0, targetGodIds.length);
                }
                if (opponentTargets.length > 0 && playerTargets.length === 0) {
                    return opponentTargets;
                }
                if (playerTargets.length > 0 && opponentTargets.length === 0) {
                    return playerTargets;
                }
                // Cas mixte: prendre d'abord les ennemis puis compléter avec les alliés si nécessaire
                return [...opponentTargets, ...playerTargets].slice(0, targetGodIds.length);
            }

            if (targetGodId) {
                // Priorité: chercher d'abord chez l'adversaire
                const opponentTarget = opponent.gods.find(g => g.card.id === targetGodId && !g.isDead);
                if (opponentTarget) return [opponentTarget];

                const playerTarget = player.gods.find(g => g.card.id === targetGodId && !g.isDead);
                if (playerTarget) return [playerTarget];

                return [];
            }

            return [];
        };

        const targets = getTargetGods();

        switch (effect.type) {
            case 'damage':
                for (const target of targets) {
                    // Vérifier si la cible a l'immunité aux faiblesses
                    const hasWeaknessImmunity = target.statusEffects.some(s => s.type === 'weakness_immunity');
                    // Calculer les dégâts en prenant en compte les DEUX faiblesses (innée ET temporaire)
                    // Si immunité, passer undefined pour les deux
                    const { damage, isWeakness } = hasWeaknessImmunity
                        ? { damage: effect.value || 0, isWeakness: false }
                        : calculateDamageWithDualWeakness(
                            effect.value || 0,
                            card.element,
                            target.card.weakness,
                            target.temporaryWeakness
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
                // Utiliser le target de l'effet pour déterminer qui défausse
                let discardPlayer: typeof player;
                if (effect.target === 'enemy_god' || effect.target === 'all_enemies') {
                    discardPlayer = opponent;
                } else if (effect.target === 'ally_god' || effect.target === 'all_allies' || effect.target === 'self') {
                    discardPlayer = player;
                } else {
                    // Fallback à l'ancienne logique si pas de target défini
                    discardPlayer = targets.some(t => player.gods.includes(t)) ? player : opponent;
                }
                const discardCount = effect.value || 1;

                for (let i = 0; i < discardCount; i++) {
                    if (discardPlayer.hand.length > 0) {
                        // Choisir une carte aléatoire à défausser
                        const randomIndex = Math.floor(Math.random() * discardPlayer.hand.length);
                        const cardToDiscard = discardPlayer.hand[randomIndex];
                        discardPlayer.hand.splice(randomIndex, 1);
                        this.cleanBlindCard(cardToDiscard);
                        discardPlayer.discard.push(cardToDiscard);
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
                // Fait défausser des cartes du deck
                // Si target === 'self', cible son propre deck, sinon l'adversaire
                const millTarget = effect.target === 'self' ? player : opponent;
                for (let i = 0; i < (effect.value || 1); i++) {
                    if (millTarget.deck.length > 0) {
                        const cardToMill = millTarget.deck.shift()!;
                        this.cleanBlindCard(cardToMill);
                        millTarget.discard.push(cardToMill);
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

                        // Récupérer les sorts du dieu depuis removedCards et les remettre dans le deck
                        const godId = godToRevive.card.id;
                        const cardsToReturn: SpellCard[] = [];

                        // Trouver les cartes du dieu dans removedCards
                        player.removedCards = player.removedCards.filter(card => {
                            if (card.godId === godId) {
                                cardsToReturn.push(card);
                                return false; // Retirer de removedCards
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

                    // 1. Retirer le poison du dieu soigné (min entre heal et stacks de poison)
                    const poisonIndex = healTarget.statusEffects.findIndex(s => s.type === 'poison');
                    if (poisonIndex !== -1) {
                        const poisonToRemove = Math.min(totalPoisonStacks, healTarget.statusEffects[poisonIndex].stacks);
                        healTarget.statusEffects[poisonIndex].stacks -= poisonToRemove;
                        if (healTarget.statusEffects[poisonIndex].stacks <= 0) {
                            healTarget.statusEffects.splice(poisonIndex, 1);
                        }
                    }

                    // 2. Soigner
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
                // Soigne du nombre de dégâts réellement infligés (avec bonus faiblesse)
                // Utilise la dernière cible utilisée (targetGodId) et recalcule les dégâts
                if (castingGod && targetGodId) {
                    const target = opponent.gods.find(g => g.card.id === targetGodId);
                    if (target) {
                        // Vérifier si le dieu a l'immunité aux faiblesses
                        const hasWeaknessImmunity = target.statusEffects.some(s => s.type === 'weakness_immunity');
                        // Calculer les dégâts réels avec les deux faiblesses
                        const { damage } = hasWeaknessImmunity
                            ? { damage: 3 }
                            : calculateDamageWithDualWeakness(3, card.element, target.card.weakness, target.temporaryWeakness);

                        // 1. Retirer le poison (min entre heal et stacks de poison)
                        const poisonIndex = castingGod.statusEffects.findIndex(s => s.type === 'poison');
                        if (poisonIndex !== -1) {
                            const poisonToRemove = Math.min(damage, castingGod.statusEffects[poisonIndex].stacks);
                            castingGod.statusEffects[poisonIndex].stacks -= poisonToRemove;
                            if (castingGod.statusEffects[poisonIndex].stacks <= 0) {
                                castingGod.statusEffects.splice(poisonIndex, 1);
                            }
                        }

                        // 2. Soigner (limité au max HP)
                        castingGod.currentHealth = Math.min(
                            castingGod.currentHealth + damage,
                            castingGod.card.maxHealth
                        );
                    }
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
                        // Appliquer le bonus de faiblesse avec les deux faiblesses
                        const { damage: finalDamage } = calculateDamageWithDualWeakness(
                            lostHealth, card.element, target.card.weakness, target.temporaryWeakness
                        );

                        // Gestion du bouclier
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
                        // Calcul des dégâts bonus avec prise en compte des deux faiblesses
                        const { damage: bonusDamage } = calculateDamageWithDualWeakness(
                            lightningStacks * 2,
                            'lightning',
                            target.card.weakness,
                            target.temporaryWeakness
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
                            const { damage: bonusDamage } = calculateDamageWithDualWeakness(
                                lightningStacks * 2,
                                'lightning',
                                god.card.weakness,
                                god.temporaryWeakness
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
                    const { damage: finalDamage } = calculateDamageWithDualWeakness(
                        1,
                        card.element,
                        target.card.weakness,
                        target.temporaryWeakness
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
                // Inflige 3 dégâts par carte du dieu ciblé qui a été meulée récemment
                // Le mill a déjà été appliqué, on compte les 5 dernières cartes meulées
                if (targetGodId) {
                    const targetGod = opponent.gods.find(g => g.card.id === targetGodId);
                    if (targetGod && !targetGod.isDead) {
                        // Compter les cartes récemment meulées (5 dernières) appartenant à ce dieu
                        const recentDiscard = opponent.discard.slice(-5);
                        const cardsFromTargetGod = recentDiscard.filter(c => c.godId === targetGodId);
                        const baseDamage = cardsFromTargetGod.length * 3;

                        if (baseDamage > 0) {
                            // Appliquer le bonus de faiblesse
                            const { damage: finalDamage } = calculateDamageWithDualWeakness(
                                baseDamage, card.element, targetGod.card.weakness, targetGod.temporaryWeakness
                            );

                            // Gestion du bouclier
                            let damageToInflict = finalDamage;
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
                        this.cleanBlindCard(card);
                        opponent.discard.push(card);
                    }
                }
                break;

            case 'damage_equal_lost_health':
                if (castingGod) {
                    const lostHealth = castingGod.card.maxHealth - castingGod.currentHealth;
                    if (lostHealth > 0) {
                        for (const target of targets) {
                            const { damage } = calculateDamageWithDualWeakness(
                                lostHealth, card.element, target.card.weakness, target.temporaryWeakness
                            );

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
            case 'shuffle_hand_draw_blind_2':
                // Effet entièrement géré par le store via CardSelectionModal
                // Le joueur (Nyx) choisit les cartes adverses à mélanger
                // puis confirmEnemyCardSelection applique l'effet complet
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
                // Retire la faiblesse d'un allié pendant 1 tour adverse
                for (const target of targets) {
                    if (player.gods.includes(target) && !target.isDead) {
                        this.addStatus(target, 'weakness_immunity', 1, 1);
                    }
                }
                break;

            case 'remove_all_weakness_3_turns':
                // Tous les alliés perdent leur faiblesse pendant 3 tours adverses
                for (const god of player.gods) {
                    if (!god.isDead) {
                        this.addStatus(god, 'weakness_immunity', 1, 3);
                    }
                }
                break;

            // ========================================
            // HESTIA - Soins basés sur l'énergie
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

                            if (target.statusEffects[poisonIndex].stacks <= 0) {
                                target.statusEffects.splice(poisonIndex, 1);
                            }
                        }

                        // Soigner de la valeur totale (indépendamment du poison retiré)
                        target.currentHealth = Math.min(target.currentHealth + healAmount, target.card.maxHealth);
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
            // POSÉIDON - Prison Aquatique (meule du nombre d'ennemis touchés)
            // ========================================
            case 'prison_mill':
                // Compte les ennemis vivants (qui ont été touchés par les dégâts all_enemies)
                const enemyCount = opponent.gods.filter(g => !g.isDead).length;
                // Meule ce nombre de cartes
                for (let i = 0; i < enemyCount; i++) {
                    if (opponent.deck.length > 0) {
                        const milledCard = opponent.deck.shift()!;
                        this.cleanBlindCard(milledCard);
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
                // Duration 2 : survit à la fin du tour actuel de P2 (si appliqué sur P2) et au tour de P1
                if (targetGodId && selectedElement) {
                    const target = opponent.gods.find(g => g.card.id === targetGodId);
                    if (target && !target.isDead) {
                        this.addStatus(target, 'weakness', 1, 2);
                        // Hack : utiliser temporaryWeakness pour stocker l'élément de la faiblesse
                        // Idéalement on devrait pouvoir stocker des métadonnées sur le statut
                        target.temporaryWeakness = selectedElement;
                    }
                }
                break;

            // ========================================
            // HERMÈS - Rejouer une action
            // ========================================
            case 'replay_action':
                // Permet de jouer une autre carte ce tour
                // On remet hasPlayedCard à false pour permettre de rejouer
                player.hasPlayedCard = false;
                break;

            // ========================================
            // THANATOS - Dégâts 5× alliés morts
            // ========================================
            case 'damage_5x_dead_allies':
                // Inflige 5 × nombre d'alliés morts à une cible
                const deadAlliesCount = player.gods.filter(g => g.isDead).length;
                const totalDamage5x = 5 * deadAlliesCount;

                if (totalDamage5x > 0 && targetGodId) {
                    const target5x = opponent.gods.find(g => g.card.id === targetGodId && !g.isDead);
                    if (target5x) {
                        // Calculer avec faiblesse
                        const { damage: finalDamage5x } = calculateDamageWithDualWeakness(
                            totalDamage5x, card.element, target5x.card.weakness, target5x.temporaryWeakness
                        );

                        // Gestion du bouclier
                        let damageToInflict5x = finalDamage5x;
                        const shieldIndex5x = target5x.statusEffects.findIndex(s => s.type === 'shield');
                        if (shieldIndex5x !== -1) {
                            const shield = target5x.statusEffects[shieldIndex5x];
                            if (shield.stacks >= damageToInflict5x) {
                                shield.stacks -= damageToInflict5x;
                                damageToInflict5x = 0;
                            } else {
                                damageToInflict5x -= shield.stacks;
                                shield.stacks = 0;
                                target5x.statusEffects.splice(shieldIndex5x, 1);
                            }
                        }

                        target5x.currentHealth -= damageToInflict5x;
                        if (target5x.currentHealth <= 0) {
                            this.handleGodDeath(opponent, target5x);
                        }
                    }
                }
                break;

            // ========================================
            // HÉPHAÏSTOS - Bouclier = dégâts infligés
            // ========================================
            case 'gain_current_shield':
                // Gagne en bouclier le nombre de dégâts infligés (avec bonus faiblesse)
                if (castingGod && targetGodId) {
                    const targetForShield = opponent.gods.find(g => g.card.id === targetGodId);
                    if (targetForShield) {
                        // Calculer les dégâts réels (2 de base pour Absorption d'Armure)
                        const baseDamage = 2;
                        const { damage: realDamage } = calculateDamageWithDualWeakness(
                            baseDamage, card.element, targetForShield.card.weakness, targetForShield.temporaryWeakness
                        );
                        // Ajouter le bouclier au lanceur
                        this.addStatus(castingGod, 'shield', realDamage);
                    }
                }
                break;

            // ========================================
            // PERSÉPHONE - Récupérer une carte de la défausse
            // ========================================
            case 'retrieve_discard':
                // Cet effet est géré par le modal de sélection dans le GameStore
                // Le GameBoard détecte cet effet et ouvre le modal
                // Rien à faire ici, le store s'en occupe
                break;

            // ========================================
            // PERSÉPHONE - Copier un sort de la défausse
            // ========================================
            case 'copy_discard_spell':
                // Cet effet est géré par le modal de sélection dans le GameStore
                // Le GameBoard détecte cet effet et ouvre le modal
                // Rien à faire ici, le store s'en occupe
                break;

            // ========================================
            // ZÉPHYR - Recyclage sans fatigue
            // ========================================
            case 'free_recycle':
                // Cet effet est géré par le modal de sélection de joueur dans le GameStore
                // Le GameBoard détecte cet effet et ouvre le modal de choix
                // Rien à faire ici, le store s'en occupe
                break;

            // ========================================
            // PERSÉPHONE - Défausse optionnelle pour bonus
            // ========================================
            case 'optional_mill_boost':
                // Cet effet est géré par le modal de confirmation dans le GameStore
                // Le GameBoard détecte cet effet et ouvre le modal Oui/Non
                // Rien à faire ici, le store s'en occupe
                break;

            // ========================================
            // ZÉPHYR - Choisir une carte adverse à défausser
            // ========================================
            case 'choose_discard_enemy':
                // Cet effet est géré par le modal de sélection de cartes adverses dans le GameStore
                // Le GameBoard détecte cet effet et ouvre le modal
                // Rien à faire ici, le store s'en occupe
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
     * Nettoie les propriétés "blind" d'une carte (utilisé quand elle va à la défausse)
     * Cela garantit que les cartes repioché après mélange de la défausse ne sont pas cachées
     */
    private cleanBlindCard(card: SpellCard): void {
        delete card.isHiddenFromOwner;
        delete card.revealedToPlayerId;
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
     * Réduit la durée des effets temporaires pour le joueur qui vient de finir son tour
     * On ne tick que les effets affectant les dieux de ce joueur.
     * Cela assure une symétrie : un effet dure X "fins de tours" du joueur affecté.
     */
    private tickStatusEffects(playerWhoJustFinished: PlayerState): void {
        for (const god of playerWhoJustFinished.gods) {
            god.statusEffects = god.statusEffects.filter(effect => {
                if (effect.duration !== undefined) {
                    effect.duration--;
                    return effect.duration > 0;
                }
                return true;
            });
            // NOTE: temporaryWeakness est permanente jusqu'à un cleanse
            // Elle n'est plus liée au statut 'weakness' dans statusEffects
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
            removedCards: [],
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
