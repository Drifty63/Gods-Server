'use client';

import React from 'react';
import type { GameLogEntry } from '@/types/cards';
import ModalShell from '@/components/ModalShell/ModalShell';
import styles from './CombatLogModal.module.css';

interface CombatLogModalProps {
    isOpen: boolean;
    log: GameLogEntry[];
    myPlayerId: string;
    onClose: () => void;
}

/**
 * Journal de combat : liste les cartes jouées/défaussées tour par tour, pour qu'un joueur
 * puisse vérifier après coup ce que l'adversaire (ou lui-même) a joué s'il l'a manqué.
 */
export default function CombatLogModal({ isOpen, log, myPlayerId, onClose }: CombatLogModalProps) {
    const entries = [...log].reverse();

    return (
        <ModalShell isOpen={isOpen} onCancel={onClose} accentColor="#94a3b8" maxWidth={480}>
            <h2 className={styles.title}>📜 Journal de combat</h2>
            {entries.length === 0 ? (
                <p className={styles.empty}>Aucune action pour l&apos;instant.</p>
            ) : (
                <ul className={styles.entries}>
                    {entries.map((entry, i) => (
                        <li
                            key={i}
                            className={`${styles.entry} ${entry.playerId === myPlayerId ? styles.mine : styles.theirs}`}
                        >
                            <span className={styles.turn}>T{entry.turnNumber}</span>
                            <span className={styles.text}>
                                <strong>{entry.playerName}</strong> {entry.message}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
            <button className={styles.closeButton} onClick={onClose}>
                Fermer
            </button>
        </ModalShell>
    );
}
