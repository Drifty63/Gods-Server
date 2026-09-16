'use client';

import { useState, useMemo } from 'react';
import { GodCard } from '@/types/cards';
import BackButton from '@/components/BackButton/BackButton';
import { getDuelCards, getGodById } from '@/data/gods';
import { ELEMENT_COLORS, ELEMENT_SYMBOLS, ELEMENT_NAMES } from '@/game-engine/ElementSystem';
import { toast } from '@/lib/toast';
import { haptic } from '@/lib/haptics';
import { playSfx } from '@/lib/sfx';
import styles from './TeamSelection.module.css';

interface TeamSelectionProps {
    onTeamsSelected: (playerTeam: string[], aiTeam: string[]) => void;
    isCreator?: boolean;
    /** Cartes possédées par le joueur (profil Supabase). */
    godsOwned?: string[];
}

/** Sections de la grille, dans l'ordre d'affichage. */
const FAMILIES = [
    { key: 'gods' as const, label: 'Dieux', icon: '⚡' },
    { key: 'creatures' as const, label: 'Créatures', icon: '🐉' },
    { key: 'servants' as const, label: 'Serviteurs', icon: '🛡️' },
];

/** Taille d'équipe, identique pour le joueur et pour l'IA. */
const MAX_TEAM_SIZE = 4;

/**
 * Vignette d'une carte, calquée sur celle du mode Duel.
 *
 * Déclarée AU NIVEAU DU MODULE, comme celle du Duel et pour la même raison : une fonction de
 * composant recréée à chaque rendu change d'identité, et React démonte puis remonte toute la
 * grille — les portraits, portés par `background-image`, se rechargent et la grille clignote.
 *
 * Le COÛT en points du Duel n'a pas d'équivalent ici : l'Entraînement n'a pas de budget, la
 * seule règle est « quatre cartes ». La place est rendue aux points de vie, qui eux comptent
 * quand on compose face à une équipe adverse que l'on choisit soi-même.
 */
