import React from 'react';
import { SpellCard } from '@/types/cards';
import styles from '../GameBoard.module.css';

interface SpellCardUIProps {
    card: SpellCard;
    isSelected?: boolean;
    onClick?: () => void;
    isHidden?: boolean;
    isMini?: boolean;
}

export const SpellCardUI: React.FC<SpellCardUIProps> = ({ card, isSelected, onClick, isHidden, isMini }) => {
    if (isHidden) {
        return (
            <div 
                className={`${isMini ? styles.spellCardWrapperOpponent : styles.spellCardWrapper}`} 
                onClick={onClick}
            >
                <div className={styles.spellCardBack} style={{ 
                    width: isMini ? '100px' : '160px', 
                    height: isMini ? '140px' : '220px', 
                    backgroundImage: 'url(/images/card-back.png)', 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center',
                    border: isSelected ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.2)',
                    boxShadow: isSelected ? '0 0 30px rgba(245, 158, 11, 0.6)' : '0 4px 10px rgba(0,0,0,0.5)'
                }}>
                    <span style={{ opacity: 0 }}>G</span>
                </div>
            </div>
        );
    }

    return (
        <div 
            className={`${isMini ? styles.spellCardWrapperOpponent : styles.spellCardWrapper}`} 
            onClick={onClick}
        >
            <div className={`${styles.spellCard} ${isSelected ? styles.spellSelected : ''}`}>
                <div className={styles.spellCost}>{card.energyCost}</div>
                {card.imageUrl && (
                    <img src={card.imageUrl} alt={card.name} className={styles.spellImage} />
                )}
                <div className={styles.spellTitle} style={{ marginTop: card.imageUrl ? '0' : '10px' }}>{card.name}</div>
                <div className={styles.spellDesc}>{card.description}</div>
                {card.energyGain > 0 && (
                    <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#10b981', marginTop: '5px' }}>
                        +{card.energyGain} Energy
                    </div>
                )}
            </div>
        </div>
    );
};
