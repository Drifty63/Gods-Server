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
            data-tutorial={isOpponent ? 'opponent-stats' : 'player-energy'}
        >
            {/* Une seule ligne compacte (icône + nombre) : le format vertical précédent (~87px
             * de haut) n'avait pas la place de tenir dans l'espace libre entre la main et le
             * plateau sur les écrans les plus courts (iPhone SE...), et débordait sur la rangée
             * de dieux la plus proche. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#60a5fa', fontWeight: 'bold', whiteSpace: 'nowrap' }} title="Énergie">
                <span style={{ width: '0.65em', height: '0.65em', flexShrink: 0, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 6px #60a5fa' }} />
                {player.energy}/10
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#c7d2fe', fontWeight: 'bold', whiteSpace: 'nowrap' }} title="Deck" data-tutorial={isOpponent ? undefined : 'player-deck'}>
                🎴{player.deck.length}
            </div>

            <div
                style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#94a3b8', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: onClickDiscard ? 'pointer' : 'default' }}
                data-tutorial={isOpponent ? undefined : 'player-discard'}
                title="Défausse"
                onClick={onClickDiscard}
            >
                🗑️{player.discard.length}
            </div>

            {/* Fatigue : nombre de fois que la pioche a été reformée depuis la corbeille. Chaque
              * recyclage inflige ce nombre en dégâts à TOUS les dieux du camp, d'où l'alerte. */}
            {player.fatigueCounter > 0 && (
                <div
                    className={styles.fatigueBadge}
                    data-tutorial={isOpponent ? undefined : 'player-fatigue'}
                    title={`Fatigue : ${player.fatigueCounter} dégât(s) à tous vos dieux au prochain recyclage`}
                >
                    ⚠️{player.fatigueCounter}
                </div>
            )}
        </div>
    );
};
