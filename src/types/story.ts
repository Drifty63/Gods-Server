// Types pour le mode Histoire

export type StoryEventType = 'dialogue' | 'battle' | 'choice' | 'cutscene';

export interface DialogueLine {
    speakerId: string;       // ID du dieu qui parle
    speakerName: string;     // Nom affiché
    text: string;            // Texte du dialogue
    emotion?: 'neutral' | 'angry' | 'sad' | 'happy' | 'surprised' | 'determined';
}

export interface BattleCondition {
    type: 'half_hp' | 'no_energy' | 'debuff' | 'normal';
    description: string;
}

export interface BattleConfig {
    id: string;
    name: string;
    description: string;
    enemyTeam: string[];           // IDs des dieux ennemis
    playerTeam?: string[];         // IDs des dieux du joueur (si différent de la campagne)
    deckMultiplier?: number;       // Multiplicateur des cartes du deck (ex: 4 pour 1v1)
    playerCondition?: BattleCondition;  // Condition spéciale pour le joueur
    enemyCondition?: BattleCondition;   // Condition spéciale pour l'ennemi
    continueOnDefeat: boolean;     // L'histoire continue même en cas de défaite
    rewards?: StoryReward[];
}

export interface StoryReward {
    type: 'ambroisie' | 'card' | 'title' | 'cosmetic';
    amount?: number;
    itemId?: string;
    description: string;
}

export interface StoryEvent {
    id: string;
    type: StoryEventType;
    dialogues?: DialogueLine[];
    battle?: BattleConfig;
    nextEventId?: string;          // ID de l'événement suivant
    nextEventOnWin?: string;       // Si différent selon victoire
    nextEventOnLose?: string;      // Si différent selon défaite
}

export interface Chapter {
    id: string;
    number: number;
    title: string;
    subtitle: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    events: StoryEvent[];
    imageUrl?: string;
}

export interface StoryProgress {
    currentChapterId: string;
    currentEventId: string;
    currentEventIndex: number;
    completedChapters: string[];
    completedEvents: string[];
    battleResults: {
        eventId: string;
        won: boolean;
        attempts: number;
    }[];
    totalPlayTime: number;         // En secondes
    lastPlayedAt: string;          // ISO date string
}

export interface StoryCampaign {
    id: string;
    name: string;
    description: string;
    playerTeam: string[];          // IDs des dieux du joueur
    chapters: Chapter[];
}
