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

    // ID de la carte dont l'effet custom a été différé (deferCustomEffect) en attendant
    // le choix du joueur dans une des modales ci-dessus. Résolu via engine.resolveDeferredEffect().
    pendingEffectCardId: string | null;

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
    /**
     * `pending: true` signale que le résultat n'est PAS une carte jouée : une modale de choix
     * préalable (élément de faiblesse, action foudre...) vient de s'ouvrir et un second appel à
     * playCard() est attendu une fois le choix fait. L'appelant (GameBoard) ne doit alors PAS
     * effacer selectedCard/selectedTargetGods ni afficher l'aperçu "sort lancé" — sinon le
     * second appel n'a plus de carte/cibles à rejouer et le sort ne part jamais (bug corrigé :
     * "il faut lancer le sort deux fois").
     */
    playCard: (cardId: string, targetGodId?: string, targetGodIds?: string[], lightningAction?: 'apply' | 'remove') => { success: boolean; message: string; pending?: boolean };
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

// État "toutes les modales fermées". Une seule modale de choix doit jamais être active à la
// fois : chaque startXxx() ci-dessous applique ce patch AVANT d'ouvrir la sienne, pour garantir
// qu'ouvrir une nouvelle modale ferme systématiquement toute modale précédente encore active
// (plutôt que de laisser plusieurs isSelectingX à true en même temps, ce qui pouvait faire
// apparaître une modale "en arrière-plan" ou en file d'attente derrière une autre).
const ALL_MODALS_CLOSED = {
    isSelectingCards: false,
    cardSelectionSource: null as 'hand' | 'discard' | null,
    cardSelectionCount: 0,
    cardSelectionTitle: '',
    pendingCardSelectionEffect: null as string | null,

    isDistributingHeal: false,
    healDistributionTotal: 0,

    isSelectingEnemyCards: false,
    enemyCardSelectionCount: 0,
    enemyCardSelectionTitle: '',
    pendingEnemyCardEffect: null as string | null,

    isShowingOptionalChoice: false,
    optionalChoiceTitle: '',
    optionalChoiceDescription: '',
    pendingOptionalEffect: null as string | null,
    pendingOptionalTargetGodIds: [] as string[],

    isSelectingPlayer: false,
    playerSelectionTitle: '',
    pendingPlayerEffect: null as string | null,

    isSelectingDeadGod: false,
    deadGodSelectionTitle: '',
    pendingZombieEffect: null as string | null,

    isSelectingGod: false,
    godSelectionTitle: '',
    pendingGodEffect: null as string | null,
    godSelectionTargetType: null as 'ally' | 'enemy' | 'any' | null,

    isShowingZombieDamage: false,
    zombieDamageGodId: null as string | null,

    isSelectingElement: false,
    isSelectingLightningAction: false,

    // pendingEffectCardId n'est PAS remis à null ici : il est posé une fois par playCard() au
    // moment où la carte est jouée (avant l'ouverture de la modale de choix), et lu par le
    // confirm* correspondant. Le réinitialiser au moment d'ouvrir la modale casserait le lien.
    // Il est explicitement nettoyé par chaque confirm*/cancel* une fois le choix résolu.
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

    pendingEffectCardId: null,

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
            ...ALL_MODALS_CLOSED,
            isSelectingCards: true,
            cardSelectionSource: source,
            cardSelectionCount: count,
            cardSelectionTitle: title,
            pendingCardSelectionEffect: effectId,
        });
    },

    confirmCardSelection: (selectedCards) => {
        const { engine, pendingCardSelectionEffect, playerId, pendingEffectCardId } = get();
        if (!engine || !pendingCardSelectionEffect) return;

        const player = engine.getState().players.find(p => p.id === playerId);
        if (!player) return;

        // Exécuter l'effet avec les cartes sélectionnées
        if (pendingCardSelectionEffect === 'recycle_from_discard' || pendingCardSelectionEffect === 'put_cards_bottom') {
            // L'effet différé lors du play_card initial est résolu ici avec le vrai choix du
            // joueur (le handler centralisé dans GameEngine.ts fait le travail, pas de duplication).
            if (pendingEffectCardId) {
                engine.resolveDeferredEffect(pendingEffectCardId, {
                    selectedCardIds: selectedCards.map(c => c.id),
                });
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

                const hasCascadeHeal = copiedCard.effects.some(e => e.type === 'custom' && e.customEffectId === 'cascade_heal_choice');

                if (neededTargets > 0) {
                    // Lancer la sélection de cible
                    set({
                        isSelectingTarget: true,
                        requiredTargets: neededTargets,
                        selectedCard: mockCard,
                        // On utilise pendingEnemyCardEffect pour stocker le contexte (HACK mais efficace)
                        pendingEnemyCardEffect: `cast_copy:${originalCardId || ''}:${copiedCard.id}`
                    });
                } else if (hasCascadeHeal) {
                    // Marée Basse copiée n'a pas de cible directe mais a quand même besoin du
                    // choix de direction : sans ce cas, l'effet était auparavant exécuté sans
                    // jamais ouvrir la modale de choix (donc sans jamais soigner personne).
                    set({
                        ...ALL_MODALS_CLOSED,
                        isShowingOptionalChoice: true,
                        optionalChoiceTitle: "Direction du flux",
                        optionalChoiceDescription: "Gauche (Ouest) ou Droite (Est) ?",
                        pendingOptionalEffect: `copy_cascade_heal:${originalCardId || ''}:${copiedCard.id}`,
                        pendingOptionalTargetGodIds: [],
                    });
                } else {
                    // Pas de cible ni de choix nécessaire, exécuter directement
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
            pendingEffectCardId: null,
        });
    },

    cancelCardSelection: () => {
        set({
            isSelectingCards: false,
            cardSelectionSource: null,
            cardSelectionCount: 0,
            cardSelectionTitle: '',
            pendingCardSelectionEffect: null,
            pendingEffectCardId: null,
        });
    },

    getCardsForSelection: (): SpellCard[] => {
        const { engine, playerId, cardSelectionSource, pendingCardSelectionEffect } = get();
        if (!engine || !cardSelectionSource) return [];

        const player = engine.getState().players.find(p => p.id === playerId);
        if (!player) return [];

        if (cardSelectionSource === 'discard') {
            // On ne doit jamais pouvoir se sélectionner soi-même : ni recycler la carte qu'on
            // vient de jouer (recycle_from_discard), ni copier "Pouvoirs des Âmes" avec
            // elle-même (copy_discard_spell). La carte jouée est toujours la dernière de la
            // défausse du joueur (elle y est mise à la fin de playCard, juste avant l'ouverture
            // de cette modale de sélection).
            const excludesLastPlayed =
                pendingCardSelectionEffect === 'recycle_from_discard' ||
                pendingCardSelectionEffect?.startsWith('copy_discard_spell');
            if (excludesLastPlayed && player.discard.length > 0) {
                return player.discard.slice(0, player.discard.length - 1);
            }
            return player.discard;
        }

        return player.hand;
    },

    // Méthodes pour distribution de soins
    startHealDistribution: (totalHeal) => {
        set({
            ...ALL_MODALS_CLOSED,
            isDistributingHeal: true,
            healDistributionTotal: totalHeal,
        });
    },

    confirmHealDistribution: (distribution) => {
        const { engine, healDistributionTotal, pendingEffectCardId } = get();
        if (!engine) return;

        // Valider que le total distribué ne dépasse pas le total autorisé
        const totalDistributed = distribution.reduce((sum, d) => sum + d.amount, 0);
        if (totalDistributed > healDistributionTotal) {
            console.warn(`Heal distribution exceeds allowed total: ${totalDistributed} > ${healDistributionTotal}`);
            return; // Rejeter la distribution invalide
        }

        // Résout l'effet différé via le handler centralisé (distribute_heal_5 dans GameEngine.ts),
        // qui applique déjà les soins via healGod (retrait de poison cohérent avec le reste du jeu).
        if (pendingEffectCardId) {
            engine.resolveDeferredEffect(pendingEffectCardId, {
                healDistribution: distribution.filter(d => d.amount > 0),
            });
        }

        // Mettre à jour l'état et fermer le modal
        set({
            gameState: cloneGameState(engine.getState()),
            isDistributingHeal: false,
            healDistributionTotal: 0,
            pendingEffectCardId: null,
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
            pendingEffectCardId: null,
        });
    },

    // Méthodes pour sélection de cartes adverses (Nyx)
    startEnemyCardSelection: (count, title, effectId) => {
        set({
            ...ALL_MODALS_CLOSED,
            isSelectingEnemyCards: true,
            enemyCardSelectionCount: count,
            enemyCardSelectionTitle: title,
            pendingEnemyCardEffect: effectId,
        });
    },

    confirmEnemyCardSelection: (selectedCardIds) => {
        const { engine, playerId, pendingEnemyCardEffect, pendingEffectCardId } = get();
        if (!engine || !pendingEnemyCardEffect) return;

        const opponent = engine.getState().players.find(p => p.id !== playerId);
        if (!opponent) return;

        // Cas spécial : choose_discard_enemy (Vent d'Ouest) = simple défausse.
        // Effet différé, résolu via le handler centralisé (déjà prêt pour selectedCardIds).
        if (pendingEnemyCardEffect === 'choose_discard_enemy') {
            if (pendingEffectCardId) {
                engine.resolveDeferredEffect(pendingEffectCardId, { selectedCardIds });
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
            pendingEffectCardId: null,
        });
    },

    cancelEnemyCardSelection: () => {
        set({
            isSelectingEnemyCards: false,
            enemyCardSelectionCount: 0,
            enemyCardSelectionTitle: '',
            pendingEnemyCardEffect: null,
            pendingEffectCardId: null,
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
            // Vérifier si on a déjà fait le choix optionnel (stocké dans parts[3])
            const optionalChoiceMade = parts.length > 3 ? parts[3] === 'true' : undefined;

            // Récupérer les cibles depuis l'appel (qui viennent de selectedTargetGods)
            const finalTargetGodIds = targetGodIds || (selectedTargetGods.length > 0 ? selectedTargetGods.map(g => g.card.id) : undefined);
            const finalTargetGodId = targetGodId || (selectedTargetGods.length > 0 ? selectedTargetGods[0].card.id : undefined);

            // Récupérer le sort copié pour vérifier ses effets spéciaux
            const player = engine.getState().players.find(p => p.id === playerId);
            const copiedCard = player?.discard.find(c => c.id === copiedCardId);

            // Si le sort a un effet optionnel et qu'on n'a pas encore fait le choix, ouvrir le modal
            if (copiedCard && optionalChoiceMade === undefined) {
                const hasVisionTartare = copiedCard.effects.some(e => e.type === 'custom' && e.customEffectId === 'vision_tartare');
                const hasCascadeHeal = copiedCard.effects.some(e => e.type === 'custom' && e.customEffectId === 'cascade_heal_choice');

                if (hasVisionTartare && player && player.deck.length >= 2) {
                    // Vision du Tartare : proposer de défausser 2 cartes pour +1 dégât
                    // Stocker le contexte pour après le choix
                    set({
                        ...ALL_MODALS_CLOSED,
                        isShowingOptionalChoice: true,
                        optionalChoiceTitle: "Pouvoir des ténèbres",
                        optionalChoiceDescription: "Défausser 2 cartes du deck pour +1 dégât par cible ?",
                        pendingOptionalEffect: `copy_vision_tartare:${originalCardId}:${copiedCardId}`,
                        pendingOptionalTargetGodIds: finalTargetGodIds || [],
                        // Garder le contexte
                        selectedCard: null,
                        selectedTargetGod: null,
                        selectedTargetGods: [],
                        requiredTargets: 0,
                        isSelectingTarget: false,
                        pendingEnemyCardEffect: null
                    });
                    return { success: true, pending: true, message: "Choisissez l'option bonus" };
                }

                if (hasCascadeHeal) {
                    // Marée Basse : proposer le choix de direction
                    set({
                        ...ALL_MODALS_CLOSED,
                        isShowingOptionalChoice: true,
                        optionalChoiceTitle: "Direction du flux",
                        optionalChoiceDescription: "Gauche (Ouest) ou Droite (Est) ?",
                        pendingOptionalEffect: `copy_cascade_heal:${originalCardId}:${copiedCardId}`,
                        pendingOptionalTargetGodIds: [],
                        selectedCard: null,
                        selectedTargetGod: null,
                        selectedTargetGods: [],
                        requiredTargets: 0,
                        isSelectingTarget: false,
                        pendingEnemyCardEffect: null
                    });
                    return { success: true, pending: true, message: "Choisissez la direction" };
                }
            }

            // Exécuter le sort copié (avec le choix optionnel si applicable)
            const result = engine.executeAction({
                type: 'cast_copied_spell',
                playerId,
                originalCardId,
                copiedCardId,
                targetGodId: finalTargetGodId,
                targetGodIds: finalTargetGodIds,
                lightningAction: lightningAction || selectedLightningAction || undefined,
                selectedElement: selectedElement || undefined,
                optionalChoice: optionalChoiceMade,
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

        // CAS SPÉCIAL : Sorts de Zeus avec lightning_toggle — ouvrir le choix Appliquer/Retirer
        // avant de jouer la carte. Ce modal (LightningActionModal / isSelectingLightningAction)
        // était câblé côté UI (GameBoard.tsx) mais jamais déclenché : isSelectingLightningAction
        // n'était mis à true nulle part, donc ces sorts s'exécutaient toujours en mode "auto"
        // (appliquer si absent, retirer si présent) sans jamais laisser le joueur choisir.
        if (cardToCheck && get().needsLightningChoice(cardToCheck) && !lightningAction && !selectedLightningAction) {
            set({ ...ALL_MODALS_CLOSED, isSelectingLightningAction: true, selectedCard: cardToCheck });
            return { success: true, pending: true, message: "Choisissez l'action foudre" };
        }

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
            // Jouer la carte (payer le coût) ; l'effet custom est différé jusqu'au choix du dieu
            const playResult = engine.executeAction({
                type: 'play_card',
                playerId,
                cardId,
                deferCustomEffect: true,
            });

            if (playResult.success) {
                set({ gameState: cloneGameState(engine.getState()), pendingEffectCardId: cardId });
                // Ouvrir le modal de sélection de dieu (tous les dieux vivants)
                get().startGodSelection("Choisissez un dieu dont les cartes retourneront dans le deck", `shuffle_god_cards:${cardId}`, 'any');
            }

            return playResult;
        }

        // 4. CAS SPÉCIAL : Interception Hestia / Nyx / Déméter (Modals)
        if (cardToCheck) {
            const hasRecycle = cardToCheck.effects.some(e => e.type === 'custom' && e.customEffectId === 'recycle_from_discard');
            const hasPutBottom = cardToCheck.effects.some(e => e.type === 'custom' && e.customEffectId === 'put_cards_bottom');
            const hasHealDist = cardToCheck.effects.some(e => (e.type === 'custom' && e.customEffectId === 'distribute_heal_5'));
            const hasApplyWeakness = cardToCheck.effects.some(e => e.type === 'custom' && e.customEffectId === 'apply_weakness');

            if (hasRecycle || hasPutBottom || hasHealDist || hasApplyWeakness) {
                // Pour ces sorts, on doit d'abord vérifier si on a l'élément si c'est Artémis
                if (hasApplyWeakness && !selectedElement) {
                    set({ ...ALL_MODALS_CLOSED, isSelectingElement: true, selectedCard: cardToCheck });
                    return { success: true, pending: true, message: "Sélectionnez l'élément de faiblesse" };
                }

                // Jouer la carte d'abord (consomme énergie). Les effets custom qui ont besoin
                // du choix du joueur (recycle_from_discard, put_cards_bottom, distribute_heal_5)
                // sont différés : ils seront résolus par resolveDeferredEffect() dans le confirm*
                // correspondant, pour éviter qu'ils s'exécutent une première fois en mode "auto".
                const playResult = engine.executeAction({
                    type: 'play_card',
                    playerId,
                    cardId,
                    targetGodId,
                    targetGodIds,
                    selectedElement: selectedElement || undefined,
                    deferCustomEffect: hasRecycle || hasPutBottom || hasHealDist,
                });

                if (playResult.success) {
                    set({ gameState: cloneGameState(engine.getState()), pendingEffectCardId: cardId });

                    if (hasRecycle) {
                        get().startCardSelection('discard', 2, "Recycler dans le deck", 'recycle_from_discard');
                    } else if (hasPutBottom) {
                        get().startCardSelection('hand', 3, "Placer sous le deck", 'put_cards_bottom');
                    } else if (hasHealDist) {
                        get().startHealDistribution(5);
                    }
                }
                return playResult;
            }

            // Perséphone / Zéphyr / Séléné Modals
            // (copy_discard_spell n'est PAS dans ce groupe : il est intercepté plus haut, avant
            // ce bloc, et cible toujours la défausse du joueur qui l'a joué — voir plus haut.)
            const hasFreeRecycle = cardToCheck.effects.some(e => e.type === 'custom' && e.customEffectId === 'free_recycle');
            const hasTempResurrect = cardToCheck.effects.some(e => e.type === 'custom' && e.customEffectId === 'temp_resurrect');
            const hasVisionTartare = cardToCheck.effects.some(e => e.type === 'custom' && e.customEffectId === 'vision_tartare');
            const hasCascadeHeal = cardToCheck.effects.some(e => e.type === 'custom' && e.customEffectId === 'cascade_heal_choice');
            const hasRetrieveDiscard = cardToCheck.effects.some(e => e.type === 'custom' && e.customEffectId === 'retrieve_discard');

            if (hasFreeRecycle || hasTempResurrect || hasVisionTartare || hasCascadeHeal || hasRetrieveDiscard) {
                // Pour ces sorts, on doit d'abord vérifier si on a besoin de cibles avant d'ouvrir le modal
                const neededTargets = get().getRequiredTargetCount(cardToCheck);
                if (neededTargets > 0 && selectedTargetGods.length < neededTargets) {
                    set({ isSelectingTarget: true, selectedCard: cardToCheck });
                    return { success: true, message: "Sélectionnez les cibles" };
                }

                // Jouer la carte. free_recycle, temp_resurrect, vision_tartare et cascade_heal_choice
                // ont besoin du choix du joueur : ils sont différés jusqu'au confirm* correspondant.
                const playResult = engine.executeAction({
                    type: 'play_card',
                    playerId,
                    cardId,
                    targetGodId,
                    targetGodIds,
                    deferCustomEffect: hasFreeRecycle || hasTempResurrect || hasVisionTartare || hasCascadeHeal,
                });

                if (playResult.success) {
                    set({ gameState: cloneGameState(engine.getState()), pendingEffectCardId: cardId });

                    if (hasFreeRecycle) {
                        get().startPlayerSelection("Mélanger défausse et deck sans fatigue", "free_recycle");
                    } else if (hasTempResurrect) {
                        get().startDeadGodSelection("Invoquer un dieu allié mort en zombie (5 PV)", "temp_resurrect");
                    } else if (hasVisionTartare) {
                        get().startOptionalChoice("Pouvoir des ténèbres", "Défausser 2 cartes du deck pour +1 dégât par cible ?", "vision_tartare", targetGodIds || (targetGodId ? [targetGodId] : []));
                    } else if (hasCascadeHeal) {
                        get().startOptionalChoice("Direction du flux", "Gauche (3,2,1) ou Droite (3,2,1) ?", "cascade_heal_choice", []);
                    } else if (hasRetrieveDiscard) {
                        get().startCardSelection('discard', 1, "Récupérer une carte", 'retrieve_discard');
                    }
                }
                return playResult;
            }

            const hasEnemyCardSelect = cardToCheck.effects.some(e => e.type === 'custom' && (e.customEffectId === 'choose_discard_enemy' || e.customEffectId === 'choose_hand_to_deck'));
            if (hasEnemyCardSelect) {
                const effectId = cardToCheck.effects.find(e => e.type === 'custom' && (e.customEffectId === 'choose_discard_enemy' || e.customEffectId === 'choose_hand_to_deck'))?.customEffectId || '';
                const playResult = engine.executeAction({
                    type: 'play_card', playerId, cardId, targetGodId, targetGodIds,
                    deferCustomEffect: effectId === 'choose_discard_enemy',
                });
                if (playResult.success) {
                    set({ gameState: cloneGameState(engine.getState()), pendingEffectCardId: cardId });
                    const count = cardToCheck.effects.find(e => e.customEffectId === effectId)?.value || 1;
                    get().startEnemyCardSelection(count, "Choisissez une carte adverse", effectId);
                }
                return playResult;
            }
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
                    }, 1500);
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
            ...ALL_MODALS_CLOSED,
            isShowingOptionalChoice: true,
            optionalChoiceTitle: title,
            optionalChoiceDescription: description,
            pendingOptionalEffect: effectId,
            pendingOptionalTargetGodIds: targetGodIds,
        });
    },

    confirmOptionalChoice: (accepted) => {
        const { engine, playerId, pendingOptionalEffect, pendingOptionalTargetGodIds, pendingEffectCardId } = get();
        if (!engine || !pendingOptionalEffect) return;

        if (pendingOptionalEffect === 'vision_tartare' || pendingOptionalEffect === 'cascade_heal_choice') {
            // Effet différé lors du play_card initial : résolu ici avec le vrai choix du joueur,
            // via le handler centralisé dans GameEngine.ts (plus de recalcul manuel de
            // dégâts/bouclier/soin/poison dans le store, qui causait le bug de double-exécution).
            // Les cibles (pour vision_tartare) doivent être retransmises : resolveDeferredEffect
            // recalcule les cibles depuis zéro, il ne réutilise pas celles du play_card initial.
            if (pendingEffectCardId) {
                engine.resolveDeferredEffect(pendingEffectCardId, {
                    optionalChoice: accepted,
                    targetGodIds: pendingOptionalTargetGodIds.length > 0 ? pendingOptionalTargetGodIds : undefined,
                });
            }
        } else if (pendingOptionalEffect.startsWith('copy_vision_tartare:') || pendingOptionalEffect.startsWith('copy_cascade_heal:')) {
            // Sort copié : le choix est connu AVANT l'exécution (aucun play_card préalable ici),
            // donc un unique appel à cast_copied_spell suffit, pas de déferrement nécessaire.
            const parts = pendingOptionalEffect.split(':');
            const originalCardId = parts[1] || undefined;
            const copiedCardId = parts[2];

            engine.executeAction({
                type: 'cast_copied_spell',
                playerId,
                originalCardId,
                copiedCardId,
                targetGodId: pendingOptionalTargetGodIds[0],
                targetGodIds: pendingOptionalTargetGodIds.length > 0 ? pendingOptionalTargetGodIds : undefined,
                optionalChoice: accepted,
            });
        }

        // Fermer le modal et mettre à jour l'état
        set({
            gameState: cloneGameState(engine.getState()),
            isShowingOptionalChoice: false,
            optionalChoiceTitle: '',
            optionalChoiceDescription: '',
            pendingOptionalEffect: null,
            pendingOptionalTargetGodIds: [],
            pendingEffectCardId: null,
        });
    },

    cancelOptionalChoice: () => {
        set({
            isShowingOptionalChoice: false,
            optionalChoiceTitle: '',
            optionalChoiceDescription: '',
            pendingOptionalEffect: null,
            pendingOptionalTargetGodIds: [],
            pendingEffectCardId: null,
        });
    },

    // === ACTIONS POUR CHOIX DE JOUEUR (free_recycle) ===
    startPlayerSelection: (title, effectId) => {
        set({
            ...ALL_MODALS_CLOSED,
            isSelectingPlayer: true,
            playerSelectionTitle: title,
            pendingPlayerEffect: effectId,
        });
    },

    confirmPlayerSelection: (targetSelf) => {
        const { engine, pendingPlayerEffect, pendingEffectCardId } = get();
        if (!engine || !pendingPlayerEffect) return;

        if (pendingPlayerEffect === 'free_recycle' && pendingEffectCardId) {
            // Effet différé résolu ici avec le vrai choix du joueur (le handler centralisé
            // dans GameEngine.ts fait le mélange, pas de deuxième copie de l'algorithme ici).
            engine.resolveDeferredEffect(pendingEffectCardId, {
                selectedPlayerTarget: targetSelf ? 'self' : 'opponent',
            });
        }

        // Fermer le modal et mettre à jour l'état
        set({
            gameState: cloneGameState(engine.getState()),
            isSelectingPlayer: false,
            playerSelectionTitle: '',
            pendingPlayerEffect: null,
            pendingEffectCardId: null,
        });
    },

    cancelPlayerSelection: () => {
        set({
            isSelectingPlayer: false,
            playerSelectionTitle: '',
            pendingPlayerEffect: null,
            pendingEffectCardId: null,
        });
    },

    // === ACTIONS POUR ZOMBIE RESURRECTION (Perséphone - temp_resurrect) ===
    startDeadGodSelection: (title, effectId) => {
        set({
            ...ALL_MODALS_CLOSED,
            isSelectingDeadGod: true,
            deadGodSelectionTitle: title,
            pendingZombieEffect: effectId,
        });
    },

    confirmDeadGodSelection: (godId) => {
        const { engine, pendingZombieEffect, pendingEffectCardId } = get();
        if (!engine || !pendingZombieEffect) return;

        if (pendingZombieEffect === 'temp_resurrect' && pendingEffectCardId) {
            // Effet différé résolu ici avec le dieu choisi par le joueur (le handler centralisé
            // temp_resurrect dans GameEngine.ts respecte désormais targetGodId).
            engine.resolveDeferredEffect(pendingEffectCardId, { targetGodId: godId });
        }

        // Fermer le modal et mettre à jour l'état
        set({
            gameState: cloneGameState(engine.getState()),
            isSelectingDeadGod: false,
            deadGodSelectionTitle: '',
            pendingZombieEffect: null,
            pendingEffectCardId: null,
        });
    },

    cancelDeadGodSelection: () => {
        set({
            isSelectingDeadGod: false,
            deadGodSelectionTitle: '',
            pendingZombieEffect: null,
            pendingEffectCardId: null,
        });
    },

    // === ACTIONS POUR ZOMBIE DAMAGE DE FIN DE TOUR ===
    startZombieDamage: (godId) => {
        set({
            ...ALL_MODALS_CLOSED,
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
            ...ALL_MODALS_CLOSED,
            isSelectingGod: true,
            godSelectionTitle: title,
            pendingGodEffect: effectId,
            godSelectionTargetType: targetType,
        });
    },

    confirmGodSelection: (godId) => {
        const { engine, pendingGodEffect, pendingEffectCardId } = get();
        if (!engine || !pendingGodEffect) return;

        // Gérer l'effet shuffle_god_cards : effet différé résolu via le handler centralisé
        // dans GameEngine.ts (plus de deuxième copie du Fisher-Yates ici).
        if (pendingGodEffect.startsWith('shuffle_god_cards') && pendingEffectCardId) {
            engine.resolveDeferredEffect(pendingEffectCardId, { targetGodId: godId });
        }

        // Fermer le modal et mettre à jour l'état
        set({
            gameState: cloneGameState(engine.getState()),
            isSelectingGod: false,
            godSelectionTitle: '',
            pendingGodEffect: null,
            godSelectionTargetType: null,
            pendingEffectCardId: null,
        });
    },

    cancelGodSelection: () => {
        set({
            isSelectingGod: false,
            godSelectionTitle: '',
            pendingGodEffect: null,
            godSelectionTargetType: null,
            pendingEffectCardId: null,
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
                                // Utiliser killGod pour gérer proprement la mort
                                engine.killGod(opponent.id, target.card.id);
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
