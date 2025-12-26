'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getDailyQuests, claimQuestReward, claimAllQuestRewards, DailyQuest } from '@/services/firebase';
import styles from './GlobalUI.module.css';

// Mock data pour les récompenses (sera remplacé plus tard)
const MOCK_REWARDS = [
    { id: 1, text: "Remerciement des développeurs.", timeLeft: "29j restant" },
    { id: 2, text: "Récompense défi 'Aphrodite' combat 1/5.", timeLeft: "29j restant" },
    { id: 3, text: "Récompense défi 'Zeus' combat 3/5.", timeLeft: "29j restant" },
    { id: 4, text: "Récompense pour retard sur la maintenance.", timeLeft: "29j restant" },
    { id: 5, text: "Récompense 1000 téléchargements.", timeLeft: "29j restant" },
];

export default function GlobalUI() {
    const pathname = usePathname();
    const { user, profile, refreshProfile } = useAuth();

    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [showRewardsModal, setShowRewardsModal] = useState(false);
    const [showQuestsModal, setShowQuestsModal] = useState(false);
    const [showRulesModal, setShowRulesModal] = useState(false);

    // États pour les quêtes journalières
    const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);
    const [questsLoading, setQuestsLoading] = useState(false);
    const [claimingQuest, setClaimingQuest] = useState<string | null>(null);

    // Chrono de réinitialisation des quêtes (temps jusqu'à minuit)
    const [timeUntilReset, setTimeUntilReset] = useState('');

    // Audio states
    const [menuVolume, setMenuVolume] = useState(0.3);
    const [battleVolume, setBattleVolume] = useState(0.3);
    const [isMuted, setIsMuted] = useState(false);
    const menuAudioRef = useRef<HTMLAudioElement | null>(null);
    const battleAudioRef = useRef<HTMLAudioElement | null>(null);
    const [hasInteracted, setHasInteracted] = useState(false);

    const isHomePage = pathname === '/';

    // Calculer le temps restant jusqu'à minuit
    const calculateTimeUntilMidnight = () => {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0); // Minuit du jour suivant

        const diff = midnight.getTime() - now.getTime();

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}min ${seconds.toString().padStart(2, '0')}s`;
    };

    // Mettre à jour le chrono chaque seconde
    useEffect(() => {
        setTimeUntilReset(calculateTimeUntilMidnight());

        const interval = setInterval(() => {
            setTimeUntilReset(calculateTimeUntilMidnight());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Charger les quêtes journalières
    const loadDailyQuests = useCallback(async () => {
        if (!user) return;
        setQuestsLoading(true);
        try {
            const data = await getDailyQuests(user.uid);
            setDailyQuests(data.quests);
        } catch (error) {
            console.error('Erreur chargement quêtes:', error);
        } finally {
            setQuestsLoading(false);
        }
    }, [user]);

    // Charger les quêtes quand la modal s'ouvre
    useEffect(() => {
        if (showQuestsModal && user) {
            loadDailyQuests();
        }
    }, [showQuestsModal, user, loadDailyQuests]);

    // Réclamer une récompense
    const handleClaimReward = async (questId: string) => {
        if (!user || claimingQuest) return;
        setClaimingQuest(questId);
        try {
            const result = await claimQuestReward(user.uid, questId);
            if (result.success) {
                // Mettre à jour localement
                setDailyQuests(prev => prev.map(q =>
                    q.id === questId ? { ...q, claimed: true } : q
                ));
                // Rafraîchir le profil pour mettre à jour l'ambroisie
                await refreshProfile();
            }
        } catch (error) {
            console.error('Erreur réclamation récompense:', error);
        } finally {
            setClaimingQuest(null);
        }
    };

    // Réclamer toutes les récompenses
    const handleClaimAllRewards = async () => {
        if (!user || claimingQuest) return;
        setClaimingQuest('all');
        try {
            const result = await claimAllQuestRewards(user.uid);
            if (result.success) {
                // Mettre à jour localement
                setDailyQuests(prev => prev.map(q =>
                    q.progress >= q.target ? { ...q, claimed: true } : q
                ));
                // Rafraîchir le profil
                await refreshProfile();
            }
        } catch (error) {
            console.error('Erreur réclamation récompenses:', error);
        } finally {
            setClaimingQuest(null);
        }
    };

    // Vérifier s'il y a des récompenses à réclamer
    const hasClaimableRewards = dailyQuests.some(q => q.progress >= q.target && !q.claimed);

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

    // Gérer la transition menu/combat selon la page
    const isInGame = pathname === '/game';

    useEffect(() => {
        if (isInGame) {
            // On est en combat : arrêter la musique du menu
            if (menuAudioRef.current) {
                menuAudioRef.current.pause();
            }
        } else {
            // On n'est pas en combat : reprendre la musique du menu si pas mute
            if (menuAudioRef.current && hasInteracted && !isMuted) {
                menuAudioRef.current.play().catch(console.log);
            }
        }
    }, [isInGame, hasInteracted, isMuted]);

    const handleOptionsClick = () => {
        setShowOptionsModal(true);
    };

    // Écouter les événements personnalisés
    useEffect(() => {
        const handleOpenOptions = () => setShowOptionsModal(true);
        const handleOpenRewards = () => setShowRewardsModal(true);
        const handleOpenQuests = () => setShowQuestsModal(true);

        window.addEventListener('open-options', handleOpenOptions);
        window.addEventListener('open-rewards', handleOpenRewards);
        window.addEventListener('open-quests', handleOpenQuests);

        return () => {
            window.removeEventListener('open-options', handleOpenOptions);
            window.removeEventListener('open-rewards', handleOpenRewards);
            window.removeEventListener('open-quests', handleOpenQuests);
        };
    }, []);

    const closeOptionsModal = () => {
        setShowOptionsModal(false);
    };

    const closeRewardsModal = () => {
        setShowRewardsModal(false);
    };

    const openRulesModal = () => {
        setShowOptionsModal(false); // Fermer les options
        setShowRulesModal(true);
    };

    const closeRulesModal = () => {
        setShowRulesModal(false);
    };

    const closeQuestsModal = () => {
        setShowQuestsModal(false);
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
                            {/* Bouton Retour à l'accueil */}
                            <Link href="/" className={styles.homeButton} onClick={closeOptionsModal}>
                                🏠 Retour à l&apos;accueil
                            </Link>

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
                                <button className={styles.optionLink} onClick={openRulesModal}>
                                    Consulter les règles
                                </button>
                            </div>

                            {/* Section À propos */}
                            <div className={styles.optionsSection}>
                                <h3 className={styles.optionsSectionTitle}>
                                    <span>ℹ️</span> À propos
                                </h3>
                                <p className={styles.versionText}>GODS - Série 1 • Version 0.24</p>
                                <p className={styles.creditsText}>Développé par Aseo, Drift & Zedycuss</p>
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

            {/* Modal des Quêtes Journalières */}
            {showQuestsModal && (
                <div className={styles.modalOverlay} onClick={closeQuestsModal}>
                    <div className={styles.questsModal} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeModalIcon} onClick={closeQuestsModal}>✕</button>
                        <h2>📜 Quêtes Journalières</h2>

                        <div className={styles.questsTimerInfo}>
                            <span className={styles.timerIcon}>⏰</span>
                            <span>Réinitialisation dans {timeUntilReset}</span>
                        </div>

                        {!user ? (
                            <div className={styles.questsNotLoggedIn}>
                                <p>🔒 Connectez-vous pour accéder aux quêtes journalières !</p>
                                <Link href="/auth" className={styles.loginButton} onClick={closeQuestsModal}>
                                    Se connecter
                                </Link>
                            </div>
                        ) : questsLoading ? (
                            <div className={styles.questsLoading}>
                                <span>⏳ Chargement des quêtes...</span>
                            </div>
                        ) : (
                            <div className={styles.questsList}>
                                {dailyQuests.map((quest) => (
                                    <div key={quest.id} className={`${styles.questItem} ${quest.claimed ? styles.questCompleted : ''}`}>
                                        <div className={styles.questInfo}>
                                            <span className={styles.questName}>{quest.name}</span>
                                            <div className={styles.questProgressContainer}>
                                                <div className={styles.questProgressBar}>
                                                    <div
                                                        className={styles.questProgressFill}
                                                        style={{ width: `${(quest.progress / quest.target) * 100}%` }}
                                                    />
                                                </div>
                                                <span className={styles.questProgressText}>
                                                    {quest.progress}/{quest.target}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={styles.questReward}>
                                            <Image
                                                src="/icons/ambroisie.png"
                                                alt="Ambroisie"
                                                width={20}
                                                height={20}
                                                className={styles.ambroisieIcon}
                                            />
                                            <span className={styles.ambroisieAmount}>{quest.reward}</span>
                                            {quest.claimed ? (
                                                <button className={styles.claimButtonDisabled} disabled>✓ Récupéré</button>
                                            ) : quest.progress >= quest.target ? (
                                                <button
                                                    className={styles.claimButton}
                                                    onClick={() => handleClaimReward(quest.id)}
                                                    disabled={claimingQuest !== null}
                                                >
                                                    {claimingQuest === quest.id ? '...' : 'Récupérer'}
                                                </button>
                                            ) : (
                                                <button className={styles.claimButtonDisabled} disabled>Récupérer</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={styles.questsFooter}>
                            {user && hasClaimableRewards && (
                                <button
                                    className={styles.claimAllButton}
                                    onClick={handleClaimAllRewards}
                                    disabled={claimingQuest !== null}
                                >
                                    {claimingQuest === 'all' ? 'Récupération...' : '✨ Tout récupérer'}
                                </button>
                            )}
                            <button className={styles.closeButton} onClick={closeQuestsModal}>
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal des Règles du Jeu */}
            {showRulesModal && (
                <div className={styles.modalOverlay} onClick={closeRulesModal}>
                    <div className={styles.rulesModal} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeModalIcon} onClick={closeRulesModal}>✕</button>
                        <h2>📖 Règles du Jeu</h2>

                        <div className={styles.rulesContent}>
                            {/* But du Jeu */}
                            <div className={styles.rulesSection}>
                                <h3>🎯 But du Jeu</h3>
                                <p>
                                    Le but de <strong>GODS</strong> est de <strong>vaincre tous les dieux adverses</strong> en
                                    optimisant la gestion d'énergie et en exploitant les interactions élémentaires.
                                </p>
                            </div>

                            {/* Deck & Dieux */}
                            <div className={styles.rulesSection}>
                                <h3>🎴 Deck & Dieux</h3>
                                <div className={styles.rulesInfoGrid}>
                                    <div className={styles.rulesInfoCard}>
                                        <span className={styles.rulesInfoNumber}>20</span>
                                        <span>Cartes par deck</span>
                                    </div>
                                    <div className={styles.rulesInfoCard}>
                                        <span className={styles.rulesInfoNumber}>4</span>
                                        <span>Dieux par joueur</span>
                                    </div>
                                    <div className={styles.rulesInfoCard}>
                                        <span className={styles.rulesInfoNumber}>5</span>
                                        <span>Cartes par dieu</span>
                                    </div>
                                </div>
                                <p><strong>Composition par dieu :</strong></p>
                                <ul className={styles.rulesList}>
                                    <li>2 cartes Générateur - Produisent de l'énergie</li>
                                    <li>2 cartes Compétence - Attaques et effets offensifs</li>
                                    <li>1 carte Utilitaire - Effets spéciaux et support</li>
                                </ul>
                            </div>

                            {/* Cycle Élémentaire */}
                            <div className={styles.rulesSection}>
                                <h3>🔄 Cycle Élémentaire</h3>
                                <p><strong>Cycle Principal :</strong></p>
                                <p className={styles.cycleText}>🔥 Feu → 💨 Air → 🌿 Terre → ⚡ Foudre → 💧 Eau → 🔥 Feu</p>
                                <p><strong>Cycle Parallèle :</strong></p>
                                <p className={styles.cycleText}>☀️ Lumière ⚔️ 💀 Ténèbres</p>
                                <p className={styles.highlight}>💥 <strong>Bonus de faiblesse :</strong> Frapper sur la faiblesse d'un dieu inflige des dégâts doublés !</p>
                            </div>

                            {/* Système d'Énergie */}
                            <div className={styles.rulesSection}>
                                <h3>⚡ Système d'Énergie</h3>
                                <ul className={styles.rulesList}>
                                    <li><strong>Premier joueur :</strong> Commence avec 0 énergie</li>
                                    <li><strong>Second joueur :</strong> Commence avec 1 énergie</li>
                                    <li><strong>Jouer une carte générateur :</strong> Gagne l'énergie indiquée</li>
                                    <li><strong>Défausser une carte :</strong> Gagne +1 énergie</li>
                                </ul>
                            </div>

                            {/* Déroulement d'un Tour */}
                            <div className={styles.rulesSection}>
                                <h3>🔁 Déroulement d'un Tour</h3>
                                <ol className={styles.rulesList}>
                                    <li><strong>Phase de Pioche :</strong> Piochez jusqu'à avoir 5 cartes en main</li>
                                    <li><strong>Phase d'Action :</strong> Jouez une carte OU défaussez une carte (+1 énergie)</li>
                                    <li><strong>Fin du Tour :</strong> Le tour passe à l'adversaire</li>
                                </ol>
                            </div>

                            {/* Mort d'un Dieu */}
                            <div className={styles.rulesSection}>
                                <h3>💀 Mort d'un Dieu</h3>
                                <p>
                                    Lorsque les PV d'un dieu tombent à 0 ou moins, il est mort.
                                    Toutes ses cartes sont <strong>retirées du jeu</strong>.
                                </p>
                            </div>

                            {/* Fatigue */}
                            <div className={styles.rulesSection}>
                                <h3>😫 Fatigue</h3>
                                <p>
                                    Quand votre deck est vide, la défausse est recyclée.
                                    À chaque recyclage, tous vos dieux subissent des <strong>dégâts croissants</strong> (+1, +2, +3...).
                                </p>
                            </div>
                        </div>

                        <div className={styles.rulesFooter}>
                            <button className={styles.closeButton} onClick={closeRulesModal}>
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