function TeamCard({ card, order, disabled, onSelect }: {
    card: GodCard;
    /** Rang dans l'équipe, à partir de 1. `0` quand la carte n'est pas sélectionnée. */
    order: number;
    disabled: boolean;
    onSelect: (id: string) => void;
}) {
    const isSelected = order > 0;
    const colors = ELEMENT_COLORS[card.element];

    return (
        <div
            className={`${styles.godCard} ${isSelected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
            style={{
                '--element-color': colors.primary,
                '--element-gradient': colors.gradient,
            } as React.CSSProperties}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`${card.name}, ${card.maxHealth} points de vie${isSelected ? `, sélectionné en position ${order}` : ''}`}
            // Cette carte joue ses propres sons : on neutralise le clic générique de la couche
            // globale pour ne pas les superposer.
            data-no-sound
            // Toujours transmis, même quand la carte est indisponible : c'est le gestionnaire
            // qui explique le refus, au lieu de laisser le clic se perdre sans aucun retour.
            onClick={() => onSelect(card.id)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(card.id);
                }
            }}
        >
            <div
                className={styles.godImage}
                style={card.imageUrl ? { backgroundImage: `url(${card.imageUrl})` } : undefined}
            >
                {!card.imageUrl && <span className={styles.godInitial}>{card.name.charAt(0)}</span>}
            </div>

            {/* Élément et faiblesse restent lisibles : c'est sur eux que se joue la composition,
                et le Duel peut s'en passer parce qu'on y compose sans voir l'équipe adverse. */}
            <div className={styles.badges}>
                <span className={styles.godElement} title={ELEMENT_NAMES[card.element]}>
                    {ELEMENT_SYMBOLS[card.element]}
                </span>
                <span
                    className={styles.godWeakness}
                    title={`Faible contre ${ELEMENT_NAMES[card.weakness]}`}
                >
                    ⚠️{ELEMENT_SYMBOLS[card.weakness]}
                </span>
            </div>

            <div className={styles.godInfo}>
                <span className={styles.godName}>{card.name.split(',')[0]}</span>
                <span className={styles.godHealth}>❤️ {card.maxHealth}</span>
            </div>

            {isSelected && <div className={styles.selectedBadge}>{order}</div>}
        </div>
    );
}

export default function TeamSelection({ onTeamsSelected, isCreator = false, godsOwned = [] }: TeamSelectionProps) {
    const [playerTeam, setPlayerTeam] = useState<string[]>([]);
    const [aiTeam, setAiTeam] = useState<string[]>([]);
    const [phase, setPhase] = useState<'player' | 'ai'>('player');

    /**
     * L'Entraînement propose désormais EXACTEMENT ce que le joueur possède, créatures et
     * serviteurs compris — même source que le mode Duel. Auparavant il listait getVisibleGods,
     * c'est-à-dire les 12 dieux publics sans tenir compte des achats, et jamais la moindre
     * créature : impossible de s'entraîner avec les unités qu'on ne pouvait jouer qu'en Duel.
     */
    const ownedRoster = useMemo(() => getDuelCards(godsOwned, isCreator), [godsOwned, isCreator]);

    /**
     * L'ADVERSAIRE, lui, peut aligner n'importe quelle carte publiée.
     *
     * Le restreindre aux cartes possédées appauvrirait beaucoup le mode : un joueur avec un
     * simple pack starter n'opposerait jamais que ses propres 4 dieux. C'est aussi ce que fait
     * déjà l'Ascension : on affronte des unités qu'on ne possède pas.
     *
     * Les MATCHS MIROIR sont autorisés — un même dieu peut figurer dans les deux équipes. Ils
     * existaient déjà en ligne (chaque joueur choisit sans voir l'autre) et en Ascension aux
     * étages 13-15 ; seul l'Entraînement les interdisait.
     */
    const aiRoster = useMemo(() => getDuelCards([], true), []);

    const roster = phase === 'player' ? ownedRoster : aiRoster;
    const allCards = useMemo(
        () => [...roster.gods, ...roster.creatures, ...roster.servants],
        [roster],
    );

    const currentTeam = phase === 'player' ? playerTeam : aiTeam;
    const setCurrentTeam = phase === 'player' ? setPlayerTeam : setAiTeam;

    const handleGodClick = (godId: string) => {
        if (currentTeam.includes(godId)) {
            setCurrentTeam(currentTeam.filter(id => id !== godId));
            haptic('tap');
            playSfx('tap');
        } else if (currentTeam.length < MAX_TEAM_SIZE) {
            setCurrentTeam([...currentTeam, godId]);
            haptic('select');
            playSfx('select');
        } else {
            // Refus silencieux auparavant : le joueur cliquait sur une cinquième carte sans
            // rien voir se produire. Même formulation qu'en Duel.
            toast.error(`Équipe complète (${MAX_TEAM_SIZE} cartes maximum)`);
        }
    };

    const handleConfirmPlayerTeam = () => {
        if (playerTeam.length === MAX_TEAM_SIZE) {
            setPhase('ai');
        }
    };

    const handleRandomAiTeam = () => {
        const availableGods = allCards.map(g => g.id);

        const shuffled = [...availableGods].sort(() => Math.random() - 0.5);
        setAiTeam(shuffled.slice(0, MAX_TEAM_SIZE));
    };

    const handleStartGame = () => {
        if (playerTeam.length === MAX_TEAM_SIZE && aiTeam.length === MAX_TEAM_SIZE) {
            onTeamsSelected(playerTeam, aiTeam);
        }
    };

    /** Noms courts d'une équipe, pour le rappel porté par l'indicateur de phase. */
    const teamNames = (ids: string[]) =>
        ids.map(id => getGodById(id)?.name.split(',')[0]).filter(Boolean).join(' · ');

    return (
        <>
            {/* Hors du conteneur à dessein : `.container > *` force `position: relative` sur ses
                enfants directs, ce qui annulerait l'ancrage fixe du retour. */}
            <BackButton href="/play" label="Retour aux modes de jeu" />

            <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>⚔️ Sélection des Équipes</h1>
            </header>

            {/*
              * L'indicateur porte aussi le RAPPEL de l'équipe validée.
              *
              * Le panneau « Votre équipe / Équipe IA » qui occupait le bas de la page a disparu
              * au profit des vignettes du Duel. En phase 1 il était redondant avec la grille,
              * mais en phase 2 il était le seul endroit où l'on revoyait sa propre équipe : ce
              * rôle-là est repris ici, sans reprendre la hauteur.
              */}
            <div className={styles.phaseIndicator}>
                <div className={`${styles.phaseStep} ${phase === 'player' ? styles.active : styles.done}`}>
                    <span>1. Votre équipe ({playerTeam.length}/{MAX_TEAM_SIZE})</span>
                    {phase === 'ai' && (
                        <span className={styles.phaseTeam}>{teamNames(playerTeam)}</span>
                    )}
                </div>
                <div className={styles.phaseArrow}>→</div>
                <div className={`${styles.phaseStep} ${phase === 'ai' ? styles.active : ''}`}>
                    <span>2. Équipe IA ({aiTeam.length}/{MAX_TEAM_SIZE})</span>
                </div>
            </div>

            <p className={styles.instruction}>
                {phase === 'player'
                    ? 'Sélectionnez 4 cartes'
                    : "Sélectionnez 4 cartes pour l'IA"
                }
            </p>

            {allCards.length < MAX_TEAM_SIZE ? (
                <p className={styles.instruction}>
                    Il vous faut au moins {MAX_TEAM_SIZE} cartes pour vous entraîner. Passez en
                    boutique : chaque dieu acheté vous apporte aussi sa créature et son serviteur.
                </p>
            ) : (
                FAMILIES.map(({ key, label, icon }) => (
                    roster[key].length > 0 && (
                        <section key={key} className={styles.familyBlock}>
                            <h2 className={styles.familyTitle}>
                                <span aria-hidden="true">{icon}</span> {label}
                                <span className={styles.familyCount}>{roster[key].length}</span>
                            </h2>
                            <div className={styles.godsGrid}>
                                {roster[key].map(card => {
                                    const order = currentTeam.indexOf(card.id) + 1;
                                    return (
                                        <TeamCard
                                            key={card.id}
                                            card={card}
                                            order={order}
                                            disabled={order === 0 && currentTeam.length >= MAX_TEAM_SIZE}
                                            onSelect={handleGodClick}
                                        />
                                    );
                                })}
                            </div>
                        </section>
                    )
                ))
            )}

            <div className={styles.actions}>
                {phase === 'player' ? (
                    <button
                        className={styles.confirmButton}
                        onClick={handleConfirmPlayerTeam}
                        disabled={playerTeam.length !== MAX_TEAM_SIZE}
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
                            disabled={aiTeam.length !== MAX_TEAM_SIZE}
                        >
                            ⚔️ Commencer le combat !
                        </button>
                    </>
                )}
            </div>
            </div>
        </>
    );
}
