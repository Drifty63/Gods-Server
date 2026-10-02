'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiplayer, RpsChoice } from '@/hooks/useMultiplayer';
import styles from './page.module.css';

const CHOICES: { id: RpsChoice; emoji: string; name: string }[] = [
    { id: 'rock', emoji: '🪨', name: 'Pierre' },
    { id: 'paper', emoji: '📄', name: 'Feuille' },
    { id: 'scissors', emoji: '✂️', name: 'Ciseaux' },
];

export default function OnlineRpsPage() {
    const router = useRouter();
    const {
        isConnected,
        error,
        clearError,
        currentGame,
        opponentName,
        rpsPhase,
        rpsResult,
        opponentChoseRps,
        isRpsWinner,
        gameStartData,
        sendRpsChoice,
        sendRpsDecision,
        resumeGame,
        refreshGame,
    } = useMultiplayer();

    const [hasChosen, setHasChosen] = useState(false);
    const [myChoice, setMyChoice] = useState<RpsChoice | null>(null);
    const [hasRejoined, setHasRejoined] = useState(false);

    // Reprendre la session au chargement (gameId+token+isHost persistés par la page précédente)
    useEffect(() => {
        if (isConnected && !hasRejoined) {
            const gameId = sessionStorage.getItem('gameId');
            const token = sessionStorage.getItem('multiplayerToken');
            const isHost = sessionStorage.getItem('isHost') === 'true';

            if (gameId && token) {
                resumeGame(gameId, token, isHost);
                setHasRejoined(true);
            } else {
                router.push('/online');
            }
        }
    }, [isConnected, hasRejoined, resumeGame, router]);

    /*
     * Le garde-fou « on ne redirige qu'une fois » est une RÉFÉRENCE, pas un état.
     *
     * C'était un `useState` listé dans les dépendances de l'effet qui le posait. Tant qu'il n'y
     * avait pas de nettoyage, ça passait. Mais j'ai ajouté `return () => clearTimeout(t)` pour
     * qu'un joueur quittant l'écran ne soit pas ramené de force sur le plateau — et cet ajout a
     * fermé le piège : poser l'état changeait les dépendances, React exécutait le nettoyage du
     * passage précédent, donc ANNULAIT le minuteur de navigation, puis relançait l'effet qui
     * sortait aussitôt puisque le drapeau était désormais levé.
     *
     * Résultat : la décision partait bien, le serveur démarrait la partie, et l'écran du
     * pierre-feuille-ciseaux ne bougeait plus jamais. Une référence ne déclenche pas de rendu,
     * donc l'effet ne se rejoue pas et le minuteur va à son terme.
     */
    const hasRedirectedRef = useRef(false);
    /** Navigation programmée vers le plateau, annulée seulement au démontage (voir plus bas). */
    const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Rediriger vers le jeu quand la partie commence
    useEffect(() => {
        if (!gameStartData || hasRedirectedRef.current) return;
        hasRedirectedRef.current = true;

        // S'assurer que isHost est bien sauvegardé avant la redirection
        if (currentGame?.isHost !== undefined) {
            sessionStorage.setItem('isHost', String(currentGame.isHost));
        }
        sessionStorage.setItem('multiplayerData', JSON.stringify(gameStartData));

        // Délai pour laisser le socket se synchroniser avant la redirection.
        redirectTimerRef.current = setTimeout(() => router.push('/online/game'), 1000);
    }, [gameStartData, router, currentGame?.isHost]);

    /*
     * La redirection n'est annulée QUE si l'on quitte l'écran.
     *
     * Son nettoyage vivait dans l'effet ci-dessus, et s'exécutait donc à chaque changement de
     * ses dépendances — pas seulement au démontage. Une simple mise à jour de la partie suffisait
     * à annuler la navigation programmée, que le drapeau « déjà redirigé » empêchait ensuite de
     * reprogrammer. C'est le défaut que j'avais cru corriger en passant ce drapeau en référence :
     * j'avais traité le drapeau, pas le nettoyage qui le contournait.
     */
    useEffect(() => () => {
        if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    }, []);

    /*
     * La partie a démarré mais `gameStartData` n'est pas arrivé.
     *
     * C'est exactement ce qui te bloquait : `rps-decide` avait réussi, le serveur était passé en
     * `playing`, et cet écran continuait d'afficher « Premier / Second » parce qu'il n'attendait
     * QUE `gameStartData`. Chaque clic reposait alors une question déjà tranchée, d'où « Ce
     * n'est pas le moment de décider ».
     *
     * Le statut suffit à savoir qu'il faut partir ; s'il manque les données de départ, on relit
     * la partie plutôt que d'attendre une notification qui ne reviendra pas.
     */
    /*
     * Pendant le pierre-feuille-ciseaux, cet écran attend le choix adverse puis la décision.
     * Comme l'écran de sélection, il ne s'en remet plus au seul canal temps réel — qu'une page
     * voisine peut lui retirer en se démontant — et relit la partie toutes les deux secondes.
     * Le dédoublonnage de la révélation (clé de révélation dans applyGameRow) empêche une
     * relecture de rejouer l'animation du résultat.
     */
    const rpsWaiting = currentGame?.status === 'rps' || currentGame?.status === 'rps_deciding';
    useEffect(() => {
        if (!rpsWaiting) return;
        const poll = setInterval(() => { refreshGame(); }, 2000);
        return () => clearInterval(poll);
    }, [rpsWaiting, refreshGame]);

    useEffect(() => {
        if (currentGame?.status !== 'playing' || gameStartData) return;
        const retry = setInterval(() => { refreshGame(); }, 1500);
        return () => clearInterval(retry);
    }, [currentGame?.status, gameStartData, refreshGame]);

    /*
     * Filet de sécurité : la partie s'est terminée pendant le pierre-feuille-ciseaux.
     *
     * Sans cela, un joueur dont l'adversaire abandonne à ce moment précis attend indéfiniment un
     * choix qui ne viendra jamais — l'écran n'a aucun autre moyen d'en sortir.
     */
    useEffect(() => {
        if (currentGame?.status === 'finished') router.push('/online');
    }, [currentGame?.status, router]);

    // Réinitialiser après une égalité
    useEffect(() => {
        if (rpsPhase === 'choosing' && hasChosen) {
            setHasChosen(false);
            setMyChoice(null);
        }
    }, [rpsPhase, hasChosen]);

    /*
     * Le choix n'est marqué que si le SERVEUR l'accepte.
     *
     * `hasChosen` était posé avant la réponse : un refus laissait donc le joueur sur l'écran
     * d'attente définitivement, alors que son choix n'était jamais parti. Et comme l'erreur était
     * avalée, il n'avait aucun moyen de le savoir. Désormais un refus rouvre les boutons, et la
     * bannière dit pourquoi.
     */
    const [busy, setBusy] = useState(false);

    const handleChoice = async (choice: RpsChoice) => {
        if (hasChosen || busy) return;
        setBusy(true);
        setMyChoice(choice);
        const ok = await sendRpsChoice(choice);
        setBusy(false);
        if (ok) setHasChosen(true);
        else setMyChoice(null);
    };

    const handleDecision = async (goFirst: boolean) => {
        if (busy) return;
        setBusy(true);
        await sendRpsDecision(goFirst);
        setBusy(false);
    };

    const getChoiceEmoji = (choice: RpsChoice | null | undefined) => {
        return CHOICES.find(c => c.id === choice)?.emoji || '❓';
    };

    const savedOpponentName = typeof window !== 'undefined' ? sessionStorage.getItem('opponentName') : null;
    const displayOpponentName = opponentName || savedOpponentName || 'Adversaire';

    // Déterminer le résultat en texte
    const getResultText = () => {
        if (!rpsResult) return '';
        if (rpsResult.result === 'draw') return '🤝 Égalité ! On recommence...';

        const isHost = currentGame?.isHost ?? false;
        const youWon = (isHost && rpsResult.result === 'host_wins') ||
            (!isHost && rpsResult.result === 'guest_wins');

        return youWon ? '🎉 Tu as gagné !' : `😢 ${displayOpponentName} a gagné...`;
    };

    return (
        <div className={styles.container}>
            <div className={styles.background}>
                <div className={styles.orb}></div>
                <div className={styles.orb}></div>
            </div>

            <div className={styles.content}>
                <h1 className={styles.title}>⚔️ Qui commence ?</h1>

                {error && (
                    <div className={styles.errorBanner}>
                        <span>⚠️ {error}</span>
                        <button onClick={clearError}>✕</button>
                    </div>
                )}

                {/* Phase de choix */}
                {rpsPhase === 'choosing' && !hasChosen && (
                    <div className={styles.choicePhase}>
                        <div className={styles.choices}>
                            {CHOICES.map((choice) => (
                                <button
                                    key={choice.id}
                                    className={styles.choiceButton}
                                    onClick={() => handleChoice(choice.id)}
                                >
                                    <span className={styles.choiceEmoji}>{choice.emoji}</span>
                                    <span className={styles.choiceName}>{choice.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* En attente de l'adversaire */}
                {rpsPhase === 'choosing' && hasChosen && (
                    <div className={styles.waitingPhase}>
                        <div className={styles.battle}>
                            <div className={styles.player}>
                                <span className={styles.label}>Toi</span>
                                <div className={styles.hand}>
                                    {getChoiceEmoji(myChoice)}
                                </div>
                                <span className={styles.readyBadge}>✅ Prêt</span>
                            </div>

                            <div className={styles.versus}>
                                <span className={styles.vsText}>VS</span>
                            </div>

                            <div className={styles.opponent}>
                                <span className={styles.label}>{displayOpponentName}</span>
                                <div className={`${styles.hand} ${opponentChoseRps ? '' : styles.waiting}`}>
                                    {opponentChoseRps ? '✅' : '⏳'}
                                </div>
                                <span className={styles.waitingText}>
                                    {opponentChoseRps ? 'Prêt !' : 'En attente...'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Phase de résultat */}
                {rpsPhase === 'result' && rpsResult && (
                    <div className={styles.resultPhase}>
                        <div className={styles.battle}>
                            <div className={styles.player}>
                                <span className={styles.label}>Toi</span>
                                <div className={`${styles.hand} ${styles.revealed}`}>
                                    {currentGame?.isHost
                                        ? getChoiceEmoji(rpsResult.hostChoice)
                                        : getChoiceEmoji(rpsResult.guestChoice)
                                    }
                                </div>
                            </div>

                            <div className={styles.versus}>
                                <span className={styles.vsText}>VS</span>
                            </div>

                            <div className={styles.opponent}>
                                <span className={styles.label}>{displayOpponentName}</span>
                                <div className={`${styles.hand} ${styles.revealed}`}>
                                    {currentGame?.isHost
                                        ? getChoiceEmoji(rpsResult.guestChoice)
                                        : getChoiceEmoji(rpsResult.hostChoice)
                                    }
                                </div>
                            </div>
                        </div>

                        <div className={`${styles.resultBanner} ${rpsResult.result === 'draw' ? styles.draw :
                            isRpsWinner ? styles.win : styles.lose
                            }`}>
                            {getResultText()}
                        </div>

                        {!isRpsWinner && rpsResult.result !== 'draw' && (
                            <p className={styles.waitingForDecision}>
                                ⏳ {displayOpponentName} choisit qui commence...
                            </p>
                        )}
                    </div>
                )}

                {/* Phase de décision (gagnant seulement) */}
                {rpsPhase === 'deciding' && isRpsWinner && (
                    <div className={styles.decidePhase}>
                        <div className={`${styles.resultBanner} ${styles.win}`}>
                            🎉 Tu as gagné !
                        </div>
                        <p className={styles.decideQuestion}>Tu veux jouer en :</p>
                        <div className={styles.decideButtons}>
                            <button
                                className={`${styles.decideButton} ${styles.first}`}
                                onClick={() => handleDecision(true)}
                                disabled={busy}
                            >
                                <span className={styles.decideIcon}>1️⃣</span>
                                <span>Premier</span>
                            </button>
                            <button
                                className={`${styles.decideButton} ${styles.second}`}
                                onClick={() => handleDecision(false)}
                                disabled={busy}
                            >
                                <span className={styles.decideIcon}>2️⃣</span>
                                <span>Second</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Chargement initial */}
                {!rpsPhase && (
                    <div className={styles.loading}>
                        <div className={styles.spinner}>⏳</div>
                        <p>Connexion au serveur...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
