import type { GameState } from '@/types/cards';

/**
 * Scénario du didacticiel.
 *
 * Chaque étape affiche un message, éclaire éventuellement un ou plusieurs éléments de
 * l'interface, et attend une condition pour passer à la suivante. Le tout est décrit ICI, en
 * données : le composant d'affichage ne connaît aucune étape en particulier, ce qui permet de
 * réécrire la leçon sans toucher au plateau de jeu.
 *
 * Le combat est volontairement déséquilibré en faveur du joueur (Zeus, 25 PV, contre un unique
 * Soldat d'Arès de 16 PV faible à la Foudre) : on apprend mal en perdant, et il ne doit y avoir
 * aucun risque d'échec pendant une leçon.
 */

/** Élément de l'interface à mettre en avant, via son attribut `data-tutorial`. */
export type SpotlightTarget =
    | 'player-energy'
    | 'player-deck'
    | 'player-discard'
    | 'opponent-stats'
    | 'hand'
    /** Rangée de boutons du panneau de carte (CIBLER / CONFIRMER / DÉFAUSSER). */
    | 'card-actions'
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
     * Une étape d'action DOIT éclairer tout ce que le geste demandé exige de toucher. Le voile
     * ne bloque plus rien (voir TutorialOverlay), mais un joueur guidé cherche son geste dans la
     * zone éclairée : l'y montrer en entier est ce qui rend l'étape franchissable.
     */
    spotlight: SpotlightTarget | SpotlightTarget[];
    /**
     * Condition de passage.
     * - `next` : le joueur clique sur « Suivant » (étape explicative).
     * - une fonction : l'étape attend une action RÉELLE en jeu. C'est ce qui distingue un
     *   guidage d'une simple visite guidée.
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
     * Mise en scène jouée à l'entrée de l'étape (voir /tutorial/page.tsx). Certaines règles se
     * comprennent bien mieux en les VOYANT se produire qu'en les lisant.
     */
    script?: 'fatigue';
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
        text: "La COULEUR du cadre d'un dieu indique son élément : doré pour la Lumière, bleu pour l'Eau, violet pour les Ténèbres… C'est l'élément de ses propres attaques.",
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
        text: "Touchez une carte GÉNÉRATEUR de votre main — elles sont gratuites et rapportent de l'énergie. Puis « CIBLER », touchez un dieu ennemi en haut, et confirmez.",
        // Les trois zones que le geste exige : la main, les boutons du panneau, et la rangée
        // ennemie. Éclairer la seule main laissait le joueur sans indication sur l'étape
        // suivante de son propre geste.
        spotlight: ['hand', 'card-actions', 'enemy-gods'],
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
        text: "Au lieu de jouer, vous pouvez défausser une carte pour gagner 1 énergie. Sélectionnez une carte puis touchez « DÉFAUSSER ». C'est ainsi qu'on finance les sorts les plus chers.",
        spotlight: ['hand', 'card-actions'],
        advance: (s) => me(s).hasDiscardedForEnergy,
    },
    {
        id: 'end-turn',
        title: 'Terminer le tour à la main',
        text: "Après une défausse, le tour NE se termine PAS tout seul : vous pouvez en défausser d'autres. Quand vous avez fini, touchez « Terminer le tour ».",
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
        id: 'fatigue',
        title: 'La fatigue',
        text: "Regardez : votre pioche vient de se vider. La corbeille est remélangée pour la reformer, et TOUS vos dieux encaissent des dégâts — de plus en plus lourds à chaque recyclage. Une partie qui s'éternise vous use.",
        spotlight: ['player-deck', 'player-gods'],
        // Mise en scène plutôt qu'explication : la fatigue se produit sous les yeux du joueur.
        script: 'fatigue',
        advance: 'next',
        blocking: true,
    },
    {
        id: 'finish',
        title: 'À vous de conclure',
        text: "Vous savez l'essentiel. Achevez ce soldat pour terminer l'entraînement — visez sa faiblesse pour aller plus vite.",
        spotlight: ['hand', 'card-actions', 'enemy-gods'],
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
