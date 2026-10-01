'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { GodCard } from '@/types/cards';
import { getSupabaseClient } from '@/services/supabase-realtime';
import type { LadderMode } from '@/data/ranks';

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
    /**
     * File d'attente des poussées d'état : chacune attend que la précédente ait abouti.
     *
     * Sans elle, deux poussées rapprochées partent en parallèle, et le serveur les traite en
     * lire-valider-écrire sans transaction : c'est la DERNIÈRE RÉPONSE ARRIVÉE qui l'emporte,
     * pas la dernière envoyée. Sur un réseau mobile lent, la poussée d'une carte jouée pouvait
     * atterrir après celle de la fin de tour et restaurer l'état d'avant — l'adversaire restait
     * alors bloqué au tour précédent pendant que le lanceur avait déjà avancé.
     */
    const syncQueueRef = useRef<Promise<void>>(Promise.resolve());
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

    /**
     * Rejoint la file d'attente.
     *
     * `ranked` dit si la partie COMPTE ; `mode` dit dans QUEL classement. Les deux se composent :
     * un Duel amical a mode='duel13' et ranked=false. Le mode sert aussi à l'appariement — on ne
     * croise que des joueurs du même, faute de quoi une équipe composée sous contrainte de
     * 13 points affronterait une équipe libre.
     */
    const joinQueue = useCallback(async (
        playerName: string,
        ranked: boolean = true,
        userId?: string,
        rating?: number,
        mode: LadderMode = 'ranked',
    ) => {
        const supabase = getSupabaseClient();
        const { data, error: insErr } = await supabase
            .from('matchmaking_queue')
            .insert({ player_name: playerName, rating: rating ?? 1000, ranked, mode, user_id: userId ?? null })
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

    /**
     * Référence vers refreshGame, pour que callFunction puisse l'appeler sans dépendre d'elle :
     * refreshGame a besoin de session(), que callFunction utilise aussi, et se déclarer
     * mutuellement créerait un cycle que TypeScript refuse.
     */
    const refreshGameRef = useRef<(() => void) | null>(null);

    /**
     * La session courante, avec repli sur `sessionStorage`.
     *
     * Les cinq actions qui parlent au serveur commençaient toutes par un `return` MUET quand les
     * références étaient vides. Or elles le sont tant que `resumeGame` n'a pas tourné — c'est-à-
     * dire pendant les premiers instants de chaque page, et à chaque reconnexion du canal. Le
     * joueur appuyait, entendait le son du bouton, et rien ne partait. Il réappuyait, toujours
     * rien, parce que les références étaient toujours vides : c'est ce qui bloquait la
     * confirmation d'équipe et le choix « je joue en premier ».
     *
     * Les identifiants sont pourtant là, dans `sessionStorage`, écrits par la page précédente.
     * Les références ne sont qu'un cache ; quand il est froid, on lit la source.
     */
    const session = useCallback((): { gameId: string; token: string } | null => {
        const gameId = gameIdRef.current ?? (typeof window !== 'undefined' ? sessionStorage.getItem('gameId') : null);
        const token = tokenRef.current ?? (typeof window !== 'undefined' ? sessionStorage.getItem('multiplayerToken') : null);
        return gameId && token ? { gameId, token } : null;
    }, []);

    /**
     * Appelle une fonction serveur et fait REMONTER l'échec.
     *
     * `functions.invoke` range une réponse non-2xx dans `error`, pas dans `data` : les appels qui
     * ne regardaient que `data.error` avalaient donc tous les refus du serveur. Un joueur à qui
     * `rps-decide` répondait « ce n'est pas le moment de décider » ne voyait strictement rien, et
     * sa partie ne démarrait jamais.
     */
    const callFunction = useCallback(async (
        name: string,
        body: Record<string, unknown>,
    ): Promise<{ ok: boolean; data?: Record<string, unknown> }> => {
        const current = session();
        if (!current) {
            setError('Session de partie introuvable. Revenez au salon et relancez une recherche.');
            return { ok: false };
        }

        const supabase = getSupabaseClient();
        const { data, error: fnErr } = await supabase.functions.invoke(name, {
            body: { ...body, gameId: current.gameId, token: current.token },
        });

        if (!fnErr) {
            const inBody = (data as { error?: string } | null)?.error;
            if (inBody) { setError(inBody); return { ok: false, data: data ?? undefined }; }
            return { ok: true, data: data ?? undefined };
        }

        /*
         * « Edge Function returned a non-2xx status code » ne dit rien.
         *
         * C'est le message générique de supabase-js : sur une réponse non-2xx, il n'ouvre pas le
         * corps, où se trouve pourtant la raison écrite par la fonction (« Jeton invalide », « Ce
         * n'est pas le moment de décider »…). Sans elle, le joueur voit une phrase anglaise
         * inutile et moi je n'ai rien pour diagnostiquer. On va donc la chercher.
         */
        let reason = fnErr.message;
        const response = (fnErr as { context?: unknown }).context;
        if (response instanceof Response) {
            try {
                const body = await response.clone().json();
                if (body?.error) reason = String(body.error);
            } catch {
                try {
                    const text = (await response.clone().text()).trim();
                    if (text) reason = text.slice(0, 200);
                } catch { /* corps illisible : on garde le message générique */ }
            }
        }

        // Le nom de la fonction reste affiché : c'est ce qui permet de dire au premier coup d'œil
        // QUELLE étape a refusé, sans avoir à reproduire le scénario.
        setError(`${name} : ${reason}`);

        // Un refus signale presque toujours que l'écran est en retard sur la partie : on relit.
        refreshGameRef.current?.();
        return { ok: false, data: data ?? undefined };
    }, [session]);

    /**
     * Relit la partie et se recale dessus.
     *
     * Appelée après tout refus du serveur. Un refus veut presque toujours dire la même chose :
     * la partie a avancé sans que cet écran s'en aperçoive — une notification Realtime manquée,
     * un onglet réveillé, une page montée au mauvais moment. « Ce n'est pas le moment de
     * décider » signifie littéralement que le serveur n'est plus à l'étape que l'écran affiche.
     *
     * Sans ce rattrapage, le joueur restait devant des boutons périmés et pouvait cliquer
     * indéfiniment : chaque clic reposait la même question à un serveur qui avait déjà répondu.
     */
    const refreshGame = useCallback(async () => {
        const current = session();
        if (!current) return;
        const supabase = getSupabaseClient();
        const { data } = await supabase
            .from('games')
            .select('*')
            .eq('id', current.gameId)
            .single();
        if (data) applyGameRow(data as GameRow);
    }, [session, applyGameRow]);

    // Affectation dans un effet et non pendant le rendu : écrire une référence pendant le rendu
    // est interdit en rendu concurrent, et la règle de lint le signale à juste titre.
    useEffect(() => { refreshGameRef.current = refreshGame; }, [refreshGame]);

    const selectGods = useCallback(
        (gods: GodCard[]) => callFunction('select-gods', { gods }).then(r => r.ok),
        [callFunction],
    );

    const sendAction = useCallback((action: GameAction) => {
        pendingActionRef.current = action;
    }, []);

    const syncState = useCallback(async (gameState: Record<string, unknown>) => {
        const current = session();
        if (!current) { setError('Session de partie introuvable.'); return; }

        // L'action est prélevée TOUT DE SUITE, pas au moment où la requête partira : entre-temps
        // une autre action aurait pu écraser la référence, et on enverrait alors l'état d'une
        // action avec l'étiquette d'une autre.
        const action = pendingActionRef.current;
        pendingActionRef.current = null;
        const { gameId, token } = current;

        const run = async () => {
            const supabase = getSupabaseClient();
            const { data, error: fnErr } = await supabase.functions.invoke('sync-game-state', {
                body: { gameId, token, action, gameState },
            });
            if (fnErr) {
                setError(fnErr.message);
                return;
            }
            if (data?.ok === false) {
                // Le serveur a refusé : nos deux états ont divergé. Le recharger est la seule
                // issue — sans ça le client reste sur une version que personne d'autre ne voit.
                setError(data.reason || 'Action refusée');
                const supabase2 = getSupabaseClient();
                const { data: fresh } = await supabase2
                    .from('games').select('*').eq('id', gameId).single();
                if (fresh) applyGameRow(fresh as GameRow);
            }
        };

        // Chaînage : la poussée suivante n'est émise qu'une fois celle-ci terminée, pour que
        // l'ordre d'arrivée côté serveur soit l'ordre d'émission.
        syncQueueRef.current = syncQueueRef.current.then(run, run);
        return syncQueueRef.current;
    }, [applyGameRow, session]);

    // Signale la fin de partie (déclenchée localement dès que le moteur passe en 'finished') pour
    // que le résultat soit persisté (Ferveur/stats/historique) côté serveur. Les deux clients le
    // détectent indépendamment et appellent ceci -- l'Edge Function ne traite que le premier appel.
    const reportMatchResult = useCallback(
        (didIWin: boolean, godsUsed: string[] = []) =>
            callFunction('report-match-result', { didIWin, godsUsed }).then(r => r.ok),
        [callFunction],
    );

    /**
     * Réclame la victoire après l'absence prolongée de l'adversaire.
     *
     * Le serveur décide seul (voir `claim_abandon_victory`) : ici on ne fait que demander. Un
     * refus est le cas NORMAL — l'adversaire est revenu, ou c'est à nous d'agir — donc rien
     * n'est signalé au joueur, et l'écran d'attente reste tel quel.
     */
    const claimAbandonVictory = useCallback(async (): Promise<boolean> => {
        if (!gameIdRef.current || !tokenRef.current) return false;
        try {
            const supabase = getSupabaseClient();
            const { data } = await supabase.functions.invoke('claim-abandon-victory', {
                body: { gameId: gameIdRef.current, token: tokenRef.current },
            });
            return !!(data as { success?: boolean } | null)?.success;
        } catch {
            return false;
        }
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

    const sendRpsChoice = useCallback(
        (choice: RpsChoice) => callFunction('rps-choice', { choice }).then(r => r.ok),
        [callFunction],
    );

    const sendRpsDecision = useCallback(
        (goFirst: boolean) => callFunction('rps-decide', { goFirst }).then(r => r.ok),
        [callFunction],
    );

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
        claimAbandonVictory,
        refreshGame,
        leaveGame,
    };
}
