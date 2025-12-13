'use client';

import { GodCard as GodCardType, GodState } from '@/types/cards';
import { ELEMENT_COLORS, ELEMENT_SYMBOLS, ELEMENT_NAMES } from '@/game-engine/ElementSystem';
import Image from 'next/image';
import styles from './GodCard.module.css';

interface GodCardProps {
    god: GodState;
    isEnemy?: boolean;
    isSelectable?: boolean;
    isSelected?: boolean;
    isRequired?: boolean; // Cible obligatoire (provocateur)
    onClick?: () => void;
}

export default function GodCard({
    god,
    isEnemy = false,
    isSelectable = false,
    isSelected = false,
    isRequired = false,
    onClick
}: GodCardProps) {
    const { card, currentHealth, statusEffects, isDead } = god;
    const colors = ELEMENT_COLORS[card.element];
    const healthPercentage = (currentHealth / card.maxHealth) * 100;

    return (
        <div
            className={`${styles.card} ${isDead ? styles.dead : ''} ${isSelectable ? styles.selectable : ''} ${isSelected ? styles.selected : ''} ${isRequired ? styles.required : ''}`}
            style={{
                '--element-color': colors.primary,
                '--element-gradient': colors.gradient,
            } as React.CSSProperties}
            onClick={isSelectable ? onClick : undefined}
        >
            {/* Image du dieu avec barre de vie overlay */}
            <div className={styles.imageContainer}>
                <Image
                    src={card.imageUrl}
                    alt={card.name}
                    fill
                    className={styles.image}
                    sizes="(max-width: 768px) 150px, 200px"
                    priority
                />

                {/* Élément en haut à gauche */}
                <span className={styles.elementBadge} title={ELEMENT_NAMES[card.element]}>
                    {ELEMENT_SYMBOLS[card.element]}
                </span>

                {/* Effets de statut en haut à droite */}
                {statusEffects.length > 0 && (
                    <div className={styles.statusEffects}>
                        {statusEffects.map((status, index) => (
                            <div
                                key={index}
                                className={`${styles.statusBadge} ${styles[status.type] || ''}`}
                                title={`${status.type}: ${status.stacks}`}
                            >
                                <span>{getStatusIcon(status.type)}</span>
                                <span>{status.stacks}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Barre de vie en bas de l'image avec faiblesse */}
                <div className={styles.healthOverlay}>
                    <div className={styles.healthBar}>
                        <div
                            className={styles.healthFill}
                            style={{ width: `${Math.max(0, healthPercentage)}%` }}
                        />
                        <span className={styles.healthText}>
                            {currentHealth}/{card.maxHealth}
                        </span>
                    </div>
                    <span
                        className={styles.weaknessBadge}
                        title={`Faiblesse: ${ELEMENT_NAMES[god.temporaryWeakness || card.weakness]}`}
                        style={{ color: god.temporaryWeakness ? '#f59e0b' : 'inherit' }}
                    >
                        {ELEMENT_SYMBOLS[god.temporaryWeakness || card.weakness]}
                    </span>
                </div>
            </div>

            {/* Overlay si mort */}
            {isDead && (
                <div className={styles.deadOverlay}>
                    <span className={styles.deadText}>💀</span>
                </div>
            )}
        </div>
    );
}

function getStatusIcon(status: string): string {
    switch (status) {
        case 'poison': return '🧪';
        case 'lightning': return '⚡';
        case 'shield': return '🛡️';
        case 'provocation': return '😤';
        case 'stun': return '🌀';
        case 'weakness_immunity': return '🌟';
        default: return '✨';
    }
}
