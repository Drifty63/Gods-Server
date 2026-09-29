'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { RequireAuth } from '@/components/Auth/RequireAuth';
import { getPublicProfile, getMostPlayedGod, type PublicProfile } from '@/services/supabase-profile';
import { getRankByFerveur, getRankProgress, getBestLadder, RANKS } from '@/data/ranks';
import { ACHIEVEMENTS } from '@/data/achievements';
import { ALL_GODS } from '@/data/gods';
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

    /*
     * Exactement les mêmes calculs que sur son propre profil, à partir de la même fonction
     * partagée : deux écrans qui décrivent le même joueur ne peuvent pas lui donner deux rangs.
     *
     * C'était le cas jusqu'ici — `get_public_profile` ne renvoyant que la ferveur du Classé,
     * un joueur dont le meilleur classement est le Duel s'affichait au rang le plus bas des
     * trois sur la page que ses amis consultent.
     */
    const bestLadder = getBestLadder(profile);
    const userFerveur = bestLadder.ferveur;
    const rank = getRankByFerveur(userFerveur);
    const progress = getRankProgress(userFerveur);
    const nextRank = RANKS[RANKS.findIndex(r => r.id === rank.id) + 1];
    const ferveurToNext = nextRank ? Math.max(0, nextRank.minFerveur - userFerveur) : 0;

    const winRate = profile.stats.totalGames > 0
        ? ((profile.stats.victories / profile.stats.totalGames) * 100).toFixed(1)
        : '0.0';

    const mostPlayed = getMostPlayedGod(profile.god_play_counts);
    const mostPlayedGod = mostPlayed ? ALL_GODS.find(g => g.id === mostPlayed.godId) : null;

    /*
     * `gods_owned` contient aussi les créatures et serviteurs, dont les identifiants portent tous
     * un souligné. Sans ce filtre, la statistique affiche « 15/12 ».
     */
    const baseGodsOwnedCount = (profile.gods_owned ?? []).filter(id => !id.includes('_')).length;

    /*
     * Le NOMBRE de hauts faits, pas leur détail : la liste complète est une longue page à elle
     * seule, et ce qu'on veut savoir d'un ami tient dans un compte.
     */
    const unlockedIds = new Set(profile.achievements ?? []);
    const unlockedCount = ACHIEVEMENTS.filter(a => unlockedIds.has(a.id)).length;

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
                    {/* Le classement est nommé, et la barre annonce ce qui RESTE à parcourir
                        plutôt qu'un total qu'on prend pour un plafond. */}
                    <p className={styles.progressText}>
                        {bestLadder.ladder.icon} {bestLadder.ladder.label} — {userFerveur} 🔥
                        {nextRank
                            ? ` · encore ${ferveurToNext} avant ${nextRank.icon} ${nextRank.name}`
                            : ' · rang maximal'}
                    </p>

                    {mostPlayedGod && (
                        <div className={styles.favoriteGod}>
                            <Image
                                src={mostPlayedGod.imageUrl}
                                alt={mostPlayedGod.name}
                                width={50}
                                height={50}
                                className={styles.favoriteGodImage}
                            />
                            <div className={styles.favoriteGodInfo}>
                                <span className={styles.favoriteGodLabel}>Dieu de prédilection</span>
                                <span className={styles.favoriteGodName}>{mostPlayedGod.name}</span>
                                <span className={styles.favoriteGodCount}>{mostPlayed?.count} parties</span>
                            </div>
                        </div>
                    )}

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
                            {/* Le sommet du classement, et non la ferveur du moment affichée
                                juste au-dessus : il survit aux remises à zéro de fin de saison. */}
                            <span className={styles.statValue}>{Math.max(bestLadder.peak, userFerveur)}</span>
                            <span className={styles.statLabel}>🔥 Ferveur max</span>
                        </div>
                        <div className={styles.statItem}>
                            {/* « Obtenue » et non « actuelle » : ce total ne redescend jamais, il
                                mesure l'activité quand les deux autres mesurent le niveau. */}
                            <span className={styles.statValue}>{profile.ferveur_earned ?? 0}</span>
                            <span className={styles.statLabel}>🔥 Ferveur obtenue</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{profile.stats.victories}</span>
                            <span className={styles.statLabel}>Victoires</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{profile.stats.bestStreak}</span>
                            <span className={styles.statLabel}>Meilleure série</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{baseGodsOwnedCount}/12</span>
                            <span className={styles.statLabel}>Dieux obtenus</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{unlockedCount}/{ACHIEVEMENTS.length}</span>
                            <span className={styles.statLabel}>Hauts faits</span>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
