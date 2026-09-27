/**
 * Convertit la feuille de REMPLACEMENT en feuille d'IMPORT.
 *
 *     node scripts/toImportSheet.mjs remplacements-illustrations.csv import-remplacements.csv
 *
 * Les deux feuilles portent les mêmes informations dans un ordre différent, parce qu'elles
 * servent des lecteurs différents : la feuille de remplacement est lue par un humain, qui veut
 * voir d'abord le personnage et la carte ; `importCardArt` attend la source en première colonne
 * et la destination en seconde.
 *
 * Convertir plutôt que d'apprendre un second format à `importCardArt` : ce script-là a déjà
 * livré 114 illustrations sans erreur, et chaque option supplémentaire est une occasion de le
 * casser. Celui-ci ne fait que déplacer des colonnes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { readCsvRows } from './_csv.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const [, , inArg = 'remplacements-illustrations.csv', outArg = 'import-remplacements.csv'] = process.argv;

const rows = readCsvRows(fs, path.resolve(ROOT, inArg));
const problems = [];

const converted = rows.map(r => {
    const [personnage, carte, dest, , src] = r;
    if (!(src ?? '').trim()) { problems.push(`source vide : ${personnage} — ${carte}`); return null; }
    if (!fs.existsSync(src.trim())) { problems.push(`source introuvable : ${src}`); return null; }
    // Colonnes attendues par importCardArt : source, destination, type, contexte, nom, taille.
    // La taille reste vide : 640 px est le défaut, et c'est la bonne pour une carte.
    return [src.trim(), dest, 'Sort', `${personnage} — ${carte}`, carte, ''];
}).filter(Boolean);

if (problems.length) {
    console.error(`${problems.length} ligne(s) inexploitable(s), rien n'est écrit :`);
    problems.forEach(p => console.error('  ' + p));
    process.exit(1);
}

const esc = v => `"${String(v).replace(/"/g, '""')}"`;
const header = ['VOTRE FICHIER', 'Fichier attendu', 'Type', 'Contexte', 'Nom', 'Taille conseillee'];
fs.writeFileSync(
    path.resolve(ROOT, outArg),
    '﻿' + [header, ...converted].map(r => r.map(esc).join(';')).join('\r\n'),
    'utf8',
);

console.log(`${converted.length} lignes prêtes pour l'import, écrites dans ${outArg}`);
