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
                <div className={styles.modesGrid}>
                    {/* Mode Histoire */}
                    <div className={`${styles.modeCard} ${styles.comingSoon}`}>
                        <div className={styles.comingSoonBadge}>Bientôt</div>
                        <div className={styles.modeIconWrapper}>
                            <span className={styles.modeIcon}>📖</span>
                        </div>
                        <div className={styles.modeInfo}>
                            <h2 className={styles.modeTitle}>Histoire</h2>
                            <p className={styles.modeDescription}>
                                Découvrez l'histoire des dieux à travers des combats épiques
                            </p>
                        </div>
                        <div className={styles.modeArrow}>›</div>
                    </div>

                    {/* Mode En Ligne */}
                    <Link href="/online" className={styles.modeCard}>
                        <div className={styles.modeIconWrapper}>
                            <span className={styles.modeIcon}>🌐</span>
                        </div>
                        <div className={styles.modeInfo}>
                            <h2 className={styles.modeTitle}>En Ligne</h2>
                            <p className={styles.modeDescription}>
                                Affrontez des joueurs du monde entier en temps réel
                            </p>
                        </div>
                        <div className={styles.modeArrow}>›</div>
                    </Link>

                    {/* Mode Défis */}
                    <div className={`${styles.modeCard} ${styles.comingSoon}`}>
                        <div className={styles.comingSoonBadge}>Bientôt</div>
                        <div className={styles.modeIconWrapper}>
                            <span className={styles.modeIcon}>⚔️</span>
                        </div>
                        <div className={styles.modeInfo}>
                            <h2 className={styles.modeTitle}>Défis</h2>
                            <p className={styles.modeDescription}>
                                Relevez des défis uniques et gagnez des récompenses
                            </p>
                        </div>
                        <div className={styles.modeArrow}>›</div>
                    </div>

                    {/* Mode Entraînement */}
                    <Link href="/game" className={styles.modeCard}>
                        <div className={styles.modeIconWrapper}>
                            <span className={styles.modeIcon}>🤖</span>
                        </div>
                        <div className={styles.modeInfo}>
                            <h2 className={styles.modeTitle}>Entraînement</h2>
                            <p className={styles.modeDescription}>
                                Entraînez-vous contre l'intelligence artificielle
                            </p>
                        </div>
                        <div className={styles.modeArrow}>›</div>
                    </Link>

                    {/* Mode Tutoriel */}
                    <Link href="/rules" className={styles.modeCard}>
                        <div className={styles.modeIconWrapper}>
                            <span className={styles.modeIcon}>📚</span>
                        </div>
                        <div className={styles.modeInfo}>
                            <h2 className={styles.modeTitle}>Tutoriel</h2>
                            <p className={styles.modeDescription}>
                                Apprenez les règles et les mécaniques du jeu
                            </p>
                        </div>
                        <div className={styles.modeArrow}>›</div>
                    </Link>
                </div>
            </div>
        </main>
    );
}
