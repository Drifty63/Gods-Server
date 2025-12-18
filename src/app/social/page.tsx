'use client';

import Link from 'next/link';
import styles from './page.module.css';
import { useAuth } from '@/contexts/AuthContext';

export default function SocialPage() {
    const { profile } = useAuth();

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.backButton}>‹ Retour</Link>
                <h1 className={styles.title}>SOCIAL</h1>
            </header>

            {/* Menu Social */}
            <div className={styles.content}>
                <div className={styles.menuGrid}>
                    {/* Carte Amis */}
                    <Link href="/social/friends" className={styles.menuCard}>
                        <div className={styles.cardIcon}>👥</div>
                        <div className={styles.cardContent}>
                            <h2 className={styles.cardTitle}>Amis</h2>
                            <p className={styles.cardDescription}>
                                Gérez vos amis, envoyez des défis et acceptez les demandes
                            </p>
                        </div>
                        <div className={styles.cardArrow}>›</div>
                    </Link>

                    {/* Carte Classement */}
                    <Link href="/social/leaderboard" className={styles.menuCard}>
                        <div className={styles.cardIcon}>🏆</div>
                        <div className={styles.cardContent}>
                            <h2 className={styles.cardTitle}>Classement</h2>
                            <p className={styles.cardDescription}>
                                Consultez le classement mondial et votre position
                            </p>
                        </div>
                        <div className={styles.cardArrow}>›</div>
                    </Link>
                </div>

                {/* Quick Stats */}
                <div className={styles.quickStats}>
                    <h3 className={styles.statsTitle}>Vos statistiques</h3>
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>⚔️</span>
                            <span className={styles.statValue}>{profile?.stats?.totalGames || 0}</span>
                            <span className={styles.statLabel}>Parties jouées</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>🏅</span>
                            <span className={styles.statValue}>{profile?.stats?.victories || 0}</span>
                            <span className={styles.statLabel}>Victoires</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>📊</span>
                            <span className={styles.statValue}>{profile?.level || 1}</span>
                            <span className={styles.statLabel}>Niveau</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
