'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useAuth } from '@/contexts/AuthContext';
import { RequireAuth } from '@/components/Auth/RequireAuth';
import { ALL_GODS } from '@/data/gods';
import styles from './page.module.css';

// Configuration du mode Duel
const DUEL_CONFIG = {
    MAX_BUDGET: 13,
    MAX_CHARACTERS: 4,
    COSTS: {
        god: 5,
        creature: 3,  // À venir
        servant: 2,   // À venir
    }
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
    const [selectedGods, setSelectedGods] = useState<string[]>([]);
    const [searchTime, setSearchTime] = useState(0);

    // Calcul du budget utilisé
    const budgetUsed = selectedGods.length * DUEL_CONFIG.COSTS.god;
    const budgetRemaining = DUEL_CONFIG.MAX_BUDGET - budgetUsed;
    const maxGodsAllowed = Math.floor(DUEL_CONFIG.MAX_BUDGET / DUEL_CONFIG.COSTS.god); // 2 avec 13 pts

    // Dieux possédés par le joueur
    const ownedGods = ALL_GODS.filter(
        god => !god.hidden && (profile?.collection?.godsOwned?.includes(god.id) || profile?.isCreator)
    );

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
            sessionStorage.setItem('selectedGods', JSON.stringify(selectedGods));
            if (opponentName) {
                sessionStorage.setItem('opponentName', opponentName);
            }
            router.push('/online/select');
        }
    }, [currentGame, profile, opponentName, router, selectedGods]);

    const handleSelectGod = (godId: string) => {
        if (selectedGods.includes(godId)) {
            setSelectedGods(selectedGods.filter(id => id !== godId));
        } else if (selectedGods.length < maxGodsAllowed && selectedGods.length < DUEL_CONFIG.MAX_CHARACTERS) {
            setSelectedGods([...selectedGods, godId]);
        }
    };

    const handleStartSearch = () => {
        if (!profile?.username) {
            alert('Vous devez être connecté pour jouer en Duel');
            return;
        }
        if (selectedGods.length < 2) {
            alert('Sélectionnez au moins 2 dieux');
            return;
        }
        setView('searching');
        sessionStorage.setItem('gameMode', 'duel');
        sessionStorage.setItem('selectedGods', JSON.stringify(selectedGods));
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
                                <li>🐉 Créature = {DUEL_CONFIG.COSTS.creature} points <span className={styles.soon}>(bientôt)</span></li>
                                <li>👤 Serviteur = {DUEL_CONFIG.COSTS.servant} points <span className={styles.soon}>(bientôt)</span></li>
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
                            {selectedGods.length === 0
                                ? `Sélectionnez jusqu'à ${maxGodsAllowed} dieux (${DUEL_CONFIG.COSTS.god} pts chacun)`
                                : `${selectedGods.length} dieu${selectedGods.length > 1 ? 'x' : ''} sélectionné${selectedGods.length > 1 ? 's' : ''} • ${budgetRemaining} pts restants`
                            }
                        </p>

                        <div className={styles.godsGrid}>
                            {ownedGods.map(god => {
                                const isSelected = selectedGods.includes(god.id);
                                const canSelect = isSelected || (selectedGods.length < maxGodsAllowed && budgetRemaining >= DUEL_CONFIG.COSTS.god);

                                return (
                                    <div
                                        key={god.id}
                                        className={`${styles.godCard} ${isSelected ? styles.selected : ''} ${!canSelect && !isSelected ? styles.disabled : ''}`}
                                        onClick={() => canSelect && handleSelectGod(god.id)}
                                    >
                                        <div
                                            className={styles.godImage}
                                            style={{ backgroundImage: `url(${god.imageUrl})` }}
                                        />
                                        <div className={styles.godInfo}>
                                            <span className={styles.godName}>{god.name.split(',')[0]}</span>
                                            <span className={styles.godCost}>{DUEL_CONFIG.COSTS.god} pts</span>
                                        </div>
                                        {isSelected && (
                                            <div className={styles.selectedBadge}>
                                                {selectedGods.indexOf(god.id) + 1}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className={styles.selectActions}>
                            <button
                                className={styles.backBtn}
                                onClick={() => { setView('menu'); setSelectedGods([]); }}
                            >
                                Retour
                            </button>
                            <button
                                className={styles.confirmBtn}
                                onClick={handleStartSearch}
                                disabled={selectedGods.length < 2}
                            >
                                🔍 Trouver un adversaire ({selectedGods.length}/{maxGodsAllowed})
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
                                {selectedGods.map(godId => {
                                    const god = ALL_GODS.find(g => g.id === godId);
                                    return god ? (
                                        <div
                                            key={godId}
                                            className={styles.teamIcon}
                                            style={{ backgroundImage: `url(${god.imageUrl})` }}
                                            title={god.name}
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
