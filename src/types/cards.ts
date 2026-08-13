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
    | 'weakness_immunity' // Immunité aux faiblesses
    | 'regen'       // Régénération (soin par tour)
    | 'untargetable' // Inciblable (ne peut pas être ciblé)
    | 'bleed'       // Saignement : dégâts en FIN DE TOUR, ignorent le bouclier
    | 'petrify';    // Pétrification : ne peut ni agir ni être soigné

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
    category?: 'god' | 'creature' | 'servant'; // Catégorie pour mode Duel (god par défaut)
    duelCost?: number; // Coût en points pour le mode Duel (5 pour dieux, 3 pour créatures, 2 pour serviteurs)
    affiliatedTo?: string; // ID du dieu auquel la créature/serviteur est affilié (ex: 'ares')
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
    afkTurns?: number;                   // Compteur de tours AFK (sans jouer de carte) - pour anti-AFK online
    godsCastThisMatch: string[];         // Ids des dieux ayant lancé au moins un sort cette partie (quête "jouer ce dieu")
    /**
     * Ascension : ce joueur recycle sa défausse sans subir les dégâts de fatigue. C'est une
     * propriété du JOUEUR et non de la partie : seul le grimpeur en bénéficie (il enchaîne les
     * combats sans se soigner), l'adversaire de chaque étage reste soumis à la fatigue normale.
     */
    noFatigueDamage?: boolean;
}

// Entrée du log de combat : permet à un joueur de vérifier après coup quelle carte a été jouée,
// notamment la sienne (ou celle de l'adversaire) s'il ne l'a pas vue passer.
export interface GameLogEntry {
    turnNumber: number;
    playerId: string;
    playerName: string;
    message: string;
}

// État de la partie
export interface GameState {
    id: string;
    status: 'waiting' | 'playing' | 'finished';
    currentPlayerId: string;
    turnNumber: number;
    maxTurns?: number;              // Limite de tours (50 pour online, undefined sinon)
    isOnlineGame?: boolean;         // Mode online (limite de tours activée)
    players: [PlayerState, PlayerState];
    winnerId?: string;
    winReason?: 'elimination' | 'turn_limit' | 'surrender' | 'draw';  // Raison de la victoire (ou match nul)
    log: GameLogEntry[];             // Historique des cartes jouées/défaussées, consultable en jeu
    createdAt: Date;
    updatedAt: Date;
}

// Action de jeu
export interface GameAction {
    type: 'play_card' | 'discard_for_energy' | 'end_turn' | 'select_target' | 'zombie_attack' | 'cast_copied_spell';
    playerId: string;
    cardId?: string;
    originalCardId?: string; // ID de la carte source (Perséphone)
    copiedCardId?: string;   // ID de la carte copiée depuis la défausse
    targetGodId?: string;           // Pour ciblage simple
    targetGodIds?: string[];        // Pour ciblage multiple (ex: 2 cibles)
    targetPlayerId?: string;
    selectedElement?: Element;      // Élément choisi pour apply_weakness (Artémis)
    lightningAction?: 'apply' | 'remove';  // Choix pour les sorts de Zeus (appliquer ou retirer ⚡)
    optionalChoice?: boolean;       // Pour les sorts copiés avec effet optionnel (ex: Vision du Tartare copiée)
    selectedCardIds?: string[];      // Pour le recyclage (Hestia) ou le placement en bas du deck (Nyx)
    healDistribution?: { godId: string, amount: number }[]; // Pour la distribution de soin (Déméter)
    selectedPlayerTarget?: 'self' | 'opponent'; // Pour le choix de joueur (Zéphyr - free_recycle)
    /**
     * Si true, les effets custom qui nécessitent un choix du joueur (voir DEFERRED_CUSTOM_EFFECTS
     * dans GameEngine.ts) ne sont PAS résolus par playCard : la carte est bien jouée (coût payé,
     * carte défaussée) mais l'effet custom attend un appel à resolveDeferredEffect() une fois le
     * choix du joueur connu. Évite la double-exécution (auto + confirmation manuelle).
     */
    deferCustomEffect?: boolean;
}

/**
 * Options d'initialisation d'une partie.
 *
 * Les champs `carryOver*` servent au mode Ascension, où l'on enchaîne des combats en
 * conservant l'état du joueur d'un étage à l'autre. Ils ne falsifient PAS `maxHealth`
 * (contrairement au contournement `enemyHealthOverride` du mode Histoire) : un dieu
 * blessé reste affiché « 10/30 » et non « 10/10 ».
 */
export interface GameInitOptions {
    isOnlineGame?: boolean;
    maxTurns?: number;
    player1Name?: string;
    player2Name?: string;
    /** PV de départ du joueur 1, par id de dieu. Absent = PV max. */
    carryOverHealth?: Record<string, number>;
    /** Énergie de départ du joueur 1. Absent = règle normale (0 si premier, 1 sinon). */
    carryOverEnergy?: number;
    /** Désactive les dégâts de fatigue au recyclage de la défausse. */
    noFatigueDamage?: boolean;
}
