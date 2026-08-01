'use client';

import Link from 'next/link';
import styles from './page.module.css';
import { RequireAuth } from '@/components/Auth/RequireAuth';

export default function PlayPage() {
    return (
        <RequireAuth>
            <PlayContent />
        </RequireAuth>
    );
}

function PlayContent() {
    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.backButton} aria-label="Retour à l'accueil">
                    <span aria-hidden="true">‹</span>
                </Link>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Jouer</h1>
                    <p className={styles.subtitle}>Choisissez votre mode de combat</p>
                </div>
            </header>

            {/* Modes de jeu */}
            <div className={styles.content}>
                {/* Section PvP */}
                <h2 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>⚔️</span> Modes Compétitifs
                </h2>
                <div className={styles.modesGrid}>
                    {/* Mode Duel - NOUVEAU */}
                    <Link href="/duel" className={`${styles.modeCard} ${styles.featured}`}>
                        <div className={styles.newBadge}>Nouveau</div>
                        <div className={styles.modeIconWrapper}>
                            <span className={styles.modeIcon}>⚔️</span>
                        </div>
                        <div className={styles.modeInfo}>
                            <h2 className={styles.modeTitle}>Duel</h2>
                            <p className={styles.modeDescription}>
                                PvP classé • Budget 13 points
                            </p>
                        </div>
                        <div className={styles.modeArrow}>›</div>
                    </Link>

                    {/* Mode En Ligne */}
                    <Link href="/online" className={`${styles.modeCard} ${styles.accentBlue}`}>
                        <div className={styles.modeIconWrapper}>
                            <span className={styles.modeIcon}>🌐</span>
                        </div>
                        <div className={styles.modeInfo}>
                            <h2 className={styles.modeTitle}>En Ligne</h2>
                            <p className={styles.modeDescription}>
                                Matchmaking libre • Parties privées
                            </p>
                        </div>
                        <div className={styles.modeArrow}>›</div>
                    </Link>
                </div>

                {/* Section Solo */}
                <h2 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>🎮</span> Modes Solo
                </h2>
                <div className={styles.modesGrid}>
                    {/* Mode Ascension - NOUVEAU */}
                    <Link href="/ascension" className={`${styles.modeCard} ${styles.featured}`}>
                        <div className={styles.newBadge}>Nouveau</div>
                        <div className={styles.modeIconWrapper}>
                            <span className={styles.modeIcon}>🏔️</span>
                        </div>
                        <div className={styles.modeInfo}>
                            <h2 className={styles.modeTitle}>Ascension</h2>
                            <p className={styles.modeDescription}>
                                15 étages • Aucun soin autorisé
                            </p>
                        </div>
                        <div className={styles.modeArrow}>›</div>
                    </Link>

                    {/* Mode Histoire */}
                    <Link href="/story" className={styles.modeCard}>
                        <div className={styles.modeIconWrapper}>
                            <span className={styles.modeIcon}>📖</span>
                        </div>
                        <div className={styles.modeInfo}>
                            <h2 className={styles.modeTitle}>Histoire</h2>
                            <p className={styles.modeDescription}>
                                Découvrez l&apos;épopée des dieux
                            </p>
                        </div>
                        <div className={styles.modeArrow}>›</div>
                    </Link>

                    {/* Mode Entraînement */}
                    <Link href="/game" className={styles.modeCard}>
                        <div className={styles.modeIconWrapper}>
                            <span className={styles.modeIcon}>🤖</span>
                        </div>
                        <div className={styles.modeInfo}>
                            <h2 className={styles.modeTitle}>Entraînement</h2>
                            <p className={styles.modeDescription}>
                                Affrontez l&apos;IA
                            </p>
                        </div>
                        <div className={styles.modeArrow}>›</div>
                    </Link>
                </div>

                {/* Section Autres */}
                <h2 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>📚</span> Autres
                </h2>
                <div className={styles.modesGrid}>
                    {/* Mode Tutoriel */}
                    <Link href="/rules" className={styles.modeCard}>
                        <div className={styles.modeIconWrapper}>
                            <span className={styles.modeIcon}>📚</span>
                        </div>
                        <div className={styles.modeInfo}>
                            <h2 className={styles.modeTitle}>Règles</h2>
                            <p className={styles.modeDescription}>
                                Apprenez les mécaniques du jeu
                            </p>
                        </div>
                        <div className={styles.modeArrow}>›</div>
                    </Link>
                </div>
            </div>
        </main>
    );
}
