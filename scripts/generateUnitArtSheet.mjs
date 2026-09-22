/**
 * Produit la feuille des ILLUSTRATIONS attendues pour les unités restantes.
 *
 *     node scripts/generateUnitArtSheet.mjs illustrations-unites.csv
 *
 * Six images par unité : un portrait et cinq sorts. Dix-neuf unités, donc 114 fichiers.
 *
 * La feuille se REMPLIT TOUTE SEULE à mesure que `unites-mecaniques.csv` se remplit : si le
 * nom et l'effet d'un sort y sont écrits, ils apparaissent ici comme consigne de dessin. Sinon
 * la ligne retombe sur le rôle du sort. Relancer le script après avoir avancé les mécaniques
 * donne donc une feuille plus précise, aux mêmes destinations.
 *
 * ── POURQUOI LES NOMS DE FICHIERS NE SUIVENT PAS L'ANCIENNE CONVENTION ────────────────────
 *
 * Les sorts déjà en jeu portent un nom tiré de leur titre : `spell_arachne_toile.png` pour
 * « Toile Mortelle ». C'est joli et c'est un piège — renommer un sort obligerait à renommer
 * son image, donc à la relivrer. Les nouveaux sorts prennent leur RÔLE :
 * `spell_meduse_skill_1.png`. Le nom du sort peut alors changer autant de fois qu'il le faut
 * sans qu'aucun fichier ne bouge.
 */
import fs from 'node:fs';
import path from 'node:path';
import { MISSING, ROLES, STATS, toCsv } from './_units.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const out = process.argv[2] ?? 'illustrations-unites.csv';
const MECA = path.join(ROOT, 'unites-mecaniques.csv');

/**
 * Relit la feuille des mécaniques, si elle existe, pour en tirer le nom et l'effet des sorts.
 *
 * Analyse volontairement naïve — découpage sur `";"` — mais suffisante ici : c'est ce script
 * qui a écrit le fichier, et il échappe toutes ses valeurs. Une cellule remplie à la main dans
 * Excel ressort au même format.
 */
function readMechanics() {
    if (!fs.existsSync(MECA)) return new Map();

    const lines = fs.readFileSync(MECA, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
    const map = new Map();

    for (const line of lines.slice(1)) {
        const c = line.split('";"').map(v => v.replace(/^"|"$/g, '').trim());
        const [unit, , , , , element, weakness, roleLabel, spellName, , , effect] = c;
        if (!unit || !roleLabel) continue;
        map.set(`${unit}::${roleLabel}`, { element, weakness, spellName, effect });
    }
    return map;
}

const meca = readMechanics();
const rows = [];
let known = 0;

for (const unit of MISSING) {
    const stat = STATS[unit.category];

    // Le portrait d'abord : c'est lui qui donne le visage de l'unité, et les cinq sorts
    // doivent ensuite lui ressembler.
    const identity = meca.get(`${unit.name}::Générateur 1`);
    const element = identity?.element ? ` · élément ${identity.element}` : '';
    rows.push([
        '',
        `/cards/gods/${unit.id}.png`,
        'Portrait',
        `${unit.name} — ${stat.label} de ${unit.god}`,
        `Le visage de l'unité. ${stat.hp} PV, ${stat.cost} points en Duel${element}.`,
        '640 x 640 px',
    ]);

    for (const role of ROLES) {
        const m = meca.get(`${unit.name}::${role.label}`);
        const named = m?.spellName ? ` « ${m.spellName} »` : '';
        if (m?.spellName) known++;
        rows.push([
            '',
            `/cards/spells/spell_${unit.id}_${role.slug}.png`,
            'Sort',
            `${unit.name} · ${role.label}${named}`,
            m?.effect || role.hint,
            '640 x 640 px',
        ]);
    }
}

const header = [
    'VOTRE FICHIER (nom actuel)', 'Fichier attendu', 'Type',
    'Contexte', 'Ce que l\'image doit montrer', 'Taille conseillee',
];

fs.writeFileSync(path.join(ROOT, out), toCsv([header, ...rows]), 'utf8');

console.log(`${MISSING.length} unités · ${rows.length} images attendues`);
console.log(`  ${MISSING.length} portraits + ${MISSING.length * ROLES.length} sorts`);
console.log(`écrit dans ${out}`);

if (meca.size === 0) {
    console.log('');
    console.log('unites-mecaniques.csv absent : les consignes de dessin restent génériques.');
} else {
    console.log('');
    console.log(`sorts déjà nommés dans les mécaniques : ${known} / ${MISSING.length * ROLES.length}`);
    if (known < MISSING.length * ROLES.length) {
        console.log('Relancer ce script après avoir avancé les mécaniques enrichira les consignes.');
    }
}

// Contrôle : aucune destination en double. Deux unités qui partageraient un identifiant
// s'écraseraient l'une l'autre au moment de l'import, sans le moindre avertissement.
const dests = rows.map(r => r[1]);
const dupes = dests.filter((d, i) => dests.indexOf(d) !== i);
if (dupes.length) {
    console.error('');
    console.error('DESTINATIONS EN DOUBLE : ' + [...new Set(dupes)].join(', '));
    process.exit(1);
}
