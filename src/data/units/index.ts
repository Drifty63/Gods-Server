import type { GodCard, SpellCard } from '@/types/cards';
import type { Bestiary } from './builders';

import { zeusBestiary } from './zeus';
import { poseidonBestiary } from './poseidon';
import { hadesBestiary } from './hades';
import { athenaBestiary } from './athena';
import { aresBestiary } from './ares';
import { artemisBestiary } from './artemis';
import { nyxBestiary } from './nyx';
import { hestiaBestiary } from './hestia';
import { demeterBestiary } from './demeter';
import { dionysosBestiary } from './dionysos';
import { apollonBestiary } from './apollon';
import { aphroditeBestiary } from './aphrodite';

/**
 * Bestiaire complet : 2 serviteurs et 2 créatures rattachés à chacun des 12 dieux du roster.
 *
 * Le roster de dieux est volontairement figé — c'est ici qu'on ajoute du contenu. Ces unités
 * alimentent les adversaires du mode Ascension et sont jouables en mode Duel.
 */
const BESTIARIES: Bestiary[] = [
    zeusBestiary,
    poseidonBestiary,
    hadesBestiary,
    athenaBestiary,
    aresBestiary,
    artemisBestiary,
    nyxBestiary,
    hestiaBestiary,
    demeterBestiary,
    dionysosBestiary,
    apollonBestiary,
    aphroditeBestiary,
];

export const UNIT_CARDS: GodCard[] = BESTIARIES.flatMap(b => b.units);
export const UNIT_SPELLS: SpellCard[] = BESTIARIES.flatMap(b => b.spells);

export const UNIT_SERVANTS = UNIT_CARDS.filter(u => u.category === 'servant');
export const UNIT_CREATURES = UNIT_CARDS.filter(u => u.category === 'creature');

export { HP_BANDS } from './builders';
export { unitPower, spellPower, POWER_CEILING } from './power';
