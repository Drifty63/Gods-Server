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
            <div style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '8px', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '1px' }}>
                End Turn
            </div>
        </div>
    );
};
