'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { ALL_GODS } from '@/data/gods';
import { getSpellsForGod, SpellCard } from '@/data/mock_spells';
import { God } from '@/data/gods';

interface Team {
    id: number;
    name: string;
    gods: (string | null)[]; // IDs des dieux ou null si slot vide
}

const DEFAULT_TEAMS: Team[] = [
    { id: 1, name: 'Formation Alpha', gods: [null, null, null] },
    { id: 2, name: 'Formation Beta', gods: [null, null, null] },
    { id: 3, name: 'Formation Gamma', gods: [null, null, null] },
    { id: 4, name: 'Formation Delta', gods: [null, null, null] },
    { id: 5, name: 'Formation Omega', gods: [null, null, null] },
];

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

export default function DeckPage() {
    // État des équipes (chargé depuis localStorage idéalement, ici state local pour démo)
    const [teams, setTeams] = useState<Team[]>(DEFAULT_TEAMS);
    const [currentTeamIndex, setCurrentTeamIndex] = useState(0);

    // État pour le modal de carte agrandie
    const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null);

    // État pour les volets déroulants des saisons
    const [isSeason1Open, setIsSeason1Open] = useState(true);

    // Charger les équipes depuis localStorage au montage
    useEffect(() => {
        const savedTeams = localStorage.getItem('gods_teams');
        if (savedTeams) {
            try {
                setTeams(JSON.parse(savedTeams));
            } catch (e) {
                console.error("Erreur chargement équipes", e);
            }
        }
    }, []);

    // Sauvegarder les changements
    useEffect(() => {
        localStorage.setItem('gods_teams', JSON.stringify(teams));
    }, [teams]);

    const currentTeam = teams[currentTeamIndex];

    const nextTeam = () => {
        setCurrentTeamIndex((prev) => (prev + 1) % teams.length);
    };

    const prevTeam = () => {
        setCurrentTeamIndex((prev) => (prev - 1 + teams.length) % teams.length);
    };

    const handleNameChange = (newName: string) => {
        const updatedTeams = [...teams];
        updatedTeams[currentTeamIndex] = {
            ...updatedTeams[currentTeamIndex],
            name: newName
        };
        setTeams(updatedTeams);
    };

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

            {/* Sélecteur d'équipe */}
            <div className={styles.teamSelector}>
                <button
                    className={styles.navArrow}
                    onClick={prevTeam}
                    aria-label="Équipe précédente"
                >
                    ‹
                </button>

                <div className={styles.teamInfo}>
                    <span className={styles.teamLabel}>Formation {currentTeamIndex + 1} / {teams.length}</span>
                    <input
                        type="text"
                        value={currentTeam.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className={styles.teamNameInput}
                        placeholder="Nom de l'équipe..."
                    />
                </div>

                <button
                    className={styles.navArrow}
                    onClick={nextTeam}
                    aria-label="Équipe suivante"
                >
                    ›
                </button>
            </div>

            {/* Bibliothèque des Dieux */}
            <div className={styles.libraryContainer}>
                <h2 className={styles.libraryTitle}>Bibliothèque Divine</h2>

                {/* Saison 1 : Set de base - Volet déroulant */}
                <div className={styles.seasonAccordion}>
                    <button
                        className={`${styles.seasonHeader} ${isSeason1Open ? styles.seasonHeaderOpen : ''}`}
                        onClick={() => setIsSeason1Open(!isSeason1Open)}
                    >
                        <span className={styles.seasonIcon}>⭐</span>
                        <span className={styles.seasonTitle}>Saison 1 : Set de base</span>
                        <span className={styles.seasonCount}>{ALL_GODS.length} dieux</span>
                        <span className={styles.seasonArrow}>{isSeason1Open ? '▼' : '▶'}</span>
                    </button>

                    {isSeason1Open && (
                        <div className={styles.seasonContent}>

                            {ALL_GODS.map((god) => {
                                const spells = getSpellsForGod(god);
                                return (
                                    <div key={god.id} className={styles.godRow}>
                                        <div className={styles.godHeader}>
                                            <span className={styles.godName}>{god.name}</span>
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
                                                // Si c'est une image de sort "officielle" (comme Poséidon), on affiche juste l'image
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
                                                                        className={styles.godCardImage} // Réutilisation style cover
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
            {/* Navigation Bottom (Identique home pour consistance) */}
            <div className={styles.bottomNavWrapper}>
                <nav className={styles.bottomNav}>
                    <Link href="/shop" className={styles.navItem}>
                        <span className={styles.navIcon}>🏛️</span>
                        <span className={styles.navLabel}>Boutique</span>
                    </Link>

                    <Link href="/quests" className={styles.navItem}>
                        <span className={styles.navIcon}>📯</span>
                        <span className={styles.navLabel}>Quête</span>
                    </Link>

                    <Link href="/" className={styles.navItem}>
                        <span className={styles.navIcon}>⚔️</span>
                        <span className={styles.navLabel}>Jouer</span>
                    </Link>

                    <Link href="/deck" className={`${styles.navItem} ${styles.active}`}>
                        <span className={styles.navIcon}>📦</span>
                        <span className={styles.navLabel}>Deck</span>
                    </Link>

                    <Link href="/profile" className={styles.navItem}>
                        <span className={styles.navIcon}>👤</span>
                        <span className={styles.navLabel}>Profil</span>
                    </Link>
                </nav>
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
