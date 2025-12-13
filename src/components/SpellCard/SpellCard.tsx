'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SpellCard as SpellCardType } from '@/types/cards';
import { ELEMENT_COLORS, ELEMENT_SYMBOLS, ELEMENT_NAMES } from '@/game-engine/ElementSystem';
import styles from './SpellCard.module.css';

interface SpellCardProps {
    card: SpellCardType;
    canPlay?: boolean;
    isSelected?: boolean;
    isSmall?: boolean; // Version réduite pour l'affichage de la main adverse
    onClick?: () => void;
    onRightClick?: () => void; // Pour défausser (PC only)
}

export default function SpellCard({
    card,
    canPlay = false,
    isSelected = false,
    isSmall = false,
    onClick,
    onRightClick
}: SpellCardProps) {
    const colors = ELEMENT_COLORS[card.element];
    const [imageError, setImageError] = useState(false);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        // Le clic droit reste pour PC mais n'est plus essentiel
        onRightClick?.();
    };

    return (
        <div
            className={`
        ${styles.card} 
        ${canPlay ? styles.playable : styles.unplayable}
        ${isSelected ? styles.selected : ''}
        ${isSmall ? styles.small : ''}
      `}
            style={{
                '--element-color': colors.primary,
                '--element-gradient': colors.gradient,
            } as React.CSSProperties}
            onClick={onClick}
            onContextMenu={handleContextMenu}
        >
            {/* Header */}
            <div className={styles.header}>
                <span className={styles.name}>{card.name}</span>
                <span className={styles.element} title={ELEMENT_NAMES[card.element]}>
                    {ELEMENT_SYMBOLS[card.element]}
                </span>
            </div>

            {/* Coût en énergie */}
            <div className={styles.cost}>
                <span className={styles.costValue}>{card.energyCost}</span>
            </div>

            {/* Image du sort */}
            <div className={styles.imageContainer}>
                {card.imageUrl && !imageError ? (
                    <Image
                        src={card.imageUrl}
                        alt={card.name}
                        fill
                        className={styles.image}
                        sizes="(max-width: 768px) 100px, 150px"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className={styles.imagePlaceholder}>
                        {getTypeIcon(card.type)}
                    </div>
                )}
            </div>

            {/* Description de l'effet */}
            <div className={styles.description}>
                <p>{card.description}</p>
            </div>

            {/* Footer avec gain d'énergie */}
            <div className={styles.footer}>
                {card.energyGain > 0 && (
                    <div className={styles.energyGain}>
                        <span className={styles.gainIcon}>⚡</span>
                        <span className={styles.gainValue}>+{card.energyGain}</span>
                    </div>
                )}
                <span className={styles.type}>{getTypeName(card.type)}</span>
            </div>

            {/* Badge indicateur */}
            {canPlay && (
                <div className={styles.playableBadge}>
                    ▶
                </div>
            )}
        </div>
    );
}

function getTypeIcon(type: SpellCardType['type']): string {
    switch (type) {
        case 'generator': return '⚡';
        case 'competence': return '⚔️';
        case 'utility': return '🔧';
        default: return '✨';
    }
}

function getTypeName(type: SpellCardType['type']): string {
    switch (type) {
        case 'generator': return 'Générateur';
        case 'competence': return 'Compétence';
        case 'utility': return 'Utilitaire';
        default: return '';
    }
}
