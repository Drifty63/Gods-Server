// Types pour le mode Histoire

export type StoryEventType = 'dialogue' | 'battle' | 'choice' | 'cutscene';

export interface DialogueLine {
    speakerId: string;       // ID du dieu qui parle
    speakerName: string;     // Nom affiché
    text: string;            // Texte du dialogue
    emotion?: 'neutral' | 'angry' | 'sad' | 'happy' | 'surprised' | 'determined' | 'worried';
}

export interface BattleCondition {
    type: 'half_hp' | 'three_quarter_hp' | 'no_energy' | 'debuff' | 'normal' | 'stunned' | 'poisoned';
    description: string;
    duration?: number;     // Durée en tours pour les effets temporaires
    targetGod?: string;    // ID du dieu ciblé (si non défini, tous les dieux sont affectés)
    poisonStacks?: number; // Nombre de marques de poison pour le type 'poisoned'
}

export interface BattleConfig {
    id: string;
    name: string;
    description: string;
    enemyTeam: string[];           // IDs des dieux ennemis
    playerTeam?: string[];         // IDs des dieux du joueur (si différent de la campagne)
    deckMultiplier?: number;       // Multiplicateur des cartes du deck du joueur
    enemyDeckMultiplier?: number;  // Multiplicateur des cartes du deck ennemi
    playerCondition?: BattleCondition;  // Condition spéciale pour le joueur
    enemyCondition?: BattleCondition;   // Condition spéciale pour l'ennemi
    maxTurns?: number;             // Limite de tours pour gagner (défaite si dépassé)
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
    backgroundImage?: string;      // Image de fond optionnelle pour la scène
    nextEventId?: string;          // ID de l'événement suivant
    nextEventOnWin?: string;       // Si différent selon victoire
    nextEventOnLose?: string;      // Si différent selon défaite
}

export interface ChapterBattle {
    id: string;
    name: string;
    description: string;
    firstEventId: string;          // Premier événement de ce combat
    unlocked: boolean;             // Débloqué par défaut ?
    requiresBattleId?: string;     // ID du combat à compléter pour débloquer
}

export interface Chapter {
    id: string;
    number: number;
    title: string;
    subtitle: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    events: StoryEvent[];
    battles?: ChapterBattle[];     // Liste des combats affichables dans le chapitre
    imageUrl?: string;
    comingSoon?: boolean;          // Chapitre en cours de développement
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
