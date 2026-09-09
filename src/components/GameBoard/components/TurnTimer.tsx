'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GAME_CONFIG } from '@/data/gameRules';
import { playSfx } from '@/lib/sfx';
import { haptic } from '@/lib/haptics';
import styles from '../GameBoard.module.css';

interface TurnTimerProps {
    /** Le chrono ne tourne que pendant VOTRE tour. */
    active: boolean;
    /** Clé de tour : tout changement relance le décompte à zéro. */
    turnKey: string | number;
    /** Appelé une seule fois quand le temps est écoulé. */
    onExpire: () => void;
}

/** En dessous, le décompte passe en alerte (couleur + pulsation + bip). */
const WARNING_MS = 15_000;

/**
 * Compte à rebours du tour, réservé aux modes compétitifs.
 *
 * Sans limite de temps, rien n'obligeait un joueur à agir : une partie pouvait s'éterniser, et
 * certaines stratégies défensives n'avaient aucune raison de conclure. Le décompte vit côté
 * client — le moteur reste déterministe et ne connaît que l'action `timeout_turn` qui en résulte.
 */
export const TurnTimer: React.FC<TurnTimerProps> = ({ active, turnKey, onExpire }) => {
    const [remaining, setRemaining] = useState<number>(GAME_CONFIG.TURN_TIME_LIMIT_MS);
    const expiredRef = useRef(false);
    const warnedRef = useRef(false);
    // Lu par l'intervalle sans le faire redémarrer : le rappel change à chaque rendu du plateau.
    const onExpireRef = useRef(onExpire);
    useEffect(() => { onExpireRef.current = onExpire; });

    useEffect(() => {
        if (!active) return;

        // Chaque tour repart d'un décompte neuf.
        expiredRef.current = false;
        warnedRef.current = false;

        // On compare des HORODATAGES plutôt que de soustraire un pas fixe : un onglet mis en
        // arrière-plan voit ses intervalles ralentis par le navigateur, et un décompte par
        // décrément dériverait au point d'offrir des minutes supplémentaires.
        const deadline = Date.now() + GAME_CONFIG.TURN_TIME_LIMIT_MS;

        const tick = () => {
            const left = Math.max(0, deadline - Date.now());
            setRemaining(left);

            if (left <= WARNING_MS && !warnedRef.current && left > 0) {
                warnedRef.current = true;
                playSfx('error');
                haptic('error');
            }

            if (left === 0 && !expiredRef.current) {
                expiredRef.current = true;
                onExpireRef.current();
            }
        };

        // Premier tick immédiat via un timer plutôt qu'un appel direct : mettre l'état à jour
        // dans le corps de l'effet provoquerait un rendu en cascade (React le déconseille).
        const first = setTimeout(tick, 0);
        const id = setInterval(tick, 250);
        return () => { clearTimeout(first); clearInterval(id); };
    }, [active, turnKey]);

    if (!active) return null;

    const seconds = Math.ceil(remaining / 1000);
    const urgent = remaining <= WARNING_MS;
    const ratio = remaining / GAME_CONFIG.TURN_TIME_LIMIT_MS;

    return (
        <div
            className={`${styles.turnTimer} ${urgent ? styles.turnTimerUrgent : ''}`}
            role="timer"
            aria-label={`${seconds} secondes restantes`}
        >
            <span className={styles.turnTimerValue}>{seconds}</span>
            <span className={styles.turnTimerTrack}>
                <span className={styles.turnTimerFill} style={{ transform: `scaleX(${ratio})` }} />
            </span>
        </div>
    );
};
