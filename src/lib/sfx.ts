'use client';

/**
 * Moteur d'effets sonores — sons SYNTHÉTISÉS à la volée (Web Audio), pas de fichiers.
 *
 * Pourquoi synthétiser plutôt que charger des .mp3 : le jeu vise le mobile, où chaque octet
 * compte. Une banque de 15 bruitages pèserait plusieurs Mo à télécharger avant la première
 * partie ; ici tout est généré par oscillateurs + bruit blanc, donc 0 Ko d'assets, 0 latence
 * de chargement, et un rendu identique hors ligne.
 *
 * Le contexte audio est créé PARESSEUSEMENT au premier son : les navigateurs refusent de
 * démarrer l'audio avant un geste utilisateur, et instancier un AudioContext au chargement
 * de la page le laisserait bloqué en état "suspended".
 */

import { useSettings } from './settings';

export type SfxName =
    | 'tap'         // bouton / navigation
    | 'select'      // sélection d'une carte ou d'une cible
    | 'cardPlay'    // la carte quitte la main
    | 'damage'      // dégâts encaissés
    | 'critical'    // dégâts doublés par la faiblesse élémentaire
    | 'heal'        // soin
    | 'shield'      // gain de bouclier
    | 'death'       // mort d'un dieu
    | 'turnStart'   // début de votre tour
    | 'victory'
    | 'defeat'
    | 'reward'      // ambroisie / quête réclamée
    | 'error';      // action refusée

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

function getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (ctx) return ctx;

    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;

    try {
        ctx = new Ctor();
        masterGain = ctx.createGain();
        masterGain.gain.value = currentVolume();
        masterGain.connect(ctx.destination);
    } catch {
        return null;
    }
    return ctx;
}

function currentVolume(): number {
    const { sfxVolume, muted } = useSettings.getState();
    return muted ? 0 : sfxVolume;
}

/** Bruit blanc d'une seconde, réutilisé par tous les sons percussifs (impacts, souffles). */
function getNoise(audio: AudioContext): AudioBuffer {
    if (noiseBuffer) return noiseBuffer;
    const buffer = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    noiseBuffer = buffer;
    return buffer;
}

interface ToneOptions {
    freq: number;
    /** Fréquence d'arrivée pour un glissando (absente = note tenue). */
    endFreq?: number;
    duration: number;
    type?: OscillatorType;
    gain?: number;
    /** Retard avant le déclenchement, pour composer des arpèges. */
    delay?: number;
}

/** Une note d'oscillateur avec enveloppe attaque/chute — la brique de tous les sons mélodiques. */
function tone(audio: AudioContext, out: GainNode, o: ToneOptions): void {
    const start = audio.currentTime + (o.delay ?? 0);
    const osc = audio.createOscillator();
    const env = audio.createGain();

    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.freq, start);
    if (o.endFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.endFreq), start + o.duration);
    }

    const peak = o.gain ?? 0.3;
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(peak, start + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, start + o.duration);

    osc.connect(env);
    env.connect(out);
    osc.start(start);
    osc.stop(start + o.duration + 0.02);
}

interface NoiseOptions {
    duration: number;
    /** Fréquence de coupure du passe-bas : bas = sourd (impact), haut = sifflant (souffle). */
    cutoff: number;
    endCutoff?: number;
    gain?: number;
    delay?: number;
}

/** Souffle de bruit blanc filtré — impacts, whooshs, souffles élémentaires. */
function noise(audio: AudioContext, out: GainNode, o: NoiseOptions): void {
    const start = audio.currentTime + (o.delay ?? 0);
    const src = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const env = audio.createGain();

    src.buffer = getNoise(audio);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(o.cutoff, start);
    if (o.endCutoff !== undefined) {
        filter.frequency.exponentialRampToValueAtTime(Math.max(20, o.endCutoff), start + o.duration);
    }

    const peak = o.gain ?? 0.25;
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(peak, start + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, start + o.duration);

    src.connect(filter);
    filter.connect(env);
    env.connect(out);
    src.start(start);
    src.stop(start + o.duration + 0.02);
}

type Recipe = (audio: AudioContext, out: GainNode) => void;

