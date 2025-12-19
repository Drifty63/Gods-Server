'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { useAuth } from '@/contexts/AuthContext';

// Données mock pour les amis (limité à 25)
const MOCK_FRIENDS = [
    { id: 1, odemonUid: 'uid1', username: 'ZeusLord', level: 15, status: 'online', avatar: '⚡', isFavorite: false },
    { id: 2, odemonUid: 'uid2', username: 'PoseidonKing', level: 12, status: 'online', avatar: '💧', isFavorite: true },
    { id: 3, odemonUid: 'uid3', username: 'HadesReaper', level: 18, status: 'ingame', avatar: '🔥', isFavorite: false },
    { id: 4, odemonUid: 'uid4', username: 'AthenaWise', level: 10, status: 'offline', avatar: '☀️', isFavorite: false },
    { id: 5, odemonUid: 'uid5', username: 'AresWarrior', level: 14, status: 'offline', avatar: '🌿', isFavorite: true },
];

// Données mock pour les demandes d'amis
const MOCK_REQUESTS = [
    { id: 1, odemonUid: 'req1', username: 'NyxShadow', level: 8, avatar: '💀' },
    { id: 2, odemonUid: 'req2', username: 'ApollonMusic', level: 11, avatar: '💨' },
];

// Données mock pour le classement
const MOCK_LEADERBOARD = [
    { odemonUid: 'uid1', username: 'DivineMaster', level: 25, eloRating: 1850, mostPlayedGodImage: '/cards/gods/zeus.png', stats: { gamesWon: 156 } },
    { odemonUid: 'uid2', username: 'OlympusChamp', level: 23, eloRating: 1780, mostPlayedGodImage: '/cards/gods/poseidon.png', stats: { gamesWon: 142 } },
    { odemonUid: 'uid3', username: 'TitanSlayer', level: 22, eloRating: 1720, mostPlayedGodImage: '/cards/gods/hades.png', stats: { gamesWon: 138 } },
    { odemonUid: 'uid4', username: 'GodOfWar', level: 21, eloRating: 1680, mostPlayedGodImage: '/cards/gods/ares.png', stats: { gamesWon: 127 } },
    { odemonUid: 'uid5', username: 'MythicHero', level: 20, eloRating: 1620, mostPlayedGodImage: '/cards/gods/athena.png', stats: { gamesWon: 118 } },
    { odemonUid: 'uid6', username: 'LightBringer', level: 19, eloRating: 1580, mostPlayedGodImage: '/cards/gods/apollon.png', stats: { gamesWon: 105 } },
    { odemonUid: 'uid7', username: 'ShadowMaster', level: 18, eloRating: 1540, mostPlayedGodImage: '/cards/gods/nyx.png', stats: { gamesWon: 98 } },
    { odemonUid: 'uid8', username: 'SeaKing', level: 17, eloRating: 1500, mostPlayedGodImage: '/cards/gods/poseidon.png', stats: { gamesWon: 92 } },
];

type TabType = 'friends' | 'leaderboard';

