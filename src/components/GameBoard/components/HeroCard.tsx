import React from 'react';
import { GodState } from '@/types/cards';
import styles from '../GameBoard.module.css';

interface HeroCardProps {
    god: GodState;
    isTargeted: boolean;
    onClick: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({ god, isTargeted, onClick }) => {
    const healthPercent = Math.max(0, (god.currentHealth / god.card.maxHealth) * 100);

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
            className={`${styles.heroCard} ${god.isDead ? styles.dead : ''} ${isTargeted ? styles.targeted : ''}`}
            onClick={onClick}
        >
            <div className={styles.elementBadge}>
                {elementEmojis[god.card.weakness]}
            </div>

            <div className={styles.statusContainer}>
                {god.statusEffects.map((status, idx) => (
                    <div key={idx} className={styles.statusBadge}>
                        {status.type === 'poison' && '☠️'}
                        {status.type === 'shield' && '🛡️'}
                        {status.type === 'regen' && '💚'}
                        {status.type === 'lightning' && '⚡'}
                        {status.type === 'stun' && '💫'}
                        {status.stacks > 1 && `x${status.stacks}`}
                    </div>
                ))}
            </div>

            <img 
                src={god.card.imageUrl} 
                alt={god.card.name} 
                className={styles.heroImage}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />

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
