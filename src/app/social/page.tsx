'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { useAuth } from '@/contexts/AuthContext';
import { getRankByFerveur, getRankProgress, RANKS } from '@/data/ranks';

// Données mock pour les amis (limité à 25) avec Ferveur
const MOCK_FRIENDS = [
    { id: 1, odemonUid: 'uid1', username: 'ZeusLord', level: 15, status: 'online', avatar: '⚡', isFavorite: false, ferveur: 1280 },
    { id: 2, odemonUid: 'uid2', username: 'PoseidonKing', level: 12, status: 'online', avatar: '💧', isFavorite: true, ferveur: 720 },
    { id: 3, odemonUid: 'uid3', username: 'HadesReaper', level: 18, status: 'ingame', avatar: '🔥', isFavorite: false, ferveur: 1650 },
    { id: 4, odemonUid: 'uid4', username: 'AthenaWise', level: 10, status: 'offline', avatar: '☀️', isFavorite: false, ferveur: 380 },
    { id: 5, odemonUid: 'uid5', username: 'AresWarrior', level: 14, status: 'offline', avatar: '🌿', isFavorite: true, ferveur: 550 },
];

// Données mock pour les demandes d'amis
const MOCK_REQUESTS = [
    { id: 1, odemonUid: 'req1', username: 'NyxShadow', level: 8, avatar: '💀' },
    { id: 2, odemonUid: 'req2', username: 'ApollonMusic', level: 11, avatar: '💨' },
];

