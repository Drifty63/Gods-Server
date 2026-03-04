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
import {
    PROLOGUE_AFTER_BATTLE_1_WIN,
    PROLOGUE_AFTER_BATTLE_1_LOSE,
    PROLOGUE_HADES_TAKES_THRONE,
    PROLOGUE_BATTLE2_WIN,
    PROLOGUE_BATTLE2_LOSE,
    PROLOGUE_BATTLE3_WIN,
    PROLOGUE_BATTLE3_LOSE,
    PROLOGUE_BATTLE4_WIN,
    PROLOGUE_BATTLE4_LOSE,
    // Chapitre 2
    CHAPTER2_BATTLE1_WIN,
    CHAPTER2_BATTLE1_LOSE,
    CHAPTER2_BATTLE2_WIN,
    CHAPTER2_BATTLE2_LOSE,
    CHAPTER2_BATTLE3_WIN,
    CHAPTER2_BATTLE3_LOSE,
    CHAPTER2_BATTLE4_WIN,
    CHAPTER2_BATTLE4_LOSE
} from '@/data/story/dialogues';
import styles from './page.module.css';

type BattlePhase = 'loading' | 'team_selection' | 'intro' | 'playing' | 'post_battle_dialogue' | 'victory' | 'defeat';

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

    // Stocker la config de bataille localement pour la garder disponible après le combat
    const [battleConfig, setBattleConfig] = useState<typeof currentBattleConfig>(null);

    const [postBattleDialogues, setPostBattleDialogues] = useState<any[]>([]);
    const [postBattleIndex, setPostBattleIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isDialogueHidden, setIsDialogueHidden] = useState(false);

    // État pour la sélection d'équipe
    const [selectedGods, setSelectedGods] = useState<string[]>([]);
    const [availableGods, setAvailableGods] = useState<string[]>([]);
    const [requiredCount, setRequiredCount] = useState(0);
    const [fixedGods, setFixedGods] = useState<string[]>([]);

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

        const internalState = engine.getState();
        const targetGod = battleConfig.playerCondition.targetGod;

        if (battleConfig.playerCondition.type === 'half_hp') {
            // Réduire les PV du joueur à 50% dans l'état interne de l'engine
            internalState.players[0].gods.forEach((god: { currentHealth: number; card: { id: string; maxHealth: number } }) => {
                // Si targetGod est défini, ne modifier que ce dieu
                if (!targetGod || god.card.id === targetGod) {
                    god.currentHealth = Math.floor(god.card.maxHealth / 2);
                }
            });
        } else if (battleConfig.playerCondition.type === 'three_quarter_hp') {
            // Réduire les PV du joueur à 75% (Zeus pas complètement guéri)
            internalState.players[0].gods.forEach((god: { currentHealth: number; card: { id: string; maxHealth: number } }) => {
                // Si targetGod est défini, ne modifier que ce dieu (Zeus)
                if (!targetGod || god.card.id === targetGod) {
                    god.currentHealth = Math.floor(god.card.maxHealth * 0.75);
                    console.log(`⚡ ${god.card.id} commence avec 75% PV`);
                }
            });
        } else if (battleConfig.playerCondition.type === 'stunned') {
            // Zeus est immobilisé - appliquer le stun via statusEffects comme les cartes d'Athéna
            const stunDuration = battleConfig.playerCondition.duration || 1;
            const targetGodId = battleConfig.playerCondition.targetGod || 'zeus';

            internalState.players[0].gods.forEach((god: {
                card: { id: string };
                statusEffects: Array<{ type: string; stacks: number; duration?: number }>
            }) => {
                // Appliquer le stun à Zeus (ou au dieu ciblé)
                if (god.card.id === targetGodId) {
                    god.statusEffects.push({
                        type: 'stun',
                        stacks: 1,
                        duration: stunDuration
                    });
                    console.log(`⚡ ${god.card.id} est immobilisé pour ${stunDuration} tour(s) !`);
                }
            });
        } else if (battleConfig.playerCondition.type === 'no_energy') {
            // Le joueur commence avec 0 énergie
            internalState.players[0].energy = 0;
            console.log(`⚡ Le joueur commence avec 0 énergie !`);
        } else if (battleConfig.playerCondition.type === 'poisoned') {
            // Appliquer du poison à tous les dieux du joueur
            const poisonStacks = battleConfig.playerCondition.poisonStacks || 2;

            internalState.players[0].gods.forEach((god: {
                card: { id: string };
                statusEffects: Array<{ type: string; stacks: number; duration?: number }>
            }) => {
                // Si targetGod est défini, ne modifier que ce dieu, sinon tous
                if (!targetGod || god.card.id === targetGod) {
                    god.statusEffects.push({
                        type: 'poison',
                        stacks: poisonStacks
                    });
                    console.log(`🧪 ${god.card.id} est empoisonné (${poisonStacks} marques) !`);
                }
            });
        }

        // Créer une copie profonde de l'état pour React
        const newGameState = JSON.parse(JSON.stringify(internalState));

        // Mettre à jour le store avec le nouvel état
        useGameStore.setState({ gameState: newGameState });
    }, []);

    // Initialiser le combat
    const initBattle = useCallback(() => {
        // Récupérer la config depuis currentBattleConfig ou depuis l'événement actuel
        let localBattleConfig = currentBattleConfig;

        if (!localBattleConfig) {
            // Essayer de récupérer depuis l'événement actuel
            const currentEvent = getCurrentEvent();
            if (currentEvent?.type === 'battle' && currentEvent.battle) {
                localBattleConfig = currentEvent.battle;
            }
        }

        if (!localBattleConfig) {
            setError('Aucun combat configuré');
            return;
        }

        // Sauvegarder la config localement
        setBattleConfig(localBattleConfig);

        // Vérifier si le joueur doit choisir son équipe
        if (localBattleConfig.playerTeamChoices && localBattleConfig.playerTeamChoices.length > 0) {
            const fixed = localBattleConfig.playerTeam || [];
            const choices = localBattleConfig.playerTeamChoices;
            const required = localBattleConfig.requiredPlayerTeamSize || 4;
            const needToSelect = required - fixed.length;

            setFixedGods(fixed);
            setAvailableGods(choices);
            setRequiredCount(needToSelect);
            setSelectedGods([]);
            setPhase('team_selection');
            return;
        }

        // Pas de sélection nécessaire, lancer le combat directement
        startBattleWithTeam(localBattleConfig, localBattleConfig.playerTeam || getPlayerTeam());
    }, [currentBattleConfig, getCurrentEvent, getPlayerTeam]);

    // Lancer le combat avec une équipe définie
    const startBattleWithTeam = useCallback((localBattleConfig: NonNullable<typeof currentBattleConfig>, playerTeamIds: string[]) => {
        try {
            const playerGods = playerTeamIds.map(id => getGodById(id)).filter(Boolean) as typeof ALL_GODS;

            // Équipe ennemie
            const enemyGods = localBattleConfig.enemyTeam.map(id => getGodById(id)).filter(Boolean) as typeof ALL_GODS;

            // Vérification de la taille des équipes (supportent maintenant 1-4 dieux)
            if (playerGods.length === 0 || playerGods.length > 4) {
                throw new Error(`Équipe joueur invalide (${playerGods.length} dieux)`);
            }
            if (enemyGods.length === 0 || enemyGods.length > 4) {
                throw new Error(`Équipe ennemie invalide (${enemyGods.length} dieux)`);
            }

            // Créer les decks avec multiplicateur optionnel
            const basePlaverDeck = createDeck(playerTeamIds);
            const baseEnemyDeck = createDeck(localBattleConfig.enemyTeam);

            let playerDeck = basePlaverDeck;
            let enemyDeck = baseEnemyDeck;

            // Multiplicateurs de deck (peuvent être différents pour joueur et ennemi)
            const playerMultiplier = localBattleConfig.deckMultiplier || 1;
            const enemyMultiplier = localBattleConfig.enemyDeckMultiplier || localBattleConfig.deckMultiplier || 1;

            // Appliquer le multiplicateur de deck du joueur
            if (playerMultiplier > 1) {
                playerDeck = [];
                for (let i = 0; i < playerMultiplier; i++) {
                    basePlaverDeck.forEach(card => {
                        playerDeck.push({
                            ...card,
                            id: `${card.id}_copy_${i}`
                        });
                    });
                }
            }

            // Appliquer le multiplicateur de deck ennemi
            if (enemyMultiplier > 1) {
                enemyDeck = [];
                for (let i = 0; i < enemyMultiplier; i++) {
                    baseEnemyDeck.forEach(card => {
                        enemyDeck.push({
                            ...card,
                            id: `${card.id}_copy_${i}`
                        });
                    });
                }
            }

            console.log(`🎮 Combat - Deck joueur x${playerMultiplier} (${playerDeck.length} cartes), ennemi x${enemyMultiplier} (${enemyDeck.length} cartes)`);

            // L'ennemi commence (attaque surprise)
            const playerGoesFirst = false;

            // Appliquer l'override des PV ennemis si défini
            const finalEnemyGods = enemyGods.map(god => {
                if (localBattleConfig.enemyHealthOverride?.[god.id]) {
                    return {
                        ...god,
                        maxHealth: localBattleConfig.enemyHealthOverride[god.id]
                    };
                }
                return god;
            });

            // Initialiser la partie
            initGame(playerGods, playerDeck, finalEnemyGods, enemyDeck, playerGoesFirst);

            // Appliquer les conditions spéciales APRÈS l'initialisation
            // On passe battleConfig à la fonction
            setTimeout(() => {
                applyBattleConditions(localBattleConfig);
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
    }, [initGame, applyBattleConditions]);

    // Lancer le combat au chargement
    useEffect(() => {
        if (phase === 'loading') {
            initBattle();
        }
    }, [phase, initBattle]);

    // Surveiller la fin du combat
    useEffect(() => {
        if (!gameState || phase !== 'playing') return;

        // Fonction pour traiter la fin de combat
        const handleBattleEnd = (won: boolean) => {
            setPlayerWon(won);

            // Convertir les dialogues du format DialogueLine au format utilisé ici
            const convertDialogues = (dialogueLines: typeof PROLOGUE_AFTER_BATTLE_1_WIN) =>
                dialogueLines.map(d => ({
                    speaker: d.speakerId,
                    speakerName: d.speakerName,
                    text: d.text,
                    portrait: d.speakerId  // Garder l'ID du speaker pour le portrait (inclut 'narrator')
                }));

            // Déterminer quels dialogues utiliser selon le combat
            let allDialogues;

            if (battleConfig?.id === 'battle_athens_temple') {
                // Chapitre 2 Combat 4 : Temple d'Athéna
                allDialogues = won ? CHAPTER2_BATTLE4_WIN : CHAPTER2_BATTLE4_LOSE;
            } else if (battleConfig?.id === 'battle_arachne') {
                // Chapitre 2 Combat 3 : Arachné
                allDialogues = won ? CHAPTER2_BATTLE3_WIN : CHAPTER2_BATTLE3_LOSE;
            } else if (battleConfig?.id === 'battle_dragon_thebes') {
                // Chapitre 2 Combat 2 : Le Dragon de Thèbes
                allDialogues = won ? CHAPTER2_BATTLE2_WIN : CHAPTER2_BATTLE2_LOSE;
            } else if (battleConfig?.id === 'battle_thebes_betrayal') {
                // Chapitre 2 Combat 1 : La Trahison de Thèbes
                allDialogues = won ? CHAPTER2_BATTLE1_WIN : CHAPTER2_BATTLE1_LOSE;
            } else if (battleConfig?.id === 'battle_ambush_ares') {
                // Combat 4 : Zeus + Déméter + Artémis vs Arès + Soldats
                allDialogues = won ? PROLOGUE_BATTLE4_WIN : PROLOGUE_BATTLE4_LOSE;
            } else if (battleConfig?.id === 'battle_test_of_valor') {
                // Combat 3 : Zeus + Hestia vs Déméter + Artémis
                allDialogues = won ? PROLOGUE_BATTLE3_WIN : PROLOGUE_BATTLE3_LOSE;
            } else if (battleConfig?.id === 'battle_zeus_hestia_vs_ares') {
                // Combat 2 : Zeus + Hestia vs Arès
                allDialogues = won ? PROLOGUE_BATTLE2_WIN : PROLOGUE_BATTLE2_LOSE;
            } else {
                // Combat 1 : Zeus vs Hadès (par défaut)
                const battleDialogues = won
                    ? PROLOGUE_AFTER_BATTLE_1_WIN
                    : PROLOGUE_AFTER_BATTLE_1_LOSE;
                // Combiner avec les dialogues de prise de trône (communs aux deux issues)
                allDialogues = [...battleDialogues, ...PROLOGUE_HADES_TAKES_THRONE];
            }

            setPostBattleDialogues(convertDialogues(allDialogues));
            setPostBattleIndex(0);
            setPhase('post_battle_dialogue');
            completeBattle(won);
        };

        // Vérifier si le nombre de tours maximum est dépassé (défaite automatique)
        if (battleConfig?.maxTurns && gameState.turnNumber > battleConfig.maxTurns) {
            console.log(`⏰ Limite de tours dépassée (${gameState.turnNumber} > ${battleConfig.maxTurns})`);
            handleBattleEnd(false);
            return;
        }

        // Vérifier que le jeu est vraiment terminé (status === 'finished')
        // et qu'il y a un gagnant défini
        if (gameState.status === 'finished' && gameState.winnerId) {
            // Utiliser playerId du store pour comparer correctement
            const won = gameState.winnerId === playerId;
            handleBattleEnd(won);
        }
    }, [gameState, phase, completeBattle, playerId, battleConfig]);

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

        // Passer l'événement suivant (combat → dialogue victoire/défaite)
        const nextEvent = advanceToNextEvent(playerWon);

        // Si on était sur un événement de bataille, il faut aussi avancer
        // au-delà du dialogue de victoire/défaite pour terminer le chapitre
        // Note: nextEvent sera le dialogue de victoire/défaite qui a nextEventId: undefined
        if (nextEvent && nextEvent.nextEventId === undefined) {
            // L'événement suivant n'a pas de suite, donc on avance une dernière fois
            // pour marquer le chapitre comme terminé
            advanceToNextEvent(playerWon);
        }

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

    // Sélection d'équipe : basculer un dieu
    const toggleGodSelection = (godId: string) => {
        setSelectedGods(prev => {
            if (prev.includes(godId)) {
                return prev.filter(id => id !== godId);
            } else if (prev.length < requiredCount) {
                return [...prev, godId];
            }
            return prev;
        });
    };

    // Sélection d'équipe : confirmer et lancer le combat
    const confirmTeamSelection = () => {
        if (!battleConfig) return;
        if (selectedGods.length !== requiredCount) return;

        const fullTeam = [...fixedGods, ...selectedGods];
        startBattleWithTeam(battleConfig, fullTeam);
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

    // Phase: Sélection d'équipe
    if (phase === 'team_selection') {
        const currentEvent = getCurrentEvent();
        const bgImage = currentEvent?.backgroundImage || '/assets/story/olympus_storm.png';

        return (
            <main className={styles.main}>
                <div
                    className={styles.storyBackground}
                    style={{ backgroundImage: `url('${bgImage}')` }}
                >
                    <div className={styles.teamSelectionOverlay}>
                        <div className={styles.teamSelectionContent}>
                            <h2 className={styles.teamSelectionTitle}>⚔️ Choisissez votre équipe</h2>
                            <p className={styles.teamSelectionSubtitle}>
                                Sélectionnez {requiredCount} dieu{requiredCount > 1 ? 'x' : ''} pour accompagner votre équipe
                            </p>

                            {/* Dieux fixes (obligatoires) */}
                            {fixedGods.length > 0 && (
                                <div className={styles.fixedGodsSection}>
                                    <h3>Dieux obligatoires :</h3>
                                    <div className={styles.godGrid}>
                                        {fixedGods.map(godId => {
                                            const god = getGodById(godId);
                                            if (!god) return null;
                                            return (
                                                <div key={godId} className={`${styles.godCard} ${styles.godCardFixed}`}>
                                                    <div className={styles.godImageWrapper}>
                                                        <Image
                                                            src={god.imageUrl}
                                                            alt={god.name}
                                                            fill
                                                            className={styles.godImage}
                                                        />
                                                    </div>
                                                    <span className={styles.godName}>{god.name.split(',')[0]}</span>
                                                    <span className={styles.fixedLabel}>Obligatoire</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Dieux à choisir */}
                            <div className={styles.choiceGodsSection}>
                                <h3>Choisissez {requiredCount} dieu{requiredCount > 1 ? 'x' : ''} ({selectedGods.length}/{requiredCount}) :</h3>
                                <div className={styles.godGrid}>
                                    {availableGods.map(godId => {
                                        const god = getGodById(godId);
                                        if (!god) return null;
                                        const isSelected = selectedGods.includes(godId);
                                        return (
                                            <div
                                                key={godId}
                                                className={`${styles.godCard} ${isSelected ? styles.godCardSelected : ''}`}
                                                onClick={() => toggleGodSelection(godId)}
                                            >
                                                <div className={styles.godImageWrapper}>
                                                    <Image
                                                        src={god.imageUrl}
                                                        alt={god.name}
                                                        fill
                                                        className={styles.godImage}
                                                    />
                                                    {isSelected && <div className={styles.selectedOverlay}>✓</div>}
                                                </div>
                                                <span className={styles.godName}>{god.name.split(',')[0]}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Bouton de confirmation */}
                            <button
                                className={`${styles.confirmButton} ${selectedGods.length === requiredCount ? '' : styles.confirmButtonDisabled}`}
                                onClick={confirmTeamSelection}
                                disabled={selectedGods.length !== requiredCount}
                            >
                                {selectedGods.length === requiredCount
                                    ? '⚔️ Lancer le combat !'
                                    : `Sélectionnez encore ${requiredCount - selectedGods.length} dieu${requiredCount - selectedGods.length > 1 ? 'x' : ''}`}
                            </button>

                            <button className={styles.backButton} onClick={handleQuit}>
                                ← Retour à l'histoire
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // Phase: Introduction du combat
    if (phase === 'intro') {
        // Pour le 1v1, on affiche seulement le premier dieu de chaque équipe
        const playerTeam = currentBattleConfig?.playerTeam || getPlayerTeam();
        const enemyTeam = currentBattleConfig?.enemyTeam || [];

        // Récupérer l'image de fond depuis l'événement actuel (si disponible)
        const currentEvent = getCurrentEvent();
        const introBackgroundImage = currentEvent?.backgroundImage || '/assets/story/olympus_storm.png';

        return (
            <main className={styles.main}>
                <div
                    className={styles.storyBackground}
                    style={{ backgroundImage: `url('${introBackgroundImage}')` }}
                >
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
                                <div className={styles.teamIcons}>
                                    {/* Afficher seulement les dieux du combat (1v1 = 1 dieu) */}
                                    {playerTeam.slice(0, currentBattleConfig?.playerTeam?.length || 1).map(id => (
                                        <div key={id} className={styles.godIcon}>
                                            <img src={`/cards/gods/${id}.png`} alt={id} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.vsText}>VS</div>

                            <div className={styles.teamPreview}>
                                <div className={styles.teamIcons}>
                                    {enemyTeam.map(id => (
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

        // Utiliser l'image de fond appropriée selon le combat
        let backgroundImage: string;
        if (battleConfig?.id === 'battle_athens_temple') {
            // Chapitre 2 Combat 4 : Temple d'Athéna
            backgroundImage = playerWon
                ? '/story/chapter2/combat4_victory.png'
                : '/story/chapter2/combat4_defeat.png';
        } else if (battleConfig?.id === 'battle_arachne') {
            // Chapitre 2 Combat 3 : Arachné
            backgroundImage = playerWon
                ? '/assets/story/ch2_arachne_victory.png'
                : '/assets/story/ch2_arachne_defeat.png';
        } else if (battleConfig?.id === 'battle_dragon_thebes') {
            // Chapitre 2 Combat 2 : Le Dragon de Thèbes
            backgroundImage = playerWon
                ? '/assets/story/ch2_dragon_victory.png'
                : '/assets/story/ch2_dragon_defeat.png';
        } else if (battleConfig?.id === 'battle_thebes_betrayal') {
            // Chapitre 2 Combat 1 : La Trahison de Thèbes
            backgroundImage = playerWon
                ? '/assets/story/chapter2_battle1_victory.png'
                : '/assets/story/ch2_battle1_defeat_v2.png';
        } else if (battleConfig?.id === 'battle_ambush_ares') {
            // Combat 4 : Zeus + Déméter + Artémis vs Arès + Soldats
            backgroundImage = playerWon
                ? '/assets/story/battle4_victory.png'
                : '/assets/story/battle4_defeat_v2.png';
        } else if (battleConfig?.id === 'battle_test_of_valor') {
            // Combat 3 : Zeus + Hestia vs Déméter + Artémis
            backgroundImage = playerWon
                ? '/assets/story/battle3_victory.png'
                : '/assets/story/battle3_defeat.png';
        } else if (battleConfig?.id === 'battle_zeus_hestia_vs_ares') {
            // Combat 2 : Zeus + Hestia vs Arès
            backgroundImage = playerWon
                ? '/assets/story/battle2_victory.png'
                : '/assets/story/battle2_defeat.png';
        } else {
            // Combat 1 : Zeus vs Hadès
            backgroundImage = playerWon
                ? '/assets/story/battle1_victory_v2.png'
                : '/assets/story/battle1_defeat.png';
        }
        const isNarrator = dialogue.speaker === 'narrator';

        return (
            <main className={styles.main}>
                <div
                    className={isNarrator ? styles.storyBackgroundNarrator : styles.storyBackground}
                    style={{ backgroundImage: `url('${backgroundImage}')` }}
                >
                    <div className={isNarrator ? styles.backgroundOverlayNarrator : styles.backgroundOverlay} />
                </div>

                {/* Bouton œil pour masquer/afficher le dialogue */}
                <button
                    className={styles.toggleButton}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsDialogueHidden(!isDialogueHidden);
                    }}
                    title={isDialogueHidden ? 'Afficher le dialogue' : 'Masquer le dialogue'}
                >
                    {isDialogueHidden ? '👁️' : '👁️‍🗨️'}
                </button>

                {/* Container de dialogue (masquable) */}
                <div
                    className={`${styles.postBattleDialogue} ${isDialogueHidden ? styles.dialogueHidden : ''}`}
                    onClick={handleNextPostDialogue}
                >
                    {/* Portrait du personnage (pas pour le narrateur) */}
                    {!isNarrator && (
                        <div
                            key={`portrait-${postBattleIndex}`}
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
                    )}

                    {/* Boîte de dialogue */}
                    <div
                        key={`dialogue-${postBattleIndex}`}
                        className={isNarrator ? styles.narratorBoxNew : styles.dialogueBoxNew}
                    >
                        {!isNarrator && (
                            <div
                                className={styles.speakerNameNew}
                                style={{ color: glowColor }}
                            >
                                {dialogue.speakerName}
                            </div>
                        )}
                        <div className={isNarrator ? styles.narratorTextNew : styles.dialogueTextNew}>
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

    // Fonction pour obtenir l'image de fond appropriée selon le combat
    const getResultBackgroundImage = (isVictory: boolean): string => {
        if (battleConfig?.id === 'battle_athens_temple') {
            // Chapitre 2 Combat 4 : Temple d'Athéna
            return isVictory
                ? '/story/chapter2/combat4_victory.png'
                : '/story/chapter2/combat4_defeat.png';
        } else if (battleConfig?.id === 'battle_arachne') {
            // Chapitre 2 Combat 3 : Arachné
            return isVictory
                ? '/assets/story/ch2_arachne_victory.png'
                : '/assets/story/ch2_arachne_defeat.png';
        } else if (battleConfig?.id === 'battle_dragon_thebes') {
            // Chapitre 2 Combat 2 : Le Dragon de Thèbes
            return isVictory
                ? '/assets/story/ch2_dragon_victory.png'
                : '/assets/story/ch2_dragon_defeat.png';
        } else if (battleConfig?.id === 'battle_thebes_betrayal') {
            // Chapitre 2 Combat 1 : La Trahison de Thèbes
            return isVictory
                ? '/assets/story/chapter2_battle1_victory.png'
                : '/assets/story/ch2_battle1_defeat_v2.png';
        } else if (battleConfig?.id === 'battle_ambush_ares') {
            // Combat 4 : Zeus + Déméter + Artémis vs Arès + Soldats
            return isVictory
                ? '/assets/story/battle4_victory.png'
                : '/assets/story/battle4_defeat_v2.png';
        } else if (battleConfig?.id === 'battle_test_of_valor') {
            // Combat 3 : Zeus + Hestia vs Déméter + Artémis
            return isVictory
                ? '/assets/story/battle3_victory.png'
                : '/assets/story/battle3_defeat.png';
        } else if (battleConfig?.id === 'battle_zeus_hestia_vs_ares') {
            // Combat 2 : Zeus + Hestia vs Arès
            return isVictory
                ? '/assets/story/battle2_victory.png'
                : '/assets/story/battle2_defeat.png';
        } else {
            // Combat 1 : Zeus vs Hadès
            return isVictory
                ? '/assets/story/battle1_victory_v2.png'
                : '/assets/story/battle1_defeat.png';
        }
    };

    // Phase: Victoire
    if (phase === 'victory') {
        return (
            <main className={styles.main}>
                <div
                    className={styles.storyBackground}
                    style={{ backgroundImage: `url('${getResultBackgroundImage(true)}')` }}
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
        // Si continueOnDefeat est activé, on permet de continuer directement (prologue)
        // Utiliser le state battleConfig qui a été sauvegardé au début du combat
        const canContinue = battleConfig?.continueOnDefeat;

        return (
            <main className={styles.main}>
                <div
                    className={styles.storyBackground}
                    style={{ backgroundImage: `url('${getResultBackgroundImage(false)}')` }}
                >
                    <div className={styles.backgroundOverlayDark} />
                </div>
                <div className={styles.resultScreen}>
                    <div className={`${styles.resultContent} ${styles.defeat}`}>
                        <div className={styles.resultIcon}>💀</div>
                        <h1>DÉFAITE...</h1>
                        <p>Vous avez perdu le combat.</p>

                        {/* Si c'est un combat où on peut continuer malgré la défaite (comme le prologue) */}
                        {canContinue ? (
                            <button onClick={handleContinue} className={styles.continueButton}>
                                ▶ Continuer l'histoire
                            </button>
                        ) : (
                            <div className={styles.buttonGroup}>
                                <button onClick={handleRetry} className={styles.retryButton}>
                                    🔄 Réessayer
                                </button>
                                <button onClick={handleQuit} className={styles.quitButton}>
                                    ← Abandonner
                                </button>
                            </div>
                        )}
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
                <div className={styles.headerSpacer} />
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
