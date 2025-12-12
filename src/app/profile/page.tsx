'use client';

import Link from 'next/link';
import styles from './page.module.css';

export default function ProfilePage() {
    // Données de profil placeholder
    const profile = {
        username: 'OlympianWarrior',
        level: 12,
        xp: 2450,
        xpToNext: 3000,
        rank: 'Héros',
        avatar: '⚡',
        stats: {
            victories: 47,
            defeats: 23,
            winRate: 67.1,
            currentStreak: 5,
            bestStreak: 12,
            totalGames: 70,
        },
        favoriteGod: {
            name: 'Zeus',
            element: '⚡',
            games: 28,
        },
        collection: {
            godsOwned: 8,
            godsTotal: 12,
            spellsOwned: 45,
            spellsTotal: 60,
        },
        achievements: [
            { id: 1, icon: '⚔️', name: 'Premier Combat', unlocked: true },
            { id: 2, icon: '🏆', name: '10 Victoires', unlocked: true },
            { id: 3, icon: '🔥', name: 'Maître du Feu', unlocked: true },
            { id: 4, icon: '💀', name: 'Exterminateur', unlocked: false },
            { id: 5, icon: '👑', name: 'Roi de l\'Olympe', unlocked: false },
            { id: 6, icon: '⭐', name: 'Collectionneur', unlocked: false },
        ],
    };

    const xpProgress = (profile.xp / profile.xpToNext) * 100;

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.backButton}>← Retour</Link>
                <h1 className={styles.title}>Profil</h1>
                <button className={styles.settingsButton}>⚙️</button>
            </header>

            <div className={styles.content}>
                {/* Carte de profil */}
                <section className={styles.profileCard}>
                    <div className={styles.avatarContainer}>
                        <div className={styles.avatar}>{profile.avatar}</div>
                        <div className={styles.rankBadge}>{profile.rank}</div>
                    </div>
                    <div className={styles.profileInfo}>
                        <h2 className={styles.username}>{profile.username}</h2>
                        <div className={styles.levelInfo}>
                            <span className={styles.level}>Niveau {profile.level}</span>
                            <div className={styles.xpBar}>
                                <div className={styles.xpFill} style={{ width: `${xpProgress}%` }} />
                            </div>
                            <span className={styles.xpText}>{profile.xp} / {profile.xpToNext} XP</span>
                        </div>
                    </div>
                </section>

                {/* Statistiques */}
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>📊 Statistiques</h3>
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <span className={styles.statValue}>{profile.stats.victories}</span>
                            <span className={styles.statLabel}>Victoires</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statValue}>{profile.stats.defeats}</span>
                            <span className={styles.statLabel}>Défaites</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statValue}>{profile.stats.winRate}%</span>
                            <span className={styles.statLabel}>Ratio</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statValue}>{profile.stats.currentStreak}</span>
                            <span className={styles.statLabel}>Série actuelle</span>
                        </div>
                    </div>
                </section>

                {/* Dieu favori */}
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>⭐ Dieu Favori</h3>
                    <div className={styles.favoriteGod}>
                        <span className={styles.godIcon}>{profile.favoriteGod.element}</span>
                        <div className={styles.godInfo}>
                            <span className={styles.godName}>{profile.favoriteGod.name}</span>
                            <span className={styles.godGames}>{profile.favoriteGod.games} parties jouées</span>
                        </div>
                    </div>
                </section>

                {/* Collection */}
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>🎴 Collection</h3>
                    <div className={styles.collectionGrid}>
                        <div className={styles.collectionItem}>
                            <div className={styles.collectionBar}>
                                <div
                                    className={styles.collectionFill}
                                    style={{ width: `${(profile.collection.godsOwned / profile.collection.godsTotal) * 100}%` }}
                                />
                            </div>
                            <span>Dieux: {profile.collection.godsOwned}/{profile.collection.godsTotal}</span>
                        </div>
                        <div className={styles.collectionItem}>
                            <div className={styles.collectionBar}>
                                <div
                                    className={styles.collectionFill}
                                    style={{ width: `${(profile.collection.spellsOwned / profile.collection.spellsTotal) * 100}%` }}
                                />
                            </div>
                            <span>Sorts: {profile.collection.spellsOwned}/{profile.collection.spellsTotal}</span>
                        </div>
                    </div>
                </section>

                {/* Succès */}
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>🏅 Succès</h3>
                    <div className={styles.achievementsGrid}>
                        {profile.achievements.map((achievement) => (
                            <div
                                key={achievement.id}
                                className={`${styles.achievement} ${!achievement.unlocked ? styles.locked : ''}`}
                            >
                                <span className={styles.achievementIcon}>{achievement.icon}</span>
                                <span className={styles.achievementName}>{achievement.name}</span>
                                {!achievement.unlocked && <span className={styles.lockIcon}>🔒</span>}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
