'use client';

import React from 'react';
import ModalShell from '@/components/ModalShell/ModalShell';
import styles from './LightningActionModal.module.css';

interface LightningActionModalProps {
    isOpen: boolean;
    onSelect: (action: 'apply' | 'remove') => void;
    onCancel: () => void;
}

export default function LightningActionModal({
    isOpen,
    onSelect,
    onCancel
}: LightningActionModalProps) {
    return (
        <ModalShell isOpen={isOpen} onCancel={onCancel} accentColor="#f59e0b">
            <h2 className={styles.title}>⚡ Maîtrise de la Foudre</h2>
            <p className={styles.description}>
                Voulez-vous appliquer l&apos;état Foudre ou le retirer ?
            </p>
            <div className={styles.buttonContainer}>
                <button className={styles.applyButton} onClick={() => onSelect('apply')}>
                    <span className={styles.icon}>🌩️</span>
                    <span className={styles.text}>Appliquer Foudre</span>
                    <span className={styles.hint}>Dégâts doublés au prochain coup</span>
                </button>
                <button className={styles.removeButton} onClick={() => onSelect('remove')}>
                    <span className={styles.icon}>🔋</span>
                    <span className={styles.text}>Retirer Foudre</span>
                    <span className={styles.hint}>Convertir en 1 Énergie</span>
                </button>
            </div>
            <button className={styles.cancelButton} onClick={onCancel}>
                Annuler
            </button>
        </ModalShell>
    );
}
