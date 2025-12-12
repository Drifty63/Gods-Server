'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function FriendsPage() {
    const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'search'>('friends');
    const [searchQuery, setSearchQuery] = useState('');

    // Données placeholder
    const friends = [
        { id: 1, name: 'Zeus_Master', status: 'online', god: '⚡', level: 47, lastPlayed: 'Il y a 5 min' },
        { id: 2, name: 'Athena_Sage', status: 'ingame', god: '☀️', level: 45, lastPlayed: 'En partie' },
        { id: 3, name: 'Poseidon_Pro', status: 'offline', god: '💧', level: 44, lastPlayed: 'Il y a 2h' },
        { id: 4, name: 'AresWarrior', status: 'online', god: '🔥', level: 42, lastPlayed: 'Il y a 10 min' },
        { id: 5, name: 'HadesKing', status: 'offline', god: '💀', level: 41, lastPlayed: 'Il y a 1j' },
    ];

    const pendingRequests = [
        { id: 1, name: 'ArtemisHunt', god: '🌿', level: 40, type: 'received' },
        { id: 2, name: 'DionysusWine', god: '🌿', level: 38, type: 'sent' },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return styles.online;
            case 'ingame': return styles.ingame;
            default: return styles.offline;
        }
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
                <Link href="/" className={styles.backButton}>← Retour</Link>
                <h1 className={styles.title}>👥 Amis</h1>
                <span className={styles.friendCount}>{friends.length}</span>
            </header>

            <div className={styles.content}>
                {/* Onglets */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'friends' ? styles.active : ''}`}
                        onClick={() => setActiveTab('friends')}
                    >
                        Amis ({friends.length})
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'pending' ? styles.active : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        En attente ({pendingRequests.length})
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'search' ? styles.active : ''}`}
                        onClick={() => setActiveTab('search')}
                    >
                        Rechercher
                    </button>
                </div>

                {/* Liste des amis */}
                {activeTab === 'friends' && (
                    <section className={styles.friendsList}>
                        {friends.map((friend) => (
                            <div key={friend.id} className={styles.friendCard}>
                                <div className={styles.friendAvatar}>
                                    <span className={styles.avatarIcon}>{friend.god}</span>
                                    <span className={`${styles.statusDot} ${getStatusColor(friend.status)}`} />
                                </div>
                                <div className={styles.friendInfo}>
                                    <span className={styles.friendName}>{friend.name}</span>
                                    <span className={styles.friendLevel}>Niveau {friend.level}</span>
                                    <span className={`${styles.friendStatus} ${getStatusColor(friend.status)}`}>
                                        {getStatusText(friend.status)}
                                    </span>
                                </div>
                                <div className={styles.friendActions}>
                                    {friend.status !== 'offline' && (
                                        <button className={styles.inviteButton}>Inviter</button>
                                    )}
                                    <button className={styles.moreButton}>⋮</button>
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {/* Demandes en attente */}
                {activeTab === 'pending' && (
                    <section className={styles.pendingList}>
                        {pendingRequests.length === 0 ? (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>📭</span>
                                <p>Aucune demande en attente</p>
                            </div>
                        ) : (
                            pendingRequests.map((request) => (
                                <div key={request.id} className={styles.pendingCard}>
                                    <div className={styles.friendAvatar}>
                                        <span className={styles.avatarIcon}>{request.god}</span>
                                    </div>
                                    <div className={styles.friendInfo}>
                                        <span className={styles.friendName}>{request.name}</span>
                                        <span className={styles.friendLevel}>Niveau {request.level}</span>
                                        <span className={styles.requestType}>
                                            {request.type === 'received' ? 'Vous a envoyé une demande' : 'Demande envoyée'}
                                        </span>
                                    </div>
                                    <div className={styles.pendingActions}>
                                        {request.type === 'received' ? (
                                            <>
                                                <button className={styles.acceptButton}>✓</button>
                                                <button className={styles.declineButton}>✕</button>
                                            </>
                                        ) : (
                                            <button className={styles.cancelButton}>Annuler</button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </section>
                )}

                {/* Recherche */}
                {activeTab === 'search' && (
                    <section className={styles.searchSection}>
                        <div className={styles.searchBox}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input
                                type="text"
                                placeholder="Rechercher un joueur..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>

                        <div className={styles.addByCodeSection}>
                            <h3>Ajouter par code ami</h3>
                            <p>Demandez à votre ami son code pour l'ajouter directement</p>
                            <div className={styles.codeInput}>
                                <input type="text" placeholder="Code ami" maxLength={8} />
                                <button className={styles.addButton}>Ajouter</button>
                            </div>
                        </div>

                        <div className={styles.myCodeSection}>
                            <h3>Votre code ami</h3>
                            <div className={styles.myCode}>
                                <span>GODS-7X9K</span>
                                <button className={styles.copyButton}>📋 Copier</button>
                            </div>
                        </div>
                    </section>
                )}

                {/* Quick Actions */}
                <section className={styles.quickActions}>
                    <button className={styles.actionButton}>
                        <span className={styles.actionIcon}>📨</span>
                        <span>Inviter des amis</span>
                    </button>
                    <button className={styles.actionButton}>
                        <span className={styles.actionIcon}>🔗</span>
                        <span>Lier Discord</span>
                    </button>
                </section>
            </div>
        </main>
    );
}
