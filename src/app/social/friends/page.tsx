'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

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

export default function FriendsPage() {
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

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/social" className={styles.backButton}>‹ Retour</Link>
                <h1 className={styles.title}>AMIS</h1>
            </header>

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

            {/* Liste des amis */}
            <div className={styles.content}>
                <div className={styles.friendsCount}>
                    {filteredFriends.length} ami{filteredFriends.length > 1 ? 's' : ''}
                    <span className={styles.maxFriends}> / 25 max</span>
                </div>

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
                                    {/* Bouton Défi */}
                                    <button
                                        className={`${styles.actionButton} ${styles.fightButton}`}
                                        title="Défier en combat privé"
                                        disabled={friend.status === 'offline'}
                                    >
                                        ⚔️
                                    </button>

                                    {/* Bouton Profil */}
                                    <Link
                                        href={`/profile/${friend.odemonUid}`}
                                        className={`${styles.actionButton} ${styles.profileButton}`}
                                        title="Voir le profil"
                                    >
                                        👤
                                    </Link>

                                    {/* Bouton Favoris (cœur) */}
                                    <button
                                        className={`${styles.actionButton} ${styles.favoriteButton} ${favorites.includes(friend.odemonUid) ? styles.isFavorite : ''}`}
                                        onClick={() => toggleFavorite(friend.odemonUid)}
                                        title="Ajouter aux favoris"
                                    >
                                        {favorites.includes(friend.odemonUid) ? '❤️' : '🤍'}
                                    </button>

                                    {/* Bouton Options (3 points) */}
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
                                <p>Aucune demande en attente</p>
                            </div>
                        ) : (
                            <div className={styles.requestsList}>
                                {MOCK_REQUESTS.map(request => (
                                    <div key={request.id} className={styles.requestCard}>
                                        <div className={styles.requestLeft}>
                                            <div className={styles.requestAvatar}>
                                                <span>{request.avatar}</span>
                                            </div>
                                            <div className={styles.requestInfo}>
                                                <span className={styles.requestName}>{request.username}</span>
                                                <span className={styles.requestLevel}>Niveau {request.level}</span>
                                            </div>
                                        </div>
                                        <div className={styles.requestActions}>
                                            <Link
                                                href={`/profile/${request.odemonUid}`}
                                                className={styles.requestProfileButton}
                                                title="Voir le profil"
                                            >
                                                👤
                                            </Link>
                                            <button className={styles.acceptButton} title="Accepter">✓</button>
                                            <button className={styles.rejectButton} title="Refuser">✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Options ami */}
            {showOptionsModal && (
                <div className={styles.modalOverlay} onClick={() => setShowOptionsModal(null)}>
                    <div className={styles.optionsModalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.optionItem}>
                            <span>🔇</span> Masquer les notifications
                        </button>
                        <button className={styles.optionItem}>
                            <span>🚫</span> Bloquer
                        </button>
                        <button className={`${styles.optionItem} ${styles.danger}`}>
                            <span>🗑️</span> Supprimer des amis
                        </button>
                        <button
                            className={styles.optionCancel}
                            onClick={() => setShowOptionsModal(null)}
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
