'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { getVisibleGods, getReleasedUnits, ownsCard, getOwnerGodId, getGodById } from '@/data/gods';
import { getSpellsByGodId } from '@/data/spells';
import { getReadableSpellDescription } from '@/data/spellDescriptions';
import { getCardTypeMeta } from '@/data/cardTypeStyles';
import { ELEMENT_SYMBOLS, ELEMENT_NAMES, ELEMENT_COLORS } from '@/game-engine/ElementSystem';
import type { GodCard, SpellCard } from '@/types/cards';
import { useAuth } from '@/contexts/AuthContext';
import { RequireAuth } from '@/components/Auth/RequireAuth';
import { haptic } from '@/lib/haptics';

/** Familles de la collection, dans l'ordre d'affichage. */
type Family = 'god' | 'creature' | 'servant';

const FAMILY_META: Record<Family, { label: string; plural: string; icon: string }> = {
    god: { label: 'Dieu', plural: 'Dieux', icon: '⚡' },
    creature: { label: 'Créature', plural: 'Créatures', icon: '🐉' },
    servant: { label: 'Serviteur', plural: 'Serviteurs', icon: '🛡️' },
};

export default function CollectionPage() {
    return (
        <RequireAuth>
            <CollectionContent />
        </RequireAuth>
    );
}

function CollectionContent() {
    const { profile } = useAuth();

    const godsOwned = useMemo(() => profile?.gods_owned ?? [], [profile?.gods_owned]);
    const isCreator = profile?.is_creator || false;

    // ── Collection ───────────────────────────────────────────────
    const [family, setFamily] = useState<Family | 'all'>('all');
    const [inspected, setInspected] = useState<GodCard | null>(null);
    const [zoomedSpell, setZoomedSpell] = useState<SpellCard | null>(null);

    const catalogue = useMemo(() => {
        const { creatures, servants } = getReleasedUnits();
        return {
            god: getVisibleGods(isCreator),
            creature: creatures,
            servant: servants,
        };
    }, [isCreator]);

    /**
     * Une créature ou un serviteur n'a pas de prix : il est acquis avec le dieu auquel il est
     * rattaché (voir `ownsCard`). Acheter Arès débloque ses Soldats et le Dragon de Thèbes.
     */
    const owns = useCallback(
        (card: GodCard) => ownsCard(card, godsOwned, isCreator),
        [godsOwned, isCreator],
    );

    const shownFamilies: Family[] = family === 'all' ? ['god', 'creature', 'servant'] : [family];
    const allCards = [...catalogue.god, ...catalogue.creature, ...catalogue.servant];
    const ownedCount = allCards.filter(owns).length;

    return (
        <main className={styles.main}>
            <header className={styles.pageHeader}>
                <Link href="/" className={styles.backButton} aria-label="Retour à l'accueil">
                    <span aria-hidden="true">‹</span>
                </Link>
                <h1 className={styles.title}>Collection</h1>
                <span className={styles.headerCount}>{ownedCount}/{allCards.length}</span>
            </header>

            <div className={styles.filters}>
                <button
                    className={`${styles.filterChip} ${family === 'all' ? styles.filterActive : ''}`}
                    onClick={() => setFamily('all')}
                >
                    Tout
                </button>
                {(['god', 'creature', 'servant'] as Family[]).map(f => (
                    <button
                        key={f}
                        className={`${styles.filterChip} ${family === f ? styles.filterActive : ''}`}
                        onClick={() => setFamily(f)}
                    >
                        {FAMILY_META[f].icon} {FAMILY_META[f].plural}
                        <span className={styles.filterCount}>{catalogue[f].length}</span>
                    </button>
                ))}
            </div>

            {shownFamilies.map(f => (
                <section key={f} className={styles.familySection}>
                    <h2 className={styles.familyTitle}>
                        <span aria-hidden="true">{FAMILY_META[f].icon}</span>
                        {FAMILY_META[f].plural}
                        <span className={styles.familyCount}>
                            {catalogue[f].filter(owns).length}/{catalogue[f].length}
                        </span>
                    </h2>

                    <div className={styles.grid}>
                        {catalogue[f].map(card => (
                            <CollectionTile
                                key={card.id}
                                card={card}
                                owned={owns(card)}
                                onInspect={() => { haptic('select'); setInspected(card); }}
                            />
                        ))}
                    </div>
                </section>
            ))}

            {inspected && (
                <InspectModal
                    card={inspected}
                    owned={owns(inspected)}
                    onClose={() => { setInspected(null); setZoomedSpell(null); }}
                    onZoomSpell={setZoomedSpell}
                />
            )}

            {zoomedSpell && (
                <SpellZoom spell={zoomedSpell} onClose={() => setZoomedSpell(null)} />
            )}
        </main>
    );
}

