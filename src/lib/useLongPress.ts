'use client';

import { useCallback, useRef } from 'react';

/** Durée d'appui avant déclenchement. 450 ms : au-dessus du tapotement, sous le seuil d'agacement. */
const LONG_PRESS_MS = 450;
/** Au-delà de ce déplacement du doigt, on considère que le joueur fait défiler, pas qu'il appuie. */
const MOVE_TOLERANCE_PX = 12;

interface LongPressHandlers {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerLeave: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
    onContextMenu: (e: React.MouseEvent) => void;
}

/**
 * Appui long — le geste attendu sur mobile pour « en voir plus » sans agir.
 *
 * En combat, toucher une carte la sélectionne : il n'existait donc aucun moyen d'examiner une
 * carte (son effet complet, son illustration) sans engager l'action. L'appui long comble ce
 * manque, exactement comme dans les jeux de cartes natifs.
 *
 * @param onLongPress déclenché après l'appui maintenu
 * @param onClick     déclenché sur un appui court (le clic normal, supprimé si l'appui a été long)
 */
export function useLongPress(onLongPress: () => void, onClick?: () => void): LongPressHandlers {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const originRef = useRef<{ x: number; y: number } | null>(null);
    const firedRef = useRef(false);

    const clear = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        originRef.current = null;
    }, []);

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        firedRef.current = false;
        originRef.current = { x: e.clientX, y: e.clientY };
        timerRef.current = setTimeout(() => {
            firedRef.current = true;
            onLongPress();
        }, LONG_PRESS_MS);
    }, [onLongPress]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        const origin = originRef.current;
        if (!origin) return;
        if (Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > MOVE_TOLERANCE_PX) clear();
    }, [clear]);

    const onPointerUp = useCallback(() => {
        clear();
        // Un appui long ne doit PAS déclencher aussi le clic : sans cette garde, examiner une
        // carte la sélectionnerait au relâchement, soit l'inverse de l'intention.
        if (!firedRef.current) onClick?.();
        firedRef.current = false;
    }, [clear, onClick]);

    return {
        onPointerDown,
        onPointerUp,
        onPointerMove,
        onPointerLeave: clear,
        onPointerCancel: clear,
        // Empêche le menu contextuel du navigateur (« copier l'image ») de s'ouvrir par-dessus
        // l'aperçu à la fin de l'appui long.
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    };
}
