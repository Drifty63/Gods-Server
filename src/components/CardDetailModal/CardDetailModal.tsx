'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { SpellCard } from '@/types/cards';
import { ELEMENT_SYMBOLS } from '@/game-engine/ElementSystem';
import { ALL_GODS } from '@/data/gods';
import styles from './CardDetailModal.module.css';

interface CardDetailModalProps {
    card: SpellCard | null;
    isOpen: boolean;
    onClose?: () => void;
    onPlay: () => void;
    onDiscard: () => void;
    canPlay: boolean;
    canDiscard: boolean;
    readOnly?: boolean;
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
    canDiscard,
    readOnly = false
}: CardDetailModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !card || !mounted) return null;

    const typeLabels: Record<string, string> = {
        'generator': 'Générateur',
        'competence': 'Compétence',
        'utility': 'Utilitaire'
    };

    // Trouver le dieu pour afficher son nom
    const god = ALL_GODS.find(g => g.id === card.godId);
    const godName = god ? god.name.split(',')[0] : 'Inconnu'; // Juste le nom, pas le titre

    const modalContent = (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Bouton fermer (seulement si onClose est fourni) */}
                {onClose && (
                    <button className={styles.closeButton} onClick={onClose}>
                        ✕
                    </button>
                )}

                {/* Contenu de la carte - Nouveau layout deux colonnes */}
                <div className={styles.cardLayout}>
                    {/* COLONNE GAUCHE: Visuel de la carte */}
                    <div className={styles.visualColumn}>
                        <div className={styles.cardPreview}>
                            <div className={styles.godNameOverlay}>{godName}</div>

                            <div className={styles.imageWrapper}>
                                {card.imageUrl ? (
                                    <Image
                                        src={card.imageUrl}
                                        alt={card.name}
                                        fill
                                        className={styles.image}
                                        sizes="300px"
                                        priority
                                    />
                                ) : (
                                    <div className={styles.imagePlaceholder}>
                                        {ELEMENT_SYMBOLS[card.element]}
                                    </div>
                                )}
                            </div>

                            <div className={styles.emojiOverlay}>
                                {card.description}
                            </div>
                        </div>
                    </div>

                    {/* COLONNE DROITE: Informations textuelles */}
                    <div className={styles.infoColumn}>
                        <h2 className={styles.spellName}>{card.name}</h2>

                        <div className={styles.sectionHeader}>
                            <span className={styles.label}>Compétence :</span>
                            <span className={styles.value}>{typeLabels[card.type]}</span>
                        </div>

                        <div className={styles.energyValues}>
                            <div className={styles.energyItem}>
                                <span className={styles.energyIcon}>⚡</span>
                                <span className={styles.energyLabel}>Coût</span>
                                <span className={styles.energyValue}>-{card.energyCost}</span>
                            </div>
                            <div className={styles.energyItem}>
                                <span className={styles.energyIcon}>⚡</span>
                                <span className={styles.energyLabel}>Gain</span>
                                <span className={styles.energyValue}>+{card.energyGain}</span>
                            </div>
                        </div>

                        <div className={styles.effectSection}>
                            <h3 className={styles.effectLabel}>Effet :</h3>
                            <p className={styles.fullDescription}>
                                {getExplicitDescription(card)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Boutons d'action */}
                {!readOnly && (
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
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
