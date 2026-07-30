import React, { useEffect, useRef, useState } from 'react';
import { GodState } from '@/types/cards';
import { getStatusIcon } from '@/data/statusIcons';
import styles from '../GameBoard.module.css';

interface HeroCardProps {
    god: GodState;
    isTargeted: boolean;
    /** Le dieu qui lance le sort actuellement sélectionné/en cours de jeu (par le joueur ou
     *  l'adversaire) : mis en avant avec une bordure dorée distincte de la cible (rouge), pour
     *  qu'on comprenne d'un coup d'œil qui lance quoi. */
    isCaster?: boolean;
    onClick: () => void;
}

interface Impact {
    key: number;
    kind: 'damage' | 'heal';
    amount: number;
}

export const HeroCard: React.FC<HeroCardProps> = ({ god, isTargeted, isCaster, onClick }) => {
    const healthPercent = Math.max(0, (god.currentHealth / god.card.maxHealth) * 100);

    // Effet visuel temporaire (flash coloré + nombre flottant) quand le dieu prend des dégâts
    // ou est soigné, pour que l'effet d'une carte se voie immédiatement sur la cible.
    const [impact, setImpact] = useState<Impact | null>(null);
    const prevHealthRef = useRef(god.currentHealth);
    const impactKeyRef = useRef(0);

    useEffect(() => {
        const prev = prevHealthRef.current;
        const delta = god.currentHealth - prev;
        prevHealthRef.current = god.currentHealth;

        if (delta === 0) return;

        impactKeyRef.current += 1;
        setImpact({
            key: impactKeyRef.current,
            kind: delta < 0 ? 'damage' : 'heal',
            amount: Math.abs(delta),
        });

        const timer = setTimeout(() => setImpact(null), 650);
        return () => clearTimeout(timer);
    }, [god.currentHealth]);

    const elementEmojis: Record<string, string> = {
        'fire': '🔥',
        'air': '💨',
        'earth': '🌿',
        'lightning': '⚡',
        'water': '💧',
        'light': '☀️',
        'darkness': '💀'
    };

    return (
        <div
            className={`${styles.heroCard} ${god.isDead ? styles.dead : ''} ${isTargeted ? styles.targeted : ''} ${isCaster ? styles.caster : ''}`}
            onClick={onClick}
        >
            <div className={styles.elementBadge}>
                {elementEmojis[god.card.weakness]}
            </div>

            <div className={styles.statusContainer}>
                {god.statusEffects.map((status, idx) => (
                    <div key={idx} className={styles.statusBadge}>
                        {getStatusIcon(status.type)}
                        {status.stacks > 1 && <span className={styles.stacksCount}>{status.stacks}</span>}
                    </div>
                ))}
            </div>

            <img
                src={god.card.imageUrl}
                alt={god.card.name}
                className={styles.heroImage}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />

            {impact && (
                <div
                    key={impact.key}
                    className={`${styles.impactOverlay} ${impact.kind === 'damage' ? styles.impactDamage : styles.impactHeal}`}
                >
                    <span className={styles.impactNumber}>
                        {impact.kind === 'damage' ? '-' : '+'}{impact.amount}
                    </span>
                </div>
            )}

            <div className={styles.heroInfo}>
                <div className={styles.heroName}>{god.card.name}</div>
                <div className={styles.healthTrack}>
                    <div className={styles.healthFill} style={{ width: `${healthPercent}%` }} />
                    <span className={styles.healthText}>{god.currentHealth}/{god.card.maxHealth}</span>
                </div>
            </div>
        </div>
    );
};
