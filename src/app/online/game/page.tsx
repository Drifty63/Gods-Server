'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiplayer, GameStartData } from '@/hooks/useMultiplayer';
import { useGameStore } from '@/store/gameStore';
import type { GameState } from '@/types/cards';
import { ALL_SPELLS } from '@/data/spells';
import GameBoard from '@/components/GameBoard/GameBoard';
import { clearMultiplayerSession } from '@/lib/multiplayerSession';
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
        reportMatchResult,
        leaveGame,
        resumeGame,
    } = useMultiplayer();

    const {
        gameState,
        playerId,
        initGame,
    } = useGameStore();

    const [isInitialized, setIsInitialized] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [multiplayerData, setMultiplayerData] = useState<GameStartData | null>(null);
    const [hasResumed, setHasResumed] = useState(false);
    const hasReportedResultRef = useRef(false);

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
            useGameStore.getState().initWithState(syncedState as unknown as GameState, 'player2');
            setIsInitialized(true);
        }
    }, [multiplayerData, isHost, isInitialized, initGame, sendAction, syncState, syncedState]);

    // Appliquer les mises à jour d'état reçues après l'initialisation.
    useEffect(() => {
        if (syncedState && isInitialized) {
            useGameStore.getState().syncGameState(syncedState as unknown as GameState);
        }
    }, [syncedState, isInitialized]);

    // Fin de partie : signaler le résultat une seule fois (Ferveur/stats/historique côté
    // serveur, voir apply_match_result). Les deux clients détectent 'finished' indépendamment
    // via l'état synchronisé -- le ref local évite un double appel depuis CE client, et
    // report-match-result gère lui-même la course entre les deux clients.
    useEffect(() => {
        if (gameState?.status === 'finished' && !hasReportedResultRef.current) {
            hasReportedResultRef.current = true;
            const myGodsCast = gameState.players.find(p => p.id === playerId)?.godsCastThisMatch ?? [];
            reportMatchResult(gameState.winnerId === playerId, myGodsCast);
        }
    }, [gameState?.status, gameState?.winnerId, playerId, reportMatchResult]);

    /** Abandon EN COURS de partie : déclare forfait, puis nettoie. */
    const handleLeaveGame = () => {
        leaveGame();
        clearMultiplayerSession();
        router.push('/online');
    };

    /**
     * Sortie APRÈS la fin de partie.
     *
     * Surtout pas de `leaveGame()` ici : il n'y a plus rien à abandonner, et ce serait annoncer
     * un forfait sur une partie déjà conclue. On note le mode AVANT de nettoyer, sinon on le
     * lirait effacé et on renverrait tout le monde au même endroit.
     */
    const handleExitFinished = () => {
        const wasDuel = sessionStorage.getItem('gameMode') === 'duel';
        clearMultiplayerSession();
        router.push(wasDuel ? '/duel' : '/online');
    };

    // Overlay d'erreur (partie introuvable — expirée, ou nettoyée après une trop longue coupure)
    if (error && error.includes('introuvable')) {
        return (
            <div className={styles.disconnectedOverlay}>
                <div className={styles.disconnectedModal}>
                    <h2>❌ Partie introuvable</h2>
                    <p>La partie a expiré ou n&apos;existe plus.</p>
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

    // Partie TERMINÉE : l'adversaire qui s'en va ne « se déconnecte » pas, il rentre chez lui.
    // Cette garde remplaçait l'écran de victoire/défaite au bout d'une poignée de secondes,
    // le temps que la présence de l'autre client retombe — le joueur n'avait pas le temps de
    // voir son propre résultat.
    if (opponentDisconnected && gameState?.status !== 'finished') {
        return (
            <div className={styles.disconnectedOverlay}>
                <div className={styles.disconnectedModal}>
                    <h2>😢 Adversaire déconnecté</h2>
                    <p>Votre adversaire a quitté la partie ou a été déconnecté.</p>
                    <p style={{ fontSize: '0.8em', opacity: 0.7, marginBottom: '1rem' }}>
                        Attendez qu&apos;il se reconnecte ou quittez la partie.
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

            <GameBoard isOnlineMode onExit={handleExitFinished} onAction={(action) => {
                sendAction({
                    type: action.type,
                    payload: action.payload ?? {}
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
