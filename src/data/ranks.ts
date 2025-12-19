// Système de rangs basé sur la Ferveur

export interface Rank {
    id: string;
    name: string;
    minFerveur: number;
    maxFerveur: number;
    icon: string;
    color: string;
    gradient: string;
}

export const RANKS: Rank[] = [
    {
        id: 'fer',
        name: 'Fer',
        minFerveur: 0,
        maxFerveur: 249,
        icon: '🔩',
        color: '#6b7280',
        gradient: 'linear-gradient(135deg, #6b7280, #4b5563)'
    },
    {
        id: 'bronze',
        name: 'Bronze',
        minFerveur: 250,
        maxFerveur: 499,
        icon: '🥉',
        color: '#cd7f32',
        gradient: 'linear-gradient(135deg, #cd7f32, #8b5a2b)'
    },
    {
        id: 'argent',
        name: 'Argent',
        minFerveur: 500,
        maxFerveur: 749,
        icon: '🥈',
        color: '#c0c0c0',
        gradient: 'linear-gradient(135deg, #c0c0c0, #808080)'
    },
    {
        id: 'or',
        name: 'Or',
        minFerveur: 750,
        maxFerveur: 999,
        icon: '🥇',
        color: '#ffd700',
        gradient: 'linear-gradient(135deg, #ffd700, #b8860b)'
    },
    {
        id: 'platine',
        name: 'Platine',
        minFerveur: 1000,
        maxFerveur: 1249,
        icon: '💎',
        color: '#40e0d0',
        gradient: 'linear-gradient(135deg, #40e0d0, #00ced1)'
    },
    {
        id: 'emeraude',
        name: 'Émeraude',
        minFerveur: 1250,
        maxFerveur: 1499,
        icon: '💚',
        color: '#50c878',
        gradient: 'linear-gradient(135deg, #50c878, #2e8b57)'
    },
    {
        id: 'diamant',
        name: 'Diamant',
        minFerveur: 1500,
        maxFerveur: 1999,
        icon: '💠',
        color: '#b9f2ff',
        gradient: 'linear-gradient(135deg, #b9f2ff, #87ceeb)'
    },
    {
        id: 'demi-dieux',
        name: 'Demi-Dieux',
        minFerveur: 2000,
        maxFerveur: 2499,
        icon: '⚡',
        color: '#9966ff',
        gradient: 'linear-gradient(135deg, #9966ff, #7b2cbf)'
    },
    {
        id: 'dieux',
        name: 'Dieux',
        minFerveur: 2500,
        maxFerveur: Infinity,
        icon: '👑',
        color: '#ff6b6b',
        gradient: 'linear-gradient(135deg, #ff6b6b, #ee5a24, #ffd700)'
    }
];

/**
 * Obtenir le rang correspondant à un montant de Ferveur
 */
export function getRankByFerveur(ferveur: number): Rank {
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (ferveur >= RANKS[i].minFerveur) {
            return RANKS[i];
        }
    }
    return RANKS[0]; // Fer par défaut
}

/**
 * Obtenir la progression vers le prochain rang (0-100%)
 */
export function getRankProgress(ferveur: number): number {
    const currentRank = getRankByFerveur(ferveur);

    // Si déjà au rang maximum (Dieux)
    if (currentRank.id === 'dieux') {
        return 100;
    }

    const rangeSize = currentRank.maxFerveur - currentRank.minFerveur + 1;
    const progressInRank = ferveur - currentRank.minFerveur;

    return Math.min(100, Math.floor((progressInRank / rangeSize) * 100));
}

/**
 * Calculer les points de Ferveur gagnés/perdus
 */
export function calculateFerveurChange(isVictory: boolean, opponentFerveur: number, playerFerveur: number): number {
    const ferveurDiff = opponentFerveur - playerFerveur;

    if (isVictory) {
        // Victoire: gain de base + bonus si adversaire plus fort
        const baseGain = 25;
        const bonus = Math.max(0, Math.floor(ferveurDiff / 100) * 5);
        return baseGain + bonus;
    } else {
        // Défaite: perte de base - réduction si adversaire plus fort
        const baseLoss = 20;
        const reduction = Math.max(0, Math.floor(ferveurDiff / 100) * 3);
        return Math.max(5, baseLoss - reduction);
    }
}

/**
 * Obtenir le prochain rang
 */
export function getNextRank(currentRank: Rank): Rank | null {
    const currentIndex = RANKS.findIndex(r => r.id === currentRank.id);
    if (currentIndex < RANKS.length - 1) {
        return RANKS[currentIndex + 1];
    }
    return null;
}

/**
 * Formater l'affichage de la Ferveur
 */
export function formatFerveur(ferveur: number): string {
    return ferveur.toLocaleString();
}
