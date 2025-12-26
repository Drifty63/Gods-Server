'use client';

import { GodState, Element } from '@/types/cards';
import { ELEMENT_COLORS, ELEMENT_SYMBOLS, ELEMENT_NAMES } from '@/game-engine/ElementSystem';
import Image from 'next/image';
import styles from './GodCard.module.css';

// Types de statuts qui peuvent avoir une aura
type StatusAuraType = 'shield' | 'poison' | 'stun' | 'provocation' | null;

interface GodCardProps {
    god: GodState;
    isEnemy?: boolean;
    isSelectable?: boolean;
    isSelected?: boolean;
    isRequired?: boolean; // Cible obligatoire (provocateur)
    isShaking?: boolean; // #1 Animation shake
    shakeIntensity?: 'light' | 'normal'; // #1 Intensité du shake
    showParticle?: Element | null; // #4 Élément des particules à afficher
    showStatusAura?: StatusAuraType; // #6 Aura de statut à afficher
    onClick?: () => void;
}

export default function GodCard({
    god,
    isEnemy = false,
    isSelectable = false,
    isSelected = false,
    isRequired = false,
    isShaking = false,
    shakeIntensity = 'normal',
    showParticle = null,
    showStatusAura = null,
    onClick
}: GodCardProps) {
    const { card, currentHealth, statusEffects, isDead } = god;
    const colors = ELEMENT_COLORS[card.element];
    const healthPercentage = (currentHealth / card.maxHealth) * 100;

    // #1 Classe de shake dynamique
    const shakeClass = isShaking
        ? (shakeIntensity === 'light' ? styles.shakingLight : styles.shaking)
        : '';

    // #6 Classe d'aura de statut dynamique
    const statusAuraClass = showStatusAura ? styles[`statusAura_${showStatusAura}`] : '';

    return (
        <div
            className={`${styles.card} ${isDead ? styles.dead : ''} ${isSelectable ? styles.selectable : ''} ${isSelected ? styles.selected : ''} ${isRequired ? styles.required : ''} ${isEnemy ? styles.enemy : ''} ${shakeClass} ${statusAuraClass}`}
            style={{
                '--element-color': colors.primary,
                '--element-gradient': colors.gradient,
            } as React.CSSProperties}
            onClick={isSelectable ? onClick : undefined}
            data-god-id={card.id}
        >
            {/* Image du dieu avec barre de vie overlay */}
            <div className={styles.imageContainer}>
                <Image
                    src={god.isZombie && !isDead ? '/cards/zombie_overlay.png' : card.imageUrl}
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

                {/* #4 Particules élémentaires quand le dieu reçoit des dégâts */}
                {showParticle && (
                    <div className={`${styles.elementParticles} ${styles[showParticle]}`} />
                )}

                {/* #6 Aura de statut - Étoiles pour stun */}
                {showStatusAura === 'stun' && (
                    <div className={styles.stunStars}>
                        <span className={styles.stunStar}>⭐</span>
                        <span className={styles.stunStar}>⭐</span>
                        <span className={styles.stunStar}>⭐</span>
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
                    <div className={styles.weaknessContainer}>
                        {/* Faiblesse temporaire (si existe) */}
                        {god.temporaryWeakness && (
                            <span
                                className={`${styles.weaknessBadge} ${styles.temporaryWeakness} ${statusEffects.some(s => s.type === 'weakness_immunity') ? styles.immuneWeakness : ''}`}
                                title={statusEffects.some(s => s.type === 'weakness_immunity')
                                    ? `Faiblesse immunisée: ${ELEMENT_NAMES[god.temporaryWeakness]}`
                                    : `Faiblesse temporaire: ${ELEMENT_NAMES[god.temporaryWeakness]}`}
                            >
                                {ELEMENT_SYMBOLS[god.temporaryWeakness]}
                            </span>
                        )}
                        {/* Faiblesse de base */}
                        <span
                            className={`${styles.weaknessBadge} ${statusEffects.some(s => s.type === 'weakness_immunity') ? styles.immuneWeakness : ''}`}
                            title={statusEffects.some(s => s.type === 'weakness_immunity')
                                ? `Faiblesse immunisée: ${ELEMENT_NAMES[card.weakness]}`
                                : `Faiblesse: ${ELEMENT_NAMES[card.weakness]}`}
                        >
                            {ELEMENT_SYMBOLS[card.weakness]}
                        </span>
                    </div>
                </div>
            </div>

            {/* Overlay si mort */}
            {isDead && (
                <div className={styles.deadOverlay}>
                    <span className={styles.deadText}>💀</span>
                </div>
            )}

            {/* Overlay zombie (Perséphone) */}
            {god.isZombie && !isDead && (
                <div className={styles.zombieOverlay}>
                    <span className={styles.zombieText}>⚰️</span>
                    <span className={styles.zombieLabel}>ZOMBIE</span>
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



