'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { RequireAuth } from '@/components/Auth/RequireAuth';
import { useStoryStore } from '@/store/storyStore';
import { ZEUS_CAMPAIGN } from '@/data/story/campaign';
import DialogueBox from '@/components/StoryMode/DialogueBox';

export default function StoryPage() {
    return (
        <RequireAuth>
            <StoryContent />
        </RequireAuth>
    );
}

function StoryContent() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [showChapterSelect, setShowChapterSelect] = useState(true);
    const [showTransition, setShowTransition] = useState(false);
    const [previousSpeaker, setPreviousSpeaker] = useState<string | null>(null);

    const {
        progress,
        currentDialogues,
        currentDialogueIndex,
        isDialogueActive,
        currentBattleConfig,
        initStory,
        startChapter,
        advanceDialogue,
        advanceToNextEvent,
        isChapterCompleted,
        canAccessChapter,
        getCurrentEvent,
        resetProgress
    } = useStoryStore();

    useEffect(() => {
        setIsLoading(false);
    }, []);

    // Déterminer si le dialogue actuel est du narrateur
    const currentDialogue = currentDialogues[currentDialogueIndex];
    const isNarratorScene = currentDialogue?.speakerId === 'narrator';

    // Détecter les changements de type de scène pour la transition
    useEffect(() => {
        if (currentDialogue && previousSpeaker !== null) {
            const wasNarrator = previousSpeaker === 'narrator';
            const isNowNarrator = currentDialogue.speakerId === 'narrator';

            // Transition si on passe de narrateur à personnage ou vice versa
            if (wasNarrator !== isNowNarrator) {
                setShowTransition(true);
                setTimeout(() => setShowTransition(false), 1500);
            }
        }
        if (currentDialogue) {
            setPreviousSpeaker(currentDialogue.speakerId);
        }
    }, [currentDialogue, previousSpeaker]);

    // Gérer l'avancement des dialogues
    const handleDialogueAdvance = () => {
        advanceDialogue();
    };

    // Quand les dialogues sont terminés, passer à l'événement suivant
    const handleDialogueComplete = () => {
        const currentEvent = getCurrentEvent();

        // Passer à l'événement suivant
        const nextEvent = advanceToNextEvent();

        if (!nextEvent) {
            // Fin du chapitre
            setShowChapterSelect(true);
        } else if (nextEvent.type === 'battle') {
            // Afficher la transition avant de naviguer
            setShowTransition(true);
            setTimeout(() => {
                router.push('/story/battle');
            }, 800);
        }
        // Si c'est un dialogue ou cutscene, le store a déjà chargé les nouveaux dialogues
    };

    // Démarrer un chapitre
    const handleStartChapter = (chapterId: string) => {
        setPreviousSpeaker(null); // Reset pour ne pas déclencher de transition au démarrage
        startChapter(chapterId);
        setShowChapterSelect(false);
    };

    // Continuer la progression
    const handleContinue = () => {
        setPreviousSpeaker(null);
        initStory();
        setShowChapterSelect(false);
    };

    if (isLoading) {
        return (
            <main className={styles.main}>
                <div className={styles.loading}>Chargement...</div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/play" className={styles.backButton}>‹ Retour</Link>
                <h1 className={styles.title}>HISTOIRE</h1>
                <button
                    className={styles.resetButton}
                    onClick={() => {
                        if (confirm('Êtes-vous sûr de vouloir recommencer l\'histoire ?')) {
                            resetProgress();
                        }
                    }}
                    title="Recommencer"
                >
                    🔄
                </button>
            </header>

            {/* Sélection de chapitre ou histoire en cours */}
            {showChapterSelect ? (
                <div className={styles.content}>
                    {/* Titre de la campagne */}
                    <div className={styles.campaignHeader}>
                        <h2 className={styles.campaignTitle}>{ZEUS_CAMPAIGN.name}</h2>
                        <p className={styles.campaignDescription}>{ZEUS_CAMPAIGN.description}</p>
                    </div>

                    {/* Équipe du joueur */}
                    <div className={styles.teamSection}>
                        <h3 className={styles.sectionTitle}>Votre Équipe</h3>
                        <div className={styles.teamGods}>
                            {ZEUS_CAMPAIGN.playerTeam.map((godId) => (
                                <div key={godId} className={styles.teamGod}>
                                    <Image
                                        src={`/cards/gods/${godId}.png`}
                                        alt={godId}
                                        width={60}
                                        height={60}
                                        className={styles.godImage}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bouton Continuer si progression existante */}
                    {progress.currentEventIndex > 0 && (
                        <button
                            className={styles.continueButton}
                            onClick={handleContinue}
                        >
                            ▶ Continuer
                        </button>
                    )}

                    {/* Liste des chapitres */}
                    <div className={styles.chaptersGrid}>
                        {ZEUS_CAMPAIGN.chapters.map((chapter) => {
                            const isCompleted = isChapterCompleted(chapter.id);
                            const canAccess = canAccessChapter(chapter.id);
                            const isCurrent = progress.currentChapterId === chapter.id;

                            return (
                                <div
                                    key={chapter.id}
                                    className={`${styles.chapterCard} ${!canAccess ? styles.locked : ''} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''}`}
                                    onClick={() => canAccess && handleStartChapter(chapter.id)}
                                >
                                    {/* Badge de statut */}
                                    {isCompleted && (
                                        <div className={styles.statusBadge}>✓ Terminé</div>
                                    )}
                                    {!canAccess && !isCompleted && (
                                        <div className={styles.lockIcon}>🔒</div>
                                    )}
                                    {isCurrent && !isCompleted && (
                                        <div className={styles.statusBadge}>En cours</div>
                                    )}

                                    {/* Numéro du chapitre */}
                                    <div className={styles.chapterNumber}>
                                        Chapitre {chapter.number}
                                    </div>

                                    {/* Titre */}
                                    <h3 className={styles.chapterTitle}>{chapter.title}</h3>
                                    <p className={styles.chapterSubtitle}>{chapter.subtitle}</p>

                                    {/* Description */}
                                    <p className={styles.chapterDescription}>
                                        {chapter.description}
                                    </p>

                                    {/* Difficulté */}
                                    <div className={`${styles.difficulty} ${styles[chapter.difficulty]}`}>
                                        {chapter.difficulty === 'easy' && '⭐ Facile'}
                                        {chapter.difficulty === 'medium' && '⭐⭐ Normal'}
                                        {chapter.difficulty === 'hard' && '⭐⭐⭐ Difficile'}
                                    </div>

                                    {/* Nombre d'événements */}
                                    {chapter.events.length > 0 && (
                                        <div className={styles.eventCount}>
                                            {chapter.events.filter(e => e.type === 'battle').length} combat(s)
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* Mode histoire en cours */
                <div className={styles.storyView}>
                    {/* Fond atmosphérique - change selon le type de dialogue */}
                    <div className={isNarratorScene ? styles.storyBackgroundNarrator : styles.storyBackground}>
                        <div className={isNarratorScene ? styles.backgroundOverlayNarrator : styles.backgroundOverlay} />
                    </div>

                    {/* Transition entre scènes */}
                    {showTransition && <div className={styles.sceneTransition} />}

                    {/* Dialogue actif */}
                    {isDialogueActive && currentDialogues.length > 0 && (
                        <DialogueBox
                            dialogues={currentDialogues}
                            currentIndex={currentDialogueIndex}
                            onAdvance={handleDialogueAdvance}
                            onComplete={handleDialogueComplete}
                        />
                    )}

                    {/* Si pas de dialogue mais combat en attente */}
                    {!isDialogueActive && currentBattleConfig && (
                        <div className={styles.battlePrompt}>
                            <h2>{currentBattleConfig.name}</h2>
                            <p>{currentBattleConfig.description}</p>
                            {currentBattleConfig.playerCondition && (
                                <div className={styles.battleCondition}>
                                    ⚠️ {currentBattleConfig.playerCondition.description}
                                </div>
                            )}
                            <button
                                className={styles.battleButton}
                                onClick={() => router.push('/story/battle')}
                            >
                                ⚔️ Commencer le Combat
                            </button>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
