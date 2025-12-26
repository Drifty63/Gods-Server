'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState, Element } from '@/types/cards';

interface DamageNumberData {
    id: string;
    amount: number;
    type: 'damage' | 'heal' | 'critical';
    x: number;
    y: number;
}

// #1 - Shake data pour chaque dieu
interface GodShakeData {
    godId: string;
    intensity: 'light' | 'normal';
}

// #4 - Particule data pour chaque dieu
interface GodParticleData {
    godId: string;
    element: Element;
}

// #6 - Types de statut avec aura
export type StatusAuraType = 'shield' | 'poison' | 'stun' | 'provocation' | null;

interface UseCombatAnimationsReturn {
    // #1 God shake (remplace screen shake)
    shakingGods: Map<string, 'light' | 'normal'>;
    triggerGodShake: (godId: string, intensity?: 'light' | 'normal') => void;

    // #6 Status auras
    statusAuraGods: Map<string, StatusAuraType>;
    triggerStatusAura: (godId: string, statusType: StatusAuraType) => void;

    // #2 Damage numbers
    damageNumbers: DamageNumberData[];
    addDamageNumber: (godId: string, amount: number, type: 'damage' | 'heal' | 'critical') => void;
    removeDamageNumber: (id: string) => void;

    // Turn transition
    showTurnTransition: boolean;
    isPlayerTurnTransition: boolean;
    triggerTurnTransition: (isPlayerTurn: boolean) => void;
    hideTurnTransition: () => void;
}

/**
 * Hook personnalisé pour gérer toutes les animations de combat
 * Inclut: god shake (#1), damage numbers (#2), turn transition (#4), element particles (#4), status auras (#6)
 */
export function useCombatAnimations(): UseCombatAnimationsReturn {
    // #1 - God Shake state (par dieu)
    const [shakingGods, setShakingGods] = useState<Map<string, 'light' | 'normal'>>(new Map());

    // #6 - Status auras (par dieu)
    const [statusAuraGods, setStatusAuraGods] = useState<Map<string, StatusAuraType>>(new Map());

    // #2 - Damage Numbers state
    const [damageNumbers, setDamageNumbers] = useState<DamageNumberData[]>([]);
    const damageIdCounter = useRef(0);

    // #4 - Turn Transition state
    const [showTurnTransition, setShowTurnTransition] = useState(false);
    const [isPlayerTurnTransition, setIsPlayerTurnTransition] = useState(true);

    // #1 - Trigger god shake
    const triggerGodShake = useCallback((godId: string, intensity: 'light' | 'normal' = 'normal') => {
        setShakingGods(prev => {
            const newMap = new Map(prev);
            newMap.set(godId, intensity);
            return newMap;
        });

        // Retirer le shake après l'animation
        const duration = intensity === 'light' ? 300 : 500;
        setTimeout(() => {
            setShakingGods(prev => {
                const newMap = new Map(prev);
                newMap.delete(godId);
                return newMap;
            });
        }, duration);
    }, []);

    // #6 - Trigger status aura
    const triggerStatusAura = useCallback((godId: string, statusType: StatusAuraType) => {
        if (!statusType) return;

        setStatusAuraGods(prev => {
            const newMap = new Map(prev);
            newMap.set(godId, statusType);
            return newMap;
        });

        // Durée de l'aura selon le type (stun = 3s, autres = 2s)
        const duration = statusType === 'stun' ? 3000 : 2000;
        setTimeout(() => {
            setStatusAuraGods(prev => {
                const newMap = new Map(prev);
                newMap.delete(godId);
                return newMap;
            });
        }, duration);
    }, []);

    // #2 - Add damage number
    const addDamageNumber = useCallback((godId: string, amount: number, type: 'damage' | 'heal' | 'critical') => {
        const id = `dmg-${damageIdCounter.current++}`;

        // Trouver la position du dieu
        const godElement = document.querySelector(`[data-god-id="${godId}"]`);
        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;

        if (godElement) {
            const rect = godElement.getBoundingClientRect();
            x = rect.left + rect.width / 2;
            y = rect.top + rect.height / 3; // Un peu au-dessus du centre
        }

        const newDamageNumber: DamageNumberData = {
            id,
            amount,
            type,
            x,
            y,
        };

        setDamageNumbers(prev => [...prev, newDamageNumber]);
    }, []);

    // #2 - Remove damage number
    const removeDamageNumber = useCallback((id: string) => {
        setDamageNumbers(prev => prev.filter(dn => dn.id !== id));
    }, []);

    // #4 - Trigger turn transition
    const triggerTurnTransition = useCallback((isPlayerTurn: boolean) => {
        setIsPlayerTurnTransition(isPlayerTurn);
        setShowTurnTransition(true);
    }, []);

    // #4 - Hide turn transition
    const hideTurnTransition = useCallback(() => {
        setShowTurnTransition(false);
    }, []);

    return {
        shakingGods,
        triggerGodShake,

        // Status auras
        statusAuraGods,
        triggerStatusAura,

        // Damage numbers
        damageNumbers,
        addDamageNumber,
        removeDamageNumber,

        // Turn transition
        showTurnTransition,
        isPlayerTurnTransition,
        triggerTurnTransition,
        hideTurnTransition,
    };
}

