'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import GameBoard from '@/components/GameBoard/GameBoard';
import TeamSelection from '@/components/TeamSelection/TeamSelection';
import RockPaperScissors from '@/components/RockPaperScissors/RockPaperScissors';
import { ALL_GODS, getGodById } from '@/data/gods';
import { createDeck } from '@/data/spells';
import styles from './page.module.css';
import Link from 'next/link';

type GamePhase = 'team_selection' | 'rps' | 'playing' | 'loading' | 'error';

// Stocker temporairement les équipes sélectionnées
interface SelectedTeams {
    playerTeam: string[];
    aiTeam: string[];
}

export default function GamePage() {
    const { initGame, resetGame } = useGameStore();
    const [phase, setPhase] = useState<GamePhase>('team_selection');
    const [error, setError] = useState<string | null>(null);
    const [selectedTeams, setSelectedTeams] = useState<SelectedTeams | null>(null);

    // Étape 1: Sélection des équipes terminée
    const handleTeamsSelected = (playerTeam: string[], aiTeam: string[]) => {
        // Sauvegarder les équipes et passer au Pierre-Feuille-Ciseaux
        setSelectedTeams({ playerTeam, aiTeam });
        setPhase('rps');
    };

    // Étape 2: Pierre-Feuille-Ciseaux terminé
    const handleRPSComplete = (playerGoesFirst: boolean) => {
        if (!selectedTeams) return;

        try {
            setPhase('loading');

            const player1Gods = selectedTeams.playerTeam.map(id => getGodById(id)).filter(Boolean) as typeof ALL_GODS;
            const player2Gods = selectedTeams.aiTeam.map(id => getGodById(id)).filter(Boolean) as typeof ALL_GODS;

            if (player1Gods.length !== 4 || player2Gods.length !== 4) {
                throw new Error('Impossible de charger tous les dieux');
            }

            const player1Deck = createDeck(selectedTeams.playerTeam);
            const player2Deck = createDeck(selectedTeams.aiTeam);

            // Utiliser le résultat du Pierre-Feuille-Ciseaux
            initGame(player1Gods, player1Deck, player2Gods, player2Deck, playerGoesFirst);
            setPhase('playing');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de l\'initialisation');
            setPhase('error');
        }
    };

    const handleNewGame = () => {
        resetGame();
        setSelectedTeams(null);
        setPhase('team_selection');
        setError(null);
    };

    // Phase: Sélection des équipes
    if (phase === 'team_selection') {
        return <TeamSelection onTeamsSelected={handleTeamsSelected} />;
    }

    // Phase: Pierre-Feuille-Ciseaux
    if (phase === 'rps') {
        return <RockPaperScissors onComplete={handleRPSComplete} />;
    }

    // Phase: Chargement
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

    // Phase: Erreur
    if (phase === 'error' || error) {
        return (
            <div className={styles.errorScreen}>
                <div className={styles.errorContent}>
                    <h2>⚠️ Erreur</h2>
                    <p>{error}</p>
                    <p className={styles.hint}>
                        Note: Pour jouer, vous devez d&apos;abord ajouter les données de toutes vos cartes
                        dans les fichiers <code>src/data/gods.ts</code> et <code>src/data/spells.ts</code>
                    </p>
                    <div className={styles.buttonGroup}>
                        <button onClick={handleNewGame} className={styles.retryButton}>
                            🔄 Réessayer
                        </button>
                        <Link href="/" className={styles.homeButton}>
                            🏠 Retour à l&apos;accueil
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Phase: Jeu en cours
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
