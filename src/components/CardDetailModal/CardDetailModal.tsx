'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { SpellCard } from '@/types/cards';
import { ELEMENT_SYMBOLS } from '@/game-engine/ElementSystem';
import styles from './CardDetailModal.module.css';

interface CardDetailModalProps {
    card: SpellCard | null;
    isOpen: boolean;
    onClose: () => void;
    onPlay: () => void;
    onDiscard: () => void;
    canPlay: boolean;
    canDiscard: boolean;
}

// Descriptions explicites des effets
const getExplicitDescription = (card: SpellCard): string => {
    const descriptions: string[] = [];

    for (const effect of card.effects) {
        switch (effect.type) {
            case 'damage':
                if (effect.target === 'enemy_god') {
                    descriptions.push(`Inflige ${effect.value} dégâts à un ennemi`);
                } else if (effect.target === 'all_enemies') {
                    descriptions.push(`Inflige ${effect.value} dégâts à tous les ennemis`);
                } else {
                    descriptions.push(`Inflige ${effect.value} dégâts`);
                }
                break;
            case 'heal':
                if (effect.target === 'self') {
                    descriptions.push(`Soigne ${effect.value} PV au lanceur`);
                } else if (effect.target === 'ally_god') {
                    descriptions.push(`Soigne ${effect.value} PV à un allié`);
                } else if (effect.target === 'all_allies') {
                    descriptions.push(`Soigne ${effect.value} PV à tous les alliés`);
                } else if (effect.target === 'any_god') {
                    descriptions.push(`Soigne ${effect.value} PV à un dieu au choix`);
                } else {
                    descriptions.push(`Soigne ${effect.value} PV`);
                }
                break;
            case 'shield':
                if (effect.target === 'self') {
                    descriptions.push(`Gagne ${effect.value} bouclier`);
                } else if (effect.target === 'ally_god') {
                    descriptions.push(`Donne ${effect.value} bouclier à un allié`);
                } else if (effect.target === 'all_allies') {
                    descriptions.push(`Donne ${effect.value} bouclier à tous les alliés`);
                } else {
                    descriptions.push(`Ajoute ${effect.value} bouclier`);
                }
                break;
            case 'energy':
                descriptions.push(`+${effect.value} énergie`);
                break;
            case 'status':
                const statusNames: Record<string, string> = {
                    'poison': 'Poison',
                    'burn': 'Brûlure',
                    'stun': 'Étourdissement',
                    'lightning_mark': 'Marque Foudre',
                    'regeneration': 'Régénération',
                    'provocation': 'Provocation',
                    'confusion': 'Confusion',
                    'weakness': 'Faiblesse'
                };
                const statusName = effect.status ? statusNames[effect.status] || effect.status : 'effet';
                descriptions.push(`Applique ${effect.value || 1}x ${statusName}`);
                break;
            case 'draw':
                descriptions.push(`Pioche ${effect.value} carte(s)`);
                break;
            case 'custom':
                if (effect.description) {
                    descriptions.push(effect.description);
                } else if (effect.customEffectId) {
                    // Descriptions par défaut pour certains effets custom
                    const customDescriptions: Record<string, string> = {
                        'lightning_toggle': 'Ajoute/Retire une Marque Foudre',
                        'revive_god': 'Ressuscite un allié mort avec 8 PV',
                        'heal_by_poison': 'Soigne du nombre de poisons sur les ennemis'
                    };
                    descriptions.push(customDescriptions[effect.customEffectId] || 'Effet spécial');
                }
                break;
        }
    }

    return descriptions.join(' • ') || card.description;
};

export default function CardDetailModal({
    card,
    isOpen,
    onClose,
    onPlay,
    onDiscard,
    canPlay,
    canDiscard
}: CardDetailModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !card || !mounted) return null;

    const typeLabels: Record<string, string> = {
        'generator': '🔋 Générateur',
        'competence': '⚔️ Compétence',
        'utility': '🛠️ Utilitaire'
    };

    const modalContent = (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Bouton fermer */}
                <button className={styles.closeButton} onClick={onClose}>
                    ✕
                </button>

                {/* Contenu de la carte */}
                <div className={styles.cardContent}>
                    {/* Image de la carte */}
                    <div className={styles.imageContainer}>
                        {card.imageUrl ? (
                            <Image
                                src={card.imageUrl}
                                alt={card.name}
                                fill
                                className={styles.image}
                                sizes="300px"
                            />
                        ) : (
                            <div className={styles.imagePlaceholder}>
                                {ELEMENT_SYMBOLS[card.element]}
                            </div>
                        )}
                    </div>

                    {/* Infos de la carte */}
                    <div className={styles.cardInfo}>
                        <div className={styles.header}>
                            <span className={styles.element}>{ELEMENT_SYMBOLS[card.element]}</span>
                            <h2 className={styles.name}>{card.name}</h2>
                        </div>

                        <div className={styles.stats}>
                            <span className={styles.type}>{typeLabels[card.type]}</span>
                            {card.energyCost > 0 && (
                                <span className={styles.cost}>⚡ Coût: {card.energyCost}</span>
                            )}
                            {card.energyGain > 0 && (
                                <span className={styles.gain}>⚡ Gain: +{card.energyGain}</span>
                            )}
                        </div>

                        <div className={styles.descriptionBox}>
                            <h3 className={styles.descriptionTitle}>Effet</h3>
                            <p className={styles.description}>
                                {getExplicitDescription(card)}
                            </p>
                        </div>

                        {/* Symboles originaux */}
                        <div className={styles.symbols}>
                            <span className={styles.symbolsLabel}>Résumé:</span>
                            <span className={styles.symbolsText}>{card.description}</span>
                        </div>
                    </div>
                </div>

                {/* Boutons d'action */}
                <div className={styles.actions}>
                    <button
                        className={styles.discardButton}
                        onClick={onDiscard}
                        disabled={!canDiscard}
                    >
                        🗑️ Défausser
                    </button>
                    <button
                        className={styles.playButton}
                        onClick={onPlay}
                        disabled={!canPlay}
                    >
                        ▶️ Jouer
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
