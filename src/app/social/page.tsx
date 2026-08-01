'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { useAuth } from '@/contexts/AuthContext';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { RequireAuth } from '@/components/Auth/RequireAuth';
import { getRankByFerveur, RANKS } from '@/data/ranks';
import {
    getFriendsList,
    getPendingRequests,
    getLeaderboard,
    searchUsers,
    sendFriendRequest,
    respondFriendRequest,
    removeFriendship,
    blockUser,
    toggleFavoriteFriend,
    type FriendEntry,
    type PendingRequestEntry,
    type LeaderboardEntry,
    type UserSearchResult,
} from '@/services/supabase-profile';

type TabType = 'friends' | 'leaderboard';
type FriendStatus = 'online' | 'ingame' | 'offline';

function AvatarImage({ src, alt, size }: { src: string; alt: string; size: number }) {
    const url = src && src.startsWith('/') ? src : '/avatars/default.png';
    return <Image src={url} alt={alt} width={size} height={size} className={styles.avatarImg} />;
}

function getFriendStatus(f: FriendEntry): FriendStatus {
    if (f.in_game) return 'ingame';
    if (f.online) return 'online';
    return 'offline';
}

function getStatusText(status: FriendStatus): string {
    switch (status) {
        case 'online': return 'En ligne';
        case 'ingame': return 'En partie';
        default: return 'Hors ligne';
    }
}

export default function SocialPage() {
    return (
        <RequireAuth>
            <SocialContent />
        </RequireAuth>
    );
}

