'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { getMostPlayedGod, getMatchHistory, type MatchHistoryEntry } from '@/services/supabase-profile';
import { ALL_GODS } from '@/data/gods';
import { getRankByFerveur, getRankProgress } from '@/data/ranks';
import styles from './page.module.css';

function formatMatchDate(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Il y a ${diffH} h`;
    const diffD = Math.floor(diffH / 24);
    return `Il y a ${diffD} j`;
}

export default function ProfilePage() {
    const router = useRouter();
    const { user, profile, loading, profileLoading, signOut, updateProfile, refreshProfile } = useAuth();
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [matchHistory, setMatchHistory] = useState<MatchHistoryEntry[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        // Rafraîchir le profil au chargement si user existe mais pas de profil
        if (user && !profile && !profileLoading) {
            refreshProfile();
        }
    }, [user, profile, profileLoading, refreshProfile]);

    useEffect(() => {
        if (!user) return;
        getMatchHistory(20)
            .then(setMatchHistory)
            .catch((err) => console.error('Erreur historique parties:', err))
            .finally(() => setHistoryLoading(false));
    }, [user]);

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

    const userFerveur = profile.ferveur;
    const userRank = getRankByFerveur(userFerveur);
    const rankProgress = getRankProgress(userFerveur);
    const winRate = profile.stats.totalGames > 0
        ? ((profile.stats.victories / profile.stats.totalGames) * 100).toFixed(1)
        : '0.0';

    // Dieu le plus joué
    const mostPlayed = getMostPlayedGod(profile.god_play_counts);
    const mostPlayedGod = mostPlayed ? ALL_GODS.find(g => g.id === mostPlayed.godId) : null;

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.backButton} aria-label="Retour à l'accueil">
                    <span aria-hidden="true">‹</span>
                </Link>
                <h1 className={styles.title}>Profil</h1>
                <button className={styles.settingsButton} onClick={handleSignOut} aria-label="Se déconnecter">🚪</button>
            </header>

            <div className={styles.content}>
                {/* Carte de profil */}
                <section className={styles.profileCard}>
                    <div className={styles.avatarContainer} onClick={() => setShowAvatarModal(true)}>
                        {profile.avatar.startsWith('/') ? (
                            <Image
                                src={profile.avatar}
                                alt="Avatar"
                                width={80}
                                height={80}
                                className={styles.avatarImage}
                            />
                        ) : (
                            <div className={styles.avatar}>{profile.avatar}</div>
                        )}
                        <div className={styles.avatarEditHint}>✏️</div>
                    </div>
                    <div className={styles.profileInfo}>
                        <div className={styles.profileHeader}>
                            <h2 className={styles.username}>{profile.username}</h2>
                            <div className={styles.rankBadge} style={{ background: userRank.gradient }}>
                                <span className={styles.rankIcon}>{userRank.icon}</span>
                                <span className={styles.rankName}>{userRank.name}</span>
                            </div>
                        </div>
                        <div className={styles.rankInfo}>
                            <div className={styles.progressContainer}>
                                <div className={styles.progressBar}>
                                    <div className={styles.progressFill} style={{ width: `${rankProgress}%`, background: userRank.gradient }} />
                                    <span className={styles.progressFerveur}>{userFerveur} 🔥</span>
                                </div>
                            </div>
                            <span className={styles.progressText}>Progression vers le prochain rang</span>
                        </div>
                    </div>
                </section>

                {/* Statistiques */}
                <section className={styles.statsSection}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionIcon}>📊</span>
                        <span className={styles.sectionTitle}>Statistiques</span>
                    </div>
                    <div className={styles.statsContent}>
                        {/* Dieu favori dans les stats */}
                        {mostPlayedGod && (
                            <div className={styles.statsFavoriteGod}>
                                <Image
                                    src={mostPlayedGod.imageUrl}
                                    alt={mostPlayedGod.name}
                                    width={50}
                                    height={50}
                                    className={styles.statsFavoriteGodImage}
                                />
                                <div className={styles.statsFavoriteGodInfo}>
                                    <span className={styles.statsFavoriteGodName}>{mostPlayedGod.name}</span>
                                    <span className={styles.statsFavoriteGodCount}>{mostPlayed?.count} parties</span>
                                </div>
                            </div>
                        )}
                        <div className={styles.statsRow}>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>{profile.stats.totalGames}</span>
                                <span className={styles.statLabel}>Parties jouées</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>{winRate}%</span>
                                <span className={styles.statLabel}>Victoires</span>
                            </div>
                        </div>
                        <div className={styles.statsRow}>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>{userFerveur}</span>
                                <span className={styles.statLabel}>🔥 Ferveur max</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>{userFerveur}</span>
                                <span className={styles.statLabel}>🔥 Ferveur actuelle</span>
                            </div>
                        </div>
                        <div className={styles.statsRow}>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>{profile.gods_owned.length}/12</span>
                                <span className={styles.statLabel}>Dieux obtenus</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>0</span>
                                <span className={styles.statLabel}>Défis réalisés</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Historique des parties */}
                <section className={styles.historySection}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionIcon}>📜</span>
                        <span className={styles.sectionTitle}>Historique des parties</span>
                    </div>
                    <div className={styles.historyContent}>
                        {historyLoading ? (
                            <div className={styles.noHistory}>
                                <span>⏳</span>
                                <span>Chargement...</span>
                            </div>
                        ) : matchHistory.length === 0 ? (
                            <div className={styles.noHistory}>
                                <span>🎮</span>
                                <span>Aucune partie classée jouée</span>
                            </div>
                        ) : (
                            matchHistory.map((match) => (
                                <div key={match.id} className={`${styles.matchCard} ${match.result === 'victory' ? styles.matchWin : styles.matchLoss}`}>
                                    <span className={styles.matchOpponent}>vs {match.opponent_name}</span>

                                    <div className={styles.matchResult}>
                                        <span className={`${styles.matchResultText} ${match.result === 'victory' ? styles.win : styles.loss}`}>
                                            {match.result === 'victory' ? 'VICTOIRE' : 'DÉFAITE'}
                                        </span>
                                        <span className={styles.matchTurns}>{formatMatchDate(match.created_at)}</span>
                                    </div>

                                    <span className={`${styles.matchFerveurChange} ${match.ferveur_change >= 0 ? styles.win : styles.loss}`}>
                                        {match.ferveur_change >= 0 ? '+' : ''}{match.ferveur_change} 🔥
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div >

            {/* Modal Changer d'avatar */}
            {
                showAvatarModal && (
                    <div className={styles.modalOverlay} onClick={() => setShowAvatarModal(false)}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <button className={styles.modalClose} onClick={() => setShowAvatarModal(false)}>✕</button>
                            <h2 className={styles.modalTitle}>🎭 Choisir un avatar</h2>

                            {/* Section Dieux débloqués */}
                            <h3 className={styles.modalSubtitle}>Mes Dieux</h3>
                            <div className={styles.avatarGrid}>
                                {profile.gods_owned.map((godId) => {
                                    const god = ALL_GODS.find(g => g.id === godId);
                                    if (!god) return null;
                                    const avatarPath = god.imageUrl;
                                    return (
                                        <button
                                            key={godId}
                                            className={`${styles.avatarOptionImage} ${profile.avatar === avatarPath ? styles.selected : ''}`}
                                            onClick={() => {
                                                handleAvatarChange(avatarPath);
                                                setShowAvatarModal(false);
                                            }}
                                        >
                                            <Image
                                                src={avatarPath}
                                                alt={god.name}
                                                width={50}
                                                height={50}
                                                className={styles.avatarGodImage}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )
            }
        </main >
    );
}
