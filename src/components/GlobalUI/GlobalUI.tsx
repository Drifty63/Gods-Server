'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    getDailyQuests, claimQuestReward, claimAllQuestRewards, DailyQuest,
    getMailboxRewards, claimMailboxReward, claimAllMailboxRewards, MailboxReward,
    markWelcomeSeen, pingLastActive, submitBugReport,
} from '@/services/supabase-profile';
import { getGodById } from '@/data/gods';
import { useSettings } from '@/lib/settings';
import { hapticsSupported, haptic } from '@/lib/haptics';
import { playSfx } from '@/lib/sfx';
import { toast } from '@/lib/toast';

/** Version affichée et jointe aux rapports de bug. Une seule source, pour qu'un rapport ne
  * mente jamais sur la version où le problème a été vu. */
const APP_VERSION = '0.24';

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
    const { user, profile, refreshProfile, signOut } = useAuth();

    const [showOptionsModal, setShowOptionsModal] = useState(false);
    /** Déconnexion : confirmation obligatoire, c'est une action qu'on ne déclenche pas par erreur. */
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const [showBugModal, setShowBugModal] = useState(false);
    const [bugMessage, setBugMessage] = useState('');
    const [sendingBug, setSendingBug] = useState(false);
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

    // Audio — piloté par le store de préférences (src/lib/settings.ts), source unique partagée
    // avec le moteur de SFX et l'haptique. Auparavant chaque réglage vivait dans un useState
    // local recopié à la main dans localStorage, donc invisible pour le reste du jeu.
    const {
        musicVolume, battleVolume, sfxVolume, muted, hapticsEnabled, reduceMotion,
        setMusicVolume, setBattleVolume, setSfxVolume, toggleMuted, setHaptics, setReduceMotion,
    } = useSettings();

    const menuAudioRef = useRef<HTMLAudioElement | null>(null);
    const battleAudioRef = useRef<HTMLAudioElement | null>(null);
    const [hasInteracted, setHasInteracted] = useState(false);

    const isHomePage = pathname === '/';

    /**
     * Sommes-nous sur un écran de combat ? Le test portait uniquement sur '/game', donc les
     * combats en ligne, d'histoire et d'ascension gardaient la musique de MENU : trois modes
     * sur quatre n'avaient jamais leur ambiance sonore.
     */
    const isInGame = pathname === '/game'
        || pathname === '/online/game'
        || pathname === '/story/battle'
        || pathname === '/ascension';

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
                // L'accueil recompte ses récompenses en attente : sans ça, la pastille
                // resterait allumée jusqu'au prochain chargement de page.
                window.dispatchEvent(new Event('rewards-claimed'));
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
                window.dispatchEvent(new Event('rewards-claimed'));
            }
        } catch (error) {
            console.error('Erreur réclamation récompenses:', error);
        } finally {
            setClaimingReward(null);
        }
    };

    const hasClaimableMailboxRewards = mailboxRewards.some(r => !r.claimed);

    // Initialiser les pistes audio.
    // (Le chargement des volumes n'est plus nécessaire ici : le store `useSettings` est
    // persisté et récupère même les anciennes clés localStorage — voir son `merge`.)
    useEffect(() => {
        menuAudioRef.current = new Audio('/audio/menu_theme.mp3');
        menuAudioRef.current.loop = true;
        // `preload="none"` : les deux pistes pèsent plusieurs Mo et bloquaient la bande passante
        // du premier écran alors qu'aucune ne peut démarrer avant un geste utilisateur.
        menuAudioRef.current.preload = 'none';

        battleAudioRef.current = new Audio('/audio/battle_theme.mp3');
        battleAudioRef.current.loop = true;
        battleAudioRef.current.preload = 'none';

        const menu = menuAudioRef.current;
        const battle = battleAudioRef.current;
        return () => {
            menu.pause();
            battle.pause();
            menuAudioRef.current = null;
            battleAudioRef.current = null;
        };
    }, []);

    // Écouter la première interaction utilisateur pour débloquer l'audio.
    // `pointerdown` plutôt que `click` : sur mobile, il se déclenche dès le contact du doigt,
    // ce qui gagne la fenêtre d'autorisation même si le doigt glisse ensuite (pas de clic émis).
    useEffect(() => {
        if (hasInteracted) return;

        const handleInteraction = () => setHasInteracted(true);
        document.addEventListener('pointerdown', handleInteraction, { once: true });
        document.addEventListener('keydown', handleInteraction, { once: true });

        return () => {
            document.removeEventListener('pointerdown', handleInteraction);
            document.removeEventListener('keydown', handleInteraction);
        };
    }, [hasInteracted]);

    // Appliquer volume et sourdine aux deux pistes.
    useEffect(() => {
        if (menuAudioRef.current) {
            menuAudioRef.current.volume = musicVolume;
            menuAudioRef.current.muted = muted;
        }
        if (battleAudioRef.current) {
            battleAudioRef.current.volume = battleVolume;
            battleAudioRef.current.muted = muted;
        }
    }, [musicVolume, battleVolume, muted]);

    /**
     * Aiguillage menu / combat.
     *
     * La piste de combat existait dans `public/audio/` et son volume était réglable dans les
     * options, mais AUCUN code ne l'a jamais lancée : l'ancien effet se contentait de mettre
     * la musique de menu en pause en entrant en partie. Les combats se déroulaient donc dans
     * un silence complet, réglage de « Musique Combat » à l'appui.
     */
    useEffect(() => {
        const menu = menuAudioRef.current;
        const battle = battleAudioRef.current;
        if (!menu || !battle) return;

        // Rien ne peut démarrer avant le premier geste : les navigateurs rejettent play().
        if (!hasInteracted || muted) {
            menu.pause();
            battle.pause();
            return;
        }

        const [toPlay, toStop] = isInGame ? [battle, menu] : [menu, battle];
        toStop.pause();
        // `play()` renvoie une promesse rejetée si le navigateur refuse encore : sans catch,
        // cela remonte en « unhandled rejection » dans la console à chaque navigation.
        void toPlay.play().catch(() => undefined);
    }, [isInGame, hasInteracted, muted]);

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

    // La reprise de la lecture est gérée par l'effet d'aiguillage menu/combat, qui réagit à
    // `muted` : inutile (et fragile) de relancer la piste à la main ici.
    const toggleMute = () => {
        haptic('tap');
        toggleMuted();
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

                                {/* Sourdine générale : coupe musique, effets sonores ET vibrations */}
                                <div className={styles.muteToggle}>
                                    <span>Son général</span>
                                    <button
                                        className={`${styles.toggleButton} ${!muted ? styles.toggleActive : ''}`}
                                        onClick={toggleMute}
                                        aria-pressed={!muted}
                                    >
                                        {muted ? '🔇 Coupé' : '🔊 Activé'}
                                    </button>
                                </div>

                                {/* Volume Menu */}
                                <div className={styles.volumeControl}>
                                    <label className={styles.volumeLabel} htmlFor="opt-music-volume">
                                        <span className={styles.volumeIcon}>🎵</span>
                                        Musique Menu
                                    </label>
                                    <div className={styles.volumeSliderContainer}>
                                        <input
                                            id="opt-music-volume"
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={musicVolume}
                                            onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                                            className={styles.volumeSlider}
                                        />
                                        <span className={styles.volumeValue}>{Math.round(musicVolume * 100)}%</span>
                                    </div>
                                </div>

                                {/* Volume Combat */}
                                <div className={styles.volumeControl}>
                                    <label className={styles.volumeLabel} htmlFor="opt-battle-volume">
                                        <span className={styles.volumeIcon}>⚔️</span>
                                        Musique Combat
                                    </label>
                                    <div className={styles.volumeSliderContainer}>
                                        <input
                                            id="opt-battle-volume"
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

                                {/* Effets sonores : joue un échantillon au relâchement du curseur,
                                    sinon on règle un volume à l'aveugle sans rien entendre. */}
                                <div className={styles.volumeControl}>
                                    <label className={styles.volumeLabel} htmlFor="opt-sfx-volume">
                                        <span className={styles.volumeIcon}>🔔</span>
                                        Effets sonores
                                    </label>
                                    <div className={styles.volumeSliderContainer}>
                                        <input
                                            id="opt-sfx-volume"
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={sfxVolume}
                                            onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                                            onPointerUp={() => playSfx('select')}
                                            onKeyUp={() => playSfx('select')}
                                            className={styles.volumeSlider}
                                        />
                                        <span className={styles.volumeValue}>{Math.round(sfxVolume * 100)}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section Confort de jeu */}
                            <div className={styles.optionsSection}>
                                <h3 className={styles.optionsSectionTitle}>
                                    <span>📱</span> Confort de jeu
                                </h3>

                                {/* Vibrations : masquées sur les appareils qui n'en sont pas capables
                                    (desktop, iOS Safari) plutôt que d'exposer un interrupteur inerte. */}
                                {hapticsSupported() && (
                                    <div className={styles.muteToggle}>
                                        <span>Vibrations</span>
                                        <button
                                            className={`${styles.toggleButton} ${hapticsEnabled ? styles.toggleActive : ''}`}
                                            onClick={() => {
                                                setHaptics(!hapticsEnabled);
                                                // Vibre à l'activation : un aperçu immédiat de ce
                                                // que le réglage change concrètement.
                                                if (!hapticsEnabled) haptic('success');
                                            }}
                                            aria-pressed={hapticsEnabled}
                                        >
                                            {hapticsEnabled ? '📳 Activées' : '📴 Désactivées'}
                                        </button>
                                    </div>
                                )}

                                <div className={styles.muteToggle}>
                                    <span>Animations réduites</span>
                                    <button
                                        className={`${styles.toggleButton} ${reduceMotion === 'on' ? styles.toggleActive : ''}`}
                                        onClick={() => {
                                            haptic('tap');
                                            setReduceMotion(reduceMotion === 'on' ? 'off' : 'on');
                                        }}
                                        aria-pressed={reduceMotion === 'on'}
                                    >
                                        {reduceMotion === 'on' ? '🐢 Réduites' : '✨ Complètes'}
                                    </button>
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
                                {/* La déconnexion vivait dans l'en-tête du profil, derrière une porte 🚪
                                    dont la classe s'appelait `settingsButton` : personne ne la trouvait,
                                    et ceux qui la trouvaient ne s'attendaient pas à être déconnectés. */}
                                {user && (
                                    <button
                                        className={`${styles.optionLink} ${styles.optionDanger}`}
                                        onClick={() => setShowSignOutConfirm(true)}
                                    >
                                        Se déconnecter
                                    </button>
                                )}
                            </div>

                            {/* Section Signaler un bug */}
                            <div className={styles.optionsSection}>
                                <h3 className={styles.optionsSectionTitle}>
                                    <span>🐞</span> Un problème ?
                                </h3>
                                {user ? (
                                    <button
                                        className={styles.optionLink}
                                        style={{ width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
                                        onClick={() => { setBugMessage(''); setShowBugModal(true); }}
                                    >
                                        Signaler un bug
                                    </button>
                                ) : (
                                    <p className={styles.confirmText}>
                                        Connectez-vous pour signaler un bug.
                                    </p>
                                )}
                                {profile?.is_creator && (
                                    <Link href="/admin/bugs" className={styles.optionLink} onClick={closeOptionsModal}>
                                        Consulter les rapports
                                    </Link>
                                )}
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
                                <p className={styles.versionText}>GODS - Série 1 • Version {APP_VERSION}</p>
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

            {/* Signalement de bug.
              *
              * La page, le navigateur et la version sont joints automatiquement : un rapport
              * sans contexte oblige à redemander au joueur ce qu'il a déjà oublié. */}
            {showBugModal && (
                <div className={styles.modalOverlay} onClick={() => setShowBugModal(false)}>
                    <div className={styles.optionsModal} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeModalIcon} onClick={() => setShowBugModal(false)}>✕</button>
                        <h2>🐞 Signaler un bug</h2>
                        <div className={styles.optionsContent}>
                            <p className={styles.confirmText}>
                                Décrivez ce qui s&apos;est passé, et ce que vous attendiez. La page où
                                vous êtes et votre appareil sont joints automatiquement.
                            </p>
                            <textarea
                                className={styles.bugTextarea}
                                value={bugMessage}
                                onChange={(e) => setBugMessage(e.target.value)}
                                placeholder="Exemple : en Duel, après avoir confirmé mon équipe, l'écran est resté noir."
                                maxLength={4000}
                                rows={6}
                            />
                            <div className={styles.confirmActions}>
                                <button
                                    className={styles.optionLink}
                                    onClick={() => setShowBugModal(false)}
                                >
                                    Annuler
                                </button>
                                <button
                                    className={styles.optionLink}
                                    disabled={sendingBug || bugMessage.trim().length < 5}
                                    onClick={async () => {
                                        if (!user || !profile) return;
                                        setSendingBug(true);
                                        try {
                                            await submitBugReport({
                                                userId: user.id,
                                                username: profile.username,
                                                message: bugMessage,
                                                appVersion: APP_VERSION,
                                            });
                                            setShowBugModal(false);
                                            setBugMessage('');
                                            toast.success('Merci — votre rapport a bien été envoyé');
                                        } catch {
                                            toast.error("L'envoi a échoué. Réessayez dans un instant.");
                                        } finally {
                                            setSendingBug(false);
                                        }
                                    }}
                                >
                                    {sendingBug ? 'Envoi…' : 'Envoyer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation de déconnexion */}
            {showSignOutConfirm && (
                <div className={styles.modalOverlay} onClick={() => setShowSignOutConfirm(false)}>
                    <div className={styles.optionsModal} onClick={(e) => e.stopPropagation()}>
                        <h2>🚪 Se déconnecter</h2>
                        <div className={styles.optionsContent}>
                            <p className={styles.confirmText}>
                                Votre progression est enregistrée sur votre compte : vous la retrouverez
                                en vous reconnectant.
                            </p>
                            <div className={styles.confirmActions}>
                                <button
                                    className={styles.optionLink}
                                    onClick={() => setShowSignOutConfirm(false)}
                                >
                                    Annuler
                                </button>
                                <button
                                    className={`${styles.optionLink} ${styles.optionDanger}`}
                                    onClick={async () => {
                                        setShowSignOutConfirm(false);
                                        closeOptionsModal();
                                        await signOut();
                                    }}
                                >
                                    Se déconnecter
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
