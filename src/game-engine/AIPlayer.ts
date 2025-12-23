// IA simple pour le jeu GODS
// Joue automatiquement pour l'adversaire

import { GameEngine } from './GameEngine';
import { GameState, PlayerState, SpellCard, GodState, GameAction } from '@/types/cards';

export class AIPlayer {
    private difficulty: 'easy' | 'medium' | 'hard';

    constructor(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
        this.difficulty = difficulty;
    }

    /**
     * Décide et exécute les actions de l'IA pour un tour
     * Retourne les actions effectuées
     */
    playTurn(engine: GameEngine): GameAction[] {
        const actions: GameAction[] = [];
        const state = engine.getState();
        const player = engine.getCurrentPlayer();
        const aiPlayerId = player.id;

        // 1. Essayer de jouer une carte
        const playAction = this.decideAction(engine);

        let hasPlayed = false;

        if (playAction) {
            const result = engine.executeAction(playAction);
            if (result.success) {
                actions.push(playAction);
                hasPlayed = true;
            }
        }

        // 2. Si on ne peut pas jouer (pas de carte ou exécution échouée), défausser une carte pour l'énergie
        // Choisir la carte la plus chère/inutile à défausser
        if (!hasPlayed && player.hand.length > 0 && !player.hasDiscardedForEnergy) {
            // Stratégie simple : défausser la carte la plus chère qu'on ne peut pas jouer
            const cardsToDiscard = [...player.hand].sort((a, b) => b.energyCost - a.energyCost);
            const cardToDiscard = cardsToDiscard[0];

            const discardAction: GameAction = {
                type: 'discard_for_energy',
                playerId: player.id,
                cardId: cardToDiscard.id
            };

            const result = engine.executeAction(discardAction);
            if (result.success) {
                actions.push(discardAction);
            }
        }

        // Vérifier si c'est toujours le tour de l'IA avant de finir
        // (le tour peut avoir changé si un dieu est mort du poison)
        const currentState = engine.getState();
        if (currentState.currentPlayerId !== aiPlayerId || currentState.status !== 'playing') {
            // Le tour a déjà changé (mort du poison, fin de partie, etc.)
            return actions;
        }

        // Ne pas finir le tour ici, le GameStore s'en occupe avec un délai si besoin
        return actions;
    }

    /**
     * Décide quelle action effectuer
     */
    private decideAction(engine: GameEngine): GameAction | null {
        const state = engine.getState();
        const player = engine.getCurrentPlayer();
        const opponent = engine.getOpponent();

        // Trouver les cartes jouables
        const playableCards = this.getPlayableCards(player, engine);

        if (playableCards.length === 0) {
            return null;
        }

        // Stratégie basée sur la difficulté
        let selectedCard: SpellCard;

        switch (this.difficulty) {
            case 'easy':
                // Choisit une carte au hasard
                selectedCard = playableCards[Math.floor(Math.random() * playableCards.length)];
                break;

            case 'medium':
                // Priorise les générateurs, puis les compétences
                selectedCard = this.selectCardMedium(playableCards, player);
                break;

            case 'hard':
                // Stratégie avancée
                selectedCard = this.selectCardHard(playableCards, player, opponent);
                break;

            default:
                selectedCard = playableCards[0];
        }

        // Trouver une cible valide
        // Trouver une cible valide
        const targetGodId = this.selectTarget(selectedCard, engine);

        // Déterminer lightningAction si nécessaire
        let lightningAction: 'apply' | 'remove' | undefined;

        const hasLightningToggle = selectedCard.effects.some(e =>
            e.type === 'custom' &&
            (e.customEffectId === 'lightning_toggle' ||
                e.customEffectId === 'lightning_toggle_multi' ||
                e.customEffectId === 'lightning_toggle_all')
        );

        if (hasLightningToggle) {
            let shouldRemove = false;

            if (targetGodId) {
                const target = [...opponent.gods, ...player.gods].find(g => g.card.id === targetGodId);
                // Utiliser la méthode publique ou accéder aux statusEffects (l'IA a accès à l'état complet via engine.getState())
                if (target) {
                    const lightning = target.statusEffects.find(s => s.type === 'lightning');
                    if (lightning && lightning.stacks > 0) shouldRemove = true;
                }
            } else {
                // Vérifier si un ennemi a des marques
                const enemiesWithLightning = opponent.gods.some(g =>
                    g.statusEffects.some(s => s.type === 'lightning' && s.stacks > 0)
                );
                if (enemiesWithLightning) shouldRemove = true;
            }

            lightningAction = shouldRemove ? 'remove' : 'apply';
        }

        const action: GameAction = {
            type: 'play_card',
            playerId: player.id,
            cardId: selectedCard.id,
            targetGodId,
            lightningAction,
        };

        return action;
    }

