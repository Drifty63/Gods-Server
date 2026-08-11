'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { RequireAuth } from '@/components/Auth/RequireAuth';
import GameBoard from '@/components/GameBoard/GameBoard';
import { useGameStore } from '@/store/gameStore';
import { getOwnedGods } from '@/data/gods';
import { floorReward } from '@/data/ascension';
import { reportAscensionRun } from '@/services/supabase-profile';
import { useAscensionRun } from './useAscensionRun';
import { AscensionMenu, TeamPicker, FloorCleared, RunOver } from './components/AscensionViews';
import styles from './page.module.css';

export default function AscensionPage() {
    return (
        <RequireAuth>
            <AscensionContent />
        </RequireAuth>
    );
}

function AscensionContent() {
    const { profile, refreshProfile } = useAuth();
    const gameState = useGameStore(s => s.gameState);
    const run = useAscensionRun();

    const [picking, setPicking] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    // Une ascension terminée ne doit être remontée qu'une fois au serveur, même si la phase
    // repasse par un rendu supplémentaire.
    const reportedRef = useRef(false);

    const bestFloor = profile?.ascension_best_floor ?? 0;

    const ownedGods = getOwnedGods(
        profile?.gods_owned || [],
        profile?.is_creator || false,
    );

    // Fin du combat en cours : le GameBoard ne montre jamais son propre écran de victoire ici,
    // car dès que la partie passe à 'finished' on cesse de le rendre au profit des écrans
    // d'ascension (entre-deux-étages, fin de run).
    useEffect(() => {
        if (run.phase !== 'fighting' || gameState?.status !== 'finished') return;
        const won = gameState.winnerId === 'player1';
        run.resolveFloor(won, won ? floorReward(run.currentFloor) : 0);
        // On dépend des champs précis utilisés, pas de l'objet `run` : celui-ci est recréé à
        // chaque rendu, donc l'inclure relancerait l'effet en boucle.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState?.status, gameState?.winnerId, run.phase, run.currentFloor, run.resolveFloor]);

    // Remontée du résultat au serveur (record + ambroisie) une fois l'ascension close.
    useEffect(() => {
        if (run.phase !== 'run_over' && run.phase !== 'victory') return;
        if (reportedRef.current) return;
        reportedRef.current = true;

        const floorReached = run.phase === 'victory' ? run.currentFloor : Math.max(0, run.currentFloor - 1);
        reportAscensionRun(floorReached, run.reward)
            .then(() => refreshProfile())
            .catch(err => console.error('Ascension : remontée du résultat échouée', err));
    }, [run.phase, run.currentFloor, run.reward, refreshProfile]);

    const toggleGod = useCallback((id: string) => {
        setSelected(prev => prev.includes(id)
            ? prev.filter(g => g !== id)
            : (prev.length < 4 ? [...prev, id] : prev));
    }, []);

    const startRun = useCallback(() => {
        reportedRef.current = false;
        setPicking(false);
        run.beginRun(selected);
    }, [run, selected]);

    const backToMenu = useCallback(() => {
        run.abandonRun();
        setPicking(false);
        setSelected([]);
    }, [run]);

    // Le combat occupe tout l'écran : pas d'en-tête d'ascension par-dessus le plateau.
    if (run.phase === 'fighting' && gameState?.status === 'playing') {
        return <GameBoard />;
    }

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <Link href="/play" className={styles.backButton} aria-label="Retour">← Retour</Link>
                <h1 className={styles.title}>🏔️ Ascension</h1>
                <div className={styles.bestFloor}>🏆 {bestFloor}</div>
            </header>

            <div className={styles.content}>
                {run.phase === 'idle' && !picking && (
                    <AscensionMenu bestFloor={bestFloor} onStart={() => setPicking(true)} />
                )}

                {run.phase === 'idle' && picking && (
                    <TeamPicker
                        ownedGods={ownedGods}
                        selected={selected}
                        onToggle={toggleGod}
                        onConfirm={startRun}
                        onBack={() => setPicking(false)}
                    />
                )}

                {run.phase === 'floor_cleared' && (
                    <FloorCleared
                        floors={run.floors}
                        clearedFloor={run.currentFloor}
                        survivorHealth={run.survivorHealth}
                        carriedEnergy={run.carriedEnergy}
                        reward={run.reward}
                        onClimb={run.climbNext}
                        onQuit={backToMenu}
                    />
                )}

                {(run.phase === 'run_over' || run.phase === 'victory') && (
                    <RunOver
                        isVictory={run.phase === 'victory'}
                        floorReached={run.phase === 'victory' ? run.currentFloor : Math.max(0, run.currentFloor - 1)}
                        reward={run.reward}
                        onRestart={() => { backToMenu(); setPicking(true); }}
                        onQuit={backToMenu}
                    />
                )}

                {/* Le combat est terminé mais la phase n'a pas encore basculé : évite un écran vide. */}
                {run.phase === 'fighting' && gameState?.status !== 'playing' && (
                    <section className={styles.menuSection}>
                        <div className={styles.ascensionIcon}>⚔️</div>
                        <p className={styles.menuDesc}>Résolution du combat…</p>
                    </section>
                )}
            </div>
        </main>
    );
}
