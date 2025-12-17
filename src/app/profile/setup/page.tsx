'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { isUsernameTaken, updateUsername, updateAvatar, STARTER_PACKS, claimStarterPack, StarterPackId } from '@/services/firebase';
import { ALL_GODS } from '@/data/gods';
import styles from './page.module.css';

// Liste des avatars disponibles
const AVATARS = ['⚡', '🔥', '💧', '🌿', '☀️', '💀', '💨', '🌙', '⭐', '👑', '🦅', '🐍'];

export default function ProfileSetupPage() {
    const router = useRouter();
    const { user, profile, loading, refreshProfile } = useAuth();

    const [step, setStep] = useState<1 | 2>(1); // Étape 1: profil, Étape 2: pack starter
    const [username, setUsername] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('⚡');
    const [selectedPack, setSelectedPack] = useState<StarterPackId | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

    // Rediriger si pas connecté
    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth');
        }
    }, [user, loading, router]);

    // Si le profil existe et n'a pas besoin de setup, rediriger vers l'accueil
    useEffect(() => {
        if (!loading && profile && profile.needsSetup === false) {
            router.push('/');
        }
    }, [profile, loading, router]);

    // Pré-remplir avec les données existantes si disponibles
    useEffect(() => {
        if (profile) {
            if (profile.username) setUsername(profile.username);
            // Ne pas utiliser l'avatar si c'est une URL (photo Google)
            if (profile.avatar && !profile.avatar.startsWith('http')) {
                setSelectedAvatar(profile.avatar);
            }
        } else if (user?.displayName) {
            setUsername(user.displayName);
        } else if (user?.email) {
            setUsername(user.email.split('@')[0]);
        }
    }, [profile, user]);

    // Vérifier la disponibilité du pseudo après un délai
    useEffect(() => {
        if (username.length < 3) {
            setUsernameAvailable(null);
            return;
        }

        const timer = setTimeout(async () => {
            setCheckingUsername(true);
            try {
                const taken = await isUsernameTaken(username);
                // Si c'est le même pseudo que l'utilisateur actuel, c'est disponible
                if (profile?.username?.toLowerCase() === username.toLowerCase()) {
                    setUsernameAvailable(true);
                } else {
                    setUsernameAvailable(!taken);
                }
            } catch {
                setUsernameAvailable(null);
            }
            setCheckingUsername(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [username, profile]);

    // Obtenir les infos d'un dieu par son ID
    const getGodInfo = (godId: string) => {
        return ALL_GODS.find(g => g.id === godId);
    };

    // Passer à l'étape 2
    const handleNextStep = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validations
        if (username.length < 3) {
            setError('Le nom d\'utilisateur doit contenir au moins 3 caractères.');
            return;
        }
        if (username.length > 20) {
            setError('Le nom d\'utilisateur ne peut pas dépasser 20 caractères.');
            return;
        }
        if (!usernameAvailable) {
            setError('Ce nom d\'utilisateur n\'est pas disponible.');
            return;
        }

        setStep(2);
    };

    // Soumettre tout le formulaire
    const handleSubmit = async () => {
        if (!selectedPack) {
            setError('Veuillez choisir un coffret pour commencer.');
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            if (user) {
                // 1. Mettre à jour username et avatar
                await updateUsername(user.uid, username);
                await updateAvatar(user.uid, selectedAvatar);

                // 2. Attribuer le pack starter
                await claimStarterPack(user.uid, selectedPack);

                // 3. Rafraîchir le profil et rediriger
                await refreshProfile();
                router.push('/');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du profil';
            if (errorMessage.includes('username-already-in-use')) {
                setError('Ce nom d\'utilisateur est déjà pris.');
                setStep(1);
            } else {
                setError(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Chargement
    if (loading) {
        return (
            <main className={styles.main}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}>⏳</div>
                    <p>Chargement...</p>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            {/* Background animé */}
            <div className={styles.backgroundOrbs}>
                <div className={styles.orb}></div>
                <div className={styles.orb}></div>
                <div className={styles.orb}></div>
            </div>

            <div className={styles.setupContainer}>
                <div className={styles.setupCard}>
                    {/* Indicateur d'étapes */}
                    <div className={styles.stepIndicator}>
                        <div className={`${styles.stepDot} ${step >= 1 ? styles.active : ''}`}>1</div>
                        <div className={styles.stepLine}></div>
                        <div className={`${styles.stepDot} ${step >= 2 ? styles.active : ''}`}>2</div>
                    </div>

                    {step === 1 ? (
                        <>
                            <h1 className={styles.title}>🏛️ Création de ton Profil</h1>
                            <p className={styles.subtitle}>Personnalise ton identité divine avant de rejoindre l&apos;Olympe !</p>

                            {error && (
                                <div className={styles.error}>
                                    ⚠️ {error}
                                </div>
                            )}

                            <form onSubmit={handleNextStep} className={styles.form}>
                                {/* Sélection de l'avatar */}
                                <div className={styles.section}>
                                    <label className={styles.label}>Choisis ton Avatar</label>
                                    <div className={styles.avatarGrid}>
                                        {AVATARS.map((avatar) => (
                                            <button
                                                key={avatar}
                                                type="button"
                                                className={`${styles.avatarOption} ${selectedAvatar === avatar ? styles.selected : ''}`}
                                                onClick={() => setSelectedAvatar(avatar)}
                                            >
                                                {avatar}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Aperçu de l'avatar */}
                                <div className={styles.avatarPreview}>
                                    <div className={styles.previewAvatar}>{selectedAvatar}</div>
                                </div>

                                {/* Nom d'utilisateur */}
                                <div className={styles.section}>
                                    <label htmlFor="username" className={styles.label}>
                                        Nom d&apos;utilisateur
                                        {checkingUsername && <span className={styles.checking}> 🔄</span>}
                                        {!checkingUsername && usernameAvailable === true && <span className={styles.available}> ✅</span>}
                                        {!checkingUsername && usernameAvailable === false && <span className={styles.taken}> ❌</span>}
                                    </label>
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="OlympianWarrior"
                                        required
                                        minLength={3}
                                        maxLength={20}
                                        disabled={isSubmitting}
                                        className={styles.input}
                                    />
                                    <p className={styles.hint}>3 à 20 caractères</p>
                                </div>

                                {/* Bouton suivant */}
                                <button
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={isSubmitting || !usernameAvailable}
                                >
                                    Choisir mon Coffret →
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <h1 className={styles.title}>📦 Choisis ton Coffret</h1>
                            <p className={styles.subtitle}>Sélectionne ton équipe de départ pour commencer l&apos;aventure !</p>

                            {error && (
                                <div className={styles.error}>
                                    ⚠️ {error}
                                </div>
                            )}

                            <div className={styles.packGrid}>
                                {Object.values(STARTER_PACKS).map((pack) => (
                                    <div
                                        key={pack.id}
                                        className={`${styles.packCard} ${selectedPack === pack.id ? styles.selectedPack : ''}`}
                                        style={{ '--pack-color': pack.color } as React.CSSProperties}
                                        onClick={() => setSelectedPack(pack.id as StarterPackId)}
                                    >
                                        <h3 className={styles.packName}>{pack.name}</h3>
                                        <div className={styles.packGods}>
                                            {pack.godIds.map((godId) => {
                                                const god = getGodInfo(godId);
                                                return god ? (
                                                    <div key={godId} className={styles.packGod}>
                                                        <Image
                                                            src={god.imageUrl}
                                                            alt={god.name}
                                                            width={50}
                                                            height={50}
                                                            className={styles.packGodImage}
                                                        />
                                                        <span className={styles.packGodName}>{god.name.split(',')[0]}</span>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                        {selectedPack === pack.id && (
                                            <div className={styles.selectedBadge}>✓ Sélectionné</div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className={styles.buttonRow}>
                                <button
                                    type="button"
                                    className={styles.backButton}
                                    onClick={() => setStep(1)}
                                    disabled={isSubmitting}
                                >
                                    ← Retour
                                </button>
                                <button
                                    type="button"
                                    className={styles.submitButton}
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !selectedPack}
                                >
                                    {isSubmitting ? (
                                        <span className={styles.spinner}>⏳</span>
                                    ) : (
                                        '✨ Commencer l\'aventure'
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
