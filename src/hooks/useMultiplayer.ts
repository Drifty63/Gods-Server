'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { GodCard } from '@/types/cards';
import { getSupabaseClient } from '@/services/supabase-realtime';

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
    type: 'play_card' | 'discard' | 'end_turn' | 'select_target' | 'select_element' | 'confirm_selection' | 'sync_initial_state' | 'ask_initial_state' | 'game_over' | 'zombie_resurrect' | 'shuffle_god_cards';
    payload: Record<string, unknown>;
}

export type RpsChoice = 'rock' | 'paper' | 'scissors';

export interface RpsResult {
    hostChoice: RpsChoice;
    guestChoice: RpsChoice;
    result: 'host_wins' | 'guest_wins' | 'draw';
}

interface GameRow {
    id: string;
    status: MultiplayerGame['status'];
    host_name: string;
    guest_name: string | null;
    host_gods: GodCard[] | null;
    guest_gods: GodCard[] | null;
    rps_host_chosen: boolean;
    rps_guest_chosen: boolean;
    rps_result: RpsResult | null;
    rps_winner: 'host' | 'guest' | null;
    first_player: 'host' | 'guest' | null;
    game_state: Record<string, unknown> | null;
}

const QUEUE_HEARTBEAT_MS = 15000;
const RPS_REVEAL_MS = 2500;

/**
 * Couche multijoueur : remplace l'ancien transport Socket.io par Supabase (Postgres + Realtime
 * + Edge Functions). L'API publique retournée par ce hook reste volontairement proche de
 * l'ancienne (mêmes noms de champs/fonctions) pour que les pages /online/* n'aient besoin que
 * de changements ciblés plutôt que d'une réécriture complète — voir le plan de migration.
 */
