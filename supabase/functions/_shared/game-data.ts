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
export const COFFRET_PRICE = 10000;
