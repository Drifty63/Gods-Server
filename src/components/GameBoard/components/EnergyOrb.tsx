import React from 'react';
import styles from '../GameBoard.module.css';

interface EnergyOrbProps {
    energy: number;
    onClick: () => void;
}

export const EnergyOrb: React.FC<EnergyOrbProps> = ({ energy, onClick }) => {
    return (
        <div className={styles.energyOrbContainer} onClick={onClick} style={{ cursor: 'pointer' }}>
            <div className={styles.energyOrb}>
                {energy}
            </div>
            {/* Optional label below the orb */}
            <div className={styles.energyOrbLabel}>
                Fin de tour
            </div>
        </div>
    );
};
