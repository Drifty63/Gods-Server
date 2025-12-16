'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { RequireGuest } from '@/components/Auth/RequireAuth';
import styles from './page.module.css';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
    return (
        <RequireGuest>
            <AuthContent />
        </RequireGuest>
    );
}

function AuthContent() {
    const router = useRouter();
    const { login, loginGoogle, register, error, loading, clearError } = useAuth();

    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        clearError();
        setLocalError(null);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setUsername('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        clearError();

        // Validations
        if (mode === 'register') {
            if (password !== confirmPassword) {
                setLocalError('Les mots de passe ne correspondent pas.');
                return;
            }
            if (username.length < 3) {
                setLocalError('Le nom d\'utilisateur doit contenir au moins 3 caractères.');
                return;
            }
            if (username.length > 20) {
                setLocalError('Le nom d\'utilisateur ne peut pas dépasser 20 caractères.');
                return;
            }
        }

        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                await register(email, password, username);
            }
            router.push('/');
        } catch {
            // L'erreur est gérée par le contexte
        }
    };

    const handleGoogleLogin = async () => {
        setLocalError(null);
        clearError();

        try {
            await loginGoogle();
            router.push('/');
        } catch {
            // L'erreur est gérée par le contexte
        }
    };

    const displayError = localError || error;

    return (
        <main className={styles.main}>
            {/* Background animé */}
            <div className={styles.backgroundOrbs}>
                <div className={styles.orb}></div>
                <div className={styles.orb}></div>
                <div className={styles.orb}></div>
            </div>

            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.backButton}>← Retour</Link>
                <h1 className={styles.logo}>⚡ GODS</h1>
            </header>

            {/* Formulaire */}
            <div className={styles.authContainer}>
                <div className={styles.authCard}>
                    {/* Onglets */}
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${mode === 'login' ? styles.active : ''}`}
                            onClick={() => switchMode('login')}
                        >
                            Connexion
                        </button>
                        <button
                            className={`${styles.tab} ${mode === 'register' ? styles.active : ''}`}
                            onClick={() => switchMode('register')}
                        >
                            Inscription
                        </button>
                    </div>

                    {/* Titre */}
                    <h2 className={styles.title}>
                        {mode === 'login' ? 'Bienvenue, Champion !' : 'Rejoins l\'Olympe !'}
                    </h2>
                    <p className={styles.subtitle}>
                        {mode === 'login'
                            ? 'Connecte-toi pour reprendre ta quête divine.'
                            : 'Crée ton compte et deviens un dieu.'
                        }
                    </p>

                    {/* Erreur */}
                    {displayError && (
                        <div className={styles.error}>
                            ⚠️ {displayError}
                        </div>
                    )}

                    {/* Formulaire */}
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {mode === 'register' && (
                            <div className={styles.inputGroup}>
                                <label htmlFor="username">Nom d&apos;utilisateur</label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="OlympianWarrior"
                                    required
                                    minLength={3}
                                    maxLength={20}
                                    disabled={loading}
                                />
                            </div>
                        )}

                        <div className={styles.inputGroup}>
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="zeus@olympe.gr"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="password">Mot de passe</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                disabled={loading}
                            />
                        </div>

                        {mode === 'register' && (
                            <div className={styles.inputGroup}>
                                <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    disabled={loading}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className={styles.spinner}>⏳</span>
                            ) : (
                                mode === 'login' ? '⚡ Se connecter' : '✨ Créer mon compte'
                            )}
                        </button>
                    </form>

                    {/* Séparateur */}
                    <div className={styles.separator}>
                        <span>ou</span>
                    </div>

                    {/* Connexion Google */}
                    <button
                        className={styles.googleButton}
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        <svg className={styles.googleIcon} viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continuer avec Google
                    </button>

                    {/* Lien vers l'autre mode */}
                    <p className={styles.switchText}>
                        {mode === 'login' ? (
                            <>Pas encore de compte ? <button onClick={() => switchMode('register')} className={styles.switchLink}>Inscris-toi</button></>
                        ) : (
                            <>Déjà un compte ? <button onClick={() => switchMode('login')} className={styles.switchLink}>Connecte-toi</button></>
                        )}
                    </p>
                </div>
            </div>
        </main>
    );
}
