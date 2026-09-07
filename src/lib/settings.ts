'use client';

/**
 * Préférences joueur (audio, haptique, animations), persistées côté navigateur.
 *
 * Source UNIQUE de vérité : avant, chaque réglage vivait dans un useState de GlobalUI recopié
 * à la main dans localStorage ('menuVolume', 'battleVolume', 'isMuted'), donc inaccessible au
 * reste de l'app — le moteur de SFX et l'haptique n'avaient aucun moyen de savoir si le joueur
 * avait coupé le son. Tout passe désormais par ce store, lisible hors React (getState()) par
 * les modules impératifs comme sfx.ts.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Qualité visuelle : permet de dégrader les effets sur un téléphone qui rame. */
export type VfxQuality = 'high' | 'low';

export interface SettingsState {
    // Audio
    musicVolume: number;      // 0..1 — musique de menu
    battleVolume: number;     // 0..1 — musique de combat
    sfxVolume: number;        // 0..1 — effets sonores
    muted: boolean;           // coupe TOUT (musique + sfx)

    // Ressenti
    hapticsEnabled: boolean;  // vibrations (mobile uniquement)
    vfxQuality: VfxQuality;
    /**
     * Réduction des animations. 'auto' suit la préférence système (prefers-reduced-motion),
     * ce qui est la valeur par défaut : un joueur qui a activé ce réglage au niveau de l'OS
     * ne devrait pas avoir à le redemander ici.
     */
    reduceMotion: 'auto' | 'on' | 'off';

    // Actions
    setMusicVolume: (v: number) => void;
    setBattleVolume: (v: number) => void;
    setSfxVolume: (v: number) => void;
    setMuted: (m: boolean) => void;
    toggleMuted: () => void;
    setHaptics: (h: boolean) => void;
    setVfxQuality: (q: VfxQuality) => void;
    setReduceMotion: (r: 'auto' | 'on' | 'off') => void;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const useSettings = create<SettingsState>()(
    persist(
        (set) => ({
            musicVolume: 0.3,
            battleVolume: 0.3,
            sfxVolume: 0.5,
            muted: false,
            hapticsEnabled: true,
            vfxQuality: 'high',
            reduceMotion: 'auto',

            setMusicVolume: (v) => set({ musicVolume: clamp01(v) }),
            setBattleVolume: (v) => set({ battleVolume: clamp01(v) }),
            setSfxVolume: (v) => set({ sfxVolume: clamp01(v) }),
            setMuted: (muted) => set({ muted }),
            toggleMuted: () => set((s) => ({ muted: !s.muted })),
            setHaptics: (hapticsEnabled) => set({ hapticsEnabled }),
            setVfxQuality: (vfxQuality) => set({ vfxQuality }),
            setReduceMotion: (reduceMotion) => set({ reduceMotion }),
        }),
        {
            name: 'gods-settings',
            version: 1,
            /**
             * Récupère les réglages de l'ancien stockage à plat ('menuVolume', 'battleVolume',
             * 'isMuted') pour qu'un joueur existant retrouve son volume au lieu de repartir des
             * valeurs par défaut. Ne s'exécute qu'une fois : dès que ce store écrit sa propre
             * clé, c'est elle qui fait foi.
             */
            merge: (persisted, current) => {
                if (persisted) return { ...current, ...(persisted as Partial<SettingsState>) };
                if (typeof window === 'undefined') return current;

                const legacyMenu = window.localStorage.getItem('menuVolume');
                const legacyBattle = window.localStorage.getItem('battleVolume');
                const legacyMuted = window.localStorage.getItem('isMuted');

                return {
                    ...current,
                    musicVolume: legacyMenu !== null ? clamp01(parseFloat(legacyMenu)) : current.musicVolume,
                    battleVolume: legacyBattle !== null ? clamp01(parseFloat(legacyBattle)) : current.battleVolume,
                    muted: legacyMuted !== null ? legacyMuted === 'true' : current.muted,
                };
            },
        },
    ),
);

/**
 * Le joueur veut-il des animations réduites ? Combine son choix explicite et la préférence
 * système. Utilisable hors React (pas un hook) — l'UI passe par useReducedMotion().
 */
export function prefersReducedMotion(): boolean {
    const { reduceMotion } = useSettings.getState();
    if (reduceMotion === 'on') return true;
    if (reduceMotion === 'off') return false;
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
