import React from 'react';
import { PlayerState, GodState } from '@/types/cards';
import { HeroCard } from './HeroCard';
import styles from '../GameBoard.module.css';

interface ArenaAreaProps {
    player: PlayerState;
    opponent: PlayerState;
    selectedTargetGods: GodState[];
    onTargetGod: (god: GodState) => void;
    /** godId du dieu adverse en train de lancer un sort (carte sélectionnée/jouée par l'IA). */
    opponentCasterGodId?: string | null;
    /** godId de VOTRE dieu en train de lancer un sort (carte sélectionnée/jouée par vous). */
    playerCasterGodId?: string | null;
}

export const ArenaArea: React.FC<ArenaAreaProps> = ({
    player,
    opponent,
    selectedTargetGods,
    onTargetGod,
    opponentCasterGodId,
    playerCasterGodId
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
                        isCaster={!!opponentCasterGodId && god.card.id === opponentCasterGodId}
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
                        isCaster={!!playerCasterGodId && god.card.id === playerCasterGodId}
                        onClick={() => onTargetGod(god)}
                    />
                ))}
            </div>
        </div>
    );
};
