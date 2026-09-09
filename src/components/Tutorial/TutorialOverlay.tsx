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

function findTargets(spotlight: SpotlightTarget | SpotlightTarget[]): globalThis.Element[] {
    const wanted = Array.isArray(spotlight) ? spotlight : [spotlight];
    return wanted
        .filter((t): t is Exclude<SpotlightTarget, null> => t !== null)
        .map(t => document.querySelector(`[data-tutorial="${t}"]`))
        .filter((el): el is globalThis.Element => el !== null);
}

/**
 * Guidage pas à pas par-dessus le plateau de jeu.
 *
 * Le voile sombre est percé d'un ou plusieurs trous sur les éléments dont on parle : on montre
 * l'interface RÉELLE plutôt que d'en décrire une version idéalisée dans un mur de texte.
 *
 * DEUX rôles distincts, qui étaient auparavant confondus :
 *
 *  - **Assombrir** est purement décoratif. Le voile est un `<svg>` en `pointer-events: none`,
 *    donc il ne peut RIEN bloquer. Auparavant il était fait de quatre bandes cliquables
 *    encerclant l'unique zone éclairée : tout le reste de l'écran était mort, y compris les
 *    dieux ennemis qu'il fallait justement toucher pour lancer un sort. Le didacticiel devenait
 *    alors totalement inerte, sans échappatoire.
 *  - **Bloquer** est explicite, via `step.blocking`, et réservé aux étapes purement
 *    explicatives : sur une étape d'action, le plateau reste intégralement utilisable.
 *
 * Les trous sont mesurés à chaque étape sur le DOM vivant (`data-tutorial`), donc ils suivent
 * automatiquement les éléments si la mise en page change.
 */
export function TutorialOverlay({ step, index, total, onNext, onSkip }: TutorialOverlayProps) {
    const [rects, setRects] = useState<Rect[]>([]);
    const [viewport, setViewport] = useState({ w: 0, h: 0 });

    // `useLayoutEffect` : la mesure doit être faite avant la peinture, sinon les trous
    // apparaissent une frame plus tard, au mauvais endroit.
    useLayoutEffect(() => {
        const measure = () => {
            setViewport({ w: window.innerWidth, h: window.innerHeight });
            setRects(findTargets(step.spotlight).map(el => {
                const r = el.getBoundingClientRect();
                return {
                    top: r.top - HALO,
                    left: r.left - HALO,
                    width: r.width + HALO * 2,
                    height: r.height + HALO * 2,
                };
            }));
        };

        measure();
        // Les cartes de la main bougent (sélection, cartes jouées) et le panneau de détail
        // n'apparaît qu'au moment où une carte est choisie : on remesure tant que l'étape dure.
        const id = setInterval(measure, 300);
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
     * Voile percé : un rectangle plein écran suivi d'un rectangle par zone éclairée, tous dans
     * le même `<path>` en `fill-rule="evenodd"` — les zones intérieures se soustraient donc du
     * contour extérieur. C'est ce qui permet PLUSIEURS trous, là où les quatre bandes de
     * l'implémentation précédente ne pouvaient en dessiner qu'un seul.
     */
    const outer = `M0,0 H${viewport.w} V${viewport.h} H0 Z`;
    const holes = rects.map(r =>
        `M${r.left},${r.top} H${r.left + r.width} V${r.top + r.height} H${r.left} Z`
    ).join(' ');

    // La bulle se place du côté opposé aux zones éclairées, pour ne jamais les masquer. On
    // raisonne sur leur boîte englobante : à l'étape finale, une seule zone de référence plaçait
    // la bulle par-dessus la main que le joueur devait justement utiliser.
    const topMost = rects.length ? Math.min(...rects.map(r => r.top)) : 0;
    const bottomMost = rects.length ? Math.max(...rects.map(r => r.top + r.height)) : 0;
    const spaceAbove = topMost;
    const spaceBelow = viewport.h - bottomMost;
    const bubbleAtBottom = rects.length === 0 ? true : spaceBelow >= spaceAbove;

    return (
        <div className={styles.root} role="dialog" aria-label={step.title}>
            {/* Étape explicative : on gèle le plateau pour que le joueur lise plutôt qu'il
                tâtonne. Sur une étape d'action, ce calque n'existe pas du tout. */}
            {step.blocking && <div className={styles.blocker} />}

            <svg className={styles.shade} width={viewport.w} height={viewport.h} aria-hidden="true">
                <path d={`${outer} ${holes}`} fillRule="evenodd" />
            </svg>

            {rects.map((r, i) => (
                <div key={i} className={styles.halo} style={r} />
            ))}

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
                        {step.waitingLabel ?? 'À vous de jouer'}
                    </p>
                )}
            </div>
        </div>
    );
}

export default TutorialOverlay;
