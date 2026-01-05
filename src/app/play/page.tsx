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
                <Link href="/" className={styles.backButton}>‹ Retour</Link>
                <h1 className={styles.title}>JOUER</h1>
            </header>

            {/* Modes de jeu */}
            <div className={styles.content}>
                {/* Section PvP */}
                <h2 className={styles.sectionTitle}>⚔️ Modes Compétitifs</h2>
                <div className={styles.modesGrid}>
                    {/* Mode Duel - NOUVEAU */}
                    <Link href="/duel" className={`${styles.modeCard} ${styles.featured}`}>
                        <div className={styles.newBadge}>NOUVEAU</div>
                        <div className={styles.modeIconWrapper}>
                            <span className={styles.modeIcon}>⚔️</span>
                        </div>
                        <div className={styles.modeInfo}>
                            <h2 className={styles.modeTitle}>Duel</h2>
                            <p className={styles.modeDescription}>
                                PvP en ligne • Budget 13 points • Parties classées
                            </p>
                        </div>
                        <div className={styles.modeArrow}>›</div>
                    </Link>

                    {/* Mode En Ligne */}
                    <Link href="/online" className={styles.modeCard}>
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
                <h2 className={styles.sectionTitle}>🎮 Modes Solo</h2>
                <div className={styles.modesGrid}>
                    {/* Mode Ascension - NOUVEAU */}
                    <Link href="/ascension" className={`${styles.modeCard} ${styles.featured}`}>
                        <div className={styles.newBadge}>NOUVEAU</div>
                        <div className={styles.modeIconWrapper}>
                            <span className={styles.modeIcon}>🏔️</span>
                        </div>
                        <div className={styles.modeInfo}>
                            <h2 className={styles.modeTitle}>Ascension</h2>
                            <p className={styles.modeDescription}>
                                Mode survie • 15 étages • Pas de heal
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
                                Découvrez l'épopée des dieux
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
                                Affrontez l'IA
                            </p>
                        </div>
                        <div className={styles.modeArrow}>›</div>
                    </Link>
                </div>

                {/* Section Autres */}
                <h2 className={styles.sectionTitle}>📚 Autres</h2>
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
