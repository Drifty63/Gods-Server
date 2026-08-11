'use client';

import { getGodById } from '@/data/gods';
import { TIER_LABELS, TOTAL_FLOORS, floorReward, type AscensionFloor } from '@/data/ascension';
import type { GodCard } from '@/types/cards';
import styles from '../page.module.css';

/** Écran d'accueil : règles du mode et aperçu de la tour. */
export function AscensionMenu({ bestFloor, onStart }: { bestFloor: number; onStart: () => void }) {
    return (
        <section className={styles.menuSection}>
            <div className={styles.ascensionIcon}>🏔️</div>
            <h2 className={styles.menuTitle}>Mode Ascension</h2>
            <p className={styles.menuDesc}>
                Enchaînez {TOTAL_FLOORS} étages sans reprendre de points de vie. Grimpez le plus haut possible.
            </p>

            <div className={styles.floorsPreview}>
                <div className={styles.floorRange} style={{ borderColor: TIER_LABELS.servant.color }}>
                    <span className={styles.floorIcon}>{TIER_LABELS.servant.icon}</span>
                    <span>Étages 1-5</span>
                    <span className={styles.floorLabel}>Serviteurs</span>
                </div>
                <div className={styles.floorRange} style={{ borderColor: TIER_LABELS.creature.color }}>
                    <span className={styles.floorIcon}>{TIER_LABELS.creature.icon}</span>
                    <span>Étages 6-12</span>
                    <span className={styles.floorLabel}>Créatures</span>
                </div>
                <div className={styles.floorRange} style={{ borderColor: TIER_LABELS.god.color }}>
                    <span className={styles.floorIcon}>{TIER_LABELS.god.icon}</span>
                    <span>Étages 13-15</span>
                    <span className={styles.floorLabel}>4 Dieux</span>
                </div>
            </div>

            <div className={styles.rulesBox}>
                <h3>📜 Règles</h3>
                <ul>
                    <li>❌ Aucun soin entre les combats</li>
                    <li>⚡ L&apos;énergie non dépensée est conservée</li>
                    <li>💀 Un dieu tombé ne revient pas : votre équipe rétrécit</li>
                    <li>🔄 Pas de dégâts de fatigue</li>
                    <li>🎲 La composition de chaque étage est tirée au hasard</li>
                    <li>💧 Ambroisie gagnée à chaque étage franchi</li>
                </ul>
            </div>

            {bestFloor > 0 && (
                <p className={styles.menuDesc}>🏆 Votre record : étage {bestFloor}</p>
            )}

            <button className={styles.startButton} onClick={onStart}>
                ⚔️ Commencer l&apos;Ascension
            </button>
        </section>
    );
}

/** Sélection des 4 dieux de départ. */
export function TeamPicker({ ownedGods, selected, onToggle, onConfirm, onBack }: {
    ownedGods: GodCard[];
    selected: string[];
    onToggle: (id: string) => void;
    onConfirm: () => void;
    onBack: () => void;
}) {
    return (
        <section className={styles.selectSection}>
            <h2>Choisissez votre équipe</h2>
            <p className={styles.selectHint}>Sélectionnez 4 dieux ({selected.length}/4)</p>

            <div className={styles.godsGrid}>
                {ownedGods.map(god => (
                    <div
                        key={god.id}
                        className={`${styles.godCard} ${selected.includes(god.id) ? styles.selected : ''}`}
                        onClick={() => onToggle(god.id)}
                    >
                        <div className={styles.godImage} style={{ backgroundImage: `url(${god.imageUrl})` }} />
                        <span className={styles.godName}>{god.name.split(',')[0]}</span>
                        {selected.includes(god.id) && (
                            <div className={styles.selectedBadge}>{selected.indexOf(god.id) + 1}</div>
                        )}
                    </div>
                ))}
            </div>

            <div className={styles.selectActions}>
                <button className={styles.backBtn} onClick={onBack}>Retour</button>
                <button className={styles.confirmBtn} onClick={onConfirm} disabled={selected.length !== 4}>
                    Commencer ({selected.length}/4)
                </button>
            </div>
        </section>
    );
}

