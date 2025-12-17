'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { getOwnedGods } from '@/data/gods';
import { useAuth } from '@/contexts/AuthContext';
import { saveDecks, SavedDeck } from '@/services/firebase';

// Nombre max de decks
const MAX_DECKS = 5;

// Créer un deck vide
const createEmptyDeck = (index: number): SavedDeck => ({
    id: `deck_${index}`,
    name: `Deck ${index + 1}`,
    godIds: [],
});

export default function DeckPage() {
    const { user, profile, refreshProfile } = useAuth();

    // États
    const [decks, setDecks] = useState<SavedDeck[]>([]);
    const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Dieux possédés
    const godsOwned = profile?.collection.godsOwned ?? [];
    const isCreator = profile?.isCreator || false;
    const availableGods = useMemo(() => getOwnedGods(godsOwned, isCreator), [godsOwned, isCreator]);

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
            setIsEditing(false);
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

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.pageHeader}>
                <Link href="/" className={styles.backButton}>
                    ‹ Retour
                </Link>
                <h1 className={styles.title}>Mes Decks</h1>
            </header>

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
                                onClick={() => godId && toggleGodInDeck(godId)}
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

            {/* Bibliothèque des dieux possédés */}
            <div className={styles.library}>
                <h2 className={styles.sectionTitle}>Vos Dieux ({availableGods.length})</h2>
                <div className={styles.godsGrid}>
                    {availableGods.map((god) => {
                        const isInDeck = currentDeck.godIds.includes(god.id);
                        const canAdd = !isInDeck && currentDeck.godIds.length < 4;

                        return (
                            <div
                                key={god.id}
                                className={`${styles.godCard} ${isInDeck ? styles.inDeck : ''} ${!canAdd && !isInDeck ? styles.disabled : ''}`}
                                onClick={() => (isInDeck || canAdd) && toggleGodInDeck(god.id)}
                            >
                                {isInDeck && <div className={styles.inDeckBadge}>✓</div>}
                                <Image
                                    src={god.imageUrl}
                                    alt={god.name}
                                    width={60}
                                    height={60}
                                    className={styles.godImage}
                                />
                                <span className={styles.godName}>{god.name.split(',')[0]}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

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
        </main>
    );
}
