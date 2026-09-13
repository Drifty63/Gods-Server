// Server-side copies of pack contents / prices (mirrors src/services/firebase.ts's
// STARTER_PACKS / GOD_PRICE / GOD_PROMO_PRICE / COFFRET_PRICE). Never trust these values
// from the request body -- resolving them here is what makes the purchase functions safe.

export const STARTER_PACKS = {
    poseidon: {
        id: 'poseidon',
        name: 'Coffret Poséidon',
        godIds: ['poseidon', 'artemis', 'athena', 'demeter'],
    },
    hades: {
        id: 'hades',
        name: 'Coffret Hadès',
        godIds: ['hades', 'nyx', 'apollon', 'ares'],
    },
    zeus: {
        id: 'zeus',
        name: 'Coffret Zeus',
        godIds: ['zeus', 'hestia', 'aphrodite', 'dionysos'],
    },
} as const;

export type StarterPackId = keyof typeof STARTER_PACKS;

export const GOD_PRICE = 3000;
export const GOD_PROMO_PRICE = 2000;

// Yearly promo rotation (mirrors MONTHLY_GODS in src/app/shop/page.tsx).
//
// This lives here, and not in the request body, for the reason stated at the top of the file:
// the client used to send `isPromo` and the server believed it, so ANY god could be bought at
// the promo price by changing the device clock. The month is read in UTC on both sides so the
// two never disagree at a month boundary.
export const MONTHLY_GODS: Record<number, string> = {
    0: 'hestia',      // Janvier
    1: 'hades',       // Février
    2: 'ares',        // Mars
    3: 'aphrodite',   // Avril
    4: 'demeter',     // Mai
    5: 'apollon',     // Juin
    6: 'poseidon',    // Juillet
    7: 'artemis',     // Août
    8: 'dionysos',    // Septembre
    9: 'athena',      // Octobre
    10: 'zeus',       // Novembre
    11: 'nyx',        // Décembre
};

/** God currently on promotion, resolved from the server clock. */
export function getPromoGodId(now: Date = new Date()): string {
    return MONTHLY_GODS[now.getUTCMonth()];
}
export const COFFRET_PRICE = 10000;
