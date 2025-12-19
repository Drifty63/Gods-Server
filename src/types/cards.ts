// Types pour les cartes du jeu GODS

export type Element =
    | 'fire'      // 🔥 Feu
    | 'air'       // 💨 Air
    | 'earth'     // 🌿 Terre
    | 'lightning' // ⚡ Foudre
    | 'water'     // 💧 Eau
    | 'light'     // ☀️ Lumière
    | 'darkness'; // 💀 Ténèbres

export type SpellType =
    | 'generator'   // Générateur d'énergie
    | 'competence'  // Compétence (attaque/effet)
    | 'utility';    // Utilitaire

export type StatusEffect =
    | 'poison'      // Marque de poison
    | 'lightning'   // Marque de foudre
    | 'shield'      // Bouclier
    | 'provocation' // Provocation (taunt)
    | 'stun'        // Stun (étourdi/gel)
    | 'weakness'    // Faiblesse élémentaire temporaire
    | 'weakness_immunity'; // Immunité aux faiblesses

export type TargetType =
    | 'enemy_god'        // Un dieu ennemi
    | 'all_enemies'      // Tous les dieux ennemis
    | 'ally_god'         // Un dieu allié
    | 'all_allies'       // Tous les dieux alliés
    | 'self'             // Le dieu qui lance le sort
    | 'any_god'          // N'importe quel dieu
    | 'all_gods'         // Tous les dieux
    | 'dead_ally_god'    // Un dieu allié mort (pour résurrection)
    | 'enemy_hand'       // Main adverse (pour discard)
    | 'same';            // Même cible que l'effet précédent

// Carte Dieu
export interface GodCard {
    id: string;
    name: string;
    element: Element;
    weakness: Element;
    maxHealth: number;
    imageUrl: string;
    carouselImage?: string; // Image spécifique pour le carrousel (optionnelle)
    flavorText: string;
    hidden?: boolean; // True si le dieu est caché (accessible uniquement aux créateurs)
}

// Effet d'un sort
export interface SpellEffect {
    type: 'damage' | 'heal' | 'shield' | 'energy' | 'draw' | 'discard' | 'mill' | 'status' | 'remove_status' | 'custom';
    value?: number;
    target?: TargetType;
    status?: StatusEffect;
    statusDuration?: number;
    customEffectId?: string; // Pour les effets spéciaux uniques
    description?: string;
}

// Carte Sort
export interface SpellCard {
    id: string;
    name: string;
    element: Element;
    godId: string;          // ID du dieu auquel appartient cette carte
    type: SpellType;
    energyCost: number;     // Coût en énergie (0 = carte générateur)
    energyGain: number;     // Énergie gagnée en jouant la carte
    effects: SpellEffect[];
    imageUrl: string;
    description: string;    // Texte de la carte
    isHiddenFromOwner?: boolean;  // Si true, le propriétaire ne voit pas cette carte (effet Nyx)
    revealedToPlayerId?: string;  // ID du joueur adverse qui peut voir cette carte
}

// État d'un dieu en jeu
export interface GodState {
    card: GodCard;
    currentHealth: number;
    statusEffects: {
        type: StatusEffect;
        stacks: number;       // Nombre de marques (poison, foudre, etc.)
        duration?: number;    // Tours restants pour les effets temporaires
    }[];
    isDead: boolean;
    temporaryWeakness?: Element; // Faiblesse temporaire appliquée par Artémis
    // Propriétés pour le zombie (Perséphone - Brûlure Rémanente)
    isZombie?: boolean;          // True si ce dieu est un zombie temporaire
    zombieCard?: SpellCard;      // La carte posée sur le zombie (va à la défausse si mort)
    zombieOwnerId?: string;      // ID du joueur qui contrôle le zombie (pour les dégâts de fin de tour)
}

// État d'un joueur
export interface PlayerState {
    id: string;
    name: string;
    gods: GodState[];
    hand: SpellCard[];
    deck: SpellCard[];
    discard: SpellCard[];
    removedCards: SpellCard[];           // Cartes retirées du jeu (dieux morts)
    energy: number;
    fatigueCounter: number;              // Compteur de recyclage du deck
    hasPlayedCard: boolean;              // A joué une carte ce tour
    hasDiscardedForEnergy: boolean;      // A défaussé pour énergie ce tour
}

// État de la partie
export interface GameState {
    id: string;
    status: 'waiting' | 'playing' | 'finished';
    currentPlayerId: string;
    turnNumber: number;
    players: [PlayerState, PlayerState];
    winnerId?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Action de jeu
export interface GameAction {
    type: 'play_card' | 'discard_for_energy' | 'end_turn' | 'select_target';
    playerId: string;
    cardId?: string;
    targetGodId?: string;           // Pour ciblage simple
    targetGodIds?: string[];        // Pour ciblage multiple (ex: 2 cibles)
    targetPlayerId?: string;
    selectedElement?: Element;      // Élément choisi pour apply_weakness (Artémis)
    lightningAction?: 'apply' | 'remove';  // Choix pour les sorts de Zeus (appliquer ou retirer ⚡)
}