    /**
     * Obtient les cartes jouables (assez d'énergie et dieu vivant)
     */
    private getPlayableCards(player: PlayerState, engine: GameEngine): SpellCard[] {
        return player.hand.filter(card => {
            // Vérifier l'énergie
            if (player.energy < card.energyCost) {
                return false;
            }

            // Vérifier que le dieu est vivant
            const god = player.gods.find(g => g.card.id === card.godId);
            if (!god || god.isDead) {
                return false;
            }

            // Vérifier que le dieu peut agir (pas gelé/étourdi)
            if (!engine.canGodAct(god)) {
                return false;
            }

            // Vérifier si le joueur a déjà joué une carte ce tour
            if (player.hasPlayedCard) {
                return false;
            }

            // Vérifier si le joueur a déjà défaussé ce tour (exclusif)
            if (player.hasDiscardedForEnergy) {
                return false;
            }

            // NOUVEAU: Empêcher l'IA de se suicider avec des cartes infligeant des dégâts à soi-même
            const selfDamage = card.effects
                .filter(e => e.type === 'damage' && e.target === 'self')
                .reduce((total, e) => total + (e.value || 0), 0);

            if (selfDamage > 0 && god.currentHealth <= selfDamage) {
                // Cette carte tuerait le dieu, ne pas la jouer
                return false;
            }

            return true;
        });
    }

    /**
     * Sélection de carte - Difficulté moyenne
     */
    private selectCardMedium(cards: SpellCard[], player: PlayerState): SpellCard {
        // Si peu d'énergie, prioriser les générateurs
        if (player.energy <= 1) {
            const generators = cards.filter(c => c.type === 'generator');
            if (generators.length > 0) {
                return generators[Math.floor(Math.random() * generators.length)];
            }
        }

        // Sinon, prioriser les compétences
        const skills = cards.filter(c => c.type === 'competence');
        if (skills.length > 0) {
            return skills[Math.floor(Math.random() * skills.length)];
        }

        // Sinon utilitaires
        const utilities = cards.filter(c => c.type === 'utility');
        if (utilities.length > 0) {
            return utilities[Math.floor(Math.random() * utilities.length)];
        }

        return cards[0];
    }

    /**
     * Sélection de carte - Difficulté difficile
     */
    private selectCardHard(cards: SpellCard[], player: PlayerState, opponent: PlayerState): SpellCard {
        // Calculer les dégâts potentiels par carte
        const cardValues = cards.map(card => {
            let value = 0;

            for (const effect of card.effects) {
                if (effect.type === 'damage') {
                    value += effect.value || 0;
                }
                if (effect.type === 'heal') {
                    value += (effect.value || 0) * 0.5; // Soin vaut moins que dégâts
                }
            }

            // Bonus pour le gain d'énergie
            value += card.energyGain * 2;

            // Malus pour le coût
            value -= card.energyCost;

            return { card, value };
        });

        // Trier par valeur décroissante
        cardValues.sort((a, b) => b.value - a.value);

        // Choisir la meilleure carte si on a assez d'énergie pour la suite
        for (const { card } of cardValues) {
            // Si c'est un générateur ou qu'on a assez d'énergie restante
            if (card.type === 'generator' || player.energy >= card.energyCost + 1) {
                return card;
            }
        }

        return cardValues[0].card;
    }

    /**
     * Sélectionne une cible pour la carte
     */
    private selectTarget(card: SpellCard, engine: GameEngine): string | undefined {
        const opponent = engine.getOpponent();
        const player = engine.getCurrentPlayer();

        // Vérifier si la carte a besoin d'une cible
        const needsEnemyTarget = card.effects.some(e => e.target === 'enemy_god');
        const needsAllyTarget = card.effects.some(e => e.target === 'ally_god' || e.target === 'any_god');
        const needsDeadAlly = card.effects.some(e => e.target === 'dead_ally_god');

        if (needsDeadAlly) {
            // Sélectionner un dieu mort allié
            const deadGods = player.gods.filter(g => g.isDead);
            if (deadGods.length > 0) {
                return deadGods[0].card.id;
            }
        }

        if (needsEnemyTarget) {
            // Cibler le dieu adverse avec le moins de PV
            const validTargets = engine.getValidTargets('enemy_god');
            if (validTargets.length > 0) {
                // Trier par PV croissant
                validTargets.sort((a, b) => a.currentHealth - b.currentHealth);
                return validTargets[0].card.id;
            }
        }

        if (needsAllyTarget) {
            // Cibler l'allié avec le moins de PV (pour soin)
            const validTargets = engine.getValidTargets('ally_god');
            if (validTargets.length > 0) {
                // Trier par PV croissant
                validTargets.sort((a, b) => a.currentHealth - b.currentHealth);
                return validTargets[0].card.id;
            }
        }

        return undefined;
    }
}

// Export une instance par défaut
export const defaultAI = new AIPlayer('medium');
