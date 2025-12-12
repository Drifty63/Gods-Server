'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { ALL_GODS } from '@/data/gods';
import { GodCard } from '@/types/cards';
import styles from './page.module.css';

export default function MultiplayerSelectPage() {
    const router = useRouter();
    const { selectGods, opponentReady, gameStartData, currentGame, isConnected, rejoinGame } = useMultiplayer();
    const [selectedGods, setSelectedGods] = useState<GodCard[]>([]);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [hasRejoined, setHasRejoined] = useState(false);

    // Rejoindre la partie au chargement (après un changement de page)
    useEffect(() => {
        if (isConnected && !hasRejoined) {
            const gameId = sessionStorage.getItem('gameId');
            const playerName = sessionStorage.getItem('playerName');

            if (gameId && playerName) {
                console.log('Rejoining game from select page:', gameId, playerName);
                rejoinGame(gameId, playerName);
                setHasRejoined(true);
            } else {
                // Pas de gameId, retour au lobby
                console.error('No gameId found, returning to lobby');
                router.push('/multiplayer');
            }
        }
    }, [isConnected, hasRejoined, rejoinGame, router]);

    // Rediriger vers le jeu quand la partie démarre
    useEffect(() => {
        console.log('=== SELECT PAGE DEBUG ===');
        console.log('gameStartData:', gameStartData);
        console.log('currentGame:', currentGame);
        console.log('hasSubmitted:', hasSubmitted);
        console.log('=========================');

        if (gameStartData && hasSubmitted) {
            // Ne rediriger que si on a bien soumis ET reçu game_start
            sessionStorage.setItem('multiplayerData', JSON.stringify(gameStartData));
            sessionStorage.setItem('isHost', String(currentGame?.isHost ?? false));
            if (currentGame?.gameId) {
                sessionStorage.setItem('gameId', currentGame.gameId);
            }
            router.push('/multiplayer/game');
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

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>⚔️ Sélection des Dieux</h1>
                <p className={styles.subtitle}>Choisissez 4 dieux pour votre équipe</p>
            </header>

            <div className={styles.statusBar}>
                <span className={styles.counter}>
                    {selectedGods.length}/4 sélectionnés
                </span>
                {!isConnected && (
                    <span className={styles.connectingStatus}>🔄 Connexion...</span>
                )}
                {opponentReady && !hasSubmitted && (
                    <span className={styles.opponentStatus}>✅ Adversaire prêt</span>
                )}
                {hasSubmitted && (
                    <span className={styles.waitingStatus}>⏳ En attente de l'adversaire...</span>
                )}
            </div>

            <div className={styles.godsGrid}>
                {ALL_GODS.map((god) => {
                    const isSelected = selectedGods.some(g => g.id === god.id);
                    return (
                        <div
                            key={god.id}
                            className={`${styles.godCard} ${isSelected ? styles.selected : ''} ${hasSubmitted ? styles.disabled : ''}`}
                            onClick={() => handleSelectGod(god)}
                        >
                            <div className={styles.godImage}>
                                <span className={styles.godEmoji}>🏛️</span>
                            </div>
                            <div className={styles.godInfo}>
                                <h3>{god.name}</h3>
                                <p className={styles.godElement}>{god.element}</p>
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
                        <p>En attente de l'adversaire...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
