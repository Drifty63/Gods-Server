'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import styles from './OptionalChoiceModal.module.css';

interface OptionalChoiceModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    onAccept: () => void;
    onDecline: () => void;
}

export default function OptionalChoiceModal({
    isOpen,
    title,
    description,
    onAccept,
    onDecline
}: OptionalChoiceModalProps) {
    if (!isOpen) return null;

    // Utiliser createPortal pour monter le modal dans document.body
    // afin qu'il passe au-dessus de tous les autres éléments
    if (typeof window === 'undefined') return null;

    return createPortal(
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2 className={styles.title}>{title}</h2>
                <p className={styles.description}>{description}</p>
                <div className={styles.buttonContainer}>
                    <button
                        className={styles.declineButton}
                        onClick={onDecline}
                    >
                        ❌ Non
                    </button>
                    <button
                        className={styles.acceptButton}
                        onClick={onAccept}
                    >
                        ✅ Oui
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
