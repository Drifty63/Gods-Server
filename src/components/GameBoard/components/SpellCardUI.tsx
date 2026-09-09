import React from 'react';
import { SpellCard } from '@/types/cards';
import { getReadableSpellDescription } from '@/data/spellDescriptions';
import { ELEMENT_COLORS } from '@/game-engine/ElementSystem';
import { getCardTypeMeta } from '@/data/cardTypeStyles';
import { useLongPress } from '@/lib/useLongPress';
import { haptic } from '@/lib/haptics';
import styles from '../GameBoard.module.css';

interface SpellCardUIProps {
    card: SpellCard;
    isSelected?: boolean;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    isHidden?: boolean;
    isMini?: boolean;
    isMinimal?: boolean; // Show only image and cost
    /** Carte injouable dans l'état actuel (énergie insuffisante, pas votre tour, dieu mort...) :
     *  grisée, mais toujours cliquable pour que le joueur comprenne pourquoi via le message
     *  d'erreur, plutôt que de découvrir l'échec seulement après avoir ciblé et confirmé. */
    isDisabled?: boolean;
    /** Appui long : ouvre l'aperçu plein écran de la carte, sans la sélectionner. */
    onLongPress?: () => void;
}

export const SpellCardUI: React.FC<SpellCardUIProps> = ({
    card, isSelected, onClick, onMouseEnter, onMouseLeave, isHidden, isMini, isMinimal, isDisabled, onLongPress
}) => {
    // Déclaré avant tout `return` conditionnel : l'ordre des hooks doit rester stable, y compris
    // pour la variante « carte cachée » qui sort plus haut.
    const longPress = useLongPress(
        () => {
            if (!onLongPress) return;
            haptic('select'); // confirme au doigt que l'appui a bien été retenu
            onLongPress();
        },
        onClick,
    );
    // Sans gestionnaire d'appui long, on garde le clic natif (souris, clavier, tests).
    const pressHandlers = onLongPress ? longPress : { onClick };

    if (isHidden) {
        return (
            <div
                className={`${isMini ? styles.spellCardWrapperOpponent : styles.spellCardWrapper}`}
                data-hand-card-id={card.id}
                {...pressHandlers}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                {/* CORRECTIF Nyx : les dimensions étaient forcées en style inline (140x190 en
                  * main, 100x140 côté adverse), ce qui écrasait la taille responsive du CSS.
                  * Une carte retournée devenait 50 % plus large que ses voisines et faisait
                  * déborder la main. Pire, cet écart RÉVÉLAIT à lui seul quelles cartes sont
                  * cachées. Le dos reprend donc exactement le gabarit d'une carte normale. */}
                <div
                    className={`${styles.spellCardBack} ${isSelected ? styles.spellCardBackSelected : ''}`}
                >
                    <span className={styles.spellCardBackTitle}>GODS</span>
                </div>
            </div>
        );
    }

    const typeMeta = getCardTypeMeta(card.type);

    return (
        <div
            className={`${isMini ? styles.spellCardWrapperOpponent : styles.spellCardWrapper} ${isSelected ? styles.wrapperSelected : ''} ${isDisabled ? styles.spellCardDisabled : ''}`}
            data-hand-card-id={card.id}
            {...pressHandlers}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className={`${styles.spellCard} ${isSelected ? styles.spellSelected : ''}`} style={{
                padding: isMinimal ? '4px' : '8px',
                '--element-color': ELEMENT_COLORS[card.element].primary,
                '--type-color': typeMeta.color,
            } as React.CSSProperties}>
                <div className={styles.spellCost}>{card.energyCost}</div>
                {/* Badge de type façon "cadre" (Sort/Piège/Rituel à la Yu-Gi-Oh) : reconnaissable
                 *  au premier coup d'œil, avant même de lire la description. Masqué en isMini
                 *  (main adverse compacte) où la carte est trop petite pour un 2e badge lisible --
                 *  le bandeau de couleur en haut du cadre (voir ::before) suffit à cette taille. */}
                {!isMini && (
                    <div className={styles.spellTypeBadge} title={typeMeta.label}>
                        <span>{typeMeta.icon}</span>
                    </div>
                )}
                {card.imageUrl && (
                    <img
                        src={card.imageUrl}
                        alt={card.name}
                        className={styles.spellImage}
                        loading="lazy"
                        decoding="async"
                        // Empêche le glisser-déposer natif de l'image, qui « décollait » la carte
                        // du plateau au moindre mouvement de souris pendant la sélection.
                        draggable={false}
                        // En mode « minimal » (main du joueur), l'illustration occupe toute la
                        // carte. Sinon on laisse la feuille de style décider : la hauteur y est
                        // proportionnelle au cadre, alors qu'un `100px` en dur débordait des
                        // petites cartes sur téléphone étroit.
                        style={isMinimal ? { height: '100%', marginBottom: 0 } : undefined}
                    />
                )}

                {!isMinimal && (
                    <>
                        <div className={styles.spellTitle} style={{ marginTop: card.imageUrl ? '0' : '10px' }}>{card.name}</div>
                        <div className={styles.spellTypeLabel}>{typeMeta.label}</div>
                        <div className={styles.spellDesc}>{getReadableSpellDescription(card)}</div>
                        {card.energyGain > 0 && (
                            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#10b981', marginTop: '5px' }}>
                                +{card.energyGain} Energy
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
