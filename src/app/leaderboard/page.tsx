'use client';

import Link from 'next/link';
import styles from './page.module.css';

export default function LeaderboardPage() {
    // Données de classement placeholder
    const myRank = {
        position: 142,
        points: 2450,
        change: 15,
    };

    const topPlayers = [
        { position: 1, name: 'Zeus_Master', points: 4892, level: 47, god: '⚡', godName: 'Zeus' },
        { position: 2, name: 'Athena_Sage', points: 4721, level: 45, god: '☀️', godName: 'Apollon' },
        { position: 3, name: 'Poseidon_Pro', points: 4558, level: 44, god: '💧', godName: 'Poséidon' },
        { position: 4, name: 'AresWarrior', points: 4234, level: 42, god: '🔥', godName: 'Arès' },
        { position: 5, name: 'HadesKing', points: 4102, level: 41, god: '💀', godName: 'Hadès' },
        { position: 6, name: 'ArtemisHunt', points: 3987, level: 40, god: '🌿', godName: 'Artémis' },
        { position: 7, name: 'HephaestusF', points: 3845, level: 39, god: '🔥', godName: 'Héphaïstos' },
        { position: 8, name: 'DionysusWine', points: 3712, level: 38, god: '🌿', godName: 'Dionysos' },
        { position: 9, name: 'HermesSpeed', points: 3654, level: 37, god: '💨', godName: 'Hermès' },
        { position: 10, name: 'NyxShadow', points: 3521, level: 36, god: '💀', godName: 'Nyx' },
    ];

    const getMedal = (position: number) => {
        switch (position) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return null;
        }
    };

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.backButton}>← Retour</Link>
                <h1 className={styles.title}>🏆 Classement</h1>
                <div className={styles.seasonBadge}>Saison 1</div>
            </header>

            <div className={styles.content}>
                {/* Mon classement */}
                <section className={styles.myRankCard}>
                    <div className={styles.myRankInfo}>
                        <span className={styles.myRankLabel}>Votre rang</span>
                        <span className={styles.myRankPosition}>#{myRank.position}</span>
                    </div>
                    <div className={styles.myRankStats}>
                        <div className={styles.myRankPoints}>
                            <span className={styles.pointsIcon}>🏆</span>
                            <span>{myRank.points} pts</span>
                        </div>
                        <div className={`${styles.myRankChange} ${myRank.change > 0 ? styles.positive : styles.negative}`}>
                            {myRank.change > 0 ? '↑' : '↓'} {Math.abs(myRank.change)} depuis hier
                        </div>
                    </div>
                </section>

                {/* Onglets */}
                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${styles.active}`}>Global</button>
                    <button className={styles.tab}>Amis</button>
                    <button className={styles.tab}>Régional</button>
                </div>

                {/* Top 3 */}
                <section className={styles.podium}>
                    {/* 2ème place */}
                    <div className={`${styles.podiumPlace} ${styles.second}`}>
                        <div className={styles.podiumAvatar}>{topPlayers[1].god}</div>
                        <span className={styles.podiumMedal}>🥈</span>
                        <span className={styles.podiumName}>{topPlayers[1].name}</span>
                        <span className={styles.podiumPoints}>{topPlayers[1].points} pts</span>
                    </div>

                    {/* 1ère place */}
                    <div className={`${styles.podiumPlace} ${styles.first}`}>
                        <div className={styles.podiumCrown}>👑</div>
                        <div className={styles.podiumAvatar}>{topPlayers[0].god}</div>
                        <span className={styles.podiumMedal}>🥇</span>
                        <span className={styles.podiumName}>{topPlayers[0].name}</span>
                        <span className={styles.podiumPoints}>{topPlayers[0].points} pts</span>
                    </div>

                    {/* 3ème place */}
                    <div className={`${styles.podiumPlace} ${styles.third}`}>
                        <div className={styles.podiumAvatar}>{topPlayers[2].god}</div>
                        <span className={styles.podiumMedal}>🥉</span>
                        <span className={styles.podiumName}>{topPlayers[2].name}</span>
                        <span className={styles.podiumPoints}>{topPlayers[2].points} pts</span>
                    </div>
                </section>

                {/* Liste des joueurs */}
                <section className={styles.rankingList}>
                    {topPlayers.slice(3).map((player) => (
                        <div key={player.position} className={styles.rankingItem}>
                            <span className={styles.rankPosition}>{player.position}</span>
                            <div className={styles.playerAvatar}>{player.god}</div>
                            <div className={styles.playerInfo}>
                                <span className={styles.playerName}>{player.name}</span>
                                <span className={styles.playerLevel}>Niv. {player.level} • {player.godName}</span>
                            </div>
                            <span className={styles.playerPoints}>{player.points} 🏆</span>
                        </div>
                    ))}
                </section>

                {/* Récompenses */}
                <section className={styles.rewardsSection}>
                    <h3 className={styles.sectionTitle}>🎁 Récompenses de Saison</h3>
                    <div className={styles.rewardsGrid}>
                        <div className={styles.rewardCard}>
                            <span className={styles.rewardIcon}>🥇</span>
                            <span className={styles.rewardLabel}>Top 1</span>
                            <span className={styles.rewardValue}>5000 Or + Titre Exclusif</span>
                        </div>
                        <div className={styles.rewardCard}>
                            <span className={styles.rewardIcon}>🥈</span>
                            <span className={styles.rewardLabel}>Top 10</span>
                            <span className={styles.rewardValue}>2500 Or + Cadre Rare</span>
                        </div>
                        <div className={styles.rewardCard}>
                            <span className={styles.rewardIcon}>🥉</span>
                            <span className={styles.rewardLabel}>Top 100</span>
                            <span className={styles.rewardValue}>1000 Or</span>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
