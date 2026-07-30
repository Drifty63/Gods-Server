'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { ArenaArea } from './components/ArenaArea';
import { HandArea } from './components/HandArea';
import { EnergyOrb } from './components/EnergyOrb';
import { DeckAndDiscard } from './components/DeckAndDiscard';
import { SpellCardUI } from './components/SpellCardUI';
import { SpellCard, GodState } from '@/types/cards';
import { getReadableSpellDescription } from '@/data/spellDescriptions';
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
import GodSelectionModal from '@/components/GodSelectionModal/GodSelectionModal';
import CombatLogModal from '@/components/CombatLogModal/CombatLogModal';

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
        canPlayCard,

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
        pendingOptionalEffect,
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
        cancelHealDistribution,

        isSelectingGod,
        godSelectionTitle,
        godSelectionTargetType,
        confirmGodSelection,
        cancelGodSelection,
    } = useGameStore();

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [lastOpponentCard, setLastOpponentCard] = useState<SpellCard | null>(null);
    const [previousDiscardCount, setPreviousDiscardCount] = useState<number>(0);
    const [viewingDiscard, setViewingDiscard] = useState<SpellCard[] | null>(null);
    const [isLogOpen, setIsLogOpen] = useState(false);
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

    // Explique pourquoi une carte ne peut pas être jouée (miroir de canPlayCard du store, qui
    // ne retourne qu'un booléen) : sert à la fois pour le message d'erreur au clic et pour
    // l'affichage grisé des cartes injouables dans la main.
    const getUnplayableReason = (card: SpellCard): string | null => {
        if (!myTurn) return "Ce n'est pas votre tour.";
        if (!player) return "Ce n'est pas votre tour.";
        if (player.hasPlayedCard) return 'Vous avez déjà joué une carte ce tour.';
        if (player.hasDiscardedForEnergy) return 'Vous avez déjà défaussé une carte ce tour.';
        if (player.energy < card.energyCost) return `Pas assez d'énergie (${player.energy}/${card.energyCost} ⚡).`;
        const god = player.gods.find(g => g.card.id === card.godId);
        if (!god || god.isDead) return 'Ce dieu est mort.';
        if (god.statusEffects.some(s => s.type === 'stun')) return 'Ce dieu est étourdi.';
        return null;
    };

    const handleCardClick = (card: SpellCard) => {
        if (!myTurn) return;
        // Toujours sélectionnable, même si injouable (énergie insuffisante...) : sélectionner
        // une carte ne fait qu'ouvrir son détail, c'est aussi ce qui donne accès au bouton
        // "Défausser" — bloquer la sélection empêchait de défausser une carte trop chère.
        selectCard(selectedCard?.id === card.id ? null : card);
        setErrorMsg(null);
    };

    const handleGodTarget = (god: GodState) => {
        if (!myTurn || !isSelectingTarget) return;
        
        toggleTargetGod(god);
    };

    const [playedCardPreview, setPlayedCardPreview] = useState<SpellCard | null>(null);

    const handlePlayConfirmed = (lightningAction?: 'apply' | 'remove') => {
        if (!selectedCard) return;
        const cardBeingPlayed = selectedCard;
        const targetIds = selectedTargetGods.map(g => g.card.id);

        const result = playCard(cardBeingPlayed.id, undefined, targetIds, lightningAction);

        if (!result.success) {
            // Échec réel (ex: plus assez d'énergie entre-temps) : rien n'a été joué.
            setErrorMsg(result.message);
            return;
        }

        if (result.pending) {
            // Une modale de choix préalable vient de s'ouvrir (élément de faiblesse, action
            // foudre...) : la carte n'est PAS encore jouée. Ne pas effacer la sélection ni
            // afficher l'aperçu "sort lancé" — un second appel à playCard() suivra une fois le
            // choix fait, avec selectedCard/selectedTargetGods toujours intacts.
            setErrorMsg(null);
            return;
        }

        // Succès réel : la carte a bien été jouée.
        setPlayedCardPreview(cardBeingPlayed);
        setTimeout(() => setPlayedCardPreview(null), 2000);
        setErrorMsg(null);
        selectCard(null);
        if (onAction) {
            onAction({ type: 'play_card', payload: { cardId: cardBeingPlayed.id, targetGodIds: targetIds } });
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

    // Dieu qui lance le sort en ce moment (carte sélectionnée en main, ou tout juste jouée) :
    // mis en surbrillance dorée sur le plateau pour qu'on comprenne qui lance quoi.
    const playerCasterGodId = selectedCard?.godId || playedCardPreview?.godId || null;
    const opponentCasterGodId = lastOpponentCard?.godId || null;

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
                    <div className={styles.detailCardImage}>
                        <img src={lastOpponentCard.imageUrl} alt={lastOpponentCard.name} />
                    </div>
                    <div className={styles.previewContent}>
                        <h3 className={styles.previewName}>{lastOpponentCard.name}</h3>
                        <p className={styles.previewDesc}>{getReadableSpellDescription(lastOpponentCard)}</p>
                    </div>
                </div>
            )}


            {/* TURN INDICATOR */}
            <div className={`${styles.turnIndicator} ${myTurn ? styles.turnMyTurn : styles.turnEnemyTurn}`}>
                {myTurn ? 'Vos Dieux Attendent Vos Ordres' : 'Tour de l\'Adversaire'}
            </div>

            {/* JOURNAL DE COMBAT */}
            <button
                className={styles.logButton}
                onClick={() => setIsLogOpen(true)}
                aria-label="Journal de combat"
            >
                📜
            </button>

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
                        <p className={styles.detailDescription}>
                            {(() => {
                                const card = selectedCard || hoveredCard;
                                return card ? getReadableSpellDescription(card) : '';
                            })()}
                        </p>
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
                    <div className={styles.detailCardImage}>
                        <img src={playedCardPreview.imageUrl} alt={playedCardPreview.name} />
                    </div>
                    <div className={styles.previewContent}>
                        <h3 className={styles.previewName}>{playedCardPreview.name}</h3>
                        <p className={styles.previewDesc}>{getReadableSpellDescription(playedCardPreview)}</p>
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
                playerCasterGodId={playerCasterGodId}
                opponentCasterGodId={opponentCasterGodId}
            />

            {/* BOTTOM HUD */}
            <HandArea
                hand={player.hand}
                selectedCard={selectedCard}
                onSelectCard={handleCardClick}
                onHoverCard={setHoveredCard}
                isCardPlayable={(card) => myTurn && canPlayCard(card)}
            />

            {/* ACTION UI (Play or Target) */}
            {selectedCard && !isSelectingTarget && (
                <div style={{ position: 'absolute', bottom: '160px', left: '50%', transform: 'translateX(-50%)', zIndex: 500 }}>
                    <button className={styles.btnPremium} onClick={() => {
                        const reason = getUnplayableReason(selectedCard);
                        if (reason) {
                            setErrorMsg(reason);
                            return;
                        }
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
                    <button className={styles.btnPremium} onClick={() => handlePlayConfirmed()}>
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
                    backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 2000,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '16px', boxSizing: 'border-box'
                }} onClick={() => setViewingDiscard(null)}>
                    <h2 style={{ color: 'white', marginBottom: '14px', fontFamily: 'var(--font-logo)', fontSize: 'clamp(1rem, 4vw, 1.3rem)' }}>Contenu de la Corbeille</h2>

                    {viewingDiscard.length === 0 ? (
                        <div style={{ color: '#94a3b8', fontSize: '1rem', fontStyle: 'italic' }}>Cette corbeille est vide.</div>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', width: '100%', maxHeight: '65dvh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                            {viewingDiscard.map((card, idx) => (
                                <div key={idx} className={styles.spellCard} style={{ cursor: 'default', transform: 'none' }}>
                                    <div className={styles.spellCost}>{card.energyCost}</div>
                                    {card.imageUrl && <img src={card.imageUrl} alt={card.name} className={styles.spellImage} />}
                                    <div className={styles.spellTitle}>{card.name}</div>
                                    <div className={styles.spellDesc}>{getReadableSpellDescription(card)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    <button className={styles.btnPremium} style={{ marginTop: '16px' }} onClick={() => setViewingDiscard(null)}>Fermer</button>
                </div>
            )}

            {/* MODALS D'EFFETS SPÉCIAUX */}
            <CardSelectionModal 
                isOpen={isSelectingCards}
                title={cardSelectionTitle}
                requiredCount={cardSelectionCount}
                cards={cardSelectionSource === 'hand' ? player.hand : player.discard}
                onConfirm={confirmCardSelection}
                onCancel={cancelCardSelection}
            />

            <OptionalChoiceModal
                isOpen={isShowingOptionalChoice}
                title={optionalChoiceTitle}
                description={optionalChoiceDescription}
                onAccept={() => confirmOptionalChoice(true)}
                onDecline={() => confirmOptionalChoice(false)}
                {...(pendingOptionalEffect === 'cascade_heal_choice' || pendingOptionalEffect?.startsWith('copy_cascade_heal:')
                    ? { acceptLabel: '⬅️ Gauche (Ouest)', declineLabel: 'Droite (Est) ➡️' }
                    : {})}
            />

            <ElementSelectionModal
                isOpen={isSelectingElement}
                onSelect={(el) => {
                    setSelectedElement(el);
                    handlePlayConfirmed();
                }}
                onCancel={() => useGameStore.setState({ isSelectingElement: false })}
            />

            <LightningActionModal
                isOpen={isSelectingLightningAction}
                onSelect={(action) => {
                    setLightningAction(action);
                    handlePlayConfirmed(action);
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

            <GodSelectionModal
                isOpen={isSelectingGod}
                title={godSelectionTitle}
                allyGods={player.gods}
                enemyGods={opponent.gods}
                targetType={godSelectionTargetType}
                onSelectGod={confirmGodSelection}
                onCancel={cancelGodSelection}
            />

            <CombatLogModal
                isOpen={isLogOpen}
                log={gameState.log || []}
                myPlayerId={playerId}
                onClose={() => setIsLogOpen(false)}
            />
        </div>
    );
}
