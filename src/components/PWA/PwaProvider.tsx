'use client';

import { useCallback, useEffect, useState } from 'react';
import { playSfx, unlockAudio } from '@/lib/sfx';
import { haptic } from '@/lib/haptics';
import { useSettings } from '@/lib/settings';
import styles from './PwaProvider.module.css';

/**
 * Événement Chromium non standard (absent de lib.dom) déclenché quand le navigateur juge le
 * site installable. On le capture pour proposer l'installation AU BON MOMENT plutôt que de
 * laisser le navigateur afficher sa mini-barre générique.
 */
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Ne pas reproposer l'installation avant ce délai après un refus. */
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const SNOOZE_KEY = 'gods-install-snoozed-at';
/** Laisse le joueur arriver sur la page avant de l'interrompre. */
const PROMPT_DELAY_MS = 20000;

/**
 * Infrastructure applicative : enregistrement du service worker, invitation à installer l'app,
 * déblocage de l'audio au premier geste, et verrouillage de l'écran pendant les combats.
 *
 * Rendu une seule fois depuis le layout racine ; n'affiche rien tant qu'il n'y a rien à proposer.
 */
export function PwaProvider() {
    const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const reduceMotion = useSettings((s) => s.reduceMotion);

    // 0. Réduction des animations choisie DANS le jeu : reportée sur <html> pour que la règle
    //    CSS globale s'applique partout, y compris aux composants qui ne lisent pas le store.
    //    'auto' laisse la main à la media query système, donc on retire l'attribut.
    useEffect(() => {
        const root = document.documentElement;
        if (reduceMotion === 'auto') root.removeAttribute('data-reduce-motion');
        else root.setAttribute('data-reduce-motion', String(reduceMotion === 'on'));
    }, [reduceMotion]);

    // 1. Service worker — uniquement en production : en développement, un worker qui met en
    //    cache les assets masque les modifications qu'on vient d'écrire.
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') return;
        if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

        const register = () => {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // Un enregistrement raté (mode privé, HTTP non sécurisé…) dégrade seulement le
                // hors-ligne : le jeu reste parfaitement fonctionnel.
            });
        };

        // Après le chargement complet, pour ne pas disputer la bande passante aux assets du jeu.
        if (document.readyState === 'complete') register();
        else window.addEventListener('load', register, { once: true });
    }, []);

    // 2. Déblocage de l'audio : les navigateurs exigent un geste utilisateur réel avant
    //    d'autoriser un AudioContext. On saisit le tout premier, quel qu'il soit.
    useEffect(() => {
        const unlock = () => unlockAudio();
        window.addEventListener('pointerdown', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
        return () => {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };
    }, []);

    // 2bis. Couche sonore de l'interface : un clic sur n'importe quel bouton ou lien émet un
    //       retour discret. Un écouteur global délégué plutôt que d'instrumenter les ~200
    //       boutons du jeu un par un — et un composant qui veut son propre son (ou le silence)
    //       se déclare simplement `data-no-sound`.
    useEffect(() => {
        const onPointerDown = (e: PointerEvent) => {
            const target = e.target as HTMLElement | null;
            const interactive = target?.closest('button, a[href], [role="button"]');
            if (!interactive) return;
            if (interactive.closest('[data-no-sound]')) return;
            if (interactive.hasAttribute('disabled')) return;

            playSfx('tap');
            haptic('tap');
        };

        // Phase de capture : le son part même si le gestionnaire du composant arrête la
        // propagation de l'événement (fréquent dans les modales du plateau).
        document.addEventListener('pointerdown', onPointerDown, { capture: true });
        return () => document.removeEventListener('pointerdown', onPointerDown, { capture: true });
    }, []);

    // 3. Invitation à installer, différée et espaçable.
    useEffect(() => {
        const onBeforeInstall = (e: Event) => {
            e.preventDefault(); // empêche la bannière générique du navigateur
            setInstallEvent(e as BeforeInstallPromptEvent);

            const snoozedAt = Number(window.localStorage.getItem(SNOOZE_KEY) ?? 0);
            if (Date.now() - snoozedAt < SNOOZE_MS) return;

            window.setTimeout(() => setShowBanner(true), PROMPT_DELAY_MS);
        };

        const onInstalled = () => {
            setShowBanner(false);
            setInstallEvent(null);
        };

        window.addEventListener('beforeinstallprompt', onBeforeInstall);
        window.addEventListener('appinstalled', onInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstall);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const install = useCallback(async () => {
        if (!installEvent) return;
        haptic('tap');
        playSfx('tap');
        setShowBanner(false);
        await installEvent.prompt();
        const { outcome } = await installEvent.userChoice;
        if (outcome === 'dismissed') {
            window.localStorage.setItem(SNOOZE_KEY, String(Date.now()));
        }
        setInstallEvent(null);
    }, [installEvent]);

    const dismiss = useCallback(() => {
        haptic('tap');
        window.localStorage.setItem(SNOOZE_KEY, String(Date.now()));
        setShowBanner(false);
    }, []);

    if (!showBanner || !installEvent) return null;

    return (
        <div className={styles.banner} role="dialog" aria-label="Installer GODS">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="" className={styles.icon} width={44} height={44} />
            <div className={styles.text}>
                <strong className={styles.title}>Installer GODS</strong>
                <span className={styles.subtitle}>Plein écran, lancement instantané, jouable hors ligne.</span>
            </div>
            <div className={styles.actions}>
                <button type="button" className={styles.later} onClick={dismiss}>Plus tard</button>
                <button type="button" className={styles.install} onClick={install}>Installer</button>
            </div>
        </div>
    );
}

export default PwaProvider;
