import React from 'react';
import { SpellCard } from '@/types/cards';
import { SpellCardUI } from './SpellCardUI';
import styles from '../GameBoard.module.css';

interface HandAreaProps {
    hand: SpellCard[];
    selectedCard: SpellCard | null;
    onSelectCard: (card: SpellCard) => void;
    onHoverCard: (card: SpellCard | null) => void;
    /** Détermine si une carte est jouable dans l'état actuel (tour, énergie, dieu vivant...),
     *  pour la griser visuellement plutôt que de laisser le joueur découvrir l'échec après coup. */
    isCardPlayable?: (card: SpellCard) => boolean;
}

export const HandArea: React.FC<HandAreaProps> = ({ hand, selectedCard, onSelectCard, onHoverCard, isCardPlayable }) => {
    return (
        <div className={styles.handArea}>
            {hand.map((card, idx) => (
                <SpellCardUI
                    key={`${card.id}-${idx}`}
                    card={card}
                    isSelected={selectedCard?.id === card.id}
                    onClick={() => onSelectCard(card)}
                    onMouseEnter={() => onHoverCard(card)}
                    onMouseLeave={() => onHoverCard(null)}
                    isHidden={card.isHiddenFromOwner}
                    isMinimal={true}
                    isDisabled={isCardPlayable ? !isCardPlayable(card) : false}
                />
            ))}
        </div>
    );
};
