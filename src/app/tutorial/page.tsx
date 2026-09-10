'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import GameBoard from '@/components/GameBoard/GameBoard';
import TutorialOverlay from '@/components/Tutorial/TutorialOverlay';
import { TUTORIAL_STEPS, TUTORIAL_OUTRO, TUTORIAL_DONE_KEY, shouldAdvance } from '@/data/tutorial';
import { getGodById } from '@/data/gods';
import { createDeck } from '@/data/spells';
import { playSfx } from '@/lib/sfx';
import { haptic } from '@/lib/haptics';
import styles from './page.module.css';

/**
 * Combat d'entraînement scripté.
 *
 * Zeus (Foudre, 25 PV) et Athéna (Lumière, 30 PV) contre un unique Soldat d'Arès (Terre, 16 PV).
 * Rien n'est laissé au hasard :
 *
 *  - la Terre est faible à la Foudre, donc le joueur découvre le coup critique ×2 dès son
 *    premier sort, sans qu'on ait à le lui faire chercher ;
 *  - un seul adversaire, peu de PV : la leçon ne peut pas se solder par une défaite ;
 *  - DEUX dieux, et non un seul, pour deux raisons. Leurs cadres — Foudre et Lumière — sont
 *    franchement différents, ce qui donne sa matière à l'étape « la couleur du cadre indique
 *    l'élément ». Et surtout, un seul dieu ne fournissait que 5 cartes pour une main de 5 : la
 *    pioche était vide dès le premier tour, le joueur encaissait des dégâts de fatigue en
 *    silence dès le tour 2, et l'étape qui montre « vos cartes restantes en pioche » affichait
 *    invariablement 0. Avec dix cartes, la pioche existe et la fatigue ne survient que
 *    lorsqu'on la met en scène.
 */
const PLAYER_GODS = ['zeus', 'athena'];
const ENEMY_GODS = ['soldier_ares_1'];

type Phase = 'intro' | 'playing' | 'done';