/** Colonne récapitulative de la tour, avec l'étage courant mis en avant. */
function Tower({ floors, currentFloor }: { floors: AscensionFloor[]; currentFloor: number }) {
    return (
        <div className={styles.towerVisual}>
            {[...floors].reverse().map(f => (
                <div
                    key={f.floor}
                    className={`${styles.towerFloor} ${f.floor === currentFloor ? styles.currentFloorMarker : ''} ${f.floor < currentFloor ? styles.clearedFloor : ''}`}
                    style={{ borderLeftColor: TIER_LABELS[f.tier].color }}
                >
                    <span>{f.floor}</span>
                    <span className={styles.floorLabel}>{TIER_LABELS[f.tier].icon}</span>
                    {f.floor === currentFloor && <span className={styles.youAreHere}>← Vous</span>}
                </div>
            ))}
        </div>
    );
}

/**
 * Écran d'entre-deux-étages : état de l'équipe survivante et aperçu des adversaires à venir.
 * C'est ici que le joueur mesure le coût de l'étage qu'il vient de passer.
 */
export function FloorCleared({ floors, clearedFloor, survivorHealth, carriedEnergy, reward, onClimb, onQuit }: {
    floors: AscensionFloor[];
    clearedFloor: number;
    /** PV restants par id de dieu, tels que reportés à l'étage suivant. */
    survivorHealth: Record<string, number>;
    carriedEnergy: number;
    reward: number;
    onClimb: () => void;
    onQuit: () => void;
}) {
    const next = floors[clearedFloor];
    const state = Object.entries(survivorHealth).map(([id, hp]) => {
        const god = getGodById(id);
        return { id, name: god?.name.split(',')[0] ?? id, hp, max: god?.maxHealth ?? 0 };
    });

    return (
        <section className={styles.climbingSection}>
            <div className={styles.floorIndicator}>
                <span className={styles.currentFloor}>Étage {clearedFloor} franchi</span>
                <span className={styles.floorType} style={{ color: TIER_LABELS.servant.color }}>
                    +{floorReward(clearedFloor)} 💧 (total {reward})
                </span>
            </div>

            <div className={styles.rulesBox}>
                <h3>🩹 Votre équipe</h3>
                <ul>
                    {state.map(s => (
                        <li key={s.id}>{s.name} — {s.hp}/{s.max} PV</li>
                    ))}
                    <li>⚡ Énergie conservée : {carriedEnergy}</li>
                </ul>
            </div>

            {next && (
                <div className={styles.rulesBox}>
                    <h3>{TIER_LABELS[next.tier].icon} Étage {next.floor} — {TIER_LABELS[next.tier].label}</h3>
                    <ul>
                        {next.enemyIds.map((id, i) => {
                            const e = getGodById(id);
                            return <li key={`${id}-${i}`}>{e ? `${e.name} (${e.maxHealth} PV)` : id}</li>;
                        })}
                    </ul>
                </div>
            )}

            <Tower floors={floors} currentFloor={clearedFloor + 1} />

            <div className={styles.selectActions}>
                <button className={styles.backBtn} onClick={onQuit}>Abandonner</button>
                <button className={styles.confirmBtn} onClick={onClimb}>Monter à l&apos;étage {clearedFloor + 1}</button>
            </div>
        </section>
    );
}

/** Fin d'ascension : défaite ou sommet atteint. */
export function RunOver({ floorReached, reward, isVictory, onRestart, onQuit }: {
    floorReached: number;
    reward: number;
    isVictory: boolean;
    onRestart: () => void;
    onQuit: () => void;
}) {
    return (
        <section className={styles.menuSection}>
            <div className={styles.ascensionIcon}>{isVictory ? '👑' : '💀'}</div>
            <h2 className={styles.menuTitle}>{isVictory ? 'Sommet atteint !' : 'Ascension terminée'}</h2>
            <p className={styles.menuDesc}>
                {isVictory
                    ? `Vous avez gravi les ${TOTAL_FLOORS} étages de la tour.`
                    : `Vos dieux sont tombés à l'étage ${floorReached}.`}
            </p>
            <div className={styles.rulesBox}>
                <h3>📊 Résultat</h3>
                <ul>
                    <li>🏔️ Étage atteint : {floorReached}</li>
                    <li>💧 Ambroisie gagnée : {reward}</li>
                </ul>
            </div>
            <div className={styles.selectActions}>
                <button className={styles.backBtn} onClick={onQuit}>Retour au menu</button>
                <button className={styles.confirmBtn} onClick={onRestart}>Réessayer</button>
            </div>
        </section>
    );
}
