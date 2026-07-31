import React, { useEffect, useRef, useState } from 'react';
import { GodState } from '@/types/cards';
import { getStatusIcon } from '@/data/statusIcons';
import { ELEMENT_COLORS } from '@/game-engine/ElementSystem';
import styles from '../GameBoard.module.css';

interface HeroCardProps {
    god: GodState;
    isTargeted: boolean;
    /** Le dieu qui lance le sort actuellement sélectionné/en cours de jeu (par le joueur ou
     *  l'adversaire) : mis en avant avec une bordure dorée distincte de la cible (rouge), pour
     *  qu'on comprenne d'un coup d'œil qui lance quoi. */
    isCaster?: boolean;
    /** Identifiant stable (côté-préfixé, ex "player-zeus") utilisé pour retrouver cet élément
     *  DOM via document.querySelector lors de l'animation de vol de carte (voir CardFlight). */
    godKey?: string;
    onClick: () => void;
}

interface Impact {
    key: number;
    kind: 'damage' | 'heal';
    amount: number;
}

export const HeroCard: React.FC<HeroCardProps> = ({ god, isTargeted, isCaster, godKey, onClick }) => {
    const healthPercent = Math.max(0, (god.currentHealth / god.card.maxHealth) * 100);

    // Effet visuel temporaire (flash coloré + nombre flottant) quand le dieu prend des dégâts
    // ou est soigné, pour que l'effet d'une carte se voie immédiatement sur la cible.
    const [impact, setImpact] = useState<Impact | null>(null);
    const prevHealthRef = useRef(god.currentHealth);
    const impactKeyRef = useRef(0);

    useEffect(() => {
        const prev = prevHealthRef.current;
        const delta = god.currentHealth - prev;
        prevHealthRef.current = god.currentHealth;

        if (delta === 0) return;

        impactKeyRef.current += 1;
        setImpact({
            key: impactKeyRef.current,
            kind: delta < 0 ? 'damage' : 'heal',
            amount: Math.abs(delta),
        });

        const timer = setTimeout(() => setImpact(null), 650);
        return () => clearTimeout(timer);
    }, [god.currentHealth]);

    const elementEmojis: Record<string, string> = {
        'fire': '🔥',
        'air': '💨',
        'earth': '🌿',
        'lightning': '⚡',
        'water': '💧',
        'light': '☀️',
        'darkness': '💀'
    };

    // Contour coloré par élément (comme les autres jeux de cartes) : la couleur d'identité du
    // dieu (son propre élément), pas sa faiblesse — cohérent avec ELEMENT_COLORS déjà utilisé en
    // sélection d'équipe. Les états d'interaction (ciblé/lanceur/mort) restent prioritaires,
    // portés par leurs propres classes CSS plus spécifiques.
    const elementColor = ELEMENT_COLORS[god.card.element].primary;

    return (
        <div
            className={`${styles.heroCard} ${god.isDead ? styles.dead : ''} ${isTargeted ? styles.targeted : ''} ${isCaster ? styles.caster : ''}`}
            data-god-key={godKey}
            style={{ '--element-color': elementColor } as React.CSSProperties}
            onClick={onClick}
        >
            <div className={styles.elementBadge}>
                {elementEmojis[god.card.weakness]}
            </div>

            <div className={styles.statusContainer}>
                {god.statusEffects.map((status, idx) => (
                    <div key={idx} className={styles.statusBadge}>
                        {getStatusIcon(status.type)}
                        {status.stacks > 1 && <span className={styles.stacksCount}>{status.stacks}</span>}
                    </div>
                ))}
            </div>

            <img
                src={god.card.imageUrl}
                alt={god.card.name}
                className={styles.heroImage}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />

            {impact && (
                <div
                    key={impact.key}
                    className={`${styles.impactOverlay} ${impact.kind === 'damage' ? styles.impactDamage : styles.impactHeal}`}
                >
                    <span className={styles.impactNumber}>
                        {impact.kind === 'damage' ? '-' : '+'}{impact.amount}
                    </span>
                </div>
            )}

            {/* Réticule de ciblage : rend explicite qu'un dieu est déjà retenu comme cible,
             *  notamment en pleine sélection multi-cibles (en attente d'une 2e cible par ex.),
             *  où la seule bordure rouge de .targeted pouvait passer inaperçue. */}
            {isTargeted && (
                <div className={styles.targetMarker}>🎯</div>
            )}

            <div className={styles.heroInfo}>
                <div className={styles.heroName}>{god.card.name}</div>
                <div className={styles.healthTrack}>
                    <div className={styles.healthFill} style={{ width: `${healthPercent}%` }} />
                    <span className={styles.healthText}>{god.currentHealth}/{god.card.maxHealth}</span>
                </div>
            </div>
        </div>
    );
};
