// Configuration de la campagne Zeus
import { StoryCampaign, Chapter, StoryEvent } from '@/types/story';
import {
    PROLOGUE_INTRO,
    PROLOGUE_AFTER_BATTLE_1_WIN,
    PROLOGUE_AFTER_BATTLE_1_LOSE,
    PROLOGUE_HADES_TAKES_THRONE,
    PROLOGUE_END
} from './dialogues';

// ===========================================
// CHAPITRE 1 - PROLOGUE : LA TRAHISON
// ===========================================
const chapter1Events: StoryEvent[] = [
    // Introduction narrative
    {
        id: 'ch1_intro',
        type: 'dialogue',
        dialogues: PROLOGUE_INTRO,
        nextEventId: 'ch1_battle1'
    },
    // Combat 1 : L'embuscade d'Hadès
    {
        id: 'ch1_battle1',
        type: 'battle',
        battle: {
            id: 'battle_hades_ambush',
            name: "L'Embuscade",
            description: "Hadès attaque par surprise avec son armée des ténèbres !",
            enemyTeam: ['hades', 'nyx', 'apollon', 'ares'],
            playerCondition: {
                type: 'half_hp',
                description: "L'attaque surprise a affaibli votre équipe (50% PV)"
            },
            continueOnDefeat: true,  // L'histoire continue dans les deux cas
            rewards: [
                {
                    type: 'ambroisie',
                    amount: 50,
                    description: '50 Ambroisie'
                }
            ]
        },
        nextEventOnWin: 'ch1_after_battle_win',
        nextEventOnLose: 'ch1_after_battle_lose'
    },
    // Après combat - Victoire
    {
        id: 'ch1_after_battle_win',
        type: 'dialogue',
        dialogues: PROLOGUE_AFTER_BATTLE_1_WIN,
        nextEventId: 'ch1_hades_throne'
    },
    // Après combat - Défaite
    {
        id: 'ch1_after_battle_lose',
        type: 'dialogue',
        dialogues: PROLOGUE_AFTER_BATTLE_1_LOSE,
        nextEventId: 'ch1_hades_throne'
    },
    // Hadès prend le trône (commun)
    {
        id: 'ch1_hades_throne',
        type: 'cutscene',
        dialogues: PROLOGUE_HADES_TAKES_THRONE,
        nextEventId: 'ch1_end'
    },
    // Fin du chapitre
    {
        id: 'ch1_end',
        type: 'dialogue',
        dialogues: PROLOGUE_END,
        nextEventId: undefined  // Fin du chapitre
    }
];

const CHAPTER_1: Chapter = {
    id: 'chapter_1',
    number: 1,
    title: 'Prologue',
    subtitle: 'La Trahison',
    description: "L'Olympe est en paix depuis des siècles, mais une ombre menace l'équilibre des dieux. Hadès, jaloux du pouvoir de Zeus, prépare un coup d'état...",
    difficulty: 'easy',
    events: chapter1Events,
    imageUrl: '/story/chapter1.jpg'
};

// ===========================================
// CHAPITRE 2 - CONFLITS MAJEURS (À compléter)
// ===========================================
const CHAPTER_2: Chapter = {
    id: 'chapter_2',
    number: 2,
    title: 'La Résistance',
    subtitle: 'Conflits Majeurs',
    description: "Zeus et ses alliés doivent rallier les autres dieux à leur cause pour reprendre l'Olympe des mains d'Hadès.",
    difficulty: 'medium',
    events: [],  // À compléter avec les événements
    imageUrl: '/story/chapter2.jpg'
};

// ===========================================
// CHAPITRE 3 - CONCLUSION (À compléter)
// ===========================================
const CHAPTER_3: Chapter = {
    id: 'chapter_3',
    number: 3,
    title: 'La Reconquête',
    subtitle: 'La Bataille Finale',
    description: "L'heure de la confrontation finale approche. Zeus doit affronter Hadès pour reprendre le trône de l'Olympe.",
    difficulty: 'hard',
    events: [],  // À compléter avec les événements
    imageUrl: '/story/chapter3.jpg'
};

// ===========================================
// CAMPAGNE COMPLÈTE
// ===========================================
export const ZEUS_CAMPAIGN: StoryCampaign = {
    id: 'zeus_campaign',
    name: 'La Chute de l\'Olympe',
    description: 'Incarnez Zeus et son équipe dans une épopée pour sauver l\'Olympe de la tyrannie d\'Hadès.',
    playerTeam: ['zeus', 'hestia', 'aphrodite', 'dionysos'],
    chapters: [CHAPTER_1, CHAPTER_2, CHAPTER_3]
};

// Helper pour récupérer un chapitre par son ID
export function getChapterById(chapterId: string): Chapter | undefined {
    return ZEUS_CAMPAIGN.chapters.find(ch => ch.id === chapterId);
}

// Helper pour récupérer un événement par son ID
export function getEventById(chapterId: string, eventId: string): StoryEvent | undefined {
    const chapter = getChapterById(chapterId);
    if (!chapter) return undefined;
    return chapter.events.find(ev => ev.id === eventId);
}

// Helper pour récupérer le premier événement d'un chapitre
export function getFirstEvent(chapterId: string): StoryEvent | undefined {
    const chapter = getChapterById(chapterId);
    if (!chapter || chapter.events.length === 0) return undefined;
    return chapter.events[0];
}

// Helper pour récupérer l'événement suivant
export function getNextEvent(chapterId: string, currentEventId: string, won?: boolean): StoryEvent | undefined {
    const event = getEventById(chapterId, currentEventId);
    if (!event) return undefined;

    let nextId: string | undefined;

    if (event.type === 'battle' && won !== undefined) {
        nextId = won ? event.nextEventOnWin : event.nextEventOnLose;
    }

    if (!nextId) {
        nextId = event.nextEventId;
    }

    if (!nextId) return undefined;

    return getEventById(chapterId, nextId);
}
