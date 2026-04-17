'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { ArenaArea } from './components/ArenaArea';
import { HandArea } from './components/HandArea';
import { EnergyOrb } from './components/EnergyOrb';
import { DeckAndDiscard } from './components/DeckAndDiscard';
import { SpellCardUI } from './components/SpellCardUI';
import { SpellCard, GodState } from '@/types/cards';
import styles from './GameBoard.module.css';

// Modals pour effets spéciaux
import CardSelectionModal from '@/components/CardSelectionModal/CardSelectionModal';
import OptionalChoiceModal from '@/components/OptionalChoiceModal/OptionalChoiceModal';
import ElementSelectionModal from '@/components/ElementSelectionModal/ElementSelectionModal';
import LightningActionModal from '@/components/LightningActionModal/LightningActionModal';
import PlayerSelectionModal from '@/components/PlayerSelectionModal/PlayerSelectionModal';
import DeadGodSelectionModal from '@/components/DeadGodSelectionModal/DeadGodSelectionModal';
import ZombieDamageModal from '@/components/ZombieDamageModal/ZombieDamageModal';
import HealDistributionModal from '@/components/HealDistributionModal/HealDistributionModal';

interface GameBoardProps {
    isOnlineMode?: boolean;
    onAction?: (action: { type: string; payload?: any }) => void;
}

