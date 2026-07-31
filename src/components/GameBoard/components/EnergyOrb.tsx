import React from 'react';
import styles from '../GameBoard.module.css';

interface EnergyOrbProps {
    /** Numéro du tour en cours (gameState.turnNumber) — l'énergie est déjà affichée dans le
     *  cadre deck/défausse, ce bouton sert avant tout à finir le tour donc autant y indiquer
     *  "où on en est" plutôt qu'une info dupliquée. */
    turnNumber: number;
    onClick: () => void;
}

export const EnergyOrb: React.FC<EnergyOrbProps> = ({ turnNumber, onClick }) => {
    return (
        <div className={styles.energyOrbContainer} onClick={onClick} style={{ cursor: 'pointer' }}>
            <div className={styles.energyOrb}>
                {turnNumber}
            </div>
            <div className={styles.energyOrbLabel}>
                Fin de tour
            </div>
        </div>
    );
};
