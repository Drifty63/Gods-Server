// Store Zustand pour la gestion de l'état du jeu

import { create } from 'zustand';
import { GameState, PlayerState, SpellCard, GodState, GodCard } from '@/types/cards';
import { GameEngine } from '@/game-engine/GameEngine';
import { AIPlayer } from '@/game-engine/AIPlayer';

interface GameStore {
    // État
    gameState: GameState | null;
    engine: GameEngine | null;
    aiPlayer: AIPlayer | null;
    selectedCard: SpellCard | null;
    selectedTargetGod: GodState | null;
    selectedTargetGods: GodState[];      // Pour ciblage multiple
    requiredTargets: number;              // Nombre de cibles requises
    isSelectingTarget: boolean;
    isSelectingLightningAction: boolean;  // En train de choisir l'action foudre
    selectedLightningAction: 'apply' | 'remove' | null;  // Choix foudre
    isSelectingElement: boolean;  // En train de choisir un élément (Coup Critique d'Artémis)
    selectedElement: import('@/types/cards').Element | null;  // Élément choisi
    playerId: string; // ID du joueur local
    isSoloMode: boolean; // Mode solo contre l'IA
    isAIPlaying: boolean; // L'IA est en train de jouer

    // État pour sélection de cartes (hand/discard)
    isSelectingCards: boolean;
    cardSelectionSource: 'hand' | 'discard' | null;
    cardSelectionCount: number;
    cardSelectionTitle: string;
    pendingCardSelectionEffect: string | null;  // L'effet en attente de sélection

    // État pour distribution de soins
    isDistributingHeal: boolean;
    healDistributionTotal: number;

    // Actions
    initGame: (
        player1Gods: GodCard[],
        player1Deck: SpellCard[],
        player2Gods: GodCard[],
        player2Deck: SpellCard[],
        isPlayer1First: boolean,
        soloMode?: boolean
    ) => void;

    initWithState: (state: GameState, myPlayerId: string) => void;

    // Synchronise l'état du jeu (pour le multijoueur : met à jour depuis l'état reçu)
    syncGameState: (state: GameState) => void;

    setPlayerId: (id: string) => void;
    selectCard: (card: SpellCard | null) => void;
    startTargetSelection: () => void;  // Activer le mode ciblage
    selectTargetGod: (god: GodState | null) => void;
    addTargetGod: (god: GodState) => void;  // Ajouter une cible à la liste
    setLightningAction: (action: 'apply' | 'remove') => void;  // Choisir l'action foudre
    playCard: (cardId: string, targetGodId?: string, targetGodIds?: string[], lightningAction?: 'apply' | 'remove') => { success: boolean; message: string };
    discardForEnergy: (cardId: string) => { success: boolean; message: string };
    endTurn: () => { success: boolean; message: string };
    resetGame: () => void;
    playAITurn: () => void;

    // Getters
    getCurrentPlayer: () => PlayerState | null;
    getOpponent: () => PlayerState | null;
    isMyTurn: () => boolean;
    canPlayCard: (card: SpellCard) => boolean;
    getRequiredTargetCount: (card: SpellCard) => number;
    needsLightningChoice: (card: SpellCard) => boolean;  // Vérifier si la carte nécessite un choix foudre
    needsElementChoice: (card: SpellCard) => boolean;  // Vérifier si la carte nécessite un choix d'élément
    setSelectedElement: (element: import('@/types/cards').Element) => void;  // Choisir l'élément
    getValidEnemyTargets: (isMultiTarget?: boolean) => GodState[];  // Cibles ennemies valides
    getRequiredEnemyTargets: () => GodState[];  // Cibles ennemies obligatoires (provocateurs)
    getValidAllyTargets: () => GodState[];   // Cibles alliées valides

    // Actions pour sélection de cartes
    startCardSelection: (source: 'hand' | 'discard', count: number, title: string, effectId: string) => void;
    confirmCardSelection: (selectedCards: SpellCard[]) => void;
    cancelCardSelection: () => void;
    getCardsForSelection: () => SpellCard[];