export default function SocialPage() {
    const { user, profile } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('friends');

    // États pour les amis
    const [searchQuery, setSearchQuery] = useState('');
    const [showRequestsModal, setShowRequestsModal] = useState(false);
    const [showOptionsModal, setShowOptionsModal] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<string[]>(
        MOCK_FRIENDS.filter(f => f.isFavorite).map(f => f.odemonUid)
    );

    // États pour le classement
    const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');

    const filteredFriends = MOCK_FRIENDS
        .filter(friend => friend.username.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 25);

    const toggleFavorite = (odemonUid: string) => {
        setFavorites(prev =>
            prev.includes(odemonUid)
                ? prev.filter(id => id !== odemonUid)
                : [...prev, odemonUid]
        );
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'online': return 'En ligne';
            case 'ingame': return 'En partie';
            default: return 'Hors ligne';
        }
    };

    // Classement
    const myRank = useMemo(() => {
        if (!user) return null;
        const index = MOCK_LEADERBOARD.findIndex(entry => entry.odemonUid === user.uid);
        return index >= 0 ? index + 1 : null;
    }, [user]);

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.backButton}>‹ Retour</Link>
                <h1 className={styles.title}>SOCIAL</h1>
            </header>

            {/* Onglets */}
            <div className={styles.tabsContainer}>
                <button
                    className={`${styles.tab} ${activeTab === 'friends' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    👥 Amis
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'leaderboard' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('leaderboard')}
                >
                    🏆 Classement
                </button>
            </div>

            <div className={styles.content}>
                {/* =============== TAB AMIS =============== */}
                {activeTab === 'friends' && (
                    <>
                        {/* Barre de recherche + Bouton demandes */}
                        <div className={styles.searchRow}>
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
                            <button
                                className={styles.requestsButton}
                                onClick={() => setShowRequestsModal(true)}
                            >
                                📨
                                {MOCK_REQUESTS.length > 0 && (
                                    <span className={styles.requestsBadge}>{MOCK_REQUESTS.length}</span>
                                )}
                            </button>
                        </div>

                        {/* Compteur amis */}
                        <div className={styles.friendsCount}>
                            {filteredFriends.length} ami{filteredFriends.length > 1 ? 's' : ''}
                            <span className={styles.maxFriends}> / 25 max</span>
                        </div>

                        {/* Liste des amis */}
                        <div className={styles.friendsList}>
                            {filteredFriends.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <span className={styles.emptyIcon}>👥</span>
                                    <p className={styles.emptyMessage}>Aucun ami trouvé</p>
                                </div>
                            ) : (
                                filteredFriends.map(friend => (
                                    <div key={friend.id} className={styles.friendCard}>
                                        <div className={styles.friendLeft}>
                                            <div className={styles.friendAvatar}>
                                                <span>{friend.avatar}</span>
                                                <span className={`${styles.statusDot} ${styles[friend.status]}`} />
                                            </div>
                                            <div className={styles.friendInfo}>
                                                <span className={styles.friendName}>{friend.username}</span>
                                                <span className={styles.friendStatus}>{getStatusText(friend.status)}</span>
                                            </div>
                                        </div>

                                        <div className={styles.friendActions}>
                                            <button
                                                className={`${styles.actionButton} ${styles.fightButton}`}
                                                title="Défier"
                                                disabled={friend.status === 'offline'}
                                            >
                                                ⚔️
                                            </button>
                                            <Link
                                                href={`/profile/${friend.odemonUid}`}
                                                className={`${styles.actionButton} ${styles.profileButton}`}
                                                title="Profil"
                                            >
                                                👤
                                            </Link>
                                            <button
                                                className={`${styles.actionButton} ${styles.favoriteButton} ${favorites.includes(friend.odemonUid) ? styles.isFavorite : ''}`}
                                                onClick={() => toggleFavorite(friend.odemonUid)}
                                                title="Favori"
                                            >
                                                {favorites.includes(friend.odemonUid) ? '❤️' : '🤍'}
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.optionsButton}`}
                                                onClick={() => setShowOptionsModal(friend.odemonUid)}
                                                title="Options"
                                            >
                                                ⋮
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {/* =============== TAB CLASSEMENT =============== */}
                {activeTab === 'leaderboard' && (
                    <>
                        {/* Filtres */}
                        <div className={styles.filters}>
                            <button
                                className={`${styles.filterButton} ${timeFilter === 'all' ? styles.activeFilter : ''}`}
                                onClick={() => setTimeFilter('all')}
                            >
                                🏆 Global
                            </button>
                            <button
                                className={`${styles.filterButton} ${timeFilter === 'month' ? styles.activeFilter : ''}`}
                                onClick={() => setTimeFilter('month')}
                            >
                                📅 Mois
                            </button>
                            <button
                                className={`${styles.filterButton} ${timeFilter === 'week' ? styles.activeFilter : ''}`}
                                onClick={() => setTimeFilter('week')}
                            >
                                📆 Semaine
                            </button>
                        </div>

                        {/* Podium Top 3 */}
                        <div className={styles.podium}>
                            {/* 2ème place */}
                            <div className={`${styles.podiumPosition} ${styles.second}`}>
                                <div className={styles.podiumAvatar}>
                                    <Image src={MOCK_LEADERBOARD[1].mostPlayedGodImage} alt="" width={50} height={50} className={styles.podiumImage} />
                                </div>
                                <span className={styles.podiumRank}>2</span>
                                <span className={styles.podiumName}>{MOCK_LEADERBOARD[1].username}</span>
                                <span className={styles.podiumScore}>{MOCK_LEADERBOARD[1].stats.gamesWon} V</span>
                            </div>

                            {/* 1ère place */}
                            <div className={`${styles.podiumPosition} ${styles.first}`}>
                                <div className={styles.crownIcon}>👑</div>
                                <div className={`${styles.podiumAvatar} ${styles.gold}`}>
                                    <Image src={MOCK_LEADERBOARD[0].mostPlayedGodImage} alt="" width={60} height={60} className={styles.podiumImage} />
                                </div>
                                <span className={styles.podiumRank}>1</span>
                                <span className={styles.podiumName}>{MOCK_LEADERBOARD[0].username}</span>
                                <span className={styles.podiumScore}>{MOCK_LEADERBOARD[0].stats.gamesWon} V</span>
                            </div>

                            {/* 3ème place */}
                            <div className={`${styles.podiumPosition} ${styles.third}`}>
                                <div className={styles.podiumAvatar}>
                                    <Image src={MOCK_LEADERBOARD[2].mostPlayedGodImage} alt="" width={50} height={50} className={styles.podiumImage} />
                                </div>
                                <span className={styles.podiumRank}>3</span>
                                <span className={styles.podiumName}>{MOCK_LEADERBOARD[2].username}</span>
                                <span className={styles.podiumScore}>{MOCK_LEADERBOARD[2].stats.gamesWon} V</span>
                            </div>
                        </div>

                        {/* Liste classement */}
                        <div className={styles.leaderboardList}>
                            {MOCK_LEADERBOARD.slice(3).map((player, index) => (
                                <div key={player.odemonUid} className={styles.leaderboardRow}>
                                    <span className={styles.rank}>{index + 4}</span>
                                    <div className={styles.playerInfo}>
                                        <div className={styles.playerAvatar}>
                                            <Image src={player.mostPlayedGodImage} alt="" width={35} height={35} className={styles.avatarImage} />
                                        </div>
                                        <div className={styles.playerDetails}>
                                            <span className={styles.playerName}>{player.username}</span>
                                            <span className={styles.playerLevel}>Niv. {player.level}</span>
                                        </div>
                                    </div>
                                    <span className={styles.wins}>{player.stats.gamesWon}</span>
                                    <span className={styles.rating}>{player.eloRating}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Modal Demandes d'amis */}
            {showRequestsModal && (
                <div className={styles.modalOverlay} onClick={() => setShowRequestsModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.modalClose} onClick={() => setShowRequestsModal(false)}>✕</button>
                        <h2 className={styles.modalTitle}>📨 Demandes d'amis</h2>
                        {MOCK_REQUESTS.length === 0 ? (
                            <div className={styles.emptyRequests}>
                                <span>📭</span>
                                <p>Aucune demande</p>
                            </div>
                        ) : (
                            <div className={styles.requestsList}>
                                {MOCK_REQUESTS.map(request => (
                                    <div key={request.id} className={styles.requestCard}>
                                        <div className={styles.requestLeft}>
                                            <div className={styles.requestAvatar}><span>{request.avatar}</span></div>
                                            <div className={styles.requestInfo}>
                                                <span className={styles.requestName}>{request.username}</span>
                                                <span className={styles.requestLevel}>Niv. {request.level}</span>
                                            </div>
                                        </div>
                                        <div className={styles.requestActions}>
                                            <Link href={`/profile/${request.odemonUid}`} className={styles.requestProfileButton}>👤</Link>
                                            <button className={styles.acceptButton}>✓</button>
                                            <button className={styles.rejectButton}>✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Options */}
            {showOptionsModal && (
                <div className={styles.modalOverlay} onClick={() => setShowOptionsModal(null)}>
                    <div className={styles.optionsModalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.optionItem}><span>🔇</span> Masquer notifications</button>
                        <button className={styles.optionItem}><span>🚫</span> Bloquer</button>
                        <button className={`${styles.optionItem} ${styles.danger}`}><span>🗑️</span> Supprimer</button>
                        <button className={styles.optionCancel} onClick={() => setShowOptionsModal(null)}>Annuler</button>
                    </div>
                </div>
            )}
        </main>
    );
}
