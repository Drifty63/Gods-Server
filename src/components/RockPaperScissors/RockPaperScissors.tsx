'use client';

import { useState, useEffect } from 'react';
import styles from './RockPaperScissors.module.css';

type Choice = 'rock' | 'paper' | 'scissors';
type Result = 'win' | 'lose' | 'draw';

interface RockPaperScissorsProps {
    onComplete: (playerGoesFirst: boolean) => void;
}

const CHOICES: { id: Choice; emoji: string; name: string }[] = [
    { id: 'rock', emoji: '🪨', name: 'Pierre' },
    { id: 'paper', emoji: '📄', name: 'Feuille' },
    { id: 'scissors', emoji: '✂️', name: 'Ciseaux' },
];

function getWinner(player: Choice, ai: Choice): Result {
    if (player === ai) return 'draw';
    if (
        (player === 'rock' && ai === 'scissors') ||
        (player === 'paper' && ai === 'rock') ||
        (player === 'scissors' && ai === 'paper')
    ) {
        return 'win';
    }
    return 'lose';
}

export default function RockPaperScissors({ onComplete }: RockPaperScissorsProps) {
    const [phase, setPhase] = useState<'choose' | 'reveal' | 'result' | 'decide'>('choose');
    const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
    const [aiChoice, setAiChoice] = useState<Choice | null>(null);
    const [result, setResult] = useState<Result | null>(null);
    const [countdown, setCountdown] = useState(3);

    const handleChoice = (choice: Choice) => {
        setPlayerChoice(choice);

        // L'IA choisit aléatoirement
        const aiPick = CHOICES[Math.floor(Math.random() * CHOICES.length)].id;
        setAiChoice(aiPick);

        // Lancer le décompte
        setPhase('reveal');
        setCountdown(3);
    };

    // Animation du décompte
    useEffect(() => {
        if (phase === 'reveal' && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 600);
            return () => clearTimeout(timer);
        }

        if (phase === 'reveal' && countdown === 0) {
            // Révéler les choix
            setTimeout(() => {
                if (playerChoice && aiChoice) {
                    const gameResult = getWinner(playerChoice, aiChoice);
                    setResult(gameResult);
                    setPhase('result');
                }
            }, 500);
        }
    }, [phase, countdown, playerChoice, aiChoice]);

    // En cas d'égalité, recommencer
    useEffect(() => {
        if (phase === 'result' && result === 'draw') {
            const timer = setTimeout(() => {
                setPlayerChoice(null);
                setAiChoice(null);
                setResult(null);
                setPhase('choose');
            }, 2000);
            return () => clearTimeout(timer);
        }

        if (phase === 'result' && result === 'win') {
            // Le joueur a gagné, il peut choisir
            const timer = setTimeout(() => {
                setPhase('decide');
            }, 2000);
            return () => clearTimeout(timer);
        }

        if (phase === 'result' && result === 'lose') {
            // L'IA a gagné, elle décide aléatoirement
            const timer = setTimeout(() => {
                const aiGoesFirst = Math.random() > 0.5;
                onComplete(!aiGoesFirst); // Si AI va en premier, player ne va pas en premier
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [phase, result, onComplete]);

    const handleDecision = (goFirst: boolean) => {
        onComplete(goFirst);
    };

    const getChoiceEmoji = (choice: Choice | null) => {
        return CHOICES.find(c => c.id === choice)?.emoji || '❓';
    };

    return (
        <div className={styles.container}>
            <div className={styles.background}>
                <div className={styles.orb}></div>
                <div className={styles.orb}></div>
            </div>

            <div className={styles.content}>
                <h1 className={styles.title}>⚔️ Qui commence ?</h1>
                <p className={styles.subtitle}>Pierre - Feuille - Ciseaux</p>

                {/* Phase de choix */}
                {phase === 'choose' && (
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

                {/* Phase de révélation */}
                {phase === 'reveal' && (
                    <div className={styles.revealPhase}>
                        <div className={styles.battle}>
                            <div className={styles.player}>
                                <span className={styles.label}>Toi</span>
                                <div className={`${styles.hand} ${countdown === 0 ? styles.revealed : styles.shaking}`}>
                                    {countdown === 0 ? getChoiceEmoji(playerChoice) : '✊'}
                                </div>
                            </div>

                            <div className={styles.versus}>
                                {countdown > 0 ? (
                                    <span className={styles.countdown}>{countdown}</span>
                                ) : (
                                    <span className={styles.vsText}>VS</span>
                                )}
                            </div>

                            <div className={styles.opponent}>
                                <span className={styles.label}>IA</span>
                                <div className={`${styles.hand} ${countdown === 0 ? styles.revealed : styles.shaking}`}>
                                    {countdown === 0 ? getChoiceEmoji(aiChoice) : '✊'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Phase de résultat */}
                {phase === 'result' && (
                    <div className={styles.resultPhase}>
                        <div className={styles.battle}>
                            <div className={styles.player}>
                                <span className={styles.label}>Toi</span>
                                <div className={`${styles.hand} ${styles.revealed}`}>
                                    {getChoiceEmoji(playerChoice)}
                                </div>
                            </div>

                            <div className={styles.versus}>
                                <span className={styles.vsText}>VS</span>
                            </div>

                            <div className={styles.opponent}>
                                <span className={styles.label}>IA</span>
                                <div className={`${styles.hand} ${styles.revealed}`}>
                                    {getChoiceEmoji(aiChoice)}
                                </div>
                            </div>
                        </div>

                        <div className={`${styles.resultBanner} ${styles[result || 'draw']}`}>
                            {result === 'win' && '🎉 Tu as gagné !'}
                            {result === 'lose' && '😢 L\'IA a gagné...'}
                            {result === 'draw' && '🤝 Égalité ! On recommence...'}
                        </div>

                        {result === 'lose' && (
                            <p className={styles.aiDeciding}>L&apos;IA choisit qui commence...</p>
                        )}
                    </div>
                )}

                {/* Phase de décision */}
                {phase === 'decide' && (
                    <div className={styles.decidePhase}>
                        <div className={`${styles.resultBanner} ${styles.win}`}>
                            🎉 Tu as gagné !
                        </div>
                        <p className={styles.decideQuestion}>Tu veux commencer en :</p>
                        <div className={styles.decideButtons}>
                            <button
                                className={`${styles.decideButton} ${styles.first}`}
                                onClick={() => handleDecision(true)}
                            >
                                <span className={styles.decideIcon}>1️⃣</span>
                                <span>Premier</span>
                                <span className={styles.decideHint}>+ d&apos;actions au début</span>
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
            </div>
        </div>
    );
}
