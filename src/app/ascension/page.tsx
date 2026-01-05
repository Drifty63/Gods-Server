'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { RequireAuth } from '@/components/Auth/RequireAuth';
import { ALL_GODS } from '@/data/gods';
import styles from './page.module.css';

// Configuration du mode Ascension
const ASCENSION_CONFIG = {
    FLOORS: {
        SERVANTS: { start: 1, end: 5, label: 'Serviteurs', color: '#22c55e' },
        CREATURES: { start: 6, end: 10, label: 'Créatures', color: '#f59e0b' },
        GODS: { start: 11, end: 15, label: 'Dieux', color: '#ef4444' },
    },
    TOTAL_FLOORS: 15,
    NO_HEAL: true,
    NO_FATIGUE_DAMAGE: true,
};

export default function AscensionPage() {
    return (
        <RequireAuth>
            <AscensionContent />
        </RequireAuth>
    );
}

function AscensionContent() {
    const { profile } = useAuth();
    const [view, setView] = useState<'menu' | 'select' | 'climbing'>('menu');
    const [selectedGods, setSelectedGods] = useState<string[]>([]);
    const [currentFloor, setCurrentFloor] = useState(1);
    const [bestFloor, setBestFloor] = useState(0); // À charger depuis le profil plus tard

    // Dieux possédés par le joueur
    const ownedGods = ALL_GODS.filter(
        god => !god.hidden && (profile?.collection?.godsOwned?.includes(god.id) || profile?.isCreator)
    );

    const handleSelectGod = (godId: string) => {
        if (selectedGods.includes(godId)) {
            setSelectedGods(selectedGods.filter(id => id !== godId));
        } else if (selectedGods.length < 4) {
            setSelectedGods([...selectedGods, godId]);
        }
    };

    const handleStartAscension = () => {
        if (selectedGods.length === 4) {
            setCurrentFloor(1);
            setView('climbing');
            // TODO: Initialiser la partie avec les dieux sélectionnés
        }
    };

    const getFloorType = (floor: number) => {
        if (floor <= 5) return ASCENSION_CONFIG.FLOORS.SERVANTS;
        if (floor <= 10) return ASCENSION_CONFIG.FLOORS.CREATURES;
        return ASCENSION_CONFIG.FLOORS.GODS;
    };

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/play" className={styles.backButton}>← Retour</Link>
                <h1 className={styles.title}>🏔️ ASCENSION</h1>
                <div className={styles.bestFloor}>
                    🏆 Meilleur: {bestFloor}
                </div>
            </header>

            <div className={styles.content}>
                {/* Menu principal */}
                {view === 'menu' && (
                    <section className={styles.menuSection}>
                        <div className={styles.ascensionIcon}>🏔️</div>
                        <h2 className={styles.menuTitle}>Mode Ascension</h2>
                        <p className={styles.menuDesc}>
                            Grimpez le plus haut possible sans récupérer vos points de vie !
                        </p>

                        {/* Aperçu des étages */}
                        <div className={styles.floorsPreview}>
                            <div className={styles.floorRange} style={{ borderColor: ASCENSION_CONFIG.FLOORS.SERVANTS.color }}>
                                <span className={styles.floorIcon}>👤</span>
                                <span>Étages 1-5</span>
                                <span className={styles.floorLabel}>Serviteurs</span>
                            </div>
                            <div className={styles.floorRange} style={{ borderColor: ASCENSION_CONFIG.FLOORS.CREATURES.color }}>
                                <span className={styles.floorIcon}>🐉</span>
                                <span>Étages 6-10</span>
                                <span className={styles.floorLabel}>Créatures</span>
                            </div>
                            <div className={styles.floorRange} style={{ borderColor: ASCENSION_CONFIG.FLOORS.GODS.color }}>
                                <span className={styles.floorIcon}>⚡</span>
                                <span>Étages 11-15</span>
                                <span className={styles.floorLabel}>Dieux</span>
                            </div>
                        </div>

                        <div className={styles.rulesBox}>
                            <h3>📜 Règles</h3>
                            <ul>
                                <li>❌ Pas de soin entre les combats</li>
                                <li>📚 Le deck est conservé entre les combats</li>
                                <li>🔄 Pas de dégâts de fatigue</li>
                                <li>💀 Si tous vos dieux meurent, c'est terminé</li>
                            </ul>
                        </div>

                        <button
                            className={styles.startButton}
                            onClick={() => setView('select')}
                        >
                            ⚔️ Commencer l'Ascension
                        </button>

                        <div className={styles.comingSoonBadge}>
                            🚧 Mode en développement - Bientôt disponible !
                        </div>
                    </section>
                )}

                {/* Sélection d'équipe */}
                {view === 'select' && (
                    <section className={styles.selectSection}>
                        <h2>Choisissez votre équipe</h2>
                        <p className={styles.selectHint}>
                            Sélectionnez 4 dieux ({selectedGods.length}/4)
                        </p>

                        <div className={styles.godsGrid}>
                            {ownedGods.map(god => (
                                <div
                                    key={god.id}
                                    className={`${styles.godCard} ${selectedGods.includes(god.id) ? styles.selected : ''}`}
                                    onClick={() => handleSelectGod(god.id)}
                                >
                                    <div
                                        className={styles.godImage}
                                        style={{ backgroundImage: `url(${god.imageUrl})` }}
                                    />
                                    <span className={styles.godName}>{god.name.split(',')[0]}</span>
                                    {selectedGods.includes(god.id) && (
                                        <div className={styles.selectedBadge}>
                                            {selectedGods.indexOf(god.id) + 1}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className={styles.selectActions}>
                            <button
                                className={styles.backBtn}
                                onClick={() => setView('menu')}
                            >
                                Retour
                            </button>
                            <button
                                className={styles.confirmBtn}
                                onClick={handleStartAscension}
                                disabled={selectedGods.length !== 4}
                            >
                                Commencer ({selectedGods.length}/4)
                            </button>
                        </div>
                    </section>
                )}

                {/* Vue de l'ascension (placeholder) */}
                {view === 'climbing' && (
                    <section className={styles.climbingSection}>
                        <div className={styles.floorIndicator}>
                            <span className={styles.currentFloor}>Étage {currentFloor}</span>
                            <span className={styles.floorType} style={{ color: getFloorType(currentFloor).color }}>
                                {getFloorType(currentFloor).label}
                            </span>
                        </div>

                        <div className={styles.towerVisual}>
                            {Array.from({ length: ASCENSION_CONFIG.TOTAL_FLOORS }, (_, i) => {
                                const floor = ASCENSION_CONFIG.TOTAL_FLOORS - i;
                                const floorType = getFloorType(floor);
                                return (
                                    <div
                                        key={floor}
                                        className={`${styles.towerFloor} ${floor === currentFloor ? styles.currentFloorMarker : ''} ${floor < currentFloor ? styles.clearedFloor : ''}`}
                                        style={{ borderLeftColor: floorType.color }}
                                    >
                                        <span>{floor}</span>
                                        {floor === currentFloor && <span className={styles.youAreHere}>← Vous</span>}
                                    </div>
                                );
                            })}
                        </div>

                        <div className={styles.comingSoonOverlay}>
                            <p>🚧 Combats en cours de développement</p>
                            <button onClick={() => setView('menu')}>Retour au menu</button>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
