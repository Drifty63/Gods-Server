'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore, setTurnSync } from '@/store/gameStore';
import { ArenaArea } from './components/ArenaArea';
import { HandArea } from './components/HandArea';
import { DeckAndDiscard } from './components/DeckAndDiscard';
import { SpellCardUI } from './components/SpellCardUI';
import { CardFlight, CardFlightData } from './components/CardFlight';
import { TurnTimer } from './components/TurnTimer';
// `Element` est aliasé : le type du jeu masquerait sinon l'interface DOM `Element`, dont ce
// fichier a besoin pour les mesures de position (getBoundingClientRect) de l'animation de vol.
import { SpellCard, GodState, type Element as GameElement } from '@/types/cards';
import type { ImpactReport } from './components/HeroCard';
import type { GameAction } from '@/hooks/useMultiplayer';
import { getReadableSpellDescription } from '@/data/spellDescriptions';
import { playSfx } from '@/lib/sfx';
import { haptic } from '@/lib/haptics';
import { useWakeLock } from '@/lib/useWakeLock';

/** Durée d'affichage d'un message d'erreur. Assez pour être lu, assez court pour ne pas gêner. */
const ERROR_TOAST_MS = 4000;
import styles from './GameBoard.module.css';

// Modals pour effets spéciaux
import CardSelectionModal from '@/components/CardSelectionModal/CardSelectionModal';
import OptionalChoiceModal from '@/components/OptionalChoiceModal/OptionalChoiceModal';
import ElementSelectionModal from '@/components/ElementSelectionModal/ElementSelectionModal';
import LightningActionModal from '@/components/LightningActionModal/LightningActionModal';
import PlayerSelectionModal from '@/components/PlayerSelectionModal/PlayerSelectionModal';
import DeadGodSelectionModal from '@/components/DeadGodSelectionModal/DeadGodSelectionModal';
import ZombieDamageModal from '@/components/ZombieDamageModal/ZombieDamageModal';
import HealDistributionModal from '@/components/HealDistributionModal/HealDistributionModal';
import GodSelectionModal from '@/components/GodSelectionModal/GodSelectionModal';
import CombatLogModal from '@/components/CombatLogModal/CombatLogModal';

interface GameBoardProps {
    isOnlineMode?: boolean;
    onAction?: (action: { type: GameAction['type']; payload?: Record<string, unknown> }) => void;
}

/**
 * Phrase de conclusion adaptée à la MANIÈRE dont la partie s'est terminée.
 *
 * `winReason` est porté par GameState depuis l'origine mais n'était renseigné nulle part (il
 * l'est désormais par le moteur et par l'abandon) : gagner par élimination, aux points ou par
 * forfait donnait donc exactement le même texte.
 */
function resultSubtitle(
    reason: import('@/types/cards').GameState['winReason'],
    isVictory: boolean,
    isDraw: boolean,
): string {
    if (isDraw) return "Ni l'un ni l'autre n'a plié : les dieux vous renvoient dos à dos.";

    switch (reason) {
        case 'turn_limit':
            return isVictory
                ? 'Le temps a manqué à votre adversaire : vous l\'emportez aux points.'
                : 'La limite de tours est atteinte — votre adversaire tenait le meilleur score.';
        case 'surrender':
            return isVictory
                ? 'Votre adversaire a renoncé au combat.'
                : 'Vous avez quitté le champ de bataille.';
        case 'timeout':
            return isVictory
                ? 'Votre adversaire a laissé filer trop de tours sans agir.'
                : 'Trois tours écoulés sans jouer : la partie est perdue.';
        case 'elimination':
        default:
            return isVictory
                ? 'Vous avez triomphé sur le champ de bataille.'
                : 'Vos dieux sont tombés au combat.';
    }
}