/** Vignette d'une unité dans la grille. */
function CollectionTile({ card, owned, onInspect }: { card: GodCard; owned: boolean; onInspect: () => void }) {
    const color = ELEMENT_COLORS[card.element].primary;

    return (
        <button
            className={`${styles.tile} ${owned ? '' : styles.tileLocked}`}
            style={{ '--card-color': color } as React.CSSProperties}
            onClick={onInspect}
            aria-label={`${card.name}${owned ? '' : ' (non possédé)'}`}
        >
            <span className={styles.tileImageWrap}>
                <Image
                    src={card.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 600px) 45vw, 200px"
                    className={styles.tileImage}
                />
                {!owned && <span className={styles.tileLock} aria-hidden="true">🔒</span>}
            </span>
            <span className={styles.tileFooter}>
                <span className={styles.tileName}>{card.name.split(',')[0]}</span>
                <span className={styles.tileMeta}>
                    {ELEMENT_SYMBOLS[card.element]} {card.maxHealth} PV
                </span>
            </span>
        </button>
    );
}

/**
 * Fiche détaillée : portrait, caractéristiques, et les 5 cartes de sort de l'unité.
 *
 * Les sorts viennent de `spells.ts`, la donnée RÉELLE du jeu. L'ancienne page lisait
 * `mock_spells.ts`, un jeu de cartes factices dont les valeurs ne correspondaient pas à ce qui
 * se passe en partie (le Trident y était une compétence à 1 énergie, alors que c'est un
 * générateur gratuit) : la collection annonçait donc des effets qui n'existaient pas.
 */
