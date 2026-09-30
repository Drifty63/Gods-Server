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
    // Chapitre 2 - Combat 2 : Le Dragon de Thèbes
    CHAPTER2_BATTLE2_NARRATOR,
    CHAPTER2_BATTLE2_DEPARTURE,
    CHAPTER2_BATTLE2_DRAGON_ATTACK,
    CHAPTER2_BATTLE2_WIN,
    CHAPTER2_BATTLE2_LOSE,
    // Chapitre 2 - Combat 3 : Arachné
    CHAPTER2_BATTLE3_CAMPFIRE,
    CHAPTER2_BATTLE3_COLONUS_ENTRANCE,
    CHAPTER2_BATTLE3_COLONUS_TRAVERSE,
    CHAPTER2_BATTLE3_ARACHNE_AMBUSH,
    CHAPTER2_BATTLE3_WIN,
    CHAPTER2_BATTLE3_LOSE,
    // Chapitre 2 - Combat 4 : Athènes - Le Temple d'Athéna
    CHAPTER2_BATTLE4_NARRATIVE,
    CHAPTER2_BATTLE4_ARRIVAL,
    CHAPTER2_BATTLE4_INTERCEPT,
    CHAPTER2_BATTLE4_TEMPLE,
    CHAPTER2_BATTLE4_CONFRONTATION,
    CHAPTER2_BATTLE4_WIN,
    CHAPTER2_BATTLE4_LOSE,
    // Chapitre 3 (dialogues gardés mais combats supprimés)
    CH3_BATTLE1_DEPARTURE,
    CH3_BATTLE1_BRIEFING,
    CH3_BATTLE1_EVENING,
    CH3_BATTLE1_ROCKY_ISLES,
    CH3_BATTLE1_NARROWS,
    CH3_BATTLE1_AMBUSH_TRAP,
    CH3_BATTLE1_AMBUSH_ZEUS,
    CH3_BATTLE1_AMBUSH_DECK,
    CH3_BATTLE1_WIN,
    CH3_BATTLE1_LOSE
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
        // L'ecran VS de ce combat, et lui seul, garde l'Olympe sous l'orage.
        //
        // C'est le plan large qui servait de decor a TOUTES les scenes du mode avant que
        // chacune recoive son illustration ; il ne s'affichait plus nulle part. Le dialogue
        // qui precede garde battle1_intro.png, si bien que les deux ecrans cessent aussi de
        // montrer la meme image coup sur coup.
        backgroundImage: '/assets/story/olympus_storm.png',
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
        // Symétrique de la défaite ci-dessous, qui avait son image alors que la victoire n'en
        // avait aucune : la scène retombait sur le fond générique. Le joueur qui gagnait voyait
        // donc un décor plus pauvre que celui qui perdait.
        backgroundImage: '/assets/story/battle1_victory_v2.png',
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
    battles: CHAPTER_1_BATTLES
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
        backgroundImage: '/assets/story/ch2_betrayal_v2.png',
        nextEventId: 'ch2_battle1'
    },
    // Combat 4v3 : Zeus + Hestia + Déméter + Artémis vs Dionysos + Apollon + Aphrodite
    {
        id: 'ch2_battle1',
        type: 'battle',
        backgroundImage: '/assets/story/ch2_betrayal_v2.png',
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
        nextEventId: 'ch2_battle2_narrator'  // Continue vers combat 2
    },
    // Après combat - Défaite
    {
        id: 'ch2_battle1_lose',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE1_LOSE,
        backgroundImage: '/assets/story/ch2_battle1_defeat_v2.png',
        nextEventId: undefined  // Doit réessayer
    }
];

// ===========================================
// COMBAT 2 DU CHAPITRE 2 - LE DRAGON DE THÈBES
// Zeus + Aphrodite + Apollon + Dionysos vs Dragon (4v1)
// ===========================================

