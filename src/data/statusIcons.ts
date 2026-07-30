import type { StatusEffect } from '@/types/cards';

/**
 * Source unique des icônes de statut, utilisée partout dans l'UI (combat, sélection d'équipe).
 * Avant ce fichier, HeroCard.tsx (combat) et GodCard.tsx (sélection d'équipe) avaient chacun
 * leur propre mapping divergent (ex: poison = ☠️ en combat mais 🧪 en sélection), ce qui rendait
 * les marqueurs incohérents selon l'écran.
 */
export const STATUS_ICONS: Record<StatusEffect, string> = {
    poison: '☠️',
    lightning: '⚡',
    shield: '🛡️',
    provocation: '🎯',
    stun: '💫',
    weakness: '💔',
    weakness_immunity: '💠',
    regen: '💚',
    untargetable: '👻',
};

export function getStatusIcon(status: StatusEffect): string {
    return STATUS_ICONS[status] || '✨';
}
