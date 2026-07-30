'use client';

import React from 'react';
import ModalShell from '@/components/ModalShell/ModalShell';
import styles from './PlayerSelectionModal.module.css';

interface PlayerSelectionModalProps {
    isOpen: boolean;
    title: string;
    onSelectSelf: () => void;
    onSelectOpponent: () => void;
    onCancel: () => void;
}

export default function PlayerSelectionModal({
    isOpen,
    title,
    onSelectSelf,
    onSelectOpponent,
    onCancel
}: PlayerSelectionModalProps) {
    return (
        <ModalShell isOpen={isOpen} onCancel={onCancel} accentColor="#3b82f6">
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.description}>
                Choisissez qui va mélanger sa défausse dans son deck (sans pénalité de fatigue)
            </p>
            <div className={styles.buttonContainer}>
                <button className={styles.selfButton} onClick={onSelectSelf}>
                    <span className={styles.buttonIcon}>👤</span>
                    <span className={styles.buttonText}>Moi-même</span>
                    <span className={styles.buttonHint}>Recycler mon deck</span>
                </button>
                <button className={styles.opponentButton} onClick={onSelectOpponent}>
                    <span className={styles.buttonIcon}>👊</span>
                    <span className={styles.buttonText}>Adversaire</span>
                    <span className={styles.buttonHint}>Recycler son deck</span>
                </button>
            </div>
            <button className={styles.cancelButton} onClick={onCancel}>
                Annuler
            </button>
        </ModalShell>
    );
}
