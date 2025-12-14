'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import styles from './GlobalAudioController.module.css';

export default function GlobalAudioController() {
    const menuAudioRef = useRef<HTMLAudioElement | null>(null);
    const battleAudioRef = useRef<HTMLAudioElement | null>(null);
    const [currentTrack, setCurrentTrack] = useState<'menu' | 'battle' | 'none'>('none');
    const [isMuted, setIsMuted] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    const gameState = useGameStore(state => state.gameState);

    // Initialiser les pistes audio une seule fois
    useEffect(() => {
        menuAudioRef.current = new Audio('/audio/menu_theme.mp3');
        menuAudioRef.current.loop = true;
        menuAudioRef.current.volume = 0.3;

        battleAudioRef.current = new Audio('/audio/battle_theme.mp3');
        battleAudioRef.current.loop = true;
        battleAudioRef.current.volume = 0.3;

        return () => {
            if (menuAudioRef.current) {
                menuAudioRef.current.pause();
                menuAudioRef.current = null;
            }
            if (battleAudioRef.current) {
                battleAudioRef.current.pause();
                battleAudioRef.current = null;
            }
        };
    }, []);

    // Écouter la première interaction utilisateur pour débloquer l'audio
    useEffect(() => {
        const handleInteraction = () => {
            if (!hasInteracted) {
                setHasInteracted(true);
                // Démarrer la musique menu si pas en jeu
                if (!gameState || gameState.status !== 'playing') {
                    playTrack('menu');
                }
            }
        };

        document.addEventListener('click', handleInteraction);
        document.addEventListener('keydown', handleInteraction);

        return () => {
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('keydown', handleInteraction);
        };
    }, [hasInteracted, gameState]);

    // Gérer le changement de piste en fonction de l'état du jeu
    useEffect(() => {
        if (!hasInteracted) return;

        const isInGame = gameState?.status === 'playing';

        if (isInGame && currentTrack !== 'battle') {
            playTrack('battle');
        } else if (!isInGame && currentTrack !== 'menu') {
            playTrack('menu');
        }
    }, [gameState?.status, hasInteracted, currentTrack]);

    // Appliquer le mute/unmute
    useEffect(() => {
        if (menuAudioRef.current) {
            menuAudioRef.current.muted = isMuted;
        }
        if (battleAudioRef.current) {
            battleAudioRef.current.muted = isMuted;
        }
    }, [isMuted]);

    const playTrack = (track: 'menu' | 'battle') => {
        if (isMuted) {
            setCurrentTrack(track);
            return;
        }

        // Arrêter l'autre piste
        if (track === 'menu') {
            if (battleAudioRef.current) {
                battleAudioRef.current.pause();
                battleAudioRef.current.currentTime = 0;
            }
            if (menuAudioRef.current) {
                menuAudioRef.current.play().catch(console.log);
            }
        } else {
            if (menuAudioRef.current) {
                menuAudioRef.current.pause();
                // Ne pas reset le menu pour reprendre où on en était
            }
            if (battleAudioRef.current) {
                battleAudioRef.current.play().catch(console.log);
            }
        }

        setCurrentTrack(track);
    };

    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);

        // Si on unmute, relancer la piste courante
        if (!newMuted && currentTrack !== 'none') {
            if (currentTrack === 'menu' && menuAudioRef.current) {
                menuAudioRef.current.play().catch(console.log);
            } else if (currentTrack === 'battle' && battleAudioRef.current) {
                battleAudioRef.current.play().catch(console.log);
            }
        }
    };

    return (
        <button
            className={styles.muteButton}
            onClick={toggleMute}
            title={isMuted ? 'Activer la musique' : 'Couper la musique'}
        >
            {isMuted ? '🔇' : '🔊'}
        </button>
    );
}
