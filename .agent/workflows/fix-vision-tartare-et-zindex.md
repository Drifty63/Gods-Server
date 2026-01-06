---
description: Corrections Vision du Tartare et hiérarchie z-index
---

# Corrections à appliquer après le pull

## 1. Supprimer le doublon du modal optionnel inline

### Fichier : `src/components/GameBoard/GameBoard.tsx`

#### Étape 1.1 : Supprimer le modal inline (lignes ~1901-1933)

Chercher et **SUPPRIMER** ce bloc entier :

```tsx
{/* Choix optionnel (Vision du Tartare / Marée Basse) */}
{
    canConfirm && selectedCard && getOptionalChoiceRequired(selectedCard) && (
        <div className={styles.optionalChoiceContainer}>
            <div className={styles.optionalInfo}>
                <p className={styles.optionalTitle}>{getOptionalChoiceRequired(selectedCard)?.title}</p>
                <p className={styles.optionalDesc}>{getOptionalChoiceRequired(selectedCard)?.description}</p>
            </div>
            <div className={styles.optionalButtons}>
                <button
                    className={styles.confirmOptionalBtn}
                    onClick={() => {
                        const res = playCardWithChoice(selectedCard.id, undefined, selectedTargetGods.map(t => t.card.id), true);
                        if (res.success) setWantsToPlay(false);
                        else setToast({ type: 'error', message: res.message });
                    }}
                >
                    {getOptionalChoiceRequired(selectedCard)?.effectId === 'vision_tartare' ? '🩸 Oui (+1 Dégât, -2 Cartes)' : '⬅️ Ouest (G → D)'}
                </button>
                <button
                    className={styles.cancelOptionalBtn}
                    onClick={() => {
                        const res = playCardWithChoice(selectedCard.id, undefined, selectedTargetGods.map(t => t.card.id), false);
                        if (res.success) setWantsToPlay(false);
                        else setToast({ type: 'error', message: res.message });
                    }}
                >
                    {getOptionalChoiceRequired(selectedCard)?.effectId === 'vision_tartare' ? '🛡️ Non (Standard)' : '➡️ Est (D → G)'}
                </button>
            </div>
        </div>
    )
}
```

#### Étape 1.2 : Modifier la condition du bouton Confirmer

Chercher cette ligne (après le bloc supprimé) :

```tsx
canConfirm && selectedCard && !needsLightningChoice(selectedCard) && !needsElementChoiceLocal(selectedCard) && !getOptionalChoiceRequired(selectedCard) && (
```

Remplacer par :

```tsx
canConfirm && selectedCard && !needsLightningChoice(selectedCard) && !needsElementChoiceLocal(selectedCard) && (
```

