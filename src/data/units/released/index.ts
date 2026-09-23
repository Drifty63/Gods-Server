import { mergeKits, type Bestiary } from '../builders';

import { feuFollet } from './hestia';
import { cyclopes, meduse } from './poseidon';
import { demonsTartare, cerbere } from './hades';
import { serviteursAphrodite, achille } from './aphrodite';
import { oracleDelphes, python } from './apollon';
import { satyres, chiron } from './dionysos';
import { gardeCeleste, harpies } from './zeus';
import { chiensChasse, acteon } from './artemis';
import { occultiste, erinyes } from './nyx';
import { sirenes, minotaure } from './demeter';

/**
 * Les 19 unités écrites à la main — mécaniques conçues carte par carte, illustrations livrées.
 *
 * Ce sont elles, et non les 48 unités `draft` du dossier parent, qui complètent le périmètre
 * de la v1.0 : 12 dieux, 12 créatures, 12 serviteurs. Les brouillons restent en place comme
 * base de travail et matière à Ascension, mais aucun joueur ne les voit.
 *
 * Une seule reste retenue : l'Oracle de Delphes, dont la prophétie survivrait à son propre tour
 * et demande un champ persistant dans l'état de partie. Son drapeau `draft` tombera avec elle.
 */
export const RELEASED_BESTIARY: Bestiary = mergeKits(
    feuFollet,
    cyclopes, meduse,
    demonsTartare, cerbere,
    serviteursAphrodite, achille,
    oracleDelphes, python,
    satyres, chiron,
    gardeCeleste, harpies,
    chiensChasse, acteon,
    occultiste, erinyes,
    sirenes, minotaure,
);
