'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

// Liste des avatars disponibles
const AVATARS = ['⚡', '🔥', '💧', '🌿', '☀️', '💀', '💨', '🌙', '⭐', '👑', '🦅', '🐍'];

// Rangs selon le niveau
function getRank(level: number): string {
    if (level < 5) return 'Novice';
    if (level < 10) return 'Apprenti';
    if (level < 20) return 'Guerrier';
    if (level < 35) return 'Héros';
    if (level < 50) return 'Champion';
    if (level < 75) return 'Légende';
    return 'Dieu';
}

// XP requis pour le niveau suivant
function getXpToNext(level: number): number {
    return level * 500;
}

export default function ProfilePage() {
    const router = useRouter();
    const { user, profile, loading, profileLoading, signOut, updateProfile, refreshProfile } = useAuth();

    useEffect(() => {
        // Rafraîchir le profil au chargement si user existe mais pas de profil
        if (user && !profile && !profileLoading) {
            refreshProfile();
        }
    }, [user, profile, profileLoading, refreshProfile]);

    // Rediriger si non connecté
    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth');
        }
    }, [user, loading, router]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    const handleAvatarChange = async (newAvatar: string) => {
        if (!profile) return;
        await updateProfile(profile.username, newAvatar);
    };

    // Affichage de chargement initial
    if (loading || profileLoading) {
        return (
            <main className={styles.main}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}>⏳</div>
                    <p>Chargement du profil...</p>
                </div>
            </main>
        );
    }

    // Redirection en cours
    if (!user) {
        return (
            <main className={styles.main}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}>⏳</div>
                    <p>Redirection...</p>
                </div>
            </main>
        );
    }

    // Si pas de profil après chargement (problème Firestore)
    if (!profile) {
        return (
            <main className={styles.main}>
                <div className={styles.loadingContainer}>
                    <p>⚠️ Profil introuvable dans la base de données.</p>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '10px' }}>
                        Il peut y avoir un problème avec les règles Firestore.
                    </p>
                    <button onClick={() => refreshProfile()} className={styles.linkButton} style={{ marginTop: '15px' }}>
                        🔄 Réessayer
                    </button>
                    <button onClick={handleSignOut} className={styles.logoutButton} style={{ marginTop: '10px' }}>
                        🚪 Se déconnecter
                    </button>
                </div>
            </main>
        );
    }

    const xpToNext = getXpToNext(profile.level);
    const xpProgress = Math.min((profile.xp / xpToNext) * 100, 100);
    const rank = getRank(profile.level);
    const winRate = profile.stats.totalGames > 0
        ? ((profile.stats.victories / profile.stats.totalGames) * 100).toFixed(1)
        : '0.0';

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.backButton}>← Retour</Link>
                <h1 className={styles.title}>Profil</h1>
                <button className={styles.settingsButton} onClick={handleSignOut}>🚪</button>
            </header>

            <div className={styles.content}>
                {/* Carte de profil */}
                <section className={styles.profileCard}>
                    <div className={styles.avatarContainer}>
                        <div className={styles.avatar}>{profile.avatar}</div>
                        <div className={styles.rankBadge}>{rank}</div>
                    </div>
                    <div className={styles.profileInfo}>
                        <h2 className={styles.username}>{profile.username}</h2>
                        <p className={styles.email}>{profile.email}</p>
                        <div className={styles.levelInfo}>
                            <span className={styles.level}>Niveau {profile.level}</span>
                            <div className={styles.xpBar}>
                                <div className={styles.xpFill} style={{ width: `${xpProgress}%` }} />
                            </div>
                            <span className={styles.xpText}>{profile.xp} / {xpToNext} XP</span>
                        </div>
                    </div>
                </section>

                {/* Changer d'avatar */}
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>🎭 Changer d&apos;avatar</h3>
                    <div className={styles.avatarGrid}>
                        {AVATARS.map((avatar) => (
                            <button
                                key={avatar}
                                className={`${styles.avatarOption} ${profile.avatar === avatar ? styles.selected : ''}`}
                                onClick={() => handleAvatarChange(avatar)}
                            >
                                {avatar}
                            </button>
                        ))}
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
                            <span className={styles.statValue}>{winRate}%</span>
                            <span className={styles.statLabel}>Ratio</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statValue}>{profile.stats.currentStreak}</span>
                            <span className={styles.statLabel}>Série actuelle</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statValue}>{profile.stats.bestStreak}</span>
                            <span className={styles.statLabel}>Meilleure série</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statValue}>{profile.stats.totalGames}</span>
                            <span className={styles.statLabel}>Total parties</span>
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
                                    style={{ width: `${(profile.collection.godsOwned.length / 12) * 100}%` }}
                                />
                            </div>
                            <span>Dieux: {profile.collection.godsOwned.length}/12</span>
                        </div>
                        <div className={styles.collectionItem}>
                            <div className={styles.collectionBar}>
                                <div
                                    className={styles.collectionFill}
                                    style={{ width: `${(profile.collection.spellsOwned.length / 60) * 100}%` }}
                                />
                            </div>
                            <span>Sorts: {profile.collection.spellsOwned.length}/60</span>
                        </div>
                    </div>
                </section>

                {/* Bouton de déconnexion */}
                <section className={styles.section}>
                    <button className={styles.logoutButton} onClick={handleSignOut}>
                        🚪 Se déconnecter
                    </button>
                </section>
            </div>
        </main>
    );
}
