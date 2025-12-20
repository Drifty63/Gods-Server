'use client';

import React from 'react';
import type { GodState } from '@/types/cards';
import Portal from '@/components/Portal/Portal';
import styles from './ZombieDamageModal.module.css';

interface ZombieDamageModalProps {
    isOpen: boolean;
    zombieGod: GodState | null;
    enemyGods: GodState[];
    onSelectTarget: (godId: string | null) => void;  // null = skip
    onSkip: () => void;
}

export default function ZombieDamageModal({
    isOpen,
    zombieGod,
    enemyGods,
    onSelectTarget,
    onSkip
}: ZombieDamageModalProps) {
    if (!isOpen || !zombieGod) return null;

    const aliveEnemies = enemyGods.filter(g => !g.isDead);

    return (
        <Portal>
            <div className={styles.overlay}>
                <div className={styles.modal}>
                    <div className={styles.zombieInfo}>
                        <div
                            className={styles.zombieImage}
                            style={{ backgroundImage: `url(${zombieGod.card.imageUrl})` }}
                        >
                            <div className={styles.zombieOverlay} />
                        </div>
                        <div className={styles.zombieName}>{zombieGod.card.name} 💀</div>
                        <div className={styles.zombieHealth}>{zombieGod.currentHealth}/5 ❤️</div>
                    </div>

                    <h2 className={styles.title}>⚰️ Brûlure Rémanente</h2>
                    <p className={styles.description}>
                        Votre zombie peut infliger 1 dégât à un ennemi. Choisissez une cible ou passez.
                    </p>

                    <div className={styles.targetsContainer}>
                        {aliveEnemies.length === 0 ? (
                            <p className={styles.noTargets}>Aucun ennemi vivant</p>
                        ) : (
                            aliveEnemies.map(enemy => (
                                <button
                                    key={enemy.card.id}
                                    className={styles.targetButton}
                                    onClick={() => onSelectTarget(enemy.card.id)}
                                >
                                    <div
                                        className={styles.targetImage}
                                        style={{ backgroundImage: `url(${enemy.card.imageUrl})` }}
                                    />
                                    <span className={styles.targetName}>{enemy.card.name}</span>
                                    <span className={styles.targetHealth}>{enemy.currentHealth} ❤️</span>
                                </button>
                            ))
                        )}
                    </div>

                    <button className={styles.skipButton} onClick={onSkip}>
                        ⏭️ Passer (ne pas attaquer)
                    </button>
                </div>
            </div>
        </Portal>
    );
}

