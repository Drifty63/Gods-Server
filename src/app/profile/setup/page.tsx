'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isUsernameTaken, updateUsername, updateAvatar, getUserProfile } from '@/services/firebase';
import styles from './page.module.css';

// Liste des avatars disponibles
const AVATARS = ['⚡', '🔥', '💧', '🌿', '☀️', '💀', '💨', '🌙', '⭐', '👑', '🦅', '🐍'];

export default function ProfileSetupPage() {
    const router = useRouter();
    const { user, profile, loading, refreshProfile } = useAuth();

    const [username, setUsername] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('⚡');
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

    // Si le profil existe déjà et est complet, rediriger vers l'accueil
    useEffect(() => {
        if (!loading && profile && profile.username) {
            router.push('/');
        }
    }, [profile, loading, router]);

    // Pré-remplir avec les données existantes si disponibles
    useEffect(() => {
        if (profile) {
            if (profile.username) setUsername(profile.username);
            if (profile.avatar) setSelectedAvatar(profile.avatar);
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

    const handleSubmit = async (e: React.FormEvent) => {
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

        setIsSubmitting(true);

        try {
            if (user) {
                await updateUsername(user.uid, username);
                await updateAvatar(user.uid, selectedAvatar);
                await refreshProfile();
                router.push('/');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du profil';
            if (errorMessage.includes('username-already-in-use')) {
                setError('Ce nom d\'utilisateur est déjà pris.');
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
                    <h1 className={styles.title}>🏛️ Création de ton Profil</h1>
                    <p className={styles.subtitle}>Personnalise ton identité divine avant de rejoindre l&apos;Olympe !</p>

                    {error && (
                        <div className={styles.error}>
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form}>
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

                        {/* Bouton de validation */}
                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isSubmitting || !usernameAvailable}
                        >
                            {isSubmitting ? (
                                <span className={styles.spinner}>⏳</span>
                            ) : (
                                '✨ Entrer dans l\'Olympe'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
