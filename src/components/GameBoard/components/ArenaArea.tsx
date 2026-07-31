import React from 'react';
import { PlayerState, GodState } from '@/types/cards';
import { HeroCard } from './HeroCard';
import { EnergyOrb } from './EnergyOrb';
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
    myTurn: boolean;
    turnNumber: number;
    onEndTurn: () => void;
    onOpenLog: () => void;
}

export const ArenaArea: React.FC<ArenaAreaProps> = ({
    player,
    opponent,
    selectedTargetGods,
    onTargetGod,
    opponentCasterGodId,
    playerCasterGodId,
    myTurn,
    turnNumber,
    onEndTurn,
    onOpenLog,
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
                        godKey={`opponent-${god.card.id}`}
                        onClick={() => onTargetGod(god)}
                    />
                ))}
            </div>

            {/* BARRE CENTRALE : fin de tour / indicateur de tour / journal — insérée comme un
             * vrai élément du flux entre les deux rangées (plutôt que positionnée en absolu avec
             * un calcul de hauteur à part) pour qu'elle reste toujours exactement entre les deux
             * rangées, quelle que soit leur taille ou l'écart entre elles. */}
            <div className={styles.arenaMiddleBar}>
                <EnergyOrb turnNumber={turnNumber} onClick={onEndTurn} />
                <div className={`${styles.turnIndicator} ${myTurn ? styles.turnMyTurn : styles.turnEnemyTurn}`}>
                    {myTurn ? 'Vos Dieux Attendent Vos Ordres' : 'Tour de l\'Adversaire'}
                </div>
                <button className={styles.logButton} onClick={onOpenLog} aria-label="Journal de combat">
                    📜
                </button>
            </div>

            {/* PLAYER ROW */}
            <div className={`${styles.row} ${styles.playerRow}`}>
                {player.gods.map((god) => (
                    <HeroCard
                        key={`ply-${god.card.id}`}
                        god={god}
                        isTargeted={selectedTargetGods.some(t => t.card.id === god.card.id)}
                        isCaster={!!playerCasterGodId && god.card.id === playerCasterGodId}
                        godKey={`player-${god.card.id}`}
                        onClick={() => onTargetGod(god)}
                    />
                ))}
            </div>
        </div>
    );
};