export default function TutorialPage() {
    const router = useRouter();
    const { initGame, resetGame, scriptTutorialFatigue } = useGameStore();

    const [phase, setPhase] = useState<Phase>('intro');
    const [stepIndex, setStepIndex] = useState(0);
    /** Étape `dismissible` refermée par le joueur : le guidage disparaît, la partie continue. */
    const [guideDismissed, setGuideDismissed] = useState(false);

    const step = TUTORIAL_STEPS[stepIndex];
    const isLast = stepIndex >= TUTORIAL_STEPS.length - 1;

    const playerGods = useMemo(
        () => PLAYER_GODS.map(id => getGodById(id)!).filter(Boolean),
        [],
    );
    const enemyGods = useMemo(
        () => ENEMY_GODS.map(id => getGodById(id)!).filter(Boolean),
        [],
    );

    const start = useCallback(() => {
        initGame(
            playerGods, createDeck(PLAYER_GODS),
            enemyGods, createDeck(ENEMY_GODS),
            true,   // le joueur commence : on n'apprend pas en subissant
            true,   // adversaire tenu par l'IA
        );
        setStepIndex(0);
        setGuideDismissed(false);
        setPhase('playing');
        // Le didacticiel est rejouable : les gardes « déjà fait » doivent repartir de zéro.
        advancedFrom.current = null;
        scriptedSteps.current.clear();
    }, [initGame, playerGods, enemyGods]);

    // Nettoyage : sans ça, la partie du didacticiel resterait dans le store et s'afficherait
    // en ouvrant un autre mode.
    useEffect(() => () => resetGame(), [resetGame]);

    const finish = useCallback(() => {
        try { window.localStorage.setItem(TUTORIAL_DONE_KEY, '1'); } catch { /* navigation privée */ }
        setPhase('done');
        playSfx('victory');
        haptic('victory');
    }, []);

    const skip = useCallback(() => {
        try { window.localStorage.setItem(TUTORIAL_DONE_KEY, '1'); } catch { /* navigation privée */ }
        resetGame();
        router.push('/play');
    }, [resetGame, router]);

    /**
     * Mises en scène : certaines règles se comprennent bien mieux en les VOYANT se produire.
     *
     * La fatigue, notamment, ne se rencontre qu'en fin de partie longue — un joueur qui découvre
     * le jeu ne la verrait jamais pendant la leçon. On la provoque donc à l'entrée de l'étape.
     * La garde par ref est indispensable : l'effet se rejoue à chaque rendu de l'étape, et sans
     * elle la pioche serait recyclée en boucle.
     */
    const scriptedSteps = useRef(new Set<string>());
    useEffect(() => {
        if (phase !== 'playing' || !step?.script) return;
        if (scriptedSteps.current.has(step.id)) return;
        scriptedSteps.current.add(step.id);

        // Différé d'un tick : muter l'état du jeu pendant le corps de l'effet déclencherait un
        // rendu en cascade (react-hooks/set-state-in-effect).
        const id = setTimeout(() => {
            if (step.script === 'fatigue') scriptTutorialFatigue();
        }, 0);
        return () => clearTimeout(id);
    }, [phase, step, scriptTutorialFatigue]);

    /**
     * Avance dès que la condition de l'étape est remplie.
     *
     * On s'ABONNE au store plutôt que de surveiller `gameState` à chaque rendu : la condition
     * porte sur une transition de la partie (une carte jouée, un tour passé), pas sur une valeur
     * dérivée du rendu, et l'abonnement la capte exactement une fois.
     */
    // Synchronisée dans un effet DÉCLARÉ AVANT celui qui la lit : React exécute les effets
    // dans l'ordre de déclaration au sein d'un même commit, donc la ref est à jour quand
    // l'abonnement la consulte. L'écrire pendant le rendu est interdit (rendu concurrent).
    const stepRef = useRef(step);
    useEffect(() => { stepRef.current = step; });

    /**
     * Id de la dernière étape déjà franchie.
     *
     * Sans ce garde, le didacticiel sautait une étape sur deux (7 → 9, puis 9 → 11). Trois
     * choses se combinaient : zustand notifie à CHAQUE `set()` sans rien comparer ; une action
     * du joueur en déclenche deux (`playCard` puis `selectCard(null)`) ; et `stepRef` n'est
     * rafraîchie qu'après un commit React. La deuxième notification revalidait donc la
     * condition de l'étape déjà franchie — d'autant plus facilement que ces conditions décrivent
     * un ÉTAT (`hasPlayedCard`) et non une transition : elles restent vraies après coup.
     *
     * Mémoriser l'id rend le franchissement idempotent, quel que soit le nombre de notifications.
     */
    const advancedFrom = useRef<string | null>(null);

    useEffect(() => {
        if (phase !== 'playing') return;

        const check = (state: ReturnType<typeof useGameStore.getState>) => {
            if (!state.gameState) return;

            // Le combat est allé à son terme : la leçon s'achève, quelle qu'en soit l'issue.
            if (state.gameState.status === 'finished') { finish(); return; }

            const current = stepRef.current;
            if (!shouldAdvance(current, advancedFrom.current, state.gameState)) return;
            advancedFrom.current = current!.id;
            setStepIndex(i => Math.min(i + 1, TUTORIAL_STEPS.length - 1));
        };

        check(useGameStore.getState());
        return useGameStore.subscribe(check);
    }, [phase, stepIndex, finish]);

    if (phase === 'intro') {
        return (
            <main className={styles.main}>
                <div className={styles.card}>
                    <span className={styles.icon}>🎓</span>
                    <h1 className={styles.title}>Didacticiel</h1>
                    <p className={styles.lead}>
                        Un combat guidé pour apprendre les règles et l&apos;interface : l&apos;énergie,
                        les cartes, le ciblage, les faiblesses élémentaires et la fin de tour.
                    </p>
                    <p className={styles.meta}>Environ 3 minutes · Aucun risque de défaite</p>

                    <button className={styles.primary} onClick={start}>Commencer</button>
                    <Link href="/play" className={styles.secondary}>Retour aux modes de jeu</Link>
                </div>
            </main>
        );
    }

    if (phase === 'done') {
        return (
            <main className={styles.main}>
                <div className={styles.card}>
                    <span className={styles.icon}>🏆</span>
                    <h1 className={styles.title}>{TUTORIAL_OUTRO.title}</h1>
                    <p className={styles.lead}>{TUTORIAL_OUTRO.text}</p>

                    <Link href="/rules" className={styles.primary}>📖 Consulter les règles</Link>
                    <Link href="/play" className={styles.secondary}>Choisir un mode de jeu</Link>
                    <button className={styles.ghost} onClick={start}>Refaire le didacticiel</button>
                </div>
            </main>
        );
    }

    return (
        <>
            <GameBoard />
            {step && !guideDismissed && (
                <TutorialOverlay
                    step={step}
                    index={stepIndex}
                    total={TUTORIAL_STEPS.length}
                    // Bouton « Suivant » réservé aux étapes explicatives : sur une étape d'action,
                    // il permettrait de sauter le geste qu'on veut justement faire apprendre.
                    onNext={step.advance === 'next'
                        ? () => { if (!isLast) setStepIndex(i => i + 1); else finish(); }
                        : undefined}
                    onSkip={skip}
                    onDismiss={() => setGuideDismissed(true)}
                />
            )}
        </>
    );
}
