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

        // Compter le nombre de cibles requises pour cette carte
        const requiredTargetCount = this.getRequiredTargetCount(selectedCard);

        // Sélectionner les cibles appropriées
        const targetGodIds = this.selectMultipleTargets(selectedCard, engine, requiredTargetCount);

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

            if (targetGodIds.length > 0) {
                const target = [...opponent.gods, ...player.gods].find(g => g.card.id === targetGodIds[0]);
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
            targetGodId: targetGodIds[0], // Garder pour compatibilité
            targetGodIds, // Nouvelles cibles multiples
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

            // NOUVEAU: Empêcher l'IA de se suicider par poison
            // Si le dieu a du poison et que jouer une carte déclencherait le tick de poison qui le tue,
            // l'IA ne joue pas cette carte pour laisser le joueur porter le coup fatal
            const poisonEffect = god.statusEffects.find(s => s.type === 'poison');
            if (poisonEffect && poisonEffect.stacks > 0) {
                const poisonDamage = poisonEffect.stacks;
                // Si le poison tue le dieu à la fin du tour, ne pas jouer de carte
                if (god.currentHealth <= poisonDamage) {
                    return false;
                }
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
     * Compte le nombre de cibles requises pour une carte
     */
    private getRequiredTargetCount(card: SpellCard): number {
        let count = 0;
        for (const effect of card.effects) {
            if (effect.target === 'enemy_god' || effect.target === 'ally_god' || effect.target === 'any_god' || effect.target === 'dead_ally_god') {
                count++;
            }
        }
        return count;
    }

    /**
     * Sélectionne plusieurs cibles pour une carte multi-cibles
     */
    private selectMultipleTargets(card: SpellCard, engine: GameEngine, count: number): string[] {
        const opponent = engine.getOpponent();
        const player = engine.getCurrentPlayer();
        const targets: string[] = [];

        if (count === 0) {
            return targets;
        }

        // Déterminer les types de cibles nécessaires
        const needsEnemyTarget = card.effects.some(e => e.target === 'enemy_god');
        const needsAllyTarget = card.effects.some(e => e.target === 'ally_god' || e.target === 'any_god');
        const needsDeadAlly = card.effects.some(e => e.target === 'dead_ally_god');

        // Collecter les cibles disponibles par type
        let enemyTargets: GodState[] = [];
        let allyTargets: GodState[] = [];
        let deadAllyTargets: GodState[] = [];

        if (needsEnemyTarget) {
            enemyTargets = engine.getValidTargets('enemy_god');
            // Trier par PV croissant (priorité aux cibles faibles)
            enemyTargets.sort((a, b) => a.currentHealth - b.currentHealth);
        }

        if (needsAllyTarget) {
            allyTargets = engine.getValidTargets('ally_god');
            // Trier par PV croissant (priorité aux alliés blessés pour soin)
            allyTargets.sort((a, b) => a.currentHealth - b.currentHealth);
        }

        if (needsDeadAlly) {
            deadAllyTargets = player.gods.filter(g => g.isDead);
        }

        // Distribuer les cibles selon les effets de la carte
        for (const effect of card.effects) {
            if (targets.length >= count) break;

            if (effect.target === 'enemy_god' && enemyTargets.length > 0) {
                // Prendre la prochaine cible ennemie non utilisée
                const nextTarget = enemyTargets.find(t => !targets.includes(t.card.id));
                if (nextTarget) {
                    targets.push(nextTarget.card.id);
                } else if (enemyTargets.length > 0) {
                    // Si toutes les cibles sont déjà utilisées mais qu'il en reste, 
                    // on utilise quand même une cible (fallback pour sorts avec plus d'effets que de cibles)
                    targets.push(enemyTargets[0].card.id);
                }
            } else if ((effect.target === 'ally_god' || effect.target === 'any_god') && allyTargets.length > 0) {
                const nextTarget = allyTargets.find(t => !targets.includes(t.card.id));
                if (nextTarget) {
                    targets.push(nextTarget.card.id);
                } else if (allyTargets.length > 0) {
                    targets.push(allyTargets[0].card.id);
                }
            } else if (effect.target === 'dead_ally_god' && deadAllyTargets.length > 0) {
                const nextTarget = deadAllyTargets.find(t => !targets.includes(t.card.id));
                if (nextTarget) {
                    targets.push(nextTarget.card.id);
                } else if (deadAllyTargets.length > 0) {
                    targets.push(deadAllyTargets[0].card.id);
                }
            }
        }

        return targets;
    }

    /**
     * Sélectionne une cible pour la carte (méthode legacy, garde pour compatibilité)
     */
    private selectTarget(card: SpellCard, engine: GameEngine): string | undefined {
        const targets = this.selectMultipleTargets(card, engine, 1);
        return targets.length > 0 ? targets[0] : undefined;
    }
}

// Export une instance par défaut
export const defaultAI = new AIPlayer('medium');
