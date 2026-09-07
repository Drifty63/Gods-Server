'use client';

import { useCallback, useRef } from 'react';

/** Distance minimale pour qu'un mouvement compte comme un balayage volontaire. */
const SWIPE_THRESHOLD_PX = 45;
/**
 * Au-delà de ce ratio vertical/horizontal, le geste est un défilement de page, pas un balayage
 * latéral : sans ce filtre, faire défiler la page ferait sauter le carrousel à chaque fois.
 */
const MAX_VERTICAL_RATIO = 0.8;
/** Un geste trop lent est une hésitation, pas un balayage. */
const MAX_DURATION_MS = 800;

interface SwipeHandlers {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: () => void;
}

/**
 * Balayage horizontal — le geste de base pour parcourir un carrousel sur téléphone.
 *
 * Le carrousel de l'accueil ne se pilotait qu'avec deux petites flèches et une rangée de points
 * (un par dieu, soit vingt cibles minuscules) : parfaitement utilisable à la souris, pénible au
 * pouce. Ce hook ajoute le geste attendu sans rien retirer des commandes existantes.
 *
 * Utilise les Pointer Events plutôt que les Touch Events : un seul code pour le doigt, le
 * stylet et la souris (utile aussi pour les tests et les écrans tactiles de bureau).
 */
export function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void): SwipeHandlers {
    const startRef = useRef<{ x: number; y: number; t: number } | null>(null);

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        startRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    }, []);

    const onPointerUp = useCallback((e: React.PointerEvent) => {
        const start = startRef.current;
        startRef.current = null;
        if (!start) return;

        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;

        if (Date.now() - start.t > MAX_DURATION_MS) return;
        if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
        if (Math.abs(dy) > Math.abs(dx) * MAX_VERTICAL_RATIO) return;

        // Balayer vers la GAUCHE fait avancer au suivant : le contenu suit le doigt.
        if (dx < 0) onSwipeLeft();
        else onSwipeRight();
    }, [onSwipeLeft, onSwipeRight]);

    const onPointerCancel = useCallback(() => {
        startRef.current = null;
    }, []);

    return { onPointerDown, onPointerUp, onPointerCancel };
}
