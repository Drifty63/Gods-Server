'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState } from '@/types/cards';

interface DamageNumberData {
    id: string;
    amount: number;
    type: 'damage' | 'heal' | 'critical';
    x: number;
    y: number;
}

interface UseCombatAnimationsReturn {
    // Screen shake
    isShaking: boolean;
    shakeIntensity: 'light' | 'normal';
    triggerShake: (intensity?: 'light' | 'normal') => void;

    // Damage numbers
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
 * Inclut: screen shake (#1), damage numbers (#2), turn transition (#4)
 */
export function useCombatAnimations(): UseCombatAnimationsReturn {
    // #1 - Screen Shake state
    const [isShaking, setIsShaking] = useState(false);
    const [shakeIntensity, setShakeIntensity] = useState<'light' | 'normal'>('normal');

    // #2 - Damage Numbers state
    const [damageNumbers, setDamageNumbers] = useState<DamageNumberData[]>([]);
    const damageIdCounter = useRef(0);

    // #4 - Turn Transition state
    const [showTurnTransition, setShowTurnTransition] = useState(false);
    const [isPlayerTurnTransition, setIsPlayerTurnTransition] = useState(true);

    // Ref pour stocker les positions des dieux
    const godPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

    // #1 - Trigger screen shake
    const triggerShake = useCallback((intensity: 'light' | 'normal' = 'normal') => {
        setShakeIntensity(intensity);
        setIsShaking(true);

        // Durée de l'animation shake
        const duration = intensity === 'light' ? 300 : 500;
        setTimeout(() => setIsShaking(false), duration);
    }, []);

    // #2 - Add damage number
    const addDamageNumber = useCallback((godId: string, amount: number, type: 'damage' | 'heal' | 'critical') => {
        const id = `dmg-${damageIdCounter.current++}`;

        // Trouver la position du dieu (on utilisera le centre par défaut)
        // En pratique, on devrait récupérer la position via un ref sur le composant GodCard
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
        // Screen shake
        isShaking,
        shakeIntensity,
        triggerShake,

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

        // Détecter les dégâts pour les damage numbers et screen shake (#1, #2)
        if (previousState) {
            // Comparer les HP de chaque dieu
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

                            // Screen shake pour les dégâts
                            if (player.id === playerId) {
                                animations.triggerShake(amount >= 4 ? 'normal' : 'light');
                            }
                        } else {
                            // Soins reçus
                            animations.addDamageNumber(god.card.id, hpDiff, 'heal');
                        }
                    }
                }
            }
        }

        // Stocker l'état actuel pour la prochaine comparaison
        previousStateRef.current = JSON.parse(JSON.stringify(gameState));
    }, [gameState, playerId, animations]);
}
