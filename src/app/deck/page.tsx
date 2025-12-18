'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { getOwnedGods, getVisibleGods, God } from '@/data/gods';
import { getSpellsForGod, SpellCard } from '@/data/mock_spells';
import { useAuth } from '@/contexts/AuthContext';
import { saveDecks, SavedDeck } from '@/services/firebase';

// Nombre max de decks
const MAX_DECKS = 5;

// Mapping des éléments vers leurs symboles emoji
const ELEMENT_SYMBOLS: Record<string, string> = {
    fire: '🔥',
    air: '💨',
    earth: '🌿',
    lightning: '⚡',
    water: '💧',
    light: '☀️',
    darkness: '💀',
};

// Fonction pour obtenir le symbole d'un élément
const getElementSymbol = (element: string): string => {
    return ELEMENT_SYMBOLS[element] || element;
};

// Type pour la carte sélectionnée dans le modal
interface SelectedCard {
    type: 'god' | 'spell';
    imageUrl: string;
    name: string;
    spell?: SpellCard;
    god?: God;
}

// Créer un deck vide
const createEmptyDeck = (index: number): SavedDeck => ({
    id: `deck_${index}`,
    name: `Deck ${index + 1}`,
    godIds: [],
});

export default function DeckPage() {
    const { user, profile, refreshProfile } = useAuth();

    // États pour les decks
    const [decks, setDecks] = useState<SavedDeck[]>([]);
    const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // États pour la bibliothèque
    const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null);
    const [isSeason1Open, setIsSeason1Open] = useState(true);
    const [showGodPickerModal, setShowGodPickerModal] = useState(false);

    // Dieux possédés et visibles
    const godsOwned = profile?.collection.godsOwned ?? [];
    const isCreator = profile?.isCreator || false;
    const availableGods = useMemo(() => getOwnedGods(godsOwned, isCreator), [godsOwned, isCreator]);
    const visibleGods = useMemo(() => getVisibleGods(isCreator), [isCreator]);

    // Charger les decks depuis le profil
    useEffect(() => {
        if (profile?.savedDecks && profile.savedDecks.length > 0) {
            setDecks(profile.savedDecks);
        } else {
            // Créer des decks vides par défaut
            const defaultDecks = Array.from({ length: MAX_DECKS }, (_, i) => createEmptyDeck(i));
            setDecks(defaultDecks);
        }
    }, [profile?.savedDecks]);

    const currentDeck = decks[currentDeckIndex] || createEmptyDeck(0);

    // Navigation entre les decks
    const nextDeck = () => {
        setCurrentDeckIndex((prev) => (prev + 1) % decks.length);
    };

    const prevDeck = () => {
        setCurrentDeckIndex((prev) => (prev - 1 + decks.length) % decks.length);
    };

    // Modifier le nom du deck
    const handleNameChange = (newName: string) => {
        const updatedDecks = [...decks];
        updatedDecks[currentDeckIndex] = {
            ...updatedDecks[currentDeckIndex],
            name: newName,
        };
        setDecks(updatedDecks);
    };

    // Ajouter/retirer un dieu du deck
    const toggleGodInDeck = (godId: string) => {
        const updatedDecks = [...decks];
        const currentGodIds = [...(updatedDecks[currentDeckIndex].godIds || [])];

        if (currentGodIds.includes(godId)) {
            // Retirer le dieu
            updatedDecks[currentDeckIndex] = {
                ...updatedDecks[currentDeckIndex],
                godIds: currentGodIds.filter((id) => id !== godId),
            };
        } else if (currentGodIds.length < 4) {
            // Ajouter le dieu (max 4)
            updatedDecks[currentDeckIndex] = {
                ...updatedDecks[currentDeckIndex],
                godIds: [...currentGodIds, godId],
            };
        }

        setDecks(updatedDecks);
    };

    // Sauvegarder les decks dans Firebase
    const handleSave = useCallback(async () => {
        if (!user) return;

        setIsSaving(true);
        setSaveMessage(null);

        try {
            await saveDecks(user.uid, decks);
            await refreshProfile();
            setSaveMessage({ type: 'success', text: 'Decks sauvegardés !' });
        } catch (error) {
            console.error('Erreur sauvegarde decks:', error);
            setSaveMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
        } finally {
            setIsSaving(false);
        }
    }, [user, decks, refreshProfile]);

    // Vérifier si le deck actuel est complet (4 dieux)
    const isDeckComplete = currentDeck.godIds.length === 4;

    // Obtenir les infos d'un dieu
    const getGod = (godId: string) => availableGods.find((g) => g.id === godId);

    // Ouvrir le modal avec une carte de dieu
    const openGodCard = (god: God) => {
        setSelectedCard({
            type: 'god',
            imageUrl: god.carouselImage || god.imageUrl,
            name: god.name,
            god: god
        });
    };

    // Ouvrir le modal avec une carte de sort
    const openSpellCard = (spell: SpellCard) => {
        setSelectedCard({
            type: 'spell',
            imageUrl: spell.imageUrl,
            name: spell.name,
            spell: spell
        });
    };

    // Fermer le modal
    const closeCardModal = () => {
        setSelectedCard(null);
    };

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.pageHeader}>
                <Link href="/" className={styles.backButton}>
                    ‹ Retour
                </Link>
                <h1 className={styles.title}>Mes Decks</h1>
            </header>

            {/* ============================================
                SECTION 1: CRÉATION DE DECKS
                ============================================ */}

            {/* Sélecteur de deck */}
            <div className={styles.deckSelector}>
                <button className={styles.navArrow} onClick={prevDeck}>
                    ‹
                </button>

                <div className={styles.deckInfo}>
                    <span className={styles.deckLabel}>
                        Deck {currentDeckIndex + 1} / {decks.length}
                    </span>
                    <input
                        type="text"
                        value={currentDeck.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className={styles.deckNameInput}
                        placeholder="Nom du deck..."
                    />
                    <span className={styles.deckCount}>
                        {currentDeck.godIds.length}/4 dieux
                    </span>
                </div>

                <button className={styles.navArrow} onClick={nextDeck}>
                    ›
                </button>
            </div>

            {/* Deck actuel - Composition */}
            <div className={styles.currentDeck}>
                <h2 className={styles.sectionTitle}>Composition du Deck</h2>
                <div className={styles.deckSlots}>
                    {[0, 1, 2, 3].map((slotIndex) => {
                        const godId = currentDeck.godIds[slotIndex];
                        const god = godId ? getGod(godId) : null;

                        return (
                            <div
                                key={slotIndex}
                                className={`${styles.deckSlot} ${god ? styles.filled : styles.empty}`}
                                onClick={() => {
                                    if (godId) {
                                        toggleGodInDeck(godId);
                                    } else if (currentDeck.godIds.length < 4) {
                                        setShowGodPickerModal(true);
                                    }
                                }}
                            >
                                {god ? (
                                    <>
                                        <Image
                                            src={god.imageUrl}
                                            alt={god.name}
                                            width={70}
                                            height={70}
                                            className={styles.slotImage}
                                        />
                                        <span className={styles.slotName}>{god.name.split(',')[0]}</span>
                                        <button className={styles.removeButton}>✕</button>
                                    </>
                                ) : (
                                    <span className={styles.emptySlot}>+ Dieu</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {isDeckComplete && (
                    <div className={styles.deckComplete}>
                        ✓ Deck complet ! Vous pouvez l'utiliser en partie.
                    </div>
                )}
            </div>

            {/* Modal de sélection de dieux */}
            {showGodPickerModal && (
                <div className={styles.modalOverlay} onClick={() => setShowGodPickerModal(false)}>
                    <div className={styles.godPickerModal} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.modalClose} onClick={() => setShowGodPickerModal(false)}>✕</button>
                        <h2 className={styles.modalTitle}>Ajouter un Dieu</h2>
                        <p className={styles.modalSubtitle}>{availableGods.length} dieux disponibles</p>
                        <div className={styles.modalGodsGrid}>
                            {availableGods.map((god) => {
                                const isInDeck = currentDeck.godIds.includes(god.id);
                                const canAdd = !isInDeck && currentDeck.godIds.length < 4;

                                return (
                                    <div
                                        key={god.id}
                                        className={`${styles.modalGodCard} ${isInDeck ? styles.inDeck : ''} ${!canAdd && !isInDeck ? styles.disabled : ''}`}
                                        onClick={() => {
                                            if (canAdd) {
                                                toggleGodInDeck(god.id);
                                                setShowGodPickerModal(false);
                                            } else if (isInDeck) {
                                                toggleGodInDeck(god.id);
                                            }
                                        }}
                                    >
                                        {isInDeck && <div className={styles.inDeckBadge}>✓</div>}
                                        <Image
                                            src={god.imageUrl}
                                            alt={god.name}
                                            width={70}
                                            height={70}
                                            className={styles.modalGodImage}
                                        />
                                        <span className={styles.modalGodName}>{god.name.split(',')[0]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Bouton de sauvegarde */}
            <div className={styles.actions}>
                {saveMessage && (
                    <div className={`${styles.saveMessage} ${saveMessage.type === 'success' ? styles.success : styles.error}`}>
                        {saveMessage.text}
                    </div>
                )}
                <button
                    className={styles.saveButton}
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? '⏳ Sauvegarde...' : '💾 Sauvegarder les decks'}
                </button>
            </div>

            {/* ============================================
                SECTION 2: BIBLIOTHÈQUE DES DIEUX ET SORTS
                ============================================ */}

            <div className={styles.libraryContainer}>
                <h2 className={styles.libraryTitle}>📚 Bibliothèque</h2>

                {/* Saison 1 : Set de base - Volet déroulant */}
                <div className={styles.seasonAccordion}>
                    <button
                        className={`${styles.seasonHeader} ${isSeason1Open ? styles.seasonHeaderOpen : ''}`}
                        onClick={() => setIsSeason1Open(!isSeason1Open)}
                    >
                        <span className={styles.seasonIcon}>⭐</span>
                        <span className={styles.seasonTitle}>Saison 1 : Set de base</span>
                        <span className={styles.seasonCount}>{visibleGods.length} / {visibleGods.length} dieux</span>
                        <span className={styles.seasonArrow}>{isSeason1Open ? '▼' : '▶'}</span>
                    </button>

                    {isSeason1Open && (
                        <div className={styles.seasonContent}>

                            {visibleGods.map((god) => {
                                const spells = getSpellsForGod(god);
                                return (
                                    <div key={god.id} className={styles.godRow}>
                                        <div className={styles.godHeader}>
                                            <span className={styles.godNameBig}>{god.name}</span>
                                            <span className={styles.godElement}>{getElementSymbol(god.element)}</span>
                                        </div>

                                        <div className={styles.cardsCarousel}>
                                            {/* 1. Carte du Dieu */}
                                            <div
                                                className={`${styles.cardWrapper} ${styles.godCardEntry}`}
                                                onClick={() => openGodCard(god)}
                                            >
                                                <Image
                                                    src={god.carouselImage || god.imageUrl}
                                                    alt={god.name}
                                                    fill
                                                    className={styles.godCardImage}
                                                    sizes="(max-width: 768px) 100vw, 300px"
                                                    priority={false}
                                                />
                                            </div>

                                            {/* 2. Les 5 Cartes de Sorts */}
                                            {spells.map((spell) => {
                                                const isFullArt = spell.imageUrl.includes('/cards/spells/');

                                                return (
                                                    <div
                                                        key={spell.id}
                                                        className={`${styles.cardWrapper} ${styles.spellCardEntry}`}
                                                        onClick={() => openSpellCard(spell)}
                                                    >
                                                        {isFullArt ? (
                                                            <Image
                                                                src={spell.imageUrl}
                                                                alt={spell.name}
                                                                fill
                                                                className={styles.godCardImage}
                                                                sizes="160px"
                                                            />
                                                        ) : (
                                                            <>
                                                                <div className={styles.spellImageContainer}>
                                                                    <Image
                                                                        src={spell.imageUrl}
                                                                        alt={spell.name}
                                                                        fill
                                                                        className={styles.godCardImage}
                                                                        sizes="160px"
                                                                    />
                                                                    <div className={styles.spellCost}>{spell.energyCost}</div>
                                                                </div>
                                                                <div className={styles.spellContent}>
                                                                    <div className={styles.spellName}>{spell.name}</div>
                                                                    <div className={styles.spellType}>{spell.type}</div>
                                                                    <div className={styles.spellDescription}>
                                                                        {spell.description}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal pour afficher la carte en grand */}
            {selectedCard && (
                <div className={styles.cardModalOverlay} onClick={closeCardModal}>
                    <div className={styles.cardModalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.cardModalClose} onClick={closeCardModal}>✕</button>
                        <div className={styles.cardModalImageWrapper}>
                            <Image
                                src={selectedCard.imageUrl}
                                alt={selectedCard.name}
                                fill
                                className={styles.cardModalImage}
                                sizes="(max-width: 768px) 90vw, 400px"
                                priority
                            />
                        </div>
                        <div className={styles.cardModalInfo}>
                            <h3 className={styles.cardModalName}>{selectedCard.name}</h3>
                            {selectedCard.type === 'spell' && selectedCard.spell && (
                                <>
                                    <span className={styles.cardModalType}>{selectedCard.spell.type}</span>
                                    <p className={styles.cardModalDescription}>{selectedCard.spell.description}</p>
                                    <div className={styles.cardModalStats}>
                                        <span className={styles.cardModalCost}>⚡ {selectedCard.spell.energyCost}</span>
                                    </div>
                                </>
                            )}
                            {selectedCard.type === 'god' && selectedCard.god && (
                                <span className={styles.cardModalElement}>{getElementSymbol(selectedCard.god.element)}</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