export default function GameBoard({ isOnlineMode = false, onAction }: GameBoardProps) {
    // --- STORE BOUNDARIES ---
    const {
        gameState,
        getCurrentPlayer,
        getOpponent,
        isMyTurn,
        selectedCard,
        selectCard,
        selectedTargetGods,
        toggleTargetGod,
        playCard,
        discardForEnergy,
        endTurn,
        isSelectingTarget,
        requiredTargets,
        startTargetSelection,
        playerId,
        playAITurn,
        
        // États Modals
        isSelectingCards,
        cardSelectionSource,
        cardSelectionCount,
        cardSelectionTitle,
        confirmCardSelection,
        cancelCardSelection,
        
        isShowingOptionalChoice,
        optionalChoiceTitle,
        optionalChoiceDescription,
        confirmOptionalChoice,
        cancelOptionalChoice,
        
        isSelectingElement,
        setSelectedElement,
        
        isSelectingLightningAction,
        setLightningAction,
        
        isSelectingPlayer,
        playerSelectionTitle,
        confirmPlayerSelection,
        cancelPlayerSelection,
        
        isSelectingDeadGod,
        deadGodSelectionTitle,
        confirmDeadGodSelection,
        cancelDeadGodSelection,
        
        isShowingZombieDamage,
        zombieDamageGodId,
        confirmZombieDamage,
        cancelZombieDamage,
        
        isDistributingHeal,
        healDistributionTotal,
        confirmHealDistribution,
        cancelHealDistribution
    } = useGameStore();

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [lastOpponentCard, setLastOpponentCard] = useState<SpellCard | null>(null);
    const [previousDiscardCount, setPreviousDiscardCount] = useState<number>(0);
    const [viewingDiscard, setViewingDiscard] = useState<SpellCard[] | null>(null);
    const [hoveredCard, setHoveredCard] = useState<SpellCard | null>(null);


    // Safety checks
    if (!gameState || gameState.status !== 'playing') {
        return (
            <div className={styles.gameBoard} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '2rem', textTransform: 'uppercase' }}>
                    {gameState?.status === 'finished' ? 'Partie Terminée' : 'Chargement de L\'Olympe...'}
                </div>
            </div>
        );
    }

    // --- IDENTITIES ---
    // Distinguish between the LOCAL HUMAN and the OPPONENT
    const localPlayer = gameState.players.find(p => p.id === playerId);
    const remoteOpponent = gameState.players.find(p => p.id !== playerId);
    
    // Also know whose turn it is
    const activePlayer = getCurrentPlayer();
    
    if (!localPlayer || !remoteOpponent) return null;

    // Use absolute references for UI layout
    const player = localPlayer; 
    const opponent = remoteOpponent;

    // Track opponent's actions using discard pile size changes
    useEffect(() => {
        if (!opponent) return;
        
        if (opponent.discard.length > previousDiscardCount) {
            // New card added to opponent's discard pile
            const card = opponent.discard[opponent.discard.length - 1];
            setLastOpponentCard(card);
            
            // Clear the notification after 4 seconds
            const timer = setTimeout(() => {
                setLastOpponentCard(null);
            }, 4000);
            
            return () => clearTimeout(timer);
        }
        setPreviousDiscardCount(opponent.discard.length);
    }, [opponent?.discard.length]);

    const myTurn = isMyTurn();

    // --- GAME ENGINE LOOP (Offline AI Trigger) ---
    useEffect(() => {
        if (!isOnlineMode && !myTurn && gameState.status === 'playing') {
            const timer = setTimeout(() => {
                playAITurn();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [myTurn, gameState.status, isOnlineMode, playAITurn]);
    
    // --- GAME ENGINE LOOP (Offline AI Trigger) ---

    // --- ACTIONS ---
    const handleCardClick = (card: SpellCard) => {
        if (!myTurn) return;
        selectCard(selectedCard?.id === card.id ? null : card);
        setErrorMsg(null);
    };

    const handleGodTarget = (god: GodState) => {
        if (!myTurn || !isSelectingTarget) return;
        
        toggleTargetGod(god);
    };

    const [playedCardPreview, setPlayedCardPreview] = useState<SpellCard | null>(null);

    const handlePlayConfirmed = () => {
        if (!selectedCard) return;
        
        // Show preview for 2 seconds
        setPlayedCardPreview(selectedCard);
        setTimeout(() => setPlayedCardPreview(null), 2000);

        const result = playCard(
            selectedCard.id, 
            undefined, 
            selectedTargetGods.map(g => g.card.id)
        );

        if (!result.success) {
            setErrorMsg(result.message);
            setPlayedCardPreview(null);
        } else {
            setErrorMsg(null);
            selectCard(null); // Clear selection after play
            if (onAction) {
                onAction({ type: 'play_card', payload: { cardId: selectedCard.id, targetGodIds: selectedTargetGods.map(g => g.card.id) } });
            }
        }
    };

    const handleDiscard = () => {
        if (!selectedCard || !myTurn) return;
        // Logic for discard using playHub/store if available, else manual
        // Assume playCard with a special flag or dedicated discard action
        // For now, I'll use playCard and handle it in the store if it supports it, 
        // OR add it to the interaction list.
        discardForEnergy(selectedCard.id); 
        selectCard(null);
    };

    return (
        <div className={styles.gameBoard}>
            {/* BACKGROUND EFFECTS */}
            <div className={styles.bgParticles} />

            {/* ERROR TOAST */}
            {errorMsg && (
                <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#ef4444', color: 'white', padding: '10px 20px', borderRadius: '8px', zIndex: 1000}}>
                    {errorMsg}
                </div>
            )}

            {/* OPPONENT ACTION PREVIEW (RIGHT) */}
            {lastOpponentCard && (
                <div className={styles.playedCardPreview} style={{ borderColor: 'var(--color-danger)' }}>
                    <div className={styles.previewTitle} style={{ color: 'var(--color-danger)', textShadow: '0 0 15px rgba(239, 68, 68, 0.5)' }}>
                        ADVERSAIRE JOUE
                    </div>
                    <div className={styles.detailCardImage} style={{ width: '120px', margin: '10px auto' }}>
                        <img src={lastOpponentCard.imageUrl} alt={lastOpponentCard.name} />
                    </div>
                    <div className={styles.previewContent}>
                        <h3 className={styles.previewName}>{lastOpponentCard.name}</h3>
                        <p className={styles.previewDesc}>{lastOpponentCard.description}</p>
                    </div>
                </div>
            )}


            {/* TURN INDICATOR */}
            <div className={`${styles.turnIndicator} ${myTurn ? styles.turnMyTurn : styles.turnEnemyTurn}`}>
                {myTurn ? 'Vos Dieux Attendent Vos Ordres' : 'Tour de l\'Adversaire'}
            </div>

            {/* CARD DETAIL PANEL (Master Duel Style - LEFT) */}
            {(selectedCard || hoveredCard) && (
                <div className={styles.cardDetailPanel}>
                    <div className={styles.detailCardImage}>
                        <img src={(selectedCard || hoveredCard)?.imageUrl} alt={(selectedCard || hoveredCard)?.name} />
                    </div>
                    <div className={styles.detailContent}>
                        <h2 className={styles.detailName}>{(selectedCard || hoveredCard)?.name}</h2>
                        <div className={styles.detailType}>
                            <span>EFFET / DESCRIPTION:</span>
                        </div>
                        <p className={styles.detailDescription}>{(selectedCard || hoveredCard)?.description}</p> 
                        <div className={styles.detailType} style={{ marginTop: '10px' }}>
                            <span>COÛT: ⚡ {(selectedCard || hoveredCard)?.energyCost} Énergie</span>
                        </div>
                        
                        {selectedCard && myTurn && !isSelectingTarget && (
                            <button 
                                className={styles.btnDiscard} 
                                onClick={(e) => { e.stopPropagation(); handleDiscard(); }}
                            >
                                🗑️ DÉFAUSSER
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* PLAYED CARD PREVIEW (RIGHT) */}
            {playedCardPreview && (
                <div className={styles.playedCardPreview}>
                    <div className={styles.previewTitle}>SORT LANCÉ</div>
                    <div className={styles.detailCardImage} style={{ width: '120px', margin: '10px auto' }}>
                        <img src={playedCardPreview.imageUrl} alt={playedCardPreview.name} />
                    </div>
                    <div className={styles.previewContent}>
                        <h3 className={styles.previewName}>{playedCardPreview.name}</h3>
                        <p className={styles.previewDesc}>{playedCardPreview.description}</p>
                    </div>
                </div>
            )}


            {/* DECK, DISCARD, ENERGIES & FATIGUE */}
            <DeckAndDiscard 
                player={opponent} 
                isOpponent={true} 
                onClickDiscard={() => setViewingDiscard(opponent.discard)}
            />
            <DeckAndDiscard 
                player={player} 
                onClickDiscard={() => setViewingDiscard(player.discard)}
            />

            {/* OPPONENT HAND */}
            <div className={styles.handAreaOpponent}>
                {opponent.hand.map((card, idx) => {
                    const angle = (idx - (opponent.hand.length - 1) / 2) * 5;
                    const isRevealedToMe = card.revealedToPlayerId === player.id;

                    return (
                        <div 
                            key={`opp-hand-${idx}`} 
                            style={{ position: 'relative', margin: '0 -8px', transform: `rotate(${angle}deg)` }}
                        >
                            <SpellCardUI 
                                card={card}
                                isHidden={!isRevealedToMe} 
                                isMini={true}
                                isMinimal={isRevealedToMe}
                                onMouseEnter={() => isRevealedToMe && setHoveredCard(card)}
                                onMouseLeave={() => setHoveredCard(null)}
                            />
                        </div>
                    );
                })}
                {/* Visual card count indicator */}
                <div style={{ position: 'absolute', top: '90px', fontSize: '0.7rem', color: '#f59e0b', fontWeight: 'bold' }}>
                    Main adverse ({opponent.hand.length})
                </div>
            </div>

            {/* ARENA */}
            <ArenaArea 
                player={player}
                opponent={opponent}
                selectedTargetGods={selectedTargetGods}
                onTargetGod={handleGodTarget}
            />

            {/* BOTTOM HUD */}
            <HandArea 
                hand={player.hand}
                selectedCard={selectedCard}
                onSelectCard={handleCardClick}
                onHoverCard={setHoveredCard}
            />

            {/* ACTION UI (Play or Target) */}
            {selectedCard && !isSelectingTarget && (
                <div style={{ position: 'absolute', bottom: '160px', left: '50%', transform: 'translateX(-50%)', zIndex: 500 }}>
                    <button className={styles.btnPremium} onClick={() => {
                        if (requiredTargets > 0) {
                            startTargetSelection();
                        } else {
                            handlePlayConfirmed();
                        }
                    }}>
                        {requiredTargets > 0 ? `CIBLER (${requiredTargets})` : `LANCER SORT`}
                    </button>
                </div>
            )}

            {/* ACTION UI (Target Confirmation) */}
            {isSelectingTarget && requiredTargets > 0 && selectedTargetGods.length === requiredTargets && (
                <div style={{ position: 'absolute', bottom: '160px', left: '50%', transform: 'translateX(-50%)', zIndex: 500 }}>
                    <button className={styles.btnPremium} onClick={handlePlayConfirmed}>
                        CONFIRMER {selectedCard?.name}
                    </button>
                </div>
            )}

            {/* ENERGY & END TURN */}
            <EnergyOrb 
                energy={player.energy} 
                onClick={() => {
                    if (myTurn) {
                        const result = endTurn();
                        if (!result.success) {
                            setErrorMsg(result.message);
                        } else {
                            if (onAction) {
                                onAction({ type: 'end_turn' });
                            }
                        }
                    }
                }} 
            />

            {/* DISCARD VIEWER MODAL */}
            {viewingDiscard && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 2000,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '40px'
                }} onClick={() => setViewingDiscard(null)}>
                    <h2 style={{ color: 'white', marginBottom: '20px', fontFamily: 'var(--font-logo)' }}>Contenu de la Corbeille</h2>
                    
                    {viewingDiscard.length === 0 ? (
                        <div style={{ color: '#94a3b8', fontSize: '1.2rem', fontStyle: 'italic' }}>Cette corbeille est vide.</div>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', maxWidth: '80%', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                            {viewingDiscard.map((card, idx) => (
                                <div key={idx} className={styles.spellCard} style={{ cursor: 'default', transform: 'none' }}>
                                    <div className={styles.spellCost}>{card.energyCost}</div>
                                    {card.imageUrl && <img src={card.imageUrl} alt={card.name} className={styles.spellImage} />}
                                    <div className={styles.spellTitle}>{card.name}</div>
                                    <div className={styles.spellDesc}>{card.description}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    <button className={styles.btnPremium} style={{ marginTop: '30px' }} onClick={() => setViewingDiscard(null)}>Fermer</button>
                </div>
            )}

            {/* MODALS D'EFFETS SPÉCIAUX */}
            <CardSelectionModal 
                isOpen={isSelectingCards}
                title={cardSelectionTitle}
                requiredCount={cardSelectionCount}
                cards={cardSelectionSource === 'hand' ? player.hand : (cardSelectionSource === 'discard' ? player.discard : opponent.discard)}
                onConfirm={confirmCardSelection}
                onCancel={cancelCardSelection}
            />

            <OptionalChoiceModal 
                isOpen={isShowingOptionalChoice}
                title={optionalChoiceTitle}
                description={optionalChoiceDescription}
                onAccept={() => confirmOptionalChoice(true)}
                onDecline={() => confirmOptionalChoice(false)}
            />

            <ElementSelectionModal 
                isOpen={isSelectingElement}
                onSelect={(el) => {
                    setSelectedElement(el);
                    if (selectedCard) {
                        playCard(selectedCard.id, undefined, selectedTargetGods.map(g => g.card.id));
                    }
                }}
                onCancel={() => useGameStore.setState({ isSelectingElement: false })}
            />

            <LightningActionModal 
                isOpen={isSelectingLightningAction}
                onSelect={(action) => {
                    setLightningAction(action);
                    if (selectedCard) {
                        playCard(selectedCard.id, undefined, selectedTargetGods.map(g => g.card.id), action);
                    }
                }}
                onCancel={() => useGameStore.setState({ isSelectingLightningAction: false })}
            />

            <PlayerSelectionModal 
                isOpen={isSelectingPlayer}
                title={playerSelectionTitle}
                onSelectSelf={() => confirmPlayerSelection(true)}
                onSelectOpponent={() => confirmPlayerSelection(false)}
                onCancel={cancelPlayerSelection}
            />

            <DeadGodSelectionModal 
                isOpen={isSelectingDeadGod}
                title={deadGodSelectionTitle}
                deadGods={player.gods.filter(g => g.isDead)}
                onSelectGod={confirmDeadGodSelection}
                onCancel={cancelDeadGodSelection}
            />

            <ZombieDamageModal 
                isOpen={isShowingZombieDamage}
                zombieGod={player.gods.find(g => g.card.id === zombieDamageGodId) || null}
                enemyGods={opponent.gods}
                onSelectTarget={confirmZombieDamage}
                onSkip={cancelZombieDamage}
            />

            <HealDistributionModal 
                isOpen={isDistributingHeal}
                totalHeal={healDistributionTotal}
                allies={player.gods}
                onConfirm={confirmHealDistribution}
                onCancel={cancelHealDistribution}
            />
        </div>
    );
}
