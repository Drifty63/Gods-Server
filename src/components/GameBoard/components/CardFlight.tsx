'use client';

import React, { useEffect, useState } from 'react';
import styles from './CardFlight.module.css';

export interface CardFlightData {
    id: number;
    imageUrl: string;
    name: string;
    from: DOMRect;
    to: DOMRect;
}

interface CardFlightProps {
    flight: CardFlightData | null;
    onComplete: () => void;
}

const FLY_DURATION = 480;
const IMPACT_DURATION = 220;

/**
 * Anime une carte qui quitte la main pour se poser sur le dieu qui la lance (technique FLIP :
 * l'élément est positionné/dimensionné à l'arrivée, puis un transform initial le replace
 * visuellement au point de départ avant de le relâcher vers `translate(0,0) scale(1)`).
 */
export const CardFlight: React.FC<CardFlightProps> = ({ flight, onComplete }) => {
    const [phase, setPhase] = useState<'start' | 'flying' | 'impact'>('start');

    useEffect(() => {
        if (!flight) return;
        setPhase('start');
        const raf = requestAnimationFrame(() => setPhase('flying'));
        const impactTimer = setTimeout(() => setPhase('impact'), FLY_DURATION);
        const doneTimer = setTimeout(() => onComplete(), FLY_DURATION + IMPACT_DURATION);
        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(impactTimer);
            clearTimeout(doneTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flight?.id]);

    if (!flight) return null;

    const { from, to } = flight;
    const dx = (from.left + from.width / 2) - (to.left + to.width / 2);
    const dy = (from.top + from.height / 2) - (to.top + to.height / 2);
    const scaleX = from.width / to.width;
    const scaleY = from.height / to.height;

    const cardStyle: React.CSSProperties = {
        left: to.left,
        top: to.top,
        width: to.width,
        height: to.height,
        transform: phase === 'start'
            ? `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY}) rotate(-8deg)`
            : phase === 'flying'
                ? 'translate(0, 0) scale(1.1) rotate(4deg)'
                : 'translate(0, 0) scale(0.85) rotate(0deg)',
        opacity: phase === 'impact' ? 0 : 1,
    };

    const burstStyle: React.CSSProperties = {
        left: to.left + to.width / 2,
        top: to.top + to.height / 2,
    };

    return (
        <div className={styles.flightLayer}>
            <div className={styles.flyingCard} style={cardStyle}>
                <img src={flight.imageUrl} alt={flight.name} />
            </div>
            <div className={`${styles.landingBurst} ${phase === 'impact' ? styles.show : ''}`} style={burstStyle} />
        </div>
    );
};
