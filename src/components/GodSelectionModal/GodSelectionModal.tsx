'use client';

import React from 'react';
import type { GodState } from '@/types/cards';
import Portal from '@/components/Portal/Portal';
import styles from './GodSelectionModal.module.css';

// Map des éléments vers des emojis
const ELEMENT_EMOJI: Record<string, string> = {
    fire: '🔥',
    water: '💧',
    air: '💨',
    earth: '🌿',
    lightning: '⚡',
    light: '☀️',
    darkness: '💀',
};

interface GodSelectionModalProps {
    isOpen: boolean;
    title: string;
    allyGods: GodState[];
    enemyGods: GodState[];
    targetType: 'ally' | 'enemy' | 'any' | null;
    onSelectGod: (godId: string) => void;
    onCancel: () => void;
}

export default function GodSelectionModal({
    isOpen,
    title,
    allyGods,
    enemyGods,
    targetType,
    onSelectGod,
    onCancel
}: GodSelectionModalProps) {
    if (!isOpen) return null;

    // Filtrer les dieux selon le type de cible
    const availableGods: { god: GodState; isAlly: boolean }[] = [];

    if (targetType === 'ally' || targetType === 'any') {
        allyGods.filter(g => !g.isDead).forEach(god => availableGods.push({ god, isAlly: true }));
    }

    if (targetType === 'enemy' || targetType === 'any') {
        enemyGods.filter(g => !g.isDead).forEach(god => availableGods.push({ god, isAlly: false }));
    }

    return (
        <Portal>
            <div className={styles.overlay}>
                <div className={styles.modal}>
                    <h2 className={styles.title}>{title}</h2>
                    <p className={styles.description}>
                        Les cartes du dieu sélectionné seront replacées dans le deck et mélangées.
                    </p>
                    <div className={styles.godsContainer}>
                        {availableGods.length === 0 ? (
                            <p className={styles.noGods}>Aucun dieu disponible</p>
                        ) : (
                            availableGods.map(({ god, isAlly }) => (
                                <button
                                    key={god.card.id}
                                    className={`${styles.godButton} ${isAlly ? styles.allyGod : styles.enemyGod}`}
                                    onClick={() => onSelectGod(god.card.id)}
                                >
                                    <div
                                        className={styles.godImage}
                                        style={{ backgroundImage: `url(${god.card.imageUrl})` }}
                                    />
                                    <span className={styles.godName}>{god.card.name}</span>
                                    <span className={styles.godElement}>
                                        {ELEMENT_EMOJI[god.card.element] || '✨'}
                                    </span>
                                    <span className={styles.godTeam}>
                                        {isAlly ? '🛡️ Allié' : '⚔️ Ennemi'}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                    <button className={styles.cancelButton} onClick={onCancel}>
                        Annuler
                    </button>
                </div>
            </div>
        </Portal>
    );
}

