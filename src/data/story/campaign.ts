// Configuration de la campagne Zeus
import { StoryCampaign, Chapter, StoryEvent } from '@/types/story';
import {
    PROLOGUE_INTRO,
    PROLOGUE_AFTER_BATTLE_1_WIN,
    PROLOGUE_AFTER_BATTLE_1_LOSE,
    PROLOGUE_HADES_TAKES_THRONE,
    PROLOGUE_END,
    // Chapitre 2
    CHAPTER2_INTRO,
    CHAPTER2_ATHENA_INTRO,
    CHAPTER2_AFTER_ARES_WIN,
    CHAPTER2_AFTER_ARES_LOSE,
    CHAPTER2_POSEIDON_INTRO,
    CHAPTER2_AFTER_POSEIDON_WIN,
    CHAPTER2_AFTER_POSEIDON_LOSE,
    CHAPTER2_END,
    // Chapitre 3
    CHAPTER3_INTRO,
    CHAPTER3_BEFORE_GUARDIAN_BATTLE,
    CHAPTER3_AFTER_GUARDIAN_WIN,
    CHAPTER3_AFTER_GUARDIAN_LOSE,
    CHAPTER3_HADES_CONFRONTATION,
    CHAPTER3_VICTORY,
    CHAPTER3_DEFEAT,
    CHAPTER3_EPILOGUE
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
// CHAPITRE 2 - LA RÉSISTANCE
// ===========================================
const chapter2Events: StoryEvent[] = [
    // Introduction - Recherche d'alliés
    {
        id: 'ch2_intro',
        type: 'dialogue',
        dialogues: CHAPTER2_INTRO,
        nextEventId: 'ch2_athena_intro'
    },
    // Rencontre avec Athéna
    {
        id: 'ch2_athena_intro',
        type: 'dialogue',
        dialogues: CHAPTER2_ATHENA_INTRO,
        nextEventId: 'ch2_battle_ares'
    },
    // Combat contre Arès et Artémis
    {
        id: 'ch2_battle_ares',
        type: 'battle',
        battle: {
            id: 'battle_ares_artemis',
            name: "Les Traîtres",
            description: "Arès et Artémis ont rejoint Hadès ! Repoussez-les !",
            enemyTeam: ['ares', 'artemis', 'apollon', 'demeter'],
            continueOnDefeat: true,
            rewards: [
                {
                    type: 'ambroisie',
                    amount: 75,
                    description: '75 Ambroisie'
                }
            ]
        },
        nextEventOnWin: 'ch2_after_ares_win',
        nextEventOnLose: 'ch2_after_ares_lose'
    },
    // Après combat Arès - Victoire
    {
        id: 'ch2_after_ares_win',
        type: 'dialogue',
        dialogues: CHAPTER2_AFTER_ARES_WIN,
        nextEventId: 'ch2_poseidon_intro'
    },
    // Après combat Arès - Défaite
    {
        id: 'ch2_after_ares_lose',
        type: 'dialogue',
        dialogues: CHAPTER2_AFTER_ARES_LOSE,
        nextEventId: 'ch2_poseidon_intro'
    },
    // Rencontre avec Poséidon
    {
        id: 'ch2_poseidon_intro',
        type: 'dialogue',
        dialogues: CHAPTER2_POSEIDON_INTRO,
        nextEventId: 'ch2_battle_poseidon'
    },
    // Combat contre les champions de Poséidon
    {
        id: 'ch2_battle_poseidon',
        type: 'battle',
        battle: {
            id: 'battle_poseidon_champions',
            name: "L'Épreuve des Mers",
            description: "Prouvez votre valeur à Poséidon en affrontant ses champions !",
            enemyTeam: ['poseidon', 'athena', 'demeter', 'apollon'],
            continueOnDefeat: true,
            rewards: [
                {
                    type: 'ambroisie',
                    amount: 100,
                    description: '100 Ambroisie'
                }
            ]
        },
        nextEventOnWin: 'ch2_after_poseidon_win',
        nextEventOnLose: 'ch2_after_poseidon_lose'
    },
    // Après combat Poséidon - Victoire  
    {
        id: 'ch2_after_poseidon_win',
        type: 'dialogue',
        dialogues: CHAPTER2_AFTER_POSEIDON_WIN,
        nextEventId: 'ch2_end'
    },
    // Après combat Poséidon - Défaite
    {
        id: 'ch2_after_poseidon_lose',
        type: 'dialogue',
        dialogues: CHAPTER2_AFTER_POSEIDON_LOSE,
        nextEventId: 'ch2_end'
    },
    // Fin du chapitre 2
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
    subtitle: 'Conflits Majeurs',
    description: "Zeus et ses alliés doivent rallier les autres dieux à leur cause pour reprendre l'Olympe des mains d'Hadès.",
    difficulty: 'medium',
    events: chapter2Events,
    imageUrl: '/story/chapter2.jpg'
};

// ===========================================
// CHAPITRE 3 - LA RECONQUÊTE
// ===========================================
const chapter3Events: StoryEvent[] = [
    // Introduction - Assaut de l'Olympe
    {
        id: 'ch3_intro',
        type: 'dialogue',
        dialogues: CHAPTER3_INTRO,
        nextEventId: 'ch3_guardian_intro'
    },
    // Avant le combat des gardiens
    {
        id: 'ch3_guardian_intro',
        type: 'dialogue',
        dialogues: CHAPTER3_BEFORE_GUARDIAN_BATTLE,
        nextEventId: 'ch3_battle_guardians'
    },
    // Combat contre Nyx et Thanatos
    {
        id: 'ch3_battle_guardians',
        type: 'battle',
        battle: {
            id: 'battle_guardians',
            name: "Les Gardiens des Ténèbres",
            description: "Nyx et Thanatos bloquent le chemin vers Hadès !",
            enemyTeam: ['nyx', 'thanatos', 'persephone', 'hades'],
            continueOnDefeat: true,
            rewards: [
                {
                    type: 'ambroisie',
                    amount: 125,
                    description: '125 Ambroisie'
                }
            ]
        },
        nextEventOnWin: 'ch3_after_guardian_win',
        nextEventOnLose: 'ch3_after_guardian_lose'
    },
    // Après combat gardiens - Victoire
    {
        id: 'ch3_after_guardian_win',
        type: 'dialogue',
        dialogues: CHAPTER3_AFTER_GUARDIAN_WIN,
        nextEventId: 'ch3_hades_confrontation'
    },
    // Après combat gardiens - Défaite
    {
        id: 'ch3_after_guardian_lose',
        type: 'dialogue',
        dialogues: CHAPTER3_AFTER_GUARDIAN_LOSE,
        nextEventId: 'ch3_hades_confrontation'
    },
    // Confrontation avec Hadès
    {
        id: 'ch3_hades_confrontation',
        type: 'cutscene',
        dialogues: CHAPTER3_HADES_CONFRONTATION,
        nextEventId: 'ch3_final_battle'
    },
    // Combat final contre Hadès
    {
        id: 'ch3_final_battle',
        type: 'battle',
        battle: {
            id: 'battle_final_hades',
            name: "La Bataille Finale",
            description: "Affrontez Hadès et reprenez le trône de l'Olympe !",
            enemyTeam: ['hades', 'nyx', 'ares', 'thanatos'],
            continueOnDefeat: false,  // Défaite = Game Over
            rewards: [
                {
                    type: 'ambroisie',
                    amount: 200,
                    description: '200 Ambroisie'
                },
                {
                    type: 'title',
                    amount: 1,
                    description: 'Titre : Sauveur de l\'Olympe'
                }
            ]
        },
        nextEventOnWin: 'ch3_victory',
        nextEventOnLose: 'ch3_defeat'
    },
    // Victoire finale
    {
        id: 'ch3_victory',
        type: 'cutscene',
        dialogues: CHAPTER3_VICTORY,
        nextEventId: 'ch3_epilogue'
    },
    // Défaite finale
    {
        id: 'ch3_defeat',
        type: 'cutscene',
        dialogues: CHAPTER3_DEFEAT,
        nextEventId: undefined  // Game Over
    },
    // Épilogue
    {
        id: 'ch3_epilogue',
        type: 'dialogue',
        dialogues: CHAPTER3_EPILOGUE,
        nextEventId: undefined  // Fin de la campagne
    }
];

const CHAPTER_3: Chapter = {
    id: 'chapter_3',
    number: 3,
    title: 'La Reconquête',
    subtitle: 'La Bataille Finale',
    description: "L'heure de la confrontation finale approche. Zeus doit affronter Hadès pour reprendre le trône de l'Olympe.",
    difficulty: 'hard',
    events: chapter3Events,
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
