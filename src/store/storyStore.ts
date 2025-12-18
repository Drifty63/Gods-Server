// Store Zustand pour la progression du mode histoire

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StoryProgress, StoryEvent, DialogueLine } from '@/types/story';
import { ZEUS_CAMPAIGN, getChapterById, getEventById, getNextEvent, getFirstEvent } from '@/data/story/campaign';

interface StoryState {
    // Progression sauvegardée
    progress: StoryProgress;

    // État de la session actuelle
    currentDialogues: DialogueLine[];
    currentDialogueIndex: number;
    isDialogueActive: boolean;
    currentBattleConfig: StoryEvent['battle'] | null;

    // Actions
    initStory: () => void;
    startChapter: (chapterId: string) => void;
    advanceDialogue: () => boolean;  // Retourne true si encore des dialogues
    startBattle: () => void;
    completeBattle: (won: boolean) => void;
    advanceToNextEvent: (won?: boolean) => StoryEvent | null;
    resetProgress: () => void;

    // Getters
    getCurrentChapter: () => ReturnType<typeof getChapterById>;
    getCurrentEvent: () => StoryEvent | undefined;
    getPlayerTeam: () => string[];
    isChapterCompleted: (chapterId: string) => boolean;
    canAccessChapter: (chapterId: string) => boolean;
}

const initialProgress: StoryProgress = {
    currentChapterId: 'chapter_1',
    currentEventId: 'ch1_intro',
    currentEventIndex: 0,
    completedChapters: [],
    completedEvents: [],
    battleResults: [],
    totalPlayTime: 0,
    lastPlayedAt: new Date().toISOString()
};

export const useStoryStore = create<StoryState>()(
    persist(
        (set, get) => ({
            progress: initialProgress,
            currentDialogues: [],
            currentDialogueIndex: 0,
            isDialogueActive: false,
            currentBattleConfig: null,

            initStory: () => {
                const { progress } = get();
                const event = getEventById(progress.currentChapterId, progress.currentEventId);

                if (event && event.dialogues) {
                    set({
                        currentDialogues: event.dialogues,
                        currentDialogueIndex: 0,
                        isDialogueActive: true
                    });
                }
            },

            startChapter: (chapterId: string) => {
                const firstEvent = getFirstEvent(chapterId);
                if (!firstEvent) return;

                set({
                    progress: {
                        ...get().progress,
                        currentChapterId: chapterId,
                        currentEventId: firstEvent.id,
                        currentEventIndex: 0,
                        lastPlayedAt: new Date().toISOString()
                    },
                    currentDialogues: firstEvent.dialogues || [],
                    currentDialogueIndex: 0,
                    isDialogueActive: firstEvent.type === 'dialogue' || firstEvent.type === 'cutscene',
                    currentBattleConfig: firstEvent.type === 'battle' ? firstEvent.battle : null
                });
            },

            advanceDialogue: () => {
                const { currentDialogues, currentDialogueIndex } = get();

                if (currentDialogueIndex < currentDialogues.length - 1) {
                    set({ currentDialogueIndex: currentDialogueIndex + 1 });
                    return true;
                }

                // Plus de dialogues
                set({ isDialogueActive: false });
                return false;
            },

            startBattle: () => {
                const event = get().getCurrentEvent();
                if (event?.type === 'battle' && event.battle) {
                    set({
                        currentBattleConfig: event.battle,
                        isDialogueActive: false
                    });
                }
            },

            completeBattle: (won: boolean) => {
                const { progress } = get();
                const event = get().getCurrentEvent();

                if (!event || event.type !== 'battle') return;

                const battleResult = {
                    eventId: event.id,
                    won,
                    attempts: (get().progress.battleResults.find(r => r.eventId === event.id)?.attempts || 0) + 1
                };

                const updatedResults = [
                    ...progress.battleResults.filter(r => r.eventId !== event.id),
                    battleResult
                ];

                set({
                    progress: {
                        ...progress,
                        battleResults: updatedResults,
                        completedEvents: [...progress.completedEvents, event.id],
                        lastPlayedAt: new Date().toISOString()
                    },
                    currentBattleConfig: null
                });
            },

            advanceToNextEvent: (won?: boolean) => {
                const { progress } = get();
                const nextEvent = getNextEvent(progress.currentChapterId, progress.currentEventId, won);

                if (!nextEvent) {
                    // Fin du chapitre
                    const chapter = getChapterById(progress.currentChapterId);
                    if (chapter) {
                        set({
                            progress: {
                                ...progress,
                                completedChapters: [...progress.completedChapters, chapter.id],
                                lastPlayedAt: new Date().toISOString()
                            }
                        });
                    }
                    return null;
                }

                set({
                    progress: {
                        ...progress,
                        currentEventId: nextEvent.id,
                        currentEventIndex: progress.currentEventIndex + 1,
                        lastPlayedAt: new Date().toISOString()
                    },
                    currentDialogues: nextEvent.dialogues || [],
                    currentDialogueIndex: 0,
                    isDialogueActive: nextEvent.type === 'dialogue' || nextEvent.type === 'cutscene',
                    currentBattleConfig: nextEvent.type === 'battle' ? nextEvent.battle : null
                });

                return nextEvent;
            },

            resetProgress: () => {
                set({
                    progress: initialProgress,
                    currentDialogues: [],
                    currentDialogueIndex: 0,
                    isDialogueActive: false,
                    currentBattleConfig: null
                });
            },

            getCurrentChapter: () => {
                return getChapterById(get().progress.currentChapterId);
            },

            getCurrentEvent: () => {
                const { progress } = get();
                return getEventById(progress.currentChapterId, progress.currentEventId);
            },

            getPlayerTeam: () => {
                return ZEUS_CAMPAIGN.playerTeam;
            },

            isChapterCompleted: (chapterId: string) => {
                return get().progress.completedChapters.includes(chapterId);
            },

            canAccessChapter: (chapterId: string) => {
                const { progress } = get();
                const chapter = getChapterById(chapterId);
                if (!chapter) return false;

                // Chapitre 1 toujours accessible
                if (chapter.number === 1) return true;

                // Les autres chapitres nécessitent de compléter le précédent
                const prevChapterId = `chapter_${chapter.number - 1}`;
                return progress.completedChapters.includes(prevChapterId);
            }
        }),
        {
            name: 'gods-story-progress',  // Clé localStorage
            partialize: (state) => ({ progress: state.progress })  // Ne persiste que la progression
        }
    )
);