function SocialContent() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const { createPrivateGame, currentGame, leaveGame, getSessionInfo } = useMultiplayer();

    const [activeTab, setActiveTab] = useState<TabType>('friends');

    // Amis
    const [friends, setFriends] = useState<FriendEntry[]>([]);
    const [pendingRequests, setPendingRequests] = useState<PendingRequestEntry[]>([]);
    const [loadingFriends, setLoadingFriends] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [showRequestsModal, setShowRequestsModal] = useState(false);
    const [showOptionsModal, setShowOptionsModal] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [challengeTarget, setChallengeTarget] = useState<FriendEntry | null>(null);

    // Classement
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
    const [expandedRank, setExpandedRank] = useState<string | null>(null);

    const loadFriendsData = useCallback(async () => {
        setLoadingFriends(true);
        try {
            const [f, r] = await Promise.all([getFriendsList(), getPendingRequests()]);
            setFriends(f);
            setPendingRequests(r);
        } catch (err) {
            console.error('Erreur chargement amis:', err);
        } finally {
            setLoadingFriends(false);
        }
    }, []);

    useEffect(() => { loadFriendsData(); }, [loadFriendsData]);

    useEffect(() => {
        if (activeTab !== 'leaderboard') return;
        setLoadingLeaderboard(true);
        getLeaderboard(200)
            .then(setLeaderboard)
            .catch((err) => console.error('Erreur chargement classement:', err))
            .finally(() => setLoadingLeaderboard(false));
    }, [activeTab]);

    // Recherche pour ajouter un ami (débattue, distincte du filtre local ci-dessous)
    useEffect(() => {
        const q = searchQuery.trim();
        if (q.length < 2) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        const timer = setTimeout(async () => {
            try {
                setSearchResults(await searchUsers(q));
            } catch (err) {
                console.error('Erreur recherche:', err);
            } finally {
                setSearching(false);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const filteredFriends = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return friends.filter((f) => f.username.toLowerCase().includes(q));
    }, [friends, searchQuery]);

    const addableResults = useMemo(
        () => searchResults.filter((r) => r.relationship !== 'accepted'),
        [searchResults]
    );

    const myRank = useMemo(() => {
        if (!user) return null;
        const index = leaderboard.findIndex((entry) => entry.id === user.id);
        return index >= 0 ? index + 1 : null;
    }, [leaderboard, user]);

    const handleSendRequest = async (username: string) => {
        setActionMessage(null);
        try {
            const res = await sendFriendRequest(username);
            setActionMessage(res.message);
            if (res.success) {
                setSearchResults(await searchUsers(searchQuery.trim()));
                loadFriendsData();
            }
        } catch {
            setActionMessage("Erreur lors de l'envoi de la demande");
        }
    };

    const handleAccept = async (friendshipId: string) => {
        await respondFriendRequest(friendshipId, true);
        loadFriendsData();
    };

    const handleReject = async (friendshipId: string) => {
        await respondFriendRequest(friendshipId, false);
        loadFriendsData();
    };

    const handleToggleFavorite = async (friendshipId: string) => {
        setFriends((prev) => prev.map((f) => (f.friendship_id === friendshipId ? { ...f, is_favorite: !f.is_favorite } : f)));
        await toggleFavoriteFriend(friendshipId);
    };

    const handleBlock = async (friendshipId: string) => {
        setShowOptionsModal(null);
        await blockUser(friendshipId);
        loadFriendsData();
    };

    const handleRemove = async (friendshipId: string) => {
        setShowOptionsModal(null);
        await removeFriendship(friendshipId);
        loadFriendsData();
    };

    const handleChallenge = async (friend: FriendEntry) => {
        if (!profile?.username) return;
        setChallengeTarget(friend);
        await createPrivateGame(profile.username);
    };

    const closeChallengeModal = () => {
        if (challengeTarget) leaveGame();
        setChallengeTarget(null);
    };

    // Une fois que l'ami rejoint la partie privée créée pour le défi, on embarque comme pour
    // une création de partie privée classique (même logique que src/app/online/page.tsx).
    useEffect(() => {
        if (!challengeTarget || !currentGame || currentGame.status !== 'selecting') return;
        const { gameId, token, isHost } = getSessionInfo();
        if (!gameId || !token) return;
        sessionStorage.setItem('gameId', gameId);
        sessionStorage.setItem('multiplayerToken', token);
        sessionStorage.setItem('isHost', String(isHost));
        sessionStorage.setItem('playerName', profile?.username || '');
        sessionStorage.setItem('opponentName', challengeTarget.username);
        router.push('/online/select');
    }, [currentGame, challengeTarget, profile, router, getSessionInfo]);

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.backButton} aria-label="Retour à l'accueil">
                    <span aria-hidden="true">‹</span>
                </Link>
                <h1 className={styles.title}>Social</h1>
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
                        <div className={styles.searchRow}>
                            <div className={styles.searchContainer}>
                                <span className={styles.searchIcon}>🔍</span>
                                <input
                                    type="text"
                                    placeholder="Rechercher ou ajouter un ami..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={styles.searchInput}
                                />
                            </div>
                            <button className={styles.requestsButton} onClick={() => setShowRequestsModal(true)}>
                                📨
                                {pendingRequests.length > 0 && (
                                    <span className={styles.requestsBadge}>{pendingRequests.length}</span>
                                )}
                            </button>
                        </div>

                        {actionMessage && (
                            <div className={styles.actionMessage} onClick={() => setActionMessage(null)}>
                                {actionMessage}
                            </div>
                        )}

                        {/* Résultats de recherche pour ajouter un nouvel ami */}
                        {searchQuery.trim().length >= 2 && (
                            <div className={styles.searchResultsSection}>
                                {searching ? (
                                    <p className={styles.searchHint}>Recherche...</p>
                                ) : addableResults.length === 0 ? (
                                    <p className={styles.searchHint}>Aucun nouveau joueur trouvé</p>
                                ) : (
                                    addableResults.map((r) => (
                                        <div key={r.id} className={styles.searchResultCard}>
                                            <div className={styles.friendLeft}>
                                                <div className={styles.friendAvatar}>
                                                    <AvatarImage src={r.avatar} alt={r.username} size={40} />
                                                </div>
                                                <span className={styles.friendName}>{r.username}</span>
                                            </div>
                                            {r.relationship === 'pending' ? (
                                                <span className={styles.pendingLabel}>Demande envoyée</span>
                                            ) : r.relationship === 'blocked' ? (
                                                <span className={styles.pendingLabel}>Indisponible</span>
                                            ) : (
                                                <button className={styles.addFriendButton} onClick={() => handleSendRequest(r.username)}>
                                                    + Ajouter
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        <div className={styles.friendsCount}>
                            {filteredFriends.length} ami{filteredFriends.length > 1 ? 's' : ''}
                            <span className={styles.maxFriends}> / 25 max</span>
                        </div>

                        <div className={styles.friendsList}>
                            {loadingFriends ? (
                                <div className={styles.emptyState}>
                                    <p className={styles.emptyMessage}>Chargement...</p>
                                </div>
                            ) : filteredFriends.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <span className={styles.emptyIcon}>👥</span>
                                    <p className={styles.emptyMessage}>Aucun ami trouvé</p>
                                </div>
                            ) : (
                                filteredFriends.map((friend) => {
                                    const status = getFriendStatus(friend);
                                    return (
                                        <div key={friend.friendship_id} className={styles.friendCard}>
                                            <div className={styles.friendLeft}>
                                                <div className={styles.friendAvatar}>
                                                    <AvatarImage src={friend.avatar} alt={friend.username} size={44} />
                                                    <span className={`${styles.statusDot} ${styles[status]}`} />
                                                </div>
                                                <div className={styles.friendInfo}>
                                                    <span className={styles.friendName}>{friend.username}</span>
                                                    <span className={styles.friendStatus}>{getStatusText(status)}</span>
                                                </div>
                                            </div>

                                            <div className={styles.friendActions}>
                                                <button
                                                    className={`${styles.actionButton} ${styles.fightButton}`}
                                                    title="Défier"
                                                    disabled={status === 'offline'}
                                                    onClick={() => handleChallenge(friend)}
                                                >
                                                    ⚔️
                                                </button>
                                                <Link
                                                    href={`/profile/${friend.id}`}
                                                    className={`${styles.actionButton} ${styles.profileButton}`}
                                                    title="Profil"
                                                >
                                                    👤
                                                </Link>
                                                <button
                                                    className={`${styles.actionButton} ${styles.favoriteButton} ${friend.is_favorite ? styles.isFavorite : ''}`}
                                                    onClick={() => handleToggleFavorite(friend.friendship_id)}
                                                    title="Favori"
                                                >
                                                    {friend.is_favorite ? '❤️' : '🤍'}
                                                </button>
                                                <button
                                                    className={`${styles.actionButton} ${styles.optionsButton}`}
                                                    onClick={() => setShowOptionsModal(friend.friendship_id)}
                                                    title="Options"
                                                >
                                                    ⋮
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}

                {/* =============== TAB CLASSEMENT =============== */}
                {activeTab === 'leaderboard' && (
                    <>
                        <div className={styles.leaderboardTitle}>
                            <span>🏆</span>
                            <h2>Classement Global</h2>
                        </div>

                        {loadingLeaderboard ? (
                            <p className={styles.searchHint}>Chargement du classement...</p>
                        ) : leaderboard.length < 3 ? (
                            <p className={styles.searchHint}>Pas encore assez de joueurs classés.</p>
                        ) : (
                            <>
                                {myRank && (
                                    <p className={styles.searchHint}>Votre position : #{myRank}</p>
                                )}

                                {/* Podium Top 3 */}
                                <div className={styles.podium}>
                                    <div className={`${styles.podiumPosition} ${styles.second}`}>
                                        <div className={styles.podiumAvatar}>
                                            <AvatarImage src={leaderboard[1].avatar} alt="" size={50} />
                                        </div>
                                        <span className={styles.podiumRank}>2</span>
                                        <span className={styles.podiumName}>{leaderboard[1].username}</span>
                                        <div className={styles.podiumRankBadge} style={{ background: getRankByFerveur(leaderboard[1].ferveur).gradient }}>
                                            <span>{getRankByFerveur(leaderboard[1].ferveur).icon}</span>
                                            <span>{getRankByFerveur(leaderboard[1].ferveur).name}</span>
                                        </div>
                                        <span className={styles.podiumFerveur}>{leaderboard[1].ferveur} 🔥</span>
                                    </div>

                                    <div className={`${styles.podiumPosition} ${styles.first}`}>
                                        <div className={styles.crownIcon}>👑</div>
                                        <div className={`${styles.podiumAvatar} ${styles.gold}`}>
                                            <AvatarImage src={leaderboard[0].avatar} alt="" size={60} />
                                        </div>
                                        <span className={styles.podiumRank}>1</span>
                                        <span className={styles.podiumName}>{leaderboard[0].username}</span>
                                        <div className={styles.podiumRankBadge} style={{ background: getRankByFerveur(leaderboard[0].ferveur).gradient }}>
                                            <span>{getRankByFerveur(leaderboard[0].ferveur).icon}</span>
                                            <span>{getRankByFerveur(leaderboard[0].ferveur).name}</span>
                                        </div>
                                        <span className={styles.podiumFerveur}>{leaderboard[0].ferveur} 🔥</span>
                                    </div>

                                    <div className={`${styles.podiumPosition} ${styles.third}`}>
                                        <div className={styles.podiumAvatar}>
                                            <AvatarImage src={leaderboard[2].avatar} alt="" size={50} />
                                        </div>
                                        <span className={styles.podiumRank}>3</span>
                                        <span className={styles.podiumName}>{leaderboard[2].username}</span>
                                        <div className={styles.podiumRankBadge} style={{ background: getRankByFerveur(leaderboard[2].ferveur).gradient }}>
                                            <span>{getRankByFerveur(leaderboard[2].ferveur).icon}</span>
                                            <span>{getRankByFerveur(leaderboard[2].ferveur).name}</span>
                                        </div>
                                        <span className={styles.podiumFerveur}>{leaderboard[2].ferveur} 🔥</span>
                                    </div>
                                </div>

                                {/* Liste classement */}
                                <div className={styles.leaderboardList}>
                                    {leaderboard.slice(3, 50).map((player, index) => {
                                        const playerRank = getRankByFerveur(player.ferveur);
                                        return (
                                            <div key={player.id} className={styles.leaderboardRow}>
                                                <span className={styles.rank}>{index + 4}</span>
                                                <div className={styles.playerInfo}>
                                                    <div className={styles.playerAvatar}>
                                                        <AvatarImage src={player.avatar} alt="" size={35} />
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
                            </>
                        )}

                        {/* Section des paliers - Pyramide */}
                        <div className={styles.ranksSection}>
                            <h3 className={styles.ranksSectionTitle}>Votre progression</h3>
                            <div className={styles.pyramid}>
                                {[...RANKS].reverse().map((rank, index) => {
                                    const userFerveur = profile?.ferveur ?? 0;
                                    const userRank = getRankByFerveur(userFerveur);
                                    const isCurrentRank = rank.id === userRank.id;
                                    const isPassed = userFerveur >= rank.minFerveur;
                                    const isExpanded = expandedRank === rank.id;

                                    const friendsInRank = friends.filter((friend) => getRankByFerveur(friend.ferveur).id === rank.id);
                                    const pyramidWidth = 50 + index * 5.5;

                                    return (
                                        <div
                                            key={rank.id}
                                            className={`${styles.pyramidTier} ${isCurrentRank ? styles.currentTier : ''} ${isPassed ? styles.passedTier : styles.lockedTier}`}
                                            style={{ width: `${pyramidWidth}%` }}
                                        >
                                            <div
                                                className={styles.tierHeader}
                                                onClick={() => setExpandedRank(isExpanded ? null : rank.id)}
                                                style={{ background: isPassed ? rank.gradient : 'rgba(60,60,60,0.5)' }}
                                            >
                                                <span className={styles.tierIcon}>{rank.icon}</span>
                                                <span className={styles.tierName}>{rank.name}</span>
                                                <span className={styles.tierFerveur}>{rank.minFerveur}+</span>
                                                {(friendsInRank.length > 0 || isCurrentRank) && (
                                                    <span className={styles.tierBadge}>
                                                        {isCurrentRank ? '👤' : ''}{friendsInRank.length > 0 ? `+${friendsInRank.length}` : ''}
                                                    </span>
                                                )}
                                                <span className={styles.tierArrow}>{isExpanded ? '▼' : '▶'}</span>
                                            </div>

                                            {isExpanded && (
                                                <div className={styles.tierContent}>
                                                    {isCurrentRank && (
                                                        <div className={styles.tierUser}>
                                                            <span className={styles.tierUserIcon}>👤</span>
                                                            <span className={styles.tierUserName}>Vous</span>
                                                            <span className={styles.tierUserFerveur}>{userFerveur} 🔥</span>
                                                        </div>
                                                    )}
                                                    {friendsInRank.map((friend) => (
                                                        <div key={friend.id} className={styles.tierFriend}>
                                                            <span className={styles.tierFriendName}>{friend.username}</span>
                                                            <span className={styles.tierFriendFerveur}>{friend.ferveur} 🔥</span>
                                                        </div>
                                                    ))}
                                                    {!isCurrentRank && friendsInRank.length === 0 && (
                                                        <div className={styles.tierEmpty}>Personne dans ce palier</div>
                                                    )}
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
                        <h2 className={styles.modalTitle}>📨 Demandes d&apos;amis</h2>
                        {pendingRequests.length === 0 ? (
                            <div className={styles.emptyRequests}>
                                <span>📭</span>
                                <p>Aucune demande</p>
                            </div>
                        ) : (
                            <div className={styles.requestsList}>
                                {pendingRequests.map((request) => (
                                    <div key={request.friendship_id} className={styles.requestCard}>
                                        <div className={styles.requestLeft}>
                                            <div className={styles.requestAvatar}>
                                                <AvatarImage src={request.avatar} alt={request.username} size={40} />
                                            </div>
                                            <div className={styles.requestInfo}>
                                                <span className={styles.requestName}>{request.username}</span>
                                            </div>
                                        </div>
                                        <div className={styles.requestActions}>
                                            <Link href={`/profile/${request.id}`} className={styles.requestProfileButton}>👤</Link>
                                            <button className={styles.acceptButton} onClick={() => handleAccept(request.friendship_id)}>✓</button>
                                            <button className={styles.rejectButton} onClick={() => handleReject(request.friendship_id)}>✕</button>
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
                        <button className={`${styles.optionItem} ${styles.danger}`} onClick={() => handleBlock(showOptionsModal)}>
                            <span>🚫</span> Bloquer
                        </button>
                        <button className={`${styles.optionItem} ${styles.danger}`} onClick={() => handleRemove(showOptionsModal)}>
                            <span>🗑️</span> Supprimer
                        </button>
                        <button className={styles.optionCancel} onClick={() => setShowOptionsModal(null)}>Annuler</button>
                    </div>
                </div>
            )}

            {/* Modal Défi (partie privée créée pour un ami) */}
            {challengeTarget && (
                <div className={styles.modalOverlay} onClick={closeChallengeModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.modalClose} onClick={closeChallengeModal}>✕</button>
                        <h2 className={styles.modalTitle}>⚔️ Défier {challengeTarget.username}</h2>
                        {currentGame?.gameId ? (
                            <>
                                <p className={styles.searchHint}>Partagez ce code avec {challengeTarget.username} :</p>
                                <div className={styles.challengeCode}>{currentGame.gameId}</div>
                                <button
                                    className={styles.addFriendButton}
                                    onClick={() => {
                                        navigator.clipboard.writeText(currentGame.gameId);
                                    }}
                                >
                                    📋 Copier le code
                                </button>
                                <p className={styles.searchHint}>En attente de {challengeTarget.username}...</p>
                            </>
                        ) : (
                            <p className={styles.searchHint}>Création de la partie...</p>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
