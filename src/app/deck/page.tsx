'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Team {
    id: number;
    name: string;
    gods: (string | null)[]; // IDs des dieux ou null si slot vide
}

const DEFAULT_TEAMS: Team[] = [
    { id: 1, name: 'Formation Alpha', gods: [null, null, null] },
    { id: 2, name: 'Formation Beta', gods: [null, null, null] },
    { id: 3, name: 'Formation Gamma', gods: [null, null, null] },
    { id: 4, name: 'Formation Delta', gods: [null, null, null] },
    { id: 5, name: 'Formation Omega', gods: [null, null, null] },
];

export default function DeckPage() {
    // État des équipes (chargé depuis localStorage idéalement, ici state local pour démo)
    const [teams, setTeams] = useState<Team[]>(DEFAULT_TEAMS);
    const [currentTeamIndex, setCurrentTeamIndex] = useState(0);

    // Charger les équipes depuis localStorage au montage
    useEffect(() => {
        const savedTeams = localStorage.getItem('gods_teams');
        if (savedTeams) {
            try {
                setTeams(JSON.parse(savedTeams));
            } catch (e) {
                console.error("Erreur chargement équipes", e);
            }
        }
    }, []);

    // Sauvegarder les changements
    useEffect(() => {
        localStorage.setItem('gods_teams', JSON.stringify(teams));
    }, [teams]);

    const currentTeam = teams[currentTeamIndex];

    const nextTeam = () => {
        setCurrentTeamIndex((prev) => (prev + 1) % teams.length);
    };

    const prevTeam = () => {
        setCurrentTeamIndex((prev) => (prev - 1 + teams.length) % teams.length);
    };

    const handleNameChange = (newName: string) => {
        const updatedTeams = [...teams];
        updatedTeams[currentTeamIndex] = {
            ...updatedTeams[currentTeamIndex],
            name: newName
        };
        setTeams(updatedTeams);
    };

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.pageHeader}>
                <Link href="/" className={styles.backButton}>
                    ‹ Retour
                </Link>
                <h1 className={styles.title}>Mes Decks</h1>
            </header>

            {/* Sélecteur d'équipe */}
            <div className={styles.teamSelector}>
                <button
                    className={styles.navArrow}
                    onClick={prevTeam}
                    aria-label="Équipe précédente"
                >
                    ‹
                </button>

                <div className={styles.teamInfo}>
                    <span className={styles.teamLabel}>Formation {currentTeamIndex + 1} / {teams.length}</span>
                    <input
                        type="text"
                        value={currentTeam.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className={styles.teamNameInput}
                        placeholder="Nom de l'équipe..."
                    />
                </div>

                <button
                    className={styles.navArrow}
                    onClick={nextTeam}
                    aria-label="Équipe suivante"
                >
                    ›
                </button>
            </div>

            {/* Contenu du Deck (Formation) - À implémenter plus tard */}
            <div className={styles.deckContent}>
                <p>La zone de sélection des dieux apparaîtra ici...</p>
            </div>

            {/* Navigation Bottom (Identique home pour consistance) */}
            <div className={styles.bottomNavWrapper}>
                <nav className={styles.bottomNav}>
                    <Link href="/shop" className={styles.navItem}>
                        <span className={styles.navIcon}>🏛️</span>
                        <span className={styles.navLabel}>Boutique</span>
                    </Link>

                    <Link href="/quests" className={styles.navItem}>
                        <span className={styles.navIcon}>📯</span>
                        <span className={styles.navLabel}>Quête</span>
                    </Link>

                    <Link href="/" className={styles.navItem}>
                        <span className={styles.navIcon}>⚔️</span>
                        <span className={styles.navLabel}>Jouer</span>
                    </Link>

                    <Link href="/deck" className={`${styles.navItem} ${styles.active}`}>
                        <span className={styles.navIcon}>📦</span>
                        <span className={styles.navLabel}>Deck</span>
                    </Link>

                    <Link href="/profile" className={styles.navItem}>
                        <span className={styles.navIcon}>👤</span>
                        <span className={styles.navLabel}>Profil</span>
                    </Link>
                </nav>
            </div>
        </main>
    );
}
