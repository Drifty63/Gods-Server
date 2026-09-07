'use client';

import { useToastStore } from '@/lib/toast';
import styles from './Toaster.module.css';

const ICONS = {
    info: 'ℹ️',
    success: '✓',
    error: '⚠️',
} as const;

/**
 * Pile de notifications, rendue une seule fois au niveau du layout.
 *
 * Positionnée en haut : en bas, elle recouvrirait la main du joueur en combat, et sur mobile
 * elle tomberait sous la barre de gestes du système.
 */
export function Toaster() {
    const toasts = useToastStore((s) => s.toasts);
    const dismiss = useToastStore((s) => s.dismiss);

    if (toasts.length === 0) return null;

    return (
        <div className={styles.container} role="status" aria-live="polite">
            {toasts.map((t) => (
                <button
                    key={t.id}
                    type="button"
                    className={`${styles.toast} ${styles[t.kind]}`}
                    onClick={() => dismiss(t.id)}
                    aria-label={`Fermer : ${t.message}`}
                >
                    <span className={styles.icon} aria-hidden="true">{ICONS[t.kind]}</span>
                    <span className={styles.message}>{t.message}</span>
                    {/* Barre de progression : rend visible le temps restant avant disparition. */}
                    <span
                        className={styles.progress}
                        style={{ animationDuration: `${t.duration}ms` }}
                        aria-hidden="true"
                    />
                </button>
            ))}
        </div>
    );
}

export default Toaster;
