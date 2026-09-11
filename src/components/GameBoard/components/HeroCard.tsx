import React, { useEffect, useRef, useState } from 'react';
import { GodState, Element } from '@/types/cards';
import { getStatusIcon } from '@/data/statusIcons';
import { ELEMENT_COLORS, ELEMENT_SYMBOLS } from '@/game-engine/ElementSystem';
import { playSfx } from '@/lib/sfx';
import { haptic } from '@/lib/haptics';
import styles from '../GameBoard.module.css';

/** Ce qu'un impact remonte au plateau, pour qu'il puisse secouer l'écran à la hauteur du coup. */
export interface ImpactReport {
    kind: 'damage' | 'heal';
    amount: number;
    isCritical: boolean;
    killed: boolean;
}

interface HeroCardProps {
    god: GodState;
    isTargeted: boolean;
    /** Le dieu qui lance le sort actuellement sélectionné/en cours de jeu (par le joueur ou
     *  l'adversaire) : mis en avant avec une bordure dorée distincte de la cible (rouge), pour
     *  qu'on comprenne d'un coup d'œil qui lance quoi. */
    isCaster?: boolean;
    /** Identifiant stable (côté-préfixé, ex "player-zeus") utilisé pour retrouver cet élément
     *  DOM via document.querySelector lors de l'animation de vol de carte (voir CardFlight). */
    godKey?: string;
    /**
     * Élément du sort en train de se résoudre, fourni par le plateau. Sert à teinter l'impact
     * aux couleurs du sort ET à détecter le coup critique : la faiblesse élémentaire double les
     * dégâts (règle centrale du jeu) sans que rien, jusqu'ici, ne le montre à l'écran.
     */
    incomingElement?: Element | null;
    /** Notifie le plateau d'un impact, pour la secousse d'écran et les effets globaux. */
    onImpact?: (report: ImpactReport) => void;
    onClick: () => void;
}

interface Impact {
    key: number;
    kind: 'damage' | 'heal';
    amount: number;
    isCritical: boolean;
    element: Element | null;
}