// Données mock pour le classement avec Ferveur (Top 100 joueurs max)
const MOCK_LEADERBOARD = [
    { odemonUid: 'uid1', username: 'DivineMaster', level: 25, ferveur: 2650, mostPlayedGodImage: '/cards/gods/zeus.png', stats: { gamesWon: 156 } },
    { odemonUid: 'uid2', username: 'OlympusChamp', level: 23, ferveur: 2180, mostPlayedGodImage: '/cards/gods/poseidon.png', stats: { gamesWon: 142 } },
    { odemonUid: 'uid3', username: 'TitanSlayer', level: 22, ferveur: 1820, mostPlayedGodImage: '/cards/gods/hades.png', stats: { gamesWon: 138 } },
    { odemonUid: 'uid4', username: 'GodOfWar', level: 21, ferveur: 1560, mostPlayedGodImage: '/cards/gods/ares.png', stats: { gamesWon: 127 } },
    { odemonUid: 'uid5', username: 'MythicHero', level: 20, ferveur: 1320, mostPlayedGodImage: '/cards/gods/athena.png', stats: { gamesWon: 118 } },
    { odemonUid: 'uid6', username: 'LightBringer', level: 19, ferveur: 980, mostPlayedGodImage: '/cards/gods/apollon.png', stats: { gamesWon: 105 } },
    { odemonUid: 'uid7', username: 'ShadowMaster', level: 18, ferveur: 620, mostPlayedGodImage: '/cards/gods/nyx.png', stats: { gamesWon: 98 } },
    { odemonUid: 'uid8', username: 'SeaKing', level: 17, ferveur: 340, mostPlayedGodImage: '/cards/gods/poseidon.png', stats: { gamesWon: 92 } },
].sort((a, b) => b.ferveur - a.ferveur).slice(0, 100); // Tri par ferveur décroissante, max 100

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
                        {/* Titre Classement Global */}
                        <div className={styles.leaderboardTitle}>
                            <span>🏆</span>
                            <h2>Classement Global</h2>
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
                                <div className={styles.podiumRankBadge} style={{ background: getRankByFerveur(MOCK_LEADERBOARD[1].ferveur).gradient }}>
                                    <span>{getRankByFerveur(MOCK_LEADERBOARD[1].ferveur).icon}</span>
                                    <span>{getRankByFerveur(MOCK_LEADERBOARD[1].ferveur).name}</span>
                                </div>
                                <span className={styles.podiumFerveur}>{MOCK_LEADERBOARD[1].ferveur} 🔥</span>
                            </div>

                            {/* 1ère place */}
                            <div className={`${styles.podiumPosition} ${styles.first}`}>
                                <div className={styles.crownIcon}>👑</div>
                                <div className={`${styles.podiumAvatar} ${styles.gold}`}>
                                    <Image src={MOCK_LEADERBOARD[0].mostPlayedGodImage} alt="" width={60} height={60} className={styles.podiumImage} />
                                </div>
                                <span className={styles.podiumRank}>1</span>
                                <span className={styles.podiumName}>{MOCK_LEADERBOARD[0].username}</span>
                                <div className={styles.podiumRankBadge} style={{ background: getRankByFerveur(MOCK_LEADERBOARD[0].ferveur).gradient }}>
                                    <span>{getRankByFerveur(MOCK_LEADERBOARD[0].ferveur).icon}</span>
                                    <span>{getRankByFerveur(MOCK_LEADERBOARD[0].ferveur).name}</span>
                                </div>
                                <span className={styles.podiumFerveur}>{MOCK_LEADERBOARD[0].ferveur} 🔥</span>
                            </div>

                            {/* 3ème place */}
                            <div className={`${styles.podiumPosition} ${styles.third}`}>
                                <div className={styles.podiumAvatar}>
                                    <Image src={MOCK_LEADERBOARD[2].mostPlayedGodImage} alt="" width={50} height={50} className={styles.podiumImage} />
                                </div>
                                <span className={styles.podiumRank}>3</span>
                                <span className={styles.podiumName}>{MOCK_LEADERBOARD[2].username}</span>
                                <div className={styles.podiumRankBadge} style={{ background: getRankByFerveur(MOCK_LEADERBOARD[2].ferveur).gradient }}>
                                    <span>{getRankByFerveur(MOCK_LEADERBOARD[2].ferveur).icon}</span>
                                    <span>{getRankByFerveur(MOCK_LEADERBOARD[2].ferveur).name}</span>
                                </div>
                                <span className={styles.podiumFerveur}>{MOCK_LEADERBOARD[2].ferveur} 🔥</span>
                            </div>
                        </div>

                        {/* Liste classement */}
                        <div className={styles.leaderboardList}>
                            {MOCK_LEADERBOARD.slice(3).map((player, index) => {
                                const playerRank = getRankByFerveur(player.ferveur);
                                return (
                                    <div key={player.odemonUid} className={styles.leaderboardRow}>
                                        <span className={styles.rank}>{index + 4}</span>
                                        <div className={styles.playerInfo}>
                                            <div className={styles.playerAvatar}>
                                                <Image src={player.mostPlayedGodImage} alt="" width={35} height={35} className={styles.avatarImage} />
                                            </div>
                                            <div className={styles.playerDetails}>
                                                <span className={styles.playerName}>{player.username}</span>
                                                <span className={styles.playerRankBadge} style={{ color: playerRank.color }}>
                                                    {playerRank.icon} {playerRank.name}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={styles.ferveur}>{player.ferveur} 🔥</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Section des paliers */}
                        <div className={styles.ranksSection}>
                            <h3 className={styles.ranksSectionTitle}>Votre progression</h3>
                            <div className={styles.ranksList}>
                                {RANKS.map((rank, index) => {
                                    // TODO: Utiliser profile?.ferveur quand disponible dans UserProfile
                                    const userFerveur = 450; // Valeur mock pour démo
                                    const userRank = getRankByFerveur(userFerveur);
                                    const isCurrentRank = rank.id === userRank.id;
                                    const isPassed = userFerveur >= rank.minFerveur;

                                    // Trouver les amis dans ce palier
                                    const friendsInRank = MOCK_FRIENDS.filter(friend => {
                                        const friendRank = getRankByFerveur(friend.ferveur);
                                        return friendRank.id === rank.id;
                                    });

                                    return (
                                        <div
                                            key={rank.id}
                                            className={`${styles.rankItem} ${isCurrentRank ? styles.currentRankItem : ''} ${isPassed ? styles.passedRank : styles.lockedRank}`}
                                        >
                                            <div className={styles.rankItemIcon} style={{ background: isPassed ? rank.gradient : 'rgba(100,100,100,0.3)' }}>
                                                <span>{rank.icon}</span>
                                            </div>
                                            <div className={styles.rankItemInfo}>
                                                <span className={styles.rankItemName} style={{ color: isPassed ? rank.color : '#666' }}>
                                                    {rank.name}
                                                </span>
                                                <span className={styles.rankItemFerveur}>
                                                    {rank.minFerveur}+ 🔥
                                                </span>
                                                {/* Affichage des amis dans ce palier */}
                                                {friendsInRank.length > 0 && (
                                                    <div className={styles.friendsInRank}>
                                                        {friendsInRank.map(friend => (
                                                            <span key={friend.id} className={styles.friendBubble} title={`${friend.username} - ${friend.ferveur} 🔥`}>
                                                                {friend.avatar}
                                                            </span>
                                                        ))}
                                                        <span className={styles.friendsCount}>
                                                            {friendsInRank.length} ami{friendsInRank.length > 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {isCurrentRank && (
                                                <div className={styles.youAreHere}>
                                                    <span>👈 Vous</span>
                                                    <span className={styles.yourFerveur}>{userFerveur} 🔥</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
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
