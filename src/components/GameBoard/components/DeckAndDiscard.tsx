import React from 'react';
import { PlayerState } from '@/types/cards';
import styles from '../GameBoard.module.css';

interface DeckAndDiscardProps {
    player: PlayerState;
    isOpponent?: boolean;
    onClickDiscard?: () => void;
}

export const DeckAndDiscard: React.FC<DeckAndDiscardProps> = ({ player, isOpponent = false, onClickDiscard }) => {
    return (
        <div
            className={`${styles.deckAndDiscard} ${isOpponent ? styles.deckAndDiscardOpponent : styles.deckAndDiscardPlayer}`}
        >
            {/* Une seule ligne compacte (icône + nombre) : le format vertical précédent (~87px
             * de haut) n'avait pas la place de tenir dans l'espace libre entre la main et le
             * plateau sur les écrans les plus courts (iPhone SE...), et débordait sur la rangée
             * de dieux la plus proche. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#60a5fa', fontWeight: 'bold', whiteSpace: 'nowrap' }} title="Énergie">
                <span style={{ width: '0.65em', height: '0.65em', flexShrink: 0, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 6px #60a5fa' }} />
                {player.energy}/10
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#c7d2fe', fontWeight: 'bold', whiteSpace: 'nowrap' }} title="Deck">
                🎴{player.deck.length}
            </div>

            <div
                style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#94a3b8', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: onClickDiscard ? 'pointer' : 'default' }}
                title="Défausse"
                onClick={onClickDiscard}
            >
                🗑️{player.discard.length}
            </div>

            {player.fatigueCounter > 0 && (
                <div style={{ color: '#ef4444', fontWeight: 'bold', whiteSpace: 'nowrap' }} title="Fatigue">
                    ⚠️{player.fatigueCounter}
                </div>
            )}
        </div>
    );
};
