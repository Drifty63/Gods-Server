'use client';

import React from 'react';
import type { GodState } from '@/types/cards';
import ModalShell from '@/components/ModalShell/ModalShell';
import styles from './ZombieDamageModal.module.css';

interface ZombieDamageModalProps {
    isOpen: boolean;
    zombieGod: GodState | null;
    enemyGods: GodState[];
    onSelectTarget: (godId: string) => void;
    /** Uniquement utilisé quand il n'y a plus aucune cible vivante à attaquer. */
    onSkip: () => void;
}

export default function ZombieDamageModal({
    isOpen,
    zombieGod,
    enemyGods,
    onSelectTarget,
    onSkip
}: ZombieDamageModalProps) {
    const aliveEnemies = enemyGods.filter(g => !g.isDead);
    // L'attaque du zombie est obligatoire tant qu'une cible existe : impossible de fermer la
    // modale (clic sur le fond, bouton passer) sans avoir choisi. On ne "passe" automatiquement
    // que s'il n'y a plus aucun ennemi vivant à cibler.
    const hasTargets = aliveEnemies.length > 0;

    return (
        <ModalShell isOpen={isOpen && !!zombieGod} onCancel={hasTargets ? undefined : onSkip} accentColor="#8e44ad" maxWidth={550}>
            {zombieGod && (
                <>
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
                        {hasTargets
                            ? 'Votre zombie inflige obligatoirement 1 dégât ténèbres à un ennemi. Choisissez la cible.'
                            : "Votre zombie n'a aucune cible disponible ce tour-ci."}
                    </p>

                    <div className={styles.targetsContainer}>
                        {!hasTargets ? (
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

                    {!hasTargets && (
                        <button className={styles.skipButton} onClick={onSkip}>
                            Continuer
                        </button>
                    )}
                </>
            )}
        </ModalShell>
    );
}

