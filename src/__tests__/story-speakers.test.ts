import { describe, it, expect } from 'vitest';
import * as DIALOGUES from '@/data/story/dialogues';
import { getSpeakerColor } from '@/data/story/speakerColors';
import { getGodById, getCardImage } from '@/data/gods';
import type { DialogueLine } from '@/types/story';

/**
 * Tout personnage qui prend la parole doit être reconnu.
 *
 * Deux replis silencieux ont produit le même défaut à un an d'intervalle : un portrait par
 * défaut, et une couleur de halo par défaut. Dans les deux cas, la donnée venait d'une table
 * tenue à la main, et tout personnage ajouté à l'histoire sans y être inscrit héritait de
 * l'apparence de Zeus — Ulysse, dieu de l'Eau, parlait sous un halo doré.
 *
 * Rien dans l'écriture d'un dialogue ne signale l'oubli : le jeu s'affiche, simplement de
 * travers. D'où ce test, qui balaie TOUS les dialogues plutôt qu'une liste à tenir à jour.
 */

const ALL_SPEAKERS: string[] = [...new Set(
    Object.values(DIALOGUES)
        .filter((v): v is DialogueLine[] => Array.isArray(v))
        .flat()
        .map(line => line.speakerId)
        .filter(Boolean),
)];

describe('les personnages de l’histoire', () => {
    it('prennent bien la parole dans les dialogues', () => {
        // Garde-fou du test lui-même : si l'extraction cassait, tout le reste passerait au vert
        // sans rien vérifier.
        expect(ALL_SPEAKERS.length).toBeGreaterThan(10);
        expect(ALL_SPEAKERS).toContain('ulysses');
    });

    it('ont tous un portrait, sans repli sur celui du narrateur', () => {
        for (const id of ALL_SPEAKERS) {
            if (id === 'narrator') continue;
            expect(getCardImage(id), `portrait manquant pour ${id}`).toBeTruthy();
        }
    });

    it('ont tous une couleur de halo qui leur est propre', () => {
        // Soit une couleur écrite à la main, soit celle de leur élément : jamais le repli.
        const FALLBACK = '#d4a574';
        for (const id of ALL_SPEAKERS) {
            if (id === 'narrator') continue;
            expect(getSpeakerColor(id), `couleur de repli pour ${id}`).not.toBe(FALLBACK);
        }
    });

    it('donne à Ulysse le bleu de son élément, et non l’or de Zeus', () => {
        expect(getGodById('ulysses')?.element).toBe('water');
        expect(getSpeakerColor('ulysses')).toBe('#1E90FF');
        expect(getSpeakerColor('ulysses')).not.toBe(getSpeakerColor('zeus'));
    });
});