const RECIPES: Record<SfxName, Recipe> = {
    // — Interface : très courts, jamais fatigants même répétés des centaines de fois.
    tap: (a, g) => tone(a, g, { freq: 660, endFreq: 880, duration: 0.06, type: 'triangle', gain: 0.12 }),
    select: (a, g) => {
        tone(a, g, { freq: 520, endFreq: 780, duration: 0.09, type: 'triangle', gain: 0.16 });
        tone(a, g, { freq: 1040, duration: 0.05, type: 'sine', gain: 0.06, delay: 0.02 });
    },
    error: (a, g) => {
        tone(a, g, { freq: 180, endFreq: 110, duration: 0.18, type: 'sawtooth', gain: 0.14 });
        tone(a, g, { freq: 90, duration: 0.2, type: 'square', gain: 0.06 });
    },

    // — Combat.
    cardPlay: (a, g) => {
        noise(a, g, { duration: 0.22, cutoff: 3200, endCutoff: 500, gain: 0.16 });
        tone(a, g, { freq: 300, endFreq: 620, duration: 0.18, type: 'triangle', gain: 0.12 });
    },
    damage: (a, g) => {
        noise(a, g, { duration: 0.16, cutoff: 1400, endCutoff: 180, gain: 0.3 });
        tone(a, g, { freq: 150, endFreq: 60, duration: 0.18, type: 'square', gain: 0.16 });
    },
    // Le coup critique doit s'entendre comme "plus gros", pas juste "plus fort" : on empile un
    // impact plus grave, un éclat métallique aigu et une traîne.
    critical: (a, g) => {
        noise(a, g, { duration: 0.28, cutoff: 2600, endCutoff: 140, gain: 0.34 });
        tone(a, g, { freq: 120, endFreq: 45, duration: 0.3, type: 'square', gain: 0.2 });
        tone(a, g, { freq: 1600, endFreq: 700, duration: 0.22, type: 'sawtooth', gain: 0.1, delay: 0.02 });
    },
    heal: (a, g) => {
        tone(a, g, { freq: 523, duration: 0.3, type: 'sine', gain: 0.14 });
        tone(a, g, { freq: 659, duration: 0.3, type: 'sine', gain: 0.12, delay: 0.06 });
        tone(a, g, { freq: 784, duration: 0.36, type: 'sine', gain: 0.12, delay: 0.12 });
    },
    shield: (a, g) => {
        tone(a, g, { freq: 900, endFreq: 1500, duration: 0.16, type: 'triangle', gain: 0.16 });
        noise(a, g, { duration: 0.1, cutoff: 6000, endCutoff: 2000, gain: 0.1 });
    },
    death: (a, g) => {
        tone(a, g, { freq: 220, endFreq: 55, duration: 0.7, type: 'sawtooth', gain: 0.16 });
        tone(a, g, { freq: 110, endFreq: 40, duration: 0.8, type: 'sine', gain: 0.14 });
        noise(a, g, { duration: 0.5, cutoff: 800, endCutoff: 100, gain: 0.12 });
    },
    turnStart: (a, g) => {
        tone(a, g, { freq: 392, duration: 0.5, type: 'sine', gain: 0.12 });
        tone(a, g, { freq: 587, duration: 0.55, type: 'sine', gain: 0.1, delay: 0.05 });
    },

    // — Fins de partie : arpèges majeurs (victoire) / mineurs descendants (défaite).
    victory: (a, g) => {
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => tone(a, g, { freq: f, duration: 0.5, type: 'triangle', gain: 0.16, delay: i * 0.11 }));
        tone(a, g, { freq: 1568, duration: 0.7, type: 'sine', gain: 0.12, delay: 0.45 });
    },
    defeat: (a, g) => {
        const notes = [440, 370, 294, 220];
        notes.forEach((f, i) => tone(a, g, { freq: f, duration: 0.55, type: 'sine', gain: 0.14, delay: i * 0.14 }));
    },
    reward: (a, g) => {
        const notes = [784, 988, 1319];
        notes.forEach((f, i) => tone(a, g, { freq: f, duration: 0.3, type: 'triangle', gain: 0.14, delay: i * 0.07 }));
    },
};

/**
 * Joue un effet sonore. Silencieux (sans erreur) si l'audio n'est pas disponible, si le joueur
 * a coupé le son, ou si le navigateur n'a pas encore débloqué l'audio.
 */
export function playSfx(name: SfxName): void {
    const volume = currentVolume();
    if (volume <= 0) return;

    const audio = getCtx();
    if (!audio || !masterGain) return;

    // Le contexte peut avoir été suspendu (onglet en arrière-plan, politique d'autoplay) :
    // on tente de le relancer, et on joue quand même — resume() est asynchrone mais les sons
    // programmés restent valides.
    if (audio.state === 'suspended') void audio.resume().catch(() => { });

    masterGain.gain.value = volume;

    try {
        RECIPES[name](audio, masterGain);
    } catch {
        // Un son raté ne doit jamais interrompre une partie.
    }
}

/**
 * Débloque l'audio au premier geste utilisateur. À appeler depuis un gestionnaire d'événement
 * réel (clic/tap) : c'est la seule fenêtre où les navigateurs autorisent la création/reprise
 * d'un AudioContext.
 */
export function unlockAudio(): void {
    const audio = getCtx();
    if (audio && audio.state === 'suspended') void audio.resume().catch(() => { });
}
