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

    // État pour confirmation optionnelle (optional_mill_boost)
    isShowingOptionalChoice: boolean;
    optionalChoiceTitle: string;
    optionalChoiceDescription: string;
    pendingOptionalEffect: string | null;
    pendingOptionalTargetGodIds: string[];  // Les cibles pour l'effet bonus

    // État pour choix de joueur (free_recycle)
    isSelectingPlayer: boolean;
    playerSelectionTitle: string;
    pendingPlayerEffect: string | null;

    // État pour zombie resurrection (Perséphone temp_resurrect)
    isSelectingDeadGod: boolean;
    deadGodSelectionTitle: string;
    pendingZombieEffect: string | null;

    // État pour zombie damage de fin de tour
    isShowingZombieDamage: boolean;
    zombieDamageGodId: string | null;

    // Actions
    initGame: (
        player1Gods: GodCard[],
        player1Deck: SpellCard[],
        player2Gods: GodCard[],
        player2Deck: SpellCard[],
        isPlayer1First: boolean,
        soloMode?: boolean,
        options?: { isOnlineGame?: boolean; maxTurns?: number; player1Name?: string; player2Name?: string }
    ) => void;

    initWithState: (state: GameState, myPlayerId: string) => void;

    // Synchronise l'état du jeu (pour le multijoueur : met à jour depuis l'état reçu)
    syncGameState: (state: GameState) => void;

    setPlayerId: (id: string) => void;
    selectCard: (card: SpellCard | null) => void;
    startTargetSelection: () => void;  // Activer le mode ciblage
    selectTargetGod: (god: GodState | null) => void;
    addTargetGod: (god: GodState) => void;  // Ajouter une cible à la liste
    toggleTargetGod: (god: GodState) => void;  // Ajouter ou retirer une cible
    setLightningAction: (action: 'apply' | 'remove') => void;  // Choisir l'action foudre
    playCard: (cardId: string, targetGodId?: string, targetGodIds?: string[], lightningAction?: 'apply' | 'remove') => { success: boolean; message: string };
    playCardWithChoice: (cardId: string, targetGodId?: string, targetGodIds?: string[], choice?: boolean) => { success: boolean; message: string };
    discardForEnergy: (cardId: string) => { success: boolean; message: string };
    endTurn: (ignoreZombieCheck?: boolean) => { success: boolean; message: string };
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
    surrender: () => void; // Abandonner la partie

    // Actions pour confirmation optionnelle (Perséphone - optional_mill_boost)
    startOptionalChoice: (title: string, description: string, effectId: string, targetGodIds: string[]) => void;
    confirmOptionalChoice: (accepted: boolean) => void;
    cancelOptionalChoice: () => void;

    // Actions pour choix de joueur (Zéphyr - free_recycle)
    startPlayerSelection: (title: string, effectId: string) => void;
    confirmPlayerSelection: (targetSelf: boolean) => void;
    cancelPlayerSelection: () => void;

    // Actions pour zombie resurrection (Perséphone - temp_resurrect)
    startDeadGodSelection: (title: string, effectId: string) => void;
    confirmDeadGodSelection: (godId: string) => void;
    cancelDeadGodSelection: () => void;

    // Actions pour sélection de dieu vivant (Zéphyr - shuffle_god_cards)
    isSelectingGod: boolean;
    godSelectionTitle: string;
    pendingGodEffect: string | null;  // ID de la carte originale qui a déclenché l'effet
    godSelectionTargetType: 'ally' | 'enemy' | 'any' | null;  // Quel type de dieu peut être sélectionné
    startGodSelection: (title: string, effectId: string, targetType: 'ally' | 'enemy' | 'any') => void;
    confirmGodSelection: (godId: string) => void;
    cancelGodSelection: () => void;

    // Actions pour zombie damage de fin de tour
    startZombieDamage: (godId: string) => void;
    confirmZombieDamage: (targetGodId: string | null) => void;  // null = skip damage
    cancelZombieDamage: () => void;
}

