'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiplayer, GameAction, GameStartData } from '@/hooks/useMultiplayer';
import { useGameStore } from '@/store/gameStore';
import { ALL_SPELLS } from '@/data/spells';
import GameBoard from '@/components/GameBoard/GameBoard';
import styles from './page.module.css';

export default function OnlineGamePage() {
    const router = useRouter();
    const {
        isConnected,
        lastAction,
        syncedState,
        opponentDisconnected,
        error,
        clearError,
        sendAction,
        syncState,
        clearLastAction,
        leaveGame,
        rejoinGame,
    } = useMultiplayer();

    const {
        gameState,
        initGame,
    } = useGameStore();

    const [isInitialized, setIsInitialized] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [multiplayerData, setMultiplayerData] = useState<GameStartData | null>(null);

    // Charger les données de session
    useEffect(() => {
        const dataStr = sessionStorage.getItem('multiplayerData');
        const hostStr = sessionStorage.getItem('isHost');

        if (!dataStr) {
            router.push('/online');
            return;
        }

        const data = JSON.parse(dataStr) as GameStartData;
        const host = hostStr === 'true';

        setMultiplayerData(data);
        setIsHost(host);
    }, [router]);

    // Reconnexion au socket après un refresh ou une micro-déconnexion
    useEffect(() => {
        if (isConnected && multiplayerData) {
            const gameId = sessionStorage.getItem('gameId');
            const playerName = sessionStorage.getItem('playerName');

            if (gameId && playerName) {
                console.log('Attempting to rejoin game:', gameId);
                rejoinGame(gameId, playerName);
            }
        }
    }, [isConnected, multiplayerData, rejoinGame]);

    // État pour l'overlay de reconnection
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);

    // Gérer les micro-déconnexions
    useEffect(() => {
        if (!isConnected && isInitialized) {
            // On vient de perdre la connexion en pleine partie
            setIsReconnecting(true);
            setReconnectAttempts(prev => prev + 1);
        } else if (isConnected && isReconnecting) {
            // Reconnection réussie !
            const gameId = sessionStorage.getItem('gameId');
            const playerName = sessionStorage.getItem('playerName');

            if (gameId && playerName) {
                console.log('Reconnected! Rejoining game...');
                rejoinGame(gameId, playerName);
            }

            // Attendre un peu que le serveur nous renvoie l'état
            setTimeout(() => {
                setIsReconnecting(false);
                setReconnectAttempts(0);
            }, 1000);
        }
    }, [isConnected, isInitialized, isReconnecting, rejoinGame]);

    // Initialiser la partie
    useEffect(() => {
        if (!multiplayerData) return;

        if (isHost && !isInitialized) {
            const myGods = multiplayerData.hostGods;
            const opponentGods = multiplayerData.guestGods;

            const myDeck = ALL_SPELLS.filter(spell => myGods.some(god => god.id === spell.godId));
            const opponentDeck = ALL_SPELLS.filter(spell => opponentGods.some(god => god.id === spell.godId));

            const imFirst = multiplayerData.firstPlayer === 'host';

            initGame(myGods, myDeck, opponentGods, opponentDeck, imFirst, false, { isOnlineGame: true });
            setIsInitialized(true);

            const state = useGameStore.getState().gameState;
            sendAction({
                type: 'sync_initial_state',
                payload: { state: state as unknown as Record<string, unknown> }
            });

        } else if (!isHost && !isInitialized) {
            const interval = setInterval(() => {
                sendAction({
                    type: 'ask_initial_state',
                    payload: {}
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [multiplayerData, isHost, isInitialized, initGame, sendAction]);

    // Traiter les actions reçues
    useEffect(() => {
        if (lastAction) {
            switch (lastAction.type) {
                case 'ask_initial_state':
                    if (isHost && isInitialized && gameState) {
                        sendAction({
                            type: 'sync_initial_state',
                            payload: { state: gameState as unknown as Record<string, unknown> }
                        });
                    }
                    break;

                case 'sync_initial_state':
                    if (!isHost && !isInitialized && multiplayerData) {
                        const receivedState = lastAction.payload.state as any;
                        useGameStore.getState().initWithState(receivedState, 'player2');
                        setIsInitialized(true);
                    }
                    break;

                // Les actions play_card, discard, end_turn sont maintenant ignorées ici
                // car on synchronise l'état complet via syncedState
                // Cela évite les bugs où l'action est rejouée avec la mauvaise perspective
                case 'play_card':
                case 'discard':
                case 'end_turn':
                    // On ne fait rien ici - l'état sera synchronisé via syncedState
                    console.log('Action received (will sync via state):', lastAction.type);
                    break;
            }
            clearLastAction();
        }
    }, [lastAction, gameState, clearLastAction, isHost, isInitialized, multiplayerData, sendAction]);

    // Appliquer l'état synchronisé
    useEffect(() => {
        if (syncedState && isInitialized) {
            useGameStore.getState().syncGameState(syncedState as any);
        }
    }, [syncedState, isInitialized]);

    const handleLeaveGame = () => {
        leaveGame();
        sessionStorage.removeItem('multiplayerData');
        sessionStorage.removeItem('isHost');
        sessionStorage.removeItem('gameId');
        sessionStorage.removeItem('opponentName');
        router.push('/online');
    };

    // Overlay d'erreur (partie introuvable après reconnection)
    if (error && error.includes('introuvable')) {
        return (
            <div className={styles.disconnectedOverlay}>
                <div className={styles.disconnectedModal}>
                    <h2>❌ Partie introuvable</h2>
                    <p>La partie a expiré ou n'existe plus.</p>
                    <p style={{ fontSize: '0.8em', opacity: 0.7, marginBottom: '1rem' }}>
                        Cela peut arriver si la déconnexion a duré trop longtemps.
                    </p>
                    <button onClick={() => {
                        clearError();
                        handleLeaveGame();
                    }}>
                        Retour au lobby
                    </button>
                </div>
            </div>
        );
    }

    // Overlay de reconnection (micro-déconnexion)
    if (isReconnecting) {
        return (
            <div className={styles.disconnectedOverlay}>
                <div className={styles.disconnectedModal}>
                    <div className={styles.spinner}></div>
                    <h2>🔄 Reconnection en cours...</h2>
                    <p>Tentative {reconnectAttempts}/20</p>
                    <p style={{ fontSize: '0.8em', opacity: 0.7 }}>
                        Votre partie sera restaurée automatiquement
                    </p>
                    {reconnectAttempts >= 10 && (
                        <button onClick={handleLeaveGame} style={{ marginTop: '1rem' }}>
                            Abandonner et quitter
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (opponentDisconnected) {
        return (
            <div className={styles.disconnectedOverlay}>
                <div className={styles.disconnectedModal}>
                    <h2>😢 Adversaire déconnecté</h2>
                    <p>Votre adversaire a quitté la partie ou a été déconnecté.</p>
                    <p style={{ fontSize: '0.8em', opacity: 0.7, marginBottom: '1rem' }}>
                        Attendez qu'il se reconnecte ou quittez la partie.
                    </p>
                    <button onClick={handleLeaveGame}>
                        Retour au lobby
                    </button>
                </div>
            </div>
        );
    }

    if (!isInitialized || !gameState) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Chargement de la partie...</p>
                <p style={{ fontSize: '0.8em', opacity: 0.7 }}>
                    {isConnected ? (isHost ? "Création de la partie..." : "Synchronisation...") : "Connexion au serveur..."}
                </p>
                {!isHost && isConnected && (
                    <button
                        onClick={() => sendAction({ type: 'ask_initial_state', payload: {} })}
                        className={styles.retryButton}
                    >
                        Forcer la synchronisation
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.multiplayerHeader}>
                <span className={styles.connectionIndicator}>
                    <span className={`${styles.dot} ${isConnected ? styles.connected : styles.disconnected}`} />
                    {isConnected ? 'En ligne' : 'Déconnecté'}
                </span>
                <span className={styles.playerInfo}>
                    🌐 {isHost ? multiplayerData?.hostName : multiplayerData?.guestName} vs {isHost ? multiplayerData?.guestName : multiplayerData?.hostName}
                </span>
                <button className={styles.leaveButton} onClick={handleLeaveGame}>
                    ❌ Quitter
                </button>
            </div>

            <GameBoard onAction={(action) => {
                sendAction({
                    type: action.type,
                    payload: action.payload as Record<string, unknown>
                });

                setTimeout(() => {
                    const currentState = useGameStore.getState().gameState;
                    if (currentState) {
                        syncState(currentState as unknown as Record<string, unknown>);
                    }
                }, 50);
            }} />
        </div>
    );
}
