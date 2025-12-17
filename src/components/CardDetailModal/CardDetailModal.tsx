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
    onClose?: () => void;
    onPlay: () => void;
    onDiscard: () => void;
    canPlay: boolean;
    canDiscard: boolean;
}

// Descriptions explicites des effets (regroupe les effets identiques)
const getExplicitDescription = (card: SpellCard): string => {
    const descriptions: string[] = [];

    // Compter les effets similaires pour les regrouper
    const effectCounts: Map<string, { count: number; value: number; effect: typeof card.effects[0] }> = new Map();

    for (const effect of card.effects) {
        // Créer une clé unique pour regrouper les effets identiques
        const key = `${effect.type}-${effect.target || 'none'}-${effect.value || 0}-${effect.status || ''}-${effect.customEffectId || ''}`;

        if (effectCounts.has(key)) {
            const existing = effectCounts.get(key)!;
            existing.count++;
        } else {
            effectCounts.set(key, { count: 1, value: effect.value || 0, effect });
        }
    }

    // Générer les descriptions groupées
    for (const [, { count, value, effect }] of effectCounts) {
        const targetText = count > 1 ? ` à ${count} ennemis` : ' à un ennemi';
        const allyTargetText = count > 1 ? ` à ${count} alliés` : ' à un allié';

        switch (effect.type) {
            case 'damage':
                if (effect.target === 'enemy_god') {
                    descriptions.push(`Inflige ${value} dégâts${targetText}`);
                } else if (effect.target === 'all_enemies') {
                    descriptions.push(`Inflige ${value} dégâts à tous les ennemis`);
                } else if (effect.target === 'self') {
                    descriptions.push(`Inflige ${value} dégâts au lanceur`);
                } else {
                    descriptions.push(`Inflige ${value} dégâts`);
                }
                break;
            case 'heal':
                if (effect.target === 'self') {
                    descriptions.push(`Soigne ${value} PV au lanceur`);
                } else if (effect.target === 'ally_god') {
                    descriptions.push(`Soigne ${value} PV${allyTargetText}`);
                } else if (effect.target === 'all_allies') {
                    descriptions.push(`Soigne ${value} PV à tous les alliés`);
                } else if (effect.target === 'any_god') {
                    descriptions.push(`Soigne ${value} PV à un dieu au choix`);
                } else {
                    descriptions.push(`Soigne ${value} PV`);
                }
                break;
            case 'shield':
                if (effect.target === 'self') {
                    descriptions.push(`Gagne ${value} bouclier`);
                } else if (effect.target === 'ally_god') {
                    descriptions.push(`Donne ${value} bouclier${allyTargetText}`);
                } else if (effect.target === 'all_allies') {
                    descriptions.push(`Donne ${value} bouclier à tous les alliés`);
                } else {
                    descriptions.push(`Ajoute ${value} bouclier`);
                }
                break;
            case 'energy':
                descriptions.push(`+${value} énergie`);
                break;
            case 'mill':
                descriptions.push(`Défausse ${value} carte(s) du deck adverse`);
                break;
            case 'discard':
                descriptions.push(`L'adversaire défausse ${value} carte(s)`);
                break;
            case 'status':
                const statusNames: Record<string, string> = {
                    'poison': 'Poison',
                    'burn': 'Brûlure',
                    'stun': 'Étourdissement',
                    'lightning_mark': 'Marque Foudre',
                    'provocation': 'Provocation',
                    'confusion': 'Confusion',
                    'weakness': 'Faiblesse'
                };
                const statusName = effect.status ? statusNames[effect.status] || effect.status : 'effet';
                descriptions.push(`Applique ${value || 1}x ${statusName}`);
                break;
            case 'draw':
                descriptions.push(`Pioche ${value} carte(s)`);
                break;
            case 'custom':
                if (effect.description) {
                    descriptions.push(effect.description);
                } else if (effect.customEffectId) {
                    const customDescriptions: Record<string, string> = {
                        'lightning_toggle': 'Ajoute ou retire une Marque Foudre (+2 dégâts si retirée)',
                        'lightning_toggle_all': 'Ajoute ou retire des Marques Foudre à tous (+2 dégâts par marque retirée)',
                        'lightning_toggle_multi': 'Ajoute ou retire des Marques Foudre aux cibles (+2 dégâts par marque retirée)',
                        'revive_god': 'Ressuscite un allié mort avec 8 PV',
                        'heal_by_poison': 'Soigne du nombre total de poisons sur les ennemis',
                        'conductive_lightning': 'Inflige des dégâts et applique une Marque Foudre',
                        'lifesteal_damage': 'Soigne le lanceur des dégâts infligés',
                        'remove_energy_1': "Retire 1 énergie à l'adversaire",
                        'remove_energy_2': "Retire 2 énergie à l'adversaire",
                        'apply_weakness': "Applique une faiblesse élémentaire au choix",
                        'damage_equal_lost_health': 'Inflige des dégâts égaux aux PV perdus',
                        'heal_if_kill_8': 'Si la cible meurt, soigne 8 PV',
                        'distribute_heal_5': 'Répartit 5 soins entre vos alliés',
                        'tsunami_damage': 'Inflige 3 dégâts par carte meulée',
                        'prison_mill': "Défausse autant de cartes qu'il y a d'ennemis touchés"
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
                {/* Bouton fermer (seulement si onClose est fourni) */}
                {onClose && (
                    <button className={styles.closeButton} onClick={onClose}>
                        ✕
                    </button>
                )}

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
