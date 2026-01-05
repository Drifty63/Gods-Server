'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useAuth } from '@/contexts/AuthContext';
import { RequireAuth } from '@/components/Auth/RequireAuth';
import { ALL_GODS, getDuelCards } from '@/data/gods';
import type { GodCard } from '@/types/cards';
import styles from './page.module.css';

// Configuration du mode Duel
const DUEL_CONFIG = {
    MAX_BUDGET: 13,
    MAX_CHARACTERS: 4,
    COSTS: {
        god: 5,
        creature: 3,
        servant: 2,
    }
};

// Helper pour obtenir le coût d'une carte
const getCardCost = (card: GodCard): number => {
    if (card.duelCost) return card.duelCost;
    if (card.category === 'creature') return DUEL_CONFIG.COSTS.creature;
    if (card.category === 'servant') return DUEL_CONFIG.COSTS.servant;
    return DUEL_CONFIG.COSTS.god;
};

export default function DuelPage() {
    return (
        <RequireAuth>
            <DuelContent />
        </RequireAuth>
    );
}

function DuelContent() {
    const router = useRouter();
    const { profile } = useAuth();
    const {
        isConnected,
        error,
        clearError,
        isInQueue,
        queueStatus,
        joinQueue,
        leaveQueue,
        currentGame,
        opponentName,
    } = useMultiplayer();

    const [view, setView] = useState<'menu' | 'select' | 'searching'>('menu');
    const [selectedCards, setSelectedCards] = useState<string[]>([]);
    const [searchTime, setSearchTime] = useState(0);

    // Obtenir les cartes par catégorie pour le mode Duel
    const duelCards = getDuelCards(
        profile?.collection?.godsOwned || [],
        profile?.isCreator || false
    );
    const { gods: ownedGods, creatures, servants } = duelCards;

    // Calcul du budget utilisé
    const budgetUsed = selectedCards.reduce((sum, cardId) => {
        const card = ALL_GODS.find(g => g.id === cardId);
        return sum + (card ? getCardCost(card) : 0);
    }, 0);
    const budgetRemaining = DUEL_CONFIG.MAX_BUDGET - budgetUsed;

    // Timer de recherche
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isInQueue) {
            interval = setInterval(() => {
                setSearchTime(prev => prev + 1);
            }, 1000);
        } else {
            setSearchTime(0);
        }
        return () => clearInterval(interval);
    }, [isInQueue]);

    // Redirection quand un match est trouvé
    useEffect(() => {
        if (currentGame && currentGame.status === 'selecting') {
            sessionStorage.setItem('gameId', currentGame.gameId);
            sessionStorage.setItem('isHost', String(currentGame.isHost));
            sessionStorage.setItem('playerName', profile?.username || 'Joueur');
            sessionStorage.setItem('gameMode', 'duel');
            sessionStorage.setItem('selectedGods', JSON.stringify(selectedCards));
            if (opponentName) {
                sessionStorage.setItem('opponentName', opponentName);
            }
            router.push('/online/select');
        }
    }, [currentGame, profile, opponentName, router, selectedCards]);

    const handleSelectCard = (cardId: string) => {
        const card = ALL_GODS.find(g => g.id === cardId);
        if (!card) return;

        const cost = getCardCost(card);

        if (selectedCards.includes(cardId)) {
            setSelectedCards(selectedCards.filter(id => id !== cardId));
        } else if (selectedCards.length < DUEL_CONFIG.MAX_CHARACTERS && budgetRemaining >= cost) {
            setSelectedCards([...selectedCards, cardId]);
        }
    };

    const handleStartSearch = () => {
        if (!profile?.username) {
            alert('Vous devez être connecté pour jouer en Duel');
            return;
        }
        if (selectedCards.length < 2) {
            alert('Sélectionnez au moins 2 cartes');
            return;
        }
        setView('searching');
        sessionStorage.setItem('gameMode', 'duel');
        sessionStorage.setItem('selectedGods', JSON.stringify(selectedCards));
        joinQueue(profile.username);
    };

    const handleCancelSearch = () => {
        leaveQueue();
        setView('select');
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Composant pour afficher une carte sélectionnable
    const CardItem = ({ card, cost }: { card: GodCard; cost: number }) => {
        const isSelected = selectedCards.includes(card.id);
        const canSelect = isSelected || (selectedCards.length < DUEL_CONFIG.MAX_CHARACTERS && budgetRemaining >= cost);

        return (
            <div
                key={card.id}
                className={`${styles.godCard} ${isSelected ? styles.selected : ''} ${!canSelect && !isSelected ? styles.disabled : ''}`}
                onClick={() => canSelect && handleSelectCard(card.id)}
            >
                <div
                    className={styles.godImage}
                    style={{ backgroundImage: `url(${card.imageUrl})` }}
                />
                <div className={styles.godInfo}>
                    <span className={styles.godName}>{card.name.split(',')[0]}</span>
                    <span className={styles.godCost}>{cost} pts</span>
                </div>
                {isSelected && (
                    <div className={styles.selectedBadge}>
                        {selectedCards.indexOf(card.id) + 1}
                    </div>
                )}
            </div>
        );
    };

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/play" className={styles.backButton}>← Retour</Link>
                <h1 className={styles.title}>⚔️ DUEL</h1>
                <div className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected}`}>
                    {isConnected ? '🟢' : '🔴'}
                </div>
            </header>

            <div className={styles.content}>
                {error && (
                    <div className={styles.errorBanner}>
                        <span>⚠️ {error}</span>
                        <button onClick={clearError}>✕</button>
                    </div>
                )}

                {/* Menu principal */}
                {view === 'menu' && (
                    <section className={styles.welcomeSection}>
                        <div className={styles.duelIcon}>⚔️</div>
                        <h2 className={styles.welcomeTitle}>Mode Duel</h2>
                        <p className={styles.welcomeDesc}>
                            Affrontez un adversaire en temps réel avec votre équipe personnalisée !
                        </p>

                        <div className={styles.statsPreview}>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>{profile?.stats?.victories || 0}</span>
                                <span className={styles.statLabel}>Victoires</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>{profile?.stats?.defeats || 0}</span>
                                <span className={styles.statLabel}>Défaites</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>{profile?.stats?.currentStreak || 0}</span>
                                <span className={styles.statLabel}>Série</span>
                            </div>
                        </div>

                        <button
                            className={styles.searchButton}
                            onClick={() => setView('select')}
                            disabled={!isConnected}
                        >
                            {isConnected ? '🎯 Composer mon équipe' : 'Connexion...'}
                        </button>

                        {!isConnected && (
                            <p className={styles.connectionHint}>
                                Connexion au serveur en cours...
                            </p>
                        )}

                        <div className={styles.rulesBox}>
                            <h3>📜 Règles du Duel</h3>
                            <ul>
                                <li>💰 Budget maximum : <strong>{DUEL_CONFIG.MAX_BUDGET} points</strong></li>
                                <li>⚡ Dieu = {DUEL_CONFIG.COSTS.god} points</li>
                                <li>🐉 Créature = {DUEL_CONFIG.COSTS.creature} points</li>
                                <li>👤 Serviteur = {DUEL_CONFIG.COSTS.servant} points</li>
                                <li>🏆 Les victoires augmentent votre classement</li>
                            </ul>
                        </div>
                    </section>
                )}

                {/* Sélection d'équipe */}
                {view === 'select' && (
                    <section className={styles.selectSection}>
                        <h2>Composez votre équipe</h2>

                        {/* Budget */}
                        <div className={styles.budgetBar}>
                            <span className={styles.budgetLabel}>Budget</span>
                            <div className={styles.budgetTrack}>
                                <div
                                    className={styles.budgetFill}
                                    style={{ width: `${(budgetUsed / DUEL_CONFIG.MAX_BUDGET) * 100}%` }}
                                />
                            </div>
                            <span className={styles.budgetValue}>{budgetUsed}/{DUEL_CONFIG.MAX_BUDGET}</span>
                        </div>

                        <p className={styles.selectHint}>
                            {selectedCards.length === 0
                                ? `Sélectionnez vos cartes (max ${DUEL_CONFIG.MAX_CHARACTERS})`
                                : `${selectedCards.length} carte${selectedCards.length > 1 ? 's' : ''} • ${budgetRemaining} pts restants`
                            }
                        </p>

                        {/* Catégorie: Dieux */}
                        <div className={styles.categorySection}>
                            <h3 className={styles.categoryTitle}>⚡ Dieux ({DUEL_CONFIG.COSTS.god} pts)</h3>
                            <div className={styles.godsGrid}>
                                {ownedGods.map(god => (
                                    <CardItem key={god.id} card={god} cost={DUEL_CONFIG.COSTS.god} />
                                ))}
                            </div>
                        </div>

                        {/* Catégorie: Créatures */}
                        {creatures.length > 0 && (
                            <div className={styles.categorySection}>
                                <h3 className={styles.categoryTitle}>🐉 Créatures Mythiques ({DUEL_CONFIG.COSTS.creature} pts)</h3>
                                <div className={styles.godsGrid}>
                                    {creatures.map(creature => (
                                        <CardItem key={creature.id} card={creature} cost={DUEL_CONFIG.COSTS.creature} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Catégorie: Serviteurs */}
                        {servants.length > 0 && (
                            <div className={styles.categorySection}>
                                <h3 className={styles.categoryTitle}>👤 Serviteurs ({DUEL_CONFIG.COSTS.servant} pts)</h3>
                                <div className={styles.godsGrid}>
                                    {servants.map(servant => (
                                        <CardItem key={servant.id} card={servant} cost={DUEL_CONFIG.COSTS.servant} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={styles.selectActions}>
                            <button
                                className={styles.backBtn}
                                onClick={() => { setView('menu'); setSelectedCards([]); }}
                            >
                                Retour
                            </button>
                            <button
                                className={styles.confirmBtn}
                                onClick={handleStartSearch}
                                disabled={selectedCards.length < 2}
                            >
                                🔍 Trouver un adversaire ({selectedCards.length}/4)
                            </button>
                        </div>
                    </section>
                )}

                {/* Recherche en cours */}
                {view === 'searching' && (
                    <section className={styles.searchingSection}>
                        <div className={styles.searchingAnimation}>
                            <div className={styles.pulseRing}></div>
                            <div className={styles.pulseRing} style={{ animationDelay: '0.5s' }}></div>
                            <div className={styles.pulseRing} style={{ animationDelay: '1s' }}></div>
                            <span className={styles.searchIcon}>⚔️</span>
                        </div>

                        <h2 className={styles.searchingTitle}>Recherche d'un adversaire...</h2>
                        <p className={styles.searchTime}>{formatTime(searchTime)}</p>

                        <div className={styles.teamPreview}>
                            <span>Votre équipe :</span>
                            <div className={styles.teamIcons}>
                                {selectedCards.map(cardId => {
                                    const card = ALL_GODS.find(g => g.id === cardId);
                                    return card ? (
                                        <div
                                            key={cardId}
                                            className={styles.teamIcon}
                                            style={{ backgroundImage: `url(${card.imageUrl})` }}
                                            title={card.name}
                                        />
                                    ) : null;
                                })}
                            </div>
                        </div>

                        {queueStatus && (
                            <p className={styles.queueInfo}>
                                {queueStatus.total} joueur{queueStatus.total > 1 ? 's' : ''} en recherche
                            </p>
                        )}

                        <button className={styles.cancelButton} onClick={handleCancelSearch}>
                            Annuler
                        </button>

                        <div className={styles.tips}>
                            <p>💡 Préparez votre stratégie pendant l'attente !</p>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
