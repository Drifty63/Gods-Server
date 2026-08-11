import React from 'react';
import { SpellCard } from '@/types/cards';
import { getReadableSpellDescription } from '@/data/spellDescriptions';
import { ELEMENT_COLORS } from '@/game-engine/ElementSystem';
import { getCardTypeMeta } from '@/data/cardTypeStyles';
import styles from '../GameBoard.module.css';

interface SpellCardUIProps {
    card: SpellCard;
    isSelected?: boolean;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    isHidden?: boolean;
    isMini?: boolean;
    isMinimal?: boolean; // Show only image and cost
    /** Carte injouable dans l'état actuel (énergie insuffisante, pas votre tour, dieu mort...) :
     *  grisée, mais toujours cliquable pour que le joueur comprenne pourquoi via le message
     *  d'erreur, plutôt que de découvrir l'échec seulement après avoir ciblé et confirmé. */
    isDisabled?: boolean;
}

export const SpellCardUI: React.FC<SpellCardUIProps> = ({
    card, isSelected, onClick, onMouseEnter, onMouseLeave, isHidden, isMini, isMinimal, isDisabled
}) => {
    if (isHidden) {
        return (
            <div
                className={`${isMini ? styles.spellCardWrapperOpponent : styles.spellCardWrapper}`}
                data-hand-card-id={card.id}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                <div className={styles.spellCardBack} style={{
                    width: isMini ? '100px' : '140px',
                    height: isMini ? '140px' : '190px',
                    border: isSelected ? '2px solid #f59e0b' : undefined,
                    boxShadow: isSelected ? '0 0 30px rgba(245, 158, 11, 0.6)' : undefined
                }}>
                    <span className={styles.spellCardBackTitle}>GODS</span>
                </div>
            </div>
        );
    }

    const typeMeta = getCardTypeMeta(card.type);

    return (
        <div
            className={`${isMini ? styles.spellCardWrapperOpponent : styles.spellCardWrapper} ${isSelected ? styles.wrapperSelected : ''} ${isDisabled ? styles.spellCardDisabled : ''}`}
            data-hand-card-id={card.id}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className={`${styles.spellCard} ${isSelected ? styles.spellSelected : ''}`} style={{
                padding: isMinimal ? '4px' : '8px',
                '--element-color': ELEMENT_COLORS[card.element].primary,
                '--type-color': typeMeta.color,
            } as React.CSSProperties}>
                <div className={styles.spellCost}>{card.energyCost}</div>
                {/* Badge de type façon "cadre" (Sort/Piège/Rituel à la Yu-Gi-Oh) : reconnaissable
                 *  au premier coup d'œil, avant même de lire la description. Masqué en isMini
                 *  (main adverse compacte) où la carte est trop petite pour un 2e badge lisible --
                 *  le bandeau de couleur en haut du cadre (voir ::before) suffit à cette taille. */}
                {!isMini && (
                    <div className={styles.spellTypeBadge} title={typeMeta.label}>
                        <span>{typeMeta.icon}</span>
                    </div>
                )}
                {card.imageUrl && (
                    <img
                        src={card.imageUrl}
                        alt={card.name}
                        className={styles.spellImage}
                        style={{ height: isMinimal ? '100%' : '100px', marginBottom: isMinimal ? '0' : '8px' }}
                    />
                )}

                {!isMinimal && (
                    <>
                        <div className={styles.spellTitle} style={{ marginTop: card.imageUrl ? '0' : '10px' }}>{card.name}</div>
                        <div className={styles.spellTypeLabel}>{typeMeta.label}</div>
                        <div className={styles.spellDesc}>{getReadableSpellDescription(card)}</div>
                        {card.energyGain > 0 && (
                            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#10b981', marginTop: '5px' }}>
                                +{card.energyGain} Energy
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
