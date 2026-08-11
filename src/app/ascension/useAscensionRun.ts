'use client';

import { useCallback, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getGodById } from '@/data/gods';
import { createDeck } from '@/data/spells';
import { generateAscensionRun, TOTAL_FLOORS, type AscensionFloor } from '@/data/ascension';
import type { GodCard } from '@/types/cards';

export type RunPhase = 'idle' | 'fighting' | 'floor_cleared' | 'run_over' | 'victory';

/** Ce que le joueur transporte d'un étage au suivant. */
interface Carry {
    /** PV restants, par id de dieu. Les dieux morts n'y figurent plus. */
    health: Record<string, number>;
    /** Énergie non dépensée : elle se reporte aussi, à la demande du design. */
    energy: number;
    /** Dieux encore vivants, dans l'ordre choisi au départ. */
    aliveGodIds: string[];
}

/**
 * Pilote une ascension : enchaîne les combats en conservant PV et énergie, retire les dieux
 * tombés, et s'arrête quand l'équipe est anéantie ou que le sommet est atteint.
 *
 * La règle centrale du mode — aucun soin entre les étages — est portée par `carryOverHealth` du
 * moteur, qui fixe les PV de départ sans toucher à `maxHealth` : un dieu blessé s'affiche donc
 * « 10/30 » et non « 10/10 ».
 */
export function useAscensionRun() {
    const { initGame, resetGame } = useGameStore();

    const [phase, setPhase] = useState<RunPhase>('idle');
    const [floors, setFloors] = useState<AscensionFloor[]>([]);
    const [currentFloor, setCurrentFloor] = useState(1);
    const [reward, setReward] = useState(0);

    // L'état reporté est affiché (écran d'entre-deux-étages : PV restants, énergie conservée),
    // il doit donc vivre dans un state et non dans une ref -- une ref lue pendant le rendu ne
    // garantit pas une valeur à jour et ne provoque aucun re-render.
    const [carry, setCarry] = useState<Carry>({ health: {}, energy: 0, aliveGodIds: [] });

    /** Lance le combat de l'étage demandé avec l'état reporté. */
    const startFloor = useCallback((floor: number, run: AscensionFloor[], carry: Carry) => {
        const spec = run[floor - 1];
        if (!spec) return;

        const playerGods = carry.aliveGodIds
            .map(id => getGodById(id))
            .filter((g): g is GodCard => Boolean(g));
        const enemyGods = spec.enemyIds
            .map(id => getGodById(id))
            .filter((g): g is GodCard => Boolean(g));

        if (playerGods.length === 0 || enemyGods.length === 0) return;

        initGame(
            playerGods,
            createDeck(playerGods.map(g => g.id)),
            enemyGods,
            createDeck(enemyGods.map(g => g.id)),
            true,   // le joueur commence : il n'a pas de bonus d'énergie de second joueur
            true,   // solo (IA)
            {
                carryOverHealth: carry.health,
                carryOverEnergy: carry.energy,
                noFatigueDamage: true,
                player1Name: 'Vous',
                player2Name: `Étage ${floor}`,
            },
        );
        setCurrentFloor(floor);
        setPhase('fighting');
    }, [initGame]);

    /** Démarre une ascension avec l'équipe choisie. */
    const beginRun = useCallback((godIds: string[]) => {
        const run = generateAscensionRun(Date.now());
        const fresh: Carry = { health: {}, energy: 0, aliveGodIds: [...godIds] };
        setCarry(fresh);
        setFloors(run);
        setReward(0);
        startFloor(1, run, fresh);
    }, [startFloor]);

    /**
     * À appeler quand le combat en cours est terminé. Enregistre le résultat, met à jour l'état
     * reporté et décide de la suite (étage suivant, sommet, ou fin de l'ascension).
     */
    const resolveFloor = useCallback((won: boolean, gained: number) => {
        if (!won) {
            setPhase('run_over');
            return;
        }

        const state = useGameStore.getState().gameState;
        const player = state?.players.find(p => p.id === 'player1');
        const survivors = player ? player.gods.filter(g => !g.isDead) : [];

        setCarry({
            health: Object.fromEntries(survivors.map(g => [g.card.id, g.currentHealth])),
            energy: player?.energy ?? 0,
            aliveGodIds: survivors.map(g => g.card.id),
        });
        setReward(r => r + gained);

        // Plus personne debout : l'ascension s'arrête même sur une victoire à la Pyrrhus.
        if (survivors.length === 0) {
            setPhase('run_over');
            return;
        }
        setPhase(currentFloor >= TOTAL_FLOORS ? 'victory' : 'floor_cleared');
    }, [currentFloor]);

    /**
     * Enchaîne sur l'étage suivant depuis l'écran d'entre-deux. `carry` est à jour ici : il a été
     * posé par resolveFloor, et cet écran a déjà été rendu avec ces valeurs avant que le joueur
     * ne clique.
     */
    const climbNext = useCallback(() => {
        startFloor(currentFloor + 1, floors, carry);
    }, [currentFloor, floors, carry, startFloor]);

    const abandonRun = useCallback(() => {
        resetGame();
        setPhase('idle');
        setCurrentFloor(1);
        setReward(0);
        setCarry({ health: {}, energy: 0, aliveGodIds: [] });
    }, [resetGame]);

    return {
        phase,
        floors,
        currentFloor,
        reward,
        survivorHealth: carry.health,
        carriedEnergy: carry.energy,
        beginRun,
        resolveFloor,
        climbNext,
        abandonRun,
    };
}
