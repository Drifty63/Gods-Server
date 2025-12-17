'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { ALL_GODS, getVisibleGods } from '@/data/gods';
import { GodCard } from '@/types/cards';
import { ELEMENT_SYMBOLS } from '@/game-engine/ElementSystem';
import { auth, getUserProfile } from '@/services/firebase';
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

    // Filtrer les dieux selon le statut créateur
    const visibleGods = useMemo(() => getVisibleGods(isCreator), [isCreator]);

    // Récupérer le statut créateur
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const profile = await getUserProfile(user.uid);
                setIsCreator(profile?.isCreator || false);
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

            <div className={styles.godsGrid}>
                {visibleGods.map((god) => {
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
