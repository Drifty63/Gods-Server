'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { GodCard } from '@/types/cards';
import { ALL_GODS, getVisibleGods, getGodById } from '@/data/gods';
import { ELEMENT_COLORS, ELEMENT_SYMBOLS, ELEMENT_NAMES } from '@/game-engine/ElementSystem';
import styles from './TeamSelection.module.css';

interface TeamSelectionProps {
    onTeamsSelected: (playerTeam: string[], aiTeam: string[]) => void;
    isCreator?: boolean;
}

export default function TeamSelection({ onTeamsSelected, isCreator = false }: TeamSelectionProps) {
    const [playerTeam, setPlayerTeam] = useState<string[]>([]);
    const [aiTeam, setAiTeam] = useState<string[]>([]);
    const [phase, setPhase] = useState<'player' | 'ai'>('player');

    // Filtrer les dieux selon le statut créateur
    const visibleGods = useMemo(() => getVisibleGods(isCreator), [isCreator]);

    const maxTeamSize = 4;

    const isGodSelected = (godId: string) => {
        return playerTeam.includes(godId) || aiTeam.includes(godId);
    };

    const handleGodClick = (godId: string) => {
        if (phase === 'player') {
            if (playerTeam.includes(godId)) {
                setPlayerTeam(playerTeam.filter(id => id !== godId));
            } else if (playerTeam.length < maxTeamSize && !aiTeam.includes(godId)) {
                setPlayerTeam([...playerTeam, godId]);
            }
        } else {
            if (aiTeam.includes(godId)) {
                setAiTeam(aiTeam.filter(id => id !== godId));
            } else if (aiTeam.length < maxTeamSize && !playerTeam.includes(godId)) {
                setAiTeam([...aiTeam, godId]);
            }
        }
    };

    const handleConfirmPlayerTeam = () => {
        if (playerTeam.length === maxTeamSize) {
            setPhase('ai');
        }
    };

    const handleRandomAiTeam = () => {
        const availableGods = visibleGods
            .filter(g => !playerTeam.includes(g.id))
            .map(g => g.id);

        const shuffled = [...availableGods].sort(() => Math.random() - 0.5);
        setAiTeam(shuffled.slice(0, maxTeamSize));
    };

    const handleStartGame = () => {
        if (playerTeam.length === maxTeamSize && aiTeam.length === maxTeamSize) {
            onTeamsSelected(playerTeam, aiTeam);
        }
    };

    const renderGodCard = (god: GodCard) => {
        const isSelected = phase === 'player'
            ? playerTeam.includes(god.id)
            : aiTeam.includes(god.id);
        const isDisabled = phase === 'player'
            ? aiTeam.includes(god.id)
            : playerTeam.includes(god.id);
        const colors = ELEMENT_COLORS[god.element];

        return (
            <div
                key={god.id}
                className={`${styles.godCard} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`}
                style={{
                    '--element-color': colors.primary,
                    '--element-gradient': colors.gradient,
                } as React.CSSProperties}
                onClick={() => !isDisabled && handleGodClick(god.id)}
            >
                <div className={styles.godHeader}>
                    <span className={styles.godElement} title={ELEMENT_NAMES[god.element]}>
                        {ELEMENT_SYMBOLS[god.element]}
                    </span>
                    <span className={styles.godName}>{god.name.split(',')[0]}</span>
                </div>
                <div className={styles.godImage}>
                    {god.imageUrl ? (
                        <img
                            src={god.imageUrl}
                            alt={god.name}
                            className={styles.godImageImg}
                            onError={(e) => {
                                // Fallback to initial if image fails to load
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove(styles.hidden);
                            }}
                        />
                    ) : null}
                    <span className={`${styles.godInitial} ${god.imageUrl ? styles.hidden : ''}`}>
                        {god.name.charAt(0)}
                    </span>
                </div>
                <div className={styles.godStats}>
                    <span className={styles.health}>❤️ {god.maxHealth}</span>
                    <span className={styles.weakness}>
                        ⚠️ {ELEMENT_SYMBOLS[god.weakness]}
                    </span>
                </div>
                {isSelected && <div className={styles.selectedOverlay}>✓</div>}
                {isDisabled && <div className={styles.disabledOverlay}>🚫</div>}
            </div>
        );
    };

    return (
        <div className={styles.container}>
            {/* Header avec bouton retour */}
            <header className={styles.header}>
                <Link href="/" className={styles.backLink}>
                    ← Retour
                </Link>
                <h1 className={styles.title}>⚔️ Sélection des Équipes</h1>
                <div className={styles.headerSpacer}></div>
            </header>

            <div className={styles.phaseIndicator}>
                <div className={`${styles.phaseStep} ${phase === 'player' ? styles.active : styles.done}`}>
                    1. Votre équipe ({playerTeam.length}/{maxTeamSize})
                </div>
                <div className={styles.phaseArrow}>→</div>
                <div className={`${styles.phaseStep} ${phase === 'ai' ? styles.active : ''}`}>
                    2. Équipe IA ({aiTeam.length}/{maxTeamSize})
                </div>
            </div>

            <p className={styles.instruction}>
                {phase === 'player'
                    ? `Sélectionnez ${maxTeamSize} dieux pour votre équipe`
                    : `Sélectionnez ${maxTeamSize} dieux pour l'équipe de l'IA`
                }
            </p>

            <div className={styles.godsGrid}>
                {visibleGods.map(god => renderGodCard(god))}
            </div>

            <div className={styles.selectedTeams}>
                <div className={styles.teamPreview}>
                    <h3>🎮 Votre équipe</h3>
                    <div className={styles.teamGods}>
                        {playerTeam.length === 0 ? (
                            <span className={styles.emptyTeam}>Aucun dieu sélectionné</span>
                        ) : (
                            playerTeam.map(id => {
                                const god = getGodById(id);
                                return god ? (
                                    <span key={id} className={styles.teamGod}>
                                        {ELEMENT_SYMBOLS[god.element]} {god.name.split(',')[0]}
                                    </span>
                                ) : null;
                            })
                        )}
                    </div>
                </div>
                <div className={styles.teamPreview}>
                    <h3>🤖 Équipe IA</h3>
                    <div className={styles.teamGods}>
                        {aiTeam.length === 0 ? (
                            <span className={styles.emptyTeam}>Aucun dieu sélectionné</span>
                        ) : (
                            aiTeam.map(id => {
                                const god = getGodById(id);
                                return god ? (
                                    <span key={id} className={styles.teamGod}>
                                        {ELEMENT_SYMBOLS[god.element]} {god.name.split(',')[0]}
                                    </span>
                                ) : null;
                            })
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
                {phase === 'player' ? (
                    <button
                        className={styles.confirmButton}
                        onClick={handleConfirmPlayerTeam}
                        disabled={playerTeam.length !== maxTeamSize}
                    >
                        Confirmer mon équipe →
                    </button>
                ) : (
                    <>
                        <button
                            className={styles.backButton}
                            onClick={() => setPhase('player')}
                        >
                            ← Modifier mon équipe
                        </button>
                        <button
                            className={styles.randomButton}
                            onClick={handleRandomAiTeam}
                        >
                            🎲 Équipe IA aléatoire
                        </button>
                        <button
                            className={styles.startButton}
                            onClick={handleStartGame}
                            disabled={aiTeam.length !== maxTeamSize}
                        >
                            ⚔️ Commencer le combat !
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
