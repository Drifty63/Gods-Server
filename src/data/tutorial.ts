import type { GameState } from '@/types/cards';

/**
 * Scénario du didacticiel.
 *
 * Chaque étape affiche un message, éclaire éventuellement un ou plusieurs éléments de
 * l'interface, et attend une condition pour passer à la suivante. Le tout est décrit ICI, en
 * données : le composant d'affichage ne connaît aucune étape en particulier, ce qui permet de
 * réécrire la leçon sans toucher au plateau de jeu.
 */

/** Élément de l'interface à mettre en avant, via son attribut `data-tutorial`. */
export type SpotlightTarget =
    | 'player-energy'
    | 'player-deck'
    | 'player-discard'
    | 'player-fatigue'
    | 'opponent-stats'
    | 'hand'
    /** Toute la rangée de boutons du panneau de carte. */
    | 'card-actions'
    /** Le seul bouton d'action (CIBLER / LANCER / CONFIRMER). */
    | 'card-action-primary'
    /** Le seul bouton DÉFAUSSER. */
    | 'card-action-discard'
    | 'end-turn'
    | 'combat-log'
    | 'enemy-gods'
    | 'player-gods'
    | null;

export interface TutorialStep {
    id: string;
    /** Titre court affiché en tête de bulle. */
    title: string;
    /** Corps du message. Une idée par étape : deux, et plus personne ne lit. */
    text: string;
    /**
     * Élément(s) éclairé(s) pendant l'étape.
     *
     * Une étape d'action DOIT éclairer tout ce que le geste demandé exige de toucher — mais rien
     * de plus. Éclairer toute la rangée de boutons revenait à entourer CIBLER *et* DÉFAUSSER en
     * même temps : le joueur ne savait pas lequel on lui demandait.
     */
    spotlight: SpotlightTarget | SpotlightTarget[];
    /**
     * Condition de passage.
     * - `next` : le joueur clique sur « Suivant » (étape explicative).
     * - une fonction : l'étape attend une action RÉELLE en jeu. C'est ce qui distingue un
     *   guidage d'une simple visite guidée.
     *
     * Attention : ces prédicats décrivent un ÉTAT, pas une transition — ils restent vrais après
     * l'action. C'est le garde `advancedFrom` de /tutorial/page.tsx qui empêche qu'une même
     * étape soit franchie deux fois.
     */
    advance: 'next' | ((state: GameState) => boolean);
    /**
     * Gèle le plateau tant que l'étape n'est pas franchie (étapes explicatives).
     *
     * À n'utiliser QUE lorsque le joueur n'a rien à faire : sur une étape d'action, ce drapeau
     * rendrait le geste demandé impossible.
     */
    blocking?: boolean;
    /** Remplace « À vous de jouer » sur une étape d'action où le joueur n'agit pas lui-même. */
    waitingLabel?: string;
    /**
     * Où poser la bulle.
     *
     * Par défaut elle se place du côté où il reste le plus de place. Mais quand les zones
     * éclairées couvrent à la fois le haut et le bas de l'écran, ce calcul la renvoie
     * fatalement sur l'une d'elles — à l'étape « à vous de jouer », elle recouvrait la rangée
     * ennemie qu'il faut justement toucher. `'middle'` la loge dans l'intervalle libre entre la
     * zone la plus haute et la plus basse.
     */
    bubbleAnchor?: 'top' | 'bottom' | 'middle';
    /**
     * Offre un bouton « Compris ! » qui referme entièrement le guidage.
     *
     * Pour la dernière étape : le joueur doit pouvoir conclure le combat sans voile, sans halo
     * et sans bulle devant les yeux.
     */
    dismissible?: boolean;
    /**
     * Mise en scène jouée à l'entrée de l'étape (voir /tutorial/page.tsx). Certaines règles se
     * comprennent bien mieux en les VOYANT se produire.
     */
    script?: 'fatigue';
}


