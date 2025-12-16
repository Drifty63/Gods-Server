'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// Données mock pour les amis
const MOCK_FRIENDS = [
    { id: 1, username: 'ZeusLord', level: 15, status: 'online', avatar: '⚡', lastSeen: 'En ligne' },
    { id: 2, username: 'PoseidonKing', level: 12, status: 'online', avatar: '💧', lastSeen: 'En ligne' },
    { id: 3, username: 'HadesReaper', level: 18, status: 'ingame', avatar: '🔥', lastSeen: 'En partie' },
    { id: 4, username: 'AthenaWise', level: 10, status: 'offline', avatar: '☀️', lastSeen: 'Il y a 2h' },
    { id: 5, username: 'AresWarrior', level: 14, status: 'offline', avatar: '🌿', lastSeen: 'Il y a 5h' },
];

// Données mock pour les demandes d'amis
const MOCK_REQUESTS = [
    { id: 1, username: 'NyxShadow', level: 8, avatar: '💀' },
    { id: 2, username: 'ApollonMusic', level: 11, avatar: '💨' },
];

// Données mock pour le classement
const MOCK_LEADERBOARD = [
    { rank: 1, username: 'DivineMaster', level: 25, wins: 156, avatar: '👑' },
    { rank: 2, username: 'OlympusChamp', level: 23, wins: 142, avatar: '⚡' },
    { rank: 3, username: 'TitanSlayer', level: 22, wins: 138, avatar: '🔥' },
    { rank: 4, username: 'GodOfWar', level: 21, wins: 127, avatar: '⚔️' },
    { rank: 5, username: 'MythicHero', level: 20, wins: 118, avatar: '🏛️' },
];

type TabType = 'friends' | 'requests' | 'leaderboard';

export default function SocialPage() {
    const [activeTab, setActiveTab] = useState<TabType>('friends');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFriends = MOCK_FRIENDS.filter(friend =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.backButton}>← Retour</Link>
                <h1 className={styles.title}>Social</h1>
                <div className={styles.headerRight} />
            </header>

            {/* Onglets */}
            <div className={styles.tabsContainer}>
                <button
                    className={`${styles.tab} ${activeTab === 'friends' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    👥 Amis
                    <span className={styles.tabBadge}>{MOCK_FRIENDS.filter(f => f.status !== 'offline').length}</span>
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'requests' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    📨 Demandes
                    {MOCK_REQUESTS.length > 0 && (
                        <span className={styles.tabBadgeAlert}>{MOCK_REQUESTS.length}</span>
                    )}
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'leaderboard' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('leaderboard')}
                >
                    🏆 Classement
                </button>
            </div>

            <div className={styles.content}>
                {/* Tab Amis */}
                {activeTab === 'friends' && (
                    <>
                        {/* Barre de recherche */}
                        <div className={styles.searchContainer}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input
                                type="text"
                                placeholder="Rechercher un ami..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>

                        {/* Liste des amis */}
                        <div className={styles.friendsList}>
                            {filteredFriends.length === 0 ? (
                                <p className={styles.emptyMessage}>Aucun ami trouvé</p>
                            ) : (
                                filteredFriends.map(friend => (
                                    <div key={friend.id} className={styles.friendCard}>
                                        <div className={styles.friendAvatar}>
                                            <span>{friend.avatar}</span>
                                            <span className={`${styles.statusDot} ${styles[friend.status]}`} />
                                        </div>
                                        <div className={styles.friendInfo}>
                                            <span className={styles.friendName}>{friend.username}</span>
                                            <span className={styles.friendLevel}>Niveau {friend.level}</span>
                                        </div>
                                        <div className={styles.friendStatus}>
                                            <span className={styles.lastSeen}>{friend.lastSeen}</span>
                                            {friend.status === 'online' && (
                                                <button className={styles.inviteButton}>Défier</button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Bouton ajouter ami */}
                        <button className={styles.addFriendButton}>
                            ➕ Ajouter un ami
                        </button>
                    </>
                )}

                {/* Tab Demandes */}
                {activeTab === 'requests' && (
                    <div className={styles.requestsList}>
                        {MOCK_REQUESTS.length === 0 ? (
                            <p className={styles.emptyMessage}>Aucune demande en attente</p>
                        ) : (
                            <>
                                <p className={styles.requestsInfo}>
                                    {MOCK_REQUESTS.length} demande(s) en attente
                                </p>
                                {MOCK_REQUESTS.map(request => (
                                    <div key={request.id} className={styles.requestCard}>
                                        <div className={styles.friendAvatar}>
                                            <span>{request.avatar}</span>
                                        </div>
                                        <div className={styles.friendInfo}>
                                            <span className={styles.friendName}>{request.username}</span>
                                            <span className={styles.friendLevel}>Niveau {request.level}</span>
                                        </div>
                                        <div className={styles.requestActions}>
                                            <button className={styles.acceptButton}>✓</button>
                                            <button className={styles.rejectButton}>✕</button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* Tab Classement */}
                {activeTab === 'leaderboard' && (
                    <div className={styles.leaderboard}>
                        <div className={styles.leaderboardHeader}>
                            <span className={styles.rankHeader}>#</span>
                            <span className={styles.playerHeader}>Joueur</span>
                            <span className={styles.winsHeader}>Victoires</span>
                        </div>
                        {MOCK_LEADERBOARD.map((player, index) => (
                            <div
                                key={player.rank}
                                className={`${styles.leaderboardRow} ${index < 3 ? styles.topThree : ''}`}
                            >
                                <span className={`${styles.rank} ${styles[`rank${player.rank}`]}`}>
                                    {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : player.rank}
                                </span>
                                <div className={styles.playerInfo}>
                                    <span className={styles.playerAvatar}>{player.avatar}</span>
                                    <div className={styles.playerDetails}>
                                        <span className={styles.playerName}>{player.username}</span>
                                        <span className={styles.playerLevel}>Niv. {player.level}</span>
                                    </div>
                                </div>
                                <span className={styles.wins}>{player.wins}</span>
                            </div>
                        ))}

                        {/* Position du joueur */}
                        <div className={styles.myRankContainer}>
                            <p className={styles.myRankLabel}>Votre classement</p>
                            <div className={styles.myRank}>
                                <span className={styles.rank}>42</span>
                                <div className={styles.playerInfo}>
                                    <span className={styles.playerAvatar}>⚡</span>
                                    <div className={styles.playerDetails}>
                                        <span className={styles.playerName}>OlympianWarrior</span>
                                        <span className={styles.playerLevel}>Niv. 12</span>
                                    </div>
                                </div>
                                <span className={styles.wins}>47</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
