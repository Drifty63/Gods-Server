import React from 'react';
import { PlayerState, GodState, Element } from '@/types/cards';
import { HeroCard, ImpactReport } from './HeroCard';
import { TurnIndicator } from './TurnIndicator';
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
    /** Élément du sort en cours de résolution, pour teinter les impacts et détecter les critiques. */
    incomingElement?: Element | null;
    /** Remonté par les cartes touchées, pour que le plateau secoue l'écran à la hauteur du coup. */
    onImpact?: (report: ImpactReport) => void;
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
    incomingElement,
    onImpact,
    myTurn,
    turnNumber,
    onEndTurn,
    onOpenLog,
}) => {
    return (
        <div className={styles.arenaContainer}>
            {/* ENEMY ROW */}
            <div className={`${styles.row} ${styles.enemyRow}`} data-tutorial="enemy-gods">
                {opponent.gods.map((god) => (
                    <HeroCard
                        key={`opp-${god.card.id}`}
                        god={god}
                        isTargeted={selectedTargetGods.some(t => t.card.id === god.card.id)}
                        isCaster={!!opponentCasterGodId && god.card.id === opponentCasterGodId}
                        godKey={`opponent-${god.card.id}`}
                        incomingElement={incomingElement}
                        onImpact={onImpact}
                        onClick={() => onTargetGod(god)}
                    />
                ))}
            </div>

            {/* BARRE CENTRALE : fin de tour / indicateur de tour / journal — insérée comme un
             * vrai élément du flux entre les deux rangées (plutôt que positionnée en absolu avec
             * un calcul de hauteur à part) pour qu'elle reste toujours exactement entre les deux
             * rangées, quelle que soit leur taille ou l'écart entre elles. */}
            <div className={styles.arenaMiddleBar}>
                <TurnIndicator turnNumber={turnNumber} />

                {/* Quand c'est au joueur, la barre porte l'ACTION plutôt qu'un simple constat :
                    « Vos Dieux Attendent Vos Ordres » occupait toute la place sans jamais dire
                    comment passer la main. Le bouton prend le relais ; le texte d'attente ne
                    s'affiche que pendant le tour adverse, où il n'y a rien à faire. */}
                {myTurn ? (
                    <button
                        className={styles.endTurnButton}
                        onClick={onEndTurn}
                        data-tutorial="end-turn"
                        aria-label="Terminer le tour"
                    >
                        Terminer le tour
                    </button>
                ) : (
                    <div className={`${styles.turnIndicator} ${styles.turnEnemyTurn}`}>
                        Tour de l&apos;Adversaire
                    </div>
                )}

                <button
                    className={styles.logButton}
                    onClick={onOpenLog}
                    data-tutorial="combat-log"
                    aria-label="Journal de combat"
                >
                    📜
                </button>
            </div>

            {/* PLAYER ROW */}
            <div className={`${styles.row} ${styles.playerRow}`} data-tutorial="player-gods">
                {player.gods.map((god) => (
                    <HeroCard
                        key={`ply-${god.card.id}`}
                        god={god}
                        isTargeted={selectedTargetGods.some(t => t.card.id === god.card.id)}
                        isCaster={!!playerCasterGodId && god.card.id === playerCasterGodId}
                        godKey={`player-${god.card.id}`}
                        incomingElement={incomingElement}
                        onImpact={onImpact}
                        onClick={() => onTargetGod(god)}
                    />
                ))}
            </div>
        </div>
    );
};
