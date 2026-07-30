'use client';

import React from 'react';
import Portal from '@/components/Portal/Portal';
import styles from './ModalShell.module.css';

interface ModalShellProps {
    isOpen: boolean;
    onCancel?: () => void;
    accentColor?: string; // Couleur d'accent (bordure) propre à chaque modale
    maxWidth?: number; // Largeur max du panneau en px
    children: React.ReactNode;
}

/**
 * Coquille commune à toutes les modales de choix du jeu : portail unique vers document.body,
 * overlay plein écran et panneau, avec un z-index unique garanti au-dessus de tout élément
 * du plateau (aperçu de sort joué, panneau de détail de carte, etc.).
 */
export default function ModalShell({ isOpen, onCancel, accentColor = '#9b59b6', maxWidth = 450, children }: ModalShellProps) {
    if (!isOpen) return null;

    return (
        <Portal>
            <div
                className={styles.overlay}
                onClick={(e) => {
                    if (e.target === e.currentTarget && onCancel) onCancel();
                }}
            >
                <div
                    className={styles.modal}
                    style={{ '--modal-accent': accentColor, maxWidth } as React.CSSProperties}
                >
                    {children}
                </div>
            </div>
        </Portal>
    );
}
