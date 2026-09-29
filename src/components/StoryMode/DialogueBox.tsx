'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import styles from './DialogueBox.module.css';
import { DialogueLine } from '@/types/story';
import { getCardImage } from '@/data/gods';
import { getSpeakerColor } from '@/data/story/speakerColors';

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

    /** Millisecondes entre deux caractères de la machine à écrire. */
    const TYPING_SPEED_MS = 30;

    /**
     * Le minuteur de frappe, tenu dans une référence pour pouvoir l'ARRÊTER depuis le clic.
     *
     * C'est toute l'origine de deux bugs qui n'en faisaient qu'un : le clic forçait le texte
     * complet mais laissait le minuteur tourner. Celui-ci réécrivait aussitôt une portion du
     * texte par-dessus, puis une portion un peu plus longue, etc. — d'où le scintillement. Et
     * comme `isTyping` était déjà repassé à faux, le deuxième appui croyait le dialogue terminé
     * et le sautait alors qu'il s'écrivait encore sous les yeux du joueur.
     */
    const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopTyping = useCallback(() => {
        if (typingTimerRef.current !== null) {
            clearInterval(typingTimerRef.current);
            typingTimerRef.current = null;
        }
    }, []);

    // Effet de machine à écrire.
    //
    // Les dépendances sont l'INDICE et le TEXTE, deux valeurs primitives, et non l'objet
    // `currentDialogue` : si le parent venait à reconstruire son tableau de dialogues à chaque
    // rendu, l'objet changerait d'identité et la frappe repartirait de zéro en boucle.
    const dialogueText = currentDialogue?.text ?? '';
    useEffect(() => {
        if (!dialogueText) return;

        setDisplayedText('');
        setIsTyping(true);
        setShowContinue(false);

        let charIndex = 0;
        stopTyping();
        typingTimerRef.current = setInterval(() => {
            charIndex++;
            setDisplayedText(dialogueText.slice(0, charIndex));
            if (charIndex >= dialogueText.length) {
                stopTyping();
                setIsTyping(false);
                setShowContinue(true);
            }
        }, TYPING_SPEED_MS);

        return stopTyping;
    }, [currentIndex, dialogueText, stopTyping]);

    // Gestion du clic / touche
    const handleClick = useCallback(() => {
        if (isTyping) {
            // ARRÊTER le minuteur avant d'afficher le texte entier : sans cette ligne, il le
            // recouvre au tick suivant et l'affichage se met à osciller.
            stopTyping();
            setDisplayedText(dialogueText);
            setIsTyping(false);
            setShowContinue(true);
        } else if (isLastDialogue) {
            onComplete();
        } else {
            onAdvance();
        }
    }, [isTyping, isLastDialogue, dialogueText, stopTyping, onAdvance, onComplete]);

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
    const glowColor = getSpeakerColor(currentDialogue.speakerId);

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

