'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useGameStore } from '@/store/gameStore';
import { useStoryStore } from '@/store/storyStore';
import GameBoard from '@/components/GameBoard/GameBoard';
import { getGodById, ALL_GODS } from '@/data/gods';
import { createDeck } from '@/data/spells';
import { RequireAuth } from '@/components/Auth/RequireAuth';
import { PROLOGUE_AFTER_BATTLE_1_WIN, PROLOGUE_AFTER_BATTLE_1_LOSE, PROLOGUE_HADES_TAKES_THRONE } from '@/data/story/dialogues';
import styles from './page.module.css';

type BattlePhase = 'loading' | 'intro' | 'playing' | 'post_battle_dialogue' | 'victory' | 'defeat';

// Mapping des IDs de dieux vers leurs couleurs
const GOD_COLORS: Record<string, string> = {
    zeus: '#ffd700',
    hestia: '#ff6b35',
    aphrodite: '#ff69b4',
    dionysos: '#9b59b6',
    hades: '#4a0080',
    nyx: '#1a1a2e',
    apollon: '#87ceeb',
    ares: '#dc143c',
    poseidon: '#00bfff',
    athena: '#f0e68c',
    demeter: '#228b22',
    artemis: '#c0c0c0',
};

export default function StoryBattlePage() {
    return (
        <RequireAuth>
            <StoryBattleContent />
        </RequireAuth>
    );
}

