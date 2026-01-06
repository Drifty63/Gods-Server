'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiplayer, GameAction, GameStartData } from '@/hooks/useMultiplayer';
import { useGameStore } from '@/store/gameStore';
import { ALL_SPELLS } from '@/data/spells';
import GameBoard from '@/components/GameBoard/GameBoard';
import styles from './page.module.css';

export default function MultiplayerGamePage() {
    const router = useRouter();
    const {
        isConnected,
        lastAction,
        syncedState,
        opponentDisconnected,
        sendAction,
        syncState,
        clearLastAction,
        leaveGame,
        rejoinGame,
    } = useMultiplayer();

    const {
        gameState,
        initGame,
        playerId,
    } = useGameStore();

    const [isInitialized, setIsInitialized] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [multiplayerData, setMultiplayerData] = useState<GameStartData | null>(null);

    // Charger les données de session
    useEffect(() => {
        const dataStr = sessionStorage.getItem('multiplayerData');
        const hostStr = sessionStorage.getItem('isHost');

        if (!dataStr) {
            router.push('/multiplayer');
            return;
        }

        const data = JSON.parse(dataStr) as GameStartData;
        const host = hostStr === 'true';

        setMultiplayerData(data);
        setIsHost(host);
    }, [router]);

    // Tenter de se reconnecter au socket si on a les infos (après un refresh)
    useEffect(() => {
        if (isConnected && multiplayerData) {
            const gameId = sessionStorage.getItem('gameId');
            const playerName = sessionStorage.getItem('playerName');

            if (gameId && playerName) {
                // On tente de rejoindre la room socket
                rejoinGame(gameId, playerName);
            }
        }
    }, [isConnected, multiplayerData, rejoinGame]);

    // Initialiser la partie (Hôte) ou demander l'état (Invité)
    useEffect(() => {
        if (!multiplayerData) return;

        if (isHost && !isInitialized) {
            // --- LOGIQUE HÔTE ---
            const myGods = multiplayerData.hostGods;
            const opponentGods = multiplayerData.guestGods;

            // Créer les decks
            const myDeck = ALL_SPELLS.filter(spell => myGods.some(god => god.id === spell.godId));
            const opponentDeck = ALL_SPELLS.filter(spell => opponentGods.some(god => god.id === spell.godId));

            const imFirst = multiplayerData.firstPlayer === 'host';

            // Initialiser localement avec les noms des joueurs
            initGame(
                myGods,
                myDeck,
                opponentGods,
                opponentDeck,
                imFirst,
                false, // Mode multijoueur
                {
                    isOnlineGame: true,
                    player1Name: multiplayerData.hostName || 'Joueur 1',
                    player2Name: multiplayerData.guestName || 'Joueur 2'
                }
            );

            // Marquer comme initialisé
            setIsInitialized(true);

            // Annoncer qu'on est prêt en envoyant l'état
            const state = useGameStore.getState().gameState;
            sendAction({
                type: 'sync_initial_state',
                payload: { state: state as unknown as Record<string, unknown> }
            });

        } else if (!isHost && !isInitialized) {
            // --- LOGIQUE INVITÉ ---
            // Demander l'état à l'hôte périodiquement tant qu'on n'est pas initialisé
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
                    // L'invité demande l'état. Si je suis l'hôte et initialisé, je l'envoie.
                    if (isHost && isInitialized && gameState) {
                        sendAction({
                            type: 'sync_initial_state',
                            payload: { state: gameState as unknown as Record<string, unknown> }
                        });
                    }
                    break;

                case 'sync_initial_state':
                    // Je reçois l'état initial (je suis l'invité)
                    if (!isHost && !isInitialized && multiplayerData) {
                        const receivedState = lastAction.payload.state as any; // GameState
                        const myPlayerId = 'player2';

                        // Initialiser avec l'état reçu
                        useGameStore.getState().initWithState(receivedState, myPlayerId);
                        setIsInitialized(true);
                    }
                    else if (!isHost && isInitialized && multiplayerData) {
                        // Déjà initialisé, mais on a reçu un sync_initial_state (peut-être après un refresh de l'hôte)
                        // On pourrait choisir de se resynchroniser ici si on voulait gérer le refresh de l'hôte
                    }
                    break;

                // Les actions play_card, discard, end_turn sont ignorées ici
                // car on synchronise l'état complet via syncedState
                // Cela évite les bugs de double-tick des effets temporaires
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

    // Appliquer l'état synchronisé reçu de l'adversaire
    useEffect(() => {
        if (syncedState && isInitialized) {
            // Mettre à jour notre état local avec celui reçu
            useGameStore.getState().syncGameState(syncedState as any);
        }
    }, [syncedState, isInitialized]);



    const handleLeaveGame = () => {
        leaveGame();
        sessionStorage.removeItem('multiplayerData');
        sessionStorage.removeItem('isHost');
        router.push('/multiplayer');
    };

    if (opponentDisconnected) {
        return (
            <div className={styles.disconnectedOverlay}>
                <div className={styles.disconnectedModal}>
                    <h2>😢 Adversaire déconnecté</h2>
                    <p>Votre adversaire a quitté la partie</p>
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
                    {isConnected ? (isHost ? "Création de la partie..." : "Synchronisation avec l'hôte...") : "Connexion au serveur..."}
                </p>
                {!isHost && isConnected && (
                    <button
                        onClick={() => sendAction({ type: 'ask_initial_state', payload: {} })}
                        className={styles.retryButton}
                        style={{ marginTop: '20px', padding: '10px 20px', background: '#4a4a4a', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
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
                    {isConnected ? 'Connecté' : 'Déconnecté'}
                </span>
                <span className={styles.playerInfo}>
                    {isHost ? multiplayerData?.hostName : multiplayerData?.guestName} vs {isHost ? multiplayerData?.guestName : multiplayerData?.hostName}
                </span>
                <button className={styles.leaveButton} onClick={handleLeaveGame}>
                    ❌ Quitter
                </button>
            </div>



            <GameBoard onAction={(action) => {
                // Envoyer l'action au serveur pour synchronisation
                sendAction({
                    type: action.type,
                    payload: action.payload as Record<string, unknown>
                });

                // Après l'action, synchroniser l'état complet du jeu
                // On utilise setTimeout pour s'assurer que l'état est mis à jour
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
