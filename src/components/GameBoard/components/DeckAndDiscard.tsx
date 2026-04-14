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
            className={styles.deckAndDiscard} 
            style={{ 
                [isOpponent ? 'top' : 'bottom']: '10px', 
                left: '10px',
                position: 'absolute'
            }}
        >
            {/* Energy */}
            <div style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px', 
                display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 10px #60a5fa' }} />
                Énergie: {player.energy} / 10
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#f8fafc', fontSize: '0.9rem' }}>
                <div style={{ width: '32px', height: '40px', background: 'linear-gradient(135deg, #4f46e5, #312e81)', borderRadius: '4px', border: '1px solid #6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {player.deck.length}
                </div>
                <span>Deck</span>
            </div>
            
            {player.fatigueCounter > 0 && (
                <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    Fatigue : {player.fatigueCounter}
                </div>
            )}

            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94a3b8', fontSize: '0.9rem', cursor: onClickDiscard ? 'pointer' : 'default' }} onClick={onClickDiscard}>
                <div style={{ width: '32px', height: '40px', background: 'rgba(0, 0, 0, 0.5)', borderRadius: '4px', border: '1px solid #475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {player.discard.length}
                </div>
                <span>Corbeille</span>
            </div>
        </div>
    );
};