    // Actions pour distribution de soins
    startHealDistribution: (totalHeal: number) => void;
    confirmHealDistribution: (distribution: { godId: string; amount: number }[]) => void;
    cancelHealDistribution: () => void;

    // Actions pour sélection de cartes adverses (Nyx)
    isSelectingEnemyCards: boolean;
    enemyCardSelectionCount: number;
    enemyCardSelectionTitle: string;
    pendingEnemyCardEffect: string | null;
    startEnemyCardSelection: (count: number, title: string, effectId: string) => void;
    confirmEnemyCardSelection: (selectedCardIds: string[]) => void;
    cancelEnemyCardSelection: () => void;

    // Actions pour cartes cachées (Nyx)
    revealBlindCard: (cardId: string) => SpellCard | null;  // Révèle une carte cachée et retourne la carte
    discardBlindCard: (cardId: string, loseEnergy: boolean) => void;  // Défausse une carte cachée
}

export const useGameStore = create<GameStore>((set, get) => ({
    // État initial
    gameState: null,
    engine: null,
    aiPlayer: null,
    selectedCard: null,
    selectedTargetGod: null,
    selectedTargetGods: [],
    requiredTargets: 0,
    isSelectingTarget: false,
    isSelectingLightningAction: false,
    selectedLightningAction: null,
    isSelectingElement: false,
    selectedElement: null,
    playerId: '',
    isSoloMode: true, // Mode solo par défaut
    isAIPlaying: false,

    // État initial pour sélection de cartes
    isSelectingCards: false,
    cardSelectionSource: null,
    cardSelectionCount: 0,
    cardSelectionTitle: '',
    pendingCardSelectionEffect: null,

    // État initial pour distribution de soins
    isDistributingHeal: false,
    healDistributionTotal: 0,

    // État initial pour sélection de cartes adverses (Nyx)
    isSelectingEnemyCards: false,
    enemyCardSelectionCount: 0,
    enemyCardSelectionTitle: '',
    pendingEnemyCardEffect: null,

    // Initialiser une nouvelle partie
    initGame: (player1Gods, player1Deck, player2Gods, player2Deck, isPlayer1First, soloMode = true) => {
        const player1Id = 'player1';
        const player2Id = 'player2';
        const firstPlayerId = isPlayer1First ? player1Id : player2Id;

        const initialState = GameEngine.createInitialState(
            player1Id,
            'Vous',
            player1Gods,
            player1Deck,
            player2Id,
            'Adversaire (IA)',
            player2Gods,
            player2Deck,
            firstPlayerId
        );

        const engine = new GameEngine(initialState);
        const aiPlayer = soloMode ? new AIPlayer('medium') : null;

        set({
            gameState: engine.getState(),
            engine,
            aiPlayer,
            selectedCard: null,
            selectedTargetGod: null,
            isSelectingTarget: false,
            playerId: player1Id,
            isSoloMode: soloMode,
            isAIPlaying: false,
        });

        // Si c'est le tour de l'IA (joueur 2 commence), jouer après un délai
        if (soloMode && !isPlayer1First) {
            setTimeout(() => {
                get().playAITurn();
            }, 1000);
        }
    },

    // Initialiser le jeu avec un état spécifique (pour le multijoueur : l'invité reçoit l'état de l'hôte)
    initWithState: (state: GameState, myPlayerId: string) => {
        const engine = new GameEngine(state);

        set({
            gameState: state,
            engine,
            aiPlayer: null, // Pas d'IA en multi via cette méthode
            playerId: myPlayerId, // 'player1' ou 'player2' selon ce que je suis
            isSoloMode: false,
            isAIPlaying: false,
            selectedCard: null,
            selectedTargetGod: null,
            isSelectingTarget: false,
        });
    },

    // Synchronise l'état du jeu depuis l'adversaire (ne touche pas aux états UI locaux)
    syncGameState: (state: GameState) => {
        const engine = new GameEngine(state);
        set({
            gameState: state,
            engine,
        });
    },

    setPlayerId: (id) => set({ playerId: id }),

    selectCard: (card) => {
        const { engine, playerId } = get();
        if (!engine || !card) {
            set({ selectedCard: null, isSelectingTarget: false, selectedTargetGods: [], requiredTargets: 0 });
            return;
        }

        // Compter le nombre de cibles requises (on le garde pour référence)
        const requiredTargets = get().getRequiredTargetCount(card);

        // NE PAS passer en mode ciblage automatiquement
        // L'utilisateur doit d'abord cliquer sur "Jouer" pour entrer en mode ciblage
        set({
            selectedCard: card,
            isSelectingTarget: false, // On ne passe pas en mode ciblage tout de suite
            selectedTargetGod: null,
            selectedTargetGods: [],
            requiredTargets,
        });
    },

    // Activer le mode ciblage pour la carte sélectionnée
    startTargetSelection: () => {
        const { selectedCard } = get();
        if (!selectedCard) return;

        const requiredTargets = get().getRequiredTargetCount(selectedCard);
        if (requiredTargets > 0) {
            set({ isSelectingTarget: true });
        }
    },

    selectTargetGod: (god) => {
        set({ selectedTargetGod: god });
    },

    addTargetGod: (god) => {
        const { selectedTargetGods, requiredTargets } = get();

        // Vérifier si on n'a pas déjà atteint le nombre max de cibles
        if (selectedTargetGods.length >= requiredTargets) return;

        // Vérifier si cette cible n'est pas déjà sélectionnée
        if (selectedTargetGods.some(g => g.card.id === god.card.id)) return;

        const newTargets = [...selectedTargetGods, god];
        set({
            selectedTargetGods: newTargets,
            selectedTargetGod: god // Pour la compatibilité
        });
    },

    getRequiredTargetCount: (card) => {
        // Compter le nombre d'effets qui nécessitent une cible unique
        let count = 0;
        for (const effect of card.effects) {
            if (effect.target === 'enemy_god' || effect.target === 'ally_god' || effect.target === 'any_god' || effect.target === 'dead_ally_god') {
                count++;
            }
        }
        return count;
    },

    needsLightningChoice: (card: SpellCard): boolean => {
        // Vérifier si la carte a un effet lightning_toggle
        return card.effects.some(e =>
            e.type === 'custom' &&
            e.customEffectId &&
            e.customEffectId.startsWith('lightning_toggle')
        );
    },

    getValidEnemyTargets: (isMultiTarget: boolean = false): GodState[] => {
        const { engine } = get();
        if (!engine) return [];
        return engine.getValidTargets('enemy_god', isMultiTarget);
    },

    getRequiredEnemyTargets: (): GodState[] => {
        const { engine } = get();
        if (!engine) return [];
        return engine.getRequiredTargets('enemy_god');
    },

    getValidAllyTargets: (): GodState[] => {
        const { engine } = get();
        if (!engine) return [];
        return engine.getValidTargets('ally_god');
    },

    // Méthodes pour la sélection de cartes
    startCardSelection: (source, count, title, effectId) => {
        set({
            isSelectingCards: true,
            cardSelectionSource: source,
            cardSelectionCount: count,
            cardSelectionTitle: title,
            pendingCardSelectionEffect: effectId,
        });
    },

    confirmCardSelection: (selectedCards) => {
        const { engine, pendingCardSelectionEffect, playerId, cardSelectionSource } = get();
        if (!engine || !pendingCardSelectionEffect) return;

        const player = engine.getState().players.find(p => p.id === playerId);
        if (!player) return;

        // Exécuter l'effet avec les cartes sélectionnées
        if (pendingCardSelectionEffect === 'recycle_from_discard') {
            // Remettre les cartes sélectionnées dans le deck
            for (const card of selectedCards) {
                const index = player.discard.findIndex(c => c.id === card.id);
                if (index !== -1) {
                    const [removedCard] = player.discard.splice(index, 1);
                    player.deck.push(removedCard);
                }
            }
            // Mélanger le deck
            for (let i = player.deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [player.deck[i], player.deck[j]] = [player.deck[j], player.deck[i]];
            }
        } else if (pendingCardSelectionEffect === 'put_cards_bottom') {
            // Mettre les cartes sélectionnées en bas du deck
            for (const card of selectedCards) {
                const index = player.hand.findIndex(c => c.id === card.id);
                if (index !== -1) {
                    const [removedCard] = player.hand.splice(index, 1);
                    player.deck.push(removedCard);
                }
            }
        }

        // Mettre à jour l'état et fermer le modal
        set({
            gameState: engine.getState(),
            isSelectingCards: false,
            cardSelectionSource: null,
            cardSelectionCount: 0,
            cardSelectionTitle: '',
            pendingCardSelectionEffect: null,
        });
    },

    cancelCardSelection: () => {
        set({
            isSelectingCards: false,
            cardSelectionSource: null,
            cardSelectionCount: 0,
            cardSelectionTitle: '',
            pendingCardSelectionEffect: null,
        });
    },

    getCardsForSelection: (): SpellCard[] => {
        const { engine, playerId, cardSelectionSource } = get();
        if (!engine || !cardSelectionSource) return [];

        const player = engine.getState().players.find(p => p.id === playerId);
        if (!player) return [];

        return cardSelectionSource === 'hand' ? player.hand : player.discard;
    },

    // Méthodes pour distribution de soins
    startHealDistribution: (totalHeal) => {
        set({
            isDistributingHeal: true,
            healDistributionTotal: totalHeal,
        });
    },

    confirmHealDistribution: (distribution) => {
        const { engine, playerId } = get();
        if (!engine) return;

        const player = engine.getState().players.find(p => p.id === playerId);
        if (!player) return;

        // Appliquer les soins à chaque dieu selon la distribution
        for (const { godId, amount } of distribution) {
            const god = player.gods.find(g => g.card.id === godId);
            if (god && !god.isDead && amount > 0) {
                // Retirer le poison (min entre heal et stacks de poison)
                const poisonIndex = god.statusEffects.findIndex(s => s.type === 'poison');
                if (poisonIndex !== -1) {
                    const poisonToRemove = Math.min(amount, god.statusEffects[poisonIndex].stacks);
                    god.statusEffects[poisonIndex].stacks -= poisonToRemove;
                    if (god.statusEffects[poisonIndex].stacks <= 0) {
                        god.statusEffects.splice(poisonIndex, 1);
                    }
                }

                // Soigner
                god.currentHealth = Math.min(
                    god.currentHealth + amount,
                    god.card.maxHealth
                );
            }
        }

        // Mettre à jour l'état et fermer le modal
        set({
            gameState: engine.getState(),
            isDistributingHeal: false,
            healDistributionTotal: 0,
        });
    },

    cancelHealDistribution: () => {
        set({
            isDistributingHeal: false,
            healDistributionTotal: 0,
        });
    },

    // Méthodes pour sélection de cartes adverses (Nyx)
    startEnemyCardSelection: (count, title, effectId) => {
        set({
            isSelectingEnemyCards: true,
            enemyCardSelectionCount: count,
            enemyCardSelectionTitle: title,
            pendingEnemyCardEffect: effectId,
        });
    },

    confirmEnemyCardSelection: (selectedCardIds) => {
        const { engine, playerId, pendingEnemyCardEffect, enemyCardSelectionCount } = get();
        if (!engine || !pendingEnemyCardEffect) return;

        const opponent = engine.getState().players.find(p => p.id !== playerId);
        if (!opponent) return;

        // Retirer les cartes sélectionnées de la main adverse et les mettre dans le deck
        for (const cardId of selectedCardIds) {
            const cardIndex = opponent.hand.findIndex(c => c.id === cardId);
            if (cardIndex !== -1) {
                const card = opponent.hand.splice(cardIndex, 1)[0];
                card.isHiddenFromOwner = false; // Reset le flag
                opponent.deck.push(card);
            }
        }

        // Mélanger le deck
        opponent.deck = opponent.deck.sort(() => Math.random() - 0.5);

        // Piocher le même nombre de cartes à l'envers
        const cardsToDraw = Math.min(selectedCardIds.length, opponent.deck.length);
        for (let i = 0; i < cardsToDraw; i++) {
            if (opponent.deck.length > 0) {
                const drawnCard = opponent.deck.shift()!;
                drawnCard.isHiddenFromOwner = true; // Carte visible pour nous
                drawnCard.revealedToPlayerId = playerId; // On stocke l'ID du joueur qui peut voir
                opponent.hand.push(drawnCard);
            }
        }

        // Mettre à jour l'état et fermer le modal
        set({
            gameState: engine.getState(),
            isSelectingEnemyCards: false,
            enemyCardSelectionCount: 0,
            enemyCardSelectionTitle: '',
            pendingEnemyCardEffect: null,
        });
    },

    cancelEnemyCardSelection: () => {
        set({
            isSelectingEnemyCards: false,
            enemyCardSelectionCount: 0,
            enemyCardSelectionTitle: '',
            pendingEnemyCardEffect: null,
        });
    },

    revealBlindCard: (cardId: string) => {
        const { engine, playerId } = get();
        if (!engine) return null;

        const player = engine.getState().players.find(p => p.id === playerId);
        if (!player) return null;

        const card = player.hand.find(c => c.id === cardId);
        if (card && card.isHiddenFromOwner) {
            card.isHiddenFromOwner = false;
            set({ gameState: engine.getState() });
            return card;
        }
        return card || null;
    },

    discardBlindCard: (cardId: string, loseEnergy: boolean) => {
        const { engine, playerId } = get();
        if (!engine) return;

        const player = engine.getState().players.find(p => p.id === playerId);
        if (!player) return;

        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex !== -1) {
            const card = player.hand[cardIndex];

            // Perdre l'énergie si demandé
            if (loseEnergy && card.energyCost > 0) {
                player.energy = Math.max(0, player.energy - card.energyCost);
            }

            // Retirer de la main et mettre en défausse
            const discardedCard = player.hand.splice(cardIndex, 1)[0];
            discardedCard.isHiddenFromOwner = false; // Reset le flag
            player.discard.push(discardedCard);

            set({ gameState: engine.getState() });
        }
    },

    setLightningAction: (action) => {
        set({
            selectedLightningAction: action,
            isSelectingLightningAction: false
        });
    },

    setSelectedElement: (element) => {
        set({
            selectedElement: element,
            isSelectingElement: false
        });
    },

    needsElementChoice: (card) => {
        return card.effects.some(e =>
            e.type === 'custom' &&
            e.customEffectId === 'apply_weakness'
        );
    },

    playCard: (cardId, targetGodId, targetGodIds, lightningAction) => {
        const { engine, playerId, selectedTargetGods, selectedLightningAction, selectedElement, isSoloMode } = get();
        if (!engine) return { success: false, message: 'Partie non initialisée' };

        // Utiliser les cibles multiples si disponibles
        const finalTargetGodIds = targetGodIds || (selectedTargetGods.length > 0 ? selectedTargetGods.map(g => g.card.id) : undefined);
        const finalTargetGodId = targetGodId || (selectedTargetGods.length > 0 ? selectedTargetGods[0].card.id : undefined);
        const finalLightningAction = lightningAction || selectedLightningAction || undefined;

        const result = engine.executeAction({
            type: 'play_card',
            playerId,
            cardId,
            targetGodId: finalTargetGodId,
            targetGodIds: finalTargetGodIds,
            lightningAction: finalLightningAction,
            selectedElement: selectedElement || undefined,
        });

        if (result.success) {
            set({
                gameState: engine.getState(),
                selectedCard: null,
                selectedTargetGod: null,
                selectedTargetGods: [],
                requiredTargets: 0,
                isSelectingTarget: false,
                isSelectingLightningAction: false,
                selectedLightningAction: null,
                isSelectingElement: false,
                selectedElement: null,
            });

            // Fin de tour automatique UNIQUEMENT en mode solo
            // En multijoueur, le GameBoard.onAction gère la fin de tour
            if (isSoloMode) {
                setTimeout(() => {
                    get().endTurn();
                }, 500);
            }
        }

        return result;
    },

    discardForEnergy: (cardId) => {
        const { engine, playerId } = get();
        if (!engine) return { success: false, message: 'Partie non initialisée' };

        const result = engine.executeAction({
            type: 'discard_for_energy',
            playerId,
            cardId,
        });

        if (result.success) {
            set({
                gameState: engine.getState(),
                selectedCard: null,
            });
        }

        return result;
    },

    endTurn: () => {
        const { engine, isSoloMode, playerId } = get();
        if (!engine) return { success: false, message: 'Partie non initialisée' };

        const result = engine.executeAction({
            type: 'end_turn',
            playerId,
        });

        if (result.success) {
            set({
                gameState: engine.getState(),
                selectedCard: null,
                selectedTargetGod: null,
                isSelectingTarget: false,
            });

            // Si mode solo et que c'est maintenant le tour de l'IA
            const newState = engine.getState();
            if (isSoloMode && newState.currentPlayerId !== playerId && newState.status === 'playing') {
                // Jouer le tour de l'IA après un délai
                setTimeout(() => {
                    get().playAITurn();
                }, 1500);
            }
        }

        return result;
    },

    playAITurn: () => {
        const { engine, aiPlayer, playerId, isSoloMode } = get();
        if (!engine || !aiPlayer || !isSoloMode) return;

        const state = engine.getState();
        if (state.currentPlayerId === playerId || state.status !== 'playing') return;

        set({ isAIPlaying: true });

        // L'IA joue son tour
        aiPlayer.playTurn(engine);

        set({
            gameState: engine.getState(),
            isAIPlaying: false,
        });
    },

    resetGame: () => {
        set({
            gameState: null,
            engine: null,
            aiPlayer: null,
            selectedCard: null,
            selectedTargetGod: null,
            isSelectingTarget: false,
            isAIPlaying: false,
        });
    },

    // Getters
    getCurrentPlayer: () => {
        const { gameState } = get();
        if (!gameState) return null;
        return gameState.players.find(p => p.id === gameState.currentPlayerId) || null;
    },

    getOpponent: () => {
        const { gameState } = get();
        if (!gameState) return null;
        return gameState.players.find(p => p.id !== gameState.currentPlayerId) || null;
    },

    isMyTurn: () => {
        const { gameState, playerId } = get();
        if (!gameState) return false;
        return gameState.currentPlayerId === playerId;
    },

    canPlayCard: (card) => {
        const { gameState, playerId } = get();
        if (!gameState) return false;

        const player = gameState.players.find(p => p.id === playerId);
        if (!player) return false;

        // Vérifier si c'est notre tour
        if (gameState.currentPlayerId !== playerId) return false;

        // Vérifier si le joueur a déjà joué une carte ce tour
        if (player.hasPlayedCard) return false;

        // Vérifier si le joueur a défaussé ce tour (exclusif : défausse OU sort)
        if (player.hasDiscardedForEnergy) return false;

        // Vérifier l'énergie
        if (player.energy < card.energyCost) return false;

        // Vérifier si le dieu de la carte est vivant
        const god = player.gods.find(g => g.card.id === card.godId);
        if (!god || god.isDead) return false;

        // Vérifier si le dieu est étourdi (stun) - ne peut pas jouer ses sorts
        const isStunned = god.statusEffects.some(
            s => s.type === 'stun'
        );
        if (isStunned) return false;

        return true;
    },
}));
