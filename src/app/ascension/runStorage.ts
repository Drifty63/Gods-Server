'use client';

import type { GameState } from '@/types/cards';
import type { AscensionFloor } from '@/data/ascension';

/**
 * Sauvegarde d'une ascension en cours, pour la reprendre EXACTEMENT là où on l'a laissée.
 *
 * Une ascension dure quinze combats : c'est long, et jusqu'ici fermer l'application en
 * effaçait chaque trace. Un joueur parvenu au dixième étage perdait tout pour avoir répondu au
 * téléphone.
 *
 * Elle vit en `localStorage` et non côté serveur : c'est une partie SOLO, personne d'autre
 * n'en dépend, et une reprise ne doit pas exiger de réseau. La contrepartie est qu'elle est
 * propre à l'appareil — changer de téléphone perd l'ascension en cours, jamais le record, qui
 * lui est remonté au serveur à chaque étage franchi.
 */

const KEY = 'gods-ascension-run';

/**
 * Version du format. À INCRÉMENTER dès que la forme change : une sauvegarde d'un ancien format
 * relue par un nouveau code produirait une partie incohérente, bien plus déroutante qu'une
 * ascension perdue. Une version inconnue est simplement ignorée.
 */
const FORMAT = 2;

export interface SavedRun {
    version: number;
    /** La tour tirée au départ : la reprendre doit rendre les MÊMES étages. */
    floors: AscensionFloor[];
    currentFloor: number;
    reward: number;
    carry: {
        health: Record<string, number>;
        energy: number;
        aliveGodIds: string[];
    };
    /**
     * Le combat en cours, s'il y en a un.
     *
     * C'est lui qui permet de reprendre au milieu d'un affrontement plutôt qu'au début de
     * l'étage — donc sans offrir de seconde chance à qui ferme l'application en train de perdre.
     */
    gameState: GameState | null;
    savedAt: string;
}

/*
 * ─── LECTURE RÉACTIVE ────────────────────────────────────────────────────────────────────
 *
 * La sauvegarde est une source de données EXTÉRIEURE à React, et c'est ainsi qu'il faut la lui
 * présenter : `useSyncExternalStore` s'en charge, là où un `useEffect` qui appellerait
 * `setState` au montage provoquerait un rendu en cascade — et, sous rendu serveur, une
 * divergence entre ce que le serveur écrit et ce que le navigateur trouve.
 *
 * L'instantané est mis en cache : React appelle `getSnapshot` à chaque rendu et exige une
 * référence STABLE tant que rien n'a changé, sous peine de boucler.
 */
let listeners: Array<() => void> = [];
let snapshot: SavedRun | null | undefined;

export function subscribeRun(onChange: () => void): () => void {
    listeners.push(onChange);
    return () => { listeners = listeners.filter(l => l !== onChange); };
}

export function getRunSnapshot(): SavedRun | null {
    if (snapshot === undefined) snapshot = loadRun();
    return snapshot;
}

/** Côté serveur il n'y a pas de stockage : aucune reprise à proposer. */
export function getRunServerSnapshot(): SavedRun | null {
    return null;
}

export function saveRun(run: Omit<SavedRun, 'version' | 'savedAt'>): void {
    try {
        const payload: SavedRun = { ...run, version: FORMAT, savedAt: new Date().toISOString() };
        window.localStorage.setItem(KEY, JSON.stringify(payload));
    } catch {
        // Stockage plein ou navigation privée : une sauvegarde ratée ne doit jamais interrompre
        // une partie en cours. Le joueur perdra sa reprise, pas son ascension.
    }
}

export function loadRun(): SavedRun | null {
    try {
        const raw = window.localStorage.getItem(KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as SavedRun;
        if (parsed.version !== FORMAT) return null;
        if (!Array.isArray(parsed.floors) || parsed.floors.length === 0) return null;
        if (!parsed.carry?.aliveGodIds?.length) return null;

        return parsed;
    } catch {
        return null;
    }
}

export function clearRun(): void {
    try {
        window.localStorage.removeItem(KEY);
    } catch {
        /* Voir saveRun : l'échec du stockage n'est jamais fatal. */
    }
    /*
     * Seule la SUPPRESSION prévient les abonnés.
     *
     * Un enregistrement en cours de partie n'intéresse personne à l'écran — la proposition de
     * reprise ne s'affiche qu'au menu — et notifier à chaque sauvegarde ferait redessiner la
     * page en plein combat pour rien.
     */
    snapshot = null;
    listeners.forEach(l => l());
}