export default function GameBoard({ isOnlineMode = false, onAction }: GameBoardProps) {
    const router = useRouter();

    // --- STORE BOUNDARIES ---
    const {
        gameState,
        isMyTurn,
        selectedCard,
        selectCard,
        selectedTargetGods,
        toggleTargetGod,
        playCard,
        discardForEnergy,
        endTurn,
        isSelectingTarget,
        requiredTargets,
        getMaxSelectableTargets,
        startTargetSelection,
        cancelTargetSelection,
        playerId,
        playAITurn,
        canPlayCard,

        // États Modals
        isSelectingCards,
        cardSelectionSource,
        cardSelectionCount,
        cardSelectionTitle,
        confirmCardSelection,
        cancelCardSelection,
        
        isShowingOptionalChoice,
        optionalChoiceTitle,
        optionalChoiceDescription,
        pendingOptionalEffect,
        confirmOptionalChoice,

        isSelectingElement,
        setSelectedElement,
        
        isSelectingLightningAction,
        setLightningAction,
        
        isSelectingPlayer,
        playerSelectionTitle,
        confirmPlayerSelection,
        cancelPlayerSelection,
        
        isSelectingDeadGod,
        deadGodSelectionTitle,
        confirmDeadGodSelection,
        cancelDeadGodSelection,
        
        isShowingZombieDamage,
        zombieDamageGodId,
        confirmZombieDamage,
        cancelZombieDamage,
        
        isDistributingHeal,
        healDistributionTotal,
        confirmHealDistribution,
        cancelHealDistribution,

        isSelectingGod,
        godSelectionTitle,
        godSelectionTargetType,
        confirmGodSelection,
        cancelGodSelection,
    } = useGameStore();

    // L'écran ne doit pas s'éteindre pendant un tour adverse, qui peut durer une minute sans la
    // moindre interaction du joueur.
    useWakeLock(gameState?.status === 'playing');

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    /**
     * Affiche un message d'erreur qui s'efface tout seul.
     *
     * Trois des quatre émissions n'avaient AUCUN effacement : le bandeau rouge restait à l'écran
     * jusqu'à la fin de la partie, y compris pendant les tours adverses. Le minuteur est gardé en
     * ref pour être remplacé à chaque nouveau message et annulé au démontage.
     */
    /**
     * Poussée de l'état à l'adversaire quand le tour se termine TOUT SEUL (après une carte
     * résolue). Le bouton manuel le faisait déjà ; l'automatisme, réservé au solo, ne le
     * faisait pas — d'où deux comportements différents entre le solo et le jeu en ligne.
     *
     * Passe par une ref : `onAction` n'est pas garanti stable d'un rendu à l'autre, et
     * ré-enregistrer à chaque rendu n'apporterait rien.
     */
    const onActionRef = useRef(onAction);
    useEffect(() => { onActionRef.current = onAction; });
    useEffect(() => {
        setTurnSync(() => onActionRef.current?.({ type: 'end_turn' }));
        return () => setTurnSync(null);
    }, []);

    const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const showError = useCallback((message: string) => {
        setErrorMsg(message);
        if (errorTimer.current) clearTimeout(errorTimer.current);
        errorTimer.current = setTimeout(() => setErrorMsg(null), ERROR_TOAST_MS);
    }, []);
    const dismissError = useCallback(() => {
        if (errorTimer.current) clearTimeout(errorTimer.current);
        setErrorMsg(null);
    }, []);
    useEffect(() => () => { if (errorTimer.current) clearTimeout(errorTimer.current); }, []);
    const [lastOpponentCard, setLastOpponentCard] = useState<SpellCard | null>(null);
    const [previousDiscardCount, setPreviousDiscardCount] = useState<number>(0);
    const [viewingDiscard, setViewingDiscard] = useState<SpellCard[] | null>(null);
    const [zoomedDiscardCard, setZoomedDiscardCard] = useState<SpellCard | null>(null);
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [hoveredCard, setHoveredCard] = useState<SpellCard | null>(null);
    /** Carte examinée en plein écran via un appui long (n'engage aucune action de jeu). */
    const [inspectedCard, setInspectedCard] = useState<SpellCard | null>(null);
    const [cardFlight, setCardFlight] = useState<CardFlightData | null>(null);
    const [playedCardPreview, setPlayedCardPreview] = useState<SpellCard | null>(null);
    const flightIdRef = useRef(0);

    /**
     * Élément du sort en train de se résoudre. Transmis aux cartes de dieu pour teinter l'impact
     * et repérer le coup critique (faiblesse ×2) : sans cette information, une carte touchée ne
     * peut pas savoir de quel élément vient le coup qu'elle encaisse.
     */
    const [castElement, setCastElement] = useState<GameElement | null>(null);
    /** Intensité de la secousse d'écran, retombée à 'none' après l'animation. */
    const [screenShake, setScreenShake] = useState<'none' | 'light' | 'heavy'>('none');
    /** Bannière plein écran annoncant le changement de tour. */
    const [turnBanner, setTurnBanner] = useState<'mine' | 'theirs' | null>(null);
    const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * Secousse de l'écran entier au moment d'un impact — le retour « poids du coup » qui manque
     * le plus à un jeu de cartes muet. Réservée aux coups qui comptent : un critique ou une mort
     * secouent fort, un coup ordinaire à peine, un soin pas du tout.
     */
    /**
     * Chrono écoulé : la main passe d'office.
     *
     * Passe par le store — et non directement par le moteur — pour que l'état synchronisé soit
     * poussé à l'adversaire comme n'importe quelle autre action. Au troisième dépassement
     * CONSÉCUTIF, le moteur conclut la partie de lui-même (voir `timeoutTurn`).
     */
    const handleTurnTimeout = useCallback(() => {
        const result = useGameStore.getState().timeoutTurn();
        if (!result.success) return;

        playSfx('error');
        haptic('error');
        showError('Temps écoulé — votre tour est passé.');

        onAction?.({ type: 'end_turn' });
    }, [onAction, showError]);

    const handleImpact = useCallback((report: ImpactReport) => {
        if (report.kind !== 'damage') return;

        const heavy = report.isCritical || report.killed;
        setScreenShake(heavy ? 'heavy' : 'light');

        if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
        shakeTimerRef.current = setTimeout(() => setScreenShake('none'), heavy ? 520 : 300);
    }, []);

    useEffect(() => () => {
        if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    }, []);

    // Anime une carte qui quitte la main et se pose sur le dieu qui la lance : capture les
    // positions DOM avant/après (technique FLIP), voir CardFlight.tsx.
    const triggerCardFlight = (card: SpellCard, fromEl: Element | null, toEl: Element | null) => {
        if (!fromEl || !toEl) return;
        flightIdRef.current += 1;
        setCardFlight({
            id: flightIdRef.current,
            imageUrl: card.imageUrl,
            name: card.name,
            from: fromEl.getBoundingClientRect(),
            to: toEl.getBoundingClientRect(),
        });
    };

    // --- IDENTITIES (calculées avant tout `return` anticipé : les hooks ci-dessous en dépendent
    // et doivent s'exécuter au même ordre à chaque rendu, y compris quand gameState/localPlayer
    // sont encore absents) ---
    const localPlayer = gameState?.players.find(p => p.id === playerId);
    const remoteOpponent = gameState?.players.find(p => p.id !== playerId);
    const myTurn = isMyTurn();

    // Track opponent's actions using discard pile size changes
    useEffect(() => {
        if (!remoteOpponent) return;

        if (remoteOpponent.discard.length > previousDiscardCount) {
            // La défausse adverse grandit dans 3 cas : l'adversaire JOUE une carte, l'adversaire
            // la DÉFAUSSE pour gagner de l'énergie, OU un de NOS sorts (ex: Grande Vague, Colère
            // de Poséidon) envoie des cartes de sa main/deck dans SA défausse — seul le premier
            // cas doit être annoncé. hasPlayedCard seul ne suffit pas : il reste "true" tout le
            // tour suivant une fois posé (remis à false seulement au DÉBUT du tour de son
            // propriétaire, pas à la fin), donc si l'IA avait joué à son tour précédent, il
            // restait vrai pendant tout notre tour et déclenchait à tort "ADVERSAIRE JOUE" quand
            // un de nos sorts la faisait défausser. Il faut donc aussi vérifier que c'est
            // effectivement SON tour en ce moment.
            const isOpponentsTurn = gameState?.currentPlayerId === remoteOpponent.id;
            if (!isOpponentsTurn || !remoteOpponent.hasPlayedCard) {
                setPreviousDiscardCount(remoteOpponent.discard.length);
                return;
            }

            // New card added to opponent's discard pile
            const card = remoteOpponent.discard[remoteOpponent.discard.length - 1];
            setLastOpponentCard(card);
            // L'élément du sort adverse doit être connu AVANT que les PV ne changent, sinon les
            // cartes touchées ne peuvent plus teinter l'impact ni détecter le critique.
            setCastElement(card.element);
            playSfx('cardPlay');

            // Anime la carte adverse depuis sa main (approximée par le conteneur, la carte
            // individuelle a déjà disparu du DOM à ce stade) vers le dieu qui vient de la lancer.
            const handEl = document.querySelector('[data-hand-area="opponent"]');
            const casterEl = document.querySelector(`[data-god-key="opponent-${card.godId}"]`);
            triggerCardFlight(card, handEl, casterEl);

            // Clear the notification after 4 seconds
            const timer = setTimeout(() => {
                setLastOpponentCard(null);
                setCastElement(null);
            }, 4000);

            return () => clearTimeout(timer);
        }
        setPreviousDiscardCount(remoteOpponent.discard.length);
    }, [remoteOpponent?.discard.length]);

    // --- GAME ENGINE LOOP (Offline AI Trigger) ---
    useEffect(() => {
        if (!isOnlineMode && !myTurn && gameState?.status === 'playing') {
            const timer = setTimeout(() => {
                playAITurn();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [myTurn, gameState?.status, isOnlineMode, playAITurn]);

    // --- BANNIÈRE DE CHANGEMENT DE TOUR ---
    // Rien n'annonçait la reprise de la main : sur mobile, on pouvait fixer l'écran plusieurs
    // secondes sans savoir si l'adversaire réfléchissait encore. La bannière (+ son + vibration)
    // lève l'ambiguïté sans que le joueur ait à chercher le petit texte central.
    //
    // On s'ABONNE au store plutôt que de comparer `myTurn` d'un rendu à l'autre : le changement
    // de tour est un événement du moteur (il peut venir de l'IA, du réseau ou du joueur), pas
    // une valeur dérivée du rendu. L'abonnement capte la transition exacte, une seule fois.
    const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        const unsubscribe = useGameStore.subscribe((state, prev) => {
            const now = state.gameState;
            const before = prev.gameState;
            if (!now || !before || now.status !== 'playing') return;
            if (now.currentPlayerId === before.currentPlayerId) return;

            const nowMine = now.currentPlayerId === state.playerId;
            setTurnBanner(nowMine ? 'mine' : 'theirs');
            if (nowMine) {
                playSfx('turnStart');
                haptic('select');
            }

            if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
            bannerTimerRef.current = setTimeout(() => setTurnBanner(null), 1400);
        });

        return () => {
            unsubscribe();
            if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
        };
    }, []);

    // --- FIN DE PARTIE : fanfare ou glas ---
    const resultAnnouncedRef = useRef(false);
    useEffect(() => {
        if (gameState?.status !== 'finished' || resultAnnouncedRef.current) return;
        resultAnnouncedRef.current = true;

        const victory = gameState.winnerId === playerId;
        playSfx(victory ? 'victory' : 'defeat');
        haptic(victory ? 'victory' : 'error');
    }, [gameState?.status, gameState?.winnerId, playerId]);


    // Fin de partie : écran de victoire/défaite (auparavant un simple texte "Partie Terminée"
    // sans suite possible, ce qui donnait l'impression que le jeu plantait à la fin d'un match).
    if (gameState && gameState.status === 'finished') {
        const isVictory = gameState.winnerId === playerId;
        // Match nul : winnerId absent après une limite de tours à égalité de PV (mode en ligne).
        // Ce cas existait dans le moteur mais l'écran annonçait « DÉFAITE » au deux joueurs.
        const isDraw = !gameState.winnerId;

        // Récapitulatif du combat : un écran de fin qui n'affiche qu'un titre ne donne aucune
        // matière à comprendre ce qui s'est joué.
        const me = gameState.players.find(p => p.id === playerId);
        const foe = gameState.players.find(p => p.id !== playerId);
        const survivors = me?.gods.filter(g => !g.isDead).length ?? 0;
        const slain = foe?.gods.filter(g => g.isDead).length ?? 0;

        return (
            <div className={`${styles.gameBoard} ${styles.gameBoardCentered}`}>
                {/* Rayons divins derrière le panneau : donne à la victoire une vraie présence
                    cinématique plutôt qu'une simple carte posée au centre. */}
                <div className={`${styles.resultRays} ${isVictory ? styles.resultRaysVictory : styles.resultRaysDefeat}`} aria-hidden="true" />

                <div className={`${styles.resultScreen} ${isVictory ? styles.resultVictory : styles.resultDefeat}`}>
                    <div className={styles.resultIcon}>{isDraw ? '⚖️' : isVictory ? '🏆' : '💀'}</div>
                    <h1 className={styles.resultTitle}>
                        {isDraw ? 'MATCH NUL' : isVictory ? 'VICTOIRE !' : 'DÉFAITE...'}
                    </h1>
                    <p className={styles.resultSubtitle}>
                        {resultSubtitle(gameState.winReason, isVictory, isDraw)}
                    </p>

                    <div className={styles.resultStats}>
                        <div className={styles.resultStat}>
                            <span className={styles.resultStatValue}>{gameState.turnNumber}</span>
                            <span className={styles.resultStatLabel}>Tours</span>
                        </div>
                        <div className={styles.resultStat}>
                            <span className={styles.resultStatValue}>{survivors}</span>
                            <span className={styles.resultStatLabel}>Survivants</span>
                        </div>
                        <div className={styles.resultStat}>
                            <span className={styles.resultStatValue}>{slain}</span>
                            <span className={styles.resultStatLabel}>Terrassés</span>
                        </div>
                    </div>

                    {!isOnlineMode && (
                        <div className={styles.resultActions}>
                            <button className={styles.resultButtonPrimary} onClick={() => { window.location.href = '/game'; }}>
                                🔄 Rejouer
                            </button>
                            <button className={styles.resultButtonSecondary} onClick={() => router.push('/')}>
                                🏠 Retour à l&apos;accueil
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Safety checks
    if (!gameState || gameState.status !== 'playing') {
        return (
            <div className={`${styles.gameBoard} ${styles.gameBoardCentered}`}>
                <div style={{ fontSize: '2rem', textTransform: 'uppercase' }}>
                    Chargement de L&apos;Olympe...
                </div>
            </div>
        );
    }

    // --- IDENTITIES ---
    // Distinguish between the LOCAL HUMAN and the OPPONENT (calculées plus haut, avant les
    // `return` anticipés ci-dessus, pour que les hooks gardent un ordre stable à chaque rendu)
    if (!localPlayer || !remoteOpponent) return null;

    // Use absolute references for UI layout
    const player = localPlayer;
    const opponent = remoteOpponent;

    // --- ACTIONS ---

    // Explique pourquoi une carte ne peut pas être jouée (miroir de canPlayCard du store, qui
    // ne retourne qu'un booléen) : sert à la fois pour le message d'erreur au clic et pour
    // l'affichage grisé des cartes injouables dans la main.
    const getUnplayableReason = (card: SpellCard): string | null => {
        if (!myTurn) return "Ce n'est pas votre tour.";
        if (!player) return "Ce n'est pas votre tour.";
        if (player.hasPlayedCard) return 'Vous avez déjà joué une carte ce tour — terminez votre tour.';
        if (player.hasDiscardedForEnergy) return 'Vous avez déjà défaussé une carte ce tour — défaussez-en une autre ou terminez votre tour.';
        if (player.energy < card.energyCost) return `Pas assez d'énergie (${player.energy}/${card.energyCost} ⚡).`;
        const god = player.gods.find(g => g.card.id === card.godId);
        if (!god || god.isDead) return 'Ce dieu est mort.';
        if (god.statusEffects.some(s => s.type === 'stun')) return 'Ce dieu est étourdi.';
        return null;
    };

    const handleCardClick = (card: SpellCard) => {
        if (!myTurn) return;
        // Toujours sélectionnable, même si injouable (énergie insuffisante...) : sélectionner
        // une carte ne fait qu'ouvrir son détail, c'est aussi ce qui donne accès au bouton
        // "Défausser" — bloquer la sélection empêchait de défausser une carte trop chère.
        const isDeselecting = selectedCard?.id === card.id;
        selectCard(isDeselecting ? null : card);
        playSfx(isDeselecting ? 'tap' : 'select');
        haptic('tap');
        dismissError();
    };

    const handleGodTarget = (god: GodState) => {
        if (!myTurn || !isSelectingTarget) return;

        toggleTargetGod(god);
        // Retour immédiat au doigt : le ciblage se fait souvent sans quitter la cible des yeux,
        // le son confirme la prise en compte sans avoir à vérifier le réticule.
        playSfx('select');
        haptic('select');
    };

    // Cliquer n'importe où en dehors de la main / du panneau de détail / d'un bouton désélectionne
    // la carte en cours, sans avoir à recliquer dessus. On lit l'état frais du store (plutôt que
    // les valeurs de ce rendu, potentiellement obsolètes) car un clic sur "CIBLER" par exemple
    // vient tout juste d'ouvrir la sélection de cible au moment même où cet événement remonte —
    // il ne faut surtout pas annuler ce choix qui vient de se faire.
    const handleBoardBackgroundClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest(`.${styles.handArea}`) || target.closest(`.${styles.cardDetailPanel}`)) {
            return;
        }
        const state = useGameStore.getState();
        if (!state.selectedCard) return;
        const choiceInProgress = state.isSelectingTarget
            || state.isSelectingCards
            || state.isDistributingHeal
            || state.isShowingOptionalChoice
            || state.isSelectingPlayer
            || state.isSelectingDeadGod
            || state.isSelectingGod
            || state.isShowingZombieDamage
            || state.isSelectingElement
            || state.isSelectingLightningAction;
        if (choiceInProgress) return;
        state.selectCard(null);
    };

    const handlePlayConfirmed = (lightningAction?: 'apply' | 'remove') => {
        if (!selectedCard) return;
        const cardBeingPlayed = selectedCard;
        const targetIds = selectedTargetGods.map(g => g.card.id);
        // Complète jusqu'au nombre nominal de cibles en répétant la dernière choisie : le moteur
        // applique chaque effet à cibles multiples positionnellement (1 cible par effet), donc un
        // sort à 2 cibles n'appliquerait son 2e effet à personne si un seul ennemi était en vie et
        // sélectionnable — ce même dieu encaisse alors les deux effets, plutôt qu'un blocage.
        while (targetIds.length > 0 && targetIds.length < requiredTargets) {
            targetIds.push(targetIds[targetIds.length - 1]);
        }

        // Capturées AVANT playCard() : une fois la carte réellement jouée, son élément DOM en
        // main disparaît dès le prochain rendu.
        // Recherche scopée à VOTRE main : la main adverse est rendue plus haut dans le DOM avec
        // les mêmes `data-hand-card-id`, et dans un match miroir les deux camps ont les mêmes
        // ids de cartes — l'animation serait partie du bord adverse.
        const handEl = document.querySelector(
            `[data-hand-area="player"] [data-hand-card-id="${cardBeingPlayed.id}"]`
        );
        const casterEl = document.querySelector(`[data-god-key="player-${cardBeingPlayed.godId}"]`);

        // Posé AVANT la résolution : les cartes touchées lisent cet élément au moment où leurs
        // PV changent, donc il doit déjà être à jour quand playCard() applique les dégâts.
        setCastElement(cardBeingPlayed.element);

        const result = playCard(cardBeingPlayed.id, undefined, targetIds, lightningAction);

        if (!result.success) {
            // Échec réel (ex: plus assez d'énergie entre-temps) : rien n'a été joué.
            showError(result.message);
            setCastElement(null);
            haptic('error');
            playSfx('error');
            return;
        }

        if (result.pending) {
            // Une modale de choix préalable vient de s'ouvrir (élément de faiblesse, action
            // foudre...) : la carte n'est PAS encore jouée. Ne pas effacer la sélection ni
            // afficher l'aperçu "sort lancé" — un second appel à playCard() suivra une fois le
            // choix fait, avec selectedCard/selectedTargetGods toujours intacts.
            dismissError();
            return;
        }

        // Succès réel : la carte a bien été jouée — elle vole de la main jusqu'au dieu qui la lance.
        triggerCardFlight(cardBeingPlayed, handEl, casterEl);
        setPlayedCardPreview(cardBeingPlayed);
        playSfx('cardPlay');
        haptic('select');
        setTimeout(() => {
            setPlayedCardPreview(null);
            setCastElement(null);
        }, 2000);
        dismissError();
        selectCard(null);
        if (onAction) {
            onAction({ type: 'play_card', payload: { cardId: cardBeingPlayed.id, targetGodIds: targetIds } });
        }
    };

    const handleDiscard = () => {
        if (!selectedCard || !myTurn) return;
        // Logic for discard using playHub/store if available, else manual
        // Assume playCard with a special flag or dedicated discard action
        // For now, I'll use playCard and handle it in the store if it supports it,
        // OR add it to the interaction list.
        const result = discardForEnergy(selectedCard.id);
        if (!result.success) {
            showError(result.message);
            return;
        }
        selectCard(null);
    };

    // Dieu qui lance le sort en ce moment (carte sélectionnée en main, ou tout juste jouée) :
    // mis en surbrillance dorée sur le plateau pour qu'on comprenne qui lance quoi.
    const playerCasterGodId = selectedCard?.godId || playedCardPreview?.godId || null;
    const opponentCasterGodId = lastOpponentCard?.godId || null;

    // Nombre de cibles réellement à sélectionner avant que CONFIRMER apparaisse : peut être
    // inférieur au nombre nominal (requiredTargets) s'il ne reste pas assez de cibles distinctes
    // valides (ex: un sort à 2 cibles ennemies alors qu'un seul ennemi est encore en vie) —
    // sinon le joueur restait bloqué en mode ciblage sans jamais pouvoir confirmer.
    const maxSelectableTargets = selectedCard ? getMaxSelectableTargets(selectedCard) : requiredTargets;

    return (
        <div
            className={`${styles.gameBoard} ${screenShake === 'heavy' ? styles.shakeHeavy : ''} ${screenShake === 'light' ? styles.shakeLight : ''}`}
            onClick={handleBoardBackgroundClick}
        >
            {/* BACKGROUND EFFECTS */}
            <div className={styles.terrainTexture} />
            <div className={styles.bgParticles} />
            <div className={styles.vignette} />

            {/* CHRONO DE TOUR — modes compétitifs uniquement (En ligne, Duel). Le mode solo,
                l'Ascension et l'Histoire se jouent sans pression de temps. */}
            {gameState.isOnlineGame && (
                <TurnTimer
                    active={myTurn && gameState.status === 'playing'}
                    turnKey={`${gameState.turnNumber}-${gameState.currentPlayerId}`}
                    onExpire={handleTurnTimeout}
                />
            )}

            {/* PAYSAGE : le plateau est calibré pour le portrait, on demande de tourner
                l'appareil plutôt que de laisser un écran écrasé et injouable.
                Rendu en permanence, mais masqué par la feuille de style hors paysage. */}
            <div className={styles.rotateNotice} role="alertdialog" aria-label="Orientation incorrecte">
                <span className={styles.rotateIcon} aria-hidden="true">📱</span>
                <h2 className={styles.rotateTitle}>Tournez votre téléphone</h2>
                <p className={styles.rotateText}>
                    GODS se joue à la verticale : le plateau, vos dieux et votre main n&apos;ont pas
                    la place de s&apos;afficher en mode paysage.
                </p>
            </div>

            {/* CARTE JOUÉE : vol animé de la main jusqu'au dieu qui la lance */}
            <CardFlight flight={cardFlight} onComplete={() => setCardFlight(null)} />

            {/* BANNIÈRE DE TOUR : annonce sans ambiguïté à qui la main revient */}
            {turnBanner && (
                <div
                    className={`${styles.turnBanner} ${turnBanner === 'mine' ? styles.turnBannerMine : styles.turnBannerTheirs}`}
                    role="status"
                    aria-live="polite"
                >
                    <span className={styles.turnBannerText}>
                        {turnBanner === 'mine' ? 'À VOUS DE JOUER' : "TOUR DE L'ADVERSAIRE"}
                    </span>
                </div>
            )}

            {/* ERROR TOAST */}
            {errorMsg && (
                <div
                    className={styles.errorToast}
                    role="status"
                    aria-live="polite"
                    onClick={dismissError}
                >
                    {errorMsg}
                </div>
            )}

            {/* OPPONENT ACTION PREVIEW (RIGHT) */}
            {lastOpponentCard && (
                <div className={`${styles.playedCardPreview} ${styles.playedCardPreviewOpponent}`} style={{ borderColor: 'var(--color-danger)' }}>
                    <div className={styles.previewTitle} style={{ color: 'var(--color-danger)', textShadow: '0 0 15px rgba(239, 68, 68, 0.5)' }}>
                        ADVERSAIRE JOUE
                    </div>
                    <div className={styles.previewBody}>
                        <div className={styles.previewContent}>
                            <h3 className={styles.previewName}>{lastOpponentCard.name}</h3>
                            <p className={styles.previewDesc}>{getReadableSpellDescription(lastOpponentCard)}</p>
                        </div>
                        <div className={styles.detailCardImage}>
                            <img src={lastOpponentCard.imageUrl} alt={lastOpponentCard.name} />
                        </div>
                    </div>
                </div>
            )}


            {/* CARD DETAIL PANEL (Master Duel Style - LEFT) */}
            {(selectedCard || hoveredCard) && (() => {
                const activeCard = selectedCard || hoveredCard;

                /*
                 * Actions de la carte, RANGÉES DANS LE PANNEAU.
                 *
                 * Le bouton d'action flottait auparavant à 160 px du bas avec un z-index de 500,
                 * c'est-à-dire systématiquement PAR-DESSUS ce panneau (z-index 40, ancré en bas) :
                 * il masquait la description, et parfois le bouton « DÉFAUSSER » lui-même. Les deux
                 * actions possibles sur une carte vivent désormais au même endroit, sous son texte.
                 */
                const readyToConfirm =
                    isSelectingTarget && requiredTargets > 0 && selectedTargetGods.length === maxSelectableTargets;

                const actionButton = selectedCard && myTurn && (
                    isSelectingTarget ? (
                        // En ciblage, le bouton reste TOUJOURS affiché, désactivé tant que le
                        // compte n'y est pas : la rangée se vidait entièrement auparavant, ce qui
                        // donnait un panneau muet et un plateau sans issue apparente.
                        <button
                            className={styles.btnAction}
                            data-tutorial="card-action-primary"
                            disabled={!readyToConfirm}
                            onClick={(e) => { e.stopPropagation(); handlePlayConfirmed(); }}
                        >
                            {readyToConfirm
                                ? '✓ CONFIRMER'
                                : `🎯 TOUCHEZ UN ENNEMI (${selectedTargetGods.length}/${maxSelectableTargets})`}
                        </button>
                    ) : (
                        <button
                            className={styles.btnAction}
                            data-tutorial="card-action-primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                const reason = getUnplayableReason(selectedCard);
                                if (reason) { showError(reason); return; }
                                if (requiredTargets > 0) startTargetSelection();
                                else handlePlayConfirmed();
                            }}
                        >
                            {/* Libellé neutre pour une carte cachée : « CIBLER (2) » révélerait
                                le nombre de cibles d'un sort que l'effet de Nyx doit garder secret. */}
                            {selectedCard.isHiddenFromOwner
                                ? `🎲 JOUER À L'AVEUGLE`
                                : requiredTargets > 0 ? `🎯 CIBLER (${maxSelectableTargets})` : `⚔️ LANCER LE SORT`}
                        </button>
                    )
                );

                // Retour en arrière : toucher « CIBLER » n'engageait à rien de réversible.
                const cancelButton = selectedCard && myTurn && isSelectingTarget && (
                    <button
                        className={styles.btnCancel}
                        onClick={(e) => { e.stopPropagation(); cancelTargetSelection(); }}
                    >
                        ✕ ANNULER
                    </button>
                );

                const discardButton = selectedCard && myTurn && !isSelectingTarget && (
                    <button
                        className={styles.btnDiscard}
                        data-tutorial="card-action-discard"
                        onClick={(e) => { e.stopPropagation(); handleDiscard(); }}
                    >
                        🗑️ DÉFAUSSER
                    </button>
                );

                const actionRow = (actionButton || discardButton) && (
                    <div className={styles.detailActions} data-tutorial="card-actions">
                        {cancelButton}
                        {actionButton}
                        {discardButton}
                    </div>
                );

                // Carte cachée (effet Nyx) : le propriétaire peut la sélectionner pour la jouer
                // ou la défausser à l'aveugle, mais ne doit voir ni son image, ni son nom, ni sa
                // description -- avant ce correctif, ce panneau les affichait quand même.
                if (activeCard?.isHiddenFromOwner) {
                    return (
                        <div className={styles.cardDetailPanel}>
                            <div className={styles.detailCardImage}>
                                <div className={styles.spellCardBack} style={{ width: '100%', height: '100%' }}>
                                    <span className={styles.spellCardBackTitle}>GODS</span>
                                </div>
                            </div>
                            <div className={styles.detailContent}>
                                <h2 className={styles.detailName}>Carte cachée</h2>
                                <p className={styles.detailDescription}>
                                    Cette carte vous est inconnue (effet de Nyx). Vous pouvez la jouer ou la défausser à l&apos;aveugle, mais pas voir son effet à l&apos;avance.
                                </p>
                                {actionRow}
                            </div>
                        </div>
                    );
                }

                return (
                    <div className={styles.cardDetailPanel}>
                        <div className={styles.detailCardImage}>
                            <img src={activeCard?.imageUrl} alt={activeCard?.name} />
                        </div>
                        <div className={styles.detailContent}>
                            <h2 className={styles.detailName}>{activeCard?.name}</h2>
                            <div className={styles.detailType}>
                                <span>EFFET / DESCRIPTION:</span>
                            </div>
                            <p className={styles.detailDescription}>
                                {activeCard ? getReadableSpellDescription(activeCard) : ''}
                            </p>
                            <div className={styles.detailType} style={{ marginTop: '10px' }}>
                                <span>COÛT: ⚡ {activeCard?.energyCost} Énergie</span>
                            </div>
                            {actionRow}
                        </div>
                    </div>
                );
            })()}

            {/* PLAYED CARD PREVIEW (BAS, entre le bouton fin de tour et le cadre deck/défausse/énergie) */}
            {playedCardPreview && (
                <div className={`${styles.playedCardPreview} ${styles.playedCardPreviewSelf}`}>
                    <div className={styles.previewTitle}>SORT LANCÉ</div>
                    <div className={styles.previewBody}>
                        <div className={styles.previewContent}>
                            <h3 className={styles.previewName}>{playedCardPreview.name}</h3>
                            <p className={styles.previewDesc}>{getReadableSpellDescription(playedCardPreview)}</p>
                        </div>
                        <div className={styles.detailCardImage}>
                            <img src={playedCardPreview.imageUrl} alt={playedCardPreview.name} />
                        </div>
                    </div>
                </div>
            )}


            {/* DECK, DISCARD, ENERGIES & FATIGUE */}
            <DeckAndDiscard 
                player={opponent} 
                isOpponent={true} 
                onClickDiscard={() => setViewingDiscard(opponent.discard)}
            />
            <DeckAndDiscard 
                player={player} 
                onClickDiscard={() => setViewingDiscard(player.discard)}
            />

            {/* OPPONENT HAND */}
            <div className={styles.handAreaOpponent} data-hand-area="opponent">
                {opponent.hand.map((card, idx) => {
                    const angle = (idx - (opponent.hand.length - 1) / 2) * 5;
                    const isRevealedToMe = card.revealedToPlayerId === player.id;

                    return (
                        <div 
                            key={`opp-hand-${idx}`} 
                            style={{ position: 'relative', margin: '0 -8px', transform: `rotate(${angle}deg)` }}
                        >
                            <SpellCardUI 
                                card={card}
                                isHidden={!isRevealedToMe} 
                                isMini={true}
                                isMinimal={isRevealedToMe}
                                onMouseEnter={() => isRevealedToMe && setHoveredCard(card)}
                                onMouseLeave={() => setHoveredCard(null)}
                            />
                        </div>
                    );
                })}
            </div>

            {/* ARENA (inclut la barre fin de tour / indicateur de tour / journal, entre les 2 rangées) */}
            <ArenaArea
                player={player}
                opponent={opponent}
                selectedTargetGods={selectedTargetGods}
                onTargetGod={handleGodTarget}
                playerCasterGodId={playerCasterGodId}
                opponentCasterGodId={opponentCasterGodId}
                incomingElement={castElement}
                onImpact={handleImpact}
                myTurn={myTurn}
                turnNumber={gameState.turnNumber}
                onOpenLog={() => setIsLogOpen(true)}
                onEndTurn={() => {
                    if (myTurn) {
                        const result = endTurn();
                        if (!result.success) {
                            showError(result.message);
                        } else if (onAction) {
                            onAction({ type: 'end_turn' });
                        }
                    }
                }}
            />

            {/* BOTTOM HUD */}
            <HandArea
                hand={player.hand}
                selectedCard={selectedCard}
                onSelectCard={handleCardClick}
                onHoverCard={setHoveredCard}
                isCardPlayable={(card) => myTurn && canPlayCard(card)}
                onInspectCard={setInspectedCard}
            />

            {/* APERÇU PLEIN ÉCRAN (appui long) : examiner une carte sans l'engager. Sur mobile,
                toucher une carte la sélectionne, il n'existait donc aucun moyen de lire
                tranquillement un effet avant de décider. */}
            {inspectedCard && (
                <div
                    className={styles.inspectOverlay}
                    onClick={() => setInspectedCard(null)}
                    role="dialog"
                    aria-label={`Aperçu de ${inspectedCard.name}`}
                >
                    <div className={styles.inspectCard} onClick={(e) => e.stopPropagation()}>
                        <img src={inspectedCard.imageUrl} alt="" className={styles.inspectImage} draggable={false} />
                        <div className={styles.inspectInfo}>
                            <h3 className={styles.inspectName}>{inspectedCard.name}</h3>
                            <p className={styles.inspectDesc}>{getReadableSpellDescription(inspectedCard)}</p>
                            <div className={styles.inspectStats}>
                                <span>⚡ Coût : {inspectedCard.energyCost}</span>
                                {inspectedCard.energyGain > 0 && <span>🔋 Gain : +{inspectedCard.energyGain}</span>}
                            </div>
                        </div>
                    </div>
                    <span className={styles.inspectHint}>Touchez pour fermer</span>
                </div>
            )}

            {/* DISCARD VIEWER MODAL */}
            {viewingDiscard && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 2000,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '16px', boxSizing: 'border-box'
                }} onClick={() => { setViewingDiscard(null); setZoomedDiscardCard(null); }}>
                    <h2 style={{ color: 'white', marginBottom: '14px', fontFamily: 'var(--font-logo)', fontSize: 'clamp(1rem, 4vw, 1.3rem)' }}>Contenu de la Corbeille</h2>

                    {viewingDiscard.length === 0 ? (
                        <div style={{ color: '#94a3b8', fontSize: '1rem', fontStyle: 'italic' }}>Cette corbeille est vide.</div>
                    ) : zoomedDiscardCard ? (
                        // Vue détaillée d'une carte de la corbeille : même format que le panneau de
                        // détail des cartes en main, pour pouvoir vraiment lire l'effet complet.
                        <div
                            className={styles.cardDetailPanel}
                            style={{ position: 'relative', bottom: 'auto', maxHeight: 'none', width: 'min(360px, 100%)' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className={styles.detailCardImage}>
                                <img src={zoomedDiscardCard.imageUrl} alt={zoomedDiscardCard.name} />
                            </div>
                            <div className={styles.detailContent}>
                                <h2 className={styles.detailName}>{zoomedDiscardCard.name}</h2>
                                <div className={styles.detailType}><span>EFFET / DESCRIPTION:</span></div>
                                <p className={styles.detailDescription}>{getReadableSpellDescription(zoomedDiscardCard)}</p>
                                <div className={styles.detailType} style={{ marginTop: '10px' }}>
                                    <span>COÛT: ⚡ {zoomedDiscardCard.energyCost} Énergie</span>
                                </div>
                                <button className={styles.btnPremium} style={{ marginTop: '12px' }} onClick={() => setZoomedDiscardCard(null)}>
                                    ← Retour
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', width: '100%', maxHeight: '65dvh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                            {viewingDiscard.map((card, idx) => (
                                <div
                                    key={idx}
                                    className={styles.spellCard}
                                    style={{ cursor: 'pointer', transform: 'none' }}
                                    onClick={() => setZoomedDiscardCard(card)}
                                >
                                    <div className={styles.spellCost}>{card.energyCost}</div>
                                    {card.imageUrl && <img src={card.imageUrl} alt={card.name} className={styles.spellImage} />}
                                    <div className={styles.spellTitle}>{card.name}</div>
                                    <div className={styles.spellDesc}>{getReadableSpellDescription(card)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    <button className={styles.btnPremium} style={{ marginTop: '16px' }} onClick={() => { setViewingDiscard(null); setZoomedDiscardCard(null); }}>Fermer</button>
                </div>
            )}

            {/* MODALS D'EFFETS SPÉCIAUX */}
            <CardSelectionModal 
                isOpen={isSelectingCards}
                title={cardSelectionTitle}
                requiredCount={cardSelectionCount}
                cards={cardSelectionSource === 'hand' ? player.hand : player.discard}
                onConfirm={confirmCardSelection}
                onCancel={cancelCardSelection}
            />

            <OptionalChoiceModal
                isOpen={isShowingOptionalChoice}
                title={optionalChoiceTitle}
                description={optionalChoiceDescription}
                onAccept={() => confirmOptionalChoice(true)}
                onDecline={() => confirmOptionalChoice(false)}
                {...(pendingOptionalEffect === 'cascade_heal_choice' || pendingOptionalEffect?.startsWith('copy_cascade_heal:')
                    ? { acceptLabel: '⬅️ Gauche (Ouest)', declineLabel: 'Droite (Est) ➡️' }
                    : {})}
            />

            <ElementSelectionModal
                isOpen={isSelectingElement}
                onSelect={(el) => {
                    setSelectedElement(el);
                    handlePlayConfirmed();
                }}
                onCancel={() => useGameStore.setState({ isSelectingElement: false })}
            />

            <LightningActionModal
                isOpen={isSelectingLightningAction}
                onSelect={(action) => {
                    setLightningAction(action);
                    handlePlayConfirmed(action);
                }}
                onCancel={() => useGameStore.setState({ isSelectingLightningAction: false })}
            />

            <PlayerSelectionModal 
                isOpen={isSelectingPlayer}
                title={playerSelectionTitle}
                onSelectSelf={() => confirmPlayerSelection(true)}
                onSelectOpponent={() => confirmPlayerSelection(false)}
                onCancel={cancelPlayerSelection}
            />

            <DeadGodSelectionModal 
                isOpen={isSelectingDeadGod}
                title={deadGodSelectionTitle}
                deadGods={player.gods.filter(g => g.isDead)}
                onSelectGod={confirmDeadGodSelection}
                onCancel={cancelDeadGodSelection}
            />

            <ZombieDamageModal 
                isOpen={isShowingZombieDamage}
                zombieGod={player.gods.find(g => g.card.id === zombieDamageGodId) || null}
                enemyGods={opponent.gods}
                onSelectTarget={confirmZombieDamage}
                onSkip={cancelZombieDamage}
            />

            <HealDistributionModal
                isOpen={isDistributingHeal}
                totalHeal={healDistributionTotal}
                allies={player.gods}
                onConfirm={confirmHealDistribution}
                onCancel={cancelHealDistribution}
            />

            <GodSelectionModal
                isOpen={isSelectingGod}
                title={godSelectionTitle}
                allyGods={player.gods}
                enemyGods={opponent.gods}
                targetType={godSelectionTargetType}
                onSelectGod={confirmGodSelection}
                onCancel={cancelGodSelection}
            />

            <CombatLogModal
                isOpen={isLogOpen}
                log={gameState.log || []}
                myPlayerId={playerId}
                onClose={() => setIsLogOpen(false)}
            />
        </div>
    );
}
