'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import styles from './page.module.css';

export default function MultiplayerLobbyPage() {
    const router = useRouter();
    const {
        isConnected,
        currentGame,
        availableGames,
        error,
        opponentReady,
        gameStartData,
        createGame,
        joinGame,
        refreshGames,
        selectGods,
    } = useMultiplayer();

    const [playerName, setPlayerName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [view, setView] = useState<'menu' | 'create' | 'join' | 'waiting' | 'selecting'>('menu');

    // Rafraîchir la liste des parties au chargement
    useEffect(() => {
        if (isConnected) {
            refreshGames();
            const interval = setInterval(refreshGames, 3000);
            return () => clearInterval(interval);
        }
    }, [isConnected, refreshGames]);


    // Mettre à jour la vue et sauvegarder les infos dès que currentGame change
    useEffect(() => {
        if (currentGame) {
            // Sauvegarder immédiatement pour les futures pages
            sessionStorage.setItem('gameId', currentGame.gameId);
            sessionStorage.setItem('isHost', String(currentGame.isHost));

            if (currentGame.status === 'waiting') {
                setView('waiting');
            } else if (currentGame.status === 'selecting') {
                setView('selecting');
            }
        }
    }, [currentGame]);

    const handleCreateGame = () => {
        if (playerName.trim()) {
            // Nettoyer les anciennes données de session
            sessionStorage.removeItem('multiplayerData');
            sessionStorage.removeItem('gameId');
            sessionStorage.removeItem('isHost');
            
            sessionStorage.setItem('playerName', playerName.trim());
            createGame(playerName.trim());
        }
    };

    const handleJoinGame = (gameId: string) => {
        if (playerName.trim()) {
            // Nettoyer les anciennes données de session
            sessionStorage.removeItem('multiplayerData');
            
            sessionStorage.setItem('playerName', playerName.trim());
            joinGame(gameId, playerName.trim());
        }
    };

    const handleJoinWithCode = () => {
        if (playerName.trim() && joinCode.trim()) {
            // Nettoyer les anciennes données de session
            sessionStorage.removeItem('multiplayerData');
            
            sessionStorage.setItem('playerName', playerName.trim());
            joinGame(joinCode.trim().toUpperCase(), playerName.trim());
        }
    };

    // Quand la partie est prête, rediriger
    useEffect(() => {
        if (gameStartData) {
            // Stocker les données de démarrage pour la page de jeu
            sessionStorage.setItem('multiplayerData', JSON.stringify(gameStartData));
            sessionStorage.setItem('isHost', String(currentGame?.isHost ?? false));
            if (currentGame?.gameId) {
                sessionStorage.setItem('gameId', currentGame.gameId);
            }
            router.push('/multiplayer/game');
        }
    }, [gameStartData, currentGame, router]);

    // Continuer vers la sélection (pour l'instant, on simule avec des dieux par défaut)
    const handleContinueToSelection = () => {
        router.push('/multiplayer/select');
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>⚔️ Mode Multijoueur</h1>
                <div className={styles.connectionStatus}>
                    <span className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected}`} />
                    {isConnected ? 'Connecté' : 'Déconnecté'}
                </div>
            </header>

            {error && (
                <div className={styles.error}>
                    ⚠️ {error}
                </div>
            )}

            {view === 'menu' && (
                <div className={styles.menu}>
                    <div className={styles.nameInput}>
                        <label>Votre nom :</label>
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Entrez votre nom..."
                            maxLength={20}
                        />
                    </div>

                    <div className={styles.menuButtons}>
                        <button
                            className={styles.createButton}
                            onClick={() => setView('create')}
                            disabled={!playerName.trim() || !isConnected}
                        >
                            🎮 Créer une partie
                        </button>
                        <button
                            className={styles.joinButton}
                            onClick={() => setView('join')}
                            disabled={!playerName.trim() || !isConnected}
                        >
                            🔗 Rejoindre une partie
                        </button>
                    </div>

                    <button className={styles.backButton} onClick={() => router.push('/')}>
                        ← Retour au menu
                    </button>
                </div>
            )}

            {view === 'create' && (
                <div className={styles.createView}>
                    <h2>Créer une partie</h2>
                    <p>Créez une partie et partagez le code avec votre ami</p>
                    <button className={styles.createButton} onClick={handleCreateGame}>
                        ✨ Créer la partie
                    </button>
                    <button className={styles.backButton} onClick={() => setView('menu')}>
                        ← Retour
                    </button>
                </div>
            )}

            {view === 'join' && (
                <div className={styles.joinView}>
                    <h2>Rejoindre une partie</h2>

                    <div className={styles.joinByCode}>
                        <h3>Entrer un code :</h3>
                        <div className={styles.codeInput}>
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="CODE"
                                maxLength={6}
                            />
                            <button onClick={handleJoinWithCode} disabled={!joinCode.trim()}>
                                Rejoindre
                            </button>
                        </div>
                    </div>

                    <div className={styles.gamesList}>
                        <h3>Parties disponibles :</h3>
                        {availableGames.length === 0 ? (
                            <p className={styles.noGames}>Aucune partie disponible</p>
                        ) : (
                            <ul>
                                {availableGames.map((game) => (
                                    <li key={game.id} className={styles.gameItem}>
                                        <span>{game.hostName}</span>
                                        <span className={styles.gameCode}>{game.id}</span>
                                        <button onClick={() => handleJoinGame(game.id)}>
                                            Rejoindre
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <button className={styles.refreshButton} onClick={refreshGames}>
                            🔄 Actualiser
                        </button>
                    </div>

                    <button className={styles.backButton} onClick={() => setView('menu')}>
                        ← Retour
                    </button>
                </div>
            )}

            {view === 'waiting' && currentGame && (
                <div className={styles.waitingView}>
                    <h2>En attente d&apos;un adversaire...</h2>
                    <div className={styles.gameCode}>
                        <p>Code de la partie :</p>
                        <span className={styles.code}>{currentGame.gameId}</span>
                        <p className={styles.hint}>Partagez ce code avec votre ami</p>
                    </div>
                    <div className={styles.loader}>
                        <div className={styles.spinner}></div>
                    </div>
                </div>
            )}

            {view === 'selecting' && currentGame && (
                <div className={styles.selectingView}>
                    <h2>🎯 Adversaire trouvé !</h2>
                    <p>
                        <strong>{currentGame.hostName}</strong> vs <strong>{currentGame.guestName}</strong>
                    </p>
                    {opponentReady && (
                        <p className={styles.opponentReady}>✅ L&apos;adversaire a sélectionné ses dieux</p>
                    )}
                    <button className={styles.continueButton} onClick={handleContinueToSelection}>
                        Sélectionner vos dieux →
                    </button>
                </div>
            )}
        </div>
    );
}
