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
import { Chapter, ChapterBattle } from '@/types/story';

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

    // Modal de sélection des combats d'un chapitre
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [showBattleSelect, setShowBattleSelect] = useState(false);

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

    // Récupérer l'événement actuel pour son image de fond
    const currentEvent = getCurrentEvent();
    const eventBackgroundImage = currentEvent?.backgroundImage;

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

    // Cliquer sur un chapitre
    const handleChapterClick = (chapter: Chapter) => {
        // Si le chapitre a des combats définis, afficher la modal de sélection
        if (chapter.battles && chapter.battles.length >= 1) {
            setSelectedChapter(chapter);
            setShowBattleSelect(true);
        } else {
            // Sinon, démarrer directement le chapitre
            handleStartChapter(chapter.id);
        }
    };

    // Démarrer un chapitre (depuis le début)
    const handleStartChapter = (chapterId: string) => {
        setPreviousSpeaker(null);
        startChapter(chapterId);
        setShowChapterSelect(false);
        setShowBattleSelect(false);
    };

    // Démarrer un combat spécifique d'un chapitre
    const handleStartBattle = (chapter: Chapter, battle: ChapterBattle) => {
        // Vérifier si le combat est débloqué avant de le lancer
        if (!isBattleUnlocked(chapter, battle)) {
            console.log('Combat verrouillé:', battle.id);
            return;
        }

        console.log('Lancement du combat:', battle.id, 'firstEventId:', battle.firstEventId);
        setPreviousSpeaker(null);
        startChapter(chapter.id, battle.firstEventId);
        setShowChapterSelect(false);
        setShowBattleSelect(false);
    };

    // Vérifier si un combat est débloqué
    const isBattleUnlocked = (chapter: Chapter, battle: ChapterBattle): boolean => {
        // Si le combat est marqué comme débloqué par défaut
        if (battle.unlocked) return true;

        // Si pas de combat requis, c'est débloqué
        if (!battle.requiresBattleId) return true;

        // Chercher le combat requis dans la liste des combats du chapitre
        const requiredBattle = chapter.battles?.find(b => b.id === battle.requiresBattleId);
        if (!requiredBattle) return true;

        // Debug: afficher les événements complétés
        console.log('Checking unlock for', battle.id, 'requires:', battle.requiresBattleId);
        console.log('completedEvents:', progress.completedEvents);

        // Le combat est débloqué si un événement de victoire du combat requis a été complété
        // On cherche:
        // - Pour battle1: ch1_battle1, ch1_after_battle_win, ch1_hades_throne
        // - Pour battle2: ch1_battle2, ch1_battle2_win
        // - Pour battle3: ch1_battle3, ch1_battle3_win
        // - Pour battle4: ch1_battle4, ch1_battle4_win
        const hasBattleCompleted = progress.completedEvents.some(eventId => {
            // Vérification générique basée sur l'ID du combat requis
            if (battle.requiresBattleId === 'battle1') {
                return eventId === 'ch1_battle1' ||
                    eventId === 'ch1_after_battle_win' ||
                    eventId === 'ch1_after_battle_lose' ||
                    eventId === 'ch1_hades_throne';
            } else if (battle.requiresBattleId === 'battle2') {
                return eventId === 'ch1_battle2' ||
                    eventId === 'ch1_battle2_win';
            } else if (battle.requiresBattleId === 'battle3') {
                return eventId === 'ch1_battle3' ||
                    eventId === 'ch1_battle3_win';
            } else if (battle.requiresBattleId === 'battle4') {
                return eventId === 'ch1_battle4' ||
                    eventId === 'ch1_battle4_win';
            }
            return false;
        });

        console.log('Battle completed?', hasBattleCompleted);
        return hasBattleCompleted;
    };

    // Fermer la modal
    const handleCloseBattleSelect = () => {
        setShowBattleSelect(false);
        setSelectedChapter(null);
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
                <Link href="/play" className={styles.backButton} aria-label="Retour">
                    <span aria-hidden="true">‹</span>
                </Link>
                <h1 className={styles.title}>Histoire</h1>
            </header>

            {/* Sélection de chapitre ou histoire en cours */}
            {showChapterSelect ? (
                <div className={styles.content}>
                    {/* Titre de la campagne */}
                    <div className={styles.campaignHeader}>
                        <h2 className={styles.campaignTitle}>{ZEUS_CAMPAIGN.name}</h2>
                        <p className={styles.campaignDescription}>{ZEUS_CAMPAIGN.description}</p>
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
                            const canAccess = canAccessChapter(chapter.id) && !chapter.comingSoon;
                            const isCurrent = progress.currentChapterId === chapter.id;
                            const isComingSoon = chapter.comingSoon === true;

                            return (
                                <div
                                    key={chapter.id}
                                    className={`${styles.chapterCard} ${!canAccess ? styles.locked : ''} ${isCompleted && !isComingSoon ? styles.completed : ''} ${isCurrent && !isComingSoon ? styles.current : ''} ${isComingSoon ? styles.comingSoon : ''}`}
                                    onClick={() => canAccess && handleChapterClick(chapter)}
                                >
                                    {/* Badge de statut */}
                                    {isComingSoon && (
                                        <div className={styles.statusBadge}>🚧 À venir</div>
                                    )}
                                    {isCompleted && !isComingSoon && (
                                        <div className={styles.statusBadge}>✓ Terminé</div>
                                    )}
                                    {!canAccess && !isCompleted && !isComingSoon && (
                                        <div className={styles.lockIcon}>🔒</div>
                                    )}
                                    {isCurrent && !isCompleted && !isComingSoon && (
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
                    {/* Fond atmosphérique - change selon l'événement ou le type de dialogue */}
                    {eventBackgroundImage ? (
                        // Image de fond personnalisée de l'événement
                        <div
                            className={styles.storyBackgroundCustom}
                            style={{ backgroundImage: `url('${eventBackgroundImage}')` }}
                        >
                            <div className={isNarratorScene ? styles.backgroundOverlayNarrator : styles.backgroundOverlay} />
                        </div>
                    ) : (
                        // Images par défaut selon le type de scène
                        <div className={isNarratorScene ? styles.storyBackgroundNarrator : styles.storyBackground}>
                            <div className={isNarratorScene ? styles.backgroundOverlayNarrator : styles.backgroundOverlay} />
                        </div>
                    )}

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

            {/* Modal de sélection des combats */}
            {showBattleSelect && selectedChapter && (
                <div className={styles.modalOverlay} onClick={handleCloseBattleSelect}>
                    <div className={styles.battleSelectModal} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.modalCloseBtn} onClick={handleCloseBattleSelect}>✕</button>

                        <h2 className={styles.modalTitle}>
                            {selectedChapter.title} - {selectedChapter.subtitle}
                        </h2>

                        <div className={styles.battleList}>
                            {selectedChapter.battles?.map((battle, index) => {
                                const unlocked = isBattleUnlocked(selectedChapter, battle);

                                return (
                                    <div
                                        key={battle.id}
                                        className={`${styles.battleCard} ${!unlocked ? styles.battleLocked : ''}`}
                                        onClick={() => unlocked && handleStartBattle(selectedChapter, battle)}
                                    >
                                        <div className={styles.battleNumber}>Combat {index + 1}</div>
                                        <h3 className={styles.battleName}>{battle.name}</h3>
                                        <p className={styles.battleDescription}>{battle.description}</p>

                                        {!unlocked && (
                                            <div className={styles.battleLockOverlay}>
                                                <span className={styles.lockIcon}>🔒</span>
                                                <span>Terminez le combat précédent</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
