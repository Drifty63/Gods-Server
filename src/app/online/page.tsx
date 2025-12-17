'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

export default function OnlinePage() {
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
        createPrivateGame,
        joinPrivateGame,
    } = useMultiplayer();

    const [playerName, setPlayerName] = useState('');
    const [mode, setMode] = useState<'menu' | 'matchmaking' | 'private-create' | 'private-join'>('menu');
    const [privateCode, setPrivateCode] = useState('');
    const [searchTime, setSearchTime] = useState(0);

    // Charger le nom sauvegardé
    // Charger le nom sauvegardé ou le profil connecté
    useEffect(() => {
        if (profile?.username) {
            setPlayerName(profile.username);
        } else {
            const savedName = localStorage.getItem('playerName');
            if (savedName) {
                setPlayerName(savedName);
            }
        }
    }, [profile]);

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
            // Sauvegarder les données de session
            sessionStorage.setItem('gameId', currentGame.gameId);
            sessionStorage.setItem('isHost', String(currentGame.isHost));
            sessionStorage.setItem('playerName', playerName);
            if (opponentName) {
                sessionStorage.setItem('opponentName', opponentName);
            }

            router.push('/online/select');
        }
    }, [currentGame, playerName, opponentName, router]);

    const handleJoinQueue = (ranked: boolean = true) => {
        if (!playerName.trim()) {
            alert('Veuillez entrer un nom de joueur');
            return;
        }
        localStorage.setItem('playerName', playerName);
        sessionStorage.setItem('gameMode', ranked ? 'ranked' : 'casual');
        setMode('matchmaking');
        joinQueue(playerName);
    };

    const handleLeaveQueue = () => {
        leaveQueue();
        setMode('menu');
    };

    const handleCreatePrivate = () => {
        if (!playerName.trim()) {
            alert('Veuillez entrer un nom de joueur');
            return;
        }
        localStorage.setItem('playerName', playerName);
        createPrivateGame(playerName);
        setMode('private-create');
    };

    const handleJoinPrivate = () => {
        if (!playerName.trim() || !privateCode.trim()) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        localStorage.setItem('playerName', playerName);
        joinPrivateGame(privateCode.toUpperCase(), playerName);
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
                <Link href="/" className={styles.backButton}>← Retour</Link>
                <h1 className={styles.title}>🌐 Mode En Ligne</h1>
                <div className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected}`}>
                    {isConnected ? '🟢 Connecté' : '🔴 Déconnecté'}
                </div>
            </header>

            <div className={styles.content}>
                {error && (
                    <div className={styles.errorBanner}>
                        <span>⚠️ {error}</span>
                        <button onClick={clearError}>✕</button>
                    </div>
                )}

                {/* MENU PRINCIPAL */}
                {mode === 'menu' && (
                    <>
                        <section className={styles.nameSection}>
                            <label className={styles.label}>
                                {profile ? '👤 Connecté en tant que' : 'Votre pseudonyme'}
                            </label>
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => !profile && setPlayerName(e.target.value)}
                                placeholder="Entrez votre pseudo..."
                                className={styles.input}
                                maxLength={20}
                                disabled={!!profile}
                                style={profile ? { cursor: 'not-allowed', opacity: 0.8, backgroundColor: 'rgba(255,255,255,0.1)' } : undefined}
                            />
                        </section>

                        <section className={styles.modesSection}>
                            <h2>Choisir un mode</h2>

                            <div
                                className={`${styles.modeCard} ${!isConnected ? styles.disabled : ''}`}
                                onClick={isConnected ? () => handleJoinQueue(true) : undefined}
                            >
                                <div className={styles.modeIcon}>⚔️</div>
                                <div className={styles.modeInfo}>
                                    <h3>Partie Classée</h3>
                                    <p>Trouvez automatiquement un adversaire et grimpez dans le classement</p>
                                </div>
                                <span className={styles.modeArrow}>→</span>
                            </div>

                            <div
                                className={`${styles.modeCard} ${!isConnected ? styles.disabled : ''}`}
                                onClick={isConnected ? () => handleJoinQueue(false) : undefined}
                            >
                                <div className={styles.modeIcon}>🎯</div>
                                <div className={styles.modeInfo}>
                                    <h3>Partie Amicale</h3>
                                    <p>Affrontez un adversaire aléatoire sans impact sur le classement</p>
                                </div>
                                <span className={styles.modeArrow}>→</span>
                            </div>

                            <div
                                className={`${styles.modeCard} ${!isConnected ? styles.disabled : ''}`}
                                onClick={isConnected ? handleCreatePrivate : undefined}
                            >
                                <div className={styles.modeIcon}>🔒</div>
                                <div className={styles.modeInfo}>
                                    <h3>Créer une Partie Privée</h3>
                                    <p>Créez un salon et partagez le code avec un ami</p>
                                </div>
                                <span className={styles.modeArrow}>→</span>
                            </div>

                            <div
                                className={`${styles.modeCard} ${!isConnected ? styles.disabled : ''}`}
                                onClick={isConnected ? () => setMode('private-join') : undefined}
                            >
                                <div className={styles.modeIcon}>🎮</div>
                                <div className={styles.modeInfo}>
                                    <h3>Rejoindre une Partie Privée</h3>
                                    <p>Entrez le code d'un ami pour le rejoindre</p>
                                </div>
                                <span className={styles.modeArrow}>→</span>
                            </div>
                        </section>

                        {!isConnected && (
                            <div className={styles.connectionWarning}>
                                <span>⚠️</span>
                                <p>Connexion au serveur en cours... Si cela prend trop de temps, vérifiez votre connexion internet.</p>
                            </div>
                        )}
                    </>
                )}

                {/* MATCHMAKING */}
                {mode === 'matchmaking' && (
                    <section className={styles.matchmakingSection}>
                        <div className={styles.searchingAnimation}>
                            <div className={styles.pulseRing}></div>
                            <div className={styles.pulseRing} style={{ animationDelay: '0.5s' }}></div>
                            <div className={styles.pulseRing} style={{ animationDelay: '1s' }}></div>
                            <span className={styles.searchIcon}>⚔️</span>
                        </div>

                        <h2>Recherche d'un adversaire...</h2>
                        <p className={styles.searchTime}>{formatTime(searchTime)}</p>

                        {queueStatus && (
                            <p className={styles.queueInfo}>
                                Position dans la file: {queueStatus.position} / {queueStatus.total}
                            </p>
                        )}

                        <button className={styles.cancelButton} onClick={handleLeaveQueue}>
                            Annuler la recherche
                        </button>

                        <div className={styles.tips}>
                            <h4>💡 Astuce</h4>
                            <p>Le temps de recherche dépend du nombre de joueurs en ligne.
                                En attendant, révisez vos stratégies !</p>
                        </div>
                    </section>
                )}

                {/* CRÉER PARTIE PRIVÉE */}
                {mode === 'private-create' && currentGame && (
                    <section className={styles.privateSection}>
                        <div className={styles.codeDisplay}>
                            <h2>Code de la partie</h2>
                            <div className={styles.gameCode}>{currentGame.gameId}</div>
                            <button
                                className={styles.copyButton}
                                onClick={() => {
                                    navigator.clipboard.writeText(currentGame.gameId);
                                    alert('Code copié !');
                                }}
                            >
                                📋 Copier le code
                            </button>
                        </div>

                        <div className={styles.waitingForPlayer}>
                            <div className={styles.waitingDots}>
                                <span>.</span><span>.</span><span>.</span>
                            </div>
                            <p>En attente d'un autre joueur...</p>
                        </div>

                        <button className={styles.cancelButton} onClick={() => setMode('menu')}>
                            Annuler
                        </button>
                    </section>
                )}

                {/* REJOINDRE PARTIE PRIVÉE */}
                {mode === 'private-join' && (
                    <section className={styles.joinSection}>
                        <h2>Rejoindre une partie</h2>
                        <p>Entrez le code fourni par votre ami</p>

                        <input
                            type="text"
                            value={privateCode}
                            onChange={(e) => setPrivateCode(e.target.value.toUpperCase())}
                            placeholder="XXXXXX"
                            className={styles.codeInput}
                            maxLength={6}
                        />

                        <div className={styles.joinActions}>
                            <button
                                className={styles.joinButton}
                                onClick={handleJoinPrivate}
                                disabled={privateCode.length < 4}
                            >
                                Rejoindre
                            </button>
                            <button
                                className={styles.cancelButton}
                                onClick={() => setMode('menu')}
                            >
                                Retour
                            </button>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