function InspectModal({ card, owned, onClose, onZoomSpell }: {
    card: GodCard;
    owned: boolean;
    onClose: () => void;
    onZoomSpell: (s: SpellCard) => void;
}) {
    const spells = useMemo(() => getSpellsByGodId(card.id), [card.id]);
    const color = ELEMENT_COLORS[card.element].primary;
    const family = (card.category ?? 'god') as Family;

    // Une unité s'obtient avec son dieu : on nomme lequel, sinon un joueur qui voit un cadenas
    // n'a aucun moyen de savoir quoi acheter pour le lever.
    const ownerGod = family === 'god' ? null : getGodById(getOwnerGodId(card) ?? '');

    return (
        <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-label={card.name}>
            <div
                className={styles.inspectPanel}
                style={{ '--card-color': color } as React.CSSProperties}
                onClick={(e) => e.stopPropagation()}
            >
                <button className={styles.modalClose} onClick={onClose} aria-label="Fermer">✕</button>

                <div className={styles.inspectHero}>
                    <div className={styles.inspectPortrait}>
                        {/* `imageUrl` et non `carouselImage` : ce dernier porte les ANCIENNES
                            illustrations `.jpg` des 12 dieux de base, héritées du carrousel de
                            l'accueil (supprimé depuis). La fiche affichait donc un visuel périmé,
                            différent de la vignette de la grille juste à côté. */}
                        <Image
                            src={card.imageUrl}
                            alt=""
                            fill
                            sizes="(max-width: 600px) 90vw, 320px"
                            className={styles.inspectPortraitImg}
                        />
                    </div>

                    <div className={styles.inspectIdentity}>
                        <span className={styles.inspectFamily}>
                            {FAMILY_META[family].icon} {FAMILY_META[family].label}
                        </span>
                        <h2 className={styles.inspectName}>{card.name}</h2>

                        <div className={styles.statRow}>
                            <span className={styles.stat} title="Élément">
                                {ELEMENT_SYMBOLS[card.element]} {ELEMENT_NAMES[card.element]}
                            </span>
                            <span className={styles.stat} title="Points de vie">❤️ {card.maxHealth} PV</span>
                            <span className={styles.stat} title="Faiblesse élémentaire : dégâts doublés">
                                💥 Faible à {ELEMENT_SYMBOLS[card.weakness]} {ELEMENT_NAMES[card.weakness]}
                            </span>
                        </div>

                        {ownerGod && (
                            <span className={styles.unlockNote}>
                                {owned ? '✓ Obtenu avec' : '🔒 Débloqué par'} {ownerGod.name.split(',')[0]}
                            </span>
                        )}

                        {!owned && (
                            <Link href="/shop#section-dieux" className={styles.buyLink} onClick={onClose}>
                                {ownerGod
                                    ? `Obtenir ${ownerGod.name.split(',')[0]} en boutique`
                                    : 'Non possédé — voir en boutique'}
                            </Link>
                        )}
                    </div>
                </div>

                {card.flavorText && <p className={styles.flavor}>{card.flavorText}</p>}

                <h3 className={styles.spellsTitle}>
                    Cartes de {card.name.split(',')[0]}
                    <span className={styles.spellsCount}>{spells.length}</span>
                </h3>

                {spells.length === 0 ? (
                    <p className={styles.emptyNote}>Aucune carte de sort n&apos;est encore associée à cette unité.</p>
                ) : (
                    <div className={styles.spellList}>
                        {spells.map(spell => {
                            const meta = getCardTypeMeta(spell.type);
                            return (
                                <button
                                    key={spell.id}
                                    className={styles.spellRow}
                                    style={{ '--type-color': meta.color } as React.CSSProperties}
                                    onClick={() => { haptic('tap'); onZoomSpell(spell); }}
                                    aria-label={`Agrandir ${spell.name}`}
                                >
                                    <span className={styles.spellThumb}>
                                        <Image
                                            src={spell.imageUrl}
                                            alt=""
                                            fill
                                            sizes="96px"
                                            className={styles.spellThumbImg}
                                        />
                                    </span>
                                    <span className={styles.spellInfo}>
                                        <span className={styles.spellHead}>
                                            <span className={styles.spellName}>{spell.name}</span>
                                            <span className={styles.spellCost} title="Coût en énergie">
                                                ⚡{spell.energyCost}
                                            </span>
                                        </span>
                                        <span className={styles.spellType}>
                                            {meta.icon} {meta.label}
                                            {spell.energyGain > 0 && (
                                                <span className={styles.spellGain}>+{spell.energyGain} énergie</span>
                                            )}
                                        </span>
                                        {/* Description RECONSTRUITE depuis les effets réels du moteur, et non
                                            le texte compact en emoji de spells.ts, qui est un aide-mémoire de
                                            conception illisible pour un joueur. */}
                                        <span className={styles.spellDesc}>{getReadableSpellDescription(spell)}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

/** Agrandissement plein écran de l'illustration d'un sort. */
function SpellZoom({ spell, onClose }: { spell: SpellCard; onClose: () => void }) {
    const meta = getCardTypeMeta(spell.type);
    return (
        <div className={styles.zoomOverlay} onClick={onClose} role="dialog" aria-label={spell.name}>
            <div className={styles.zoomCard} onClick={(e) => e.stopPropagation()}>
                <div className={styles.zoomImageWrap}>
                    <Image
                        src={spell.imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 600px) 92vw, 420px"
                        className={styles.zoomImage}
                    />
                </div>
                <div className={styles.zoomInfo}>
                    <h3 className={styles.zoomName}>{spell.name}</h3>
                    <p className={styles.zoomType}>
                        {meta.icon} {meta.label} · ⚡{spell.energyCost}
                        {spell.energyGain > 0 && ` · +${spell.energyGain} énergie`}
                    </p>
                    <p className={styles.zoomDesc}>{getReadableSpellDescription(spell)}</p>
                </div>
            </div>
            <span className={styles.zoomHint}>Touchez pour fermer</span>
        </div>
    );
}
