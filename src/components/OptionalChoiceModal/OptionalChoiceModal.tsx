'use client';

import React from 'react';
import ModalShell from '@/components/ModalShell/ModalShell';
import styles from './OptionalChoiceModal.module.css';

interface OptionalChoiceModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    onAccept: () => void;
    onDecline: () => void;
    /** Libellé du bouton "accepter". Par défaut "✅ Oui". */
    acceptLabel?: string;
    /** Libellé du bouton "refuser". Par défaut "❌ Non". */
    declineLabel?: string;
}

export default function OptionalChoiceModal({
    isOpen,
    title,
    description,
    onAccept,
    onDecline,
    acceptLabel = '✅ Oui',
    declineLabel = '❌ Non',
}: OptionalChoiceModalProps) {
    return (
        <ModalShell isOpen={isOpen} onCancel={onDecline} accentColor="#9b59b6">
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.description}>{description}</p>
            <div className={styles.buttonContainer}>
                <button className={styles.declineButton} onClick={onDecline}>
                    {declineLabel}
                </button>
                <button className={styles.acceptButton} onClick={onAccept}>
                    {acceptLabel}
                </button>
            </div>
        </ModalShell>
    );
}
