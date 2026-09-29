'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getGodById } from '@/data/gods';
import { createDeck } from '@/data/spells';
import { generateAscensionRun, TOTAL_FLOORS, isTierBoundary, type AscensionFloor } from '@/data/ascension';
import type { GodCard } from '@/types/cards';
import {
    loadRun, saveRun, clearRun,
    subscribeRun, getRunSnapshot, getRunServerSnapshot,
} from './runStorage';

/**
 * `abandoned` est distinct de `run_over`, et l'écart compte.
 *
 * Sur une DÉFAITE (`run_over`), l'étage en cours n'a pas été franchi : le record vaut
 * `currentFloor - 1`. Sur un ABANDON depuis l'entre-deux-étages, l'étage vient d'être nettoyé :
 * le record vaut `currentFloor`. Confondre les deux faisait perdre un étage au joueur.
 */
export type RunPhase = 'idle' | 'fighting' | 'floor_cleared' | 'run_over' | 'victory' | 'abandoned';

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
        // Changement de palier : les survivants repartent au complet. Les dieux tombés restent
        // tombés — c'est l'équipe qui rétrécit, pas la difficulté qui s'efface.
        const healed = isTierBoundary(currentFloor)
            ? {
                ...carry,
                health: Object.fromEntries(
                    carry.aliveGodIds.map(id => [id, getGodById(id)?.maxHealth ?? carry.health[id]]),
                ),
            }
            : carry;

        startFloor(currentFloor + 1, floors, healed);
    }, [currentFloor, floors, carry, startFloor]);

    /**
     * Arrête l'ascension en CONSERVANT la progression, pour qu'elle soit remontée au serveur.
     *
     * Sans cela, abandonner après avoir nettoyé des étages jetait tout : la phase passait
     * directement à `idle`, et l'effet qui enregistre le record ne se déclenchait jamais.
     */
    const stopRun = useCallback(() => {
        setPhase('abandoned');
    }, []);

    /** Remet l'ascension à zéro et revient au menu. Ne remonte rien : tout l'a déjà été. */
    const abandonRun = useCallback(() => {
        resetGame();
        clearRun();
        setPhase('idle');
        setCurrentFloor(1);
        setReward(0);
        setCarry({ health: {}, energy: 0, aliveGodIds: [] });
    }, [resetGame]);

    /*
     * ─── SAUVEGARDE ET REPRISE ───────────────────────────────────────────────────────────
     *
     * Une ascension dure quinze combats. Fermer l'application en effaçait toute trace : un
     * joueur parvenu au dixième étage perdait tout pour avoir répondu au téléphone.
     */

    /** Y a-t-il une ascension à reprendre ? Lue comme une source extérieure à React. */
    const savedRun = useSyncExternalStore(subscribeRun, getRunSnapshot, getRunServerSnapshot);

    /**
     * Écrit l'ascension en cours, combat compris.
     *
     * Dans une référence plutôt qu'une simple fonction : elle est appelée depuis des écouteurs
     * d'événements posés une fois pour toutes, qui capteraient sinon les valeurs du premier
     * rendu et sauvegarderaient éternellement l'étage 1.
     */
    const persistRef = useRef<() => void>(() => undefined);

    /*
     * La référence est mise à jour dans un EFFET, jamais pendant le rendu : y écrire pendant le
     * rendu rend un composant impropre au rendu concurrent, et React le signale.
     *
     * Effet sans tableau de dépendances, donc rejoué après chaque rendu : c'est ce qui garde la
     * fonction à jour. Déclaré AVANT les effets qui l'appellent, pour qu'ils voient toujours la
     * dernière version — les effets s'exécutent dans leur ordre d'écriture.
     */
    useEffect(() => {
        persistRef.current = () => {
            if (phase === 'idle' || phase === 'run_over' || phase === 'victory' || phase === 'abandoned') return;
            saveRun({
                floors,
                currentFloor,
                reward,
                carry,
                // L'état du combat n'est retenu qu'en plein affrontement : c'est lui qui permet
                // de reprendre au milieu, et donc de ne pas offrir de seconde chance à qui ferme
                // l'application en train de perdre.
                gameState: phase === 'fighting' ? (useGameStore.getState().gameState ?? null) : null,
            });
        };
    });

    /*
     * On sauvegarde quand l'application DISPARAÎT, et non à chaque action.
     *
     * `visibilitychange` et `pagehide` sont les deux seuls signaux qu'iOS envoie de façon fiable
     * avant de suspendre ou de fermer une application ajoutée à l'écran d'accueil ; `beforeunload`
     * n'y est pas tenu. Écrire à chaque coup joué aurait coûté une sérialisation complète de
     * l'état par carte jouée — exactement la dépense qu'on vient de supprimer ailleurs.
     */
    useEffect(() => {
        const persist = () => persistRef.current();
        const onVisibility = () => { if (document.visibilityState === 'hidden') persist(); };

        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('pagehide', persist);
        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('pagehide', persist);
            /*
             * QUITTER LA PAGE compte aussi, et les deux écouteurs ci-dessus ne le voient pas :
             * un retour à l'accueil par la roue des paramètres est une navigation INTERNE,
             * l'application ne disparaît ni ne se masque. Seul le démontage du composant le
             * signale. Sans cette ligne, la sauvegarde ne couvrait que la fermeture du
             * téléphone, pas la sortie volontaire — le cas le plus courant.
             */
            persist();
        };
    }, []);

    /*
     * Point de reprise à chaque changement de phase : filet de sécurité pour les fermetures
     * brutales, qui n'envoient aucun signal. Rare, donc sans coût sensible.
     */
    useEffect(() => { persistRef.current(); }, [phase, currentFloor]);

    /** Efface la sauvegarde dès que l'ascension est finie, de quelque manière que ce soit. */
    useEffect(() => {
        if (phase === 'run_over' || phase === 'victory' || phase === 'abandoned') clearRun();
    }, [phase]);

    /** Reprend l'ascension sauvegardée, exactement où elle s'était arrêtée. */
    const resumeRun = useCallback(() => {
        const saved = loadRun();
        if (!saved) return;

        setFloors(saved.floors);
        setCurrentFloor(saved.currentFloor);
        setReward(saved.reward);
        setCarry(saved.carry);
        // La sauvegarde n'est PAS effacée en reprenant : elle doit survivre à une seconde
        // sortie. Elle disparaît de l'écran toute seule, la proposition de reprise ne
        // s'affichant qu'au menu.

        if (saved.gameState) {
            // En plein combat : on remonte le moteur ET l'adversaire artificiel.
            useGameStore.getState().restoreSoloState(saved.gameState);
            setPhase('fighting');

            /*
             * Si la main était à l'IA au moment de la sortie, il faut la lui redonner.
             *
             * Son tour se déclenche d'ordinaire à la fin de celui du joueur ; une reprise ne
             * passe par aucune fin de tour, donc personne ne le lancerait et la partie
             * resterait figée sur un adversaire qui ne joue jamais. Le délai laisse le plateau
             * se dessiner avant que les cartes ne se mettent à bouger.
             */
            if (saved.gameState.currentPlayerId !== 'player1') {
                setTimeout(() => useGameStore.getState().playAITurn(), 800);
            }
        } else {
            // Entre deux étages : l'écran d'entre-deux se réaffiche tel quel.
            setPhase('floor_cleared');
        }
    }, []);

    /** Écarte la sauvegarde pour repartir de zéro. `clearRun` prévient les abonnés. */
    const discardSavedRun = useCallback(() => clearRun(), []);

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
        stopRun,
        savedRun,
        resumeRun,
        discardSavedRun,
    };
}
