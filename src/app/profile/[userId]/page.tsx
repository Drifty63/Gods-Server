'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { RequireAuth } from '@/components/Auth/RequireAuth';
import { getPublicProfile, type PublicProfile } from '@/services/supabase-profile';
import { getRankByFerveur, getRankProgress, getLadder, RANKS } from '@/data/ranks';
import styles from './page.module.css';

export default function PublicProfilePage() {
    return (
        <RequireAuth>
            <PublicProfileContent />
        </RequireAuth>
    );
}

function PublicProfileContent() {
    const params = useParams();
    const userId = typeof params.userId === 'string' ? params.userId : Array.isArray(params.userId) ? params.userId[0] : undefined;

    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!userId) return;
        getPublicProfile(userId)
            .then((p) => {
                if (!p) setNotFound(true);
                else setProfile(p);
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) {
        return (
            <main className={styles.main}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}>⏳</div>
                    <p>Chargement...</p>
                </div>
            </main>
        );
    }

    if (notFound || !profile) {
        return (
            <main className={styles.main}>
                <div className={styles.loadingContainer}>
                    <p>⚠️ Profil introuvable.</p>
                    <Link href="/social" className={styles.linkButton}>‹ Retour</Link>
                </div>
            </main>
        );
    }

    const rank = getRankByFerveur(profile.ferveur);
    const progress = getRankProgress(profile.ferveur);
    /*
     * Le rang public est celui du CLASSÉ, et rien d'autre.
     *
     * Contrairement au profil personnel, qui affiche le meilleur des trois classements, la
     * fonction `get_public_profile` ne renvoie que `ferveur`. Plutôt que de laisser croire à un
     * rang global, l'écran nomme le classement dont il parle.
     */
    const rankedLadder = getLadder('ranked');
    const nextRank = RANKS[RANKS.findIndex(r => r.id === rank.id) + 1];
    const ferveurToNext = nextRank ? Math.max(0, nextRank.minFerveur - profile.ferveur) : 0;
    const winRate = profile.stats.totalGames > 0
        ? ((profile.stats.victories / profile.stats.totalGames) * 100).toFixed(1)
        : '0.0';
    // Un avatar est soit un chemin d'image, soit un emoji (choisi à l'inscription) : les deux
    // doivent s'afficher, sinon les joueurs à emoji apparaissent tous en avatar par défaut.
    const avatarIsImage = !!profile.avatar && profile.avatar.startsWith('/');

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <Link href="/social" className={styles.backButton} aria-label="Retour">
                    <span aria-hidden="true">‹</span>
                </Link>
                <h1 className={styles.title}>Profil</h1>
            </header>

            <div className={styles.content}>
                <section className={styles.profileCard}>
                    <div className={styles.avatarContainer}>
                        {avatarIsImage ? (
                            <Image src={profile.avatar} alt={profile.username} width={80} height={80} className={styles.avatarImage} />
                        ) : (
                            <span className={styles.avatarEmoji} role="img" aria-label={profile.username}>
                                {profile.avatar || '👤'}
                            </span>
                        )}
                    </div>
                    <div className={styles.profileInfo}>
                        <h2 className={styles.username}>{profile.username}</h2>
                        <div className={styles.rankBadge} style={{ background: rank.gradient }}>
                            <span>{rank.icon}</span>
                            <span>{rank.name}</span>
                        </div>
                    </div>
                </section>

                <section className={styles.statsSection}>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progress}%`, background: rank.gradient }} />
                    </div>
                    {/* Même lecture que sur son propre profil : le classement est nommé, et la
                        barre annonce ce qui RESTE à parcourir plutôt qu'un total qu'on prend
                        pour un plafond. */}
                    <p className={styles.progressText}>
                        {rankedLadder.icon} {rankedLadder.label} — {profile.ferveur} 🔥
                        {nextRank
                            ? ` · encore ${ferveurToNext} avant ${nextRank.icon} ${nextRank.name}`
                            : ' · rang maximal'}
                    </p>

                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{profile.stats.totalGames}</span>
                            <span className={styles.statLabel}>Parties jouées</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{winRate}%</span>
                            <span className={styles.statLabel}>Taux de victoire</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{profile.stats.bestStreak}</span>
                            <span className={styles.statLabel}>Meilleure série</span>
                        </div>
                        {/*
                          * « Victoires » remplace « Niveau », qui ne voulait rien dire : la
                          * colonne `level` existe en base avec une valeur par défaut de 1 et
                          * n'est mise à jour NULLE PART. Tous les profils affichaient donc
                          * « Niveau 1 », à vie.
                          */}
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{profile.stats.victories}</span>
                            <span className={styles.statLabel}>Victoires</span>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
