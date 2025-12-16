'use client';

// Composant pour protéger les routes qui nécessitent une connexion
// Redirige vers /auth si l'utilisateur n'est pas connecté

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface RequireAuthProps {
    children: React.ReactNode;
    redirectTo?: string;
}

export function RequireAuth({ children, redirectTo = '/auth' }: RequireAuthProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push(redirectTo);
        }
    }, [user, loading, router, redirectTo]);

    // Afficher un loader pendant la vérification
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0d0d2b 100%)',
                color: 'white',
                fontSize: '1.5rem',
            }}>
                <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                <span style={{ marginLeft: '10px' }}>Chargement...</span>
            </div>
        );
    }

    // Ne rien afficher si pas connecté (en attente de redirection)
    if (!user) {
        return null;
    }

    // Afficher le contenu protégé
    return <>{children}</>;
}

// Composant inverse : redirige vers l'accueil si DÉJÀ connecté (pour la page auth)
export function RequireGuest({ children, redirectTo = '/' }: RequireAuthProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push(redirectTo);
        }
    }, [user, loading, router, redirectTo]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0d0d2b 100%)',
                color: 'white',
                fontSize: '1.5rem',
            }}>
                <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
            </div>
        );
    }

    if (user) {
        return null;
    }

    return <>{children}</>;
}
