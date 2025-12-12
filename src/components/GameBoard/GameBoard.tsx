'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Element } from '@/types/cards';
import { ELEMENT_SYMBOLS } from '@/game-engine/ElementSystem';
import GodCard from '@/components/GodCard/GodCard';
import SpellCard from '@/components/SpellCard/SpellCard';
import CardSelectionModal from '@/components/CardSelectionModal/CardSelectionModal';
import HealDistributionModal from '@/components/HealDistributionModal/HealDistributionModal';
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
        selectedCard,
        selectedTargetGods,
        isSelectingTarget,
        selectCard,
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

    // Wrapper pour playCard qui gère aussi la sélection de cartes et la distribution de soins
    const handlePlayCard = (cardId: string, targetGodId?: string, targetGodIds?: string[], lightningAction?: 'apply' | 'remove') => {
        const card = player.hand.find(c => c.id === cardId);
        if (card) {
            // Vérifier si la carte nécessite une sélection de cartes
            const selection = getCardSelectionRequired(card);
            if (selection) {
                // Jouer la carte d'abord, puis ouvrir le modal
                playCard(cardId, targetGodId, targetGodIds, lightningAction);
                onAction?.({ type: 'play_card', payload: { cardId, targetGodId, targetGodIds, lightningAction } });
                setPendingCardForSelection(card);
                return;
            }

            // Vérifier si la carte nécessite une distribution de soins
            const healDist = getHealDistributionRequired(card);
            if (healDist) {
                // Jouer la carte d'abord, puis ouvrir le modal
                playCard(cardId, targetGodId, targetGodIds, lightningAction);
                onAction?.({ type: 'play_card', payload: { cardId, targetGodId, targetGodIds, lightningAction } });
                setPendingCardForHealDistribution(card);
                return;
            }

            // Vérifier si la carte nécessite une sélection de cartes adverses (Nyx)
            const enemySel = getEnemyCardSelectionRequired(card);
            if (enemySel) {
                // Jouer la carte d'abord (applique les dégâts), puis ouvrir le modal
                playCard(cardId, targetGodId, targetGodIds, lightningAction);
                onAction?.({ type: 'play_card', payload: { cardId, targetGodId, targetGodIds, lightningAction } });
                setPendingCardForEnemySelection(card);
                return;
            }
        }
        playCard(cardId, targetGodId, targetGodIds, lightningAction);
        onAction?.({ type: 'play_card', payload: { cardId, targetGodId, targetGodIds, lightningAction } });
    };

    const handleCardClick = (card: typeof selectedCard) => {
        if (!isPlayerTurn || !card) return;

        if (selectedCard?.id === card.id) {
            // Déselectionner
            selectCard(null);
        } else {
            selectCard(card);

            // Si la carte ne nécessite pas de cible ET pas de choix de foudre, la jouer directement
            const reqTargets = getRequiredTargetCount(card);
            const needsLightning = needsLightningChoice(card);

            if (reqTargets === 0 && !needsLightning && canPlayCard(card)) {
                handlePlayCard(card.id);
            }
            // Si la carte nécessite un choix de foudre mais pas de cible, le modal s'affichera
        }
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
    // SAUF si la carte nécessite un choix de foudre
    const handleSingleTargetSelect = (godId: string) => {
        if (!selectedCard || !isSelectingTarget) return;

        if (requiredTargets === 1 && !needsLightningChoice(selectedCard)) {
            // Comportement classique : jouer immédiatement (cartes sans choix foudre)
            handlePlayCard(selectedCard.id, godId);
        } else {
            // Ciblage multiple OU carte avec choix foudre : ajouter la cible et attendre
            handleTargetSelect(godId);
        }
    };

    const handleDiscard = (cardId: string) => {
        if (isPlayerTurn) {
            discardForEnergy(cardId);
            onAction?.({ type: 'discard', payload: { cardId } });
        }
    };

    // Jouer une carte cachée à l'aveugle
    // 1. La carte est révélée
    // 2. Si jouable (cible disponible) → le joueur procède normalement
    // 3. Si non jouable (pas de cible) → perd l'énergie, carte défaussée
    const handleBlindCardClick = (card: typeof selectedCard) => {
        if (!card || !isPlayerTurn) return;

        // 1. RÉVÉLER la carte (on enlève le flag isHiddenFromOwner)
        card.isHiddenFromOwner = false;

        // 2. Vérifier si la carte peut être jouée
        if (canPlayCard(card)) {
            // La carte peut être jouée, procéder normalement
            handleCardClick(card);
        } else {
            // La carte ne peut PAS être jouée (pas de cible valide, ou autre raison)
            // Le joueur perd l'énergie de la carte et elle va à la défausse
            const cardIndex = player.hand.findIndex(c => c.id === card.id);
            if (cardIndex !== -1) {
                // Déduire le coût en énergie (si le joueur a assez d'énergie)
                player.energy = Math.max(0, player.energy - card.energyCost);

                // Retirer la carte de la main
                const discardedCard = player.hand.splice(cardIndex, 1)[0];
                // La mettre dans la défausse
                player.discard.push(discardedCard);

                // Afficher un message pour informer le joueur
                alert(`⚠️ "${card.name}" ne peut pas être jouée (pas de cible valide). Vous perdez ${card.energyCost} énergie.`);

                // Terminer le tour
                endTurn();
                onAction?.({ type: 'end_turn', payload: {} });
            }
        }
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
            {/* Zone adversaire */}
            <div className={styles.opponentZone}>
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

                {/* Main de l'adversaire (dos de cartes ou face visible si effet Nyx) */}
                <div className={styles.opponentHand}>
                    {opponent.hand.map((card, index) => (
                        card.isHiddenFromOwner ? (
                            // Carte visible pour nous (effet Nyx actif sur l'adversaire)
                            <div key={card.id} className={styles.revealedEnemyCard}>
                                <SpellCard card={card} isSelected={false} />
                                <span className={styles.nyxRevealBadge}>👁️</span>
                            </div>
                        ) : (
                            // Dos de carte normal
                            <div key={index} className={styles.cardBack}>
                                <span className={styles.cardBackIcon}>🎴</span>
                                <span className={styles.cardBackNumber}>{index + 1}</span>
                            </div>
                        )
                    ))}
                    {opponent.hand.length === 0 && (
                        <span className={styles.emptyHandText}>Main vide</span>
                    )}
                </div>
            </div>

            {/* Zone centrale - Informations de jeu */}
            <div className={styles.centerZone}>
                <div className={styles.turnInfo}>
                    <span className={styles.turnNumber}>Tour {gameState.turnNumber}</span>
                    <span className={`${styles.turnIndicator} ${isPlayerTurn ? styles.myTurn : styles.opponentTurn}`}>
                        {isPlayerTurn ? '🎮 Votre tour' : '⏳ Tour adverse'}
                    </span>
                </div>

                {isSelectingTarget && (
                    <div className={styles.targetPrompt}>
                        <p>
                            Sélectionnez {requiredTargets > 1 ? `jusqu'à ${requiredTargets} cibles` : 'une cible'} pour <strong>{selectedCard?.name}</strong>
                        </p>
                        {requiredTargets > 1 && (
                            <p className={styles.targetCounter}>
                                {selectedTargetGods.length} / {maxPossibleTargets} cibles sélectionnées
                                {maxPossibleTargets < requiredTargets && ` (${maxPossibleTargets} disponibles)`}
                            </p>
                        )}
                        {requiredEnemyTargets.length > 0 && isMultiTarget && !allRequiredTargetsIncluded && (
                            <p className={styles.requiredWarning}>
                                ⚠️ Vous devez inclure le(s) provocateur(s) dans vos cibles !
                            </p>
                        )}
                        {canConfirm && selectedCard && needsLightningChoice(selectedCard) && (
                            <div className={styles.lightningChoice}>
                                <p>⚡ Que voulez-vous faire avec les marques de foudre ?</p>
                                <div className={styles.lightningButtons}>
                                    <button
                                        className={styles.lightningApply}
                                        onClick={() => {
                                            setLightningAction('apply');
                                            handlePlayCard(selectedCard.id, undefined, undefined, 'apply');
                                        }}
                                    >
                                        ⚡ Appliquer des marques
                                    </button>
                                    <button
                                        className={styles.lightningRemove}
                                        onClick={() => {
                                            setLightningAction('remove');
                                            handlePlayCard(selectedCard.id, undefined, undefined, 'remove');
                                        }}
                                    >
                                        💥 Retirer & infliger dégâts
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* Choix d'élément pour Coup Critique d'Artémis */}
                        {canConfirm && selectedCard && needsElementChoiceLocal(selectedCard) && (
                            <div className={styles.elementChoice}>
                                <p>🎯 Choisissez l'élément de la faiblesse à appliquer :</p>
                                <div className={styles.elementButtons}>
                                    {ALL_ELEMENTS.map(element => (
                                        <button
                                            key={element}
                                            className={styles.elementButton}
                                            onClick={() => {
                                                setSelectedElement(element);
                                                handlePlayCard(selectedCard.id);
                                            }}
                                        >
                                            {ELEMENT_SYMBOLS[element]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {canConfirm && selectedCard && !needsLightningChoice(selectedCard) && !needsElementChoiceLocal(selectedCard) && (
                            <button className={styles.confirmButton} onClick={handleConfirmPlay}>
                                ✅ Confirmer ({selectedTargetGods.length} cible{selectedTargetGods.length > 1 ? 's' : ''})
                            </button>
                        )}
                        <button className={styles.cancelButton} onClick={() => selectCard(null)}>
                            ❌ Annuler
                        </button>
                    </div>
                )}

                {/* Choix de foudre pour les cartes sans ciblage (ex: Foudroiement all_enemies) */}
                {selectedCard && needsLightningChoice(selectedCard) && !isSelectingTarget && (
                    <div className={styles.targetPrompt}>
                        <p>⚡ <strong>{selectedCard.name}</strong> - Que voulez-vous faire ?</p>
                        <div className={styles.lightningButtons}>
                            <button
                                className={styles.lightningApply}
                                onClick={() => {
                                    setLightningAction('apply');
                                    handlePlayCard(selectedCard.id, undefined, undefined, 'apply');
                                }}
                            >
                                ⚡ Appliquer des marques
                            </button>
                            <button
                                className={styles.lightningRemove}
                                onClick={() => {
                                    setLightningAction('remove');
                                    handlePlayCard(selectedCard.id, undefined, undefined, 'remove');
                                }}
                            >
                                💥 Retirer & infliger dégâts
                            </button>
                        </div>
                        <button className={styles.cancelButton} onClick={() => selectCard(null)}>
                            ❌ Annuler
                        </button>
                    </div>
                )}

                {gameState.status === 'finished' && (
                    <div className={styles.gameOver}>
                        <h2>Partie terminée !</h2>
                        <p>
                            {gameState.winnerId === playerId
                                ? '🏆 Victoire !'
                                : '💀 Défaite...'}
                        </p>
                    </div>
                )}
            </div>

            {/* Zone joueur */}
            <div className={styles.playerZone}>
                <div className={styles.godsRow}>
                    {player.gods.map((god) => {
                        // Déterminer si l'allié est une cible valide
                        const needsAllyTarget = selectedCard?.effects.some(e => e.target === 'ally_god');
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
                                    title="Carte inconnue (effet Nyx) - Clic gauche = Jouer à l'aveugle • Clic droit = Défausser"
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

                {/* Bouton fin de tour */}
                {isPlayerTurn && gameState.status === 'playing' && !isSelectingTarget && (
                    <button
                        className={styles.endTurnButton}
                        onClick={() => {
                            endTurn();
                            onAction?.({ type: 'end_turn', payload: {} });
                        }}
                    >
                        Fin du tour ➡️
                    </button>
                )}
            </div>

            {/* Aide */}
            <div className={styles.helpTooltip}>
                <p>💡 Clic gauche = Jouer • Clic droit = Défausser (+1⚡)</p>
            </div>

            {/* Modal de sélection de cartes */}
            <CardSelectionModal
                isOpen={isSelectingCards}
                title={cardSelectionTitle}
                cards={getCardsForSelection()}
                requiredCount={cardSelectionCount}
                onConfirm={confirmCardSelection}
                onCancel={cancelCardSelection}
            />

            {/* Modal de distribution de soins */}
            <HealDistributionModal
                isOpen={isDistributingHeal}
                totalHeal={healDistributionTotal}
                allies={player.gods.filter(g => !g.isDead)}
                onConfirm={confirmHealDistribution}
                onCancel={cancelHealDistribution}
            />

            {/* Modal de sélection de cartes adverses (Nyx) */}
            <CardSelectionModal
                isOpen={isSelectingEnemyCards}
                title={enemyCardSelectionTitle}
                cards={opponent.hand}
                requiredCount={enemyCardSelectionCount}
                onConfirm={(cards) => confirmEnemyCardSelection(cards.map(c => c.id))}
                onCancel={cancelEnemyCardSelection}
                blindMode={true}
            />
        </div>
    );
}
