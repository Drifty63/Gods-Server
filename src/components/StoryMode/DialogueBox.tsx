'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import styles from './DialogueBox.module.css';
import { DialogueLine } from '@/types/story';
import { getCardImage } from '@/data/gods';

/**
 * Le narrateur n'est pas une carte : son portrait n'existe que pour le mode Histoire, et sert
 * aussi de repli quand un interlocuteur n'a pas d'illustration.
 */
export const NARRATOR_PORTRAIT = '/cards/gods/narrator.png';

interface DialogueBoxProps {
    dialogues: DialogueLine[];
    currentIndex: number;
    onAdvance: () => void;
    onComplete: () => void;
}

// Couleurs par dieu pour l'effet de glow
const GOD_COLORS: Record<string, string> = {
    narrator: '#d4a574',  // Parchemin doré
    zeus: '#ffd700',      // Or/Foudre
    hestia: '#ff6b35',    // Orange/Feu
    aphrodite: '#ff69b4', // Rose
    dionysos: '#9b59b6',  // Violet
    hades: '#4a0080',     // Violet sombre
    nyx: '#1a1a2e',       // Bleu très sombre
    apollon: '#87ceeb',   // Bleu ciel
    ares: '#dc143c',      // Rouge sang
    poseidon: '#00bfff',  // Bleu océan
    athena: '#f0e68c',    // Jaune doré
    demeter: '#228b22',   // Vert forêt
    artemis: '#c0c0c0',   // Argent
    arachne: '#8b0000',   // Rouge sombre (araignée)
};

export default function DialogueBox({ dialogues, currentIndex, onAdvance, onComplete }: DialogueBoxProps) {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const [showContinue, setShowContinue] = useState(false);
    const [isHidden, setIsHidden] = useState(false); // Pour masquer l'UI et voir l'image

    // #7 - Animation states
    const [isNewSpeaker, setIsNewSpeaker] = useState(true);
    const [animationKey, setAnimationKey] = useState(0);
    const previousSpeakerRef = useRef<string | null>(null);

    const currentDialogue = dialogues[currentIndex];
    const isLastDialogue = currentIndex >= dialogues.length - 1;

    // #7 - Détecter changement de speaker pour animer
    useEffect(() => {
        if (!currentDialogue) return;

        const currentSpeaker = currentDialogue.speakerId;
        const previousSpeaker = previousSpeakerRef.current;

        // Si le speaker a changé, déclencher l'animation d'entrée
        if (currentSpeaker !== previousSpeaker) {
            setIsNewSpeaker(true);
            setAnimationKey(prev => prev + 1);
            // Reset après l'animation
            const timer = setTimeout(() => setIsNewSpeaker(false), 500);
            previousSpeakerRef.current = currentSpeaker;
            return () => clearTimeout(timer);
        }
    }, [currentDialogue]);

    // Effet de machine à écrire
    useEffect(() => {
        if (!currentDialogue) return;

        setDisplayedText('');
        setIsTyping(true);
        setShowContinue(false);

        const text = currentDialogue.text;
        let charIndex = 0;

        const typingInterval = setInterval(() => {
            if (charIndex < text.length) {
                setDisplayedText(text.substring(0, charIndex + 1));
                charIndex++;
            } else {
                setIsTyping(false);
                setShowContinue(true);
                clearInterval(typingInterval);
            }
        }, 30); // Vitesse de frappe

        return () => clearInterval(typingInterval);
    }, [currentDialogue, currentIndex]);

    // Gestion du clic / touche
    const handleClick = useCallback(() => {
        if (isTyping) {
            // Skip l'animation et affiche tout le texte
            setDisplayedText(currentDialogue.text);
            setIsTyping(false);
            setShowContinue(true);
        } else if (isLastDialogue) {
            onComplete();
        } else {
            onAdvance();
        }
    }, [isTyping, isLastDialogue, currentDialogue, onAdvance, onComplete]);

    // Écouter les touches clavier
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleClick]);

    if (!currentDialogue) return null;

    /*
     * Le portrait est lu dans les données, plus dans une table tenue à la main : celle-ci
     * n'avait pas d'entrée pour Thanatos, Ulysse ni le Chevalier d'Athéna, qui parlaient donc
     * sous le visage de Zeus.
     */
    const portraitUrl = currentDialogue.speakerId === 'narrator'
        ? NARRATOR_PORTRAIT
        : getCardImage(currentDialogue.speakerId) ?? NARRATOR_PORTRAIT;
    const glowColor = GOD_COLORS[currentDialogue.speakerId] || '#ffd700';

    // #7 - Classes dynamiques pour les animations
    const portraitClasses = `${styles.portrait} ${isNewSpeaker ? styles.portraitEnter : styles.portraitIdle}`;
    const dialogueBoxClasses = `${styles.dialogueBox} ${isNewSpeaker ? styles.dialogueBoxEnter : ''}`;
    const speakerNameClasses = `${styles.speakerName} ${isNewSpeaker ? styles.speakerNameEnter : ''}`;
    // Animation spéciale pour les émotions fortes
    const emotionClasses = currentDialogue.emotion === 'angry' ? styles.angryShake : '';

    // Toggle masquage de l'UI
    const toggleHidden = (e: React.MouseEvent) => {
        e.stopPropagation(); // Empêche d'avancer le dialogue
        setIsHidden(!isHidden);
    };

    return (
        <>
            {/* Bouton œil pour masquer/afficher l'UI */}
            <button
                className={styles.toggleButton}
                onClick={toggleHidden}
                title={isHidden ? 'Afficher le dialogue' : 'Masquer le dialogue'}
            >
                {isHidden ? '👁️' : '👁️‍🗨️'}
            </button>

            {/* Container de dialogue (masquable) */}
            <div
                className={`${styles.dialogueContainer} ${isHidden ? styles.hidden : ''}`}
                onClick={handleClick}
            >
                {/* Portrait du personnage avec animation */}
                <div
                    key={`portrait-${animationKey}`}
                    className={`${styles.portraitWrapper} ${emotionClasses}`}
                    style={{ '--glow-color': glowColor } as React.CSSProperties}
                >
                    <div className={portraitClasses}>
                        <Image
                            src={portraitUrl}
                            alt={currentDialogue.speakerName}
                            fill
                            className={styles.portraitImage}
                        />
                    </div>
                </div>

                {/* Boîte de dialogue avec animation */}
                <div key={`dialogue-${animationKey}`} className={dialogueBoxClasses}>
                    {/* Nom du personnage */}
                    <div
                        className={speakerNameClasses}
                        style={{ color: glowColor }}
                    >
                        {currentDialogue.speakerName}
                    </div>

                    {/* Texte du dialogue */}
                    <div className={styles.dialogueText}>
                        {displayedText}
                        {isTyping && <span className={styles.cursor}>|</span>}
                    </div>

                    {/* Indicateur de continuation */}
                    {showContinue && (
                        <div className={styles.continueIndicator}>
                            {isLastDialogue ? '▶ Continuer' : '▼ Suite'}
                        </div>
                    )}

                    {/* Progression */}
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${((currentIndex + 1) / dialogues.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