(On retire `!getOptionalChoiceRequired(selectedCard)` car le modal dédié `OptionalChoiceModal` s'en occupera)

---

## 2. Corriger le z-index du prompt de ciblage

### Fichier : `src/components/GameBoard/GameBoard.module.css`

Chercher `.targetPrompt` (~ligne 1371) et ajouter ces propriétés :

```css
.targetPrompt {
    position: fixed;
    bottom: 50%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 40000;
    /* ... conserver les autres propriétés existantes ... */
}
```

---

## 3. Hiérarchie z-index globale (déjà appliquée)

Ces corrections ont été poussées avant le travail du collègue :

| Élément | z-index | Fichier |
|---------|---------|---------|
| GlobalUI (boutons) | 100000 | GlobalUI.module.css |
| GlobalUI (modal paramètres) | 100001 | GlobalUI.module.css |
| Modals de sélection | 50000 | Tous les *Modal.module.css |
| Prompt de ciblage | 40000 | GameBoard.module.css |

---

## 4. Optionnel : Nettoyer le CSS inutilisé

Après suppression du modal inline, ces classes CSS dans `GameBoard.module.css` ne sont plus nécessaires :

- `.optionalChoiceContainer`
- `.optionalInfo`
- `.optionalTitle`
- `.optionalDesc`
- `.optionalButtons`
- `.confirmOptionalBtn`
- `.cancelOptionalBtn`

Tu peux les supprimer ou les laisser (elles ne causent pas de problème).

---

## Résultat attendu

Après ces corrections :

1. Joueur sélectionne Vision du Tartare
2. Sélectionne 2 cibles ennemies
3. Clique sur **Confirmer**
4. `handlePlayCard` → joue la carte → ouvre `OptionalChoiceModal` (modal dédié centré)
5. Joueur fait son choix (Oui +1 dégât ou Non)
6. `confirmOptionalChoice` applique les dégâts aux 2 cibles sélectionnées
7. Tour se termine automatiquement

---

## 5. Corriger OptionalChoiceModal (Marée Basse apparaît sous le GameBoard)

### Fichier : `src/components/OptionalChoiceModal/OptionalChoiceModal.tsx`

Le modal n'utilise pas `createPortal`, donc il est limité par le contexte de stacking du parent.

**Remplacer tout le contenu par :**

```tsx
'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import styles from './OptionalChoiceModal.module.css';

interface OptionalChoiceModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    onAccept: () => void;
    onDecline: () => void;
}

export default function OptionalChoiceModal({
    isOpen,
    title,
    description,
    onAccept,
    onDecline
}: OptionalChoiceModalProps) {
    if (!isOpen) return null;

    // Utiliser createPortal pour monter le modal dans document.body
    // afin qu'il passe au-dessus de tous les autres éléments
    if (typeof window === 'undefined') return null;

    return createPortal(
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2 className={styles.title}>{title}</h2>
                <p className={styles.description}>{description}</p>
                <div className={styles.buttonContainer}>
                    <button
                        className={styles.declineButton}
                        onClick={onDecline}
                    >
                        ❌ Non
                    </button>
                    <button
                        className={styles.acceptButton}
                        onClick={onAccept}
                    >
                        ✅ Oui
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
```

### Résultat

Le modal Marée Basse (et Vision du Tartare via ce modal dédié) apparaîtra maintenant **au-dessus** de tout le GameBoard.

---

## 6. Z-index pour les éléments de ciblage et choix (foudre, éléments, etc.)

### Fichier : `src/components/GameBoard/GameBoard.module.css`

Ajouter `z-index: 40000;` aux classes suivantes pour qu'elles passent au-dessus des cartes :

#### 6.1 Choix de foudre (Zeus) - ligne ~1472

```css
.lightningChoice {
    z-index: 40000;
    position: relative;
    /* ... conserver les autres propriétés existantes ... */
}
```

#### 6.2 Choix de foudre compact - ligne ~1537

```css
.lightningChoiceCompact {
    z-index: 40000;
    position: relative;
    /* ... conserver les autres propriétés existantes ... */
}
```

#### 6.3 Choix d'élément (Artémis) - ligne ~1591

```css
.elementChoice {
    z-index: 40000;
    position: relative;
    /* ... conserver les autres propriétés existantes ... */
}
```

#### 6.4 Boutons de confirmation/annulation dans le prompt

Si besoin, ajouter aussi aux classes :

- `.confirmButton`
- `.cancelButton`

### Récapitulatif des z-index dans GameBoard.module.css

| Classe | z-index | Usage |
|--------|---------|-------|
| `.targetPrompt` | 40000 | Prompt principal de ciblage |
| `.lightningChoice` | 40000 | Choix appliquer/retirer foudre (grand) |
| `.lightningChoiceCompact` | 40000 | Choix appliquer/retirer foudre (compact) |
| `.elementChoice` | 40000 | Choix d'élément (Artémis) |
| `.optionalChoiceContainer` | 50000 | Modal inline (à supprimer - doublon) |

---

## Résumé global des modifications

| # | Correction | Fichier | Statut |
|---|------------|---------|--------|
| 1 | Supprimer modal inline doublon | GameBoard.tsx | À faire |
| 2 | Modifier condition bouton Confirmer | GameBoard.tsx | À faire |
| 3 | z-index `.targetPrompt` | GameBoard.module.css | À faire |
| 4 | Nettoyer CSS inutilisé | GameBoard.module.css | Optionnel |
| 5 | `createPortal` pour OptionalChoiceModal | OptionalChoiceModal.tsx | À faire |
| 6 | z-index pour foudre/éléments | GameBoard.module.css | À faire |
| 7 | Bug Échange d'Âme (fin tour) | GameBoard.tsx / gameStore.ts | À investiguer |
| 8 | Bug Pouvoirs des Âmes | gameStore.ts | À corriger |
| 9 | Bug Vent de Face (shuffle_god_cards) | gameStore.ts | À investiguer |

---

## 9. Bug Vent de Face - Effet non implémenté dans GameEngine

### Problème

Le sort **Vent de Face** (`shuffle_god_cards`) affiche une erreur dans la console :

```
Effet custom non implémenté: shuffle_god_cards
```

### Cause

L'effet `shuffle_god_cards` n'est pas géré dans le `switch` de `applyCustomEffect` du `GameEngine.ts` (ligne ~1857). Il tombe dans le `default` qui affiche un warning.

L'effet est géré MANUELLEMENT dans `confirmGodSelection` du store (`gameStore.ts` ligne 1389-1410).

### Solution à appliquer

**Fichier : `src/game-engine/GameEngine.ts`**

Ajouter ce case dans le switch de `applyCustomEffect` (avant le `default:` vers ligne 1857) :

```typescript
// ========================================
// ZÉPHYR - Vent de Face (shuffle_god_cards)
// ========================================
case 'shuffle_god_cards':
    // Cet effet est géré par le store via le modal de sélection de dieu
    // Le joueur choisit un dieu, et confirmGodSelection applique l'effet
    break;
```

Cela empêchera le warning d'apparaître tout en laissant le store gérer l'effet. ?

---

## 7. Bug Échange d'Âme - Le tour ne se termine pas en mode solo

### Cause identifiée

La fonction `autoEndTurnMultiplayer` (GameBoard.tsx ligne 859-884) ne fait RIEN en mode solo :

```typescript
const autoEndTurnMultiplayer = () => {
    if (!isSoloMode) { // <-- Si mode solo, on sort immédiatement !
        // ... fin de tour
    }, 4500);
}
```

Donc pour les sorts avec modals (Échange d'Âme, etc.), le tour ne se termine pas automatiquement en mode solo car `autoEndTurnMultiplayer` est ignoré.

### Solution à appliquer

**Fichier : `src/components/GameBoard/GameBoard.tsx`**

Modifier `autoEndTurnMultiplayer` pour gérer aussi le mode solo :

```typescript
const autoEndTurnMultiplayer = () => {
    setTimeout(() => {
        const currentState = useGameStore.getState().gameState;
        const currentStoreState = useGameStore.getState();
        
        // Vérifier si c'est toujours le tour du joueur
        if (currentState && currentState.currentPlayerId === playerId && currentState.status === 'playing') {
            
            // NE PAS finir le tour si un modal est ouvert
            const hasActiveModal =
                currentStoreState.isDistributingHeal ||
                currentStoreState.isSelectingCards ||
                currentStoreState.isSelectingEnemyCards ||
                currentStoreState.isShowingOptionalChoice ||
                currentStoreState.isSelectingPlayer ||
                currentStoreState.isSelectingDeadGod ||
                currentStoreState.isSelectingGod;
            
            if (hasActiveModal) return;
            
            // Vérifier si le joueur a un zombie actif
            const currentPlayer = currentState.players.find(p => p.id === playerId);
            const activeZombieGod = currentPlayer?.gods.find(g => g.isZombie && !g.isDead);
            
            if (activeZombieGod) {
                startZombieDamage(activeZombieGod.card.id);
                return;
            }
            
            endTurn();
            if (!isSoloMode) {
                onAction?.({ type: 'end_turn', payload: {} });
            }
        }
    }, isSoloMode ? 1500 : 4500); // Délai plus court en solo
};
```

Cette version :

- Fonctionne en mode solo ET multijoueur
- Vérifie les modals ouverts avant de finir le tour
- Utilise un délai plus court en mode solo (1.5s au lieu de 4.5s)

---

## 8. Bug Pouvoirs des Âmes - Ne fonctionne pas bien

### Analyse

Le sort **Pouvoirs des Âmes** (`copy_discard_spell`, 3 énergie) a un flux problématique :

**Dans `playCard` du store (ligne 806-808) :**

```typescript
if (cardToCheck && cardToCheck.effects.some(e => e.type === 'custom' && e.customEffectId === 'copy_discard_spell')) {
    get().startCardSelection('discard', 1, "Copier un sort (devient Ténèbres)", `copy_discard_spell:${cardId}`);
    return { success: true, message: 'Sélectionnez un sort à copier' };
}
```

**Problème :** Le sort est intercepté AVANT d'être joué (`engine.executeAction` n'est jamais appelé). Donc :

- ❌ La carte n'est pas défaussée
- ❌ L'énergie n'est pas dépensée
- ❌ Le sort original reste dans la main

### Solution à appliquer

Modifier le code pour jouer la carte D'ABORD, puis ouvrir le modal :

```typescript
if (cardToCheck && cardToCheck.effects.some(e => e.type === 'custom' && e.customEffectId === 'copy_discard_spell')) {
    // JOUER LA CARTE D'ABORD (dépense l'énergie, défausse la carte)
    const playResult = engine.executeAction({
        type: 'play_card',
        playerId,
        cardId,
    });
    
    if (playResult.success) {
        set({ gameState: cloneGameState(engine.getState()) });
        get().startCardSelection('discard', 1, "Copier un sort (devient Ténèbres)", `copy_discard_spell:${cardId}`);
    }
    
    return playResult;
}
```

### Fichier : `src/store/gameStore.ts`

### Ligne : ~806-808
