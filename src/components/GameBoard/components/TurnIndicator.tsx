import React from 'react';
import styles from '../GameBoard.module.css';

interface TurnIndicatorProps {
    turnNumber: number;
}

/**
 * Numéro du tour en cours. Purement informatif.
 *
 * Remplace l'ancien `EnergyOrb`, dont le nom mentait depuis une refonte : il n'affichait plus
 * l'énergie (celle-ci vit dans la barre deck/défausse) mais servait de **bouton de fin de
 * tour**, sous la forme d'une pastille de 43 px surmontée d'un libellé de 8 px. Personne ne
 * pouvait deviner que c'était l'unique moyen de passer la main. La fin de tour est désormais un
 * vrai bouton (voir `.endTurnButton`), et cette pastille redevient ce qu'elle prétend être.
 */
export const TurnIndicator: React.FC<TurnIndicatorProps> = ({ turnNumber }) => (
    <div className={styles.turnCounter} title={`Tour ${turnNumber}`}>
        <span className={styles.turnCounterLabel}>Tour</span>
        <span className={styles.turnCounterValue}>{turnNumber}</span>
    </div>
);