const chapter2Battle2Events: StoryEvent[] = [
    // Narrateur - Le matin à la villa
    {
        id: 'ch2_battle2_narrator',
        type: 'cutscene',
        dialogues: CHAPTER2_BATTLE2_NARRATOR,
        backgroundImage: '/assets/story/ch2_villa_morning.png',
        nextEventId: 'ch2_battle2_departure'
    },
    // Départ de Thèbes
    {
        id: 'ch2_battle2_departure',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE2_DEPARTURE,
        backgroundImage: '/assets/story/ch2_leaving_thebes.png',
        nextEventId: 'ch2_battle2_dragon_attack'
    },
    // Attaque du Dragon
    {
        id: 'ch2_battle2_dragon_attack',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE2_DRAGON_ATTACK,
        backgroundImage: '/assets/story/ch2_dragon_attack.png',
        nextEventId: 'ch2_battle2'
    },
    // Combat 4v1 : Zeus + Aphrodite + Apollon + Dionysos vs Dragon de Thèbes
    {
        id: 'ch2_battle2',
        type: 'battle',
        backgroundImage: '/assets/story/ch2_dragon_attack.png',
        battle: {
            id: 'battle_dragon_thebes',
            name: "Le Dragon de Thèbes",
            description: "Le descendant du dragon d'Arès attaque ! Hestia, Déméter et Artémis sont inconscientes !",
            playerTeam: ['zeus', 'aphrodite', 'apollon', 'dionysos'],
            enemyTeam: ['dragon_thebes'],
            deckMultiplier: 1,           // x1 pour le joueur (20 cartes)
            enemyDeckMultiplier: 4,      // x4 pour le dragon (20 cartes aussi)
            enemyHealthOverride: { dragon_thebes: 75 }, // 75 PV en mode histoire
            continueOnDefeat: false      // Doit gagner pour continuer
        },
        nextEventOnWin: 'ch2_battle2_win',
        nextEventOnLose: 'ch2_battle2_lose'
    },
    // Après combat - Victoire
    {
        id: 'ch2_battle2_win',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE2_WIN,
        backgroundImage: '/assets/story/ch2_dragon_victory.png',
        nextEventId: 'ch2_battle3_campfire'  // Continue vers combat 3
    },
    // Après combat - Défaite
    {
        id: 'ch2_battle2_lose',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE2_LOSE,
        backgroundImage: '/assets/story/ch2_dragon_defeat.png',
        nextEventId: undefined  // Doit réessayer
    }
];

// ===========================================
// CHAPITRE 2 - COMBAT 3 : ARACHNÉ
// ===========================================
const chapter2Battle3Events: StoryEvent[] = [
    // Scène 1 : Campement de nuit
    {
        id: 'ch2_battle3_campfire',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE3_CAMPFIRE,
        backgroundImage: '/assets/story/ch2_campfire.png',
        nextEventId: 'ch2_battle3_colonus_entrance'
    },
    // Scène 2 : Arrivée devant le Bois de Colone
    {
        id: 'ch2_battle3_colonus_entrance',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE3_COLONUS_ENTRANCE,
        backgroundImage: '/assets/story/ch2_colonus_entrance.png',
        nextEventId: 'ch2_battle3_colonus_traverse'
    },
    // Scène 3 : Traversée du bois
    {
        id: 'ch2_battle3_colonus_traverse',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE3_COLONUS_TRAVERSE,
        backgroundImage: '/assets/story/ch2_colonus_traverse.png',
        nextEventId: 'ch2_battle3_ambush'
    },
    // Scène 4 : Embuscade d'Arachné
    {
        id: 'ch2_battle3_ambush',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE3_ARACHNE_AMBUSH,
        backgroundImage: '/assets/story/ch2_arachne_ambush.png',
        nextEventId: 'ch2_battle3_fight'
    },
    // Combat contre Arachné
    {
        id: 'ch2_battle3_fight',
        type: 'battle',
        dialogues: [],
        backgroundImage: '/assets/story/ch2_arachne_ambush.png',
        battle: {
            id: 'battle_arachne',
            name: "L'Embuscade d'Arachné",
            // La description s'affiche sur l'écran d'INTRODUCTION, c'est-à-dire APRÈS que le
            // joueur a composé son équipe. Elle y demandait de choisir une équipe déjà choisie.
            description: "Arachné et ses araignées géantes surgissent de toutes parts.",
            playerTeam: ['zeus'],  // Zeus obligatoire, 3 autres au choix
            playerTeamChoices: ['hestia', 'demeter', 'artemis', 'aphrodite', 'apollon', 'dionysos'],
            requiredPlayerTeamSize: 4,
            enemyTeam: ['arachne', 'giant_spider_1', 'giant_spider_2', 'giant_spider_3'],
            deckMultiplier: 1,
            enemyDeckMultiplier: 1,
            enemyHealthOverride: { arachne: 50 },  // 50 PV en mode histoire
            continueOnDefeat: false
        },
        nextEventOnWin: 'ch2_battle3_win',
        nextEventOnLose: 'ch2_battle3_lose'
    },
    // Victoire
    {
        id: 'ch2_battle3_win',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE3_WIN,
        backgroundImage: '/assets/story/ch2_arachne_victory.png',
        nextEventId: 'ch2_battle4_narrative'  // Continue vers combat 4
    },
    // Défaite
    {
        id: 'ch2_battle3_lose',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE3_LOSE,
        backgroundImage: '/assets/story/ch2_arachne_defeat.png',
        nextEventId: undefined  // Doit réessayer
    }
];

