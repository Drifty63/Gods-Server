'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { getOwnedGods, getGodById } from '@/data/gods';
import { GodCard } from '@/types/cards';
import { ELEMENT_SYMBOLS } from '@/game-engine/ElementSystem';
import { SavedDeck } from '@/services/supabase-profile';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import styles from './page.module.css';

export default function OnlineSelectPage() {
    const router = useRouter();
    const { selectGods, opponentReady, gameStartData, currentGame, isConnected, resumeGame, opponentName, rpsPhase } = useMultiplayer();
    const { profile } = useAuth();
    const [selectedGods, setSelectedGods] = useState<GodCard[]>([]);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [hasRejoined, setHasRejoined] = useState(false);
    const [showDecks, setShowDecks] = useState(true);

    const isCreator = profile?.is_creator || false;
    const godsOwned = useMemo(() => profile?.gods_owned || [], [profile?.gods_owned]);
    const savedDecks: SavedDeck[] = profile?.savedDecks || [];

    // Filtrer les dieux selon ceux possédés par le joueur
    const availableGods = useMemo(() => getOwnedGods(godsOwned, isCreator), [godsOwned, isCreator]);

    // Decks complets (4 dieux)
    const completeDecks = useMemo(() => savedDecks.filter(d => d.godIds.length === 4), [savedDecks]);

    // Reprendre la session au chargement (gameId+token+isHost persistés par la page précédente)
    useEffect(() => {
        if (isConnected && !hasRejoined) {
            const gameId = sessionStorage.getItem('gameId');
            const token = sessionStorage.getItem('multiplayerToken');
            const isHost = sessionStorage.getItem('isHost') === 'true';

            if (gameId && token) {
                resumeGame(gameId, token, isHost);
                setHasRejoined(true);
            } else {
                console.error('No gameId/token found, returning to online lobby');
                router.push('/online');
            }
        }
    }, [isConnected, hasRejoined, resumeGame, router]);

    // Rediriger vers RPS quand les deux joueurs ont sélectionné
    useEffect(() => {
        if (rpsPhase && hasSubmitted) {
            console.log('Both players selected, moving to RPS');
            // Sauvegarder isHost avant la redirection
            if (currentGame?.isHost !== undefined) {
                sessionStorage.setItem('isHost', String(currentGame.isHost));
            }
            router.push('/online/rps');
        }
    }, [rpsPhase, hasSubmitted, router, currentGame?.isHost]);

    // Mode DUEL : auto-confirmer avec les dieux pré-sélectionnés
    useEffect(() => {
        const gameMode = sessionStorage.getItem('gameMode');
        if (gameMode === 'duel' && hasRejoined && !hasSubmitted && currentGame) {
            const savedGodsJson = sessionStorage.getItem('selectedGods');
            if (savedGodsJson) {
                const savedGodIds: string[] = JSON.parse(savedGodsJson);
                const gods = savedGodIds
                    .map(id => getGodById(id))
                    .filter((g): g is GodCard => g !== undefined);

                if (gods.length >= 2) {
                    console.log('Duel mode: auto-confirming with pre-selected gods', gods);
                    setSelectedGods(gods);
                    selectGods(gods);
                    setHasSubmitted(true);
                }
            }
        }
    }, [hasRejoined, hasSubmitted, currentGame, selectGods]);

    // Rediriger vers le jeu si gameStartData arrive (fallback ou reconnexion)
    useEffect(() => {
        if (gameStartData && hasSubmitted) {
            sessionStorage.setItem('multiplayerData', JSON.stringify(gameStartData));
            sessionStorage.setItem('isHost', String(currentGame?.isHost ?? false));
            if (currentGame?.gameId) {
                sessionStorage.setItem('gameId', currentGame.gameId);
            }
            router.push('/online/game');
        }
    }, [gameStartData, currentGame, router, hasSubmitted]);

    const handleSelectGod = (god: GodCard) => {
        if (hasSubmitted) return;

        if (selectedGods.some(g => g.id === god.id)) {
            setSelectedGods(selectedGods.filter(g => g.id !== god.id));
        } else if (selectedGods.length < 4) {
            setSelectedGods([...selectedGods, god]);
        }
    };

    const handleConfirm = () => {
        if (selectedGods.length === 4) {
            selectGods(selectedGods);
            setHasSubmitted(true);
        }
    };

    // Charger un deck pré-enregistré
    const handleLoadDeck = (deck: SavedDeck) => {
        if (hasSubmitted) return;

        const gods = deck.godIds
            .map(id => getGodById(id))
            .filter((g): g is GodCard => g !== undefined);

        if (gods.length === 4) {
            setSelectedGods(gods);
            setShowDecks(false);
        }
    };

    const savedOpponentName = typeof window !== 'undefined' ? sessionStorage.getItem('opponentName') : null;
    const displayOpponentName = opponentName || savedOpponentName || 'Adversaire';

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>⚔️ Sélection des Dieux</h1>
                <p className={styles.subtitle}>
                    Partie contre <span className={styles.opponentName}>{displayOpponentName}</span>
                </p>
            </header>

            <div className={styles.statusBar}>
                <span className={styles.counter}>
                    {selectedGods.length}/4 sélectionnés
                </span>
                {!isConnected && (
                    <span className={styles.connectingStatus}>🔄 Connexion...</span>
                )}
                {opponentReady && !hasSubmitted && (
                    <span className={styles.opponentStatus}>✅ {displayOpponentName} est prêt</span>
                )}
                {hasSubmitted && !opponentReady && (
                    <span className={styles.waitingStatus}>⏳ En attente de {displayOpponentName}...</span>
                )}
            </div>

            {/* Toggle Deck / Manuel */}
            {!hasSubmitted && completeDecks.length > 0 && (
                <div className={styles.modeToggle}>
                    <button
                        className={`${styles.toggleButton} ${showDecks ? styles.active : ''}`}
                        onClick={() => setShowDecks(true)}
                    >
                        📦 Mes Decks
                    </button>
                    <button
                        className={`${styles.toggleButton} ${!showDecks ? styles.active : ''}`}
                        onClick={() => setShowDecks(false)}
                    >
                        👆 Sélection manuelle
                    </button>
                </div>
            )}

            {/* Sélection des decks */}
            {showDecks && completeDecks.length > 0 && !hasSubmitted && (
                <div className={styles.decksSection}>
                    <h3 className={styles.sectionTitle}>Choisir un deck</h3>
                    <div className={styles.decksGrid}>
                        {completeDecks.map((deck) => (
                            <div
                                key={deck.id}
                                className={styles.deckCard}
                                onClick={() => handleLoadDeck(deck)}
                            >
                                <span className={styles.deckName}>{deck.name}</span>
                                <div className={styles.deckGods}>
                                    {deck.godIds.map((godId) => {
                                        const god = getGodById(godId);
                                        return god ? (
                                            <Image
                                                key={godId}
                                                src={god.imageUrl}
                                                alt={god.name}
                                                width={35}
                                                height={35}
                                                className={styles.deckGodImage}
                                            />
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Grille de sélection manuelle */}
            {(!showDecks || completeDecks.length === 0) && (
                <div className={styles.godsGrid}>
                    {availableGods.map((god) => {
                        const isSelected = selectedGods.some(g => g.id === god.id);
                        const elementSymbol = ELEMENT_SYMBOLS[god.element] || '⚪';

                        return (
                            <div
                                key={god.id}
                                className={`${styles.godCard} ${isSelected ? styles.selected : ''} ${hasSubmitted ? styles.disabled : ''}`}
                                onClick={() => handleSelectGod(god)}
                            >
                                <div className={styles.godImage}>
                                    <Image
                                        src={god.imageUrl}
                                        alt={god.name}
                                        fill
                                        className={styles.godImg}
                                        sizes="120px"
                                    />
                                </div>
                                <div className={styles.godInfo}>
                                    <h3>{god.name.split(',')[0]}</h3>
                                    <p className={styles.godElement}>{elementSymbol} {god.element}</p>
                                    <p className={styles.godHealth}>❤️ {god.maxHealth}</p>
                                </div>
                                {isSelected && (
                                    <div className={styles.selectedBadge}>
                                        {selectedGods.findIndex(g => g.id === god.id) + 1}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className={styles.actions}>
                {!hasSubmitted ? (
                    <button
                        className={styles.confirmButton}
                        onClick={handleConfirm}
                        disabled={selectedGods.length !== 4 || !isConnected || !hasRejoined}
                    >
                        ✅ Confirmer la sélection
                    </button>
                ) : (
                    <div className={styles.waitingSpinner}>
                        <div className={styles.spinner}></div>
                        <p>En attente de {displayOpponentName}...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
