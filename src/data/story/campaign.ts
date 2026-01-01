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
    PROLOGUE_BATTLE2_INTRO_CABIN,
    PROLOGUE_BATTLE2_ARES_ENTRANCE,
    PROLOGUE_BATTLE2_WIN,
    PROLOGUE_BATTLE2_LOSE,
    // Combat 3 du prologue
    PROLOGUE_BATTLE3_NARRATOR,
    PROLOGUE_BATTLE3_ARTEMIS_INTRO,
    PROLOGUE_BATTLE3_AFTER_REST,
    PROLOGUE_BATTLE3_DEMETER_INTRO,
    PROLOGUE_BATTLE3_WIN,
    PROLOGUE_BATTLE3_LOSE,
    // Combat 4 du prologue
    PROLOGUE_BATTLE4_NARRATOR,
    PROLOGUE_BATTLE4_COUNCIL,
    PROLOGUE_BATTLE4_AMBUSH,
    PROLOGUE_BATTLE4_WIN,
    PROLOGUE_BATTLE4_LOSE,
    // Chapitre 2 - Combat 1 : À Thèbes
    CHAPTER2_BATTLE1_NARRATOR,
    CHAPTER2_BATTLE1_THEBES_ARRIVAL,
    CHAPTER2_BATTLE1_BANQUET,
    CHAPTER2_BATTLE1_BETRAYAL,
    CHAPTER2_BATTLE1_WIN,
    CHAPTER2_BATTLE1_LOSE,
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
        backgroundImage: '/assets/story/battle1_intro.png',
        nextEventId: 'ch1_battle1'
    },
    // Combat 1v1 : Zeus vs Hadès
    {
        id: 'ch1_battle1',
        type: 'battle',
        backgroundImage: '/assets/story/battle1_intro.png',
        battle: {
            id: 'battle_zeus_vs_hades',
            name: "Duel des Frères",
            description: "Zeus affronte Hadès en combat singulier pour le trône de l'Olympe !",
            playerTeam: ['zeus'],
            enemyTeam: ['hades'],
            deckMultiplier: 4,
            playerCondition: {
                type: 'no_energy',
                description: "L'attaque surprise d'Hadès a affaibli Zeus (0 énergie de départ)"
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
        backgroundImage: '/assets/story/battle1_defeat.png',
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
    // Dialogue Zeus et Hestia dans la cabane tranquille
    {
        id: 'ch1_battle2_intro',
        type: 'dialogue',
        dialogues: PROLOGUE_BATTLE2_INTRO_CABIN,
        backgroundImage: '/assets/story/hestia_cabin.png',
        nextEventId: 'ch1_battle2_ares'
    },
    // Arès débarque et défonce la porte
    {
        id: 'ch1_battle2_ares',
        type: 'dialogue',
        dialogues: PROLOGUE_BATTLE2_ARES_ENTRANCE,
        backgroundImage: '/assets/story/battle2_ares_entrance.png',
        nextEventId: 'ch1_battle2'
    },
    // Combat 2v1 : Zeus + Hestia vs Arès
    {
        id: 'ch1_battle2',
        type: 'battle',
        backgroundImage: '/assets/story/battle2_ares_entrance.png',  // Même image que l'entrée d'Arès
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
                description: "Zeus n'a pas eu le temps de récupérer complètement (75% PV)",
                targetGod: 'zeus'  // Seulement Zeus, pas Hestia
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
    // Après combat - Victoire -> Continue vers combat 3
    {
        id: 'ch1_battle2_win',
        type: 'dialogue',
        dialogues: PROLOGUE_BATTLE2_WIN,
        backgroundImage: '/assets/story/battle2_victory.png',
        nextEventId: undefined  // Fin du combat 2, déblocage du combat 3
    },
    // Après combat - Défaite
    {
        id: 'ch1_battle2_lose',
        type: 'dialogue',
        dialogues: PROLOGUE_BATTLE2_LOSE,
        backgroundImage: '/assets/story/battle2_defeat.png',
        nextEventId: undefined  // Doit réessayer
    }
];

// ===========================================
// Combat 3 : Zeus + Hestia vs Déméter + Artémis (2v2)
// ===========================================
const chapter1Battle3Events: StoryEvent[] = [
    // Narrateur - Le voyage vers Artémis
    {
        id: 'ch1_battle3_narrator',
        type: 'dialogue',
        dialogues: PROLOGUE_BATTLE3_NARRATOR,
        backgroundImage: '/assets/story/forest_path_journey.png',
        nextEventId: 'ch1_battle3_artemis'
    },
    // Rencontre avec Artémis dans sa grotte
    {
        id: 'ch1_battle3_artemis',
        type: 'dialogue',
        dialogues: PROLOGUE_BATTLE3_ARTEMIS_INTRO,
        backgroundImage: '/assets/story/artemis_meeting_v2.png',
        nextEventId: 'ch1_battle3_after_rest'
    },
    // Après le repos - Artémis réveille Zeus et Hestia
    {
        id: 'ch1_battle3_after_rest',
        type: 'dialogue',
        dialogues: PROLOGUE_BATTLE3_AFTER_REST,
        backgroundImage: '/assets/story/artemis_wakeup_v2.png',
        nextEventId: 'ch1_battle3_demeter_intro'
    },
    // Arrivée chez Déméter
    {
        id: 'ch1_battle3_demeter_intro',
        type: 'dialogue',
        dialogues: PROLOGUE_BATTLE3_DEMETER_INTRO,
        backgroundImage: '/assets/story/confrontation_wheat_field.png',
        nextEventId: 'ch1_battle3'
    },
    // Combat contre Déméter et Artémis
    {
        id: 'ch1_battle3',
        type: 'battle',
        backgroundImage: '/assets/story/confrontation_wheat_field.png',  // Garder l'image de la confrontation
        battle: {
            id: 'battle_test_of_valor',
            name: "Test de Bravoure",
            description: "Déméter et Artémis vous testent. Prouvez votre valeur en moins de 20 tours !",
            playerTeam: ['zeus', 'hestia'],
            enemyTeam: ['demeter', 'artemis'],
            deckMultiplier: 2,           // x2 pour le joueur
            enemyDeckMultiplier: 2,      // x2 pour l'ennemi aussi
            playerCondition: {
                type: 'stunned',
                description: "Zeus est immobilisé par les racines de Déméter pendant 2 tours !",
                duration: 2  // 2 tours de stun au lieu de 1
            },
            maxTurns: 20,                // Condition: gagner en 20 tours max
            continueOnDefeat: false,     // Doit gagner pour continuer
            rewards: [
                {
                    type: 'ambroisie',
                    amount: 200,
                    description: '200 Ambroisie'
                }
            ]
        },
        nextEventOnWin: 'ch1_battle3_win',
        nextEventOnLose: 'ch1_battle3_lose'
    },
    // Après combat - Victoire
    {
        id: 'ch1_battle3_win',
        type: 'dialogue',
        dialogues: PROLOGUE_BATTLE3_WIN,
        backgroundImage: '/assets/story/battle3_victory.png',
        nextEventId: undefined  // Fin du prologue
    },
    // Après combat - Défaite
    {
        id: 'ch1_battle3_lose',
        type: 'dialogue',
        dialogues: PROLOGUE_BATTLE3_LOSE,
        backgroundImage: '/assets/story/battle3_defeat.png',
        nextEventId: undefined  // Doit réessayer
    }
];

// ===========================================
// Combat 4 : Zeus + Déméter + Artémis vs Arès + 2 Soldats (3v3)
// ===========================================
const chapter1Battle4Events: StoryEvent[] = [
    // Narrateur - Le chemin vers Athènes
    {
        id: 'ch1_battle4_narrator',
        type: 'dialogue',
        dialogues: PROLOGUE_BATTLE4_NARRATOR,
        backgroundImage: '/assets/story/farm_night_exterior.png',
        nextEventId: 'ch1_battle4_council'
    },
    // Conseil des 4 dieux autour de la table
    {
        id: 'ch1_battle4_council',
        type: 'dialogue',
        dialogues: PROLOGUE_BATTLE4_COUNCIL,
        backgroundImage: '/assets/story/gods_council_table.png',
        nextEventId: 'ch1_battle4_ambush'
    },
    // L'attaque nocturne d'Arès
    {
        id: 'ch1_battle4_ambush',
        type: 'dialogue',
        dialogues: PROLOGUE_BATTLE4_AMBUSH,
        backgroundImage: '/assets/story/battle4_ambush_v2.png',
        nextEventId: 'ch1_battle4'
    },
    // Combat 3v4 : Zeus + Déméter + Artémis vs Arès + 3 Soldats
    {
        id: 'ch1_battle4',
        type: 'battle',
        backgroundImage: '/assets/story/battle4_ambush_v2.png',
        battle: {
            id: 'battle_ambush_ares',
            name: "L'Embuscade d'Arès",
            description: "Arès attaque avec ses soldats ! Hestia est hors combat !",
            playerTeam: ['zeus', 'demeter', 'artemis'],
            enemyTeam: ['ares', 'soldier_ares_1', 'soldier_ares_2', 'soldier_ares_3'],
            deckMultiplier: 1,           // x1 pour le joueur (15 cartes: 5 en main, 10 dans deck)
            enemyDeckMultiplier: 1,      // x1 pour l'ennemi
            continueOnDefeat: false,     // Doit gagner pour continuer
            rewards: [
                {
                    type: 'ambroisie',
                    amount: 300,
                    description: '300 Ambroisie'
                }
            ]
        },
        nextEventOnWin: 'ch1_battle4_win',
        nextEventOnLose: 'ch1_battle4_lose'
    },
    // Après combat - Victoire
    {
        id: 'ch1_battle4_win',
        type: 'dialogue',
        dialogues: PROLOGUE_BATTLE4_WIN,
        backgroundImage: '/assets/story/battle4_victory.png',
        nextEventId: undefined  // Fin du prologue
    },
    // Après combat - Défaite
    {
        id: 'ch1_battle4_lose',
        type: 'dialogue',
        dialogues: PROLOGUE_BATTLE4_LOSE,
        backgroundImage: '/assets/story/battle4_defeat_v2.png',
        nextEventId: undefined  // Doit réessayer
    }
];

// Tous les événements du chapitre 1
const chapter1Events: StoryEvent[] = [
    ...chapter1Battle1Events,
    ...chapter1Battle2Events,
    ...chapter1Battle3Events,
    ...chapter1Battle4Events
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
    },
    {
        id: 'battle3',
        name: "Test de Bravoure",
        description: "Déméter et Artémis testent la valeur de Zeus",
        firstEventId: 'ch1_battle3_narrator',
        unlocked: false,  // Débloqué après le combat 2
        requiresBattleId: 'battle2'
    },
    {
        id: 'battle4',
        name: "L'Embuscade d'Arès",
        description: "Arès attaque de nuit avec ses soldats",
        firstEventId: 'ch1_battle4_narrator',
        unlocked: false,  // Débloqué après le combat 3
        requiresBattleId: 'battle3'
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
// CHAPITRE 2 - LA RÉSISTANCE
// Combat 1 : Zeus + Hestia + Déméter + Artémis vs Dionysos + Apollon + Aphrodite (4v3)
// ===========================================

// Événements du Combat 1 : À Thèbes
const chapter2Battle1Events: StoryEvent[] = [
    // Narrateur - Le voyage vers Thèbes
    {
        id: 'ch2_battle1_narrator',
        type: 'cutscene',
        dialogues: CHAPTER2_BATTLE1_NARRATOR,
        backgroundImage: '/assets/story/thebes_journey.png',
        nextEventId: 'ch2_battle1_thebes_arrival'
    },
    // Arrivée à Thèbes - Le satyre
    {
        id: 'ch2_battle1_thebes_arrival',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE1_THEBES_ARRIVAL,
        backgroundImage: '/assets/story/thebes_street_satyr.png',
        nextEventId: 'ch2_battle1_banquet'
    },
    // Arrivée au banquet de Dionysos
    {
        id: 'ch2_battle1_banquet',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE1_BANQUET,
        backgroundImage: '/assets/story/dionysos_banquet.png',
        nextEventId: 'ch2_battle1_betrayal'
    },
    // La trahison - Le vin empoisonné
    {
        id: 'ch2_battle1_betrayal',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE1_BETRAYAL,
        backgroundImage: '/assets/story/betrayal_reveal.png',
        nextEventId: 'ch2_battle1'
    },
    // Combat 4v3 : Zeus + Hestia + Déméter + Artémis vs Dionysos + Apollon + Aphrodite
    {
        id: 'ch2_battle1',
        type: 'battle',
        backgroundImage: '/assets/story/betrayal_reveal.png',
        battle: {
            id: 'battle_thebes_betrayal',
            name: "La Trahison de Thèbes",
            description: "Empoisonnés par le vin de Dionysos, affrontez vos assaillants envoûtés !",
            playerTeam: ['zeus', 'hestia', 'demeter', 'artemis'],
            enemyTeam: ['dionysos', 'apollon', 'aphrodite'],
            deckMultiplier: 1,           // x1 - 5 cartes par dieu = 20 cartes joueur (5 main + 15 deck)
            enemyDeckMultiplier: 1,      // x1 - 5 cartes par dieu = 15 cartes ennemi (5 main + 10 deck)
            playerCondition: {
                type: 'poisoned',
                description: "Tous vos dieux sont empoisonnés (2 marques de poison) !",
                poisonStacks: 2  // Tous les dieux du joueur ont 2 poison
            },
            continueOnDefeat: false      // Doit gagner pour continuer
        },
        nextEventOnWin: 'ch2_battle1_win',
        nextEventOnLose: 'ch2_battle1_lose'
    },
    // Après combat - Victoire
    {
        id: 'ch2_battle1_win',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE1_WIN,
        backgroundImage: '/assets/story/chapter2_battle1_victory.png',
        nextEventId: undefined  // Fin du combat 1 du chapitre 2
    },
    // Après combat - Défaite
    {
        id: 'ch2_battle1_lose',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE1_LOSE,
        backgroundImage: '/assets/story/chapter2_battle1_defeat.png',
        nextEventId: undefined  // Doit réessayer
    }
];

// Tous les événements du chapitre 2
const chapter2Events: StoryEvent[] = [
    ...chapter2Battle1Events
];

// Configuration des combats du chapitre 2
export const CHAPTER_2_BATTLES = [
    {
        id: 'battle1',
        name: "La Trahison de Thèbes",
        description: "À Thèbes, une trahison inattendue attend Zeus et ses alliés",
        firstEventId: 'ch2_battle1_narrator',
        unlocked: true,              // Débloqué dès le début du chapitre
        requiresBattleId: undefined  // Pas de prérequis dans le chapitre 2
    }
];

const CHAPTER_2: Chapter = {
    id: 'chapter_2',
    number: 2,
    title: 'La Résistance',
    subtitle: 'Rallier les Alliés',
    description: "Zeus et ses alliés voyagent vers Thèbes pour rallier Dionysos, mais une trahison les attend...",
    difficulty: 'medium',
    events: chapter2Events,
    battles: CHAPTER_2_BATTLES,  // Ajout pour affichage dans le modal
    imageUrl: '/story/chapter2.jpg',
    comingSoon: false
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
