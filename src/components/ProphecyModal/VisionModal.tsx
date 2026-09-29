'use client';

import React, { useEffect, useState } from 'react';
import ModalShell from '@/components/ModalShell/ModalShell';
import styles from './VisionModal.module.css';
import { SpellCard } from '@/types/cards';
import { getReadableSpellDescription } from '@/data/spellDescriptions';

/**
 * Durée d'affichage, en secondes. Le joueur peut refermer avant.
 *
 * Trois secondes ne suffisaient pas : il faut lire deux noms de carte, deux coûts et deux
 * effets, puis les RETENIR pour le reste de la partie — on ne les reverra pas. Dix secondes
 * laissent le temps de mémoriser sans que l'adversaire attende pour rien, et le bouton reste
 * là pour qui a déjà fini.
 */
const VISION_SECONDS = 10;

interface VisionModalProps {
    cards: SpellCard[] | null;
    onClose: () => void;
}

/**
 * « Lecture des présages » — deux cartes de la main adverse, montrées quelques secondes.
 *
 * L'effet ne change RIEN à l'état de jeu : il donne une information, et rien d'autre. Toute la
 * mécanique tient donc ici, dans l'affichage.
 *
 * Le décompte est visible. Sans lui, le joueur ne sait pas combien de temps il lui reste pour
 * mémoriser deux cartes qu'il ne reverra pas, et se dépêche inutilement — ou se fait surprendre
 * par la fermeture.
 */
export default function VisionModal({ cards, onClose }: VisionModalProps) {
    const [remaining, setRemaining] = useState(VISION_SECONDS);

    /*
     * Le décompte n'est PAS remis à zéro ici : le composant est remonté à chaque vision, grâce
     * à la clé que lui donne le plateau. C'est la façon idiomatique de réinitialiser un état en
     * React — remettre l'état à sa valeur de départ depuis l'effet déclencherait un rendu en
     * cascade, et l'outil d'analyse le signale à juste titre.
     */
    useEffect(() => {
        if (!cards) return;
        const tick = setInterval(() => setRemaining(r => r - 1), 1000);
        const close = setTimeout(onClose, VISION_SECONDS * 1000);
        return () => { clearInterval(tick); clearTimeout(close); };
    }, [cards, onClose]);

    if (!cards) return null;

    return (
        <ModalShell isOpen onCancel={onClose} accentColor="#c084fc">
            <h2 className={styles.title}>🔮 Lecture des présages</h2>
            <p className={styles.description}>
                {cards.length > 0
                    ? 'Deux cartes de la main adverse, révélées un instant.'
                    : 'La main de votre adversaire est vide.'}
            </p>

            <div className={styles.cards}>
                {cards.map(card => (
                    <div key={card.id} className={styles.card}>
                        <div className={styles.cardName}>{card.name}</div>
                        <div className={styles.cardCost}>
                            {card.energyCost > 0 ? `${card.energyCost} ⚡` : 'Gratuit'}
                            {card.energyGain > 0 && ` · +${card.energyGain} ⚡`}
                        </div>
                        <div className={styles.cardText}>{getReadableSpellDescription(card)}</div>
                    </div>
                ))}
            </div>

            <p className={styles.timer}>{Math.max(0, remaining)} s</p>
            <button className={styles.closeButton} onClick={onClose}>Fermer</button>
        </ModalShell>
    );
}
