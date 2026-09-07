import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSettings } from '@/lib/settings';
import { haptic, hapticsSupported } from '@/lib/haptics';
import { playSfx, unlockAudio } from '@/lib/sfx';
import { toast, useToastStore } from '@/lib/toast';

/**
 * Couche de retour sensoriel (son, vibration, notifications).
 *
 * Ces modules touchent des API que beaucoup de navigateurs n'implémentent pas (Web Audio sur un
 * onglet muet, Vibration sur iOS Safari, AudioContext avant tout geste utilisateur). La règle
 * qu'ils doivent tenir est simple et vaut d'être verrouillée par des tests : ne JAMAIS lever
 * d'exception, et respecter les préférences du joueur.
 */

const DEFAULTS = useSettings.getState();

beforeEach(() => {
    // Chaque test repart des réglages par défaut : le store est un singleton persisté.
    useSettings.setState({
        musicVolume: DEFAULTS.musicVolume,
        battleVolume: DEFAULTS.battleVolume,
        sfxVolume: 0.5,
        muted: false,
        hapticsEnabled: true,
        vfxQuality: 'high',
        reduceMotion: 'auto',
    });
    useToastStore.setState({ toasts: [] });
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('haptique', () => {
    it("ne fait rien (sans lever) quand l'appareil ne sait pas vibrer", () => {
        // jsdom ne fournit pas navigator.vibrate : c'est le cas d'un iPhone ou d'un ordinateur.
        expect(hapticsSupported()).toBe(false);
        expect(() => haptic('impact')).not.toThrow();
    });

    it('vibre selon le motif demandé quand le support existe', () => {
        // Signature explicite : sans elle, le mock est inféré sans paramètre et l'inspection
        // des arguments (mock.calls[n][0]) ne compile pas.
        const vibrate = vi.fn((_pattern: number | number[]) => true);
        vi.stubGlobal('navigator', { ...navigator, vibrate });

        haptic('tap');
        expect(vibrate).toHaveBeenCalledTimes(1);
        // Un motif composé doit rester un tableau (motif rythmé), pas être aplati en durée simple.
        haptic('heavy');
        expect(Array.isArray(vibrate.mock.calls[1][0])).toBe(true);
    });

    it('reste silencieuse si le joueur a désactivé les vibrations', () => {
        // Signature explicite : sans elle, le mock est inféré sans paramètre et l'inspection
        // des arguments (mock.calls[n][0]) ne compile pas.
        const vibrate = vi.fn((_pattern: number | number[]) => true);
        vi.stubGlobal('navigator', { ...navigator, vibrate });

        useSettings.getState().setHaptics(false);
        haptic('tap');
        expect(vibrate).not.toHaveBeenCalled();
    });

    it('reste silencieuse en mode sourdine, même vibrations activées', () => {
        // Signature explicite : sans elle, le mock est inféré sans paramètre et l'inspection
        // des arguments (mock.calls[n][0]) ne compile pas.
        const vibrate = vi.fn((_pattern: number | number[]) => true);
        vi.stubGlobal('navigator', { ...navigator, vibrate });

        // Un joueur qui coupe le son en réunion ne veut pas non plus que le téléphone vibre.
        useSettings.getState().setMuted(true);
        haptic('impact');
        expect(vibrate).not.toHaveBeenCalled();
    });

    it("n'échoue pas si le navigateur refuse la vibration", () => {
        vi.stubGlobal('navigator', {
            ...navigator,
            vibrate: () => { throw new Error('refusé par la politique du navigateur'); },
        });
        expect(() => haptic('victory')).not.toThrow();
    });
});

describe('effets sonores', () => {
    it("ne lève pas quand Web Audio n'existe pas", () => {
        // jsdom n'implémente pas AudioContext : c'est le pire cas, il doit rester silencieux.
        expect(() => playSfx('damage')).not.toThrow();
        expect(() => unlockAudio()).not.toThrow();
    });

    it("n'ouvre pas de contexte audio quand le volume est à zéro", () => {
        const AudioContextMock = vi.fn();
        vi.stubGlobal('AudioContext', AudioContextMock);

        useSettings.getState().setSfxVolume(0);
        playSfx('critical');

        // Créer un AudioContext pour ne rien jouer gaspillerait une ressource audio du système.
        expect(AudioContextMock).not.toHaveBeenCalled();
    });

    it('reste muet en mode sourdine', () => {
        const AudioContextMock = vi.fn();
        vi.stubGlobal('AudioContext', AudioContextMock);

        useSettings.getState().setMuted(true);
        playSfx('victory');

        expect(AudioContextMock).not.toHaveBeenCalled();
    });
});

describe('toasts', () => {
    it('empile les messages et les retire après leur durée', () => {
        vi.useFakeTimers();

        toast.info('Première', 1000);
        expect(useToastStore.getState().toasts).toHaveLength(1);
        expect(useToastStore.getState().toasts[0].message).toBe('Première');

        vi.advanceTimersByTime(1001);
        expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it("ne garde que les 3 derniers messages pour ne pas masquer l'écran de jeu", () => {
        vi.useFakeTimers();

        for (let i = 1; i <= 5; i++) toast.info(`Message ${i}`, 5000);

        const { toasts } = useToastStore.getState();
        expect(toasts).toHaveLength(3);
        // Ce sont les plus RÉCENTS qui restent : un message ancien n'a plus d'intérêt.
        expect(toasts.map(t => t.message)).toEqual(['Message 3', 'Message 4', 'Message 5']);
    });

    it('permet de fermer un message manuellement', () => {
        toast.error('À fermer');
        const { id } = useToastStore.getState().toasts[0];

        useToastStore.getState().dismiss(id);
        expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('porte le type demandé, qui pilote couleur et icône', () => {
        toast.success('Achat effectué');
        expect(useToastStore.getState().toasts[0].kind).toBe('success');
    });
});

describe('préférences', () => {
    it('borne les volumes entre 0 et 1', () => {
        const s = useSettings.getState();

        s.setSfxVolume(5);
        expect(useSettings.getState().sfxVolume).toBe(1);

        s.setSfxVolume(-3);
        expect(useSettings.getState().sfxVolume).toBe(0);
    });

    it('bascule la sourdine', () => {
        useSettings.getState().toggleMuted();
        expect(useSettings.getState().muted).toBe(true);
        useSettings.getState().toggleMuted();
        expect(useSettings.getState().muted).toBe(false);
    });
});
