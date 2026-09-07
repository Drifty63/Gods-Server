'use client';

/**
 * File de notifications éphémères (toasts).
 *
 * Remplace les `alert()` qui parsemaient les pages Duel et En Ligne : une boîte de dialogue
 * native bloque le thread, casse l'immersion, ne se style pas, et sur mobile affiche le nom de
 * domaine — impensable pour un jeu qui vise la finition. Ici, le message glisse par-dessus
 * l'interface et disparaît seul.
 *
 * Store Zustand plutôt qu'un contexte React : `toast.error(...)` doit pouvoir être appelé depuis
 * n'importe où (gestionnaires d'événements, callbacks async, code hors composant) sans hook.
 */

import { create } from 'zustand';
import { playSfx } from './sfx';
import { haptic } from './haptics';

export type ToastKind = 'info' | 'success' | 'error';

export interface ToastItem {
    id: number;
    kind: ToastKind;
    message: string;
    /** Durée d'affichage en ms. */
    duration: number;
}

interface ToastStore {
    toasts: ToastItem[];
    push: (kind: ToastKind, message: string, duration?: number) => void;
    dismiss: (id: number) => void;
}

/** Au-delà, l'empilement masque l'écran de jeu : les plus anciens sortent en premier. */
const MAX_VISIBLE = 3;

let nextId = 1;

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    push: (kind, message, duration = 3200) => {
        const id = nextId++;
        set((s) => ({ toasts: [...s.toasts, { id, kind, message, duration }].slice(-MAX_VISIBLE) }));
        if (typeof window !== 'undefined') {
            window.setTimeout(() => {
                set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
            }, duration);
        }
    },
    dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/**
 * API impérative — `toast.error("Pas assez d'énergie")`. Chaque type porte son propre retour
 * sonore et haptique, pour que l'information passe même sans lire le texte.
 */
export const toast = {
    info: (message: string, duration?: number) => {
        useToastStore.getState().push('info', message, duration);
    },
    success: (message: string, duration?: number) => {
        useToastStore.getState().push('success', message, duration);
        playSfx('reward');
        haptic('success');
    },
    error: (message: string, duration?: number) => {
        useToastStore.getState().push('error', message, duration);
        playSfx('error');
        haptic('error');
    },
};