// ===========================================
// CHAPITRE 2 - COMBAT 4 : ATHÈNES - LE TEMPLE D'ATHÉNA
// Zeus + Artémis vs Athéna + Ulysse + Chevalier d'Athéna
// ===========================================
const chapter2Battle4Events: StoryEvent[] = [
    // Scène 1 : Narration - Le voyage vers Athènes
    {
        id: 'ch2_battle4_narrative',
        type: 'cutscene',
        dialogues: CHAPTER2_BATTLE4_NARRATIVE,
        backgroundImage: '/story/chapter2/combat4_athens_arrival.png',
        nextEventId: 'ch2_battle4_arrival'
    },
    // Scène 2 : Arrivée à Athènes
    {
        id: 'ch2_battle4_arrival',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE4_ARRIVAL,
        backgroundImage: '/story/chapter2/combat4_athens_arrival.png',
        nextEventId: 'ch2_battle4_intercept'
    },
    // Scène 3 : Les chevaliers interceptent les dieux
    {
        id: 'ch2_battle4_intercept',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE4_INTERCEPT,
        backgroundImage: '/story/chapter2/combat4_knights_intercept.png',
        nextEventId: 'ch2_battle4_temple'
    },
    // Scène 4 : Le Temple d'Athéna - Rencontre avec Athéna et Ulysse
    {
        id: 'ch2_battle4_temple',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE4_TEMPLE,
        backgroundImage: '/story/chapter2/combat4_temple_meeting.png',
        nextEventId: 'ch2_battle4_confrontation'
    },
    // Scène 5 : Confrontation Zeus vs Athéna
    {
        id: 'ch2_battle4_confrontation',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE4_CONFRONTATION,
        backgroundImage: '/story/chapter2/combat4_confrontation.png',
        nextEventId: 'ch2_battle4_fight'
    },
    // Combat : Zeus + Artémis vs Athéna + Ulysse + Chevalier d'Athéna
    {
        id: 'ch2_battle4_fight',
        type: 'battle',
        dialogues: [],
        backgroundImage: '/story/chapter2/combat4_confrontation.png',
        battle: {
            id: 'battle_athens_temple',
            name: "Le Défi d'Athéna",
            description: "Zeus et Artémis affrontent Athéna, Ulysse et un Chevalier pour prouver la valeur des mortels !",
            playerTeam: ['zeus', 'artemis'],
            enemyTeam: ['athena', 'ulysses', 'athena_knight'],
            deckMultiplier: 2,           // x2 pour le joueur (20 cartes total)
            enemyDeckMultiplier: 1,      // x1 pour l'IA (15 cartes total)
            continueOnDefeat: false
        },
        nextEventOnWin: 'ch2_battle4_win',
        nextEventOnLose: 'ch2_battle4_lose'
    },
    // Victoire - Fin du Chapitre 2
    {
        id: 'ch2_battle4_win',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE4_WIN,
        backgroundImage: '/story/chapter2/combat4_victory.png',
        nextEventId: undefined  // Fin du chapitre 2
    },
    // Défaite
    {
        id: 'ch2_battle4_lose',
        type: 'dialogue',
        dialogues: CHAPTER2_BATTLE4_LOSE,
        backgroundImage: '/story/chapter2/combat4_defeat.png',
        nextEventId: undefined  // Doit réessayer
    }
];

