'use client';

// Composant pour protéger les routes qui nécessitent une connexion
// Redirige vers /auth si l'utilisateur n'est pas connecté
// Redirige vers /profile/setup si l'utilisateur n'a pas de dieux

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface RequireAuthProps {
    children: React.ReactNode;
    redirectTo?: string;
}

export function RequireAuth({ children, redirectTo = '/auth' }: RequireAuthProps) {
    const { user, profile, loading, profileLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Attendre que le chargement soit terminé
        if (loading || profileLoading) return;

        // Rediriger vers auth si pas connecté
        if (!user) {
            router.push(redirectTo);
            return;
        }

        // Si on est sur la page de setup, ne pas rediriger (éviter boucle infinie)
        if (pathname === '/profile/setup') return;

        // Rediriger vers setup si l'utilisateur n'a pas de dieux (nouvel utilisateur ou ancien sans coffret)
        if (profile && profile.gods_owned.length === 0) {
            console.log('⚠️ Utilisateur sans dieux, redirection vers /profile/setup');
            router.push('/profile/setup');
            return;
        }
    }, [user, profile, loading, profileLoading, router, redirectTo, pathname]);

    /**
     * Écran de chargement au PREMIER chargement seulement.
     *
     * `profileLoading` repasse à vrai à chaque `refreshProfile()`, et remplacer alors les enfants
     * par ce loader les DÉMONTE : tout l'état local de la page est perdu, puis la page se remonte
     * à zéro. C'est ce qui faisait disparaître l'écran de fin d'ascension quelques secondes après
     * son apparition — le temps de l'aller-retour serveur — en ramenant le joueur au menu.
     *
     * Le défaut touchait tous les écrans qui rafraîchissent le profil : Ascension, Profil,
     * Boutique, et la récupération des récompenses.
     *
     * Une fois le profil connu, un rafraîchissement est une mise à jour d'arrière-plan : il ne
     * doit plus rien interrompre.
     */
    if (loading || (profileLoading && !profile)) {
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

    // Ne rien afficher si redirection vers setup en cours
    if (profile && profile.gods_owned.length === 0 && pathname !== '/profile/setup') {
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
