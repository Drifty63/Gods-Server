'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Element } from '@/types/cards';
import { ELEMENT_SYMBOLS } from '@/game-engine/ElementSystem';
import GodCard from '@/components/GodCard/GodCard';
import SpellCard from '@/components/SpellCard/SpellCard';
import CardSelectionModal from '@/components/CardSelectionModal/CardSelectionModal';
import HealDistributionModal from '@/components/HealDistributionModal/HealDistributionModal';
import CardDetailModal from '@/components/CardDetailModal/CardDetailModal';
import OptionalChoiceModal from '@/components/OptionalChoiceModal/OptionalChoiceModal';
import PlayerSelectionModal from '@/components/PlayerSelectionModal/PlayerSelectionModal';
import DeadGodSelectionModal from '@/components/DeadGodSelectionModal/DeadGodSelectionModal';
import GodSelectionModal from '@/components/GodSelectionModal/GodSelectionModal';
import ZombieDamageModal from '@/components/ZombieDamageModal/ZombieDamageModal';
import DamageNumber from './DamageNumber';
import TurnTransition from './TurnTransition';
import { useCombatAnimations, useGameStateAnimations } from './useCombatAnimations';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { recordVictory, recordDefeat, recordGodsPlayed } from '@/services/firebase';
import styles from './GameBoard.module.css';

// Liste des éléments disponibles pour la sélection
const ALL_ELEMENTS: Element[] = ['fire', 'water', 'earth', 'air', 'lightning', 'light', 'darkness'];

interface GameBoardProps {
    onAction?: (action: {
        type: 'play_card' | 'discard' | 'end_turn' | 'game_over' | 'zombie_resurrect' | 'shuffle_god_cards';
        payload: Record<string, unknown>;
    }) => void;
}

