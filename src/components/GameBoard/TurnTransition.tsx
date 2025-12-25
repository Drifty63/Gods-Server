'use client';

import { useEffect, useState } from 'react';
import styles from './GameBoard.module.css';

interface TurnTransitionProps {
    isPlayerTurn: boolean;
    onComplete?: () => void;
}

/**
 * #4 - Composant pour afficher la transition de tour
 * Affiche "VOTRE TOUR" ou "TOUR ENNEMI" avec une animation épique
 */
export default function TurnTransition({ isPlayerTurn, onComplete }: TurnTransitionProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // L'animation dure 1.8s
        const timer = setTimeout(() => {
            setVisible(false);
            onComplete?.();
        }, 1800);

        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!visible) return null;

    return (
        <div className={styles.turnTransitionOverlay}>
            <div className={`${styles.turnTransitionBanner} ${isPlayerTurn ? styles.playerTurn : styles.enemyTurn}`}>
                {isPlayerTurn ? '⚔️ VOTRE TOUR' : '🔥 TOUR ENNEMI'}
            </div>
        </div>
    );
}
