'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    getDailyQuests, claimQuestReward, claimAllQuestRewards, DailyQuest,
    getMailboxRewards, claimMailboxReward, claimAllMailboxRewards, MailboxReward,
    markWelcomeSeen, pingLastActive,
} from '@/services/supabase-profile';
import { getGodById } from '@/data/gods';

// La quête "usegod_<godId>" est générée dynamiquement côté serveur (un dieu possédé au
// hasard) et ne connaît que son id de dieu -- le nom réel est résolu ici, côté client, plutôt
// que de dupliquer les noms de dieux dans une fonction SQL.
function getQuestDisplayName(quest: DailyQuest): string {
    if (quest.godId) {
        const god = getGodById(quest.godId);
        // Les noms de dieux sont verbeux ("Poséidon, Dieu des océans") -- juste le prénom pour
        // un titre de quête lisible.
        if (god) return `Jouez ${god.name.split(',')[0]} ${quest.target} fois`;
    }
    return quest.name;
}
import styles from './GlobalUI.module.css';

// Bien en dessous de la fenêtre de 2 min utilisée par get_friends_list() pour dériver le
// statut "En ligne" -- une requête ratée n'a donc pas le temps de faire passer quelqu'un
// pour hors ligne avant le prochain essai.
const PRESENCE_HEARTBEAT_MS = 60000;

