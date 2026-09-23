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
    /*
     * Saignement : dégâts en FIN DE TOUR, qui IGNORENT le bouclier — un dieu terré derrière
     * son bouclier saigne quand même. 1 marque = 1 dégât, 2 marques = 2 dégâts.
     *
     * Plafonné à 2 marques (StatusSystem.STATUS_STACK_CAPS) : au-delà, une cible focalisée
     * mourait du saignement seul sans que l'adversaire puisse rien y faire. Un soin en retire
     * autant de marques que de points rendus.
     */
    | 'bleed'
    /*
     * Pétrification : chaque marque ajoute +1 dégât à TOUT sort offensif reçu, quel qu'en
     * soit le lanceur — la pierre encaisse mal. Poser la marque étourdit aussi la cible pour
     * un tour (voir StatusSystem.addStatus).
     *
     * La marque n'est JAMAIS consommée et n'expire jamais : elle amplifie chaque coup jusqu'à
     * ce qu'un nettoyage d'effets négatifs la retire. Un soin n'y peut rien — on ne soigne
     * pas de la pierre.
     */
    | 'petrify'
    /*
     * Brûlure : chaque marque ajoute +1 dégât, mais UNIQUEMENT aux sorts de FEU.
     *
     * C'est toute la différence avec la pétrification, qui aide n'importe quel attaquant :
     * la brûlure récompense une équipe bâtie autour du feu. Elle ne cause aucun dégât par
     * elle-même — ce n'est pas un second saignement, c'est une vulnérabilité ciblée.
     *
     * Sans plafond de cumul, mais un soin l'éteint marque par marque.
     */
    | 'burn'
    /*
     * Effroi : un dieu qui en porte au moins une marque ne peut pas cibler Actéon avec une
     * compétence MONO-CIBLE. Les attaques de zone l'atteignent normalement.
     *
     * C'est ce qui sépare l'effroi du statut `untargetable`, lequel bloque aussi la zone :
     * la protection se contourne en frappant large, au prix de la précision. Sans ça, un
     * Actéon qui entretient l'effroi deviendrait intouchable pour le reste de la partie.
     *
     * Les marques s'effacent UNE PAR UNE, une par tour, quoi qu'il arrive — c'est la seule
     * décroissance de ce type dans le jeu, et c'est elle qui interdit la boucle ci-dessus :
     * entretenir la protection coûte une carte par tour, donc tout le tour d'Actéon.
     *
     * Sans plafond. Un soin ne la retire pas, un nettoyage si (règle de la pétrification).
     * Aucun dégât par elle-même, et elle ne bloque rien d'autre que ce ciblage.
     */
    | 'fear'
    /*
     * Silence : le dieu ne peut plus jouer ses cartes COMPÉTENCE. Générateurs et utilitaire
     * restent jouables.
     *
     * Le filtre porte sur le TYPE de carte, et surtout pas sur « les cartes qui infligent des
     * dégâts » : 56 des 60 générateurs du jeu en infligent au passage. Cette seconde règle
     * aurait bloqué deux cartes sur trois et coupé la production d'énergie du dieu — un
     * étourdissement déguisé, pas un sceau. Le type, lui, est imprimé sur la carte : le
     * joueur voit d'un coup d'œil ce qui est scellé.
     *
     * Reste volontairement plus faible que l'étourdissement, qui ferme les cinq cartes pour
     * le même prix (Stun divin : 1 énergie, 2 tours).
     */
    | 'silence'
    /*
     * Redouté : porté par celui qui INSPIRE l'effroi, jamais par celui qui le subit.
     *
     * C'est la moitié visible de la règle de l'effroi. Plutôt que de mémoriser sur chaque
     * marque de peur QUI l'a posée — un champ de plus dans l'état, à synchroniser dans le
     * jsonb des parties en ligne — on marque la source. La règle devient alors purement
     * locale : un dieu qui porte de la peur ne peut pas mono-cibler un dieu qui porte ceci.
     *
     * Permanent : une fois qu'Actéon a terrifié quelqu'un, il reste celui qu'on n'ose plus
     * regarder. Ce qui s'efface, c'est la peur de l'autre côté.
     */
    | 'dreaded'
    /*
     * Galvanisé : la PROCHAINE attaque mono-cible de ce dieu inflige `stacks` dégâts de plus
     * et étourdit sa cible un tour. Le bonus attend : une attaque de zone ne le déclenche pas
     * et ne le consomme pas.
     *
     * Première amplification CÔTÉ LANCEUR du jeu — pétrification et brûlure amplifient depuis
     * la cible, et `dealDamage` ne reçoit même pas le lanceur. Le bonus se lit donc au point
     * d'application des dégâts dans GameEngine, pas dans DamageSystem.
     *
     * La clause mono-cible ne borne pas les dégâts, elle borne l'ÉTOURDISSEMENT : sur une
     * attaque de zone il gèlerait les quatre ennemis d'un coup.
     */
    | 'empowered'
    /*
     * Émoussé : ce dieu inflige `stacks` dégâts de moins, sur CHAQUE effet de dégât des cartes
     * qu'il joue — une carte qui frappe deux fois perd donc deux fois.
     *
     * Le miroir exact de `empowered`, au même point d'application. À ne pas confondre avec
     * `weakness`, qui est une faiblesse ÉLÉMENTAIRE et double les dégâts REÇUS.
     */
    | 'blunted';

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
    flavorText: string;
    hidden?: boolean; // True si le dieu est caché (accessible uniquement aux créateurs)
    category?: 'god' | 'creature' | 'servant'; // Catégorie pour mode Duel (god par défaut)
    /**
     * Rôle de combat, quand l'unité en a un franc. Absent = polyvalent (ni frappeur, ni mur,
     * ni soigneur marqué) : ces unités ne sont soumises qu'au budget de puissance global.
     *
     * Sert à comparer ce qui est comparable : la hiérarchie dieu > créature > serviteur
     * s'applique À ARCHÉTYPE ÉGAL. Apollon plafonne à 1 dégât sans être « faible » — c'est un
     * dieu de contrôle ; le confronter à une créature frappeuse n'aurait aucun sens. Voir le
     * test units-hierarchy.
     */
    archetype?: 'glass_cannon' | 'tank' | 'support';
    duelCost?: number; // Coût en points pour le mode Duel (5 pour dieux, 3 pour créatures, 2 pour serviteurs)
    affiliatedTo?: string; // ID du dieu auquel la créature/serviteur est affilié (ex: 'ares')
    /**
     * Contenu de TRAVAIL, pas encore validé pour la sortie : illustration, images de compétences
     * ou effets générés automatiquement et jamais repris à la main.
     *
     * À distinguer de `hidden`, qui masque une carte au JOUEUR tout en la laissant utilisable
     * comme adversaire (l'Ascension oppose volontiers des unités cachées). `draft` est plus
     * fort : la carte n'est ni jouable, ni opposable, ni affichée — elle n'existe que dans le
     * code, en attendant d'être reprise manuellement. Voir la règle de contenu de la v1.0.
     */
    draft?: boolean;
}

