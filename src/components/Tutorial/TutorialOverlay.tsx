'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import type { SpotlightTarget, TutorialStep } from '@/data/tutorial';
import styles from './TutorialOverlay.module.css';

interface TutorialOverlayProps {
    step: TutorialStep;
    index: number;
    total: number;
    /** Disponible seulement sur les étapes explicatives ; les étapes d'action attendent le geste. */
    onNext?: () => void;
    onSkip: () => void;
}

interface Rect { top: number; left: number; width: number; height: number }

/** Marge autour de l'élément éclairé, pour ne pas le coller au bord du trou. */
const HALO = 8;

function findTarget(target: SpotlightTarget): Element | null {
    if (!target) return null;
    return document.querySelector(`[data-tutorial="${target}"]`);
}

/**
 * Guidage pas à pas par-dessus le plateau de jeu.
 *
 * Le voile sombre est percé d'un trou sur l'élément dont on parle : on montre l'interface RÉELLE
 * plutôt que d'en décrire une version idéalisée dans un mur de texte. C'est ce qui manquait —
 * le seul accueil des nouveaux joueurs était jusqu'ici la page des règles, affichée une fois.
 *
 * Le trou est mesuré à chaque étape sur le DOM vivant (`data-tutorial`), donc il suit
 * automatiquement les éléments si la mise en page change.
 */
export function TutorialOverlay({ step, index, total, onNext, onSkip }: TutorialOverlayProps) {
    const [rect, setRect] = useState<Rect | null>(null);

    // `useLayoutEffect` : la mesure doit être faite avant la peinture, sinon le trou apparaît
    // une frame plus tard, au mauvais endroit.
    useLayoutEffect(() => {
        const measure = () => {
            const el = findTarget(step.spotlight);
            if (!el) { setRect(null); return; }
            const r = el.getBoundingClientRect();
            setRect({
                top: r.top - HALO,
                left: r.left - HALO,
                width: r.width + HALO * 2,
                height: r.height + HALO * 2,
            });
        };

        measure();
        // Les cartes de la main bougent (survol, cartes jouées) : on remesure tant que l'étape dure.
        const id = setInterval(measure, 400);
        window.addEventListener('resize', measure);
        return () => { clearInterval(id); window.removeEventListener('resize', measure); };
    }, [step.spotlight, step.id]);

    // Échap saute le didacticiel : un joueur qui connaît déjà le jeu ne doit pas être retenu.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onSkip(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onSkip]);

    /**
     * Le voile est composé de QUATRE bandes entourant la zone éclairée, plutôt qu'un seul bloc
     * avec un trou : le trou reste ainsi parfaitement cliquable, ce qu'un `clip-path` ou un
     * `box-shadow` géant ne permettrait pas — l'élément serait couvert par une surface
     * transparente mais bien présente, qui avalerait les clics.
     */
    const shades = rect ? [
        { top: 0, left: 0, width: '100%', height: `${Math.max(0, rect.top)}px` },
        { top: `${rect.top + rect.height}px`, left: 0, width: '100%', bottom: 0 },
        { top: `${rect.top}px`, left: 0, width: `${Math.max(0, rect.left)}px`, height: `${rect.height}px` },
        { top: `${rect.top}px`, left: `${rect.left + rect.width}px`, right: 0, height: `${rect.height}px` },
    ] : [{ top: 0, left: 0, width: '100%', height: '100%' }];

    // La bulle se place du côté opposé à l'élément éclairé, pour ne jamais le masquer.
    const bubbleAtBottom = !rect || rect.top < window.innerHeight / 2;

    return (
        <div className={styles.root} role="dialog" aria-label={step.title}>
            {shades.map((s, i) => (
                <div key={i} className={styles.shade} style={s as React.CSSProperties} />
            ))}

            {rect && <div className={styles.halo} style={{ ...rect, top: rect.top, left: rect.left }} />}

            <div className={`${styles.bubble} ${bubbleAtBottom ? styles.bubbleBottom : styles.bubbleTop}`}>
                <div className={styles.progress}>
                    <span className={styles.progressText}>Étape {index + 1} / {total}</span>
                    <button className={styles.skip} onClick={onSkip}>Passer</button>
                </div>

                <h2 className={styles.title}>{step.title}</h2>
                <p className={styles.text}>{step.text}</p>

                {onNext ? (
                    <button className={styles.next} onClick={onNext}>Suivant</button>
                ) : (
                    // Étape d'action : aucun bouton, sinon le joueur cliquerait « Suivant » au
                    // lieu de faire le geste qu'on lui demande d'apprendre.
                    <p className={styles.waiting}>
                        <span className={styles.waitingDot} aria-hidden="true" />
                        À vous de jouer
                    </p>
                )}
            </div>
        </div>
    );
}

export default TutorialOverlay;
