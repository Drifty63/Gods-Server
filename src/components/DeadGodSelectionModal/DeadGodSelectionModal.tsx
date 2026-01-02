/**
 * @deprecated LEGACY COMPONENT - Remplacé par la sélection directe sur le plateau de jeu
 * 
 * Ce modal était utilisé pour la sélection de dieux morts (Perséphone - Brûlure Rémanente)
 * Il a été remplacé par une interface de sélection directe dans GameBoard.tsx.
 * 
 * Conservé pour référence.
 * 
 * @see GameBoard.tsx - handleDeadGodClick, isSelectingDeadGod
 */
'use client';

import React from 'react';
import type { GodState } from '@/types/cards';
import Portal from '@/components/Portal/Portal';
import styles from './DeadGodSelectionModal.module.css';

interface DeadGodSelectionModalProps {
    isOpen: boolean;
    title: string;
    deadGods: GodState[];
    onSelectGod: (godId: string) => void;
    onCancel: () => void;
}

export default function DeadGodSelectionModal({
    isOpen,
    title,
    deadGods,
    onSelectGod,
    onCancel
}: DeadGodSelectionModalProps) {
    if (!isOpen) return null;

    return (
        <Portal>
            <div className={styles.overlay}>
                <div className={styles.modal}>
                    <h2 className={styles.title}>{title}</h2>
                    <p className={styles.description}>
                        Choisissez un dieu mort à ressusciter en zombie (5 PV, inflige 1 dégât par tour)
                    </p>
                    <div className={styles.godsContainer}>
                        {deadGods.length === 0 ? (
                            <p className={styles.noGods}>Aucun dieu mort disponible</p>
                        ) : (
                            deadGods.map(god => (
                                <button
                                    key={god.card.id}
                                    className={styles.godButton}
                                    onClick={() => onSelectGod(god.card.id)}
                                >
                                    <div
                                        className={styles.godImage}
                                        style={{ backgroundImage: `url(${god.card.imageUrl})` }}
                                    />
                                    <span className={styles.godName}>{god.card.name}</span>
                                    <span className={styles.godElement}>💀</span>
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

