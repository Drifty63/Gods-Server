import React from 'react';
import { SpellCard } from '@/types/cards';
import { SpellCardUI } from './SpellCardUI';
import styles from '../GameBoard.module.css';

interface HandAreaProps {
    hand: SpellCard[];
    selectedCard: SpellCard | null;
    onSelectCard: (card: SpellCard) => void;
}

export const HandArea: React.FC<HandAreaProps> = ({ hand, selectedCard, onSelectCard }) => {
    return (
        <div className={styles.handArea}>
            {hand.map((card, idx) => (
                <SpellCardUI 
                    key={`${card.id}-${idx}`}
                    card={card}
                    isSelected={selectedCard?.id === card.id}
                    onClick={() => onSelectCard(card)}
                    isHidden={card.isHiddenFromOwner}
                />
            ))}
        </div>
    );
};
