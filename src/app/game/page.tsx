'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import GameBoard from '@/components/GameBoard/GameBoard';
import TeamSelection from '@/components/TeamSelection/TeamSelection';
import { ALL_GODS, getGodById } from '@/data/gods';
import { createDeck } from '@/data/spells';
import styles from './page.module.css';
import Link from 'next/link';

type GamePhase = 'team_selection' | 'playing' | 'loading' | 'error';

export default function GamePage() {
    const { gameState, initGame, resetGame } = useGameStore();
    const [phase, setPhase] = useState<GamePhase>('team_selection');
    const [error, setError] = useState<string | null>(null);

    const handleTeamsSelected = (playerTeam: string[], aiTeam: string[]) => {
        try {
            setPhase('loading');

            const player1Gods = playerTeam.map(id => getGodById(id)).filter(Boolean) as typeof ALL_GODS;
            const player2Gods = aiTeam.map(id => getGodById(id)).filter(Boolean) as typeof ALL_GODS;

            if (player1Gods.length !== 4 || player2Gods.length !== 4) {
                throw new Error('Impossible de charger tous les dieux');
            }

            const player1Deck = createDeck(playerTeam);
            const player2Deck = createDeck(aiTeam);

            // Décider aléatoirement qui commence
            const isPlayer1First = Math.random() > 0.5;

            initGame(player1Gods, player1Deck, player2Gods, player2Deck, isPlayer1First);
            setPhase('playing');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de l\'initialisation');
            setPhase('error');
        }
    };

    const handleNewGame = () => {
        resetGame();
        setPhase('team_selection');
        setError(null);
    };

    if (phase === 'team_selection') {
        return <TeamSelection onTeamsSelected={handleTeamsSelected} />;
    }

    if (phase === 'loading') {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.loadingContent}>
                    <div className={styles.spinner}></div>
                    <h2>Préparation du combat...</h2>
                    <p>Les dieux prennent position</p>
                </div>
            </div>
        );
    }

    if (phase === 'error' || error) {
        return (
            <div className={styles.errorScreen}>
                <div className={styles.errorContent}>
                    <h2>⚠️ Erreur</h2>
                    <p>{error}</p>
                    <p className={styles.hint}>
                        Note: Pour jouer, vous devez d'abord ajouter les données de toutes vos cartes
                        dans les fichiers <code>src/data/gods.ts</code> et <code>src/data/spells.ts</code>
                    </p>
                    <div className={styles.buttonGroup}>
                        <button onClick={handleNewGame} className={styles.retryButton}>
                            🔄 Réessayer
                        </button>
                        <Link href="/" className={styles.homeButton}>
                            🏠 Retour à l'accueil
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.backButton}>
                    ← Retour
                </Link>
                <h1 className={styles.title}>GODS</h1>
                <button onClick={handleNewGame} className={styles.resetButton}>
                    🔄 Nouvelle partie
                </button>
            </header>

            {/* Plateau de jeu */}
            <GameBoard />
        </main>
    );
}
