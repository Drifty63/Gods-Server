// Configuration de la campagne Zeus
import { StoryCampaign, Chapter, StoryEvent } from '@/types/story';
import {
    PROLOGUE_NARRATIVE,
    PROLOGUE_INTRO,
    PROLOGUE_AFTER_BATTLE_1_WIN,
    PROLOGUE_AFTER_BATTLE_1_LOSE,
    PROLOGUE_HADES_TAKES_THRONE,
    PROLOGUE_END,
    // Combat 2 du prologue
    PROLOGUE_BATTLE2_NARRATOR,
    PROLOGUE_BATTLE2_INTRO,
    PROLOGUE_BATTLE2_WIN,
    PROLOGUE_BATTLE2_LOSE,
    // Chapitre 2 (dialogues gardés mais combats supprimés)
    CHAPTER2_INTRO,
    CHAPTER2_END,
    // Chapitre 3 (dialogues gardés mais combats supprimés)
    CHAPTER3_INTRO,
    CHAPTER3_EPILOGUE
} from './dialogues';

// ===========================================
// CHAPITRE 1 - PROLOGUE : LA TRAHISON
// Combat 1 : Zeus vs Hadès (1v1)
// Combat 2 : Zeus + Hestia vs Arès (2v1)
// ===========================================

// Événements du Combat 1 : Duel des Frères
const chapter1Battle1Events: StoryEvent[] = [
    // Introduction narrative - Histoire mythologique
    {
        id: 'ch1_narrative',
        type: 'cutscene',
        dialogues: PROLOGUE_NARRATIVE,
        nextEventId: 'ch1_intro'
    },
    // Dialogue Zeus vs Hadès avant le combat
    {
        id: 'ch1_intro',
        type: 'dialogue',
        dialogues: PROLOGUE_INTRO,
        nextEventId: 'ch1_battle1'
    },
    // Combat 1v1 : Zeus vs Hadès
    {
        id: 'ch1_battle1',
        type: 'battle',
        battle: {
            id: 'battle_zeus_vs_hades',
            name: "Duel des Frères",
            description: "Zeus affronte Hadès en combat singulier pour le trône de l'Olympe !",
            playerTeam: ['zeus'],
            enemyTeam: ['hades'],
            deckMultiplier: 4,
            playerCondition: {
                type: 'half_hp',
                description: "L'attaque surprise d'Hadès a affaibli Zeus (50% PV)"
            },
            continueOnDefeat: true,
            rewards: [
                {
                    type: 'ambroisie',
                    amount: 100,
                    description: '100 Ambroisie'
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
        nextEventId: 'ch1_end_battle1'
    },
    // Fin du combat 1
    {
        id: 'ch1_end_battle1',
        type: 'dialogue',
        dialogues: PROLOGUE_END,
        nextEventId: undefined  // Retour à la sélection
    }
];

// Événements du Combat 2 : Refuge chez Hestia
const chapter1Battle2Events: StoryEvent[] = [
    // Narrateur - Zeus fuit vers la Terre
    {
        id: 'ch1_battle2_narrator',
        type: 'cutscene',
        dialogues: PROLOGUE_BATTLE2_NARRATOR,
        backgroundImage: '/assets/story/earth_view.png',
        nextEventId: 'ch1_battle2_intro'
    },
    // Dialogue Zeus et Hestia, puis arrivée d'Arès
    {
        id: 'ch1_battle2_intro',
        type: 'dialogue',
        dialogues: PROLOGUE_BATTLE2_INTRO,
        backgroundImage: '/assets/story/hestia_cabin.png',
        nextEventId: 'ch1_battle2'
    },
    // Combat 2v1 : Zeus + Hestia vs Arès
    {
        id: 'ch1_battle2',
        type: 'battle',
        battle: {
            id: 'battle_zeus_hestia_vs_ares',
            name: "L'Attaque d'Arès",
            description: "Arès a retrouvé Zeus ! Repoussez le dieu de la guerre !",
            playerTeam: ['zeus', 'hestia'],      // 2 dieux alliés
            enemyTeam: ['ares'],                  // 1 ennemi
            deckMultiplier: 2,                    // x2 pour Zeus+Hestia (10 cartes)
            enemyDeckMultiplier: 4,               // x4 pour Arès (20 cartes)
            playerCondition: {
                type: 'three_quarter_hp',
                description: "Zeus n'a pas eu le temps de récupérer complètement (75% PV)"
            },
            continueOnDefeat: false,  // Doit gagner pour continuer
            rewards: [
                {
                    type: 'ambroisie',
                    amount: 150,
                    description: '150 Ambroisie'
                }
            ]
        },
        nextEventOnWin: 'ch1_battle2_win',
        nextEventOnLose: 'ch1_battle2_lose'
    },
    // Après combat - Victoire
    {
        id: 'ch1_battle2_win',
        type: 'dialogue',
        dialogues: PROLOGUE_BATTLE2_WIN,
        nextEventId: undefined  // Fin du combat 2
    },
    // Après combat - Défaite
    {
        id: 'ch1_battle2_lose',
        type: 'dialogue',
        dialogues: PROLOGUE_BATTLE2_LOSE,
        nextEventId: undefined  // Doit réessayer
    }
];

// Tous les événements du chapitre 1
const chapter1Events: StoryEvent[] = [
    ...chapter1Battle1Events,
    ...chapter1Battle2Events
];

// Configuration des combats du chapitre 1 (pour l'affichage de sélection)
export const CHAPTER_1_BATTLES = [
    {
        id: 'battle1',
        name: "Duel des Frères",
        description: "Zeus affronte Hadès pour le trône de l'Olympe",
        firstEventId: 'ch1_narrative',
        unlocked: true  // Toujours débloqué
    },
    {
        id: 'battle2',
        name: "L'Attaque d'Arès",
        description: "Zeus et Hestia affrontent Arès sur Terre",
        firstEventId: 'ch1_battle2_narrator',
        unlocked: false,  // Débloqué après le combat 1
        requiresBattleId: 'battle1'
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
    battles: CHAPTER_1_BATTLES,
    imageUrl: '/story/chapter1.jpg'
};

// ===========================================
// CHAPITRE 2 - LA RÉSISTANCE (À COMPLÉTER)
// Note: Les combats seront ajoutés dans une future mise à jour
// ===========================================
const chapter2Events: StoryEvent[] = [
    // Introduction - Placeholder
    {
        id: 'ch2_intro',
        type: 'dialogue',
        dialogues: CHAPTER2_INTRO,
        nextEventId: 'ch2_end'
    },
    // Fin du chapitre 2 (temporaire)
    {
        id: 'ch2_end',
        type: 'dialogue',
        dialogues: CHAPTER2_END,
        nextEventId: undefined
    }
];

const CHAPTER_2: Chapter = {
    id: 'chapter_2',
    number: 2,
    title: 'La Résistance',
    subtitle: 'À venir...',
    description: "Zeus et ses alliés doivent rallier les autres dieux à leur cause. (Chapitre en cours de développement)",
    difficulty: 'medium',
    events: chapter2Events,
    imageUrl: '/story/chapter2.jpg',
    comingSoon: true
};

// ===========================================
// CHAPITRE 3 - LA RECONQUÊTE (À COMPLÉTER)
// Note: Les combats seront ajoutés dans une future mise à jour
// ===========================================
const chapter3Events: StoryEvent[] = [
    // Introduction - Placeholder
    {
        id: 'ch3_intro',
        type: 'dialogue',
        dialogues: CHAPTER3_INTRO,
        nextEventId: 'ch3_epilogue'
    },
    // Épilogue (temporaire)
    {
        id: 'ch3_epilogue',
        type: 'dialogue',
        dialogues: CHAPTER3_EPILOGUE,
        nextEventId: undefined
    }
];

const CHAPTER_3: Chapter = {
    id: 'chapter_3',
    number: 3,
    title: 'La Reconquête',
    subtitle: 'À venir...',
    description: "L'heure de la confrontation finale approche. (Chapitre en cours de développement)",
    difficulty: 'hard',
    events: chapter3Events,
    imageUrl: '/story/chapter3.jpg',
    comingSoon: true
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