export function useMultiplayer() {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentGame, setCurrentGame] = useState<MultiplayerGame | null>(null);
    const [opponentName, setOpponentName] = useState<string | null>(null);
    const [opponentReady, setOpponentReady] = useState(false);
    const [gameStartData, setGameStartData] = useState<GameStartData | null>(null);
    const [syncedState, setSyncedState] = useState<Record<string, unknown> | null>(null);
    const [opponentDisconnected, setOpponentDisconnected] = useState(false);

    const [isInQueue, setIsInQueue] = useState(false);
    const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);

    const [rpsPhase, setRpsPhase] = useState<'waiting' | 'choosing' | 'result' | 'deciding' | null>(null);
    const [rpsResult, setRpsResult] = useState<RpsResult | null>(null);
    const [opponentChoseRps, setOpponentChoseRps] = useState(false);
    const [isRpsWinner, setIsRpsWinner] = useState(false);

    // Identité de session courante : perdue à chaque changement de page (nouvelle instance du
    // hook), reconstruite via resumeGame() à partir de ce que la page a persisté (sessionStorage).
    const gameIdRef = useRef<string | null>(null);
    const tokenRef = useRef<string | null>(null);
    const isHostRef = useRef(false);
    const gameChannelRef = useRef<RealtimeChannel | null>(null);
    const queueIdRef = useRef<string | null>(null);
    const queueChannelRef = useRef<RealtimeChannel | null>(null);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pendingActionRef = useRef<GameAction | null>(null);
    const lastRpsRevealKeyRef = useRef<string | null>(null);

    const applyGameRow = useCallback((row: GameRow) => {
        const isHost = isHostRef.current;

        setCurrentGame({
            gameId: row.id,
            hostName: row.host_name || '',
            guestName: row.guest_name || undefined,
            status: row.status,
            isHost,
        });

        if (row.host_name && row.guest_name) {
            setOpponentName(isHost ? row.guest_name : row.host_name);
        }

        setOpponentReady(isHost ? !!row.guest_gods : !!row.host_gods);

        if (row.status === 'finished') {
            setOpponentDisconnected(true);
            setError((prev) => prev ?? "Votre adversaire a quitté la partie");
        }

        // Révélation RPS (victoire/défaite/égalité) : déclenchée quand rps_result change.
        const revealKey = row.rps_result ? `${row.status}:${JSON.stringify(row.rps_result)}` : null;
        if (revealKey && revealKey !== lastRpsRevealKeyRef.current) {
            lastRpsRevealKeyRef.current = revealKey;
            const result = row.rps_result as RpsResult;
            setRpsResult(result);
            setRpsPhase('result');
            setOpponentChoseRps(false);

            if (result.result === 'draw') {
                setTimeout(() => {
                    setRpsPhase('choosing');
                    setRpsResult(null);
                }, RPS_REVEAL_MS);
            } else {
                const weWon = row.rps_winner === (isHost ? 'host' : 'guest');
                setIsRpsWinner(weWon);
                if (weWon) {
                    setTimeout(() => setRpsPhase('deciding'), RPS_REVEAL_MS);
                }
            }
        } else if (row.status === 'rps') {
            setOpponentChoseRps(isHost ? !!row.rps_guest_chosen : !!row.rps_host_chosen);
            setRpsPhase((prev) => (prev === 'result' ? prev : 'choosing'));
        }

        if (row.status === 'playing' && row.host_gods && row.guest_gods && row.first_player) {
            setGameStartData({
                hostGods: row.host_gods,
                guestGods: row.guest_gods,
                hostName: row.host_name,
                guestName: row.guest_name || '',
                firstPlayer: row.first_player,
                rpsWinner: row.rps_winner || undefined,
            });
        }

        if (row.game_state) {
            setSyncedState(row.game_state);
        }
    }, []);

    const attachToGame = useCallback(async (gameId: string, token: string, isHost: boolean) => {
        const supabase = getSupabaseClient();
        gameIdRef.current = gameId;
        tokenRef.current = token;
        isHostRef.current = isHost;

        if (gameChannelRef.current) {
            supabase.removeChannel(gameChannelRef.current);
            gameChannelRef.current = null;
        }

        const { data: row, error: fetchErr } = await supabase
            .from('games')
            .select('*')
            .eq('id', gameId)
            .single();
        if (fetchErr) {
            setError('Partie introuvable');
            return;
        }
        applyGameRow(row as GameRow);

        const channel = supabase.channel(`game:${gameId}`);
        channel
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
                (payload) => applyGameRow(payload.new as GameRow)
            )
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const opponentSide = isHostRef.current ? 'guest' : 'host';
                const present = Object.values(state).some((entries) =>
                    (entries as Array<{ side?: string }>).some((p) => p.side === opponentSide)
                );
                setOpponentDisconnected(!present);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                    setError(null);
                    await channel.track({ side: isHostRef.current ? 'host' : 'guest' });
                    // Rattrapage : Supabase Realtime ne rejoue pas les événements manqués
                    // pendant une coupure réseau — cette relecture (déclenchée à CHAQUE
                    // (ré)abonnement, pas seulement le premier) rattrape un état qui aurait
                    // changé pendant que ce client était déconnecté.
                    const { data: freshRow } = await supabase
                        .from('games')
                        .select('*')
                        .eq('id', gameId)
                        .single();
                    if (freshRow) applyGameRow(freshRow as GameRow);
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    setIsConnected(false);
                }
            });

        gameChannelRef.current = channel;
    }, [applyGameRow]);

    const subscribeToQueue = useCallback((queueId: string) => {
        const supabase = getSupabaseClient();
        const channel = supabase.channel(`queue:${queueId}`);

        const handleQueueRow = async (row: { matched_game_id: string | null }) => {
            if (!row.matched_game_id) return;

            const { data } = await supabase.functions.invoke('claim-queue-token', {
                body: { queueId },
            });
            if (!data?.token) return;

            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }
            supabase.removeChannel(channel);
            queueChannelRef.current = null;
            queueIdRef.current = null;
            setIsInQueue(false);
            setQueueStatus(null);
            setOpponentName(data.isHost ? data.guestName || null : data.hostName || null);
            await attachToGame(data.gameId, data.token, data.isHost);
        };

        channel
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'matchmaking_queue', filter: `id=eq.${queueId}` },
                (payload) => handleQueueRow(payload.new as { matched_game_id: string | null })
            )
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Rattrapage : le trigger de pairage (try_pair_matchmaking) tourne de façon
                    // synchrone dans la MÊME transaction que l'INSERT qui vient de créer cette
                    // ligne -- pour le second joueur à rejoindre (celui dont l'INSERT déclenche
                    // l'appariement), le pairage peut donc déjà avoir eu lieu avant que cet
                    // abonnement Realtime n'existe, et l'UPDATE ne sera alors jamais reçu. Même
                    // pattern de rattrapage que attachToGame.
                    const { data: freshRow } = await supabase
                        .from('matchmaking_queue')
                        .select('matched_game_id')
                        .eq('id', queueId)
                        .single();
                    if (freshRow) await handleQueueRow(freshRow);
                }
            });
        queueChannelRef.current = channel;
    }, [attachToGame]);

    useEffect(() => {
        setIsConnected(true);
        return () => {
            const supabase = getSupabaseClient();
            if (gameChannelRef.current) supabase.removeChannel(gameChannelRef.current);
            if (queueChannelRef.current) supabase.removeChannel(queueChannelRef.current);
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        };
    }, []);

    // =====================================
    // MATCHMAKING
    // =====================================

    const joinQueue = useCallback(async (playerName: string, ranked: boolean = true, userId?: string, rating?: number) => {
        const supabase = getSupabaseClient();
        const { data, error: insErr } = await supabase
            .from('matchmaking_queue')
            .insert({ player_name: playerName, rating: rating ?? 1000, ranked, user_id: userId ?? null })
            .select()
            .single();
        if (insErr || !data) {
            setError(insErr?.message ?? "Erreur file d'attente");
            return;
        }
        queueIdRef.current = data.id;
        setIsInQueue(true);
        setQueueStatus({ position: 1, total: 1 });
        subscribeToQueue(data.id);
        heartbeatRef.current = setInterval(() => {
            supabase
                .from('matchmaking_queue')
                .update({ last_seen: new Date().toISOString() })
                .eq('id', data.id)
                .then();
        }, QUEUE_HEARTBEAT_MS);
    }, [subscribeToQueue]);

    const leaveQueue = useCallback(async () => {
        const supabase = getSupabaseClient();
        if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
        }
        if (queueChannelRef.current) {
            supabase.removeChannel(queueChannelRef.current);
            queueChannelRef.current = null;
        }
        if (queueIdRef.current) {
            await supabase.from('matchmaking_queue').delete().eq('id', queueIdRef.current);
            queueIdRef.current = null;
        }
        setIsInQueue(false);
        setQueueStatus(null);
    }, []);

    // =====================================
    // PARTIES PRIVÉES
    // =====================================

    const createPrivateGame = useCallback(async (playerName: string) => {
        const supabase = getSupabaseClient();
        const { data, error: fnErr } = await supabase.functions.invoke('create-private-game', {
            body: { playerName },
        });
        if (fnErr || !data?.gameId) {
            setError(data?.error ?? fnErr?.message ?? 'Erreur de création de partie');
            return;
        }
        await attachToGame(data.gameId, data.hostToken, true);
    }, [attachToGame]);

    const joinPrivateGame = useCallback(async (gameId: string, playerName: string) => {
        const supabase = getSupabaseClient();
        const { data, error: fnErr } = await supabase.functions.invoke('join-private-game', {
            body: { gameId, playerName },
        });
        if (fnErr || !data?.guestToken) {
            setError(data?.error ?? fnErr?.message ?? 'Impossible de rejoindre cette partie');
            return;
        }
        setOpponentName(data.hostName || null);
        await attachToGame(gameId, data.guestToken, false);
    }, [attachToGame]);

    // =====================================
    // REPRISE (remplace l'ancien rejoinGame) : réattache le hook à une session déjà en
    // cours après un changement de page, à partir de {gameId, token, isHost} persistés
    // côté page (sessionStorage) — plus de handshake serveur nécessaire, l'état vit dans
    // Postgres, pas dans la mémoire d'un process.
    // =====================================

    const resumeGame = useCallback(async (gameId: string, token: string, isHost: boolean) => {
        await attachToGame(gameId, token, isHost);
    }, [attachToGame]);

    // =====================================
    // GAMEPLAY
    // =====================================

    const selectGods = useCallback(async (gods: GodCard[]) => {
        if (!gameIdRef.current || !tokenRef.current) return;
        const supabase = getSupabaseClient();
        const { data, error: fnErr } = await supabase.functions.invoke('select-gods', {
            body: { gameId: gameIdRef.current, token: tokenRef.current, gods },
        });
        if (fnErr || data?.error) setError(data?.error ?? fnErr?.message ?? 'Erreur');
    }, []);

    const sendAction = useCallback((action: GameAction) => {
        pendingActionRef.current = action;
    }, []);

    const syncState = useCallback(async (gameState: Record<string, unknown>) => {
        if (!gameIdRef.current || !tokenRef.current) return;
        const supabase = getSupabaseClient();
        const action = pendingActionRef.current;
        pendingActionRef.current = null;
        const { data, error: fnErr } = await supabase.functions.invoke('sync-game-state', {
            body: { gameId: gameIdRef.current, token: tokenRef.current, action, gameState },
        });
        if (fnErr) {
            setError(fnErr.message);
            return;
        }
        if (data?.ok === false) {
            setError(data.reason || 'Action refusée');
        }
    }, []);

    // Signale la fin de partie (déclenchée localement dès que le moteur passe en 'finished') pour
    // que le résultat soit persisté (Ferveur/stats/historique) côté serveur. Les deux clients le
    // détectent indépendamment et appellent ceci -- l'Edge Function ne traite que le premier appel.
    const reportMatchResult = useCallback(async (didIWin: boolean, godsUsed: string[] = []) => {
        if (!gameIdRef.current || !tokenRef.current) return;
        const supabase = getSupabaseClient();
        await supabase.functions.invoke('report-match-result', {
            body: { gameId: gameIdRef.current, token: tokenRef.current, didIWin, godsUsed },
        });
    }, []);

    const leaveGame = useCallback(async () => {
        const supabase = getSupabaseClient();
        if (gameIdRef.current && tokenRef.current) {
            await supabase.functions.invoke('leave-game', {
                body: { gameId: gameIdRef.current, token: tokenRef.current },
            });
        }
        if (gameChannelRef.current) {
            supabase.removeChannel(gameChannelRef.current);
            gameChannelRef.current = null;
        }
        gameIdRef.current = null;
        tokenRef.current = null;
        isHostRef.current = false;
        setCurrentGame(null);
        setGameStartData(null);
        setOpponentReady(false);
        setOpponentDisconnected(false);
        setOpponentName(null);
        setSyncedState(null);
        setRpsPhase(null);
        setRpsResult(null);
    }, []);

    const clearError = useCallback(() => setError(null), []);

    const getSessionInfo = useCallback(() => ({
        gameId: gameIdRef.current,
        token: tokenRef.current,
        isHost: isHostRef.current,
    }), []);

    // =====================================
    // PIERRE-FEUILLE-CISEAUX
    // =====================================

    const sendRpsChoice = useCallback(async (choice: RpsChoice) => {
        if (!gameIdRef.current || !tokenRef.current) return;
        const supabase = getSupabaseClient();
        await supabase.functions.invoke('rps-choice', {
            body: { gameId: gameIdRef.current, token: tokenRef.current, choice },
        });
    }, []);

    const sendRpsDecision = useCallback(async (goFirst: boolean) => {
        if (!gameIdRef.current || !tokenRef.current) return;
        const supabase = getSupabaseClient();
        const { data } = await supabase.functions.invoke('rps-decide', {
            body: { gameId: gameIdRef.current, token: tokenRef.current, goFirst },
        });
        if (data?.error) setError(data.error);
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
        createPrivateGame,
        joinPrivateGame,
        resumeGame,
        // Identifiants de la session courante, à persister côté page (sessionStorage) pour
        // pouvoir appeler resumeGame() après un changement de page.
        getSessionInfo,
        selectGods,
        sendAction,
        syncState,
        reportMatchResult,
        leaveGame,
    };
}
