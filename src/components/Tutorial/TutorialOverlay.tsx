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
    /** Étape `dismissible` : referme entièrement le guidage sans quitter le didacticiel. */
    onDismiss?: () => void;
}

interface Rect { top: number; left: number; width: number; height: number }

/** Marge autour de l'élément éclairé, pour ne pas le coller au bord du trou. */
const HALO = 8;

/** Hauteur approximative de la bulle, pour la centrer avant meme de l'avoir mesuree. */
const BUBBLE_ESTIMATED_H = 210;

/** Identifiant du masque SVG. Une seule instance du guidage existe a la fois. */
const MASK_ID = 'tutorial-spotlight-mask';

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
export function TutorialOverlay({ step, index, total, onNext, onSkip, onDismiss }: TutorialOverlayProps) {
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

    // Placement de la bulle.
    //
    // Par défaut : du côté où il reste le plus de place autour de la boîte englobante des zones
    // éclairées. Mais quand ces zones couvrent à la fois le haut et le bas de l'écran, ce calcul
    // n'a plus d'issue — à l'étape « à vous de jouer », la main descend à 26 px du bas, donc la
    // bulle était FATALEMENT renvoyée en haut, sur la rangée ennemie qu'il faut toucher. D'où
    // `bubbleAnchor: 'middle'`, qui la loge dans l'intervalle libre entre les deux.
    const topMost = rects.length ? Math.min(...rects.map(r => r.top)) : 0;
    const bottomMost = rects.length ? Math.max(...rects.map(r => r.top + r.height)) : 0;
    const spaceAbove = topMost;
    const spaceBelow = viewport.h - bottomMost;

    const anchor = step.bubbleAnchor
        ?? (rects.length === 0 || spaceBelow >= spaceAbove ? 'bottom' : 'top');

    // Intervalle libre : sous la zone la plus HAUTE, au-dessus de la zone la plus BASSE.
    const gapTop = rects.length ? Math.min(...rects.map(r => r.top + r.height)) : 0;
    const gapBottom = rects.length ? Math.max(...rects.map(r => r.top)) : viewport.h;
    const middleTop = Math.max(8, Math.round((gapTop + gapBottom) / 2 - BUBBLE_ESTIMATED_H / 2));

    return (
        <div className={styles.root} role="dialog" aria-label={step.title}>
            {/* Étape explicative : on gèle le plateau pour que le joueur lise plutôt qu'il
                tâtonne. Sur une étape d'action, ce calque n'existe pas du tout. */}
            {step.blocking && <div className={styles.blocker} />}

            {/*
              * Voile percé par un MASQUE, et non par un tracé en `fill-rule="evenodd"`.
              *
              * La parité paire-impaire faisait qu'une zone percée DEUX fois redevenait pleine :
              * à l'étape « à vous de jouer », le rectangle du bouton d'action est entièrement
              * contenu dans celui de la main (le panneau de carte recouvre la zone de la main),
              * donc le bouton était ré-assombri exactement là où le halo l'entourait — il avait
              * l'air désactivé alors qu'il était parfaitement cliquable.
              *
              * Un masque fait une UNION : deux rectangles noirs qui se chevauchent restent noirs.
              */}
            <svg className={styles.shade} width={viewport.w} height={viewport.h} aria-hidden="true">
                <defs>
                    <mask id={MASK_ID} maskUnits="userSpaceOnUse">
                        <rect x="0" y="0" width={viewport.w} height={viewport.h} fill="white" />
                        {rects.map((r, i) => (
                            <rect
                                key={i}
                                x={r.left} y={r.top}
                                width={r.width} height={r.height}
                                rx="12"
                                fill="black"
                            />
                        ))}
                    </mask>
                </defs>
                <rect
                    x="0" y="0"
                    width={viewport.w} height={viewport.h}
                    className={styles.shadeFill}
                    mask={`url(#${MASK_ID})`}
                />
            </svg>

            {rects.map((r, i) => (
                <div key={i} className={styles.halo} style={r} />
            ))}

            <div
                className={`${styles.bubble} ${anchor === 'bottom' ? styles.bubbleBottom
                    : anchor === 'top' ? styles.bubbleTop : styles.bubbleMiddle}`}
                style={anchor === 'middle' ? { top: `${middleTop}px` } : undefined}
            >
                <div className={styles.progress}>
                    <span className={styles.progressText}>Étape {index + 1} / {total}</span>
                    <button className={styles.skip} onClick={onSkip}>Passer</button>
                </div>

                <h2 className={styles.title}>{step.title}</h2>
                <p className={styles.text}>{step.text}</p>

                {step.dismissible && onDismiss ? (
                    <button className={styles.next} onClick={onDismiss}>Compris !</button>
                ) : onNext ? (
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
