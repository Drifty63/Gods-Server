'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './GlobalUI.module.css';

// Mock data pour les récompenses
const MOCK_REWARDS = [
    { id: 1, text: "Remerciement des développeurs.", timeLeft: "29j restant" },
    { id: 2, text: "Récompense défi 'Aphrodite' combat 1/5.", timeLeft: "29j restant" },
    { id: 3, text: "Récompense défi 'Zeus' combat 3/5.", timeLeft: "29j restant" },
    { id: 4, text: "Récompense pour retard sur la maintenance.", timeLeft: "29j restant" },
    { id: 5, text: "Récompense 1000 téléchargements.", timeLeft: "29j restant" },
];

export default function GlobalUI() {
    const pathname = usePathname();
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [showRewardsModal, setShowRewardsModal] = useState(false);

    // Audio states
    const [menuVolume, setMenuVolume] = useState(0.3);
    const [battleVolume, setBattleVolume] = useState(0.3);
    const [isMuted, setIsMuted] = useState(false);
    const menuAudioRef = useRef<HTMLAudioElement | null>(null);
    const battleAudioRef = useRef<HTMLAudioElement | null>(null);
    const [hasInteracted, setHasInteracted] = useState(false);

    const isHomePage = pathname === '/';

    // Charger les volumes depuis localStorage au montage
    useEffect(() => {
        const savedMenuVolume = localStorage.getItem('menuVolume');
        const savedBattleVolume = localStorage.getItem('battleVolume');
        const savedMuted = localStorage.getItem('isMuted');

        if (savedMenuVolume) setMenuVolume(parseFloat(savedMenuVolume));
        if (savedBattleVolume) setBattleVolume(parseFloat(savedBattleVolume));
        if (savedMuted) setIsMuted(savedMuted === 'true');
    }, []);

    // Initialiser les pistes audio
    useEffect(() => {
        menuAudioRef.current = new Audio('/audio/menu_theme.mp3');
        menuAudioRef.current.loop = true;
        menuAudioRef.current.volume = menuVolume;

        battleAudioRef.current = new Audio('/audio/battle_theme.mp3');
        battleAudioRef.current.loop = true;
        battleAudioRef.current.volume = battleVolume;

        return () => {
            if (menuAudioRef.current) {
                menuAudioRef.current.pause();
                menuAudioRef.current = null;
            }
            if (battleAudioRef.current) {
                battleAudioRef.current.pause();
                battleAudioRef.current = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Écouter la première interaction utilisateur pour débloquer l'audio
    useEffect(() => {
        const handleInteraction = () => {
            if (!hasInteracted) {
                setHasInteracted(true);
                // Démarrer la musique menu si on n'est pas mute
                if (menuAudioRef.current && !isMuted) {
                    menuAudioRef.current.play().catch(console.log);
                }
            }
        };

        if (!hasInteracted) {
            document.addEventListener('click', handleInteraction);
            document.addEventListener('keydown', handleInteraction);
        }

        return () => {
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('keydown', handleInteraction);
        };
    }, [hasInteracted, isMuted]);

    // Appliquer le mute/unmute
    useEffect(() => {
        if (menuAudioRef.current) {
            menuAudioRef.current.muted = isMuted;
        }
        if (battleAudioRef.current) {
            battleAudioRef.current.muted = isMuted;
        }
        localStorage.setItem('isMuted', String(isMuted));
    }, [isMuted]);

    // Appliquer le volume du menu
    useEffect(() => {
        if (menuAudioRef.current) {
            menuAudioRef.current.volume = menuVolume;
        }
        localStorage.setItem('menuVolume', String(menuVolume));
    }, [menuVolume]);

    // Appliquer le volume du combat
    useEffect(() => {
        if (battleAudioRef.current) {
            battleAudioRef.current.volume = battleVolume;
        }
        localStorage.setItem('battleVolume', String(battleVolume));
    }, [battleVolume]);

    const handleOptionsClick = () => {
        setShowOptionsModal(true);
    };

    // Écouter les événements personnalisés
    useEffect(() => {
        const handleOpenOptions = () => setShowOptionsModal(true);
        const handleOpenRewards = () => setShowRewardsModal(true);

        window.addEventListener('open-options', handleOpenOptions);
        window.addEventListener('open-rewards', handleOpenRewards);

        return () => {
            window.removeEventListener('open-options', handleOpenOptions);
            window.removeEventListener('open-rewards', handleOpenRewards);
        };
    }, []);

    const closeOptionsModal = () => {
        setShowOptionsModal(false);
    };

    const closeRewardsModal = () => {
        setShowRewardsModal(false);
    };

    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);

        // Si on unmute, relancer la musique menu si on a interagi
        if (!newMuted && menuAudioRef.current && hasInteracted) {
            menuAudioRef.current.play().catch(console.log);
        }
    };

    return (
        <>
            {/* Bouton Options Flottant (sauf si page accueil car déjà dans header) */}
            {!isHomePage && (
                <div className={styles.globalContainer}>
                    <button
                        className={styles.optionsButton}
                        onClick={handleOptionsClick}
                        title="Options"
                    >
                        ⚙️
                    </button>
                </div>
            )}

            {/* Modal des Options (Global) */}
            {showOptionsModal && (
                <div className={styles.modalOverlay} onClick={closeOptionsModal}>
                    <div className={styles.optionsModal} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeModalIcon} onClick={closeOptionsModal}>✕</button>
                        <h2>⚙️ Options</h2>

                        <div className={styles.optionsContent}>
                            {/* Section Audio */}
                            <div className={styles.optionsSection}>
                                <h3 className={styles.optionsSectionTitle}>
                                    <span>🔊</span> Audio
                                </h3>

                                {/* Bouton Mute global */}
                                <div className={styles.muteToggle}>
                                    <span>Musique Global</span>
                                    <button
                                        className={`${styles.toggleButton} ${!isMuted ? styles.toggleActive : ''}`}
                                        onClick={toggleMute}
                                    >
                                        {isMuted ? '🔇 Désactivée' : '🔊 Activée'}
                                    </button>
                                </div>

                                {/* Volume Menu */}
                                <div className={styles.volumeControl}>
                                    <label className={styles.volumeLabel}>
                                        <span className={styles.volumeIcon}>🎵</span>
                                        Musique Menu
                                    </label>
                                    <div className={styles.volumeSliderContainer}>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={menuVolume}
                                            onChange={(e) => setMenuVolume(parseFloat(e.target.value))}
                                            className={styles.volumeSlider}
                                        />
                                        <span className={styles.volumeValue}>{Math.round(menuVolume * 100)}%</span>
                                    </div>
                                </div>

                                {/* Volume Combat */}
                                <div className={styles.volumeControl}>
                                    <label className={styles.volumeLabel}>
                                        <span className={styles.volumeIcon}>⚔️</span>
                                        Musique Combat
                                    </label>
                                    <div className={styles.volumeSliderContainer}>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={battleVolume}
                                            onChange={(e) => setBattleVolume(parseFloat(e.target.value))}
                                            className={styles.volumeSlider}
                                        />
                                        <span className={styles.volumeValue}>{Math.round(battleVolume * 100)}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section Compte */}
                            <div className={styles.optionsSection}>
                                <h3 className={styles.optionsSectionTitle}>
                                    <span>👤</span> Compte
                                </h3>
                                <Link href="/profile" className={styles.optionLink} onClick={closeOptionsModal}>
                                    Gérer mon profil
                                </Link>
                            </div>

                            {/* Section Règles du jeu */}
                            <div className={styles.optionsSection}>
                                <h3 className={styles.optionsSectionTitle}>
                                    <span>📖</span> Règles du jeu
                                </h3>
                                <Link href="/rules" className={styles.optionLink} onClick={closeOptionsModal}>
                                    Consulter les règles
                                </Link>
                            </div>

                            {/* Section À propos */}
                            <div className={styles.optionsSection}>
                                <h3 className={styles.optionsSectionTitle}>
                                    <span>ℹ️</span> À propos
                                </h3>
                                <p className={styles.versionText}>GODS - Série 1 • Version 0.24</p>
                                <p className={styles.creditsText}>Développé par Aseo & Drift</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal des Récompenses */}
            {showRewardsModal && (
                <div className={styles.modalOverlay} onClick={closeRewardsModal}>
                    <div className={styles.rewardsModal} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeModalIcon} onClick={closeRewardsModal}>✕</button>
                        <h2>Récompenses :</h2>

                        <div className={styles.rewardsList}>
                            {MOCK_REWARDS.map((reward) => (
                                <div key={reward.id} className={styles.rewardItem}>
                                    <span className={styles.rewardIcon}>🎁</span>
                                    <div className={styles.rewardInfo}>
                                        <p className={styles.rewardText}>{reward.text}</p>
                                        <div className={styles.rewardMetadata}>
                                            <span className={styles.rewardTime}>{reward.timeLeft}</span>
                                            <button className={styles.acceptButton}>Accepter</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.rewardsFooter}>
                            <button className={styles.closeButton} onClick={closeRewardsModal}>
                                Fermer
                            </button>
                            <button className={styles.acceptAllButton}>
                                Tout récupérer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
