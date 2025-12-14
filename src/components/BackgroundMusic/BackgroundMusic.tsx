'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';

export default function BackgroundMusic() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const gameState = useGameStore(state => state.gameState);

    // Initialiser l'audio
    useEffect(() => {
        audioRef.current = new Audio('/audio/battle_theme.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3; // Volume par défaut à 30%

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Gérer la lecture en fonction de l'état du jeu
    useEffect(() => {
        if (!audioRef.current) return;

        const shouldPlay = gameState?.status === 'playing';

        if (shouldPlay && !isPlaying) {
            // Tentative de lecture (peut être bloqué par le navigateur sans interaction utilisateur)
            const playPromise = audioRef.current.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsPlaying(true);
                        console.log('Musique démarrée');
                    })
                    .catch(error => {
                        console.log('Lecture auto bloquée:', error);
                        // On réessaiera lors de la première interaction
                    });
            }
        } else if (!shouldPlay && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            console.log('Musique arrêtée');
        }
    }, [gameState?.status, isPlaying]);

    // Ajouter un bouton muet discret si besoin
    return null; // Composant invisible pour l'instant
}