// Tous les événements du chapitre 2
const chapter2Events: StoryEvent[] = [
    ...chapter2Battle1Events,
    ...chapter2Battle2Events,
    ...chapter2Battle3Events,
    ...chapter2Battle4Events
];

// Configuration des combats du chapitre 2
export const CHAPTER_2_BATTLES = [
    {
        id: 'battle1',
        name: "La Trahison de Thèbes",
        description: "À Thèbes, une trahison inattendue attend Zeus et ses alliés",
        firstEventId: 'ch2_battle1_narrator',
        unlocked: true,              // Débloqué dès le début du chapitre
        requiresBattleId: undefined  // Pas de prérequis
    },
    {
        id: 'battle2',
        name: "Le Dragon de Thèbes",
        description: "Un dragon légendaire bloque la route vers Athènes",
        firstEventId: 'ch2_battle2_narrator',
        unlocked: false,              // Débloqué après combat 1
        requiresBattleId: 'battle1'
    },
    {
        id: 'battle3',
        name: "L'Embuscade d'Arachné",
        description: "Dans le Bois de Colone, Arachné et ses araignées tendent une embuscade",
        firstEventId: 'ch2_battle3_campfire',
        unlocked: false,              // Débloqué après combat 2
        requiresBattleId: 'battle2'
    },
    {
        id: 'battle4',
        name: "Le Temple d'Athéna",
        description: "À Athènes, Zeus doit prouver la valeur des mortels face à Athéna et Ulysse",
        firstEventId: 'ch2_battle4_narrative',
        unlocked: false,              // Débloqué après combat 3
        requiresBattleId: 'battle3'
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
    comingSoon: false
};

// ===========================================
// CHAPITRE 3 - L'EXPÉDITION
// Combat 1 : Ulysse + Athéna + Artémis vs 2 Harpies + 2 Sirènes
// ===========================================

/*
 * ILLUSTRATIONS EN ATTENTE.
 *
 * Aucune scène ne porte encore de `backgroundImage` : les images du combat 1 seront fournies
 * plus tard. En leur absence, le mode Histoire retombe sur le fond du narrateur, ce qui est
 * lisible — alors qu'un chemin pointant vers un fichier absent afficherait un cadre vide.
 *
 * DIX fichiers, dans /public/story/chapter3/ — une par scène, sauf l'embuscade qui en prend
 * trois : elle couvre trois moments visuels qu'une seule image ne pourrait pas tenir.
 *
 *   combat1_departure.png    — le quai du Pirée à l'aube, le navire aux flancs sombres et à la
 *                              voile reprisée, les neuf silhouettes sur le quai, les mouettes
 *   combat1_briefing.png     — sur le pont en pleine mer, la carte usée déroulée sur un tonneau,
 *                              les neuf penchés autour, Ulysse le doigt sur la carte
 *   combat1_evening.png      — le pont au soleil couchant, mer d'huile, pain et fromage, Apollon
 *                              accordant sa lyre, Déméter seule contre le bastingage
 *   combat1_rocky_isles.png  — vu de la proue : brume basse, et au loin des rochers noirs
 *                              dressés à la verticale par dizaines, comme des dents
 *   combat1_narrows.png      — le navire minuscule dans un couloir de falaises qui volent le
 *                              ciel, jour gris, la coque frôlant la pierre
 *   combat1_ambush_trap.png  — le piège se referme : des sirènes femmes-oiseaux perchées sur les
 *                              falaises des deux côtés, des harpies plein le ciel étroit
 *   combat1_ambush_zeus.png  — Zeus plaqué contre le mât, des serres dans les épaules, une harpie
 *                              hurlant sur la vergue au-dessus de lui, la foudre qui s'éteint
 *   combat1_ambush_deck.png  — le pont partagé : Apollon, Dionysos et Aphrodite cloués à la
 *                              rambarde par trois flèches, Déméter à genoux, Hestia les mains
 *                              levées sous un dôme de feu, Athéna et Artémis dos à dos
 *   combat1_victory.png      — les falaises s'écartent, la brume se déchire, la mer redevient
 *                              large ; sur le pont Hestia assise, épuisée, la sphère éteinte
 *   combat1_defeat.png       — l'épave échouée en travers d'un rocher, quille en l'air, voile en
 *                              cendres, des harpies posées dessus les ailes repliées
 */
const chapter3Battle1Events: StoryEvent[] = [
    // Scène 1 : l'embarquement au Pirée
    {
        id: 'ch3_battle1_departure',
        type: 'cutscene',
        dialogues: CH3_BATTLE1_DEPARTURE,
        nextEventId: 'ch3_battle1_briefing'
    },
    // Scène 2 : Ulysse détaille l'itinéraire sur le pont
    {
        id: 'ch3_battle1_briefing',
        type: 'dialogue',
        dialogues: CH3_BATTLE1_BRIEFING,
        nextEventId: 'ch3_battle1_evening'
    },
    // Scène 3 : transition du soir — le calme avant la tempête
    {
        id: 'ch3_battle1_evening',
        type: 'dialogue',
        dialogues: CH3_BATTLE1_EVENING,
        nextEventId: 'ch3_battle1_rocky_isles'
    },
    // Scène 4 : au petit matin, les îles rocheuses
    {
        id: 'ch3_battle1_rocky_isles',
        type: 'cutscene',
        dialogues: CH3_BATTLE1_ROCKY_ISLES,
        nextEventId: 'ch3_battle1_narrows'
    },
    // Scène 5 : la navigation dans le passage étroit
    {
        id: 'ch3_battle1_narrows',
        type: 'dialogue',
        dialogues: CH3_BATTLE1_NARROWS,
        nextEventId: 'ch3_battle1_ambush_trap'
    },
    /*
     * Scène 6 : l'embuscade, en trois événements.
     *
     * Trois moments visuels, donc trois fonds : le piège qui se referme, Zeus cloué au mât, le
     * pont partagé. Le joueur ne voit aucune coupure — les dialogues s'enchaînent — mais l'image
     * suit l'action au lieu d'essayer de tenir les trois à la fois.
     */
    {
        id: 'ch3_battle1_ambush_trap',
        type: 'dialogue',
        dialogues: CH3_BATTLE1_AMBUSH_TRAP,
        nextEventId: 'ch3_battle1_ambush_zeus'
    },
    {
        id: 'ch3_battle1_ambush_zeus',
        type: 'dialogue',
        dialogues: CH3_BATTLE1_AMBUSH_ZEUS,
        nextEventId: 'ch3_battle1_ambush_deck'
    },
    {
        id: 'ch3_battle1_ambush_deck',
        type: 'dialogue',
        dialogues: CH3_BATTLE1_AMBUSH_DECK,
        nextEventId: 'ch3_battle1_fight'
    },
    /*
     * Le combat.
     *
     * Trois contre quatre, et c'est voulu : le chant a mis cinq des neuf hors d'état, et Hestia
     * tient la sphère. Ne restent que les trois personnages que le récit désigne — Athéna (la
     * raison), Artémis (la chasse) et Ulysse (la cire).
     *
     * Les adversaires portent des identifiants DISTINCTS (`harpies_2`, `sirenes_2`) bien qu'ils
     * représentent la même créature : le moteur résout une cible par `card.id`, donc deux cartes
     * de même identifiant dans une équipe rendraient la seconde intouchable jusqu'à la mort de
     * la première. Voir `twin()` dans data/units/builders.ts.
     */
    {
        id: 'ch3_battle1_fight',
        type: 'battle',
        dialogues: [],
        battle: {
            id: 'battle_rocky_isles',
            name: "Le Chant des Récifs",
            description: "Athéna, Artémis et Ulysse — les seuls que le chant n'atteint pas — contre deux sirènes et deux harpies alliées.",
            playerTeam: ['athena', 'artemis', 'ulysses'],
            enemyTeam: ['sirenes', 'sirenes_2', 'harpies', 'harpies_2'],
            /*
             * Pas de multiplicateur : 15 cartes contre 20.
             *
             * Le ×2 du chapitre 2 compensait un combat à DEUX dieux contre trois. Ici les trois
             * dieux ont 70 PV contre 72 en face : les forces sont déjà équilibrées, et 30 cartes
             * n'auraient rien compensé — elles auraient seulement supprimé toute pression.
             *
             * Le déficit de cartes est même le bon levier : c'est le joueur qui recyclera sa
             * pioche le premier, donc lui qui encaissera la fatigue. Il est poussé à conclure
             * vite, ce que le récit demande — Hestia tient la sphère et s'épuise.
             */
            deckMultiplier: 1,
            enemyDeckMultiplier: 1,
            continueOnDefeat: false
        },
        nextEventOnWin: 'ch3_battle1_win',
        nextEventOnLose: 'ch3_battle1_lose'
    },
    // Victoire : les récifs sont franchis, le combat 2 s'ouvre
    {
        id: 'ch3_battle1_win',
        type: 'dialogue',
        dialogues: CH3_BATTLE1_WIN,
        nextEventId: undefined
    },
    // Défaite : le navire recule, il faut recommencer
    {
        id: 'ch3_battle1_lose',
        type: 'dialogue',
        dialogues: CH3_BATTLE1_LOSE,
        nextEventId: undefined
    }
];

const chapter3Events: StoryEvent[] = [
    ...chapter3Battle1Events
];

/*
 * Quatre combats annoncés, un seul écrit.
 *
 * Les trois suivants portent `comingSoon` plutôt que d'être absents : le chapitre en compte
 * quatre, le joueur doit le voir, et une entrée manquante donnerait l'impression d'un chapitre
 * plus court qu'il ne sera. Sans ce drapeau, gagner le combat 1 débloquerait un combat 2 sans
 * événements, qui figerait l'écran.
 */
export const CHAPTER_3_BATTLES = [
    {
        id: 'battle1',
        name: "Le Chant des Récifs",
        description: "Aux îles rocheuses, sirènes et harpies attaquent ensemble — ce qui n'était jamais arrivé",
        firstEventId: 'ch3_battle1_departure',
        unlocked: true,
        requiresBattleId: undefined
    },
    {
        id: 'battle2',
        name: "Le Pays des Cyclopes",
        description: "Sur les îles sauvages, il faudra s'en prendre aux fils de Poséidon pour le faire venir",
        firstEventId: 'ch3_battle2_arrival',
        unlocked: false,
        requiresBattleId: 'battle1',
        comingSoon: true
    },
    {
        id: 'battle3',
        name: "La Colère de Poséidon",
        description: "Le dieu des mers transgresse la loi divine pour s'en prendre lui-même à Ulysse",
        firstEventId: 'ch3_battle3_storm',
        unlocked: false,
        requiresBattleId: 'battle2',
        comingSoon: true
    },
    {
        id: 'battle4',
        name: "Le Cap Ténare",
        description: "À la porte des Enfers, ce qui garde le passage vers l'Olympe",
        firstEventId: 'ch3_battle4_gate',
        unlocked: false,
        requiresBattleId: 'battle3',
        comingSoon: true
    }
];

const CHAPTER_3: Chapter = {
    id: 'chapter_3',
    number: 3,
    title: "L'Expédition",
    subtitle: 'Rallier Poséidon',
    description: "Pour espérer trouver un passage des Enfers jusqu'à l'Olympe, les dieux doivent rallier Poséidon à leur cause. Le trouver demande de traverser la mer entière, et de nombreuses épreuves les attendent avant de l'affronter.",
    difficulty: 'hard',
    events: chapter3Events,
    battles: CHAPTER_3_BATTLES,
    comingSoon: false
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
