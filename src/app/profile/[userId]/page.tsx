'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { RequireAuth } from '@/components/Auth/RequireAuth';
import { getPublicProfile, type PublicProfile } from '@/services/supabase-profile';
import { getRankByFerveur, getRankProgress } from '@/data/ranks';
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
    const winRate = profile.stats.totalGames > 0
        ? ((profile.stats.victories / profile.stats.totalGames) * 100).toFixed(1)
        : '0.0';
    const avatarSrc = profile.avatar && profile.avatar.startsWith('/') ? profile.avatar : '/avatars/default.png';

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
                        <Image src={avatarSrc} alt={profile.username} width={80} height={80} className={styles.avatarImage} />
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
                    <p className={styles.progressText}>{profile.ferveur} 🔥 Ferveur</p>

                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{profile.stats.totalGames}</span>
                            <span className={styles.statLabel}>Parties jouées</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{winRate}%</span>
                            <span className={styles.statLabel}>Victoires</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{profile.stats.bestStreak}</span>
                            <span className={styles.statLabel}>Meilleure série</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{profile.level}</span>
                            <span className={styles.statLabel}>Niveau</span>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
