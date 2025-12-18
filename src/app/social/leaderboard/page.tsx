'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { useAuth } from '@/contexts/AuthContext';
import { getLeaderboard, LeaderboardEntry } from '@/services/firebase';

export default function LeaderboardPage() {
    const { user, profile } = useAuth();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');

    // Charger le classement
    useEffect(() => {
        const loadLeaderboard = async () => {
            setLoading(true);
            try {
                const data = await getLeaderboard(50);
                setLeaderboard(data);
            } catch (error) {
                console.error('Erreur chargement classement:', error);
            }
            setLoading(false);
        };
        loadLeaderboard();
    }, []);

    // Trouver la position du joueur actuel
    const myRank = useMemo(() => {
        if (!user) return null;
        const index = leaderboard.findIndex(entry => entry.odemonUid === user.uid);
        return index >= 0 ? index + 1 : null;
    }, [leaderboard, user]);

    const myEntry = useMemo(() => {
        if (!user) return null;
        return leaderboard.find(entry => entry.odemonUid === user.uid) || null;
    }, [leaderboard, user]);

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/social" className={styles.backButton}>‹ Retour</Link>
                <h1 className={styles.title}>CLASSEMENT</h1>
            </header>

            {/* Filtres */}
            <div className={styles.filters}>
                <button
                    className={`${styles.filterButton} ${timeFilter === 'all' ? styles.active : ''}`}
                    onClick={() => setTimeFilter('all')}
                >
                    🏆 Global
                </button>
                <button
                    className={`${styles.filterButton} ${timeFilter === 'month' ? styles.active : ''}`}
                    onClick={() => setTimeFilter('month')}
                >
                    📅 Ce mois
                </button>
                <button
                    className={`${styles.filterButton} ${timeFilter === 'week' ? styles.active : ''}`}
                    onClick={() => setTimeFilter('week')}
                >
                    📆 Cette semaine
                </button>
            </div>

            {/* Podium Top 3 */}
            {!loading && leaderboard.length >= 3 && (
                <div className={styles.podium}>
                    {/* 2ème place */}
                    <div className={styles.podiumPosition + ' ' + styles.second}>
                        <div className={styles.podiumAvatar}>
                            {leaderboard[1].mostPlayedGodImage ? (
                                <Image
                                    src={leaderboard[1].mostPlayedGodImage}
                                    alt="Avatar"
                                    width={60}
                                    height={60}
                                    className={styles.podiumImage}
                                />
                            ) : (
                                <span className={styles.podiumEmoji}>🥈</span>
                            )}
                        </div>
                        <span className={styles.podiumRank}>2</span>
                        <span className={styles.podiumName}>{leaderboard[1].username}</span>
                        <span className={styles.podiumScore}>{leaderboard[1].stats?.gamesWon || 0} V</span>
                    </div>

                    {/* 1ère place */}
                    <div className={styles.podiumPosition + ' ' + styles.first}>
                        <div className={styles.crownIcon}>👑</div>
                        <div className={styles.podiumAvatar + ' ' + styles.gold}>
                            {leaderboard[0].mostPlayedGodImage ? (
                                <Image
                                    src={leaderboard[0].mostPlayedGodImage}
                                    alt="Avatar"
                                    width={80}
                                    height={80}
                                    className={styles.podiumImage}
                                />
                            ) : (
                                <span className={styles.podiumEmoji}>🥇</span>
                            )}
                        </div>
                        <span className={styles.podiumRank}>1</span>
                        <span className={styles.podiumName}>{leaderboard[0].username}</span>
                        <span className={styles.podiumScore}>{leaderboard[0].stats?.gamesWon || 0} V</span>
                    </div>

                    {/* 3ème place */}
                    <div className={styles.podiumPosition + ' ' + styles.third}>
                        <div className={styles.podiumAvatar}>
                            {leaderboard[2].mostPlayedGodImage ? (
                                <Image
                                    src={leaderboard[2].mostPlayedGodImage}
                                    alt="Avatar"
                                    width={60}
                                    height={60}
                                    className={styles.podiumImage}
                                />
                            ) : (
                                <span className={styles.podiumEmoji}>🥉</span>
                            )}
                        </div>
                        <span className={styles.podiumRank}>3</span>
                        <span className={styles.podiumName}>{leaderboard[2].username}</span>
                        <span className={styles.podiumScore}>{leaderboard[2].stats?.gamesWon || 0} V</span>
                    </div>
                </div>
            )}

            {/* Liste du classement */}
            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loading}>
                        <span className={styles.loadingIcon}>⏳</span>
                        <p>Chargement du classement...</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.leaderboardHeader}>
                            <span className={styles.rankHeader}>#</span>
                            <span className={styles.playerHeader}>Joueur</span>
                            <span className={styles.statsHeader}>Victoires</span>
                            <span className={styles.ratingHeader}>Elo</span>
                        </div>

                        <div className={styles.leaderboardList}>
                            {leaderboard.slice(3).map((player, index) => (
                                <div
                                    key={player.odemonUid}
                                    className={`${styles.leaderboardRow} ${player.odemonUid === user?.uid ? styles.myRow : ''}`}
                                >
                                    <span className={styles.rank}>{index + 4}</span>
                                    <div className={styles.playerInfo}>
                                        <div className={styles.playerAvatar}>
                                            {player.mostPlayedGodImage ? (
                                                <Image
                                                    src={player.mostPlayedGodImage}
                                                    alt="Avatar"
                                                    width={40}
                                                    height={40}
                                                    className={styles.avatarImage}
                                                />
                                            ) : (
                                                <span>⚔️</span>
                                            )}
                                        </div>
                                        <div className={styles.playerDetails}>
                                            <span className={styles.playerName}>{player.username}</span>
                                            <span className={styles.playerLevel}>Niv. {player.level || 1}</span>
                                        </div>
                                    </div>
                                    <span className={styles.wins}>{player.stats?.gamesWon || 0}</span>
                                    <span className={styles.rating}>{player.eloRating || 1000}</span>
                                </div>
                            ))}
                        </div>

                        {/* Ma position */}
                        {myRank && myRank > 3 && myEntry && (
                            <div className={styles.myRankContainer}>
                                <p className={styles.myRankLabel}>Votre classement</p>
                                <div className={styles.myRank}>
                                    <span className={styles.rank}>{myRank}</span>
                                    <div className={styles.playerInfo}>
                                        <div className={styles.playerAvatar}>
                                            {myEntry.mostPlayedGodImage ? (
                                                <Image
                                                    src={myEntry.mostPlayedGodImage}
                                                    alt="Avatar"
                                                    width={40}
                                                    height={40}
                                                    className={styles.avatarImage}
                                                />
                                            ) : (
                                                <span>⚔️</span>
                                            )}
                                        </div>
                                        <div className={styles.playerDetails}>
                                            <span className={styles.playerName}>{profile?.username || 'Joueur'}</span>
                                            <span className={styles.playerLevel}>Niv. {profile?.level || 1}</span>
                                        </div>
                                    </div>
                                    <span className={styles.wins}>{myEntry.stats?.gamesWon || 0}</span>
                                    <span className={styles.rating}>{myEntry.eloRating || 1000}</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