/**
 * Faut-il franchir l'étape courante ?
 *
 * Fonction PURE, et c'est délibéré : cette décision ne vivait auparavant que dans un abonnement
 * au store, donc aucun test ne pouvait l'atteindre — ce qui explique que le didacticiel ait pu
 * sauter une étape sur deux sans que rien ne le signale.
 *
 * `advancedFromId` porte l'id de la dernière étape déjà franchie. Il est indispensable parce que
 * les prédicats `advance` décrivent un ÉTAT (`hasPlayedCard`) et non une transition : ils restent
 * vrais après l'action, et le store notifie plusieurs fois pour une seule action du joueur.
 */
export function shouldAdvance(
    step: TutorialStep | undefined,
    advancedFromId: string | null,
    state: GameState,
): boolean {
    if (!step || typeof step.advance !== 'function') return false;
    if (advancedFromId === step.id) return false;
    return step.advance(state);
}

const me = (s: GameState) => s.players[0];
const foe = (s: GameState) => s.players[1];

export const TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: 'welcome',
        title: 'Bienvenue dans GODS',
        text: "Vous allez livrer un combat d'entraînement. Le but est simple : réduire à zéro les points de vie de tous les dieux adverses. Suivez le guide.",
        spotlight: null,
        advance: 'next',
        blocking: true,
    },
    {
        id: 'your-gods',
        title: 'Vos dieux',
        text: "En bas se tiennent vos dieux, avec leurs points de vie. En haut, ceux de l'adversaire. Un dieu tombé emporte toutes ses cartes avec lui.",
        spotlight: 'player-gods',
        advance: 'next',
        blocking: true,
    },
    {
        id: 'god-anatomy',
        title: 'Lire une carte de dieu',
        text: "La COULEUR du cadre indique l'élément du dieu : Zeus est encadré de Foudre, Athéna de Lumière. C'est l'élément de ses propres attaques.",
        spotlight: 'player-gods',
        advance: 'next',
        blocking: true,
    },
    {
        id: 'weakness',
        title: 'La faiblesse élémentaire',
        text: "L'icône en haut à gauche indique, elle, l'élément qui lui fait le PLUS mal. Frapper cette faiblesse inflige des dégâts DOUBLÉS : c'est la règle la plus importante du jeu.",
        spotlight: 'enemy-gods',
        advance: 'next',
        blocking: true,
    },
    {
        id: 'energy',
        title: "Votre énergie",
        text: "Ce cadre affiche votre énergie, vos cartes restantes en pioche, et votre corbeille — que vous pouvez ouvrir à tout moment pour revoir ce qui a été joué.",
        spotlight: 'player-energy',
        advance: 'next',
        blocking: true,
    },
    {
        id: 'hand',
        title: 'Votre main',
        text: "Voici vos cartes. Le chiffre en haut à gauche de chacune est son COÛT en énergie. Une carte trop chère apparaît grisée. Maintenez le doigt sur une carte pour l'examiner sans la jouer.",
        spotlight: 'hand',
        advance: 'next',
        blocking: true,
    },
    {
        id: 'play-generator',
        title: 'À vous de jouer',
        text: "Touchez une carte GÉNÉRATEUR — elles sont gratuites et rapportent de l'énergie. Puis « CIBLER », touchez le soldat en haut, et confirmez.",
        spotlight: ['hand', 'card-action-primary', 'enemy-gods'],
        // La bulle doit laisser le soldat visible : c'est lui qu'on demande de toucher.
        bubbleAnchor: 'middle',
        // On attend que le joueur ait réellement joué : aucun bouton « Suivant » ici.
        advance: (s) => me(s).hasPlayedCard || foe(s).gods.some(g => g.currentHealth < g.card.maxHealth),
    },
    {
        id: 'turn-passed',
        title: 'Le tour est passé',
        text: "Une fois un sort résolu, votre tour se termine tout seul : vous ne pouvez jouer qu'UNE carte par tour. L'adversaire joue à son tour, puis la main vous revient.",
        spotlight: null,
        advance: (s) => s.currentPlayerId === me(s).id && !me(s).hasPlayedCard,
        blocking: true,
        waitingLabel: "L'adversaire joue…",
    },
    {
        id: 'discard',
        title: "Défausser pour de l'énergie",
        text: "Au lieu de jouer, vous pouvez défausser. Sélectionnez une carte puis touchez « DÉFAUSSER ».",
        spotlight: ['hand', 'card-action-discard'],
        advance: (s) => me(s).hasDiscardedForEnergy,
    },
    {
        id: 'discard-more',
        title: 'Défaussez autant que vous voulez',
        text: "Vous pouvez en défausser 2, 3, ou votre main entière — une par une. L'énergie, elle, n'est gagnée qu'UNE fois par tour : le reste sert à se débarrasser des cartes qui ne vous servent pas.",
        spotlight: ['hand', 'card-action-discard'],
        // Volontairement NON bloquante : on dit au joueur qu'il peut en défausser d'autres, il
        // faut donc qu'il puisse le faire tout de suite s'il en a envie.
        advance: 'next',
    },
    {
        id: 'end-turn',
        title: 'Terminer le tour à la main',
        text: "Après une défausse, le tour NE se termine PAS tout seul. Quand vous avez fini, touchez « Terminer le tour ».",
        spotlight: 'end-turn',
        advance: (s) => !me(s).hasDiscardedForEnergy,
    },
    {
        id: 'combat-log',
        title: 'Le journal de combat',
        text: "Ce bouton ouvre l'historique de la partie : toutes les cartes jouées, par vous comme par l'adversaire. Utile si vous avez manqué une action.",
        spotlight: 'combat-log',
        advance: 'next',
        blocking: true,
    },
    {
        id: 'deck-empty',
        title: 'Quand la pioche se vide',
        text: "Voici votre pioche. Que se passe-t-il quand il n'y reste plus une seule carte ? Touchez « Suivant » et regardez bien ce compteur.",
        spotlight: 'player-deck',
        advance: 'next',
        blocking: true,
    },
    {
        id: 'fatigue',
        title: 'La fatigue',
        text: "Votre corbeille vient d'être remélangée pour reformer la pioche — et TOUS vos dieux ont encaissé 1 dégât. Au prochain recyclage ce sera 2, puis 3, et ainsi de suite. Une partie qui s'éternise vous use.",
        spotlight: ['player-deck', 'player-fatigue', 'player-gods'],
        // Mise en scène plutôt qu'explication : la fatigue se produit sous les yeux du joueur.
        script: 'fatigue',
        advance: 'next',
        blocking: true,
    },
    {
        id: 'finish',
        title: 'À vous de conclure',
        text: "Vous savez l'essentiel. Achevez ce soldat pour terminer l'entraînement — visez sa faiblesse pour aller plus vite.",
        spotlight: ['hand', 'card-action-primary', 'enemy-gods'],
        bubbleAnchor: 'middle',
        // Le joueur finit le combat sans voile ni bulle devant les yeux.
        dismissible: true,
        advance: (s) => s.status === 'finished',
    },
];

/**
 * Message de conclusion. Les effets de statut (poison, saignement, pétrification…) sont trop
 * nombreux pour être mis en scène un par un sans transformer la leçon en corvée : on renvoie
 * vers la page des règles, qui les détaille déjà.
 */
export const TUTORIAL_OUTRO = {
    title: 'Entraînement terminé',
    text: "Il vous reste les effets de statut à découvrir — poison, saignement, bouclier, provocation, pétrification. La page des Règles les explique tous en détail.",
};

/** Clé de stockage local : le didacticiel reste rejouable, on retient juste s'il a été vu. */
export const TUTORIAL_DONE_KEY = 'gods-tutorial-done';
