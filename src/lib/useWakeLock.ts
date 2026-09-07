'use client';

import { useEffect, useRef } from 'react';

/**
 * Maintient l'écran allumé tant que la condition est vraie.
 *
 * Un tour adverse (IA ou joueur distant) peut durer plusieurs dizaines de secondes sans aucune
 * interaction : sans ce verrou, le téléphone éteint son écran en plein combat, et le joueur doit
 * le rallumer, se réauthentifier, et retrouver la partie. C'est l'un des défauts les plus
 * visibles d'un jeu web par rapport à une application native.
 *
 * L'API Screen Wake Lock n'existe pas partout (iOS < 16.4, Firefox) : l'échec est silencieux et
 * le jeu reste parfaitement jouable.
 */
export function useWakeLock(active: boolean): void {
    const sentinelRef = useRef<WakeLockSentinel | null>(null);

    useEffect(() => {
        if (!active) return;
        if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

        let cancelled = false;

        const acquire = async () => {
            try {
                const sentinel = await navigator.wakeLock.request('screen');
                if (cancelled) {
                    void sentinel.release().catch(() => undefined);
                    return;
                }
                sentinelRef.current = sentinel;
            } catch {
                // Refus courant : onglet en arrière-plan, batterie faible, politique du navigateur.
            }
        };

        // Le système relâche AUTOMATIQUEMENT le verrou dès que l'onglet passe en arrière-plan.
        // Sans cette reprise au retour, l'écran se rendormait pour le reste de la partie après
        // le moindre passage sur une autre application.
        const handleVisibility = () => {
            if (document.visibilityState === 'visible' && !cancelled) void acquire();
        };

        void acquire();
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', handleVisibility);
            void sentinelRef.current?.release().catch(() => undefined);
            sentinelRef.current = null;
        };
    }, [active]);
}
