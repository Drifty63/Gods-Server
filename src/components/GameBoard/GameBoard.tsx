'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Element } from '@/types/cards';
import { ELEMENT_SYMBOLS } from '@/game-engine/ElementSystem';
import GodCard from '@/components/GodCard/GodCard';
import SpellCard from '@/components/SpellCard/SpellCard';
import CardSelectionModal from '@/components/CardSelectionModal/CardSelectionModal';
import HealDistributionModal from '@/components/HealDistributionModal/HealDistributionModal';
import CardDetailModal from '@/components/CardDetailModal/CardDetailModal';
import styles from './GameBoard.module.css';

// Liste des éléments disponibles pour la sélection
const ALL_ELEMENTS: Element[] = ['fire', 'water', 'earth', 'air', 'lightning', 'light', 'darkness'];

interface GameBoardProps {
    onAction?: (action: {
        type: 'play_card' | 'discard' | 'end_turn';
        payload: Record<string, unknown>;
    }) => void;
}

export default function GameBoard({ onAction }: GameBoardProps = {}) {
    const {
        gameState,
        playerId,
        isSoloMode,
        selectedCard,
        selectedTargetGods,
        isSelectingTarget,
        selectCard,
        startTargetSelection,
        addTargetGod,
        setLightningAction,
        setSelectedElement,
        isSelectingElement,
        selectedElement,
        playCard,
        discardForEnergy,
        endTurn,
        canPlayCard,
        isMyTurn,
        getRequiredTargetCount,
        getValidEnemyTargets,
        getRequiredEnemyTargets,
        needsElementChoice,
        // Sélection de cartes
        isSelectingCards,
        cardSelectionCount,
        cardSelectionTitle,
        pendingCardSelectionEffect,
        startCardSelection,
        confirmCardSelection,
        cancelCardSelection,
        getCardsForSelection,
        // Distribution de soins
        isDistributingHeal,
        healDistributionTotal,
        startHealDistribution,
        confirmHealDistribution,
        cancelHealDistribution,
        // Sélection de cartes adverses (Nyx)
        isSelectingEnemyCards,
        enemyCardSelectionCount,
        enemyCardSelectionTitle,
        startEnemyCardSelection,
        confirmEnemyCardSelection,
        cancelEnemyCardSelection,
        // Cartes cachées (Nyx)
        revealBlindCard,
        discardBlindCard,
    } = useGameStore();

    // Helper local pour la détection fiable du choix de foudre
    const needsLightningChoice = (card: import('@/types/cards').SpellCard): boolean => {
        return card.effects.some(e =>
            e.type === 'custom' &&
            e.customEffectId &&
            e.customEffectId.startsWith('lightning_toggle')
        );
    };

    // Helper local pour la détection du choix d'élément (Artémis Coup Critique)
    const needsElementChoiceLocal = (card: import('@/types/cards').SpellCard): boolean => {
        return card.effects.some(e =>
            e.type === 'custom' &&
            e.customEffectId === 'apply_weakness'
        );
    };

    // Helper pour détecter si une carte nécessite une sélection de cartes
    const getCardSelectionRequired = (card: import('@/types/cards').SpellCard): {
        needed: boolean;
        source: 'hand' | 'discard';
        count: number;
        title: string;
        effectId: string;
    } | null => {
        for (const effect of card.effects) {
            if (effect.type === 'custom') {
                if (effect.customEffectId === 'recycle_from_discard') {
                    return {
                        needed: true,
                        source: 'discard',
                        count: 2,
                        title: '🔄 Choisissez 2 cartes à remettre dans votre deck',
                        effectId: 'recycle_from_discard'
                    };
                }
                if (effect.customEffectId === 'put_cards_bottom') {
                    return {
                        needed: true,
                        source: 'hand',
                        count: 3,
                        title: '📚 Choisissez 3 cartes à placer en dessous de votre deck',
                        effectId: 'put_cards_bottom'
                    };
                }
            }
        }
        return null;
    };

    // Helper pour détecter si une carte nécessite une distribution de soins
    const getHealDistributionRequired = (card: import('@/types/cards').SpellCard): {
        needed: boolean;
        totalHeal: number;
    } | null => {
        for (const effect of card.effects) {
            if (effect.type === 'custom' && effect.customEffectId?.startsWith('distribute_heal_')) {
                const healAmount = parseInt(effect.customEffectId.split('_')[2]) || 5;
                return {
                    needed: true,
                    totalHeal: healAmount
                };
            }
        }
        return null;
    };

    // Helper pour détecter si une carte nécessite une sélection de cartes adverses (Nyx)
    const getEnemyCardSelectionRequired = (card: import('@/types/cards').SpellCard): {
        needed: boolean;
        count: number;
        title: string;
        effectId: string;
    } | null => {
        for (const effect of card.effects) {
            if (effect.type === 'custom') {
                if (effect.customEffectId === 'shuffle_hand_draw_blind') {
                    return {
                        needed: true,
                        count: 1,
                        title: '👁️ Choisissez 1 carte de l\'adversaire à mélanger',
                        effectId: 'shuffle_hand_draw_blind'
                    };
                }
                if (effect.customEffectId === 'shuffle_hand_draw_blind_2') {
                    return {
                        needed: true,
                        count: 2,
                        title: '👁️ Choisissez 2 cartes de l\'adversaire à mélanger',
                        effectId: 'shuffle_hand_draw_blind_2'
                    };
                }
            }
        }
        return null;
    };

    const [viewDiscard, setViewDiscard] = useState<'player' | 'opponent' | null>(null);
    const [pendingCardForSelection, setPendingCardForSelection] = useState<import('@/types/cards').SpellCard | null>(null);
    const [pendingCardForHealDistribution, setPendingCardForHealDistribution] = useState<import('@/types/cards').SpellCard | null>(null);
    const [pendingCardForEnemySelection, setPendingCardForEnemySelection] = useState<import('@/types/cards').SpellCard | null>(null);
    // Indique si l'utilisateur a cliqué sur "Jouer" (pour contrôler quand afficher le choix foudre)
    const [wantsToPlay, setWantsToPlay] = useState(false);
    // Modal de détail de carte
    const [showCardDetail, setShowCardDetail] = useState(false);
    const [isForcedDetail, setIsForcedDetail] = useState(false);

    // Chronomètre de tour (60 secondes par tour)
    const TURN_TIME_LIMIT = 60;
    const [turnTimer, setTurnTimer] = useState(TURN_TIME_LIMIT);
    const turnTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Effet pour ouvrir le modal de sélection après avoir joué une carte qui le nécessite
    useEffect(() => {
        if (pendingCardForSelection) {
            const selection = getCardSelectionRequired(pendingCardForSelection);
            if (selection) {
                startCardSelection(selection.source, selection.count, selection.title, selection.effectId);
            }
            setPendingCardForSelection(null);
        }
    }, [pendingCardForSelection, startCardSelection]);

    // Effet pour ouvrir le modal de distribution de soins après avoir joué une carte qui le nécessite
    useEffect(() => {
        if (pendingCardForHealDistribution) {
            const healDist = getHealDistributionRequired(pendingCardForHealDistribution);
            if (healDist) {
                startHealDistribution(healDist.totalHeal);
            }
            setPendingCardForHealDistribution(null);
        }
    }, [pendingCardForHealDistribution, startHealDistribution]);

    // Effet pour ouvrir le modal de sélection de cartes adverses (Nyx)
    useEffect(() => {
        if (pendingCardForEnemySelection) {
            const enemySel = getEnemyCardSelectionRequired(pendingCardForEnemySelection);
            if (enemySel) {
                startEnemyCardSelection(enemySel.count, enemySel.title, enemySel.effectId);
            }
            setPendingCardForEnemySelection(null);
        }
    }, [pendingCardForEnemySelection, startEnemyCardSelection]);

    if (!gameState) {
        return <div className={styles.loading}>Chargement...</div>;
    }

    const player = gameState.players.find(p => p.id === playerId)!;
    const opponent = gameState.players.find(p => p.id !== playerId)!;
    const isPlayerTurn = isMyTurn();

    // Compter les cibles disponibles pour les effets de type enemy_god
    const availableEnemyTargets = opponent.gods.filter(g => !g.isDead).length;
    const availableAllyTargets = player.gods.filter(g => !g.isDead).length;

    // Le nombre requis de cibles pour la carte sélectionnée
    const requiredTargets = selectedCard ? getRequiredTargetCount(selectedCard) : 0;

    // Détermine si c'est un sort multi-cible
    const isMultiTarget = requiredTargets > 1;

    // Obtenir les cibles obligatoires (provocateurs) qui doivent être inclus
    const requiredEnemyTargets = getRequiredEnemyTargets();

    // Le nombre max de cibles est le minimum entre le nombre requis et les cibles disponibles
    const maxPossibleTargets = Math.min(requiredTargets, availableEnemyTargets + availableAllyTargets);

    // Vérifier si les provocateurs obligatoires sont inclus dans la sélection
    const allRequiredTargetsIncluded = requiredEnemyTargets.every(
        req => selectedTargetGods.some(sel => sel.card.id === req.card.id)
    );

    // Vérifier si on peut confirmer (au moins 1 cible sélectionnée ET tous les provocateurs inclus)
    const canConfirm = selectedTargetGods.length > 0 && allRequiredTargetsIncluded;
    // Pour l'affichage : montrer si toutes les cibles possibles sont sélectionnées
    const allTargetsSelected = selectedTargetGods.length >= maxPossibleTargets && requiredTargets > 0;

    // Fonction pour finir le tour en multijoueur
    const autoEndTurnMultiplayer = () => {
        if (!isSoloMode) {
            setTimeout(() => {
                endTurn();
                onAction?.({ type: 'end_turn', payload: {} });
            }, 500);
        }
    };

    // Wrapper pour playCard qui gère aussi la sélection de cartes et la distribution de soins
    const handlePlayCard = (cardId: string, targetGodId?: string, targetGodIds?: string[], lightningAction?: 'apply' | 'remove') => {
        const card = player.hand.find(c => c.id === cardId);
        // Récupérer l'élément sélectionné pour l'inclure dans les payloads
        const currentSelectedElement = selectedElement;

        if (card) {
            // Vérifier si la carte nécessite une sélection de cartes
            const selection = getCardSelectionRequired(card);
            if (selection) {
                // Jouer la carte d'abord, puis ouvrir le modal
                playCard(cardId, targetGodId, targetGodIds, lightningAction);
                onAction?.({ type: 'play_card', payload: { cardId, targetGodId, targetGodIds, lightningAction, selectedElement: currentSelectedElement } });
                setPendingCardForSelection(card);
                // La fin de tour sera appelée après la confirmation du modal
                return;
            }

            // Vérifier si la carte nécessite une distribution de soins
            const healDist = getHealDistributionRequired(card);
            if (healDist) {
                // Jouer la carte d'abord, puis ouvrir le modal
                playCard(cardId, targetGodId, targetGodIds, lightningAction);
                onAction?.({ type: 'play_card', payload: { cardId, targetGodId, targetGodIds, lightningAction, selectedElement: currentSelectedElement } });
                setPendingCardForHealDistribution(card);
                // La fin de tour sera appelée après la confirmation du modal
                return;
            }

            // Vérifier si la carte nécessite une sélection de cartes adverses (Nyx)
            const enemySel = getEnemyCardSelectionRequired(card);
            if (enemySel) {
                // Jouer la carte d'abord (applique les dégâts), puis ouvrir le modal
                playCard(cardId, targetGodId, targetGodIds, lightningAction);
                onAction?.({ type: 'play_card', payload: { cardId, targetGodId, targetGodIds, lightningAction, selectedElement: currentSelectedElement } });
                setPendingCardForEnemySelection(card);
                // La fin de tour sera appelée après la confirmation du modal
                return;
            }
        }

        playCard(cardId, targetGodId, targetGodIds, lightningAction);
        onAction?.({ type: 'play_card', payload: { cardId, targetGodId, targetGodIds, lightningAction, selectedElement: currentSelectedElement } });

        // Finir le tour automatiquement après avoir joué une carte
        autoEndTurnMultiplayer();
    };

    // Wrappers pour les confirmations de modals qui finissent le tour en multijoueur
    const handleConfirmCardSelection = (cards: typeof player.hand) => {
        confirmCardSelection(cards);
        autoEndTurnMultiplayer();
    };

    const handleConfirmHealDistribution = (distribution: { godId: string; amount: number }[]) => {
        confirmHealDistribution(distribution);
        autoEndTurnMultiplayer();
    };

    const handleConfirmEnemyCardSelection = (cardIds: string[]) => {
        confirmEnemyCardSelection(cardIds);
        autoEndTurnMultiplayer();
    };

    const handleCardClick = (card: typeof selectedCard) => {
        if (!isPlayerTurn || !card) return;

        // Sélectionner la carte et ouvrir le modal de détails
        selectCard(card);
        setShowCardDetail(true);
        setWantsToPlay(false);
    };

    // Fermer le modal de détails
    const handleCloseCardDetail = () => {
        setShowCardDetail(false);
        selectCard(null); // Déselectionner la carte
    };

    // Jouer depuis le modal de détails
    const handlePlayFromDetail = () => {
        setShowCardDetail(false);
        setIsForcedDetail(false);
        handlePlaySelectedCard();
    };

    // Défausser depuis le modal de détails  
    const handleDiscardFromDetail = () => {
        if (selectedCard) {
            setShowCardDetail(false);
            setIsForcedDetail(false);
            handleDiscard(selectedCard.id);
        }
    };

    // Fonction pour jouer la carte sélectionnée depuis le bouton d'action
    const handlePlaySelectedCard = () => {
        if (!selectedCard || !isPlayerTurn || !canPlayCard(selectedCard)) return;

        const reqTargets = getRequiredTargetCount(selectedCard);
        const needsLightning = needsLightningChoice(selectedCard);

        // Marquer qu'on veut jouer la carte
        setWantsToPlay(true);

        // Si pas besoin de cible
        if (reqTargets === 0) {
            if (!needsLightning) {
                // Pas de cible, pas de foudre → jouer directement
                handlePlayCard(selectedCard.id);
                setWantsToPlay(false);
            }
            // Si foudre mais pas de cible → le choix foudre s'affichera via wantsToPlay
        } else {
            // Besoin de cibles → activer le mode ciblage
            startTargetSelection();
        }
    };

    // Fonction pour défausser la carte sélectionnée depuis le bouton d'action
    const handleDiscardSelectedCard = () => {
        if (!selectedCard || !isPlayerTurn) return;
        handleDiscard(selectedCard.id);
        selectCard(null);
        setWantsToPlay(false);
    };

    // Crée un ID unique pour distinguer les dieux des deux joueurs
    const getUniqueGodId = (godId: string, isEnemy: boolean) => {
        return isEnemy ? `opponent_${godId}` : `player_${godId}`;
    };

    // Extraire l'ID original et le propriétaire d'un ID unique
    const parseUniqueGodId = (uniqueId: string): { godId: string; isEnemy: boolean } => {
        if (uniqueId.startsWith('opponent_')) {
            return { godId: uniqueId.replace('opponent_', ''), isEnemy: true };
        }
        return { godId: uniqueId.replace('player_', ''), isEnemy: false };
    };

    const handleTargetSelect = (uniqueGodId: string) => {
        if (!selectedCard || !isSelectingTarget) return;

        const { godId, isEnemy } = parseUniqueGodId(uniqueGodId);
        const godsList = isEnemy ? opponent.gods : player.gods;
        const targetGod = godsList.find(g => g.card.id === godId);
        if (!targetGod) return;

        // Ajouter cette cible à la liste
        addTargetGod(targetGod);
    };

    const handleConfirmPlay = () => {
        // On peut confirmer dès qu'on a au moins 1 cible
        if (selectedCard && selectedTargetGods.length > 0) {
            handlePlayCard(selectedCard.id);
        }
    };

    // Jouer automatiquement quand on a sélectionné toutes les cibles nécessaires
    // SAUF si la carte nécessite un choix de foudre ou un choix d'élément
    const handleSingleTargetSelect = (uniqueGodId: string) => {
        if (!selectedCard || !isSelectingTarget) return;

        // Parser l'ID unique pour obtenir le vrai godId
        const { godId } = parseUniqueGodId(uniqueGodId);

        if (requiredTargets === 1 && !needsLightningChoice(selectedCard) && !needsElementChoiceLocal(selectedCard)) {
            // Comportement classique : jouer immédiatement (cartes sans choix foudre ni élément)
            handlePlayCard(selectedCard.id, godId);
        } else {
            // Ciblage multiple OU carte avec choix foudre/élément : ajouter la cible et attendre
            handleTargetSelect(uniqueGodId);
        }
    };

    const handleDiscard = (cardId: string) => {
        if (isPlayerTurn) {
            discardForEnergy(cardId);
            onAction?.({ type: 'discard', payload: { cardId } });
        }
    };

    // État pour le menu de choix d'une carte cachée
    const [selectedBlindCard, setSelectedBlindCard] = useState<typeof selectedCard>(null);

    // Cliquer sur une carte cachée → affiche le menu de choix
    const handleBlindCardClick = (card: typeof selectedCard) => {
        // Permettre le clic même après défausse (pour défausser une carte cachée)
        if (!card || !isPlayerTurn) return;
        setSelectedBlindCard(card);
    };

    // Choisir "Jouer" depuis le menu de carte cachée
    const handleBlindPlay = () => {
        if (!selectedBlindCard) return;

        // 1. RÉVÉLER la carte via le store (persiste le changement)
        const revealedCard = revealBlindCard(selectedBlindCard.id);
        setSelectedBlindCard(null);
        if (!revealedCard) return;

        // 2. Vérifier si le joueur a assez d'énergie
        if (player.energy < revealedCard.energyCost) {
            // Pas assez d'énergie → défausser simplement la carte (sans pénalité)
            discardBlindCard(revealedCard.id, false);
            alert(`⚠️ "${revealedCard.name}" révélée mais pas assez d'énergie (${revealedCard.energyCost}⚡ requis). Carte défaussée.`);

            // Terminer le tour
            endTurn();
            onAction?.({ type: 'end_turn', payload: {} });
            return;
        }

        // 3. Vérifier si la carte peut être jouée (cible disponible)
        if (canPlayCard(revealedCard)) {
            // La carte peut être jouée, procéder normalement (ouvrir le modal de détails)
            setIsForcedDetail(true); // Empêcher l'annulation du modal de détails
            handleCardClick(revealedCard);
        } else {
            // La carte ne peut PAS être jouée (pas de cible valide)
            // Le joueur perd l'énergie de la carte et elle va à la défausse
            discardBlindCard(revealedCard.id, true);
            alert(`⚠️ "${revealedCard.name}" ne peut pas être jouée (pas de cible valide). Vous perdez ${revealedCard.energyCost} énergie.`);

            // Terminer le tour
            endTurn();
            onAction?.({ type: 'end_turn', payload: {} });
        }
    };

    // Choisir "Défausser" depuis le menu de carte cachée
    const handleBlindDiscardFromMenu = () => {
        if (!selectedBlindCard) return;

        if (hasDiscardedBlindThisTurn) {
            alert("⚠️ Vous ne pouvez défausser qu'une seule carte cachée par tour !");
            setSelectedBlindCard(null);
            return;
        }

        // Défausser la carte pour de l'énergie (sans la révéler)
        discardForEnergy(selectedBlindCard.id);
        onAction?.({ type: 'discard', payload: { cardId: selectedBlindCard.id } });
        setHasDiscardedBlindThisTurn(true);
        setSelectedBlindCard(null);
    };

    // Annuler le menu de carte cachée
    const handleBlindCancel = () => {
        setSelectedBlindCard(null);
    };

    // Défausser une carte cachée pour de l'énergie
    // Règle : on ne peut défausser qu'UNE SEULE carte cachée à la fois
    const [hasDiscardedBlindThisTurn, setHasDiscardedBlindThisTurn] = useState(false);

    // Reset le flag au début de chaque tour
    useEffect(() => {
        if (isPlayerTurn) {
            setHasDiscardedBlindThisTurn(false);
        }
    }, [isPlayerTurn, gameState?.turnNumber]);

    // Chronomètre de tour - Reset et démarrage à chaque changement de tour
    // Utiliser des refs pour éviter les problèmes de dépendances
    const endTurnRef = useRef(endTurn);
    const onActionRef = useRef(onAction);

    // Mettre à jour les refs quand les fonctions changent
    useEffect(() => {
        endTurnRef.current = endTurn;
        onActionRef.current = onAction;
    }, [endTurn, onAction]);

    useEffect(() => {
        // Nettoyer le timer précédent
        if (turnTimerRef.current) {
            clearInterval(turnTimerRef.current);
            turnTimerRef.current = null;
        }

        // Reset le timer à 60 secondes au début de chaque tour
        setTurnTimer(TURN_TIME_LIMIT);

        // Ne pas démarrer le timer si le jeu n'est pas en cours ou si ce n'est pas notre tour
        if (!isPlayerTurn || gameState?.status !== 'playing') {
            return;
        }

        // Petit délai pour laisser le jeu se synchroniser au démarrage
        const startDelay = setTimeout(() => {
            // Démarrer le compte à rebours
            turnTimerRef.current = setInterval(() => {
                setTurnTimer(prev => {
                    if (prev <= 1) {
                        // Temps écoulé - fin de tour automatique
                        if (turnTimerRef.current) {
                            clearInterval(turnTimerRef.current);
                            turnTimerRef.current = null;
                        }
                        // Forcer la fin du tour via les refs
                        endTurnRef.current();
                        onActionRef.current?.({ type: 'end_turn', payload: {} });
                        return TURN_TIME_LIMIT;
                    }
                    return prev - 1;
                });
            }, 1000);
        }, 500); // Délai de 500ms au démarrage

        return () => {
            clearTimeout(startDelay);
            if (turnTimerRef.current) {
                clearInterval(turnTimerRef.current);
                turnTimerRef.current = null;
            }
        };
    }, [isPlayerTurn, gameState?.turnNumber, gameState?.status]);

    const handleBlindDiscard = (cardId: string) => {
        if (!isPlayerTurn) return;

        if (hasDiscardedBlindThisTurn) {
            // On a déjà défaussé une carte cachée ce tour
            alert("⚠️ Vous ne pouvez défausser qu'une seule carte cachée par tour !");
            return;
        }

        // Défausser la carte pour de l'énergie
        discardForEnergy(cardId);
        onAction?.({ type: 'discard', payload: { cardId } });
        setHasDiscardedBlindThisTurn(true);
    };

    // Vérifier si une cible est déjà sélectionnée (avec ID unique)
    const isTargetSelected = (uniqueGodId: string) => {
        const { godId, isEnemy } = parseUniqueGodId(uniqueGodId);
        // Vérifier en comparant l'ID ET le contexte (ennemi ou allié)
        return selectedTargetGods.some(g => {
            const isEnemyGod = opponent.gods.some(og => og.card.id === g.card.id);
            return g.card.id === godId && isEnemyGod === isEnemy;
        });
    };

    return (
        <div className={styles.board}>
            {/* Modal de Défausse */}
            {viewDiscard && (
                <div className={styles.modalOverlay} onClick={() => setViewDiscard(null)}>
                    <div className={styles.discardModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Défausse de {viewDiscard === 'player' ? player.name : opponent.name} ({viewDiscard === 'player' ? player.discard.length : opponent.discard.length} cartes)</h3>
                            <button className={styles.closeModalButton} onClick={() => setViewDiscard(null)}>✖</button>
                        </div>
                        <div className={styles.discardGrid}>
                            {(viewDiscard === 'player' ? player.discard : opponent.discard).map((card, index) => (
                                <div key={index} className={styles.discardCardWrapper}>
                                    <SpellCard card={card} isSelected={false} />
                                </div>
                            ))}
                            {(viewDiscard === 'player' ? player.discard : opponent.discard).length === 0 && (
                                <p className={styles.emptyMessage}>Aucune carte dans la défausse</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Menu de choix pour carte cachée */}
            {selectedBlindCard && (
                <div className={styles.modalOverlay} onClick={handleBlindCancel}>
                    <div className={styles.blindCardMenu} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.blindMenuTitle}>❓ Carte Cachée</h3>
                        <p className={styles.blindMenuSubtitle}>Que voulez-vous faire ?</p>
                        <div className={styles.blindMenuButtons}>
                            <button
                                className={styles.blindPlayButton}
                                onClick={handleBlindPlay}
                                disabled={player.hasDiscardedForEnergy}
                            >
                                🎲 Jouer à l&apos;aveugle
                                {player.hasDiscardedForEnergy && <span className={styles.disabledNote}> (déjà utilisé)</span>}
                            </button>
                            <button
                                className={styles.blindDiscardButton}
                                onClick={handleBlindDiscardFromMenu}
                                disabled={hasDiscardedBlindThisTurn}
                            >
                                🗑️ Défausser (+1⚡)
                                {hasDiscardedBlindThisTurn && <span className={styles.disabledNote}> (déjà fait)</span>}
                            </button>
                            <button
                                className={styles.blindCancelButton}
                                onClick={handleBlindCancel}
                            >
                                ❌ Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Zone adversaire */}
            <div className={styles.opponentZone}>
                {/* Main de l'adversaire EN HAUT (dos de cartes ou face visible si effet Nyx) */}
                <div className={styles.opponentHand}>
                    {opponent.hand.map((card, index) => {
                        // On peut voir la carte si elle a été révélée à notre playerId
                        const canSeeCard = card.revealedToPlayerId === playerId;

                        return canSeeCard ? (
                            // Carte visible pour nous (effet Nyx actif sur l'adversaire)
                            <div key={card.id} className={styles.revealedEnemyCard}>
                                <SpellCard card={card} isSelected={false} />
                                <span className={styles.nyxRevealBadge}>👁️</span>
                            </div>
                        ) : (
                            // Dos de carte normal
                            <div key={card.id || index} className={styles.cardBack}>
                                <span className={styles.cardBackIcon}>🎴</span>
                                <span className={styles.cardBackNumber}>{index + 1}</span>
                            </div>
                        );
                    })}
                    {opponent.hand.length === 0 && (
                        <span className={styles.emptyHandText}>Main vide</span>
                    )}
                </div>

                <div className={styles.godsRow}>
                    {opponent.gods.map((god) => {
                        // Vérifier si le sort a réellement besoin de cibler un ennemi
                        const needsEnemyTarget = selectedCard?.effects.some(e =>
                            e.target === 'enemy_god' || e.target === 'any_god'
                        );

                        // Vérifier si ce dieu est une cible valide (en tenant compte de la provocation et du multi-ciblage)
                        const validTargets = getValidEnemyTargets(isMultiTarget);
                        const isValidTarget = needsEnemyTarget && validTargets.some(t => t.card.id === god.card.id);

                        // Vérifier si c'est une cible obligatoire (provocateur)
                        const isRequiredTarget = requiredEnemyTargets.some(t => t.card.id === god.card.id);

                        const uniqueId = getUniqueGodId(god.card.id, true);
                        return (
                            <GodCard
                                key={uniqueId}
                                god={god}
                                isEnemy
                                isSelectable={isSelectingTarget && isValidTarget}
                                isSelected={isTargetSelected(uniqueId)}
                                isRequired={isSelectingTarget && isRequiredTarget && isMultiTarget}
                                onClick={() => handleSingleTargetSelect(uniqueId)}
                            />
                        );
                    })}
                </div>

                <div className={styles.playerInfo}>
                    <span className={styles.playerName}>{opponent.name}</span>
                    <div className={styles.energy}>
                        <span className={styles.energyIcon}>⚡</span>
                        <span className={styles.energyValue}>{opponent.energy}</span>
                    </div>
                    <span className={styles.deckCount}>🎴 {opponent.deck.length}</span>
                    {opponent.fatigueCounter > 0 && (
                        <span className={styles.fatigueCount} title="Dégâts de la prochaine fatigue">💀 {opponent.fatigueCounter + 1}</span>
                    )}
                    <span className={styles.handCount}>✋ {opponent.hand.length}</span>
                    <button
                        className={styles.discardButton}
                        onClick={() => setViewDiscard('opponent')}
                        title="Voir la défausse adverse"
                    >
                        🗑️ {opponent.discard.length}
                    </button>
                </div>
            </div>

            {/* Zone centrale - Informations de jeu */}
            <div className={styles.centerZone}>
                <div className={styles.turnInfo}>
                    <span className={styles.turnNumber}>Tour {gameState.turnNumber}</span>
                    <div className={styles.turnRow}>
                        <span className={`${styles.turnIndicator} ${isPlayerTurn ? styles.myTurn : styles.opponentTurn} `}>
                            {isPlayerTurn ? '🎮 Votre tour' : '⏳ Tour adverse'}
                        </span>
                        {/* Chronomètre de tour */}
                        {gameState.status === 'playing' && (
                            <span className={`${styles.turnTimer} ${turnTimer <= 10 ? styles.timerWarning : ''} ${turnTimer <= 5 ? styles.timerCritical : ''}`}>
                                ⏱️ {turnTimer}s
                            </span>
                        )}
                        {isPlayerTurn && gameState.status === 'playing' && !isSelectingTarget && (
                            <button
                                className={styles.endTurnButton}
                                onClick={() => {
                                    endTurn();
                                    onAction?.({ type: 'end_turn', payload: {} });
                                }}
                            >
                                Fin ➡️
                            </button>
                        )}
                    </div>
                </div>

                {isSelectingTarget && (
                    <div className={styles.targetPrompt}>
                        <p>
                            Sélectionnez {requiredTargets > 1 ? `jusqu'à ${requiredTargets} cibles` : 'une cible'} pour <strong>{selectedCard?.name}</strong>
                        </p >
                        {requiredTargets > 1 && (
                            <p className={styles.targetCounter}>
                                {selectedTargetGods.length} / {maxPossibleTargets} cibles sélectionnées
                                {maxPossibleTargets < requiredTargets && ` (${maxPossibleTargets} disponibles)`}
                            </p>
                        )
                        }
                        {
                            requiredEnemyTargets.length > 0 && isMultiTarget && !allRequiredTargetsIncluded && (
                                <p className={styles.requiredWarning}>
                                    ⚠️ Vous devez inclure le(s) provocateur(s) dans vos cibles !
                                </p>
                            )
                        }
                        {
                            canConfirm && selectedCard && needsLightningChoice(selectedCard) && (
                                <div className={styles.lightningChoice}>
                                    <p>⚡ Que voulez-vous faire avec les marques de foudre ?</p>
                                    <div className={styles.lightningButtons}>
                                        <button
                                            className={styles.lightningApply}
                                            onClick={() => {
                                                setLightningAction('apply');
                                                handlePlayCard(selectedCard.id, undefined, undefined, 'apply');
                                                setWantsToPlay(false);
                                            }}
                                        >
                                            ⚡ Appliquer des marques
                                        </button>
                                        <button
                                            className={styles.lightningRemove}
                                            onClick={() => {
                                                setLightningAction('remove');
                                                handlePlayCard(selectedCard.id, undefined, undefined, 'remove');
                                                setWantsToPlay(false);
                                            }}
                                        >
                                            💥 Retirer & infliger dégâts
                                        </button>
                                    </div>
                                </div>
                            )
                        }
                        {/* Choix d'élément pour Coup Critique d'Artémis */}
                        {
                            canConfirm && selectedCard && needsElementChoiceLocal(selectedCard) && (
                                <div className={styles.elementChoice}>
                                    <p>🎯 Choisissez l'élément de la faiblesse à appliquer :</p>
                                    <div className={styles.elementButtons}>
                                        {ALL_ELEMENTS.map(element => (
                                            <button
                                                key={element}
                                                className={styles.elementButton}
                                                onClick={() => {
                                                    setSelectedElement(element);
                                                    // Passer la cible sélectionnée
                                                    const targetId = selectedTargetGods[0]?.card.id;
                                                    handlePlayCard(selectedCard.id, targetId);
                                                }}
                                            >
                                                {ELEMENT_SYMBOLS[element]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        }
                        {
                            canConfirm && selectedCard && !needsLightningChoice(selectedCard) && !needsElementChoiceLocal(selectedCard) && (
                                <button className={styles.confirmButton} onClick={handleConfirmPlay}>
                                    ✅ Confirmer ({selectedTargetGods.length} cible{selectedTargetGods.length > 1 ? 's' : ''})
                                </button>
                            )
                        }
                        <button className={styles.cancelButton} onClick={() => selectCard(null)}>
                            ❌ Annuler
                        </button>
                    </div >
                )}

                {/* Choix de foudre pour les cartes sans ciblage (ex: Foudroiement all_enemies) */}
                {
                    selectedCard && needsLightningChoice(selectedCard) && wantsToPlay && !isSelectingTarget && (
                        <div className={styles.targetPrompt}>
                            <p>⚡ <strong>{selectedCard.name}</strong> - Que voulez-vous faire ?</p>
                            <div className={styles.lightningButtons}>
                                <button
                                    className={styles.lightningApply}
                                    onClick={() => {
                                        setLightningAction('apply');
                                        handlePlayCard(selectedCard.id, undefined, undefined, 'apply');
                                        setWantsToPlay(false);
                                    }}
                                >
                                    ⚡ Appliquer des marques
                                </button>
                                <button
                                    className={styles.lightningRemove}
                                    onClick={() => {
                                        setLightningAction('remove');
                                        handlePlayCard(selectedCard.id, undefined, undefined, 'remove');
                                        setWantsToPlay(false);
                                    }}
                                >
                                    💥 Retirer & infliger dégâts
                                </button>
                            </div>
                            <button className={styles.cancelButton} onClick={() => { selectCard(null); setWantsToPlay(false); }}>
                                ❌ Annuler
                            </button>
                        </div>
                    )
                }

                {
                    gameState.status === 'finished' && (
                        <div className={styles.gameOver}>
                            <h2>Partie terminée !</h2>
                            <p>
                                {gameState.winnerId === playerId
                                    ? '🏆 Victoire !'
                                    : '💀 Défaite...'}
                            </p>
                        </div>
                    )
                }
            </div >

            {/* Zone joueur */}
            < div className={styles.playerZone} >
                <div className={styles.godsRow}>
                    {player.gods.map((god) => {
                        // Déterminer si l'allié est une cible valide
                        const needsAllyTarget = selectedCard?.effects.some(e => e.target === 'ally_god' || e.target === 'any_god');
                        const needsDeadAllyTarget = selectedCard?.effects.some(e => e.target === 'dead_ally_god');
                        const needsSelfTarget = selectedCard?.effects.some(e => e.target === 'self');

                        let isValidAllyTarget = false;
                        if (needsAllyTarget && !god.isDead) {
                            isValidAllyTarget = true;
                        } else if (needsDeadAllyTarget && god.isDead) {
                            isValidAllyTarget = true;
                        } else if (needsSelfTarget && god.card.id === selectedCard?.godId && !god.isDead) {
                            isValidAllyTarget = true;
                        }

                        const uniqueId = getUniqueGodId(god.card.id, false);
                        return (
                            <GodCard
                                key={uniqueId}
                                god={god}
                                isSelectable={isSelectingTarget && isValidAllyTarget}
                                isSelected={isTargetSelected(uniqueId)}
                                onClick={() => handleSingleTargetSelect(uniqueId)}
                            />
                        );
                    })}
                </div>

                <div className={styles.playerInfo}>
                    <span className={styles.playerName}>{player.name}</span>
                    <div className={styles.energy}>
                        <span className={styles.energyIcon}>⚡</span>
                        <span className={styles.energyValue}>{player.energy}</span>
                    </div>
                    <span className={styles.deckCount}>🎴 {player.deck.length}</span>
                    {player.fatigueCounter > 0 && (
                        <span className={styles.fatigueCount} title="Dégâts de la prochaine fatigue">💀 {player.fatigueCounter + 1}</span>
                    )}
                    <button
                        className={styles.discardButton}
                        onClick={() => setViewDiscard('player')}
                        title="Voir ma défausse"
                    >
                        🗑️ {player.discard.length}
                    </button>
                </div>

                {/* Main du joueur */}
                <div className={styles.handContainer}>
                    <div className={styles.hand}>
                        {player.hand.map((card, index) => (
                            card.isHiddenFromOwner ? (
                                // Carte cachée par effet Nyx - le joueur ne la voit pas
                                <div
                                    key={card.id}
                                    className={`${styles.cardBack} ${styles.blindCard} ${isPlayerTurn ? styles.blindClickable : ''}`}
                                    onClick={() => isPlayerTurn && handleBlindCardClick(card)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        if (isPlayerTurn) handleBlindDiscard(card.id);
                                    }}
                                    title="Carte inconnue (effet Nyx) - Clic gauche = Menu • Clic droit = Défausser"
                                >
                                    <span className={styles.cardBackIcon}>❓</span>
                                    <span className={styles.cardBackNumber}>{index + 1}</span>
                                    {isPlayerTurn && (
                                        <span className={styles.blindPlayable}>⚠️</span>
                                    )}
                                </div>
                            ) : (
                                <SpellCard
                                    key={card.id}
                                    card={card}
                                    canPlay={isPlayerTurn && canPlayCard(card)}
                                    isSelected={selectedCard?.id === card.id}
                                    onClick={() => handleCardClick(card)}
                                    onRightClick={() => handleDiscard(card.id)}
                                />
                            )
                        ))}
                    </div>
                </div>
            </div >

            {/* Barre d'action mobile - s'affiche quand une carte est sélectionnée */}
            {
                selectedCard && isPlayerTurn && !isSelectingTarget && (
                    <div className={styles.mobileActionBar}>
                        <div className={styles.selectedCardInfo}>
                            <span className={styles.selectedCardName}>{selectedCard.name}</span>
                            <span className={styles.selectedCardCost}>
                                {selectedCard.energyCost > 0 ? `${selectedCard.energyCost}⚡` : `+${selectedCard.energyGain}⚡`}
                            </span>
                        </div>
                        <div className={styles.actionButtons}>
                            <button
                                className={styles.discardButton}
                                onClick={handleDiscardSelectedCard}
                            >
                                🗑️ Défausser (+1⚡)
                            </button>
                            <button
                                className={`${styles.playButton} ${!canPlayCard(selectedCard) ? styles.disabled : ''}`}
                                onClick={handlePlaySelectedCard}
                                disabled={!canPlayCard(selectedCard)}
                            >
                                ▶️ Jouer
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Modal de sélection de cartes */}
            <CardSelectionModal
                isOpen={isSelectingCards}
                title={cardSelectionTitle}
                cards={getCardsForSelection()}
                requiredCount={cardSelectionCount}
                onConfirm={handleConfirmCardSelection}
                // Désactiver l'annulation pour les effets obligatoires comme put_cards_bottom
                onCancel={pendingCardSelectionEffect === 'put_cards_bottom' ? undefined : cancelCardSelection}
            />

            {/* Modal de distribution de soins */}
            <HealDistributionModal
                isOpen={isDistributingHeal}
                totalHeal={healDistributionTotal}
                allies={player.gods.filter(g => !g.isDead)}
                onConfirm={handleConfirmHealDistribution}
                onCancel={cancelHealDistribution}
            />

            {/* Modal de sélection de cartes adverses (Nyx) */}
            <CardSelectionModal
                isOpen={isSelectingEnemyCards}
                title={enemyCardSelectionTitle}
                cards={opponent.hand}
                requiredCount={enemyCardSelectionCount}
                onConfirm={(cards) => handleConfirmEnemyCardSelection(cards.map(c => c.id))}
                onCancel={cancelEnemyCardSelection}
                blindMode={true}
            />

            {/* Modal de détail de carte */}
            <CardDetailModal
                card={selectedCard}
                isOpen={showCardDetail}
                onClose={isForcedDetail ? undefined : handleCloseCardDetail}
                onPlay={handlePlayFromDetail}
                onDiscard={handleDiscardFromDetail}
                canPlay={selectedCard ? canPlayCard(selectedCard) : false}
                canDiscard={isPlayerTurn && !player.hasPlayedCard && !isForcedDetail}
            />
        </div >
    );
}
