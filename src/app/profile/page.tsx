'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { getMostPlayedGod } from '@/services/firebase';
import { ALL_GODS } from '@/data/gods';
import { getRankByFerveur, getRankProgress } from '@/data/ranks';
import styles from './page.module.css';

// Données mock pour l'historique des parties (20 dernières)
const MOCK_MATCH_HISTORY = [
    { id: 1, playerGods: ['zeus', 'poseidon', 'athena', 'apollon'], opponentGods: ['hades', 'ares', 'nyx', 'artemis'], result: 'victory', turns: 8 },
    { id: 2, playerGods: ['hades', 'nyx', 'ares', 'hermes'], opponentGods: ['zeus', 'athena', 'artemis', 'poseidon'], result: 'defeat', turns: 12 },
    { id: 3, playerGods: ['apollon', 'artemis', 'hermes', 'athena'], opponentGods: ['poseidon', 'hades', 'nyx', 'ares'], result: 'victory', turns: 6 },
    { id: 4, playerGods: ['zeus', 'ares', 'hephaïstos', 'poseidon'], opponentGods: ['apollon', 'artemis', 'athena', 'hermes'], result: 'victory', turns: 9 },
    { id: 5, playerGods: ['poseidon', 'nyx', 'hermes', 'hades'], opponentGods: ['zeus', 'athena', 'ares', 'apollon'], result: 'defeat', turns: 15 },
    { id: 6, playerGods: ['athena', 'artemis', 'apollon', 'zeus'], opponentGods: ['hephaïstos', 'hermes', 'nyx', 'hades'], result: 'victory', turns: 7 },
];

export default function ProfilePage() {
    const router = useRouter();
    const { user, profile, loading, profileLoading, signOut, updateProfile, refreshProfile } = useAuth();
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

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

    // TODO: Utiliser profile?.ferveur quand disponible dans UserProfile
    const userFerveur = 450; // Valeur mock pour démo
    const userRank = getRankByFerveur(userFerveur);
    const rankProgress = getRankProgress(userFerveur);
    const winRate = profile.stats.totalGames > 0
        ? ((profile.stats.victories / profile.stats.totalGames) * 100).toFixed(1)
        : '0.0';

    // Dieu le plus joué
    const mostPlayed = getMostPlayedGod(profile.godPlayCounts);
    const mostPlayedGod = mostPlayed ? ALL_GODS.find(g => g.id === mostPlayed.godId) : null;

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.backButton}>‹ Retour</Link>
                <h1 className={styles.title}>PROFIL</h1>
                <button className={styles.settingsButton} onClick={handleSignOut}>🚪</button>
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

                {/* Dieu Favori - Affiché en permanence */}
                <section className={styles.favoriteGodSection}>
                    {mostPlayedGod ? (
                        <>
                            <div className={styles.favoriteGodCard}>
                                <Image
                                    src={mostPlayedGod.imageUrl}
                                    alt={mostPlayedGod.name}
                                    width={100}
                                    height={100}
                                    className={styles.favoriteGodImage}
                                />
                                <div className={styles.favoriteGodInfo}>
                                    <span className={styles.favoriteGodLabel}>Dieu Favori</span>
                                    <span className={styles.favoriteGodName}>{mostPlayedGod.name}</span>
                                    <span className={styles.favoriteGodCount}>{mostPlayed?.count} parties jouées</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.noFavoriteGod}>
                            <span>🎮</span>
                            <span>Jouez des parties pour voir votre dieu favori !</span>
                        </div>
                    )}
                </section>

                {/* Statistiques - Accordéon */}
                <section className={styles.statsSection}>
                    <div
                        className={styles.statsHeader}
                        onClick={() => setShowStats(!showStats)}
                    >
                        <span className={styles.statsHeaderIcon}>📊</span>
                        <span className={styles.statsHeaderTitle}>Statistiques</span>
                        <span className={styles.statsHeaderArrow}>{showStats ? '▼' : '▶'}</span>
                    </div>

                    {showStats && (
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
                                    <span className={styles.statValue}>{profile.collection.godsOwned.length}/12</span>
                                    <span className={styles.statLabel}>Dieux obtenus</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statValue}>0</span>
                                    <span className={styles.statLabel}>Défis réalisés</span>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Historique des parties - Accordéon */}
                <section className={styles.historySection}>
                    <div
                        className={styles.historyHeader}
                        onClick={() => setShowHistory(!showHistory)}
                    >
                        <span className={styles.historyHeaderIcon}>📜</span>
                        <span className={styles.historyHeaderTitle}>Historique des parties</span>
                        <span className={styles.historyHeaderArrow}>{showHistory ? '▼' : '▶'}</span>
                    </div>

                    {showHistory && (
                        <div className={styles.historyContent}>
                            {MOCK_MATCH_HISTORY.slice(0, 20).map((match) => {
                                const getGodIcon = (godId: string) => {
                                    const god = ALL_GODS.find(g => g.id === godId);
                                    return god?.imageUrl || '/cards/gods/zeus.png';
                                };

                                return (
                                    <div key={match.id} className={`${styles.matchCard} ${match.result === 'victory' ? styles.matchWin : styles.matchLoss}`}>
                                        {/* Dieux du joueur */}
                                        <div className={styles.matchGods}>
                                            {match.playerGods.map((godId, i) => (
                                                <Image
                                                    key={i}
                                                    src={getGodIcon(godId)}
                                                    alt={godId}
                                                    width={30}
                                                    height={30}
                                                    className={styles.matchGodIcon}
                                                />
                                            ))}
                                        </div>

                                        {/* Résultat */}
                                        <div className={styles.matchResult}>
                                            <span className={`${styles.matchResultText} ${match.result === 'victory' ? styles.win : styles.loss}`}>
                                                {match.result === 'victory' ? 'VICTOIRE' : 'DÉFAITE'}
                                            </span>
                                            <span className={styles.matchTurns}>{match.turns} tours</span>
                                        </div>

                                        {/* Dieux adversaire */}
                                        <div className={styles.matchGods}>
                                            {match.opponentGods.map((godId, i) => (
                                                <Image
                                                    key={i}
                                                    src={getGodIcon(godId)}
                                                    alt={godId}
                                                    width={30}
                                                    height={30}
                                                    className={styles.matchGodIcon}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            {MOCK_MATCH_HISTORY.length === 0 && (
                                <div className={styles.noHistory}>
                                    <span>🎮</span>
                                    <span>Aucune partie en ligne jouée</span>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>

            {/* Modal Changer d'avatar */}
            {showAvatarModal && (
                <div className={styles.modalOverlay} onClick={() => setShowAvatarModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.modalClose} onClick={() => setShowAvatarModal(false)}>✕</button>
                        <h2 className={styles.modalTitle}>🎭 Choisir un avatar</h2>

                        {/* Section Dieux débloqués */}
                        <h3 className={styles.modalSubtitle}>Mes Dieux</h3>
                        <div className={styles.avatarGrid}>
                            {profile.collection.godsOwned.map((godId) => {
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
            )}
        </main>
    );
}
