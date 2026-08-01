'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiplayer, GameStartData } from '@/hooks/useMultiplayer';
import { useGameStore } from '@/store/gameStore';
import { ALL_SPELLS } from '@/data/spells';
import GameBoard from '@/components/GameBoard/GameBoard';
import styles from './page.module.css';

export default function OnlineGamePage() {
    const router = useRouter();
    const {
        isConnected,
        syncedState,
        opponentDisconnected,
        error,
        clearError,
        sendAction,
        syncState,
        leaveGame,
        resumeGame,
    } = useMultiplayer();

    const {
        gameState,
        initGame,
    } = useGameStore();

    const [isInitialized, setIsInitialized] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [multiplayerData, setMultiplayerData] = useState<GameStartData | null>(null);
    const [hasResumed, setHasResumed] = useState(false);

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

    // Reprendre la session (gameId+token+isHost persistés par la page précédente) : plus de
    // poignée de main serveur nécessaire, l'état vit dans Postgres — un rechargement de page ou
    // une micro-coupure réseau n'a besoin que de se réabonner, ce que le hook rattrape déjà tout
    // seul (voir attachToGame) à chaque reconnexion du canal Realtime.
    useEffect(() => {
        if (!hasResumed && multiplayerData) {
            const gameId = sessionStorage.getItem('gameId');
            const token = sessionStorage.getItem('multiplayerToken');
            const isHostFlag = sessionStorage.getItem('isHost') === 'true';
            if (gameId && token) {
                resumeGame(gameId, token, isHostFlag);
                setHasResumed(true);
            }
        }
    }, [hasResumed, multiplayerData, resumeGame]);

    // Initialiser la partie : l'hôte construit l'état initial et l'écrit une fois dans Postgres ;
    // le suiveur attend simplement que syncedState (alimenté par Realtime) contienne cet état —
    // plus besoin de sonder le serveur toutes les secondes comme avant (ask_initial_state a
    // disparu, l'état étant maintenant lu directement depuis la ligne de la partie).
    useEffect(() => {
        if (!multiplayerData || isInitialized) return;

        if (isHost) {
            const myGods = multiplayerData.hostGods;
            const opponentGods = multiplayerData.guestGods;

            const myDeck = ALL_SPELLS.filter(spell => myGods.some(god => god.id === spell.godId));
            const opponentDeck = ALL_SPELLS.filter(spell => opponentGods.some(god => god.id === spell.godId));

            const imFirst = multiplayerData.firstPlayer === 'host';

            initGame(myGods, myDeck, opponentGods, opponentDeck, imFirst, false, { isOnlineGame: true });
            setIsInitialized(true);

            const state = useGameStore.getState().gameState;
            sendAction({ type: 'sync_initial_state', payload: {} });
            syncState(state as unknown as Record<string, unknown>);
        } else if (syncedState) {
            useGameStore.getState().initWithState(syncedState as any, 'player2');
            setIsInitialized(true);
        }
    }, [multiplayerData, isHost, isInitialized, initGame, sendAction, syncState, syncedState]);

    // Appliquer les mises à jour d'état reçues après l'initialisation.
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
        sessionStorage.removeItem('multiplayerToken');
        sessionStorage.removeItem('opponentName');
        router.push('/online');
    };

    // Overlay d'erreur (partie introuvable — expirée, ou nettoyée après une trop longue coupure)
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
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.multiplayerHeader}>
                <span className={styles.connectionIndicator}>
                    <span className={`${styles.dot} ${isConnected ? styles.connected : styles.disconnected}`} />
                    {isConnected ? 'En ligne' : 'Reconnexion...'}
                </span>
                <span className={styles.playerInfo}>
                    🌐 {isHost ? multiplayerData?.hostName : multiplayerData?.guestName} vs {isHost ? multiplayerData?.guestName : multiplayerData?.hostName}
                </span>
                <button className={styles.leaveButton} onClick={handleLeaveGame}>
                    ❌ Quitter
                </button>
            </div>

            <GameBoard isOnlineMode onAction={(action) => {
                sendAction({
                    type: action.type as any,
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
