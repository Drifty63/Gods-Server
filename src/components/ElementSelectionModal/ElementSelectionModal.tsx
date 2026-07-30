'use client';

import React from 'react';
import ModalShell from '@/components/ModalShell/ModalShell';
import styles from './ElementSelectionModal.module.css';
import { Element } from '@/types/cards';
import { ELEMENT_SYMBOLS } from '@/game-engine/ElementSystem';

interface ElementSelectionModalProps {
    isOpen: boolean;
    onSelect: (element: Element) => void;
    onCancel: () => void;
}

const ELEMENTS: { id: Element; name: string; color: string }[] = [
    { id: 'fire', name: 'Feu', color: '#ef4444' },
    { id: 'water', name: 'Eau', color: '#3b82f6' },
    { id: 'earth', name: 'Terre', color: '#10b981' },
    { id: 'air', name: 'Air', color: '#8b5cf6' },
    { id: 'lightning', name: 'Foudre', color: '#f59e0b' },
];

export default function ElementSelectionModal({
    isOpen,
    onSelect,
    onCancel
}: ElementSelectionModalProps) {
    return (
        <ModalShell isOpen={isOpen} onCancel={onCancel} accentColor="#f59e0b">
            <h2 className={styles.title}>⭐ Coup Critique</h2>
            <p className={styles.description}>
                Sélectionnez l&apos;élément de faiblesse à appliquer à la cible
            </p>
            <div className={styles.grid}>
                {ELEMENTS.map((el) => (
                    <button
                        key={el.id}
                        className={styles.elementButton}
                        style={{ '--el-color': el.color } as React.CSSProperties}
                        onClick={() => onSelect(el.id)}
                    >
                        <span className={styles.symbol}>{ELEMENT_SYMBOLS[el.id]}</span>
                        <span className={styles.name}>{el.name}</span>
                    </button>
                ))}
            </div>
            <button className={styles.cancelButton} onClick={onCancel}>
                Annuler
            </button>
        </ModalShell>
    );
}