function formatRewardDate(iso: string): string {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    return `Il y a ${days}j`;
}

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

    // États pour la boîte de récompenses
    const [mailboxRewards, setMailboxRewards] = useState<MailboxReward[]>([]);
    const [rewardsLoading, setRewardsLoading] = useState(false);
    const [claimingReward, setClaimingReward] = useState<string | null>(null);

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
            const data = await getDailyQuests();
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
            const result = await claimQuestReward(questId);
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
            const result = await claimAllQuestRewards();
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

    // Charger la boîte de récompenses
    const loadMailboxRewards = useCallback(async () => {
        if (!user) return;
        setRewardsLoading(true);
        try {
            const data = await getMailboxRewards();
            setMailboxRewards(data);
        } catch (error) {
            console.error('Erreur chargement récompenses:', error);
        } finally {
            setRewardsLoading(false);
        }
    }, [user]);

    // Charger la boîte de récompenses quand la modal s'ouvre
    useEffect(() => {
        if (showRewardsModal && user) {
            loadMailboxRewards();
        }
    }, [showRewardsModal, user, loadMailboxRewards]);

    // Réclamer une récompense de la boîte
    const handleClaimMailboxReward = async (rewardId: string) => {
        if (!user || claimingReward) return;
        setClaimingReward(rewardId);
        try {
            const result = await claimMailboxReward(rewardId);
            if (result.success) {
                setMailboxRewards(prev => prev.map(r =>
                    r.id === rewardId ? { ...r, claimed: true } : r
                ));
                await refreshProfile();
            }
        } catch (error) {
            console.error('Erreur réclamation récompense:', error);
        } finally {
            setClaimingReward(null);
        }
    };

    // Réclamer toutes les récompenses de la boîte
    const handleClaimAllMailboxRewards = async () => {
        if (!user || claimingReward) return;
        setClaimingReward('all');
        try {
            const result = await claimAllMailboxRewards();
            if (result.success) {
                setMailboxRewards(prev => prev.map(r => ({ ...r, claimed: true })));
                await refreshProfile();
            }
        } catch (error) {
            console.error('Erreur réclamation récompenses:', error);
        } finally {
            setClaimingReward(null);
        }
    };

    const hasClaimableMailboxRewards = mailboxRewards.some(r => !r.claimed);

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
        // Si ce modal vient de s'ouvrir automatiquement pour un nouveau joueur (voir l'effet
        // ci-dessous), on marque la bienvenue comme vue pour qu'il ne se rouvre plus jamais.
        // No-op pour un joueur existant qui a ouvert les règles manuellement (déjà à true).
        if (user && profile && !profile.has_seen_welcome) {
            markWelcomeSeen(user.id).then(() => refreshProfile());
        }
    };

    // Modal de bienvenue : première fois qu'un nouveau joueur a un deck complet (juste après
    // le choix du pack starter), on lui montre directement les règles au lieu de compter sur
    // lui pour trouver le bouton "Règles" enfoui dans les options.
    useEffect(() => {
        if (user && profile && profile.gods_owned.length > 0 && !profile.has_seen_welcome) {
            setShowRulesModal(true);
        }
    }, [user, profile]);

    // Heartbeat de présence : pingLastActive() existait déjà (pour get_friends_list(), qui
    // dérive le statut "En ligne" de last_active_at) mais n'était jamais appelé nulle part --
    // le statut en ligne des amis ne reflétait donc jamais rien de réel après la connexion.
    useEffect(() => {
        if (!user) return;
        pingLastActive(user.id);
        const interval = setInterval(() => pingLastActive(user.id), PRESENCE_HEARTBEAT_MS);
        return () => clearInterval(interval);
    }, [user]);

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
                            {rewardsLoading ? (
                                <p className={styles.rewardText}>Chargement...</p>
                            ) : mailboxRewards.length === 0 ? (
                                <p className={styles.rewardText}>Aucune récompense pour le moment.</p>
                            ) : (
                                mailboxRewards.map((reward) => (
                                    <div key={reward.id} className={styles.rewardItem}>
                                        <span className={styles.rewardIcon}>🎁</span>
                                        <div className={styles.rewardInfo}>
                                            <p className={styles.rewardText}>
                                                {reward.title} — {reward.description} (+{reward.ambroisie_reward} 🍯)
                                            </p>
                                            <div className={styles.rewardMetadata}>
                                                <span className={styles.rewardTime}>{formatRewardDate(reward.created_at)}</span>
                                                {reward.claimed ? (
                                                    <button className={styles.acceptButton} disabled>✓ Récupéré</button>
                                                ) : (
                                                    <button
                                                        className={styles.acceptButton}
                                                        onClick={() => handleClaimMailboxReward(reward.id)}
                                                        disabled={claimingReward !== null}
                                                    >
                                                        {claimingReward === reward.id ? '...' : 'Accepter'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className={styles.rewardsFooter}>
                            <button className={styles.closeButton} onClick={closeRewardsModal}>
                                Fermer
                            </button>
                            {hasClaimableMailboxRewards && (
                                <button
                                    className={styles.acceptAllButton}
                                    onClick={handleClaimAllMailboxRewards}
                                    disabled={claimingReward !== null}
                                >
                                    {claimingReward === 'all' ? 'Récupération...' : 'Tout récupérer'}
                                </button>
                            )}
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
                                            <span className={styles.questName}>{getQuestDisplayName(quest)}</span>
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
                                    optimisant la gestion d&apos;énergie et en exploitant les interactions élémentaires.
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
                                    <li>2 cartes Générateur - Produisent de l&apos;énergie</li>
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
                                <p className={styles.highlight}>💥 <strong>Bonus de faiblesse :</strong> Frapper sur la faiblesse d&apos;un dieu inflige des dégâts doublés !</p>
                            </div>

                            {/* Système d'Énergie */}
                            <div className={styles.rulesSection}>
                                <h3>⚡ Système d&apos;Énergie</h3>
                                <ul className={styles.rulesList}>
                                    <li><strong>Premier joueur :</strong> Commence avec 0 énergie</li>
                                    <li><strong>Second joueur :</strong> Commence avec 1 énergie</li>
                                    <li><strong>Jouer une carte générateur :</strong> Gagne l&apos;énergie indiquée</li>
                                    <li><strong>Défausser une carte :</strong> Gagne +1 énergie</li>
                                </ul>
                            </div>

                            {/* Déroulement d'un Tour */}
                            <div className={styles.rulesSection}>
                                <h3>🔁 Déroulement d&apos;un Tour</h3>
                                <ol className={styles.rulesList}>
                                    <li><strong>Phase de Pioche :</strong> Piochez jusqu&apos;à avoir 5 cartes en main</li>
                                    <li><strong>Phase d&apos;Action :</strong> Jouez une carte OU défaussez une carte (+1 énergie)</li>
                                    <li><strong>Fin du Tour :</strong> Le tour passe à l&apos;adversaire</li>
                                </ol>
                            </div>

                            {/* Mort d'un Dieu */}
                            <div className={styles.rulesSection}>
                                <h3>💀 Mort d&apos;un Dieu</h3>
                                <p>
                                    Lorsque les PV d&apos;un dieu tombent à 0 ou moins, il est mort.
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

                            {/* Saignement & Pétrification */}
                            <div className={styles.rulesSection}>
                                <h3>🩸 Saignement</h3>
                                <p>
                                    Inflige ses dégâts en <strong>fin de tour</strong> et <strong>ignore le bouclier</strong> —
                                    contrairement au poison, qui ne frappe qu&apos;au moment où le dieu lance un sort.
                                    Plafonné à 2 marques, et chaque point de soin en retire une.
                                </p>
                            </div>

                            <div className={styles.rulesSection}>
                                <h3>🗿 Pétrification</h3>
                                <p>
                                    Rend la cible cassante : le <strong>prochain coup qu&apos;elle subit inflige +2 dégâts</strong> par
                                    marque. La marque attend ce coup et <strong>n&apos;expire jamais toute seule</strong> ; seuls des
                                    dégâts reçus ou un sort de purification (Aphrodite) la retirent.
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
