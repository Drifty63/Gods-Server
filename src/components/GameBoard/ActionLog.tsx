/**
 * ActionLog - Historique des actions de jeu
 * 
 * Affiche les dernières actions effectuées pendant la partie
 * (cartes jouées, dégâts infligés, soins, effets de statut, etc.)
 * 
 * @component
 */
'use client';

import { memo, useRef, useEffect } from 'react';
import styles from './ActionLog.module.css';

export interface ActionLogEntry {
    id: string;
    timestamp: number;
    type: 'play_card' | 'damage' | 'heal' | 'status' | 'turn' | 'death' | 'system';
    message: string;
    player?: 'player1' | 'player2';
    icon?: string;
}

interface ActionLogProps {
    entries: ActionLogEntry[];
    isExpanded?: boolean;
    maxEntries?: number;
    onToggleExpand?: () => void;
}

function ActionLog({
    entries,
    isExpanded = false,
    maxEntries = 50,
    onToggleExpand
}: ActionLogProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll vers le bas quand de nouvelles entrées arrivent
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [entries.length]);

    const displayedEntries = entries.slice(-maxEntries);

    const getIconForType = (type: ActionLogEntry['type'], customIcon?: string): string => {
        if (customIcon) return customIcon;
        switch (type) {
            case 'play_card': return '🃏';
            case 'damage': return '⚔️';
            case 'heal': return '💚';
            case 'status': return '✨';
            case 'turn': return '🔄';
            case 'death': return '💀';
            case 'system': return '📢';
            default: return '•';
        }
    };

    const getEntryClass = (entry: ActionLogEntry): string => {
        const classes = [styles.entry];
        if (entry.player === 'player1') classes.push(styles.player1);
        if (entry.player === 'player2') classes.push(styles.player2);
        if (entry.type === 'death') classes.push(styles.death);
        if (entry.type === 'system') classes.push(styles.system);
        return classes.join(' ');
    };

    if (!isExpanded) {
        // Mode réduit : affiche seulement la dernière action
        const lastEntry = displayedEntries[displayedEntries.length - 1];
        return (
            <div className={styles.containerCompact} onClick={onToggleExpand}>
                {lastEntry ? (
                    <span className={styles.compactEntry}>
                        <span className={styles.icon}>{getIconForType(lastEntry.type, lastEntry.icon)}</span>
                        <span className={styles.message}>{lastEntry.message}</span>
                    </span>
                ) : (
                    <span className={styles.empty}>Début de la partie</span>
                )}
                <span className={styles.expandHint}>📜</span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>📜 Historique</h3>
                <button className={styles.closeButton} onClick={onToggleExpand}>×</button>
            </div>
            <div className={styles.list} ref={scrollRef}>
                {displayedEntries.length === 0 ? (
                    <p className={styles.empty}>Aucune action pour le moment</p>
                ) : (
                    displayedEntries.map((entry) => (
                        <div key={entry.id} className={getEntryClass(entry)}>
                            <span className={styles.icon}>{getIconForType(entry.type, entry.icon)}</span>
                            <span className={styles.message}>{entry.message}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// Mémoiser pour éviter les re-renders inutiles
export default memo(ActionLog);

/**
 * Hook utilitaire pour gérer l'historique des actions
 */
export function createActionLogEntry(
    type: ActionLogEntry['type'],
    message: string,
    options?: Partial<Omit<ActionLogEntry, 'id' | 'timestamp' | 'type' | 'message'>>
): ActionLogEntry {
    return {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        type,
        message,
        ...options
    };
}
