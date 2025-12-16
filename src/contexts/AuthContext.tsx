'use client';

// Contexte d'authentification React
// Fournit l'état de l'utilisateur connecté à toute l'application

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import {
    auth,
    onAuthStateChanged,
    getUserProfile,
    loginWithEmail,
    loginWithGoogle as loginWithGoogleFn,
    registerWithEmail,
    logout,
    updateUsername,
    updateAvatar,
    type User,
    type UserProfile
} from '@/services/firebase';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    profileLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    loginGoogle: () => Promise<boolean>; // Retourne true si nouveau compte (pour rediriger vers setup)
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
            console.log('Profil chargé:', userProfile);
        } catch (err) {
            console.error('Erreur chargement profil:', err);
            setProfile(null);
        } finally {
            setProfileLoading(false);
        }
    }, []);

    // Écouter les changements d'état d'authentification
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log('Auth state changed:', firebaseUser?.email);
            setUser(firebaseUser);

            if (firebaseUser) {
                await loadProfile(firebaseUser.uid);
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [loadProfile]);

    // Connexion avec email
    const login = async (email: string, password: string) => {
        setError(null);
        setLoading(true);
        try {
            const user = await loginWithEmail(email, password);
            // Charger le profil après connexion
            await loadProfile(user.uid);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
            setError(translateFirebaseError(errorMessage));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Connexion avec Google - Retourne isNewUser pour rediriger vers setup si besoin
    const loginGoogle = async (): Promise<boolean> => {
        setError(null);
        setLoading(true);
        try {
            const { user, isNewUser } = await loginWithGoogleFn();
            // Charger le profil après connexion
            await loadProfile(user.uid);
            return isNewUser;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion Google';
            setError(translateFirebaseError(errorMessage));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Inscription
    const register = async (email: string, password: string, username: string) => {
        setError(null);
        setLoading(true);
        try {
            const user = await registerWithEmail(email, password, username);
            // Charger le profil après inscription
            await loadProfile(user.uid);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur d\'inscription';
            setError(translateFirebaseError(errorMessage));
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
            await updateUsername(user.uid, username);
            await updateAvatar(user.uid, avatar);

            // Rafraîchir le profil
            await loadProfile(user.uid);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur de mise à jour';
            setError(translateFirebaseError(errorMessage));
            throw err;
        }
    };

    // Rafraîchir le profil
    const refreshProfile = useCallback(async () => {
        if (!user) return;
        await loadProfile(user.uid);
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

// Traduction des erreurs Firebase en français
function translateFirebaseError(errorMessage: string): string {
    if (errorMessage.includes('auth/email-already-in-use')) {
        return 'Cette adresse email est déjà utilisée.';
    }
    if (errorMessage.includes('auth/username-already-in-use')) {
        return 'Ce nom d\'utilisateur est déjà pris. Choisis-en un autre.';
    }
    if (errorMessage.includes('auth/invalid-email')) {
        return 'Adresse email invalide.';
    }
    if (errorMessage.includes('auth/weak-password')) {
        return 'Le mot de passe doit contenir au moins 6 caractères.';
    }
    if (errorMessage.includes('auth/user-not-found')) {
        return 'Aucun compte associé à cette adresse email.';
    }
    if (errorMessage.includes('auth/wrong-password')) {
        return 'Mot de passe incorrect.';
    }
    if (errorMessage.includes('auth/too-many-requests')) {
        return 'Trop de tentatives. Réessayez plus tard.';
    }
    if (errorMessage.includes('auth/popup-closed-by-user')) {
        return 'Connexion annulée.';
    }
    if (errorMessage.includes('auth/invalid-credential')) {
        return 'Email ou mot de passe incorrect.';
    }
    if (errorMessage.includes('permission-denied') || errorMessage.includes('PERMISSION_DENIED')) {
        return 'Accès refusé. Vérifie les règles Firestore.';
    }
    return errorMessage;
}
