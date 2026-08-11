import { SpellCard, SpellEffect, TargetType, StatusEffect } from '@/types/cards';

/**
 * Génère une description en texte lisible (français) à partir des effets structurés d'une
 * carte, au lieu du champ `description` brut de spells.ts qui utilise une notation compacte en
 * emoji (ex: "1🩸 → ⚔️⚔️") pensée comme aide-mémoire de conception, pas pour l'affichage joueur.
 *
 * Les effets identiques (même type/cible/valeur/statut) sont regroupés en une seule ligne avec
 * un compteur (ex: deux effets "1 dégât à un ennemi" → "Inflige 1 dégât à 2 ennemis").
 */

const STATUS_LABELS: Record<StatusEffect, string> = {
    poison: 'Poison',
    lightning: 'Marque Foudre',
    shield: 'Bouclier',
    provocation: 'Provocation',
    stun: 'Étourdissement',
    weakness: 'Faiblesse',
    weakness_immunity: 'Immunité aux faiblesses',
    regen: 'Régénération',
    untargetable: 'Inciblable',
    bleed: 'Saignement',
    petrify: 'Pétrification',
};

function targetSuffix(target: TargetType | undefined, count: number, kind: 'ennemi' | 'allié'): string {
    const plural = kind === 'ennemi' ? 'ennemis' : 'alliés';
    const singular = kind === 'ennemi' ? 'un ennemi' : 'un allié';
    switch (target) {
        case 'all_enemies': return ' à tous les ennemis';
        case 'all_allies': return ' à tous vos alliés';
        case 'self': return ' à vous-même';
        case 'any_god': return count > 1 ? ` à ${count} dieux au choix` : ' à un dieu au choix';
        case 'dead_ally_god': return ' à un allié mort';
        case 'same': return ' à la même cible';
        default: return count > 1 ? ` à ${count} ${plural}` : ` à ${singular}`;
    }
}

interface GroupedEffect {
    count: number;
    effect: SpellEffect;
}

function groupEffects(effects: SpellEffect[]): GroupedEffect[] {
    const groups = new Map<string, GroupedEffect>();
    for (const effect of effects) {
        const key = `${effect.type}|${effect.target ?? ''}|${effect.value ?? ''}|${effect.status ?? ''}|${effect.customEffectId ?? ''}|${effect.description ?? ''}`;
        const existing = groups.get(key);
        if (existing) {
            existing.count++;
        } else {
            groups.set(key, { count: 1, effect });
        }
    }
    return [...groups.values()];
}

function describeGroup({ count, effect }: GroupedEffect): string {
    const value = effect.value ?? 0;

    switch (effect.type) {
        case 'damage':
            return `Inflige ${value} dégât${value > 1 ? 's' : ''}${targetSuffix(effect.target, count, 'ennemi')}.`;

        case 'heal':
            return `Soigne ${value} PV${targetSuffix(effect.target, count, 'allié')}.`;

        case 'shield':
            return `Donne ${value} bouclier${targetSuffix(effect.target, count, 'allié')}.`;

        case 'energy':
            return value >= 0 ? `Gagne ${value} énergie.` : `Retire ${Math.abs(value)} énergie à l'adversaire.`;

        case 'draw':
            return `Pioche ${value} carte${value > 1 ? 's' : ''}.`;

        case 'discard': {
            const isSelf = effect.target === 'ally_god' || effect.target === 'all_allies' || effect.target === 'self';
            return `${isSelf ? 'Défaussez' : "L'adversaire défausse"} ${value} carte${value > 1 ? 's' : ''} au hasard.`;
        }

        case 'mill': {
            const whose = effect.target === 'self' ? 'de votre deck' : "du deck adverse";
            return `Envoie ${value} carte${value > 1 ? 's' : ''} ${whose} dans la défausse.`;
        }

        case 'status': {
            const label = effect.status ? STATUS_LABELS[effect.status] : 'un effet';
            const stacks = value > 1 ? ` (x${value})` : '';
            const duration = effect.statusDuration
                ? ` pendant ${effect.statusDuration} tour${effect.statusDuration > 1 ? 's' : ''}`
                : '';
            return `Applique ${label}${stacks}${targetSuffix(effect.target, count, 'ennemi')}${duration}.`;
        }

        case 'remove_status': {
            const label = effect.status ? STATUS_LABELS[effect.status] : 'un effet';
            return `Retire ${label}${targetSuffix(effect.target, count, 'allié')}.`;
        }

        case 'custom': {
            const base = effect.description ?? 'Effet spécial.';
            const withDot = base.endsWith('.') ? base : `${base}.`;
            return count > 1 ? `${withDot} (x${count})` : withDot;
        }

        default:
            return '';
    }
}

export function getReadableSpellDescription(card: SpellCard): string {
    const lines = groupEffects(card.effects).map(describeGroup).filter(Boolean);
    if (card.energyGain > 0) {
        lines.push(`Génère ${card.energyGain} énergie.`);
    }
    return lines.length > 0 ? lines.join(' ') : card.description;
}
