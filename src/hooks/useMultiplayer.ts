'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { GodCard } from '@/types/cards';
import { getSocket } from '@/services/socket';

export interface MultiplayerGame {
    gameId: string;
    hostName: string;
    guestName?: string;
    status: 'waiting' | 'selecting' | 'rps' | 'rps_deciding' | 'playing' | 'finished';
    isHost: boolean;
}

export interface QueueStatus {
    position: number;
    total: number;
}

export interface GameStartData {
    hostGods: GodCard[];
    guestGods: GodCard[];
    hostName: string;
    guestName: string;
    firstPlayer: 'host' | 'guest';
    rpsWinner?: 'host' | 'guest';
}

export interface GameAction {
    type: 'play_card' | 'discard' | 'end_turn' | 'select_target' | 'select_element' | 'confirm_selection' | 'sync_initial_state' | 'ask_initial_state';
    payload: Record<string, unknown>;
}

export type RpsChoice = 'rock' | 'paper' | 'scissors';

export interface RpsResult {
    hostChoice: RpsChoice;
    guestChoice: RpsChoice;
    result: 'host_wins' | 'guest_wins' | 'draw';
}

export function useMultiplayer() {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [currentGame, setCurrentGame] = useState<MultiplayerGame | null>(null);
    const [availableGames, setAvailableGames] = useState<{ id: string; hostName: string }[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [opponentReady, setOpponentReady] = useState(false);
    const [gameStartData, setGameStartData] = useState<GameStartData | null>(null);
    const [lastAction, setLastAction] = useState<GameAction | null>(null);
    const [syncedState, setSyncedState] = useState<Record<string, unknown> | null>(null);
    const [opponentDisconnected, setOpponentDisconnected] = useState(false);

    // Nouveaux états pour le matchmaking
    const [isInQueue, setIsInQueue] = useState(false);
    const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
    const [opponentName, setOpponentName] = useState<string | null>(null);

    // États pour Pierre-Feuille-Ciseaux
    const [rpsPhase, setRpsPhase] = useState<'waiting' | 'choosing' | 'result' | 'deciding' | null>(null);
    const [rpsResult, setRpsResult] = useState<RpsResult | null>(null);
    const [opponentChoseRps, setOpponentChoseRps] = useState(false);
    const [isRpsWinner, setIsRpsWinner] = useState(false);

    // Connexion au serveur
    useEffect(() => {
        const socket = getSocket();
        socketRef.current = socket;

        if (socket.connected) {
            setIsConnected(true);
        }

        const onConnect = () => {
            setIsConnected(true);
            setError(null);
            console.log('Connecté au serveur');
        };

        const onDisconnect = () => {
            setIsConnected(false);
            setIsInQueue(false);
            console.log('Déconnecté du serveur');
        };

        const onConnectError = (err: Error) => {
            setError(`Erreur de connexion: ${err.message}`);
            setIsInQueue(false);
        };

        // Matchmaking events
        const onQueueJoined = (data: QueueStatus) => {
            setIsInQueue(true);
            setQueueStatus(data);
        };

        const onQueueStatus = (data: QueueStatus) => {
            setQueueStatus(data);
        };

        const onQueueLeft = () => {
            setIsInQueue(false);
            setQueueStatus(null);
        };

        const onMatchFound = (data: { gameId: string; isHost: boolean; opponentName: string }) => {
            setIsInQueue(false);
            setQueueStatus(null);
            setOpponentName(data.opponentName);
            setCurrentGame({
                gameId: data.gameId,
                hostName: data.isHost ? '' : data.opponentName,
                guestName: data.isHost ? data.opponentName : '',
                status: 'selecting',
                isHost: data.isHost
            });
        };

        // Événements de partie
        const onGameCreated = (data: { gameId: string; isHost: boolean }) => {
            setCurrentGame({
                gameId: data.gameId,
                hostName: '',
                status: 'waiting',
                isHost: data.isHost
            });
        };

        const onPlayerJoined = (data: { hostName: string; guestName: string; status: string }) => {
            setCurrentGame(prev => prev ? {
                ...prev,
                hostName: data.hostName,
                guestName: data.guestName,
                status: data.status as MultiplayerGame['status']
            } : null);
        };

        const onOpponentSelected = () => {
            setOpponentReady(true);
        };

        const onGameStart = (data: GameStartData) => {
            console.log('Game Start Received!', data);
            setGameStartData(data);
            setCurrentGame(prev => prev ? { ...prev, status: 'playing' } : null);
        };

        const onGameAction = (action: GameAction) => {
            setLastAction(action);
        };

        const onSyncState = (data: { gameState: Record<string, unknown> }) => {
            setSyncedState(data.gameState);
        };

        const onPlayerDisconnected = () => {
            setOpponentDisconnected(true);
        };

        const onOpponentReconnected = () => {
            setOpponentDisconnected(false);
        };

        const onOpponentLeft = () => {
            setOpponentDisconnected(true);
            setError("Votre adversaire a quitté la partie");
        };

        const onGamesList = (games: { id: string; hostName: string }[]) => {
            setAvailableGames(games);
        };

        const onError = (data: { message: string }) => {
            setError(data.message);
        };

        // ===== ÉVÉNEMENTS RPS =====
        const onRpsStart = () => {
            console.log('RPS Start!');
            setRpsPhase('choosing');
            setRpsResult(null);
            setOpponentChoseRps(false);
            setIsRpsWinner(false);
            setCurrentGame(prev => prev ? { ...prev, status: 'rps' } : null);
        };

        const onRpsOpponentChose = () => {
            setOpponentChoseRps(true);
        };

        const onRpsResult = (data: RpsResult) => {
            console.log('RPS Result:', data);
            setRpsResult(data);
            setRpsPhase('result');
            setOpponentChoseRps(false);

            // Déterminer si on est le gagnant (récupérer isHost depuis sessionStorage pour éviter les closures obsolètes)
            if (data.result !== 'draw') {
                const isHostFromStorage = typeof window !== 'undefined' && sessionStorage.getItem('isHost') === 'true';
                const weWon = (isHostFromStorage && data.result === 'host_wins') ||
                    (!isHostFromStorage && data.result === 'guest_wins');
                setIsRpsWinner(weWon);

                if (weWon) {
                    // On a gagné, on passe en phase de décision
                    setTimeout(() => {
                        setRpsPhase('deciding');
                        setCurrentGame(prev => prev ? { ...prev, status: 'rps_deciding' } : null);
                    }, 2500);
                }
            } else {
                // Égalité - recommencer après un délai
                setTimeout(() => {
                    setRpsPhase('choosing');
                    setRpsResult(null);
                }, 2500);
            }
        };

        const onRejoined = (data: { gameId: string; isHost: boolean; status: string; gameState?: Record<string, unknown> }) => {
            console.log('Rejoined game:', data);
            setCurrentGame({
                gameId: data.gameId,
                hostName: '',
                status: data.status as MultiplayerGame['status'],
                isHost: data.isHost
            });
            if (data.gameState) {
                setSyncedState(data.gameState);
            }
        };

        // Attacher les écouteurs
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);
        socket.on('queue_joined', onQueueJoined);
        socket.on('queue_status', onQueueStatus);
        socket.on('queue_left', onQueueLeft);
        socket.on('match_found', onMatchFound);
        socket.on('game_created', onGameCreated);
        socket.on('player_joined', onPlayerJoined);
        socket.on('opponent_selected', onOpponentSelected);
        socket.on('game_start', onGameStart);
        socket.on('game_action', onGameAction);
        socket.on('sync_state', onSyncState);
        socket.on('player_disconnected', onPlayerDisconnected);
        socket.on('opponent_reconnected', onOpponentReconnected);
        socket.on('opponent_left', onOpponentLeft);
        socket.on('games_list', onGamesList);
        socket.on('error', onError);
        socket.on('rejoined', onRejoined);
        // RPS events
        socket.on('rps_start', onRpsStart);
        socket.on('rps_opponent_chose', onRpsOpponentChose);
        socket.on('rps_result', onRpsResult);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
            socket.off('queue_joined', onQueueJoined);
            socket.off('queue_status', onQueueStatus);
            socket.off('queue_left', onQueueLeft);
            socket.off('match_found', onMatchFound);
            socket.off('game_created', onGameCreated);
            socket.off('player_joined', onPlayerJoined);
            socket.off('opponent_selected', onOpponentSelected);
            socket.off('game_start', onGameStart);
            socket.off('game_action', onGameAction);
            socket.off('sync_state', onSyncState);
            socket.off('player_disconnected', onPlayerDisconnected);
            socket.off('opponent_reconnected', onOpponentReconnected);
            socket.off('opponent_left', onOpponentLeft);
            socket.off('games_list', onGamesList);
            socket.off('error', onError);
            socket.off('rejoined', onRejoined);
            // RPS cleanup
            socket.off('rps_start', onRpsStart);
            socket.off('rps_opponent_chose', onRpsOpponentChose);
            socket.off('rps_result', onRpsResult);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // =====================================
    // MATCHMAKING
    // =====================================

    const joinQueue = useCallback((playerName: string, rating?: number) => {
        if (socketRef.current) {
            socketRef.current.emit('join_queue', { playerName, rating });
        }
    }, []);

    const leaveQueue = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.emit('leave_queue');
        }
    }, []);

    // =====================================
    // PARTIES PRIVÉES
    // =====================================

    const createPrivateGame = useCallback((playerName: string) => {
        if (socketRef.current) {
            socketRef.current.emit('create_private_game', { playerName });
        }
    }, []);

    const joinPrivateGame = useCallback((gameId: string, playerName: string) => {
        if (socketRef.current) {
            socketRef.current.emit('join_private_game', { gameId, playerName });
            setCurrentGame({
                gameId,
                hostName: '',
                status: 'selecting',
                isHost: false
            });
        }
    }, []);

    // =====================================
    // ANCIENNES FONCTIONS (compatibilité)
    // =====================================

    const createGame = useCallback((playerName: string) => {
        createPrivateGame(playerName);
    }, [createPrivateGame]);

    const joinGame = useCallback((gameId: string, playerName: string) => {
        joinPrivateGame(gameId, playerName);
    }, [joinPrivateGame]);

    const refreshGames = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.emit('list_games');
        }
    }, []);

    // =====================================
    // GAMEPLAY
    // =====================================

    const selectGods = useCallback((gods: GodCard[]) => {
        if (socketRef.current) {
            socketRef.current.emit('select_gods', { gods });
        }
    }, []);

    const sendAction = useCallback((action: GameAction) => {
        if (socketRef.current) {
            socketRef.current.emit('game_action', action);
        }
    }, []);

    const syncState = useCallback((gameState: Record<string, unknown>) => {
        if (socketRef.current) {
            socketRef.current.emit('sync_state', { gameState });
        }
    }, []);

    const leaveGame = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.emit('leave_game');
        }
        setCurrentGame(null);
        setGameStartData(null);
        setOpponentReady(false);
        setOpponentDisconnected(false);
        setOpponentName(null);
    }, []);

    const rejoinGame = useCallback((gameId: string, playerName: string) => {
        if (socketRef.current) {
            socketRef.current.emit('rejoin_game', { gameId, playerName });
        }
    }, []);

    const clearLastAction = useCallback(() => {
        setLastAction(null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // =====================================
    // PIERRE-FEUILLE-CISEAUX
    // =====================================

    const sendRpsChoice = useCallback((choice: RpsChoice) => {
        if (socketRef.current) {
            socketRef.current.emit('rps_choice', { choice });
        }
    }, []);

    const sendRpsDecision = useCallback((goFirst: boolean) => {
        if (socketRef.current) {
            socketRef.current.emit('rps_decide', { goFirst });
        }
    }, []);

    return {
        // États de connexion
        isConnected,
        error,
        clearError,

        // Matchmaking
        isInQueue,
        queueStatus,
        joinQueue,
        leaveQueue,

        // Partie
        currentGame,
        opponentName,
        opponentReady,
        gameStartData,
        lastAction,
        syncedState,
        opponentDisconnected,

        // RPS
        rpsPhase,
        rpsResult,
        opponentChoseRps,
        isRpsWinner,
        sendRpsChoice,
        sendRpsDecision,

        // Actions
        createGame,
        createPrivateGame,
        joinGame,
        joinPrivateGame,
        availableGames,
        refreshGames,
        selectGods,
        sendAction,
        syncState,
        leaveGame,
        rejoinGame,
        clearLastAction,
    };
}