// Fonction helper pour créer une copie profonde du gameState
// Cela force React à détecter le changement et déclencher un re-render
const cloneGameState = (state: GameState): GameState => {
    return JSON.parse(JSON.stringify(state));
};

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

    // État initial pour confirmation optionnelle (optional_mill_boost)
    isShowingOptionalChoice: false,
    optionalChoiceTitle: '',
    optionalChoiceDescription: '',
    pendingOptionalEffect: null,
    pendingOptionalTargetGodIds: [],

    // État initial pour choix de joueur (free_recycle)
    isSelectingPlayer: false,
    playerSelectionTitle: '',
    pendingPlayerEffect: null,

    // État initial pour zombie resurrection (Perséphone temp_resurrect)
    isSelectingDeadGod: false,
    deadGodSelectionTitle: '',
    pendingZombieEffect: null,

    // État initial pour sélection de dieu vivant (Zéphyr - shuffle_god_cards)
    isSelectingGod: false,
    godSelectionTitle: '',
    pendingGodEffect: null,
    godSelectionTargetType: null,

    // État initial pour zombie damage de fin de tour
    isShowingZombieDamage: false,
    zombieDamageGodId: null,

    // Initialiser une nouvelle partie
    initGame: (player1Gods, player1Deck, player2Gods, player2Deck, isPlayer1First, soloMode = true, options) => {
        const player1Id = 'player1';
        const player2Id = 'player2';
        const firstPlayerId = isPlayer1First ? player1Id : player2Id;

        // Utiliser les noms depuis options, ou fallback pour mode solo
        const player1Name = options?.player1Name || 'Vous';
        const player2Name = options?.player2Name || (soloMode ? 'Adversaire (IA)' : 'Adversaire');

        const initialState = GameEngine.createInitialState(
            player1Id,
            player1Name,
            player1Gods,
            player1Deck,
            player2Id,
            player2Name,
            player2Gods,
            player2Deck,
            firstPlayerId,
            options  // Passer les options (isOnlineGame, maxTurns)
        );

        const engine = new GameEngine(initialState);
        const aiPlayer = soloMode ? new AIPlayer('medium') : null;

        set({
            gameState: cloneGameState(engine.getState()),
            engine,
            aiPlayer,
            selectedCard: null,
            selectedTargetGod: null,
            isSelectingTarget: false,
            playerId: player1Id,
            isSoloMode: soloMode,
            isAIPlaying: false,
        });

        // NOTE: On ne lance plus playAITurn ici pour laisser le temps à l'UI d'afficher les intros
        // C'est à la page de combat de déclencher le premier tour IA si besoin
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

    toggleTargetGod: (god) => {
        const { selectedTargetGods, requiredTargets } = get();

        // Si déjà sélectionné, on retire
        const isAlreadySelected = selectedTargetGods.some(g => g.card.id === god.card.id);
        if (isAlreadySelected) {
            const newTargets = selectedTargetGods.filter(g => g.card.id !== god.card.id);
            set({
                selectedTargetGods: newTargets,
                selectedTargetGod: newTargets.length > 0 ? newTargets[newTargets.length - 1] : null
            });
            return;
        }

        // Sinon on ajoute (si pas déjà au max)
        if (selectedTargetGods.length >= requiredTargets) return;

        const newTargets = [...selectedTargetGods, god];
        set({
            selectedTargetGods: newTargets,
            selectedTargetGod: god
        });
    },

    getRequiredTargetCount: (card) => {
        // Compter le nombre d'effets qui nécessitent une cible unique
        let count = 0;
        for (const effect of card.effects) {
            if (effect.target === 'enemy_god' || effect.target === 'ally_god' || effect.target === 'any_god' || effect.target === 'dead_ally_god') {
                count++;
            }
            // Vision du Tartare nécessite 2 cibles ennemies
            if (effect.type === 'custom' && effect.customEffectId === 'vision_tartare') {
                count += 2;
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
        } else if (pendingCardSelectionEffect === 'retrieve_discard') {
            // Perséphone - Récupérer une carte de la défausse et la mettre en main
            for (const card of selectedCards) {
                const index = player.discard.findIndex(c => c.id === card.id);
                if (index !== -1) {
                    const [retrievedCard] = player.discard.splice(index, 1);
                    player.hand.push(retrievedCard);
                }
            }
        } else if (pendingCardSelectionEffect.startsWith('copy_discard_spell')) {
            const originalCardId = pendingCardSelectionEffect.includes(':') ? pendingCardSelectionEffect.split(':')[1] : null;

            if (selectedCards.length > 0) {
                const copiedCard = selectedCards[0];

                // Fermer la sélection de carte manuellement avant de passer à la suite
                set({
                    isSelectingCards: false,
                    cardSelectionSource: null,
                    cardSelectionCount: 0,
                    cardSelectionTitle: '',
                    pendingCardSelectionEffect: null
                });

                // Vérifier si la carte copiée nécessite une cible
                // On simule la carte transformée en Ténèbres
                const mockCard = { ...copiedCard, element: 'darkness' as const, energyCost: 0 };
                const neededTargets = get().getRequiredTargetCount(mockCard);

                if (neededTargets > 0) {
                    // Lancer la sélection de cible
                    set({
                        isSelectingTarget: true,
                        requiredTargets: neededTargets,
                        selectedCard: mockCard,
                        // On utilise pendingEnemyCardEffect pour stocker le contexte (HACK mais efficace)
                        pendingEnemyCardEffect: `cast_copy:${originalCardId || ''}:${copiedCard.id}`
                    });
                } else {
                    // Pas de cible nécessaire, exécuter directement
                    engine.executeAction({
                        type: 'cast_copied_spell',
                        playerId,
                        originalCardId: originalCardId || undefined,
                        copiedCardId: copiedCard.id
                    });
                    set({ gameState: cloneGameState(engine.getState()) });
                }
            }
            return; // Empêcher l'exécution du bloc de nettoyage par défaut ci-dessous
        }

        // Mettre à jour l'état et fermer le modal
        set({
            gameState: cloneGameState(engine.getState()),
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
        const { engine, playerId, cardSelectionSource, pendingCardSelectionEffect } = get();
        if (!engine || !cardSelectionSource) return [];

        const player = engine.getState().players.find(p => p.id === playerId);
        if (!player) return [];

        if (cardSelectionSource === 'discard') {
            // Si c'est pour recycler, on ne doit pas pouvoir recycler la carte qu'on vient de jouer
            // La carte jouée est toujours la dernière de la défausse car elle y est mise à la fin de playCard
            if (pendingCardSelectionEffect === 'recycle_from_discard' && player.discard.length > 0) {
                // Retourner toutes les cartes sauf la dernière
                return player.discard.slice(0, player.discard.length - 1);
            }
            return player.discard;
        }

        return player.hand;
    },

    // Méthodes pour distribution de soins
    startHealDistribution: (totalHeal) => {
        set({
            isDistributingHeal: true,
            healDistributionTotal: totalHeal,
        });
    },

    confirmHealDistribution: (distribution) => {
        const { engine, playerId, healDistributionTotal } = get();
        if (!engine) return;

        const player = engine.getState().players.find(p => p.id === playerId);
        if (!player) return;

        // Valider que le total distribué ne dépasse pas le total autorisé
        const totalDistributed = distribution.reduce((sum, d) => sum + d.amount, 0);
        if (totalDistributed > healDistributionTotal) {
            console.warn(`Heal distribution exceeds allowed total: ${totalDistributed} > ${healDistributionTotal}`);
            return; // Rejeter la distribution invalide
        }

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
            gameState: cloneGameState(engine.getState()),
            isDistributingHeal: false,
            healDistributionTotal: 0,
        });

        // En mode solo, finir le tour automatiquement après la confirmation
        const { isSoloMode } = get();
        if (isSoloMode) {
            setTimeout(() => {
                get().endTurn();
            }, 500);
        }
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

        // Cas spécial : choose_discard_enemy (Vent d'Ouest) = simple défausse
        if (pendingEnemyCardEffect === 'choose_discard_enemy') {
            for (const cardId of selectedCardIds) {
                const cardIndex = opponent.hand.findIndex(c => c.id === cardId);
                if (cardIndex !== -1) {
                    const card = opponent.hand.splice(cardIndex, 1)[0];
                    card.isHiddenFromOwner = false;
                    opponent.discard.push(card); // Défausse, pas dans le deck
                }
            }
        } else {
            // Comportement par défaut (Nyx) : mélange dans deck + pioche à l'envers
            for (const cardId of selectedCardIds) {
                const cardIndex = opponent.hand.findIndex(c => c.id === cardId);
                if (cardIndex !== -1) {
                    const card = opponent.hand.splice(cardIndex, 1)[0];
                    card.isHiddenFromOwner = false;
                    opponent.deck.push(card);
                }
            }

            // Mélanger le deck
            opponent.deck = opponent.deck.sort(() => Math.random() - 0.5);

            // Piocher le même nombre de cartes à l'envers
            const cardsToDraw = Math.min(selectedCardIds.length, opponent.deck.length);
            for (let i = 0; i < cardsToDraw; i++) {
                if (opponent.deck.length > 0) {
                    const originalCard = opponent.deck.shift()!;
                    const drawnCard = {
                        ...originalCard,
                        isHiddenFromOwner: true,
                        revealedToPlayerId: playerId
                    };
                    opponent.hand.push(drawnCard);
                }
            }
        }

        // Mettre à jour l'état et fermer le modal
        set({
            gameState: cloneGameState(engine.getState()),
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
            set({ gameState: cloneGameState(engine.getState()) });
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

            // Retirer de la main et mettre en défausse (nettoyer les propriétés "blind")
            const discardedCard = player.hand.splice(cardIndex, 1)[0];
            delete discardedCard.isHiddenFromOwner;
            delete discardedCard.revealedToPlayerId;
            player.discard.push(discardedCard);

            set({ gameState: cloneGameState(engine.getState()) });
        }
    },

    surrender: () => {
        const { engine, playerId } = get();
        if (!engine) return;

        const state = engine.getState();
        state.status = 'finished';
        state.winnerId = state.players.find(p => p.id !== playerId)?.id; // L'autre gagne

        set({ gameState: { ...state } });
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
        const { engine, playerId, selectedTargetGods, selectedLightningAction, selectedElement, isSoloMode, pendingEnemyCardEffect } = get();
        if (!engine) return { success: false, message: 'Partie non initialisée' };

        // 1. CAS SPÉCIAL : Exécution d'un sort copié après sélection de cible
        if (pendingEnemyCardEffect?.startsWith('cast_copy:')) {
            const parts = pendingEnemyCardEffect.split(':');
            const originalCardId = parts[1];
            const copiedCardId = parts[2];

            // Récupérer les cibles depuis l'appel (qui viennent de selectedTargetGods)
            const finalTargetGodIds = targetGodIds || (selectedTargetGods.length > 0 ? selectedTargetGods.map(g => g.card.id) : undefined);
            const finalTargetGodId = targetGodId || (selectedTargetGods.length > 0 ? selectedTargetGods[0].card.id : undefined);

            const result = engine.executeAction({
                type: 'cast_copied_spell',
                playerId,
                originalCardId,
                copiedCardId,
                targetGodId: finalTargetGodId,
                targetGodIds: finalTargetGodIds,
                lightningAction: lightningAction || selectedLightningAction || undefined,
                selectedElement: selectedElement || undefined,
            });

            // Reset l'état
            set({
                gameState: cloneGameState(engine.getState()),
                selectedCard: null,
                selectedTargetGod: null,
                selectedTargetGods: [],
                requiredTargets: 0,
                isSelectingTarget: false,
                isSelectingLightningAction: false,
                selectedLightningAction: null,
                isSelectingElement: false,
                selectedElement: null,
                pendingEnemyCardEffect: null // Nettoyer le flag
            });

            return result;
        }

        // 2. CAS SPÉCIAL : Interception du sort Perséphone "Pouvoirs des Âmes"
        const player = engine.getState().players.find(p => p.id === playerId);
        const cardToCheck = player?.hand.find(c => c.id === cardId);

        if (cardToCheck && cardToCheck.effects.some(e => e.type === 'custom' && e.customEffectId === 'copy_discard_spell')) {
            // JOUER LA CARTE D'ABORD (dépense l'énergie, défausse la carte)
            const playResult = engine.executeAction({
                type: 'play_card',
                playerId,
                cardId,
            });

            if (playResult.success) {
                set({ gameState: cloneGameState(engine.getState()) });
                get().startCardSelection('discard', 1, "Copier un sort (devient Ténèbres)", `copy_discard_spell:${cardId}`);
            }

            return playResult;
        }

        // 3. CAS SPÉCIAL : Interception du sort Zéphyr "Vent de Face" (shuffle_god_cards)
        if (cardToCheck && cardToCheck.effects.some(e => e.type === 'custom' && e.customEffectId === 'shuffle_god_cards')) {
            // Jouer la carte (payer le coût) mais ne pas exécuter l'effet custom ici
            const playResult = engine.executeAction({
                type: 'play_card',
                playerId,
                cardId,
            });

            if (playResult.success) {
                set({ gameState: cloneGameState(engine.getState()) });
                // Ouvrir le modal de sélection de dieu (tous les dieux vivants)
                get().startGodSelection("Choisissez un dieu dont les cartes retourneront dans le deck", `shuffle_god_cards:${cardId}`, 'any');
            }

            return playResult;
        }

        // =========================================================

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
                gameState: cloneGameState(engine.getState()),
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
                // Vérifier si le tour n'a pas déjà changé (ex: mort par poison)
                const currentState = engine.getState();
                if (currentState.currentPlayerId === playerId && currentState.status === 'playing') {
                    setTimeout(() => {
                        // Vérifier l'état actuel (peut avoir changé depuis le lancement du timeout)
                        const freshState = engine.getState();
                        const freshPlayer = freshState.players.find(p => p.id === playerId);
                        const currentStoreState = get();

                        // NE PAS finir le tour si un modal est ouvert
                        const hasActiveModal =
                            currentStoreState.isDistributingHeal ||
                            currentStoreState.isSelectingCards ||
                            currentStoreState.isSelectingEnemyCards ||
                            currentStoreState.isShowingOptionalChoice ||
                            currentStoreState.isSelectingPlayer ||
                            currentStoreState.isSelectingDeadGod ||
                            currentStoreState.isSelectingGod ||
                            currentStoreState.isShowingZombieDamage;

                        if (hasActiveModal) {
                            // Un modal est ouvert, ne pas finir le tour
                            // La fin de tour sera gérée par la confirmation du modal
                            return;
                        }

                        // On ne finit le tour que si :
                        // 1. C'est toujours notre tour
                        // 2. La partie est toujours en cours
                        // 3. On A JOUÉ une carte (hasPlayedCard === true)
                        // Si hasPlayedCard est false (effet Hermès), on laisse le joueur continuer
                        if (freshState.currentPlayerId === playerId &&
                            freshState.status === 'playing' &&
                            freshPlayer?.hasPlayedCard) {
                            get().endTurn();
                        }
                    }, 4500);
                }
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
                gameState: cloneGameState(engine.getState()),
                selectedCard: null,
            });
        }

        return result;
    },

    endTurn: (ignoreZombieCheck = false) => {
        const { engine, isSoloMode, playerId } = get();
        if (!engine) return { success: false, message: 'Partie non initialisée' };

        // Vérifier s'il y a un zombie allié vivant pour l'attaque de fin de tour
        if (!ignoreZombieCheck) {
            const player = engine.getState().players.find(p => p.id === playerId);
            const zombieGod = player?.gods.find(g => g.isZombie && !g.isDead);

            if (zombieGod) {
                // Ouvrir le modal d'attaque zombie au lieu de finir le tour immédiatement
                get().startZombieDamage(zombieGod.card.id);
                return { success: true, message: 'Phase attaque zombie' };
            }
        }

        const result = engine.executeAction({
            type: 'end_turn',
            playerId,
        });

        if (result.success) {
            set({
                gameState: cloneGameState(engine.getState()),
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
                }, 2500);
            }
        }

        return result;
    },

    playAITurn: () => {
        const { engine, aiPlayer, playerId, isSoloMode, isAIPlaying } = get();

        // GARDE CRITIQUE : Si l'IA est déjà en train de jouer, on ignore cet appel
        if (isAIPlaying) {
            return;
        }

        if (!engine || !aiPlayer || !isSoloMode) return;

        const state = engine.getState();
        if (state.currentPlayerId === playerId || state.status !== 'playing') {
            return;
        }

        // CAPTURER l'ID de l'IA MAINTENANT (avant les setTimeout)
        const aiIdAtStart = state.currentPlayerId;

        set({ isAIPlaying: true });

        // Petit délai de "réflexion" avant que l'IA ne joue
        setTimeout(() => {
            try {
                // Vérification de sécurité : s'assurer que c'est toujours le tour de l'IA capturée
                const currentState = engine.getState();
                if (currentState.currentPlayerId !== aiIdAtStart) {
                    set({ isAIPlaying: false });
                    return;
                }

                // L'IA joue son tour
                const actions = aiPlayer.playTurn(engine);

                // Mettre à jour l'état immédiatement pour montrer les actions
                set({
                    gameState: cloneGameState(engine.getState()),
                });

                // Déterminer le délai avant de finir le tour
                const playedCardAction = actions.find(a => a.type === 'play_card');
                const delay = playedCardAction ? 4500 : 1000;

                setTimeout(() => {
                    // Vérification de sécurité : s'assurer que c'est toujours le tour de l'IA capturée
                    const stateBeforeEnd = engine.getState();
                    if (stateBeforeEnd.currentPlayerId !== aiIdAtStart) {
                        set({ isAIPlaying: false });
                        return;
                    }

                    // Finir le tour de l'IA en utilisant l'ID capturé au début
                    engine.executeAction({ type: 'end_turn', playerId: aiIdAtStart });

                    set({
                        gameState: cloneGameState(engine.getState()),
                        isAIPlaying: false,
                    });
                }, delay);
            } catch (error) {
                console.error("AI execution error:", error);
                // Fallback : on passe le tour de force pour débloquer le jeu
                setTimeout(() => {
                    engine.executeAction({ type: 'end_turn', playerId: aiIdAtStart });
                    set({
                        gameState: cloneGameState(engine.getState()),
                        isAIPlaying: false,
                    });
                }, 2000);
            }
        }, 1200);
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

    // === ACTIONS POUR CONFIRMATION OPTIONNELLE (optional_mill_boost) ===
    startOptionalChoice: (title, description, effectId, targetGodIds) => {
        set({
            isShowingOptionalChoice: true,
            optionalChoiceTitle: title,
            optionalChoiceDescription: description,
            pendingOptionalEffect: effectId,
            pendingOptionalTargetGodIds: targetGodIds,
        });
    },

    confirmOptionalChoice: (accepted) => {
        const { engine, playerId, pendingOptionalEffect, pendingOptionalTargetGodIds } = get();
        if (!engine || !pendingOptionalEffect) return;

        const player = engine.getState().players.find(p => p.id === playerId);
        const opponent = engine.getState().players.find(p => p.id !== playerId);
        if (!player || !opponent) return;

        // Vision du Tartare : inflige les dégâts de base (1) + bonus (+1 si accepté)
        if (pendingOptionalEffect === 'vision_tartare') {
            let damagePerTarget = 1; // Dégât de base

            if (accepted) {
                // Défausser 2 cartes du dessus du deck
                for (let i = 0; i < 2 && player.deck.length > 0; i++) {
                    const card = player.deck.shift()!;
                    player.discard.push(card);
                }
                damagePerTarget = 2; // Dégât de base + bonus
            }

            // Infliger les dégâts à toutes les cibles en une seule fois
            for (const targetId of pendingOptionalTargetGodIds) {
                const target = opponent.gods.find(g => g.card.id === targetId && !g.isDead);
                if (target) {
                    // Gestion du bouclier
                    let remainingDamage = damagePerTarget;
                    const shieldIndex = target.statusEffects.findIndex(s => s.type === 'shield');
                    if (shieldIndex !== -1) {
                        const shieldStacks = target.statusEffects[shieldIndex].stacks;
                        const absorbedDamage = Math.min(shieldStacks, remainingDamage);
                        target.statusEffects[shieldIndex].stacks -= absorbedDamage;
                        remainingDamage -= absorbedDamage;
                        if (target.statusEffects[shieldIndex].stacks <= 0) {
                            target.statusEffects.splice(shieldIndex, 1);
                        }
                    }
                    if (remainingDamage > 0) {
                        target.currentHealth -= remainingDamage;
                        if (target.currentHealth <= 0) {
                            target.isDead = true;
                            target.currentHealth = 0;
                        }
                    }
                }
            }
        }

        // Séléné - Marée Basse : choix de direction du soin en cascade
        if (pendingOptionalEffect === 'cascade_heal_choice') {
            // Récupérer les dieux alliés vivants
            const aliveAllies = player.gods.filter(g => !g.isDead);
            const healAmounts = [3, 2, 1]; // Toujours 3, 2, 1 en partant de la source du flux

            if (accepted) {
                // Gauche vers Droite (Flux Ouest) : On parcourt normalement [0, 1, 2]
                for (let i = 0; i < aliveAllies.length && i < healAmounts.length; i++) {
                    const god = aliveAllies[i];
                    god.currentHealth = Math.min(god.currentHealth + healAmounts[i], god.card.maxHealth);
                    // Le soin retire le poison
                    const poisonIndex = god.statusEffects.findIndex(s => s.type === 'poison');
                    if (poisonIndex !== -1) {
                        god.statusEffects.splice(poisonIndex, 1);
                    }
                }
            } else {
                // Droite vers Gauche (Flux Est) : On parcourt en sens inverse (du dernier au premier)
                // Le dernier (tout à droite) prend le max (healAmounts[0] = 3)
                const reversedAllies = [...aliveAllies].reverse();
                for (let i = 0; i < reversedAllies.length && i < healAmounts.length; i++) {
                    const god = reversedAllies[i];
                    god.currentHealth = Math.min(god.currentHealth + healAmounts[i], god.card.maxHealth);
                    // Le soin retire le poison
                    const poisonIndex = god.statusEffects.findIndex(s => s.type === 'poison');
                    if (poisonIndex !== -1) {
                        god.statusEffects.splice(poisonIndex, 1);
                    }
                }
            }
        }

        // Fermer le modal et mettre à jour l'état
        set({
            gameState: cloneGameState(engine.getState()),
            isShowingOptionalChoice: false,
            optionalChoiceTitle: '',
            optionalChoiceDescription: '',
            pendingOptionalEffect: null,
            pendingOptionalTargetGodIds: [],
        });
    },

    cancelOptionalChoice: () => {
        set({
            isShowingOptionalChoice: false,
            optionalChoiceTitle: '',
            optionalChoiceDescription: '',
            pendingOptionalEffect: null,
            pendingOptionalTargetGodIds: [],
        });
    },

    // === ACTIONS POUR CHOIX DE JOUEUR (free_recycle) ===
    startPlayerSelection: (title, effectId) => {
        set({
            isSelectingPlayer: true,
            playerSelectionTitle: title,
            pendingPlayerEffect: effectId,
        });
    },

    confirmPlayerSelection: (targetSelf) => {
        const { engine, playerId, pendingPlayerEffect } = get();
        if (!engine || !pendingPlayerEffect) return;

        const player = engine.getState().players.find(p => p.id === playerId);
        const opponent = engine.getState().players.find(p => p.id !== playerId);
        if (!player || !opponent) return;

        if (pendingPlayerEffect === 'free_recycle') {
            // Choisir le joueur cible
            const targetPlayer = targetSelf ? player : opponent;

            // Mélanger défausse dans le deck
            targetPlayer.deck.push(...targetPlayer.discard);
            targetPlayer.discard = [];

            // Mélanger le deck (Fisher-Yates)
            for (let i = targetPlayer.deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [targetPlayer.deck[i], targetPlayer.deck[j]] = [targetPlayer.deck[j], targetPlayer.deck[i]];
            }
            // PAS d'augmentation de fatigue, PAS de dégâts
        }

        // Fermer le modal et mettre à jour l'état
        set({
            gameState: cloneGameState(engine.getState()),
            isSelectingPlayer: false,
            playerSelectionTitle: '',
            pendingPlayerEffect: null,
        });
    },

    cancelPlayerSelection: () => {
        set({
            isSelectingPlayer: false,
            playerSelectionTitle: '',
            pendingPlayerEffect: null,
        });
    },

    // === ACTIONS POUR ZOMBIE RESURRECTION (Perséphone - temp_resurrect) ===
    startDeadGodSelection: (title, effectId) => {
        set({
            isSelectingDeadGod: true,
            deadGodSelectionTitle: title,
            pendingZombieEffect: effectId,
        });
    },

    confirmDeadGodSelection: (godId) => {
        const { engine, playerId, pendingZombieEffect } = get();
        if (!engine || !pendingZombieEffect) return;

        const player = engine.getState().players.find(p => p.id === playerId);
        if (!player) return;

        // Trouver le dieu mort
        const deadGod = player.gods.find(g => g.card.id === godId && g.isDead);
        if (!deadGod) return;

        if (pendingZombieEffect === 'temp_resurrect' && player.deck.length > 0) {
            // Prendre la carte du dessus du deck
            const zombieCard = player.deck.shift()!;

            // Ressusciter le dieu en zombie
            deadGod.isDead = false;
            deadGod.currentHealth = 5;  // 5 PV
            deadGod.isZombie = true;
            deadGod.zombieCard = zombieCard;
            deadGod.zombieOwnerId = playerId;
            deadGod.statusEffects = [];  // Reset les effets de statut
        }

        // Fermer le modal et mettre à jour l'état
        set({
            gameState: cloneGameState(engine.getState()),
            isSelectingDeadGod: false,
            deadGodSelectionTitle: '',
            pendingZombieEffect: null,
        });
    },

    cancelDeadGodSelection: () => {
        set({
            isSelectingDeadGod: false,
            deadGodSelectionTitle: '',
            pendingZombieEffect: null,
        });
    },

    // === ACTIONS POUR ZOMBIE DAMAGE DE FIN DE TOUR ===
    startZombieDamage: (godId) => {
        set({
            isShowingZombieDamage: true,
            zombieDamageGodId: godId,
        });
    },

    confirmZombieDamage: (targetGodId) => {
        const { engine, playerId, zombieDamageGodId } = get();
        if (!engine) return;

        // Si une cible est sélectionnée, exécuter l'action d'attaque zombie
        if (targetGodId) {
            engine.executeAction({
                type: 'zombie_attack',
                playerId,
                targetGodId
            });
        }

        // Fermer le modal et mettre à jour l'état
        set({
            gameState: cloneGameState(engine.getState()),
            isShowingZombieDamage: false,
            zombieDamageGodId: null,
        });

        // Terminer le tour (en ignorant le check zombie pour éviter la boucle)
        get().endTurn(true);
    },

    cancelZombieDamage: () => {
        set({
            isShowingZombieDamage: false,
            zombieDamageGodId: null,
        });

        // Terminer le tour même si on annule
        get().endTurn(true);
    },

    // === ACTIONS POUR SÉLECTION DE DIEU VIVANT (Zéphyr - shuffle_god_cards) ===
    startGodSelection: (title, effectId, targetType) => {
        set({
            isSelectingGod: true,
            godSelectionTitle: title,
            pendingGodEffect: effectId,
            godSelectionTargetType: targetType,
        });
    },

    confirmGodSelection: (godId) => {
        const { engine, playerId, pendingGodEffect } = get();
        if (!engine || !pendingGodEffect) return;

        const player = engine.getState().players.find(p => p.id === playerId);
        const opponent = engine.getState().players.find(p => p.id !== playerId);
        if (!player || !opponent) return;

        // Trouver le dieu cible (peut être allié ou ennemi selon l'effet)
        let targetGod = player.gods.find(g => g.card.id === godId && !g.isDead);
        let targetPlayer = player;

        if (!targetGod) {
            targetGod = opponent.gods.find(g => g.card.id === godId && !g.isDead);
            targetPlayer = opponent;
        }

        if (!targetGod) return;

        // Gérer l'effet shuffle_god_cards
        if (pendingGodEffect.startsWith('shuffle_god_cards')) {
            // Récupérer l'ID de la carte originale si présent
            const parts = pendingGodEffect.split(':');
            const originalCardId = parts.length > 1 ? parts[1] : null;

            // Trouver les cartes du dieu sélectionné dans la main du joueur cible
            const cardsToShuffle = targetPlayer.hand.filter(c => c.godId === godId);

            if (cardsToShuffle.length > 0) {
                // Retirer ces cartes de la main
                targetPlayer.hand = targetPlayer.hand.filter(c => c.godId !== godId);

                // Les ajouter au deck
                targetPlayer.deck.push(...cardsToShuffle);

                // Mélanger le deck (Fisher-Yates)
                for (let i = targetPlayer.deck.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [targetPlayer.deck[i], targetPlayer.deck[j]] = [targetPlayer.deck[j], targetPlayer.deck[i]];
                }
            }
        }

        // Fermer le modal et mettre à jour l'état
        set({
            gameState: cloneGameState(engine.getState()),
            isSelectingGod: false,
            godSelectionTitle: '',
            pendingGodEffect: null,
            godSelectionTargetType: null,
        });
    },

    cancelGodSelection: () => {
        set({
            isSelectingGod: false,
            godSelectionTitle: '',
            pendingGodEffect: null,
            godSelectionTargetType: null,
        });
    },

    playCardWithChoice: (cardId: string, targetGodId?: string, targetGodIds?: string[], choice?: boolean) => {
        const { engine, playerId, selectedTargetGods } = get();
        if (!engine) return { success: false, message: 'Partie non initialisée' };

        const player = engine.getState().players.find(p => p.id === playerId);
        if (!player) return { success: false, message: 'Joueur introuvable' };

        const card = player.hand.find(c => c.id === cardId);
        if (!card) return { success: false, message: 'Carte introuvable' };

        // Identifier l'effet optionnel
        const visionTartare = card.effects.find(e => e.type === 'custom' && e.customEffectId === 'vision_tartare');
        const mareeBasse = card.effects.find(e => e.type === 'custom' && e.customEffectId === 'cascade_heal_choice');

        // === VISION DU TARTARE ===
        if (visionTartare) {
            // Si choix accepté (Oui), vérifier qu'on peut payer le coût (2 cartes deck)
            if (choice) {
                if (player.deck.length < 2) {
                    return { success: false, message: 'Pas assez de cartes dans le deck (2 requises)' };
                }
                // Défausser 2 cartes
                for (let i = 0; i < 2; i++) {
                    const c = player.deck.shift()!;
                    player.discard.push(c);
                }
            }
        }

        // === MARÉE BASSE ===
        // Le choix (direction) s'applique lors de la résolution, pas de coût préalable

        // Jouer la carte via le moteur (coût mana + effet de base)
        const finalTargetGodIds = targetGodIds || (selectedTargetGods.length > 0 ? selectedTargetGods.map(g => g.card.id) : undefined);
        const finalTargetGodId = targetGodId || (selectedTargetGods.length > 0 ? selectedTargetGods[0].card.id : undefined);

        const result = engine.executeAction({
            type: 'play_card',
            playerId,
            cardId,
            targetGodId: finalTargetGodId,
            targetGodIds: finalTargetGodIds,
        });

        if (!result.success) return result;

        // APPLIQUER LES EFFETS BONUS/CHOIX MANUELLEMENT
        // Car le moteur ne gère pas ces effets custom

        if (visionTartare) {
            // Vision du Tartare : 1 dégât de base + 1 bonus si choice=true = 1 ou 2 dégâts par cible
            const damagePerTarget = choice ? 2 : 1;
            const opponent = engine.getState().players.find(p => p.id !== playerId);

            if (opponent && finalTargetGodIds && finalTargetGodIds.length > 0) {
                for (const tid of finalTargetGodIds) {
                    const target = opponent.gods.find(g => g.card.id === tid && !g.isDead);
                    if (target) {
                        // Gestion du bouclier
                        let remainingDamage = damagePerTarget;
                        const shieldIndex = target.statusEffects.findIndex(s => s.type === 'shield');
                        if (shieldIndex !== -1) {
                            const shieldStacks = target.statusEffects[shieldIndex].stacks;
                            const absorbedDamage = Math.min(shieldStacks, remainingDamage);
                            target.statusEffects[shieldIndex].stacks -= absorbedDamage;
                            remainingDamage -= absorbedDamage;
                            if (target.statusEffects[shieldIndex].stacks <= 0) {
                                target.statusEffects.splice(shieldIndex, 1);
                            }
                        }
                        // Appliquer les dégâts restants
                        if (remainingDamage > 0) {
                            target.currentHealth = Math.max(0, target.currentHealth - remainingDamage);
                            if (target.currentHealth === 0) {
                                target.isDead = true;
                            }
                        }
                    }
                }
            }
        }

        if (mareeBasse) {
            // Marée basse n'a pas d'effet de base dans le moteur (probablement défini comme "no-op" ou heal 0)
            // On applique tout le soin ici selon la direction
            const aliveAllies = player.gods.filter(g => !g.isDead);
            const healAmounts = [3, 2, 1];

            if (choice) { // Ouest (G->D)
                for (let i = 0; i < aliveAllies.length && i < healAmounts.length; i++) {
                    const god = aliveAllies[i];
                    god.currentHealth = Math.min(god.currentHealth + healAmounts[i], god.card.maxHealth);
                    god.statusEffects = god.statusEffects.filter(s => s.type !== 'poison');
                }
            } else { // Est (D->G)
                const reversedAllies = [...aliveAllies].reverse();
                for (let i = 0; i < reversedAllies.length && i < healAmounts.length; i++) {
                    const god = reversedAllies[i];
                    god.currentHealth = Math.min(god.currentHealth + healAmounts[i], god.card.maxHealth);
                    god.statusEffects = god.statusEffects.filter(s => s.type !== 'poison');
                }
            }
        }

        // Mettre à jour l'état
        set({
            gameState: cloneGameState(engine.getState()),
            selectedCard: null,
            selectedTargetGod: null,
            selectedTargetGods: [],
            requiredTargets: 0,
            isSelectingTarget: false,
        });

        // Finir le tour 
        // (Le délai permet de voir l'animation, mais l'utilisateur veut que ça change)
        setTimeout(() => get().endTurn(), 1500);

        return { success: true, message: 'Carte jouée' };
    },
}));
