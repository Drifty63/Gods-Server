import React from 'react';
import { PlayerState, GodState, Element } from '@/types/cards';
import { HeroCard, ImpactReport } from './HeroCard';
import { TurnIndicator } from './TurnIndicator';
import styles from '../GameBoard.module.css';

interface ArenaAreaProps {
    player: PlayerState;
    opponent: PlayerState;
    selectedTargetGods: GodState[];
    /** Le sort en cours vise un allié tombé (résurrection). */
    canTargetDead?: boolean;
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
    canTargetDead,
    onEndTurn,
    onOpenLog,
}) => {
    /**
     * Ids présents dans les DEUX camps (match miroir).
     *
     * Le surlignage de cible comparait les `card.id`, ce qui allumait les deux copies d'un même
     * dieu — le joueur ne pouvait plus savoir laquelle serait touchée. Pour ces ids-là on compare
     * donc l'OBJET d'état, seul discriminant fiable ; partout ailleurs on garde la comparaison
     * par id, insensible à un éventuel remplacement de l'objet d'état (resynchronisation en ligne).
     */
    const mirroredIds = new Set(
        opponent.gods
            .filter(o => player.gods.some(p => p.card.id === o.card.id))
            .map(o => o.card.id)
    );
    const isTargeted = (god: GodState) => selectedTargetGods.some(
        t => mirroredIds.has(god.card.id) ? t === god : t.card.id === god.card.id
    );

    return (
        <div className={styles.arenaContainer}>
            {/* ENEMY ROW */}
            <div className={`${styles.row} ${styles.enemyRow}`} data-tutorial="enemy-gods">
                {opponent.gods.map((god) => (
                    <HeroCard
                        key={`opp-${god.card.id}`}
                        god={god}
                        isTargeted={isTargeted(god)}
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
                        canTargetDead={canTargetDead}
                        isTargeted={isTargeted(god)}
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