export default function GameBoard({ onAction }: GameBoardProps = {}) {
    const {
        gameState,
        playerId,
        isSoloMode,
        selectedCard,
        selectedTargetGods,
        isSelectingTarget,
        selectCard,
        startTargetSelection,
        addTargetGod,
        toggleTargetGod,
        setLightningAction,
        setSelectedElement,
        isSelectingElement,
        selectedElement,
        playCard,
        discardForEnergy,
        endTurn,
        canPlayCard,
        isMyTurn,
        getRequiredTargetCount,
        getValidEnemyTargets,
        getRequiredEnemyTargets,
        needsElementChoice,
        // Sélection de cartes
        isSelectingCards,
        cardSelectionCount,
        cardSelectionTitle,
        pendingCardSelectionEffect,
        startCardSelection,
        confirmCardSelection,
        cancelCardSelection,
        getCardsForSelection,
        // Distribution de soins
        isDistributingHeal,
        healDistributionTotal,
        startHealDistribution,
        confirmHealDistribution,
        cancelHealDistribution,
        // Sélection de cartes adverses (Nyx)
        isSelectingEnemyCards,
        enemyCardSelectionCount,
        enemyCardSelectionTitle,
        startEnemyCardSelection,
        confirmEnemyCardSelection,
        cancelEnemyCardSelection,
        // Cartes cachées (Nyx)
        revealBlindCard,
        discardBlindCard,
        surrender,
        // Choix optionnel (Perséphone Vision du Tartare)
        isShowingOptionalChoice,
        optionalChoiceTitle,
        optionalChoiceDescription,
        startOptionalChoice,
        confirmOptionalChoice,
        cancelOptionalChoice,
        pendingOptionalTargetGodIds,
        // Sélection de joueur (Zéphyr Bourrasque Chanceuse)
        isSelectingPlayer,
        playerSelectionTitle,
        startPlayerSelection,
        confirmPlayerSelection,
        cancelPlayerSelection,
        // Zombie resurrection (Perséphone Brûlure Rémanente)
        isSelectingDeadGod,
        deadGodSelectionTitle,
        startDeadGodSelection,
        confirmDeadGodSelection,
        cancelDeadGodSelection,
        // Dégâts zombie (fin de tour)
        isShowingZombieDamage,
        zombieDamageGodId,
        startZombieDamage,
        confirmZombieDamage,
        cancelZombieDamage,
        // Sélection de dieu vivant (Zéphyr Vent de Face)
        isSelectingGod,
        godSelectionTitle,
        godSelectionTargetType,
        startGodSelection,
        confirmGodSelection,
        cancelGodSelection,
        playCardWithChoice,
        // Sort copié (Perséphone ulti)
        pendingEnemyCardEffect,
        // IA
        playAITurn,
        isAIPlaying,
    } = useGameStore();

    // Récupérer l'utilisateur connecté pour enregistrer les stats
    const { user, refreshProfile } = useAuth();

    // #1, #2, #6 - Animations de combat
    const combatAnimations = useCombatAnimations();
    useGameStateAnimations(gameState, playerId, combatAnimations);

    // Helper local pour la détection fiable du choix de foudre
    const needsLightningChoice = (card: import('@/types/cards').SpellCard): boolean => {
        return card.effects.some(e =>
            e.type === 'custom' &&
            e.customEffectId &&
            e.customEffectId.startsWith('lightning_toggle')
        );
    };

    // Helper local pour la détection du choix d'élément (Artémis Coup Critique)
    const needsElementChoiceLocal = (card: import('@/types/cards').SpellCard): boolean => {
        return card.effects.some(e =>
            e.type === 'custom' &&
            e.customEffectId === 'apply_weakness'
        );
    };

    // Helper pour détecter si une carte nécessite une sélection de cartes
    const getCardSelectionRequired = (card: import('@/types/cards').SpellCard): {
        needed: boolean;
        source: 'hand' | 'discard';
        count: number;
        title: string;
        effectId: string;
    } | null => {
        for (const effect of card.effects) {
            if (effect.type === 'custom') {
                if (effect.customEffectId === 'recycle_from_discard') {
                    return {
                        needed: true,
                        source: 'discard',
                        count: 2,
                        title: '🔄 Choisissez 2 cartes à remettre dans votre deck',
                        effectId: 'recycle_from_discard'
                    };
                }
                if (effect.customEffectId === 'put_cards_bottom') {
                    return {
                        needed: true,
                        source: 'hand',
                        count: 3,
                        title: '📚 Choisissez 3 cartes à placer en dessous de votre deck',
                        effectId: 'put_cards_bottom'
                    };
                }
                if (effect.customEffectId === 'retrieve_discard') {
                    return {
                        needed: true,
                        source: 'discard',
                        count: 1,
                        title: '💀 Échange d\'Âme - Choisissez une carte à récupérer',
                        effectId: 'retrieve_discard'
                    };
                }
                if (effect.customEffectId === 'copy_discard_spell') {
                    return {
                        needed: true,
                        source: 'discard',
                        count: 1,
                        title: '💀 Pouvoirs des Âmes - Choisissez un sort à copier',
                        effectId: 'copy_discard_spell'
                    };
                }
            }
        }
        return null;
    };

    // Helper pour détecter si une carte nécessite une distribution de soins
    const getHealDistributionRequired = (card: import('@/types/cards').SpellCard): {
        needed: boolean;
        totalHeal: number;
    } | null => {
        for (const effect of card.effects) {
            if (effect.type === 'custom' && effect.customEffectId?.startsWith('distribute_heal_')) {
                const healAmount = parseInt(effect.customEffectId.split('_')[2]) || 5;
                return {
                    needed: true,
                    totalHeal: healAmount
                };
            }
        }
        return null;
    };

    // Helper pour détecter si une carte nécessite une sélection de cartes adverses (Nyx)
    const getEnemyCardSelectionRequired = (card: import('@/types/cards').SpellCard): {
        needed: boolean;
        count: number;
        title: string;
        effectId: string;
    } | null => {
        for (const effect of card.effects) {
            if (effect.type === 'custom') {
                if (effect.customEffectId === 'shuffle_hand_draw_blind') {
                    return {
                        needed: true,
                        count: 1,
                        title: '👁️ Choisissez 1 carte de l\'adversaire à mélanger',
                        effectId: 'shuffle_hand_draw_blind'
                    };
                }
                if (effect.customEffectId === 'shuffle_hand_draw_blind_2') {
                    return {
                        needed: true,
                        count: 2,
                        title: '👁️ Choisissez 2 cartes de l\'adversaire à mélanger',
                        effectId: 'shuffle_hand_draw_blind_2'
                    };
                }
                if (effect.customEffectId === 'choose_discard_enemy') {
                    return {
                        needed: true,
                        count: 1,
                        title: '💨 Vent d\'Ouest - Choisissez 1 carte à défausser',
                        effectId: 'choose_discard_enemy'
                    };
                }
            }
        }
        return null;
    };

    // Helper pour détecter si une carte nécessite un choix optionnel
    const getOptionalChoiceRequired = (card: import('@/types/cards').SpellCard): {
        needed: boolean;
        title: string;
        description: string;
        effectId: string;
    } | null => {
        for (const effect of card.effects) {
            // Perséphone - Vision du Tartare
            if (effect.type === 'custom' && effect.customEffectId === 'vision_tartare') {
                return {
                    needed: true,
                    title: '💀 Vision du Tartare',
                    description: 'Voulez-vous défausser 2 cartes de votre deck pour infliger +1 dégât à chaque cible ?',
                    effectId: 'vision_tartare'
                };
            }
            // Séléné - Marée Basse (choix de direction du soin)
            if (effect.type === 'custom' && effect.customEffectId === 'cascade_heal_choice') {
                return {
                    needed: true,
                    title: '🌊 Marée Basse',
                    description: 'Choisissez le sens du soin en cascade (3, 2, 1 PV).',
                    effectId: 'cascade_heal_choice'
                };
            }
        }
        return null;
    };

    // Helper pour détecter si une carte nécessite un choix de joueur (Zéphyr - free_recycle)
    const getPlayerSelectionRequired = (card: import('@/types/cards').SpellCard): {
        needed: boolean;
        title: string;
        effectId: string;
    } | null => {
        for (const effect of card.effects) {
            if (effect.type === 'custom' && effect.customEffectId === 'free_recycle') {
                return {
                    needed: true,
                    title: '💨 Bourrasque Chanceuse - Qui recycler ?',
                    effectId: 'free_recycle'
                };
            }
        }
        return null;
    };

    // Helper pour détecter si une carte nécessite une sélection de dieu mort (Perséphone - temp_resurrect)
    const getDeadGodSelectionRequired = (card: import('@/types/cards').SpellCard): {
        needed: boolean;
        title: string;
        effectId: string;
    } | null => {
        for (const effect of card.effects) {
            if (effect.type === 'custom' && effect.customEffectId === 'temp_resurrect') {
                return {
                    needed: true,
                    title: '💀 Brûlure Rémanente - Choisissez un dieu mort',
                    effectId: 'temp_resurrect'
                };
            }
        }
        return null;
    };

    // Helper pour détecter si une carte nécessite une sélection de dieu vivant (Zéphyr - shuffle_god_cards)
    const getGodSelectionRequired = (card: import('@/types/cards').SpellCard): {
        needed: boolean;
        title: string;
        effectId: string;
        targetType: 'ally' | 'enemy' | 'any';
    } | null => {
        for (const effect of card.effects) {
            if (effect.type === 'custom' && effect.customEffectId === 'shuffle_god_cards') {
                return {
                    needed: true,
                    title: '💨 Vent de Face - Choisissez un dieu',
                    effectId: 'shuffle_god_cards',
                    targetType: 'any' // Peut cibler allié ou ennemi
                };
            }
        }
        return null;
    };

    const [viewDiscard, setViewDiscard] = useState<'player' | 'opponent' | null>(null);
    const [previewCard, setPreviewCard] = useState<import('@/types/cards').SpellCard | null>(null);
    const [pendingCardForSelection, setPendingCardForSelection] = useState<import('@/types/cards').SpellCard | null>(null);
    const [pendingCardForHealDistribution, setPendingCardForHealDistribution] = useState<import('@/types/cards').SpellCard | null>(null);
    const [pendingCardForEnemySelection, setPendingCardForEnemySelection] = useState<import('@/types/cards').SpellCard | null>(null);
    // Indique si l'utilisateur a cliqué sur "Jouer" (pour contrôler quand afficher le choix foudre)
    const [wantsToPlay, setWantsToPlay] = useState(false);
    // Modal de détail de carte
    const [showCardDetail, setShowCardDetail] = useState(false);
    const [isForcedDetail, setIsForcedDetail] = useState(false);
    // Sélection directe des cartes adverses (au lieu du modal)
    const [selectedEnemyCardIds, setSelectedEnemyCardIds] = useState<string[]>([]);
    // Distribution de soins directe (au lieu du modal) - stocke le nombre de soins par dieu
    const [healDistribution, setHealDistribution] = useState<Record<string, number>>({});
    // Sélection directe de cartes de la défausse (au lieu du modal)
    const [selectedDiscardCardIds, setSelectedDiscardCardIds] = useState<string[]>([]);
    // Cible des dégâts zombie (fin de tour)
    const [zombieDamageTargetId, setZombieDamageTargetId] = useState<string | null>(null);

    // Système de toast pour les messages d'erreur
    const [toast, setToast] = useState<{ message: string; type: 'warning' | 'error' | 'info' } | null>(null);
    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // État pour afficher la carte jouée au centre du terrain
    const [displayedCard, setDisplayedCard] = useState<import('@/types/cards').SpellCard | null>(null);
    const [pendingCardForOverlay, setPendingCardForOverlay] = useState<import('@/types/cards').SpellCard | null>(null);

    // États pour les animations de dégâts/soins sur les dieux
    const [healthChanges, setHealthChanges] = useState<Record<string, number>>({});
    const previousHealthRef = useRef<Record<string, number>>({});

    // Musique de combat
    const battleAudioRef = useRef<HTMLAudioElement | null>(null);
    const [battleVolume, setBattleVolume] = useState(0.3);
    const [isMuted, setIsMuted] = useState(false);

    // Charger les paramètres audio depuis localStorage
    useEffect(() => {
        const savedBattleVolume = localStorage.getItem('battleVolume');
        const savedMuted = localStorage.getItem('isMuted');

        if (savedBattleVolume) setBattleVolume(parseFloat(savedBattleVolume));
        if (savedMuted) setIsMuted(savedMuted === 'true');
    }, []);

    // Écouter les changements de localStorage (quand l'utilisateur modifie dans les options)
    useEffect(() => {
        const handleStorageChange = () => {
            const savedBattleVolume = localStorage.getItem('battleVolume');
            const savedMuted = localStorage.getItem('isMuted');

            if (savedBattleVolume) setBattleVolume(parseFloat(savedBattleVolume));
            if (savedMuted) setIsMuted(savedMuted === 'true');
        };

        window.addEventListener('storage', handleStorageChange);

        // Aussi vérifier périodiquement (pour les changements dans le même onglet)
        const interval = setInterval(() => {
            const savedBattleVolume = localStorage.getItem('battleVolume');
            const savedMuted = localStorage.getItem('isMuted');

            if (savedBattleVolume) {
                const vol = parseFloat(savedBattleVolume);
                if (vol !== battleVolume) setBattleVolume(vol);
            }
            if (savedMuted) {
                const muted = savedMuted === 'true';
                if (muted !== isMuted) setIsMuted(muted);
            }
        }, 1000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [battleVolume, isMuted]);

    // Gérer la musique de combat
    useEffect(() => {
        if (!battleAudioRef.current) {
            battleAudioRef.current = new Audio('/audio/battle_theme.mp3');
            battleAudioRef.current.loop = true;
        }

        const audio = battleAudioRef.current;
        audio.volume = isMuted ? 0 : battleVolume;

        // Jouer la musique si le jeu est en cours
        if (gameState && !gameState.winnerId) {
            audio.play().catch(() => {
                // Autoplay bloqué, on réessaie après interaction utilisateur
            });
        }

        return () => {
            if (battleAudioRef.current) {
                battleAudioRef.current.pause();
                battleAudioRef.current.currentTime = 0;
            }
        };
    }, [gameState?.winnerId]);

    // Mettre à jour le volume en temps réel
    useEffect(() => {
        if (battleAudioRef.current) {
            battleAudioRef.current.volume = isMuted ? 0 : battleVolume;
        }
    }, [battleVolume, isMuted]);

    const showToast = useCallback((message: string, type: 'warning' | 'error' | 'info' = 'warning') => {
        // Annuler le timeout précédent
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
        setToast({ message, type });
        // Fermer automatiquement après 4 secondes
        toastTimeoutRef.current = setTimeout(() => {
            setToast(null);
        }, 4000);
    }, []);

    // Chronomètre de tour (60 secondes par tour)
    const TURN_TIME_LIMIT = 60;
    const [turnTimer, setTurnTimer] = useState(TURN_TIME_LIMIT);
    const turnTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Effet pour ouvrir le modal de sélection après avoir joué une carte qui le nécessite
    useEffect(() => {
        if (pendingCardForSelection) {
            const selection = getCardSelectionRequired(pendingCardForSelection);
            if (selection) {
                startCardSelection(selection.source, selection.count, selection.title, selection.effectId);
            }
            setPendingCardForSelection(null);
        }
    }, [pendingCardForSelection, startCardSelection]);

    // Effet pour ouvrir le modal de distribution de soins après avoir joué une carte qui le nécessite
    useEffect(() => {
        if (pendingCardForHealDistribution) {
            const healDist = getHealDistributionRequired(pendingCardForHealDistribution);
            if (healDist) {
                startHealDistribution(healDist.totalHeal);
            }
            setPendingCardForHealDistribution(null);
        }
    }, [pendingCardForHealDistribution, startHealDistribution]);

    // Effet pour ouvrir le modal de sélection de cartes adverses (Nyx)
    useEffect(() => {
        if (pendingCardForEnemySelection) {
            const enemySel = getEnemyCardSelectionRequired(pendingCardForEnemySelection);
            if (enemySel) {
                startEnemyCardSelection(enemySel.count, enemySel.title, enemySel.effectId);
            }
            setPendingCardForEnemySelection(null);
        }
    }, [pendingCardForEnemySelection, startEnemyCardSelection]);

    // Effet pour réinitialiser la sélection directe quand on quitte le mode
    useEffect(() => {
        if (!isSelectingEnemyCards) {
            setSelectedEnemyCardIds([]);
        }
    }, [isSelectingEnemyCards]);

    // Effet pour confirmer automatiquement quand le bon nombre de cartes est sélectionné
    useEffect(() => {
        if (isSelectingEnemyCards && selectedEnemyCardIds.length === enemyCardSelectionCount) {
            // Confirmer la sélection
            confirmEnemyCardSelection(selectedEnemyCardIds);
            setSelectedEnemyCardIds([]);
        }
    }, [selectedEnemyCardIds, isSelectingEnemyCards, enemyCardSelectionCount, confirmEnemyCardSelection]);

    // Fonction pour toggle la sélection d'une carte adverse
    const handleEnemyCardClick = (cardId: string) => {
        if (!isSelectingEnemyCards) return;

        setSelectedEnemyCardIds(prev => {
            if (prev.includes(cardId)) {
                // Désélectionner
                return prev.filter(id => id !== cardId);
            } else if (prev.length < enemyCardSelectionCount) {
                // Sélectionner si on n'a pas atteint la limite
                return [...prev, cardId];
            }
            return prev;
        });
    };

    // Effet pour réinitialiser la distribution de soins quand on quitte le mode
    useEffect(() => {
        if (!isDistributingHeal) {
            setHealDistribution({});
        }
    }, [isDistributingHeal]);

    // Calculer le total de soins distribués
    const totalHealDistributed = Object.values(healDistribution).reduce((sum, val) => sum + val, 0);

    // Fonction pour ajouter un soin à un dieu (clic)
    const handleHealGodClick = (godId: string) => {
        if (!isDistributingHeal) return;
        if (totalHealDistributed >= healDistributionTotal) return; // Déjà au max

        setHealDistribution(prev => ({
            ...prev,
            [godId]: (prev[godId] || 0) + 1
        }));
    };

    // Fonction pour réinitialiser la distribution
    const handleResetHealDistribution = () => {
        setHealDistribution({});
    };

    // Fonction pour confirmer la distribution de soins
    const handleConfirmDirectHealDistribution = () => {
        const distribution = Object.entries(healDistribution)
            .filter(([, amount]) => amount > 0)
            .map(([godId, amount]) => ({ godId, amount }));

        confirmHealDistribution(distribution);
        setHealDistribution({});
        if (pendingCardForOverlay) {
            showPlayedCard(pendingCardForOverlay);
            setPendingCardForOverlay(null);
        }
        autoEndTurnMultiplayer();
    };

    // Effet pour réinitialiser la sélection de cartes de défausse quand on quitte le mode
    useEffect(() => {
        if (!isSelectingCards) {
            setSelectedDiscardCardIds([]);
        }
    }, [isSelectingCards]);

    // Fonction pour toggle la sélection d'une carte de la défausse
    const handleDiscardCardSelect = (cardId: string) => {
        if (!isSelectingCards) return;

        setSelectedDiscardCardIds(prev => {
            if (prev.includes(cardId)) {
                // Désélectionner
                return prev.filter(id => id !== cardId);
            } else if (prev.length < cardSelectionCount) {
                // Sélectionner si on n'a pas atteint la limite
                return [...prev, cardId];
            }
            return prev;
        });
    };

    // Fonction pour confirmer la sélection de cartes de défausse
    const handleConfirmDirectCardSelection = () => {
        const cards = getCardsForSelection().filter(c => selectedDiscardCardIds.includes(c.id));
        confirmCardSelection(cards);
        setSelectedDiscardCardIds([]);
        if (pendingCardForOverlay) {
            showPlayedCard(pendingCardForOverlay);
            setPendingCardForOverlay(null);
        }
        autoEndTurnMultiplayer();
    };

    // Effet pour réinitialiser la cible zombie quand on quitte le mode
    useEffect(() => {
        if (!isShowingZombieDamage) {
            setZombieDamageTargetId(null);
        }
    }, [isShowingZombieDamage]);

    // Handler pour le clic sur un dieu mort (Perséphone)
    const handleDeadGodClick = (godId: string) => {
        if (isSelectingDeadGod) {
            confirmDeadGodSelection(godId);
            if (pendingCardForOverlay) {
                showPlayedCard(pendingCardForOverlay);
                setPendingCardForOverlay(null);
            }
            autoEndTurnMultiplayer();
        }
    };

    // Handler pour le clic sur une cible zombie
    const handleZombieTargetClick = (godId: string) => {
        if (isShowingZombieDamage) {
            if (zombieDamageTargetId === godId) {
                setZombieDamageTargetId(null); // Désélectionner
            } else {
                setZombieDamageTargetId(godId);
            }
        }
    };

    // Handler pour confirmer les dégâts zombie
    const handleConfirmDirectZombieDamage = () => {
        // null si on passe (annuler/skip), id si on a choisi
        // Mais ici le bouton confirmer ne sera actif que si une cible est choisie ou si on veut passer (bouton skip séparé)

        // Si une cible est sélectionnée, on confirme
        if (zombieDamageTargetId) {
            confirmZombieDamage(zombieDamageTargetId);
        } else {
            // Si aucune cible, c'est comme passer le tour (si autorisé par les règles, mais le bouton "Confirmer" devrait être "Passer" dans ce cas ?)
            // Généralement Zombie oblige à attaquer si possible. Le bouton Annuler/Passer appelera confirmZombieDamage(null).
            confirmZombieDamage(null);
        }
        setZombieDamageTargetId(null);
        autoEndTurnMultiplayer();
    };

    // Effet pour détecter les changements de HP et afficher les animations
    useEffect(() => {
        if (!gameState) return;

        const allGods = [...gameState.players[0].gods, ...gameState.players[1].gods];
        const newChanges: Record<string, number> = {};
        let hasChanges = false;

        allGods.forEach(god => {
            const godKey = god.card.id;
            const prevHealth = previousHealthRef.current[godKey];

            // Si c'est la première fois qu'on voit ce dieu, on l'initialise sans animation
            if (prevHealth === undefined) {
                previousHealthRef.current[godKey] = god.currentHealth;
                return;
            }

            // Si la santé a changé
            if (prevHealth !== god.currentHealth) {
                const diff = god.currentHealth - prevHealth;
                newChanges[godKey] = diff;
                hasChanges = true;
                console.log(`💥 HP change: ${god.card.name} ${diff > 0 ? '+' : ''}${diff} (${prevHealth} -> ${god.currentHealth})`);
            }

            // Mettre à jour la référence
            previousHealthRef.current[godKey] = god.currentHealth;
        });

        if (hasChanges) {
            // Afficher les animations immédiatement avec la carte
            setHealthChanges(prev => ({ ...prev, ...newChanges }));

            // Clear les animations après 4 secondes (même durée que la carte)
            setTimeout(() => {
                setHealthChanges({});
            }, 4000);
        }
    }, [gameState]);

    // Référence pour détecter les cartes jouées par l'adversaire
    const opponentDiscardLengthRef = useRef<number>(-1);

    // Effet pour détecter quand l'adversaire joue une carte et l'afficher
    useEffect(() => {
        if (!gameState) return;

        const currentOpponent = gameState.players.find(p => p.id !== playerId);
        if (!currentOpponent) return;

        const currentDiscardLength = currentOpponent.discard.length;

        // Initialisation lors du premier chargement du gameState
        if (opponentDiscardLengthRef.current === -1) {
            opponentDiscardLengthRef.current = currentDiscardLength;
            return;
        }

        const prevDiscardLength = opponentDiscardLengthRef.current;

        // Détection de carte jouée par l'adversaire :
        // La défausse adverse a augmenté
        if (currentDiscardLength > prevDiscardLength) {
            console.log(`🎴 Opponent played: ${currentDiscardLength} cards in discard (was ${prevDiscardLength})`);

            const lastPlayedCard = currentOpponent.discard[currentOpponent.discard.length - 1];
            if (lastPlayedCard) {
                // On remplace la carte affichée par la nouvelle (pour l'IA qui peut jouer vite)
                setDisplayedCard(lastPlayedCard);

                // On nettoie le timeout précédent s'il y en avait un (optionnel via useRef si on voulait être parfait)
                setTimeout(() => {
                    setDisplayedCard(prev => prev?.id === lastPlayedCard.id ? null : prev);
                }, 4000);
            }
        }

        opponentDiscardLengthRef.current = currentDiscardLength;
    }, [gameState, playerId]);

    // État pour éviter d'enregistrer les stats plusieurs fois
    const [gameResultRecorded, setGameResultRecorded] = useState(false);

    // Effet pour enregistrer les stats de fin de partie (quêtes journalières)
    useEffect(() => {
        // Ne rien faire si pas de gameState ou si déjà enregistré
        if (!gameState || gameResultRecorded) return;

        // Détecter la fin de partie (avec ou sans gagnant - pour les match nuls)
        if (gameState.status === 'finished' && user) {
            // Marquer immédiatement comme enregistré pour éviter les doubles appels
            setGameResultRecorded(true);

            // Vérifier le mode de jeu (ranked, casual, private, ou solo)
            const gameMode = sessionStorage.getItem('gameMode');

            // Seules les parties en ligne (ranked ou casual) comptent pour les quêtes
            // Les parties vs IA (pas de gameMode) et parties privées (private) ne comptent pas
            if (!gameMode || gameMode === 'private') {
                console.log(`🎮 Partie ${gameMode || 'vs IA'} terminée - pas de mise à jour des quêtes`);
                return;
            }

            const isRanked = gameMode === 'ranked';

            // Récupérer les dieux du joueur pour les statistiques
            const playerData = gameState.players.find(p => p.id === playerId);
            const playerGodIds = playerData?.gods.map(g => g.card.id) || [];

            // Enregistrer le résultat
            const recordResult = async () => {
                try {
                    // Match nul: pas de victoire ni défaite, juste les dieux joués
                    if (gameState.winReason === 'draw') {
                        console.log(`🤝 Match nul enregistré - pas de modification des stats victoire/défaite`);
                    } else if (gameState.winnerId) {
                        const isVictory = gameState.winnerId === playerId;
                        if (isVictory) {
                            await recordVictory(user.uid, isRanked);
                            console.log(`✅ Victoire enregistrée (${isRanked ? 'classée' : 'amicale'}), quêtes mises à jour`);
                        } else {
                            await recordDefeat(user.uid, isRanked);
                            console.log(`📝 Défaite enregistrée (${isRanked ? 'classée' : 'amicale'}), quêtes mises à jour`);
                        }
                    }

                    // Enregistrer les dieux joués (même en cas de match nul)
                    if (playerGodIds.length > 0) {
                        await recordGodsPlayed(user.uid, playerGodIds);
                        console.log(`🎭 Dieux enregistrés: ${playerGodIds.join(', ')}`);
                    }

                    // Rafraîchir le profil pour mettre à jour l'affichage
                    await refreshProfile();
                } catch (error) {
                    console.error('Erreur enregistrement résultat:', error);
                }
            };

            recordResult();
        }
    }, [gameState, gameResultRecorded, user, playerId, refreshProfile]);

    // Référence pour savoir si on a déjà déclenché l'IA au démarrage
    const aiStartTriggeredRef = useRef(false);

    // Effet pour déclencher l'IA si elle doit jouer en premier au démarrage de la partie
    useEffect(() => {
        if (!gameState || !isSoloMode || aiStartTriggeredRef.current) return;

        // Vérifier si c'est le premier tour (turnNumber === 1) et que c'est le tour de l'IA
        if (
            gameState.turnNumber === 1 &&
            gameState.currentPlayerId !== playerId &&
            gameState.status === 'playing' &&
            !isAIPlaying
        ) {
            console.log('🤖 AI starts first, triggering AI turn...');
            aiStartTriggeredRef.current = true;
            // Petit délai pour laisser le temps à l'UI de se charger
            setTimeout(() => {
                playAITurn();
            }, 1000);
        }
    }, [gameState, isSoloMode, playerId, isAIPlaying, playAITurn]);

    if (!gameState) {
        return <div className={styles.loading}>Chargement...</div>;
    }

    const player = gameState.players.find(p => p.id === playerId)!;
    const opponent = gameState.players.find(p => p.id !== playerId)!;
    const isPlayerTurn = isMyTurn();

    // Compter les cibles disponibles pour les effets de type enemy_god
    const availableEnemyTargets = opponent.gods.filter(g => !g.isDead).length;
    const availableAllyTargets = player.gods.filter(g => !g.isDead).length;

    // Le nombre requis de cibles pour la carte sélectionnée
    const requiredTargets = selectedCard ? getRequiredTargetCount(selectedCard) : 0;

    // Détermine si c'est un sort multi-cible
    const isMultiTarget = requiredTargets > 1;

    // Obtenir les cibles obligatoires (provocateurs) qui doivent être inclus
    const requiredEnemyTargets = getRequiredEnemyTargets();

    // Le nombre max de cibles est le minimum entre le nombre requis et les cibles disponibles
    const maxPossibleTargets = Math.min(requiredTargets, availableEnemyTargets + availableAllyTargets);

    // Vérifier si les provocateurs obligatoires sont inclus dans la sélection
    const allRequiredTargetsIncluded = requiredEnemyTargets.every(
        req => selectedTargetGods.some(sel => sel.card.id === req.card.id)
    );

    // Vérifier si on peut confirmer (au moins 1 cible sélectionnée ET tous les provocateurs inclus)
    const canConfirm = selectedTargetGods.length > 0 && allRequiredTargetsIncluded;
    // Pour l'affichage : montrer si toutes les cibles possibles sont sélectionnées
    const allTargetsSelected = selectedTargetGods.length >= maxPossibleTargets && requiredTargets > 0;

    // Fonction pour finir le tour automatiquement (mode solo ET multijoueur)
    const autoEndTurnMultiplayer = () => {
        setTimeout(() => {
            const currentState = useGameStore.getState().gameState;
            const currentStoreState = useGameStore.getState();

            // Vérifier si c'est toujours le tour du joueur
            if (currentState && currentState.currentPlayerId === playerId && currentState.status === 'playing') {

                // NE PAS finir le tour si un modal est ouvert
                const hasActiveModal =
                    currentStoreState.isDistributingHeal ||
                    currentStoreState.isSelectingCards ||
                    currentStoreState.isSelectingEnemyCards ||
                    currentStoreState.isShowingOptionalChoice ||
                    currentStoreState.isSelectingPlayer ||
                    currentStoreState.isSelectingDeadGod ||
                    currentStoreState.isSelectingGod;

                if (hasActiveModal) return;

                // Vérifier si le joueur a un zombie actif pour les dégâts de fin de tour
                const currentPlayer = currentState.players.find(p => p.id === playerId);
                const activeZombieGod = currentPlayer?.gods.find(g => g.isZombie && !g.isDead);

                if (activeZombieGod) {
                    // Ouvrir le modal de dégâts zombie au lieu de finir le tour
                    startZombieDamage(activeZombieGod.card.id);
                    return;
                }

                endTurn();
                if (!isSoloMode) {
                    onAction?.({ type: 'end_turn', payload: {} });
                }
            }
        }, isSoloMode ? 1500 : 4500); // Délai plus court en solo
    };

    // Fonction pour afficher la carte jouée au centre du terrain
    const showPlayedCard = (card: import('@/types/cards').SpellCard) => {
        setDisplayedCard(card);
        // Cacher la carte après 4 secondes
        setTimeout(() => {
            setDisplayedCard(null);
        }, 4000);
    };

    // Wrapper pour playCard qui gère aussi la sélection de cartes et la distribution de soins
    const handlePlayCard = (cardId: string, targetGodId?: string, targetGodIds?: string[], lightningAction?: 'apply' | 'remove') => {
        const card = player.hand.find(c => c.id === cardId);
        // Récupérer l'élément sélectionné pour l'inclure dans les payloads
        const currentSelectedElement = selectedElement;

        if (card) {
            // Vérifier si la carte nécessite une sélection de cartes
            const selection = getCardSelectionRequired(card);
            if (selection) {
                // Jouer la carte d'abord, puis ouvrir le modal
                playCard(cardId, targetGodId, targetGodIds, lightningAction);
                onAction?.({ type: 'play_card', payload: { cardId, targetGodId, targetGodIds, lightningAction, selectedElement: currentSelectedElement } });
                setPendingCardForSelection(card);
                setPendingCardForOverlay(card); // Programmer l'affichage pour après le choix
                // La fin de tour sera appelée après la confirmation du modal
                return;
            }

            // Vérifier si la carte nécessite une distribution de soins
            const healDist = getHealDistributionRequired(card);
            if (healDist) {
                // Jouer la carte d'abord, puis ouvrir le modal
                playCard(cardId, targetGodId, targetGodIds, lightningAction);
                onAction?.({ type: 'play_card', payload: { cardId, targetGodId, targetGodIds, lightningAction, selectedElement: currentSelectedElement } });
                setPendingCardForHealDistribution(card);
                setPendingCardForOverlay(card); // Programmer l'affichage pour après le choix
                // La fin de tour sera appelée après la confirmation du modal
                return;
            }

            // Vérifier si la carte nécessite une sélection de cartes adverses (Nyx)
            const enemySel = getEnemyCardSelectionRequired(card);
            if (enemySel) {
                // Jouer la carte d'abord (applique les dégâts), puis ouvrir le modal
                playCard(cardId, targetGodId, targetGodIds, lightningAction);
                onAction?.({ type: 'play_card', payload: { cardId, targetGodId, targetGodIds, lightningAction, selectedElement: currentSelectedElement } });
                setPendingCardForEnemySelection(card);
                setPendingCardForOverlay(card); // Programmer l'affichage pour après le choix
                // La fin de tour sera appelée après la confirmation du modal
                return;
            }

            // Vérifier si la carte nécessite un choix optionnel (Perséphone Vision du Tartare)
            const optionalChoice = getOptionalChoiceRequired(card);
            if (optionalChoice) {
                // Jouer la carte d'abord (applique les dégâts de base), puis ouvrir le modal
                playCard(cardId, targetGodId, targetGodIds, lightningAction);
                onAction?.({ type: 'play_card', payload: { cardId, targetGodId, targetGodIds, lightningAction, selectedElement: currentSelectedElement } });

                // Récupérer les cibles pour les passer au modal
                // Priorité : targetGodIds passés > selectedTargetGods (sélection multi-cibles) > targetGodId unique
                let targetIds = targetGodIds && targetGodIds.length > 0
                    ? targetGodIds
                    : selectedTargetGods.length > 0
                        ? selectedTargetGods.map(g => g.card.id)
                        : (targetGodId ? [targetGodId] : []);

                startOptionalChoice(optionalChoice.title, optionalChoice.description, optionalChoice.effectId, targetIds);
                setPendingCardForOverlay(card);
                // La fin de tour sera appelée après la confirmation du modal
                return;
            }

            // Vérifier si la carte nécessite un choix de joueur (Zéphyr Bourrasque Chanceuse)
            const playerSel = getPlayerSelectionRequired(card);
            if (playerSel) {
                // Jouer la carte d'abord, puis ouvrir le modal
                playCard(cardId, targetGodId, targetGodIds, lightningAction);
                onAction?.({ type: 'play_card', payload: { cardId, targetGodId, targetGodIds, lightningAction, selectedElement: currentSelectedElement } });
                startPlayerSelection(playerSel.title, playerSel.effectId);
                setPendingCardForOverlay(card);
                // La fin de tour sera appelée après la confirmation du modal
                return;
            }

            // Vérifier si la carte nécessite une sélection de dieu mort (Perséphone Brûlure Rémanente)
            const deadGodSel = getDeadGodSelectionRequired(card);
            if (deadGodSel) {
                // Vérifier s'il y a des dieux morts
                const hasDeadGods = player.gods.some(g => g.isDead && !g.isZombie);
                if (hasDeadGods && player.deck.length > 0) {
                    // Jouer la carte d'abord, puis ouvrir le modal
                    playCard(cardId, targetGodId, targetGodIds, lightningAction);
                    onAction?.({ type: 'play_card', payload: { cardId, targetGodId, targetGodIds, lightningAction, selectedElement: currentSelectedElement } });
                    startDeadGodSelection(deadGodSel.title, deadGodSel.effectId);
                    setPendingCardForOverlay(card);
                    // La fin de tour sera appelée après la confirmation du modal
                    return;
                }
                // Si pas de dieux morts ou deck vide, jouer la carte sans effet
            }

            // Vérifier si la carte nécessite une sélection de dieu vivant (Zéphyr Vent de Face)
            const godSel = getGodSelectionRequired(card);
            if (godSel) {
                // Jouer la carte d'abord, puis ouvrir le modal
                playCard(cardId, targetGodId, targetGodIds, lightningAction);
                onAction?.({ type: 'play_card', payload: { cardId, targetGodId, targetGodIds, lightningAction, selectedElement: currentSelectedElement } });
                startGodSelection(godSel.title, godSel.effectId, godSel.targetType);
                setPendingCardForOverlay(card);
                // La fin de tour sera appelée après la confirmation du modal
                return;
            }

            // Afficher la carte jouée au centre immédiatement si pas de choix requis
            showPlayedCard(card);
        }

        playCard(cardId, targetGodId, targetGodIds, lightningAction);
        onAction?.({ type: 'play_card', payload: { cardId, targetGodId, targetGodIds, lightningAction, selectedElement: currentSelectedElement } });

        // Vérifier si la carte permet de rejouer (Hermès)
        const hasReplayAction = card?.effects.some(e =>
            e.type === 'custom' && e.customEffectId === 'replay_action'
        );

        // Ne pas finir le tour automatiquement si la carte permet de rejouer
        if (!hasReplayAction) {
            autoEndTurnMultiplayer();
        }
    };

    // Wrappers pour les confirmations de modals qui finissent le tour en multijoueur
    const handleConfirmCardSelection = (cards: typeof player.hand) => {
        confirmCardSelection(cards);
        if (pendingCardForOverlay) {
            showPlayedCard(pendingCardForOverlay);
            setPendingCardForOverlay(null);
        }
        autoEndTurnMultiplayer();
    };

    const handleConfirmHealDistribution = (distribution: { godId: string; amount: number }[]) => {
        confirmHealDistribution(distribution);
        if (pendingCardForOverlay) {
            showPlayedCard(pendingCardForOverlay);
            setPendingCardForOverlay(null);
        }
        autoEndTurnMultiplayer();
    };

    const handleConfirmEnemyCardSelection = (cardIds: string[]) => {
        confirmEnemyCardSelection(cardIds);
        if (pendingCardForOverlay) {
            showPlayedCard(pendingCardForOverlay);
            setPendingCardForOverlay(null);
        }
        autoEndTurnMultiplayer();
    };

    // Handler pour la confirmation du choix optionnel (Vision du Tartare)
    const handleConfirmOptionalChoice = (accepted: boolean) => {
        confirmOptionalChoice(accepted);
        if (pendingCardForOverlay) {
            showPlayedCard(pendingCardForOverlay);
            setPendingCardForOverlay(null);
        }
        autoEndTurnMultiplayer();
    };

    // Handler pour la confirmation du choix de joueur (Bourrasque Chanceuse)
    const handleConfirmPlayerSelection = (targetSelf: boolean) => {
        confirmPlayerSelection(targetSelf);
        if (pendingCardForOverlay) {
            showPlayedCard(pendingCardForOverlay);
            setPendingCardForOverlay(null);
        }
        autoEndTurnMultiplayer();
    };

    // Handler pour la confirmation de sélection de dieu mort (Brûlure Rémanente)
    const handleConfirmDeadGodSelection = (godId: string) => {
        confirmDeadGodSelection(godId);
        // Envoyer l'action au serveur pour synchroniser la résurrection zombie
        onAction?.({ type: 'zombie_resurrect', payload: { godId } });
        if (pendingCardForOverlay) {
            showPlayedCard(pendingCardForOverlay);
            setPendingCardForOverlay(null);
        }
        autoEndTurnMultiplayer();
    };

    // Handler pour les dégâts du zombie (fin de tour)
    const handleConfirmZombieDamage = (targetGodId: string | null) => {
        confirmZombieDamage(targetGodId);
        // Après le zombie damage, finir le tour directement (pas autoEndTurnMultiplayer pour éviter la boucle)
        if (!isSoloMode) {
            endTurn();
            onAction?.({ type: 'end_turn', payload: {} });
        }
    };

    // Handler pour la sélection de dieu vivant (Vent de Face - shuffle_god_cards)
    const handleConfirmGodSelection = (godId: string) => {
        confirmGodSelection(godId);
        // Envoyer l'action au serveur pour synchroniser le mélange de cartes
        onAction?.({ type: 'shuffle_god_cards', payload: { godId } });
        if (pendingCardForOverlay) {
            showPlayedCard(pendingCardForOverlay);
            setPendingCardForOverlay(null);
        }
        autoEndTurnMultiplayer();
    };

    // Trouver le zombie actif du joueur pour le modal de dégâts
    const activeZombie = player?.gods.find(g => g.isZombie && !g.isDead);
    const zombieForModal = zombieDamageGodId
        ? player?.gods.find(g => g.card.id === zombieDamageGodId)
        : null;

    const handleCardClick = (card: typeof selectedCard) => {
        if (!isPlayerTurn || !card) return;

        // Sélectionner la carte et ouvrir le modal de détails
        selectCard(card);
        setShowCardDetail(true);
        setWantsToPlay(false);
    };

    // Fermer le modal de détails
    const handleCloseCardDetail = () => {
        setShowCardDetail(false);
        selectCard(null); // Déselectionner la carte
    };

    // Jouer depuis le modal de détails
    const handlePlayFromDetail = () => {
        setShowCardDetail(false);
        setIsForcedDetail(false);
        handlePlaySelectedCard();
    };

    // Défausser depuis le modal de détails  
    const handleDiscardFromDetail = () => {
        if (selectedCard) {
            setShowCardDetail(false);
            setIsForcedDetail(false);
            handleDiscard(selectedCard.id);
        }
    };

    // Fonction pour jouer la carte sélectionnée depuis le bouton d'action
    const handlePlaySelectedCard = () => {
        if (!selectedCard || !isPlayerTurn || !canPlayCard(selectedCard)) return;

        const reqTargets = getRequiredTargetCount(selectedCard);
        const needsLightning = needsLightningChoice(selectedCard);

        // Marquer qu'on veut jouer la carte
        setWantsToPlay(true);

        // Si pas besoin de cible
        if (reqTargets === 0) {
            if (!needsLightning) {
                // Pas de cible, pas de foudre → jouer directement
                handlePlayCard(selectedCard.id);
                setWantsToPlay(false);
            }
            // Si foudre mais pas de cible → le choix foudre s'affichera via wantsToPlay
        } else {
            // Besoin de cibles → activer le mode ciblage
            startTargetSelection();
        }
    };

    // Fonction pour défausser la carte sélectionnée depuis le bouton d'action
    const handleDiscardSelectedCard = () => {
        if (!selectedCard || !isPlayerTurn) return;
        handleDiscard(selectedCard.id);
        selectCard(null);
        setWantsToPlay(false);
    };

    // Crée un ID unique pour distinguer les dieux des deux joueurs
    const getUniqueGodId = (godId: string, isEnemy: boolean) => {
        return isEnemy ? `opponent_${godId}` : `player_${godId}`;
    };

    // Extraire l'ID original et le propriétaire d'un ID unique
    const parseUniqueGodId = (uniqueId: string): { godId: string; isEnemy: boolean } => {
        if (uniqueId.startsWith('opponent_')) {
            return { godId: uniqueId.replace('opponent_', ''), isEnemy: true };
        }
        return { godId: uniqueId.replace('player_', ''), isEnemy: false };
    };

    const handleTargetSelect = (uniqueGodId: string) => {
        if (!selectedCard || !isSelectingTarget) return;

        const { godId, isEnemy } = parseUniqueGodId(uniqueGodId);
        const godsList = isEnemy ? opponent.gods : player.gods;
        const targetGod = godsList.find(g => g.card.id === godId);
        if (!targetGod) return;

        // Ajouter ou retirer cette cible à la liste
        toggleTargetGod(targetGod);
    };

    const handleConfirmPlay = () => {
        // On peut confirmer dès qu'on a au moins 1 cible
        if (selectedCard && selectedTargetGods.length > 0) {
            handlePlayCard(selectedCard.id);
        }
    };

    // Jouer automatiquement quand on a sélectionné toutes les cibles nécessaires
    // SAUF si la carte nécessite un choix de foudre, un choix d'élément, ou est un sort copié
    const handleSingleTargetSelect = (uniqueGodId: string) => {
        if (!selectedCard || !isSelectingTarget) return;

        // On ne force plus la validation automatique des cibles (demande utilisateur)
        // L'utilisateur doit vérifier le modal pour valider.
        handleTargetSelect(uniqueGodId);
    };

    const handleDiscard = (cardId: string) => {
        if (isPlayerTurn) {
            discardForEnergy(cardId);
            onAction?.({ type: 'discard', payload: { cardId } });
        }
    };

    // État pour le menu de choix d'une carte cachée
    const [selectedBlindCard, setSelectedBlindCard] = useState<typeof selectedCard>(null);

    // Cliquer sur une carte cachée → affiche le menu de choix
    const handleBlindCardClick = (card: typeof selectedCard) => {
        // Permettre le clic même après défausse (pour défausser une carte cachée)
        if (!card || !isPlayerTurn) return;
        setSelectedBlindCard(card);
    };

    // Choisir "Jouer" depuis le menu de carte cachée
    const handleBlindPlay = () => {
        if (!selectedBlindCard) return;

        // 1. RÉVÉLER la carte via le store (persiste le changement)
        const revealedCard = revealBlindCard(selectedBlindCard.id);
        setSelectedBlindCard(null);
        if (!revealedCard) return;

        // 2. Vérifier si le joueur a assez d'énergie
        if (player.energy < revealedCard.energyCost) {
            // Pas assez d'énergie → défausser simplement la carte (sans pénalité)
            discardBlindCard(revealedCard.id, false);
            showToast(`"${revealedCard.name}" révélée mais pas assez d'énergie (${revealedCard.energyCost}⚡ requis). Carte défaussée.`, 'warning');

            // Terminer le tour
            endTurn();
            onAction?.({ type: 'end_turn', payload: {} });
            return;
        }

        // 3. Vérifier si la carte peut être jouée (cible disponible)
        if (canPlayCard(revealedCard)) {
            // La carte peut être jouée, procéder normalement (ouvrir le modal de détails)
            setIsForcedDetail(true); // Empêcher l'annulation du modal de détails
            handleCardClick(revealedCard);
        } else {
            // La carte ne peut PAS être jouée (pas de cible valide)
            // Le joueur perd l'énergie de la carte et elle va à la défausse
            discardBlindCard(revealedCard.id, true);
            showToast(`"${revealedCard.name}" ne peut pas être jouée (pas de cible valide). Vous perdez ${revealedCard.energyCost} énergie.`, 'error');

            // Terminer le tour
            endTurn();
            onAction?.({ type: 'end_turn', payload: {} });
        }
    };

    // Choisir "Défausser" depuis le menu de carte cachée
    const handleBlindDiscardFromMenu = () => {
        if (!selectedBlindCard) return;

        if (hasDiscardedBlindThisTurn) {
            showToast("Vous ne pouvez défausser qu'une seule carte cachée par tour !", 'warning');
            setSelectedBlindCard(null);
            return;
        }

        // Défausser la carte pour de l'énergie (sans la révéler)
        discardForEnergy(selectedBlindCard.id);
        onAction?.({ type: 'discard', payload: { cardId: selectedBlindCard.id } });
        setHasDiscardedBlindThisTurn(true);
        setSelectedBlindCard(null);
    };

    // Annuler le menu de carte cachée
    const handleBlindCancel = () => {
        setSelectedBlindCard(null);
    };

    // Défausser une carte cachée pour de l'énergie
    // Règle : on ne peut défausser qu'UNE SEULE carte cachée à la fois
    const [hasDiscardedBlindThisTurn, setHasDiscardedBlindThisTurn] = useState(false);

    // Reset le flag au début de chaque tour
    useEffect(() => {
        if (isPlayerTurn) {
            setHasDiscardedBlindThisTurn(false);
        }
    }, [isPlayerTurn, gameState?.turnNumber]);

    // Chronomètre de tour - Reset et démarrage à chaque changement de tour
    // Utiliser des refs pour éviter les problèmes de dépendances
    const endTurnRef = useRef(endTurn);
    const onActionRef = useRef(onAction);
    const isPlayerTurnRef = useRef(isPlayerTurn);

    // Mettre à jour les refs quand les fonctions changent
    useEffect(() => {
        endTurnRef.current = endTurn;
        onActionRef.current = onAction;
        isPlayerTurnRef.current = isPlayerTurn;
    }, [endTurn, onAction, isPlayerTurn]);

    useEffect(() => {
        // Nettoyer le timer précédent
        if (turnTimerRef.current) {
            clearInterval(turnTimerRef.current);
            turnTimerRef.current = null;
        }

        // Reset le timer à 60 secondes au début de chaque tour
        setTurnTimer(TURN_TIME_LIMIT);

        // Ne pas démarrer le timer si le jeu n'est pas en cours
        // Le timer ne démarre qu'à partir du tour 2 (après la première carte jouée)
        if (gameState?.status !== 'playing' || !gameState?.turnNumber || gameState.turnNumber < 2) {
            return;
        }

        // Vérifier que les deux joueurs ont des dieux (jeu initialisé correctement)
        const bothPlayersReady = gameState.players.every(p => p.gods && p.gods.length > 0);
        if (!bothPlayersReady) {
            return;
        }

        // Délai de 500ms pour laisser la synchronisation se faire
        const startDelay = setTimeout(() => {
            // Démarrer le compte à rebours (pour les deux joueurs)
            turnTimerRef.current = setInterval(() => {
                setTurnTimer(prev => {
                    if (prev <= 1) {
                        // Temps écoulé
                        if (turnTimerRef.current) {
                            clearInterval(turnTimerRef.current);
                            turnTimerRef.current = null;
                        }
                        // Forcer la fin du tour UNIQUEMENT si c'est notre tour (via ref)
                        if (isPlayerTurnRef.current) {
                            endTurnRef.current();
                            onActionRef.current?.({ type: 'end_turn', payload: {} });
                        }
                        return TURN_TIME_LIMIT;
                    }
                    return prev - 1;
                });
            }, 1000);
        }, 500);

        return () => {
            clearTimeout(startDelay);
            if (turnTimerRef.current) {
                clearInterval(turnTimerRef.current);
                turnTimerRef.current = null;
            }
        };
    }, [gameState?.turnNumber, gameState?.status, gameState?.players]);

    // Démarrage automatique quand le nombre de cibles est atteint pour les cartes multi-cibles
    // DÉSACTIVÉ SUR DEMANDE UTILISATEUR :"le modal n'attend plus la validation des cibles pour lancer le sort"
    /*
    useEffect(() => {
        if (!isSelectingTarget || !selectedCard || requiredTargets <= 1) return;

        if (selectedTargetGods.length === requiredTargets) {
            // Petite pause pour que l'utilisateur voiye la sélection
            const timer = setTimeout(() => {
                // Si pas besoin de choix supplémentaire (foudre ou élément), on lance !
                if (!needsLightningChoice(selectedCard) && !needsElementChoiceLocal(selectedCard)) {
                    // On ne passe pas d'arguments explicites pour utiliser les cibles sélectionnées dans le store
                    handlePlayCard(selectedCard.id);
                } else {
                    // Si besoin de choix foudre/élément, on marque l'intention de jouer
                    // Ce qui fera apparaître les options foudre/élément (si applicable)
                    setWantsToPlay(true);
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [selectedTargetGods.length, isSelectingTarget, requiredTargets, selectedCard]);
    */

    const handleBlindDiscard = (cardId: string) => {
        if (!isPlayerTurn) return;

        if (hasDiscardedBlindThisTurn) {
            // On a déjà défaussé une carte cachée ce tour
            alert("⚠️ Vous ne pouvez défausser qu'une seule carte cachée par tour !");
            return;
        }

        // Défausser la carte pour de l'énergie
        discardForEnergy(cardId);
        onAction?.({ type: 'discard', payload: { cardId } });
        setHasDiscardedBlindThisTurn(true);
    };

    // Vérifier si une cible est déjà sélectionnée (avec ID unique)
    const isTargetSelected = (uniqueGodId: string) => {
        const { godId, isEnemy } = parseUniqueGodId(uniqueGodId);
        // Vérifier en comparant l'ID ET le contexte (ennemi ou allié)
        return selectedTargetGods.some(g => {
            const isEnemyGod = opponent.gods.some(og => og.card.id === g.card.id);
            return g.card.id === godId && isEnemyGod === isEnemy;
        });
    };

    return (
        <div className={`${styles.board} ${combatAnimations.isScreenShaking ? styles.screenShake : ''}`}>
            {/* #4 - Turn Transition Overlay */}
            {combatAnimations.showTurnTransition && (
                <TurnTransition
                    isPlayerTurn={combatAnimations.isPlayerTurnTransition}
                    onComplete={combatAnimations.hideTurnTransition}
                />
            )}

            {/* #2 - Damage Numbers Container */}
            <div className={styles.damageNumbersContainer}>
                {combatAnimations.damageNumbers.map(dn => (
                    <DamageNumber
                        key={dn.id}
                        id={dn.id}
                        amount={dn.amount}
                        type={dn.type}
                        x={dn.x}
                        y={dn.y}
                        onComplete={combatAnimations.removeDamageNumber}
                    />
                ))}
            </div>

            {/* Modal de Défausse */}
            {viewDiscard && (
                <div className={styles.modalOverlay} onClick={() => setViewDiscard(null)}>
                    <div className={styles.discardModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Défausse de {viewDiscard === 'player' ? player.name : opponent.name} ({viewDiscard === 'player' ? player.discard.length : opponent.discard.length} cartes)</h3>
                            <button className={styles.closeModalButton} onClick={() => setViewDiscard(null)}>✖</button>
                        </div>
                        <div className={styles.discardGrid}>
                            {(viewDiscard === 'player' ? player.discard : opponent.discard).map((card, index) => (
                                <div
                                    key={index}
                                    className={styles.discardCardWrapper}
                                    onClick={() => setPreviewCard(card)}
                                    title="Cliquez pour voir les détails"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <SpellCard card={card} isSelected={false} />
                                </div>
                            ))}
                            {(viewDiscard === 'player' ? player.discard : opponent.discard).length === 0 && (
                                <p className={styles.emptyMessage}>Aucune carte dans la défausse</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Menu de choix pour carte cachée */}
            {selectedBlindCard && (
                <div className={styles.modalOverlay} onClick={handleBlindCancel}>
                    <div className={styles.blindCardMenu} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.blindMenuTitle}>❓ Carte Cachée</h3>
                        <p className={styles.blindMenuSubtitle}>Que voulez-vous faire ?</p>
                        <div className={styles.blindMenuButtons}>
                            <button
                                className={styles.blindPlayButton}
                                onClick={handleBlindPlay}
                                disabled={player.hasDiscardedForEnergy}
                            >
                                🎲 Jouer à l&apos;aveugle
                                {player.hasDiscardedForEnergy && <span className={styles.disabledNote}> (déjà utilisé)</span>}
                            </button>
                            <button
                                className={styles.blindDiscardButton}
                                onClick={handleBlindDiscardFromMenu}
                                disabled={hasDiscardedBlindThisTurn}
                            >
                                🗑️ Défausser (+1⚡)
                                {hasDiscardedBlindThisTurn && <span className={styles.disabledNote}> (déjà fait)</span>}
                            </button>
                            <button
                                className={styles.blindCancelButton}
                                onClick={handleBlindCancel}
                            >
                                ❌ Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Zone adversaire */}
            <div className={styles.opponentZone}>
                {/* Indicateur de sélection de cartes adverses */}
                {isSelectingEnemyCards && (
                    <div className={styles.enemySelectionIndicator}>
                        <span>{enemyCardSelectionTitle}</span>
                        <span className={styles.selectionProgress}>
                            {selectedEnemyCardIds.length}/{enemyCardSelectionCount}
                        </span>
                        <button
                            className={styles.cancelSelectionBtn}
                            onClick={cancelEnemyCardSelection}
                        >
                            ❌ Annuler
                        </button>
                    </div>
                )}

                {/* Main de l'adversaire EN HAUT (dos de cartes ou face visible si effet Nyx) */}
                <div className={styles.opponentHand}>
                    {opponent.hand.map((card, index) => {
                        // On peut voir la carte si elle a été révélée à notre playerId
                        const canSeeCard = card.revealedToPlayerId === playerId;
                        const isCardSelected = selectedEnemyCardIds.includes(card.id);
                        const isSelectable = isSelectingEnemyCards;

                        return canSeeCard ? (
                            // Carte visible pour nous (effet Nyx actif sur l'adversaire)
                            <div
                                key={card.id}
                                className={`${styles.revealedEnemyCard} ${isSelectable ? styles.selectableCard : ''} ${isCardSelected ? styles.selectedEnemyCard : ''}`}
                                onClick={() => isSelectable && handleEnemyCardClick(card.id)}
                            >
                                <SpellCard card={card} isSelected={isCardSelected} />
                                <span className={styles.nyxRevealBadge}>👁️</span>
                                {isCardSelected && <span className={styles.selectedBadge}>✓</span>}
                            </div>
                        ) : (
                            // Dos de carte - maintenant cliquable si en mode sélection
                            <div
                                key={card.id || index}
                                className={`${styles.cardBack} ${isSelectable ? styles.selectableCard : ''} ${isCardSelected ? styles.selectedEnemyCard : ''}`}
                                onClick={() => isSelectable && handleEnemyCardClick(card.id)}
                            >
                                <span className={styles.cardBackIcon}>🎴</span>
                                <span className={styles.cardBackNumber}>{index + 1}</span>
                                {isCardSelected && <span className={styles.selectedBadge}>✓</span>}
                            </div>
                        );
                    })}
                    {opponent.hand.length === 0 && (
                        <span className={styles.emptyHandText}>Main vide</span>
                    )}
                </div>

                {/* Barre d'info adversaire - ENTRE la main et les dieux */}
                <div className={styles.playerInfo}>
                    <span className={styles.playerName}>{opponent.name}</span>
                    <div className={styles.energy}>
                        <span className={styles.energyIcon}>⚡</span>
                        <span className={styles.energyValue}>{opponent.energy}</span>
                    </div>
                    <span className={styles.deckCount}><Image src="/deck_icon.png" alt="Deck" width={18} height={18} className={styles.deckIcon} /> {opponent.deck.length}</span>
                    {opponent.fatigueCounter > 0 && (
                        <span className={styles.fatigueCount} title="Dégâts de la prochaine fatigue">💀 {opponent.fatigueCounter + 1}</span>
                    )}
                    <span className={styles.handCount}>✋ {opponent.hand.length}</span>
                    <button
                        className={styles.discardButton}
                        onClick={() => setViewDiscard('opponent')}
                        title="Voir la défausse adverse"
                    >
                        🗑️ {opponent.discard.length}
                    </button>
                </div>

                {/* Dieux adversaires EN BAS de leur zone */}
                <div className={styles.godsRow}>
                    {opponent.gods.map((god) => {
                        // Vérifier si le sort a réellement besoin de cibler un ennemi
                        const needsEnemyTarget = selectedCard?.effects.some(e =>
                            e.target === 'enemy_god' ||
                            e.target === 'any_god' ||
                            (e.type === 'custom' && e.customEffectId === 'vision_tartare')
                        );

                        // Vérifier si ce dieu est une cible valide (en tenant compte de la provocation et du multi-ciblage)
                        const validTargets = getValidEnemyTargets(isMultiTarget);
                        const isValidTarget = needsEnemyTarget && validTargets.some(t => t.card.id === god.card.id);

                        // Vérifier si c'est une cible obligatoire (provocateur)
                        const isRequiredTarget = requiredEnemyTargets.some(t => t.card.id === god.card.id);

                        // Sélection de dieu (Zéphyr Vent de Face) - dieu ennemi sélectionnable si mode actif et targetType permet
                        const isGodSelectableForZephyr = isSelectingGod && !god.isDead &&
                            (godSelectionTargetType === 'any' || godSelectionTargetType === 'enemy');

                        // Sélection de cible pour dégâts Zombie
                        const isGodSelectableForZombie = isShowingZombieDamage && !god.isDead;
                        const isZombieTarget = zombieDamageTargetId === god.card.id;

                        const uniqueId = getUniqueGodId(god.card.id, true);
                        return (
                            <div key={uniqueId} className={styles.godContainer}>
                                <GodCard
                                    god={god}
                                    isEnemy
                                    isSelectable={(isSelectingTarget && isValidTarget) || isGodSelectableForZephyr || isGodSelectableForZombie}
                                    isSelected={isTargetSelected(uniqueId) || isZombieTarget}
                                    isRequired={isSelectingTarget && isRequiredTarget && isMultiTarget}
                                    isShaking={combatAnimations.shakingGods.has(god.card.id)}
                                    shakeIntensity={combatAnimations.shakingGods.get(god.card.id) || 'normal'}
                                    showStatusAura={combatAnimations.statusAuraGods.get(god.card.id) || null}
                                    onClick={() => {
                                        if (isGodSelectableForZombie) {
                                            handleZombieTargetClick(god.card.id);
                                        } else if (isGodSelectableForZephyr) {
                                            handleConfirmGodSelection(god.card.id);
                                        } else {
                                            handleSingleTargetSelect(uniqueId);
                                        }
                                    }}
                                />
                                {isZombieTarget && (
                                    <span className={styles.targetBadge}>🎯</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Overlay de la carte jouée au centre du terrain */}
            {displayedCard && (
                <div className={styles.playedCardOverlay}>
                    <div className={styles.playedCardContainer}>
                        <SpellCard card={displayedCard} canPlay={true} />
                    </div>
                </div>
            )}

            {/* Zone centrale - Informations de jeu */}
            <div className={styles.centerZone}>
                {/* Indicateur de sélection de dieu (Zéphyr Vent de Face) */}
                {isSelectingGod && (
                    <div className={styles.godSelectionIndicator}>
                        <span>💨 {godSelectionTitle}</span>
                        <button
                            className={styles.cancelSelectionBtn}
                            onClick={cancelGodSelection}
                        >
                            ❌ Annuler
                        </button>
                    </div>
                )}

                {/* Indicateur de sélection de dieu mort (Perséphone Brûlure Rémanente) */}
                {isSelectingDeadGod && (
                    <div className={`${styles.godSelectionIndicator} ${styles.deadGodIndicator}`}>
                        <span>💀 {deadGodSelectionTitle}</span>
                        <button
                            className={styles.cancelSelectionBtn}
                            onClick={cancelDeadGodSelection}
                        >
                            ❌ Annuler
                        </button>
                    </div>
                )}

                {/* Indicateur de dégâts Zombie */}
                {isShowingZombieDamage && (
                    <div className={styles.zombieDamageIndicator}>
                        <span className={styles.zombieTitle}>🧟 Dégâts Zombie</span>
                        <span className={styles.zombieInstruction}>
                            {zombieDamageTargetId
                                ? "Cible sélectionnée : prêt à attaquer"
                                : "Choisissez une cible ennemie pour infliger 10 dégâts"}
                        </span>
                        <div className={styles.zombieButtons}>
                            <button
                                className={styles.zombieSkipBtn}
                                onClick={() => confirmZombieDamage(null)}
                            >
                                ⏭️ Passer
                            </button>
                            <button
                                className={styles.zombieConfirmBtn}
                                onClick={handleConfirmDirectZombieDamage}
                                disabled={!zombieDamageTargetId}
                            >
                                ⚔️ Attaquer
                            </button>
                        </div>
                    </div>
                )}

                {/* Indicateur de distribution de soins (Fertilisation) */}
                {isDistributingHeal && (
                    <div className={styles.healDistributionIndicator}>
                        <span className={styles.healTitle}>🌿 Fertilisation</span>
                        <span className={styles.healProgress}>
                            💚 Soin conféré {totalHealDistributed}/{healDistributionTotal}
                        </span>
                        <div className={styles.healButtons}>
                            <button
                                className={styles.resetHealBtn}
                                onClick={handleResetHealDistribution}
                                disabled={totalHealDistributed === 0}
                            >
                                🔄 Réinitialiser
                            </button>
                            <button
                                className={styles.confirmHealBtn}
                                onClick={handleConfirmDirectHealDistribution}
                                disabled={totalHealDistributed === 0}
                            >
                                ✅ Confirmer
                            </button>
                        </div>
                    </div>
                )}

                {/* Sélection de cartes de la défausse (Repos mérité, Prophétie, etc.) */}
                {isSelectingCards && (
                    <div className={styles.discardSelectionZone}>
                        <div className={styles.discardSelectionHeader}>
                            <span className={styles.discardSelectionTitle}>{cardSelectionTitle}</span>
                            <span className={styles.discardSelectionProgress}>
                                {selectedDiscardCardIds.length}/{cardSelectionCount}
                            </span>
                        </div>

                        <div className={styles.discardCardsScroll}>
                            {getCardsForSelection().map(card => (
                                <div
                                    key={card.id}
                                    className={`${styles.discardSelectableCard} ${selectedDiscardCardIds.includes(card.id) ? styles.discardCardSelected : ''}`}
                                    onClick={() => handleDiscardCardSelect(card.id)}
                                >
                                    <SpellCard card={card} isSelected={selectedDiscardCardIds.includes(card.id)} isSmall />
                                    {selectedDiscardCardIds.includes(card.id) && (
                                        <span className={styles.discardSelectedBadge}>✓</span>
                                    )}
                                </div>
                            ))}
                            {getCardsForSelection().length === 0 && (
                                <span className={styles.emptyDiscardText}>Aucune carte disponible</span>
                            )}
                        </div>

                        <div className={styles.discardSelectionButtons}>
                            {pendingCardSelectionEffect !== 'put_cards_bottom' && (
                                <button
                                    className={styles.discardCancelBtn}
                                    onClick={cancelCardSelection}
                                >
                                    ❌ Annuler
                                </button>
                            )}
                            <button
                                className={styles.discardConfirmBtn}
                                onClick={handleConfirmDirectCardSelection}
                                disabled={selectedDiscardCardIds.length !== cardSelectionCount}
                            >
                                ✅ Confirmer
                            </button>
                        </div>
                    </div>
                )}

                <div className={styles.turnInfo}>
                    <span className={styles.turnNumber}>
                        Tour {gameState.turnNumber}{gameState.maxTurns && !gameState.isOnlineGame ? `/${gameState.maxTurns}` : ''}
                    </span>
                    <div className={styles.turnRow}>
                        <span className={`${styles.turnIndicator} ${isPlayerTurn ? styles.myTurn : styles.opponentTurn} `}>
                            {isPlayerTurn ? '🎮 Votre tour' : '⏳ Tour adverse'}
                        </span>
                        {/* Chronomètre de tour - 4 niveaux de couleur */}
                        {gameState.status === 'playing' && (
                            <span className={`${styles.turnTimer} ${turnTimer <= 15 ? styles.timerCritical : turnTimer <= 30 ? styles.timerDanger : turnTimer <= 45 ? styles.timerWarning : ''}`}>
                                ⏱️ {turnTimer}s
                            </span>
                        )}
                        {/* Avertissement AFK (mode online uniquement) - affiché au 4ème tour avant disqualification au 5ème */}
                        {gameState.isOnlineGame && player.afkTurns === 4 && isPlayerTurn && (
                            <span className={styles.afkWarning}>
                                ⚠️ Jouez ou disqualification!
                            </span>
                        )}
                        {isPlayerTurn && gameState.status === 'playing' && !isSelectingTarget && (
                            <button
                                className={styles.endTurnButton}
                                onClick={() => {
                                    endTurn();
                                    onAction?.({ type: 'end_turn', payload: {} });
                                }}
                            >
                                Fin ➡️
                            </button>
                        )}

                        {/* Bouton Abandonner (disponible tout le temps si la partie est en cours) */}
                        {gameState.status === 'playing' && (
                            <button
                                className={styles.surrenderButton}
                                onClick={() => {
                                    if (window.confirm('Êtes-vous sûr de vouloir abandonner la partie ? 🏳️')) {
                                        surrender();
                                        // Pour le mode en ligne, envoyer l'événement game_over
                                        if (onAction) {
                                            const opponentId = gameState.players.find(p => p.id !== playerId)?.id;
                                            onAction({ type: 'game_over', payload: { winnerId: opponentId } });
                                        }
                                    }
                                }}
                                title="Abandonner la partie"
                            >
                                🏳️
                            </button>
                        )}
                    </div>
                </div>

                {isSelectingTarget && (
                    <div className={styles.targetPrompt}>
                        <p>
                            Sélectionnez {requiredTargets > 1 ? `jusqu'à ${requiredTargets} cibles` : 'une cible'} pour <strong>{selectedCard?.name}</strong>
                        </p >
                        {requiredTargets > 1 && (
                            <p className={styles.targetCounter}>
                                {selectedTargetGods.length} / {maxPossibleTargets} cibles sélectionnées
                                {maxPossibleTargets < requiredTargets && ` (${maxPossibleTargets} disponibles)`}
                            </p>
                        )
                        }
                        {
                            requiredEnemyTargets.length > 0 && isMultiTarget && !allRequiredTargetsIncluded && (
                                <p className={styles.requiredWarning}>
                                    ⚠️ Vous devez inclure le(s) provocateur(s) dans vos cibles !
                                </p>
                            )
                        }
                        {
                            canConfirm && selectedCard && needsLightningChoice(selectedCard) && (
                                <div className={styles.lightningChoiceCompact}>
                                    <span className={styles.lightningLabel}>⚡ Marque de foudre :</span>
                                    <button
                                        className={styles.lightningApplyBtn}
                                        onClick={() => {
                                            setLightningAction('apply');
                                            handlePlayCard(selectedCard.id, undefined, undefined, 'apply');
                                            setWantsToPlay(false);
                                        }}
                                    >
                                        ⚡ Appliquer
                                    </button>
                                    <button
                                        className={styles.lightningRemoveBtn}
                                        onClick={() => {
                                            setLightningAction('remove');
                                            handlePlayCard(selectedCard.id, undefined, undefined, 'remove');
                                            setWantsToPlay(false);
                                        }}
                                    >
                                        💥 Retirer
                                    </button>
                                </div>
                            )
                        }
                        {/* Choix d'élément pour Coup Critique d'Artémis */}
                        {
                            canConfirm && selectedCard && needsElementChoiceLocal(selectedCard) && (
                                <div className={styles.elementChoice}>
                                    <p>🎯 Choisissez l'élément de la faiblesse à appliquer :</p>
                                    <div className={styles.elementButtons}>
                                        {ALL_ELEMENTS.map(element => (
                                            <button
                                                key={element}
                                                className={styles.elementButton}
                                                onClick={() => {
                                                    setSelectedElement(element);
                                                    // Passer la cible sélectionnée
                                                    const targetId = selectedTargetGods[0]?.card.id;
                                                    handlePlayCard(selectedCard.id, targetId);
                                                }}
                                            >
                                                {ELEMENT_SYMBOLS[element]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        }

                        {/* Bouton confirmer - s'affiche si cibles OK et pas de choix spécial en attente */}
                        {
                            canConfirm && selectedCard && !needsLightningChoice(selectedCard) && !needsElementChoiceLocal(selectedCard) && (
                                <button className={styles.confirmButton} onClick={handleConfirmPlay}>
                                    ✅ Confirmer ({selectedTargetGods.length} cible{selectedTargetGods.length > 1 ? 's' : ''})
                                </button>
                            )
                        }
                        <button className={styles.cancelButton} onClick={() => selectCard(null)}>
                            ❌ Annuler
                        </button>
                    </div >
                )}

                {/* Choix de foudre pour les cartes sans ciblage (ex: Foudroiement all_enemies) */}
                {
                    selectedCard && needsLightningChoice(selectedCard) && wantsToPlay && !isSelectingTarget && (
                        <div className={styles.targetPrompt}>
                            <p>⚡ <strong>{selectedCard.name}</strong> - Que voulez-vous faire ?</p>
                            <div className={styles.lightningButtons}>
                                <button
                                    className={styles.lightningApply}
                                    onClick={() => {
                                        setLightningAction('apply');
                                        handlePlayCard(selectedCard.id, undefined, undefined, 'apply');
                                        setWantsToPlay(false);
                                    }}
                                >
                                    ⚡ Appliquer des marques
                                </button>
                                <button
                                    className={styles.lightningRemove}
                                    onClick={() => {
                                        setLightningAction('remove');
                                        handlePlayCard(selectedCard.id, undefined, undefined, 'remove');
                                        setWantsToPlay(false);
                                    }}
                                >
                                    💥 Retirer & infliger dégâts
                                </button>
                            </div>
                            <button className={styles.cancelButton} onClick={() => { selectCard(null); setWantsToPlay(false); }}>
                                ❌ Annuler
                            </button>
                        </div>
                    )
                }

                {
                    gameState.status === 'finished' && (
                        <div className={styles.gameOver}>
                            <h2>Partie terminée !</h2>
                            <p>
                                {gameState.winReason === 'draw'
                                    ? '🤝 Match Nul !'
                                    : gameState.winnerId === playerId
                                        ? '🏆 Victoire !'
                                        : '💀 Défaite...'}
                            </p>
                            {gameState.winReason === 'turn_limit' && gameState.winnerId && (
                                <p className={styles.winReasonText}>Limite de {gameState.maxTurns} tours atteinte</p>
                            )}
                            {gameState.winReason === 'draw' && (
                                <p className={styles.winReasonText}>Égalité parfaite après {gameState.maxTurns} tours</p>
                            )}
                        </div>
                    )
                }
            </div >

            {/* Zone joueur */}
            < div className={styles.playerZone} >
                <div className={styles.godsRow}>
                    {player.gods.map((god) => {
                        // Déterminer si l'allié est une cible valide
                        const needsAllyTarget = selectedCard?.effects.some(e => e.target === 'ally_god' || e.target === 'any_god');
                        const needsDeadAllyTarget = selectedCard?.effects.some(e => e.target === 'dead_ally_god');
                        const needsSelfTarget = selectedCard?.effects.some(e => e.target === 'self');

                        let isValidAllyTarget = false;
                        if (needsAllyTarget && !god.isDead) {
                            isValidAllyTarget = true;
                        } else if (needsDeadAllyTarget && god.isDead) {
                            isValidAllyTarget = true;
                        } else if (needsSelfTarget && god.card.id === selectedCard?.godId && !god.isDead) {
                            isValidAllyTarget = true;
                        }

                        // Sélection de dieu (Zéphyr Vent de Face) - dieu allié sélectionnable si mode actif et targetType permet
                        const isGodSelectableForZephyr = isSelectingGod && !god.isDead &&
                            (godSelectionTargetType === 'any' || godSelectionTargetType === 'ally');

                        // Distribution de soins (Fertilisation) - dieu allié sélectionnable si mode actif et pas mort
                        const isGodSelectableForHeal = isDistributingHeal && !god.isDead && totalHealDistributed < healDistributionTotal;
                        const healAssigned = healDistribution[god.card.id] || 0;

                        // Sélection de dieu mort (Perséphone Brûlure Rémanente) - dieu mort non-zombie sélectionnable
                        const isDeadGodSelectable = isSelectingDeadGod && god.isDead && !god.isZombie;

                        const uniqueId = getUniqueGodId(god.card.id, false);
                        return (
                            <div key={uniqueId} className={styles.godWithHealBadge}>
                                <GodCard
                                    god={god}
                                    isSelectable={(isSelectingTarget && isValidAllyTarget) || isGodSelectableForZephyr || isGodSelectableForHeal || isDeadGodSelectable}
                                    isSelected={isTargetSelected(uniqueId)}
                                    isShaking={combatAnimations.shakingGods.has(god.card.id)}
                                    shakeIntensity={combatAnimations.shakingGods.get(god.card.id) || 'normal'}
                                    showStatusAura={combatAnimations.statusAuraGods.get(god.card.id) || null}
                                    onClick={() => {
                                        if (isGodSelectableForHeal) {
                                            handleHealGodClick(god.card.id);
                                        } else if (isGodSelectableForZephyr) {
                                            handleConfirmGodSelection(god.card.id);
                                        } else if (isDeadGodSelectable) {
                                            handleDeadGodClick(god.card.id);
                                        } else {
                                            handleSingleTargetSelect(uniqueId);
                                        }
                                    }}
                                />
                                {/* Badge de soins assignés */}
                                {isDistributingHeal && healAssigned > 0 && (
                                    <span className={styles.healAssignedBadge}>+{healAssigned}💚</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className={styles.playerInfo}>
                    <span className={styles.playerName}>{player.name}</span>
                    <div className={styles.energy}>
                        <span className={styles.energyIcon}>⚡</span>
                        <span className={styles.energyValue}>{player.energy}</span>
                    </div>
                    <span className={styles.deckCount}><Image src="/deck_icon.png" alt="Deck" width={18} height={18} className={styles.deckIcon} /> {player.deck.length}</span>
                    {player.fatigueCounter > 0 && (
                        <span className={styles.fatigueCount} title="Dégâts de la prochaine fatigue">💀 {player.fatigueCounter + 1}</span>
                    )}
                    <button
                        className={styles.discardButton}
                        onClick={() => setViewDiscard('player')}
                        title="Voir ma défausse"
                    >
                        🗑️ {player.discard.length}
                    </button>
                </div>

                {/* Main du joueur */}
                <div className={styles.handContainer}>
                    <div className={styles.hand}>
                        {player.hand.map((card, index) => (
                            card.isHiddenFromOwner ? (
                                // Carte cachée par effet Nyx - le joueur ne la voit pas
                                <div
                                    key={card.id}
                                    className={`${styles.cardBack} ${styles.blindCard} ${isPlayerTurn ? styles.blindClickable : ''}`}
                                    onClick={() => isPlayerTurn && handleBlindCardClick(card)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        if (isPlayerTurn) handleBlindDiscard(card.id);
                                    }}
                                    title="Carte inconnue (effet Nyx) - Clic gauche = Menu • Clic droit = Défausser"
                                >
                                    <span className={styles.cardBackIcon}>❓</span>
                                    <span className={styles.cardBackNumber}>{index + 1}</span>
                                    {isPlayerTurn && (
                                        <span className={styles.blindPlayable}>⚠️</span>
                                    )}
                                </div>
                            ) : (
                                <SpellCard
                                    key={card.id}
                                    card={card}
                                    canPlay={isPlayerTurn && canPlayCard(card)}
                                    isSelected={selectedCard?.id === card.id}
                                    onClick={() => handleCardClick(card)}
                                    onRightClick={() => handleDiscard(card.id)}
                                />
                            )
                        ))}
                    </div>
                </div>
            </div >

            {/* Barre d'action mobile - s'affiche quand une carte est sélectionnée (mais pas si le modal de détail est ouvert) */}
            {
                selectedCard && isPlayerTurn && !isSelectingTarget && !showCardDetail && (
                    <div className={styles.mobileActionBar}>
                        <div className={styles.selectedCardInfo}>
                            <span className={styles.selectedCardName}>{selectedCard.name}</span>
                            <span className={styles.selectedCardCost}>
                                {selectedCard.energyCost > 0 ? `${selectedCard.energyCost}⚡` : `+${selectedCard.energyGain}⚡`}
                            </span>
                        </div>
                        <div className={styles.actionButtons}>
                            <button
                                className={styles.discardButton}
                                onClick={handleDiscardSelectedCard}
                            >
                                🗑️ Défausser (+1⚡)
                            </button>
                            <button
                                className={`${styles.playButton} ${!canPlayCard(selectedCard) ? styles.disabled : ''}`}
                                onClick={handlePlaySelectedCard}
                                disabled={!canPlayCard(selectedCard)}
                            >
                                ▶️ Jouer
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Modal de sélection de cartes - DÉSACTIVÉ: sélection directe dans la zone centrale */}
            {/* Anciennement: CardSelectionModal */}

            {/* Modal de distribution de soins - DÉSACTIVÉ: sélection directe sur les dieux alliés */}
            {/* Anciennement: HealDistributionModal */}

            {/* Modal de sélection de cartes adverses (Nyx) - DÉSACTIVÉ: sélection directe sur les dos de carte */}
            {/* Anciennement: CardSelectionModal avec blindMode={true} */}

            {/* Modal de détail de carte */}
            <CardDetailModal
                card={selectedCard}
                isOpen={showCardDetail}
                onClose={isForcedDetail ? undefined : handleCloseCardDetail}
                onPlay={handlePlayFromDetail}
                onDiscard={handleDiscardFromDetail}
                canPlay={selectedCard ? canPlayCard(selectedCard) : false}
                canDiscard={isPlayerTurn && !player.hasPlayedCard && !isForcedDetail}
            />

            {/* Modal de détail pour la preview de défausse (lecture seule) */}
            <CardDetailModal
                card={previewCard}
                isOpen={!!previewCard}
                onClose={() => setPreviewCard(null)}
                onPlay={() => { }}
                onDiscard={() => { }}
                canPlay={false}
                canDiscard={false}
                readOnly={true}
            />

            {/* Modal de choix optionnel (Perséphone Vision du Tartare) */}
            <OptionalChoiceModal
                isOpen={isShowingOptionalChoice}
                title={optionalChoiceTitle}
                description={optionalChoiceDescription}
                onAccept={() => handleConfirmOptionalChoice(true)}
                onDecline={() => handleConfirmOptionalChoice(false)}
            />

            {/* Modal de sélection de joueur (Zéphyr Bourrasque Chanceuse) */}
            <PlayerSelectionModal
                isOpen={isSelectingPlayer}
                title={playerSelectionTitle}
                onSelectSelf={() => handleConfirmPlayerSelection(true)}
                onSelectOpponent={() => handleConfirmPlayerSelection(false)}
                onCancel={cancelPlayerSelection}
            />

            {/* Modal de sélection de dieu mort (Perséphone Brûlure Rémanente) - DÉSACTIVÉ: sélection directe sur le terrain */}
            {/* Anciennement: DeadGodSelectionModal */}

            {/* Modal de dégâts zombie (fin de tour) - DÉSACTIVÉ: sélection directe sur le terrain */}
            {/* Anciennement: ZombieDamageModal */}

            {/* Modal de sélection de dieu vivant (Zéphyr Vent de Face) - DÉSACTIVÉ: sélection directe sur le terrain */}
            {/* Anciennement: GodSelectionModal */}

            {/* Toast de notification */}
            {
                toast && (
                    <div className={`${styles.toast} ${styles[`toast${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}`]}`}>
                        <span className={styles.toastIcon}>
                            {toast.type === 'warning' && '⚠️'}
                            {toast.type === 'error' && '❌'}
                            {toast.type === 'info' && 'ℹ️'}
                        </span>
                        <span className={styles.toastMessage}>{toast.message}</span>
                        <button className={styles.toastClose} onClick={() => setToast(null)}>✕</button>
                    </div>
                )
            }
        </div >
    );
}