export const HeroCard: React.FC<HeroCardProps> = ({
    god,
    isTargeted,
    isCaster,
    godKey,
    incomingElement,
    onImpact,
    onClick,
}) => {
    const healthPercent = Math.max(0, (god.currentHealth / god.card.maxHealth) * 100);

    // Effet visuel temporaire (flash coloré + nombre flottant) quand le dieu prend des dégâts
    // ou est soigné, pour que l'effet d'une carte se voie immédiatement sur la cible.
    const [impact, setImpact] = useState<Impact | null>(null);
    const prevHealthRef = useRef(god.currentHealth);
    const prevDeadRef = useRef(god.isDead);
    const prevShieldRef = useRef(0);
    const impactKeyRef = useRef(0);

    // Les valeurs les plus fraîches, lues dans l'effet d'impact sans le faire redéclencher :
    // sans ces refs, un simple changement d'`incomingElement` rejouerait un impact déjà consommé.
    //
    // La synchronisation se fait dans un effet DÉCLARÉ AVANT celui qui les lit : React exécute
    // les effets dans l'ordre de déclaration au sein d'un même commit, donc les refs sont à jour
    // quand l'impact les consulte. (Les écrire pendant le rendu serait plus court mais interdit :
    // cela casse le rendu concurrent.)
    const elementRef = useRef(incomingElement);
    const onImpactRef = useRef(onImpact);
    useEffect(() => {
        elementRef.current = incomingElement;
        onImpactRef.current = onImpact;
    });

    useEffect(() => {
        const prev = prevHealthRef.current;
        const delta = god.currentHealth - prev;
        prevHealthRef.current = god.currentHealth;

        if (delta === 0) return;

        const kind: 'damage' | 'heal' = delta < 0 ? 'damage' : 'heal';
        const amount = Math.abs(delta);
        const element = elementRef.current ?? null;

        // Coup critique = le sort frappe la faiblesse (innée OU temporaire, posée par Artémis).
        // C'est exactement la condition du moteur (calculateDamageWithDualWeakness).
        const isCritical =
            kind === 'damage' &&
            !!element &&
            (element === god.card.weakness || element === god.temporaryWeakness);

        impactKeyRef.current += 1;
        setImpact({ key: impactKeyRef.current, kind, amount, isCritical, element });

        // Retour sonore et haptique : jusqu'ici le combat était entièrement muet en dehors de
        // la musique de fond, ce qui rendait les échanges de coups étrangement inertes.
        if (kind === 'heal') {
            playSfx('heal');
        } else if (isCritical) {
            playSfx('critical');
            haptic('heavy');
        } else {
            playSfx('damage');
            haptic('impact');
        }

        onImpactRef.current?.({ kind, amount, isCritical, killed: god.currentHealth <= 0 });

        const timer = setTimeout(() => setImpact(null), isCritical ? 900 : 650);
        return () => clearTimeout(timer);
    }, [god.currentHealth, god.card.weakness, god.temporaryWeakness]);

    // Le bouclier ne fait varier AUCUN point de vie : il échappait donc complètement à l'effet
    // d'impact ci-dessus, et son son restait le seul du jeu à n'être jamais joué. On surveille
    // la valeur du statut, comme on surveille la mort.
    useEffect(() => {
        const shield = god.statusEffects.find(s => s.type === 'shield')?.stacks ?? 0;
        if (shield > prevShieldRef.current) {
            playSfx('shield');
            haptic('tap');
        }
        prevShieldRef.current = shield;
    }, [god.statusEffects]);

    // La mort est un événement à part : elle peut survenir sans variation de PV visible
    // (fatigue, poison résolu côté moteur) et mérite son propre son grave.
    useEffect(() => {
        if (god.isDead && !prevDeadRef.current) {
            playSfx('death');
            haptic('heavy');
        }
        prevDeadRef.current = god.isDead;
    }, [god.isDead]);

    // Contour coloré par élément (comme les autres jeux de cartes) : la couleur d'identité du
    // dieu (son propre élément), pas sa faiblesse — cohérent avec ELEMENT_COLORS déjà utilisé en
    // sélection d'équipe. Les états d'interaction (ciblé/lanceur/mort) restent prioritaires,
    // portés par leurs propres classes CSS plus spécifiques.
    const elementColor = ELEMENT_COLORS[god.card.element].primary;
    // Teinte de l'impact : celle du SORT reçu, qui n'est pas celle du dieu touché.
    const impactColor = impact?.element ? ELEMENT_COLORS[impact.element].primary : null;

    return (
        <div
            className={`${styles.heroCard} ${god.isDead ? styles.dead : ''} ${isTargeted ? styles.targeted : ''} ${isCaster ? styles.caster : ''} ${impact?.kind === 'damage' ? styles.shaking : ''}`}
            data-god-key={godKey}
            style={{ '--element-color': elementColor } as React.CSSProperties}
            onClick={onClick}
        >
            <div className={styles.elementBadge}>
                {ELEMENT_SYMBOLS[god.card.weakness]}
            </div>

            <div className={styles.statusContainer}>
                {god.statusEffects.map((status, idx) => (
                    <div key={idx} className={styles.statusBadge}>
                        {getStatusIcon(status.type)}
                        {status.stacks > 1 && <span className={styles.stacksCount}>{status.stacks}</span>}
                    </div>
                ))}
            </div>

            <img
                src={god.card.imageUrl}
                alt={god.card.name}
                className={styles.heroImage}
                loading="lazy"
                decoding="async"
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />

            {impact && (
                <div
                    key={impact.key}
                    className={`${styles.impactOverlay} ${impact.kind === 'damage' ? styles.impactDamage : styles.impactHeal} ${impact.isCritical ? styles.impactCritical : ''}`}
                    // Teinte l'éclat aux couleurs du sort reçu (foudre jaune, eau bleue…) plutôt
                    // qu'un rouge générique identique pour tous les éléments.
                    style={impactColor ? ({ '--impact-color': impactColor } as React.CSSProperties) : undefined}
                >
                    {impact.isCritical && (
                        <span className={styles.criticalLabel}>
                            {impact.element ? ELEMENT_SYMBOLS[impact.element] : ''} FAIBLESSE ×2
                        </span>
                    )}
                    <span className={styles.impactNumber}>
                        {impact.kind === 'damage' ? '-' : '+'}{impact.amount}
                    </span>
                </div>
            )}

            {/* Réticule de ciblage : rend explicite qu'un dieu est déjà retenu comme cible,
             *  notamment en pleine sélection multi-cibles (en attente d'une 2e cible par ex.),
             *  où la seule bordure rouge de .targeted pouvait passer inaperçue. */}
            {isTargeted && (
                <div className={styles.targetMarker}>🎯</div>
            )}

            <div className={styles.heroInfo}>
                <div className={styles.heroName}>{god.card.name}</div>
                <div className={styles.healthTrack}>
                    <div className={styles.healthFill} style={{ width: `${healthPercent}%` }} />
                    <span className={styles.healthText}>{god.currentHealth}/{god.card.maxHealth}</span>
                </div>
            </div>
        </div>
    );
};
