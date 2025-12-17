'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { getOwnedGods, getGodById } from '@/data/gods';
import { GodCard } from '@/types/cards';
import { ELEMENT_SYMBOLS } from '@/game-engine/ElementSystem';
import { auth, getUserProfile, SavedDeck } from '@/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';
import styles from './page.module.css';

export default function OnlineSelectPage() {
    const router = useRouter();
    const { selectGods, opponentReady, gameStartData, currentGame, isConnected, rejoinGame, opponentName, rpsPhase } = useMultiplayer();
    const [selectedGods, setSelectedGods] = useState<GodCard[]>([]);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [hasRejoined, setHasRejoined] = useState(false);
    const [isCreator, setIsCreator] = useState(false);
    const [godsOwned, setGodsOwned] = useState<string[]>([]);
    const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
    const [showDecks, setShowDecks] = useState(true);

    // Filtrer les dieux selon ceux possédés par le joueur
    const availableGods = useMemo(() => getOwnedGods(godsOwned, isCreator), [godsOwned, isCreator]);

    // Decks complets (4 dieux)
    const completeDecks = useMemo(() => savedDecks.filter(d => d.godIds.length === 4), [savedDecks]);

    // Récupérer le profil et les dieux possédés
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const profile = await getUserProfile(user.uid);
                setIsCreator(profile?.isCreator || false);
                setGodsOwned(profile?.collection.godsOwned || []);
                setSavedDecks(profile?.savedDecks || []);
            }
        });
        return () => unsubscribe();
    }, []);

    // Rejoindre la partie au chargement
    useEffect(() => {
        if (isConnected && !hasRejoined) {
            const gameId = sessionStorage.getItem('gameId');
            const playerName = sessionStorage.getItem('playerName');

            if (gameId && playerName) {
                console.log('Rejoining game from select page:', gameId, playerName);
                rejoinGame(gameId, playerName);
                setHasRejoined(true);
            } else {
                console.error('No gameId found, returning to online lobby');
                router.push('/online');
            }
        }
    }, [isConnected, hasRejoined, rejoinGame, router]);

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