// Effet d'un sort
export interface SpellEffect {
    type: 'damage' | 'heal' | 'shield' | 'energy' | 'draw' | 'discard' | 'mill' | 'status' | 'remove_status' | 'custom';
    value?: number;
    target?: TargetType;
    status?: StatusEffect;
    statusDuration?: number;
    customEffectId?: string; // Pour les effets spéciaux uniques
    /**
     * Ces dégâts traversent le bouclier sans l'entamer : la cible perd ses PV, son bouclier
     * reste intact (12 PV + 2 boucliers, frappée de 3, finit à 9 PV + 2 boucliers).
     *
     * `dealDamage` savait déjà le faire, mais seul le saignement s'en servait — aucun sort ne
     * pouvait le demander, faute de ce champ.
     */
    ignoreShield?: boolean;
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
        /**
         * Demi-tour (`GameState.turnSequence`) pendant lequel le statut a été posé.
         *
         * Sert à ne PAS décrémenter la durée le tour même de la pose. Sans cela, un statut posé
         * sur son propre camp perdait un tour avant d'avoir servi : les durées ne sont
         * décrémentées qu'à la fin du tour de leur porteur, or un sort lancé sur soi est posé
         * pendant ce tour-là. Les statuts offensifs, posés pendant le tour de l'ADVERSAIRE du
         * porteur, ne sont pas concernés — d'où l'asymétrie que ce champ corrige.
         */
        appliedTurn?: number;
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
    /**
     * Dépassements CONSÉCUTIFS du chrono de tour (modes compétitifs). Remis à zéro dès que
     * le joueur agit ; au-delà de MAX_TURN_TIMEOUTS, la partie est perdue. Le champ existait
     * depuis l'origine mais n'était lu ni écrit nulle part.
     */
    afkTurns?: number;
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
    /**
     * Compteur de DEMI-tours : incrémenté à chaque fin de tour, quel que soit le joueur.
     *
     * `turnNumber` ne convient pas pour dater un statut : il ne s'incrémente qu'au retour sur
     * players[0], donc une fois par ronde complète. Un stun posé sur l'adversaire porterait
     * alors la même date que le tour où il est décrémenté, et gagnerait un tour gratuit.
     *
     * Optionnel : une partie en ligne déjà engagée n'a pas le champ, et `undefined` ne peut
     * égaler aucune date de pose — le comportement y reste celui d'avant le correctif.
     */
    turnSequence?: number;
    isOnlineGame?: boolean;         // Mode online (limite de tours activée)
    players: [PlayerState, PlayerState];
    winnerId?: string;
    /** Raison de la fin de partie (ou du match nul). */
    winReason?: 'elimination' | 'turn_limit' | 'surrender' | 'draw' | 'timeout';
    log: GameLogEntry[];             // Historique des cartes jouées/défaussées, consultable en jeu
    createdAt: Date;
    updatedAt: Date;
}

// Action de jeu
export interface GameAction {
    type: 'play_card' | 'discard_for_energy' | 'end_turn' | 'select_target' | 'zombie_attack'
    | 'cast_copied_spell'
    /** Le chrono du tour a expiré : passe la main et incrémente le compteur de dépassements. */
    | 'timeout_turn';
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
