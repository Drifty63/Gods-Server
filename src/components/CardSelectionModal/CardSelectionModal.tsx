'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SpellCard } from '@/types/cards';
import { ELEMENT_SYMBOLS } from '@/game-engine/ElementSystem';
import styles from './CardSelectionModal.module.css';

interface CardSelectionModalProps {
    isOpen: boolean;
    title: string;
    cards: SpellCard[];
    requiredCount: number;
    onConfirm: (selectedCards: SpellCard[]) => void;
    onCancel: () => void;
    blindMode?: boolean; // Si true, les cartes non révélées sont affichées comme des dos
}

export default function CardSelectionModal({
    isOpen,
    title,
    cards,
    requiredCount,
    onConfirm,
    onCancel,
    blindMode = false
}: CardSelectionModalProps) {
    const [selectedCards, setSelectedCards] = useState<SpellCard[]>([]);
    const [mounted, setMounted] = useState(false);

    // Attendre le montage côté client pour le portal
    useEffect(() => {
        setMounted(true);
    }, []);

    // Reset selection when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedCards([]);
        }
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    const handleCardClick = (card: SpellCard) => {
        if (selectedCards.some(c => c.id === card.id)) {
            // Deselect
            setSelectedCards(selectedCards.filter(c => c.id !== card.id));
        } else if (selectedCards.length < requiredCount) {
            // Select
            setSelectedCards([...selectedCards, card]);
        }
    };

    const handleConfirm = () => {
        if (selectedCards.length > 0) {
            onConfirm(selectedCards);
        }
    };

    const isCardSelected = (cardId: string) => selectedCards.some(c => c.id === cardId);

    // En mode blind, on vérifie si la carte est révélée
    const isCardRevealed = (card: SpellCard) => {
        if (!blindMode) return true; // Mode normal : tout est visible
        return card.isHiddenFromOwner === true; // En mode blind : seules les cartes déjà révélées sont visibles
    };

    const modalContent = (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2 className={styles.title}>{title}</h2>
                <p className={styles.instruction}>
                    Sélectionnez {requiredCount} carte{requiredCount > 1 ? 's' : ''}
                    ({selectedCards.length}/{requiredCount})
                </p>

                {cards.length === 0 ? (
                    <p className={styles.emptyMessage}>Aucune carte disponible</p>
                ) : (
                    <div className={styles.cardsGrid}>
                        {cards.map((card, index) => (
                            isCardRevealed(card) ? (
                                // Carte révélée - affichage normal
                                <div
                                    key={card.id}
                                    className={`${styles.card} ${isCardSelected(card.id) ? styles.selected : ''} ${styles.revealed}`}
                                    onClick={() => handleCardClick(card)}
                                >
                                    <div className={styles.cardHeader}>
                                        <span className={styles.element}>
                                            {ELEMENT_SYMBOLS[card.element]}
                                        </span>
                                        <span className={styles.cost}>
                                            {card.energyCost > 0 ? `⚡${card.energyCost}` : ''}
                                            {card.energyGain > 0 ? `+${card.energyGain}` : ''}
                                        </span>
                                    </div>
                                    <div className={styles.cardName}>{card.name}</div>
                                    <div className={styles.cardType}>
                                        {card.type === 'generator' && '🔋 Générateur'}
                                        {card.type === 'competence' && '⚔️ Compétence'}
                                        {card.type === 'utility' && '🛠️ Utilitaire'}
                                    </div>
                                    <span className={styles.revealedBadge}>👁️</span>
                                    {isCardSelected(card.id) && (
                                        <div className={styles.selectedBadge}>✓</div>
                                    )}
                                </div>
                            ) : (
                                // Carte cachée - dos de carte
                                <div
                                    key={card.id}
                                    className={`${styles.cardBack} ${isCardSelected(card.id) ? styles.selected : ''}`}
                                    onClick={() => handleCardClick(card)}
                                >
                                    <span className={styles.cardBackIcon}>🎴</span>
                                    <span className={styles.cardBackNumber}>{index + 1}</span>
                                    {isCardSelected(card.id) && (
                                        <div className={styles.selectedBadge}>✓</div>
                                    )}
                                </div>
                            )
                        ))}
                    </div>
                )}

                <div className={styles.actions}>
                    <button
                        className={styles.cancelButton}
                        onClick={onCancel}
                    >
                        ❌ Annuler
                    </button>
                    <button
                        className={styles.confirmButton}
                        onClick={handleConfirm}
                        disabled={selectedCards.length === 0}
                    >
                        ✅ Confirmer ({selectedCards.length})
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
