'use client';

import React from 'react';
import type { GodState } from '@/types/cards';
import ModalShell from '@/components/ModalShell/ModalShell';
import styles from './DeadGodSelectionModal.module.css';

interface DeadGodSelectionModalProps {
    isOpen: boolean;
    title: string;
    /**
     * Ce que la carte va réellement faire.
     *
     * La modale est partagée entre le zombie de Perséphone et la résurrection de Déméter,
     * et annonçait toujours un zombie : « Graine de vie » promettait donc une invocation de
     * 5 PV là où elle ramène vraiment le dieu avec 8 PV.
     */
    description?: string;
    deadGods: GodState[];
    onSelectGod: (godId: string) => void;
    onCancel: () => void;
}

export default function DeadGodSelectionModal({
    isOpen,
    title,
    description,
    deadGods,
    onSelectGod,
    onCancel
}: DeadGodSelectionModalProps) {
    return (
        <ModalShell isOpen={isOpen} onCancel={onCancel} accentColor="#8e44ad" maxWidth={600}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.description}>
                {description ?? 'Choisissez un dieu tombé.'}
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
        </ModalShell>
    );
}