function StoryBattleContent() {
    const router = useRouter();
    const [phase, setPhase] = useState<BattlePhase>('loading');
    const [error, setError] = useState<string | null>(null);
    const [playerWon, setPlayerWon] = useState(false);

    const [postBattleDialogues, setPostBattleDialogues] = useState<any[]>([]);
    const [postBattleIndex, setPostBattleIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const { initGame, gameState, resetGame, playAITurn, playerId } = useGameStore();
    const {
        currentBattleConfig,
        getPlayerTeam,
        completeBattle,
        advanceToNextEvent,
        getCurrentEvent
    } = useStoryStore();

    // Appliquer les conditions de combat (ex: 50% PV)
    const applyBattleConditions = useCallback((battleConfig: NonNullable<typeof currentBattleConfig>) => {
        if (!battleConfig?.playerCondition) return;

        const { engine, gameState } = useGameStore.getState();
        if (!engine || !gameState) return;

        if (battleConfig.playerCondition.type === 'half_hp') {
            // Récupérer l'état interne de l'engine et le modifier
            const internalState = engine.getState();

            // Réduire les PV du joueur à 50% dans l'état interne de l'engine
            // players[0] = joueur 1 (nous)
            internalState.players[0].gods.forEach((god: { currentHealth: number; card: { maxHealth: number } }) => {
                god.currentHealth = Math.floor(god.card.maxHealth / 2);
            });

            // Créer une copie profonde de l'état pour React
            const newGameState = JSON.parse(JSON.stringify(internalState));

            // Mettre à jour le store avec le nouvel état
            useGameStore.setState({ gameState: newGameState });
        }
    }, []);

    // Initialiser le combat
    const initBattle = useCallback(() => {
        // Récupérer la config depuis currentBattleConfig ou depuis l'événement actuel
        let battleConfig = currentBattleConfig;

        if (!battleConfig) {
            // Essayer de récupérer depuis l'événement actuel
            const currentEvent = getCurrentEvent();
            if (currentEvent?.type === 'battle' && currentEvent.battle) {
                battleConfig = currentEvent.battle;
            }
        }

        if (!battleConfig) {
            setError('Aucun combat configuré');
            return;
        }

        try {
            // Équipe du joueur - utilise la config de bataille si définie, sinon l'équipe par défaut
            const playerTeamIds = battleConfig.playerTeam || getPlayerTeam();
            const playerGods = playerTeamIds.map(id => getGodById(id)).filter(Boolean) as typeof ALL_GODS;

            // Équipe ennemie
            const enemyGods = battleConfig.enemyTeam.map(id => getGodById(id)).filter(Boolean) as typeof ALL_GODS;

            // Vérification de la taille des équipes (supportent maintenant 1-4 dieux)
            if (playerGods.length === 0 || playerGods.length > 4) {
                throw new Error(`Équipe joueur invalide (${playerGods.length} dieux)`);
            }
            if (enemyGods.length === 0 || enemyGods.length > 4) {
                throw new Error(`Équipe ennemie invalide (${enemyGods.length} dieux)`);
            }

            // Créer les decks avec multiplicateur optionnel
            const basePlaverDeck = createDeck(playerTeamIds);
            const baseEnemyDeck = createDeck(battleConfig.enemyTeam);

            let playerDeck = basePlaverDeck;
            let enemyDeck = baseEnemyDeck;

            // Appliquer le multiplicateur de deck si défini (pour combat 1v1)
            if (battleConfig.deckMultiplier && battleConfig.deckMultiplier > 1) {
                const multiplier = battleConfig.deckMultiplier;
                playerDeck = [];
                enemyDeck = [];

                // Multiplier les cartes du deck du joueur
                for (let i = 0; i < multiplier; i++) {
                    basePlaverDeck.forEach(card => {
                        playerDeck.push({
                            ...card,
                            id: `${card.id}_copy_${i}`  // ID unique pour chaque copie
                        });
                    });
                }

                // Multiplier les cartes du deck ennemi
                for (let i = 0; i < multiplier; i++) {
                    baseEnemyDeck.forEach(card => {
                        enemyDeck.push({
                            ...card,
                            id: `${card.id}_copy_${i}`  // ID unique pour chaque copie
                        });
                    });
                }

                console.log(`🎮 Combat 1v1 - Deck multiplié x${multiplier}`);
                console.log(`📚 Joueur: ${playerDeck.length} cartes`);
                console.log(`📚 Ennemi: ${enemyDeck.length} cartes`);
            }

            // L'ennemi commence (attaque surprise)
            const playerGoesFirst = false;

            // Initialiser la partie
            initGame(playerGods, playerDeck, enemyGods, enemyDeck, playerGoesFirst);

            // Appliquer les conditions spéciales APRÈS l'initialisation
            // On passe battleConfig à la fonction
            setTimeout(() => {
                applyBattleConditions(battleConfig);
            }, 100);

            setPhase('intro');

            // Passer à la phase de jeu après un délai
            setTimeout(() => {
                const updatedState = useGameStore.getState();
                setPhase('playing');

                // Si l'IA commence, lancer son tour maintenant que l'intro est finie
                if (!playerGoesFirst && updatedState.isSoloMode) {
                    setTimeout(() => {
                        useGameStore.getState().playAITurn();
                    }, 500);
                }
            }, 3000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de l\'initialisation du combat');
        }
    }, [currentBattleConfig, getCurrentEvent, getPlayerTeam, initGame, applyBattleConditions]);

    // Lancer le combat au chargement
    useEffect(() => {
        if (phase === 'loading') {
            initBattle();
        }
    }, [phase, initBattle]);

    // Surveiller la fin du combat
    useEffect(() => {
        if (!gameState || phase !== 'playing') return;

        // Vérifier que le jeu est vraiment terminé (status === 'finished')
        // et qu'il y a un gagnant défini
        if (gameState.status === 'finished' && gameState.winnerId) {

            // Utiliser playerId du store pour comparer correctement
            const won = gameState.winnerId === playerId;
            setPlayerWon(won);

            // Convertir les dialogues du format DialogueLine au format utilisé ici
            const convertDialogues = (dialogueLines: typeof PROLOGUE_AFTER_BATTLE_1_WIN) =>
                dialogueLines.map(d => ({
                    speaker: d.speakerId,
                    speakerName: d.speakerName,
                    text: d.text,
                    portrait: d.speakerId === 'narrator' ? 'zeus' : d.speakerId
                }));

            // Utiliser les dialogues importés depuis dialogues.ts
            // Les deux issues (victoire ou défaite) mènent à Hadès prenant le trône
            const battleDialogues = won
                ? PROLOGUE_AFTER_BATTLE_1_WIN
                : PROLOGUE_AFTER_BATTLE_1_LOSE;

            // Combiner avec les dialogues de prise de trône (communs aux deux issues)
            const allDialogues = [...battleDialogues, ...PROLOGUE_HADES_TAKES_THRONE];

            setPostBattleDialogues(convertDialogues(allDialogues));
            setPostBattleIndex(0);
            setPhase('post_battle_dialogue');
            completeBattle(won);
        }
    }, [gameState, phase, completeBattle, playerId]);

    // Effet de machine à écrire pour les dialogues post-combat
    useEffect(() => {
        if (phase !== 'post_battle_dialogue' || postBattleDialogues.length === 0) return;

        const dialogue = postBattleDialogues[postBattleIndex];
        if (!dialogue) return;

        setDisplayedText('');
        setIsTyping(true);

        const text = dialogue.text;
        let charIndex = 0;

        const typingInterval = setInterval(() => {
            if (charIndex < text.length) {
                setDisplayedText(text.substring(0, charIndex + 1));
                charIndex++;
            } else {
                setIsTyping(false);
                clearInterval(typingInterval);
            }
        }, 25);

        return () => clearInterval(typingInterval);
    }, [phase, postBattleIndex, postBattleDialogues]);

    const handleNextPostDialogue = () => {
        if (isTyping) {
            // Skip l'animation
            setDisplayedText(postBattleDialogues[postBattleIndex]?.text || '');
            setIsTyping(false);
            return;
        }

        if (postBattleIndex < postBattleDialogues.length - 1) {
            setPostBattleIndex(postBattleIndex + 1);
        } else {
            setPhase(playerWon ? 'victory' : 'defeat');
        }
    };

    // Continuer l'histoire après le combat
    const handleContinue = () => {
        const event = getCurrentEvent();
        const playerWon = phase === 'victory';

        // Passer à l'événement suivant
        const nextEvent = advanceToNextEvent(playerWon);

        resetGame();

        // Retourner à la page histoire
        router.push('/story');
    };

    // Réessayer le combat
    const handleRetry = () => {
        resetGame();
        setPhase('loading');
        setError(null);
    };

    // Abandonner et retourner à l'histoire
    const handleQuit = () => {
        resetGame();
        router.push('/story');
    };

    // Phase: Chargement
    if (phase === 'loading') {
        return (
            <main className={styles.main}>
                <div className={styles.loadingScreen}>
                    <div className={styles.loadingContent}>
                        <div className={styles.spinner}></div>
                        <h2>Préparation du combat...</h2>
                        <p>{currentBattleConfig?.name || 'Chargement...'}</p>
                    </div>
                </div>
            </main>
        );
    }

    // Phase: Erreur
    if (error) {
        return (
            <main className={styles.main}>
                <div className={styles.errorScreen}>
                    <h2>⚠️ Erreur</h2>
                    <p>{error}</p>
                    <div className={styles.buttonGroup}>
                        <button onClick={handleRetry} className={styles.retryButton}>
                            🔄 Réessayer
                        </button>
                        <Link href="/story" className={styles.backButton}>
                            ← Retour à l'histoire
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // Phase: Introduction du combat
    if (phase === 'intro') {
        return (
            <main className={styles.main}>
                <div className={styles.storyBackground}>
                    <div className={styles.backgroundOverlay} />
                </div>
                <div className={styles.introScreen}>
                    <div className={styles.introContent}>
                        <h1 className={styles.battleTitle}>{currentBattleConfig?.name}</h1>
                        <p className={styles.battleDescription}>{currentBattleConfig?.description}</p>

                        {currentBattleConfig?.playerCondition && (
                            <div className={styles.conditionWarning}>
                                ⚠️ {currentBattleConfig.playerCondition.description}
                            </div>
                        )}

                        <div className={styles.vsContainer}>
                            <div className={styles.teamPreview}>
                                <span className={styles.teamLabel}>Votre Équipe</span>
                                <div className={styles.teamIcons}>
                                    {getPlayerTeam().map(id => (
                                        <div key={id} className={styles.godIcon}>
                                            <img src={`/cards/gods/${id}.png`} alt={id} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.vsText}>VS</div>

                            <div className={styles.teamPreview}>
                                <span className={styles.teamLabel}>Adversaires</span>
                                <div className={styles.teamIcons}>
                                    {currentBattleConfig?.enemyTeam.map(id => (
                                        <div key={id} className={styles.godIcon}>
                                            <img src={`/cards/gods/${id}.png`} alt={id} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <p className={styles.preparingText}>Le combat commence...</p>
                    </div>
                </div>
            </main>
        );
    }

    // Phase: Dialogue post-combat
    if (phase === 'post_battle_dialogue') {
        const dialogue = postBattleDialogues[postBattleIndex];
        if (!dialogue) return null;

        const glowColor = GOD_COLORS[dialogue.speaker] || '#ffd700';
        const backgroundImage = playerWon
            ? '/assets/story/victory_olympus.png'
            : '/assets/story/defeat_underworld.png';

        return (
            <main className={styles.main}>
                <div
                    className={styles.storyBackground}
                    style={{ backgroundImage: `url('${backgroundImage}')` }}
                >
                    <div className={styles.backgroundOverlay} />
                </div>
                <div className={styles.postBattleDialogue} onClick={handleNextPostDialogue}>
                    {/* Portrait du personnage */}
                    <div
                        className={styles.portraitWrapper}
                        style={{ '--glow-color': glowColor } as React.CSSProperties}
                    >
                        <div className={styles.portrait}>
                            <Image
                                src={`/cards/gods/${dialogue.portrait}.png`}
                                alt={dialogue.speakerName}
                                fill
                                className={styles.portraitImage}
                            />
                        </div>
                    </div>

                    {/* Boîte de dialogue */}
                    <div className={styles.dialogueBoxNew}>
                        <div
                            className={styles.speakerNameNew}
                            style={{ color: glowColor }}
                        >
                            {dialogue.speakerName}
                        </div>
                        <div className={styles.dialogueTextNew}>
                            {displayedText}
                            {isTyping && <span className={styles.cursor}>|</span>}
                        </div>
                        {!isTyping && (
                            <div className={styles.continueIndicator}>
                                {postBattleIndex < postBattleDialogues.length - 1 ? '▼ Suite' : '▶ Continuer'}
                            </div>
                        )}
                        {/* Barre de progression */}
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${((postBattleIndex + 1) / postBattleDialogues.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // Phase: Victoire
    if (phase === 'victory') {
        return (
            <main className={styles.main}>
                <div
                    className={styles.storyBackground}
                    style={{ backgroundImage: "url('/assets/story/victory_olympus.png')" }}
                >
                    <div className={styles.backgroundOverlayLight} />
                </div>
                <div className={styles.resultScreen}>
                    <div className={`${styles.resultContent} ${styles.victory}`}>
                        <div className={styles.resultIcon}>🏆</div>
                        <h1>VICTOIRE !</h1>
                        <p>Vous avez remporté le combat !</p>

                        {currentBattleConfig?.rewards && currentBattleConfig.rewards.length > 0 && (
                            <div className={styles.rewards}>
                                <h3>Récompenses :</h3>
                                {currentBattleConfig.rewards.map((reward, idx) => (
                                    <div key={idx} className={styles.rewardItem}>
                                        {reward.description}
                                    </div>
                                ))}
                            </div>
                        )}

                        <button onClick={handleContinue} className={styles.continueButton}>
                            ▶ Continuer l'histoire
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    // Phase: Défaite
    if (phase === 'defeat') {
        const canContinue = currentBattleConfig?.continueOnDefeat;

        return (
            <main className={styles.main}>
                <div
                    className={styles.storyBackground}
                    style={{ backgroundImage: "url('/assets/story/defeat_underworld.png')" }}
                >
                    <div className={styles.backgroundOverlayDark} />
                </div>
                <div className={styles.resultScreen}>
                    <div className={`${styles.resultContent} ${styles.defeat}`}>
                        <div className={styles.resultIcon}>💀</div>
                        <h1>DÉFAITE...</h1>
                        <p>Vous avez perdu le combat.</p>

                        <div className={styles.buttonGroup}>
                            <button onClick={handleRetry} className={styles.retryButton}>
                                🔄 Réessayer
                            </button>

                            {canContinue && (
                                <button onClick={handleContinue} className={styles.continueButton}>
                                    ▶ Continuer malgré tout
                                </button>
                            )}

                            <button onClick={handleQuit} className={styles.quitButton}>
                                ← Abandonner
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // Phase: Combat en cours
    return (
        <main className={styles.main}>
            {/* Header du mode histoire */}
            <header className={styles.header}>
                <button onClick={handleQuit} className={styles.backBtn}>
                    ← Quitter
                </button>
                <h1 className={styles.title}>{currentBattleConfig?.name || 'Combat'}</h1>
                <div className={styles.headerSpacer} />
            </header>

            {/* Condition de combat affichée */}
            {currentBattleConfig?.playerCondition && (
                <div className={styles.conditionBanner}>
                    ⚠️ {currentBattleConfig.playerCondition.description}
                </div>
            )}

            {/* Plateau de jeu */}
            <GameBoard />
        </main>
    );
}
