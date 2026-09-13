/**
 * Importe une série d'illustrations depuis une feuille de correspondance CSV.
 *
 *     node scripts/importCardArt.mjs illustrations-v1.csv --dry-run
 *     node scripts/importCardArt.mjs illustrations-v1.csv
 *
 * La feuille est produite pour que ce soit l'auteur, et non un script, qui décide quelle image
 * va sur quelle carte : cinq sorts de Zeus représentent tous de la foudre, et aucune analyse
 * d'image ne les distinguerait de façon fiable. Le CSV porte donc, par ligne, le fichier source
 * choisi à la main et le chemin de destination lu dans `gods.ts` / `spells.ts`.
 *
 * Ce que le script fait, et que l'on ne veut pas faire 112 fois à la main :
 *   - vérifier que chaque source existe et que chaque destination est bien attendue par le code ;
 *   - signaler les bandes uniformes en bordure, artefact courant des générateurs d'images, qui
 *     deviendraient une barre noire visible sur la carte ;
 *   - réduire à 640px de large — les portraits s'affichent à 150-200px, les servir en 1254px
 *     revenait à faire télécharger 15 fois le nécessaire sur un réseau mobile.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const TARGET_WIDTH = 640;
const QUALITY = 86;

/** Seuils de détection d'une bande morte : en dessous = noir, au-dessus = blanc. */
const DARK = 24;
const LIGHT = 231;

const [, , csvArg, ...flags] = process.argv;
const DRY = flags.includes('--dry-run');
if (!csvArg) {
    console.error('Usage : node scripts/importCardArt.mjs <feuille.csv> [--dry-run]');
    process.exit(2);
}

const raw = fs.readFileSync(path.resolve(ROOT, csvArg), 'utf8').replace(/^﻿/, '');
const rows = raw.split(/\r?\n/).filter(l => l.trim()).slice(1)
    .map(l => l.split('";"').map(c => c.replace(/^"|"$/g, '')))
    .map(c => ({ src: c[0].trim(), dest: c[1].trim(), nom: c[4] }));

/** Bandes uniformes collées à un bord, mesurées en pixels. */
function deadBorders(data, W, H, C) {
    const lum = (x, y) => {
        const i = (y * W + x) * C;
        return (data[i] + data[i + 1] + data[i + 2]) / 3;
    };
    const dead = v => v <= DARK || v >= LIGHT;
    const colDead = x => { for (let y = 0; y < H; y += 4) if (!dead(lum(x, y))) return false; return true; };
    const rowDead = y => { for (let x = 0; x < W; x += 4) if (!dead(lum(x, y))) return false; return true; };

    let left = 0; while (left < W && colDead(left)) left++;
    let right = 0; while (right < W && colDead(W - 1 - right)) right++;
    let top = 0; while (top < H && rowDead(top)) top++;
    let bottom = 0; while (bottom < H && rowDead(H - 1 - bottom)) bottom++;
    return { left, right, top, bottom };
}

const problems = [];
const trimmed = [];
let written = 0, bytesIn = 0, bytesOut = 0;

for (const r of rows) {
    if (!fs.existsSync(r.src)) { problems.push('source introuvable : ' + r.src); continue; }
    const destAbs = path.join(ROOT, 'public', r.dest.replace(/^\//, ''));
    if (!fs.existsSync(destAbs)) { problems.push('destination inattendue (aucune carte ne la référence) : ' + r.dest); continue; }

    const buf = fs.readFileSync(r.src);
    bytesIn += buf.length;

    const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
    const b = deadBorders(data, info.width, info.height, info.channels);

    let pipeline = sharp(buf);
    if (b.left + b.right + b.top + b.bottom > 0) {
        trimmed.push({ dest: r.dest, nom: r.nom, ...b });
        pipeline = pipeline.extract({
            left: b.left,
            top: b.top,
            width: info.width - b.left - b.right,
            height: info.height - b.top - b.bottom,
        });
    }

    // `jpeg` et non `png` : ce sont des illustrations photographiques sans transparence, où le
    // PNG pèse plusieurs fois plus pour un résultat identique à l'œil. L'extension reste `.png`
    // parce que c'est elle que le code référence — le navigateur lit le contenu, pas le nom.
    const out = await pipeline
        .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toBuffer();

    bytesOut += out.length;
    if (!DRY) fs.writeFileSync(destAbs, out);
    written++;
}

console.log(rows.length + ' lignes lues, ' + written + (DRY ? ' prêtes à écrire' : ' écrites'));
console.log('poids : ' + (bytesIn / 1048576).toFixed(0) + ' Mo  ->  ' + (bytesOut / 1048576).toFixed(1) + ' Mo');

console.log('');
console.log('bandes uniformes rognées : ' + trimmed.length);
for (const t of trimmed) {
    console.log('  ' + t.dest + '  (' + t.nom + ')  gauche ' + t.left + ' droite ' + t.right + ' haut ' + t.top + ' bas ' + t.bottom);
}

if (problems.length) {
    console.log('');
    console.log('PROBLÈMES : ' + problems.length);
    for (const p of problems) console.log('  ' + p);
    process.exit(1);
}
if (DRY) {
    console.log('');
    console.log('Simulation : aucun fichier modifié. Relancer sans --dry-run pour écrire.');
}
