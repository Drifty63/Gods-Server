'use client';

// Contexte d'authentification React
// Fournit l'état de l'utilisateur connecté à toute l'application

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getSupabaseClient } from '@/services/supabase-realtime';
import {
    getUserProfile,
    loginWithEmail,
    loginWithGoogle as loginWithGoogleFn,
    registerWithEmail,
    logout,
    updateUsername,
    updateAvatar,
    type User,
    type UserProfile
} from '@/services/supabase-profile';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    profileLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    loginGoogle: () => Promise<void>; // Redirige vers Google ; RequireAuth gère l'aiguillage vers /profile/setup au retour
    register: (email: string, password: string, username: string) => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (username: string, avatar: string) => Promise<void>;
    refreshProfile: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Charger le profil
    const loadProfile = useCallback(async (uid: string) => {
        setProfileLoading(true);
        try {
            const userProfile = await getUserProfile(uid);
            setProfile(userProfile);
        } catch (err) {
            console.error('Erreur chargement profil:', err);
            setProfile(null);
        } finally {
            setProfileLoading(false);
        }
    }, []);

    // Écouter les changements d'état d'authentification (onAuthStateChange émet un événement
    // INITIAL_SESSION dès l'abonnement, pas besoin d'un getSession() séparé au montage)
    useEffect(() => {
        const supabase = getSupabaseClient();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);

            if (session?.user) {
                await loadProfile(session.user.id);
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [loadProfile]);

    // Connexion avec email
    const login = async (email: string, password: string) => {
        setError(null);
        setLoading(true);
        try {
            const user = await loginWithEmail(email, password);
            await loadProfile(user.id);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
            setError(translateSupabaseAuthError(errorMessage));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Connexion avec Google (redirige, ne revient jamais synchronement)
    const loginGoogle = async (): Promise<void> => {
        setError(null);
        setLoading(true);
        try {
            await loginWithGoogleFn();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion Google';
            setError(translateSupabaseAuthError(errorMessage));
            setLoading(false);
            throw err;
        }
    };

    // Inscription
    const register = async (email: string, password: string, username: string) => {
        setError(null);
        setLoading(true);
        try {
            const user = await registerWithEmail(email, password, username);
            await loadProfile(user.id);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur d\'inscription';
            setError(translateSupabaseAuthError(errorMessage));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Déconnexion
    const signOut = async () => {
        setError(null);
        try {
            await logout();
            setUser(null);
            setProfile(null);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur de déconnexion';
            setError(errorMessage);
        }
    };

    // Mise à jour du profil
    const updateProfileFn = async (username: string, avatar: string) => {
        if (!user) return;

        setError(null);
        try {
            await updateUsername(user.id, username);
            await updateAvatar(user.id, avatar);

            // Rafraîchir le profil
            await loadProfile(user.id);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur de mise à jour';
            setError(translateSupabaseAuthError(errorMessage));
            throw err;
        }
    };

    // Rafraîchir le profil
    const refreshProfile = useCallback(async () => {
        if (!user) return;
        await loadProfile(user.id);
    }, [user, loadProfile]);

    // Effacer les erreurs
    const clearError = () => setError(null);

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            profileLoading,
            error,
            login,
            loginGoogle,
            register,
            signOut,
            updateProfile: updateProfileFn,
            refreshProfile,
            clearError,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook personnalisé pour utiliser le contexte
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
}

// Traduction des erreurs Supabase Auth / Postgres en français
function translateSupabaseAuthError(errorMessage: string): string {
    if (errorMessage.includes('profiles_username_lower_idx') || errorMessage.includes('auth/username-already-in-use')) {
        return 'Ce nom d\'utilisateur est déjà pris. Choisis-en un autre.';
    }
    if (errorMessage.includes('User already registered')) {
        return 'Cette adresse email est déjà utilisée.';
    }
    if (errorMessage.includes('Unable to validate email address') || errorMessage.includes('invalid')) {
        return 'Adresse email invalide.';
    }
    if (errorMessage.includes('Password should be at least')) {
        return 'Le mot de passe doit contenir au moins 6 caractères.';
    }
    if (errorMessage.includes('Invalid login credentials')) {
        return 'Email ou mot de passe incorrect.';
    }
    if (errorMessage.includes('too many requests') || errorMessage.includes('rate limit')) {
        return 'Trop de tentatives. Réessayez plus tard.';
    }
    return errorMessage;
}
