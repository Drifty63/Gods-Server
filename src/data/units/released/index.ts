import { mergeKits, twin, type Bestiary } from '../builders';

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

/** Deuxième harpie et deuxième sirène, pour les combats de groupe du mode Histoire. */
export const harpieSeconde = twin(harpies, '2');
export const sireneSeconde = twin(sirenes, '2');

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

    /*
     * Jumelles réservées au mode Histoire.
     *
     * Le premier combat du chapitre 3 oppose les dieux à DEUX harpies et DEUX sirènes. Le moteur
     * résolvant une cible par `card.id`, deux cartes de même identifiant dans une équipe
     * rendraient la seconde intouchable : il faut donc une jumelle distincte, qui garde les
     * illustrations et les sorts de l'originale.
     *
     * Elles sont `hidden` : invisibles en Collection, en Duel et en Ascension.
     */
    harpieSeconde, sireneSeconde,
);
