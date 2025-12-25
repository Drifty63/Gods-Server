'use client';

import { useEffect, useState } from 'react';
import styles from './GameBoard.module.css';

interface DamageNumberProps {
    id: string;
    amount: number;
    type: 'damage' | 'heal' | 'critical';
    x: number;
    y: number;
    onComplete: (id: string) => void;
}

/**
 * #2 - Composant pour afficher les chiffres de dégâts/soins flottants
 * Apparaît à une position et flotte vers le haut avant de disparaître
 */
export default function DamageNumber({ id, amount, type, x, y, onComplete }: DamageNumberProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // L'animation dure 1.2s, on retire le composant après
        const timer = setTimeout(() => {
            setVisible(false);
            onComplete(id);
        }, 1200);

        return () => clearTimeout(timer);
    }, [id, onComplete]);

    if (!visible) return null;

    const displayAmount = type === 'heal' ? `+${amount}` : `-${amount}`;
    const className = `${styles.damageNumber} ${styles[type]}`;

    return (
        <div
            className={className}
            style={{
                left: `${x}px`,
                top: `${y}px`,
            }}
        >
            {displayAmount}
        </div>
    );
}
