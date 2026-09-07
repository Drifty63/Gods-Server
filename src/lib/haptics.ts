'use client';

/**
 * Retour haptique (vibration) — le "toucher" qui distingue une app mobile soignée d'un site web.
 *
 * Volontairement discret : des vibrations trop longues ou trop fréquentes deviennent
 * désagréables et vident la batterie. Chaque motif est court et sert un événement précis.
 * L'API Vibration n'existe pas sur iOS Safari : tous les appels sont alors des no-op silencieux,
 * jamais une erreur.
 */

import { useSettings } from './settings';

export type HapticPattern =
    | 'tap'        // effleurement d'un bouton
    | 'select'     // sélection d'une carte / d'une cible
    | 'impact'     // dégâts encaissés
    | 'heavy'      // coup critique (faiblesse élémentaire) / mort d'un dieu
    | 'success'    // action réussie, récompense
    | 'error'      // action refusée
    | 'victory';   // fin de partie gagnée

const PATTERNS: Record<HapticPattern, number | number[]> = {
    tap: 8,
    select: 12,
    impact: 25,
    heavy: [30, 40, 60],
    success: [15, 40, 25],
    error: [40, 60, 40],
    victory: [40, 60, 40, 60, 90],
};

function canVibrate(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

/**
 * Déclenche une vibration, si le joueur l'a autorisée et si l'appareil sait le faire.
 * Ne lève jamais : certains navigateurs refusent la vibration hors geste utilisateur.
 */
export function haptic(pattern: HapticPattern = 'tap'): void {
    if (!canVibrate()) return;
    const { hapticsEnabled, muted } = useSettings.getState();
    // Le mode silencieux coupe aussi les vibrations : c'est ce qu'attend un joueur qui met son
    // téléphone en discrétion pendant une partie.
    if (!hapticsEnabled || muted) return;

    try {
        navigator.vibrate(PATTERNS[pattern]);
    } catch {
        // Appareil ou politique du navigateur qui refuse : rien à signaler au joueur.
    }
}

/** L'appareil sait-il vibrer ? Sert à masquer le réglage sur desktop plutôt que d'exposer un interrupteur inerte. */
export function hapticsSupported(): boolean {
    return canVibrate();
}
