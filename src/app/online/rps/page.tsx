'use client';

import { useState, useEffect } from 'react';
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

    const [isRedirecting, setIsRedirecting] = useState(false);

    // Rediriger vers le jeu quand la partie commence
    useEffect(() => {
        if (gameStartData && !isRedirecting) {
            setIsRedirecting(true);

            // S'assurer que isHost est bien sauvegardé avant la redirection
            if (currentGame?.isHost !== undefined) {
                sessionStorage.setItem('isHost', String(currentGame.isHost));
            }
            sessionStorage.setItem('multiplayerData', JSON.stringify(gameStartData));

            // Délai pour laisser le socket se synchroniser avant la redirection
            console.log('Game start received, redirecting in 1s...');
            setTimeout(() => {
                router.push('/online/game');
            }, 1000);
        }
    }, [gameStartData, router, currentGame?.isHost, isRedirecting]);

    // Réinitialiser après une égalité
    useEffect(() => {
        if (rpsPhase === 'choosing' && hasChosen) {
            setHasChosen(false);
            setMyChoice(null);
        }
    }, [rpsPhase, hasChosen]);

    const handleChoice = (choice: RpsChoice) => {
        if (hasChosen) return;
        setMyChoice(choice);
        setHasChosen(true);
        sendRpsChoice(choice);
    };

    const handleDecision = (goFirst: boolean) => {
        sendRpsDecision(goFirst);
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
                <p className={styles.subtitle}>
                    Pierre - Feuille - Ciseaux contre <span className={styles.opponentName}>{displayOpponentName}</span>
                </p>

                {/* Phase de choix */}
                {rpsPhase === 'choosing' && !hasChosen && (
                    <div className={styles.choicePhase}>
                        <p className={styles.instruction}>Fais ton choix !</p>
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
                            >
                                <span className={styles.decideIcon}>1️⃣</span>
                                <span>Premier</span>
                                <span className={styles.decideHint}>+ d&apos;initiative</span>
                            </button>
                            <button
                                className={`${styles.decideButton} ${styles.second}`}
                                onClick={() => handleDecision(false)}
                            >
                                <span className={styles.decideIcon}>2️⃣</span>
                                <span>Second</span>
                                <span className={styles.decideHint}>Réagir à l&apos;adversaire</span>
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
