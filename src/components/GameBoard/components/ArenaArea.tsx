import React from 'react';
import { PlayerState, GodState } from '@/types/cards';
import { HeroCard } from './HeroCard';
import styles from '../GameBoard.module.css';

interface ArenaAreaProps {
    player: PlayerState;
    opponent: PlayerState;
    selectedTargetGods: GodState[];
    onTargetGod: (god: GodState) => void;
}

export const ArenaArea: React.FC<ArenaAreaProps> = ({
    player,
    opponent,
    selectedTargetGods,
    onTargetGod
}) => {
    return (
        <div className={styles.arenaContainer}>
            {/* ENEMY ROW */}
            <div className={`${styles.row} ${styles.enemyRow}`}>
                {opponent.gods.map((god) => (
                    <HeroCard 
                        key={`opp-${god.card.id}`} 
                        god={god} 
                        isTargeted={selectedTargetGods.some(t => t.card.id === god.card.id)}
                        onClick={() => onTargetGod(god)}
                    />
                ))}
            </div>

            {/* PLAYER ROW */}
            <div className={`${styles.row} ${styles.playerRow}`}>
                {player.gods.map((god) => (
                    <HeroCard 
                        key={`ply-${god.card.id}`} 
                        god={god} 
                        isTargeted={selectedTargetGods.some(t => t.card.id === god.card.id)}
                        onClick={() => onTargetGod(god)}
                    />
                ))}
            </div>
        </div>
    );
};
