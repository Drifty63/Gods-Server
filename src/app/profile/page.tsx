'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { getMostPlayedGod, getMatchHistory, isUsernameTaken, type MatchHistoryEntry } from '@/services/supabase-profile';
import { toast } from '@/lib/toast';
import { ALL_GODS, getOwnedGods, getReleasedUnits, ownsCard } from '@/data/gods';
import { getRankByFerveur, getRankProgress, getLadder } from '@/data/ranks';
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
    const [showNameModal, setShowNameModal] = useState(false);
    const [draftName, setDraftName] = useState('');
    const [savingName, setSavingName] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);
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

    /**
     * Changement de pseudo. C'est le nom vu par TOUS les autres joueurs (classement, liste
     * d'amis, historique de matchs, adversaire en partie), donc il doit rester unique : la
     * base porte un index unique insensible à la casse, et on interroge d'abord
     * `is_username_taken` pour prévenir avant l'échec plutôt qu'après.
     */
    const handleUsernameSave = async () => {
        const next = draftName.trim();
        setNameError(null);

        if (next === profile?.username) { setShowNameModal(false); return; }
        // Mêmes bornes qu'à l'inscription : un pseudo trop court est illisible dans un
        // classement, trop long il déborde des cartes de joueur.
        if (next.length < 3) { setNameError('3 caractères minimum.'); return; }
        if (next.length > 20) { setNameError('20 caractères maximum.'); return; }

        setSavingName(true);
        try {
            if (await isUsernameTaken(next)) {
                setNameError('Ce pseudo est déjà pris.');
                return;
            }
            await updateProfile(next, profile!.avatar);
            toast.success('Pseudo mis à jour');
            setShowNameModal(false);
        } catch (err) {
            setNameError(err instanceof Error ? err.message : 'Impossible de changer le pseudo.');
        } finally {
            setSavingName(false);
        }
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

    // Portraits utilisables comme avatar : tout ce que le joueur possède réellement.
    const releasedUnits = getReleasedUnits();
    const isOwned = (card: typeof ALL_GODS[number]) =>
        ownsCard(card, profile.gods_owned, profile.is_creator);
    const avatarSections = [
        { label: 'Mes Dieux', cards: getOwnedGods(profile.gods_owned, profile.is_creator) },
        { label: 'Mes Créatures', cards: releasedUnits.creatures.filter(isOwned) },
        { label: 'Mes Serviteurs', cards: releasedUnits.servants.filter(isOwned) },
    ];

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.backButton} aria-label="Retour à l'accueil">
                    <span aria-hidden="true">‹</span>
                </Link>
                <h1 className={styles.title}>Profil</h1>
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
                            {/* Le pseudo devient modifiable : c'est le nom que voient tous les
                                autres joueurs (classement, amis, historique), et rien ne
                                permettait de le changer après l'inscription. */}
                            <button
                                className={styles.usernameButton}
                                onClick={() => {
                                    setDraftName(profile.username);
                                    setNameError(null);
                                    setShowNameModal(true);
                                }}
                                aria-label={`Modifier le pseudo, actuellement ${profile.username}`}
                            >
                                <h2 className={styles.username}>{profile.username}</h2>
                                <span className={styles.usernameEditIcon} aria-hidden="true">✏️</span>
                            </button>
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
                                        <span className={styles.matchTurns}>
                                        {getLadder(match.mode).short} • {formatMatchDate(match.created_at)}
                                    </span>
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
                showNameModal && (
                    <div className={styles.modalOverlay} onClick={() => setShowNameModal(false)}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <button className={styles.modalClose} onClick={() => setShowNameModal(false)}>✕</button>
                            <h2 className={styles.modalTitle}>✏️ Changer de pseudo</h2>
                            <p className={styles.modalHint}>
                                Ce nom vous identifie auprès des autres joueurs : classement, liste d&apos;amis
                                et historique de parties.
                            </p>

                            <input
                                type="text"
                                className={styles.nameInput}
                                value={draftName}
                                onChange={(e) => { setDraftName(e.target.value); setNameError(null); }}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleUsernameSave(); }}
                                placeholder="Votre pseudo"
                                maxLength={20}
                                autoFocus
                                aria-label="Nouveau pseudo"
                            />

                            <div className={styles.nameMeta}>
                                <span className={nameError ? styles.nameErrorText : styles.nameCounter}>
                                    {nameError ?? `${draftName.trim().length}/20 caractères`}
                                </span>
                            </div>

                            <button
                                className={styles.nameSaveButton}
                                onClick={handleUsernameSave}
                                disabled={savingName || draftName.trim() === profile.username}
                            >
                                {savingName ? '⏳ Vérification…' : '✓ Enregistrer'}
                            </button>
                        </div>
                    </div>
                )
            }

            {
                showAvatarModal && (
                    <div className={styles.modalOverlay} onClick={() => setShowAvatarModal(false)}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <button className={styles.modalClose} onClick={() => setShowAvatarModal(false)}>✕</button>
                            <h2 className={styles.modalTitle}>🎭 Choisir un avatar</h2>

                            {/* Dieux, créatures et serviteurs possédés.
                              *
                              * Les créatures et serviteurs ne sont pas achetés : ils appartiennent au
                              * joueur dès qu'il possède le dieu dont ils dépendent. `ownsCard` remonte
                              * cette chaîne `affiliatedTo` — c'est le même mécanisme que la Collection,
                              * et c'est pour ça qu'on ne peut pas se contenter de `gods_owned`. */}
                            {avatarSections.map(section => section.cards.length > 0 && (
                                <div key={section.label}>
                                    <h3 className={styles.modalSubtitle}>{section.label}</h3>
                                    <div className={styles.avatarGrid}>
                                        {section.cards.map((card) => (
                                            <button
                                                key={card.id}
                                                className={`${styles.avatarOptionImage} ${profile.avatar === card.imageUrl ? styles.selected : ''}`}
                                                onClick={() => {
                                                    handleAvatarChange(card.imageUrl);
                                                    setShowAvatarModal(false);
                                                }}
                                            >
                                                <Image
                                                    src={card.imageUrl}
                                                    alt={card.name}
                                                    width={50}
                                                    height={50}
                                                    className={styles.avatarGodImage}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }
        </main >
    );
}