/**
 * Hook pour détecter les changements dans le gameState et déclencher les animations
 */
export function useGameStateAnimations(
    gameState: GameState | null,
    playerId: string,
    animations: UseCombatAnimationsReturn
) {
    const previousStateRef = useRef<GameState | null>(null);
    const previousTurnRef = useRef<string | null>(null);

    useEffect(() => {
        if (!gameState) return;

        const previousState = previousStateRef.current;

        // Détecter changement de tour pour la transition (#4)
        if (previousTurnRef.current && previousTurnRef.current !== gameState.currentPlayerId) {
            const isPlayerTurn = gameState.currentPlayerId === playerId;
            animations.triggerTurnTransition(isPlayerTurn);
        }
        previousTurnRef.current = gameState.currentPlayerId;

        // Détecter les dégâts pour les damage numbers, god shake et particules (#1, #2, #4)
        if (previousState) {
            // Comparer les HP et statuts de chaque dieu
            for (const player of gameState.players) {
                const previousPlayer = previousState.players.find(p => p.id === player.id);
                if (!previousPlayer) continue;

                for (const god of player.gods) {
                    const previousGod = previousPlayer.gods.find(g => g.card.id === god.card.id);
                    if (!previousGod) continue;

                    const hpDiff = god.currentHealth - previousGod.currentHealth;

                    if (hpDiff !== 0) {
                        if (hpDiff < 0) {
                            // Dégâts reçus
                            const amount = Math.abs(hpDiff);
                            const type = amount >= 5 ? 'critical' : 'damage';
                            animations.addDamageNumber(god.card.id, amount, type);

                            // #1 - Shake sur la carte du dieu qui reçoit les dégâts
                            animations.triggerGodShake(god.card.id, amount >= 4 ? 'normal' : 'light');
                        } else {
                            // Soins reçus
                            animations.addDamageNumber(god.card.id, hpDiff, 'heal');
                        }
                    }

                    // #6 - Détecter les nouveaux statuts pour les auras
                    const previousStatuses = previousGod.statusEffects.map(s => s.type);
                    for (const status of god.statusEffects) {
                        const wasPresent = previousStatuses.includes(status.type);
                        const previousStatus = previousGod.statusEffects.find(s => s.type === status.type);

                        // Nouveau statut ou stacks augmentés
                        if (!wasPresent || (previousStatus && status.stacks > previousStatus.stacks)) {
                            // Vérifier si c'est un type de statut avec aura
                            if (status.type === 'shield' || status.type === 'poison' ||
                                status.type === 'stun' || status.type === 'provocation') {
                                animations.triggerStatusAura(god.card.id, status.type as StatusAuraType);
                            }
                        }
                    }
                }
            }
        }

        // Stocker l'état actuel pour la prochaine comparaison
        previousStateRef.current = JSON.parse(JSON.stringify(gameState));
    }, [gameState, playerId, animations]);
}
