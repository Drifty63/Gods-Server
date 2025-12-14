'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GodState } from '@/types/cards';
import { ELEMENT_SYMBOLS } from '@/game-engine/ElementSystem';
import styles from './HealDistributionModal.module.css';

interface HealDistributionModalProps {
    isOpen: boolean;
    totalHeal: number;
    allies: GodState[];
    onConfirm: (distribution: { godId: string; amount: number }[]) => void;
    onCancel: () => void;
}

export default function HealDistributionModal({
    isOpen,
    totalHeal,
    allies,
    onConfirm,
    onCancel
}: HealDistributionModalProps) {
    const [distribution, setDistribution] = useState<Record<string, number>>({});
    const [mounted, setMounted] = useState(false);

    // Attendre le montage côté client pour le portal
    useEffect(() => {
        setMounted(true);
    }, []);

    // Reset distribution when modal opens
    useEffect(() => {
        if (isOpen) {
            const initial: Record<string, number> = {};
            allies.forEach(ally => {
                initial[ally.card.id] = 0;
            });
            setDistribution(initial);
        }
    }, [isOpen, allies]);

    if (!isOpen || !mounted) return null;

    const totalAssigned = Object.values(distribution).reduce((sum, val) => sum + val, 0);
    const remaining = totalHeal - totalAssigned;

    const handleIncrement = (godId: string) => {
        if (remaining > 0) {
            setDistribution(prev => ({
                ...prev,
                [godId]: (prev[godId] || 0) + 1
            }));
        }
    };

    const handleDecrement = (godId: string) => {
        if (distribution[godId] > 0) {
            setDistribution(prev => ({
                ...prev,
                [godId]: prev[godId] - 1
            }));
        }
    };

    const handleConfirm = () => {
        const result = Object.entries(distribution)
            .filter(([_, amount]) => amount > 0)
            .map(([godId, amount]) => ({ godId, amount }));
        onConfirm(result);
    };

    const livingAllies = allies.filter(a => !a.isDead);

    const modalContent = (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2 className={styles.title}>💚 Répartir les soins</h2>
                <p className={styles.instruction}>
                    Répartissez <strong>{totalHeal}</strong> points de soin entre vos alliés
                </p>
                <p className={styles.remaining}>
                    Restant : <span className={remaining > 0 ? styles.positive : styles.zero}>{remaining}</span>
                </p>

                <div className={styles.alliesGrid}>
                    {livingAllies.map(ally => {
                        const currentHeal = distribution[ally.card.id] || 0;
                        const missingHp = ally.card.maxHealth - ally.currentHealth;
                        const poisonStacks = ally.statusEffects
                            .filter(s => s.type === 'poison')
                            .reduce((sum, s) => sum + s.stacks, 0);

                        return (
                            <div key={ally.card.id} className={styles.allyCard}>
                                <div className={styles.allyHeader}>
                                    <span className={styles.element}>
                                        {ELEMENT_SYMBOLS[ally.card.element]}
                                    </span>
                                    <span className={styles.allyName}>
                                        {ally.card.name.split(',')[0]}
                                    </span>
                                </div>
                                <div className={styles.allyStats}>
                                    <span className={styles.hp}>
                                        ❤️ {ally.currentHealth}/{ally.card.maxHealth}
                                    </span>
                                    {poisonStacks > 0 && (
                                        <span className={styles.poison}>🧪 {poisonStacks}</span>
                                    )}
                                </div>
                                {missingHp > 0 && (
                                    <div className={styles.missingHp}>
                                        Blessé : -{missingHp} PV
                                    </div>
                                )}
                                <div className={styles.controls}>
                                    <button
                                        className={styles.decrementButton}
                                        onClick={() => handleDecrement(ally.card.id)}
                                        disabled={currentHeal === 0}
                                    >
                                        -
                                    </button>
                                    <span className={styles.healAmount}>{currentHeal}</span>
                                    <button
                                        className={styles.incrementButton}
                                        onClick={() => handleIncrement(ally.card.id)}
                                        disabled={remaining === 0}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className={styles.actions}>
                    <button
                        className={styles.cancelButton}
                        onClick={onCancel}
                    >
                        ❌ Annuler
                    </button>
                    <button
                        className={styles.confirmButton}
                        onClick={handleConfirm}
                        disabled={totalAssigned === 0}
                    >
                        ✅ Confirmer ({totalAssigned} soins)
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
