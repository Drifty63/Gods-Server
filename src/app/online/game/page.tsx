'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiplayer, GameStartData } from '@/hooks/useMultiplayer';
import { useGameStore } from '@/store/gameStore';
import type { GameState } from '@/types/cards';
import { ALL_SPELLS } from '@/data/spells';
import GameBoard from '@/components/GameBoard/GameBoard';
import { clearMultiplayerSession, RESUMED_KEY } from '@/lib/multiplayerSession';
import styles from './page.module.css';

/**
 * Sursis accordé à un adversaire déconnecté, en secondes.
 *
 * Doit rester aligné sur `abandon_delay_seconds()` en base, qui est l'autorité : si l'affichage
 * était plus court, le joueur verrait un décompte atteindre zéro sans que rien ne se passe.
 */
const ABANDON_DELAY_S = 90;

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
        claimAbandonVictory,
        currentGame,
        refreshGame,
    } = useMultiplayer();

    const {
        gameState,
        playerId,
        initGame,
    } = useGameStore();

    /**
     * Décompte d'abandon : une minute trente, remise à zéro dès que l'adversaire revient.
     *
     * Le décompte n'est qu'un MINUTEUR d'affichage. C'est le serveur qui accorde ou refuse la
     * victoire, et il refuse tant que l'adversaire a joué récemment — on peut donc demander sans
     * risque, y compris si l'horloge de ce téléphone est fausse.
     */
    const [confirmForfeit, setConfirmForfeit] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [multiplayerData, setMultiplayerData] = useState<GameStartData | null>(null);
    const [hasResumed, setHasResumed] = useState(false);
    const hasReportedResultRef = useRef(false);

    /*
     * Le SERVEUR a conclu la partie : l'écran doit suivre.
     *
     * Une victoire par abandon ne vit que dans la table `games` — le serveur y inscrit le statut
     * et le vainqueur sans toucher à `game_state`, qui est pourtant le seul canal par lequel le
     * plateau apprend quoi que ce soit. Le joueur resté voyait donc le décompte atteindre zéro,
     * lisait « Clôture de la partie… », et restait devant son combat et sa modale d'attente, sans
     * rien qui se ferme ni ne se rafraîchisse.
     */
    useEffect(() => {
        if (currentGame?.status !== 'finished') return;
        if (gameState?.status === 'finished') return;
        // La ligne doit désigner la partie actuellement chargée : celle du match précédent, encore
        // en mémoire du hook, conclurait la nouvelle avec l'ancien vainqueur.
        if (currentGame.gameId !== sessionStorage.getItem('gameId')) return;
        // Le camp est traduit en identifiant local : l'hôte est toujours player1.
        const winner = currentGame.winnerSide
            ? (currentGame.winnerSide === 'host' ? 'player1' : 'player2')
            : null;
        useGameStore.getState().finishFromServer(winner);
    }, [currentGame?.status, currentGame?.winnerSide, currentGame?.gameId, gameState?.status]);

    /*
     * Un seul minuteur, piloté par la présence de l'adversaire.
     *
     * Il repart de zéro à chaque retour : quelqu'un qui perd le réseau trois fois de suite ne
     * doit pas voir son sursis fondre, sinon une mauvaise connexion devient une défaite.
     */
    const [abandonSeconds, setAbandonSeconds] = useState(ABANDON_DELAY_S);
    const abandonClaimedRef = useRef(false);

    useEffect(() => {
        if (!opponentDisconnected || gameState?.status === 'finished') {
            abandonClaimedRef.current = false;
            return;
        }

        // L'échéance est une DATE et non un compteur décrémenté : le décompte reste juste même
        // si l'onglet passe en arrière-plan et que le navigateur espace ses minuteurs.
        const deadline = Date.now() + ABANDON_DELAY_S * 1000;

        const tick = async () => {
            setAbandonSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));

            /*
             * On relit la partie à CHAQUE seconde d'attente.
             *
             * Pendant que cet écran attend, la partie peut se terminer sans qu'aucune action n'y
             * mène : victoire par abandon accordée, ou adversaire forfait pour être revenu trois
             * fois. Ces décisions ne vivent que dans la table `games`, et le seul canal qui les
             * portait était une notification Realtime — celle-là même qui nous a déjà fait défaut
             * tout au long de ce débogage. C'est précisément l'écran où ne rien recevoir laisse
             * le joueur devant un décompte qui ne mène nulle part.
             */
            refreshGame();

            if (abandonClaimedRef.current || Date.now() < deadline) return;
            // Délai écoulé : on demande, le serveur tranche. Un refus laisse l'écran en l'état —
            // l'adversaire est revenu. Une seule demande, pas une par seconde.
            abandonClaimedRef.current = true;
            await claimAbandonVictory();
            // La victoire vient d'être inscrite côté serveur : on la relit tout de suite plutôt
            // que d'attendre le tick suivant, pour que l'écran de fin s'affiche sans délai.
            refreshGame();
        };

        // Premier affichage différé d'un tick : écrire l'état dans le corps de l'effet
        // déclencherait un rendu en cascade.
        const first = setTimeout(tick, 0);
        const timer = setInterval(tick, 1000);

        return () => { clearTimeout(first); clearInterval(timer); };
    }, [opponentDisconnected, gameState?.status, claimAbandonVictory, refreshGame]);

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

        /*
         * Partie REPRISE : on adopte l'état trouvé en base, on n'en fabrique pas un.
         *
         * Sans cette sortie, l'hôte qui rouvre l'application rejouerait `initGame` et
         * réécrirait une partie NEUVE par-dessus le combat en cours — pour lui comme pour son
         * adversaire. On attend simplement que Realtime livre `syncedState`.
         */
        if (sessionStorage.getItem(RESUMED_KEY) === 'true') {
            if (!syncedState) return;
            useGameStore.getState().initWithState(
                syncedState as unknown as GameState,
                isHost ? 'player1' : 'player2',
            );
            setIsInitialized(true);
            sessionStorage.removeItem(RESUMED_KEY);
            return;
        }

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
                    {/* Le décompte dit ce qui va se passer et quand. Sans lui, le joueur ne sait
                        pas s'il doit attendre dix secondes ou dix minutes, et il quitte. */}
                    <p className={styles.abandonCountdown}>
                        {abandonSeconds > 0
                            ? `Victoire par abandon dans ${abandonSeconds} s`
                            : 'Clôture de la partie…'}
                    </p>
                    <p style={{ fontSize: '0.8em', opacity: 0.7, marginBottom: '1rem' }}>
                        S&apos;il revient avant la fin du décompte, la partie reprend.
                    </p>
                    <button onClick={handleLeaveGame}>
                        Quitter maintenant
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
            {/* Une partie perdue ne se rattrape pas : on demande confirmation. Le texte dit ce
                qui se passe vraiment, y compris pour le classement. */}
            {confirmForfeit && (
                <div className={styles.disconnectedOverlay}>
                    <div className={styles.disconnectedModal}>
                        <h2>🏳️ Abandonner la partie ?</h2>
                        <p>Votre adversaire sera déclaré vainqueur et la partie comptera comme une défaite.</p>
                        <div className={styles.forfeitActions}>
                            <button onClick={() => setConfirmForfeit(false)}>Continuer à jouer</button>
                            <button
                                className={styles.forfeitConfirm}
                                onClick={() => { setConfirmForfeit(false); handleLeaveGame(); }}
                            >
                                Abandonner
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.multiplayerHeader}>
                <span className={styles.connectionIndicator}>
                    <span className={`${styles.dot} ${isConnected ? styles.connected : styles.disconnected}`} />
                    {isConnected ? 'En ligne' : 'Reconnexion...'}
                </span>
                <span className={styles.playerInfo}>
                    🌐 {isHost ? multiplayerData?.hostName : multiplayerData?.guestName} vs {isHost ? multiplayerData?.guestName : multiplayerData?.hostName}
                </span>
                {/* « Abandonner » et non « Quitter » : ce bouton déclare l'adversaire vainqueur
                    (voir leave-game) et la partie est perdue, classement compris. Il disait
                    « quitter », comme s'il s'agissait de fermer une fenêtre. */}
                <button className={styles.leaveButton} onClick={() => setConfirmForfeit(true)}>
                    🏳️ Abandonner
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
