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
import { readCsvRows, looksMisencoded } from './_csv.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
/**
 * Largeur par défaut, pour une illustration de CARTE.
 *
 * Les cartes s'affichent à 150-200px : les servir plus large ne fait que peser. Un fond plein
 * écran, lui, a besoin de ses pixels — c'est pourquoi la largeur se lit d'abord dans la colonne
 * « Taille conseillée » de la feuille, qui la porte ligne par ligne.
 */
const TARGET_WIDTH = 640;

/** Largeur visée pour une ligne, lue dans sa colonne de taille (« 941 x 1672 px »). */
function widthFor(size) {
    const m = String(size).match(/(\d{2,5})\s*[x×]/);
    return m ? Number(m[1]) : TARGET_WIDTH;
}

/**
 * Destinations à NE PAS écrire, passées en `--skip=/chemin/1,/chemin/2`.
 *
 * Sert quand une ligne de la feuille est douteuse : on applique tout le reste sans rien livrer
 * dont on n'est pas sûr, et la destination garde son illustration actuelle.
 */
const SKIP = new Set(
    (process.argv.find(a => a.startsWith('--skip=')) ?? '').replace('--skip=', '')
        .split(',').map(s => s.trim()).filter(Boolean),
);
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

/*
 * Lecture via `parseCsv`, qui suit la vraie grammaire CSV.
 *
 * Le découpage naïf sur `";"` qui était là tenait tant que la feuille sortait du générateur,
 * qui guillemette tout. Mais elle est remplie à la main dans un tableur, et celui-ci décide
 * seul de ce qu'il guillemette au ré-enregistrement. Une cellule nue décalait alors TOUTES les
 * colonnes d'un cran — et comme la colonne 1 est la destination, les images atterrissaient sur
 * les mauvaises cartes en silence. Un chemin de fichier Windows contient en plus des
 * antislashs et parfois des virgules, qu'un tableur adore guillemetter.
 */
const csvPath = path.resolve(ROOT, csvArg);
const rawText = fs.readFileSync(csvPath, 'utf8');
if (looksMisencoded(rawText)) {
    console.error(`ATTENTION : ${csvArg} ne semble pas être en UTF-8 — les accents sont abîmés.`);
    console.error('Rouvrez-le dans le tableur et ré-enregistrez en Unicode (UTF-8).');
    console.error('');
}

const rows = readCsvRows(fs, csvPath)
    .map(c => ({ src: (c[0] ?? '').trim(), dest: (c[1] ?? '').trim(), nom: c[4] ?? '', size: c[5] ?? '' }))
    .filter(r => r.src && r.dest && !SKIP.has(r.dest));

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

/**
 * Toutes les destinations qu'une carte référence, lues dans les sources.
 *
 * Le contrôle portait jusqu'ici sur l'EXISTENCE du fichier dans `public/`, ce qui n'était qu'un
 * approximation de la vraie question — « une carte pointe-t-elle là ? ». Tant qu'on ne livrait
 * que des remplacements, les deux se confondaient. Pour une unité NEUVE, le fichier n'existe
 * évidemment pas encore, et l'ancien contrôle rejetait la livraison entière.
 *
 * On lit donc les `imageUrl` des sources. Ce sont des littéraux : une expression régulière
 * suffit, et c'est plus sûr que le disque puisqu'une faute de frappe dans le nom du fichier est
 * maintenant détectée au lieu de créer un fichier orphelin que rien n'affichera.
 */
function referencedDestinations() {
    const set = new Set();
    const walk = dir => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, e.name);
            if (e.isDirectory()) walk(p);
            else if (/\.tsx?$/.test(e.name)) {
                const text = fs.readFileSync(p, 'utf8');
                for (const m of text.matchAll(/imageUrl:\s*[`'"]([^`'"]+)[`'"]/g)) set.add(m[1]);
                // Les fabriques du bestiaire composent le chemin : `/cards/gods/${u.id}.png`.
                // On les reconstruit à partir des identifiants déclarés dans le même fichier.
                for (const m of text.matchAll(/id:\s*'([a-z0-9_]+)'/g)) {
                    set.add(`/cards/gods/${m[1]}.png`);
                    for (const slot of ['generator_1', 'generator_2', 'skill_1', 'skill_2', 'utility_1']) {
                        set.add(`/cards/spells/spell_${m[1]}_${slot}.png`);
                    }
                }
            }
        }
    };
    walk(path.join(ROOT, 'src', 'data'));
    return set;
}

const REFERENCED = referencedDestinations();

const problems = [];
const trimmed = [];
let written = 0, bytesIn = 0, bytesOut = 0;

for (const r of rows) {
    if (!fs.existsSync(r.src)) { problems.push('source introuvable : ' + r.src); continue; }
    const destAbs = path.join(ROOT, 'public', r.dest.replace(/^\//, ''));
    if (!fs.existsSync(destAbs) && !REFERENCED.has(r.dest)) {
        problems.push('destination inattendue (aucune carte ne la référence) : ' + r.dest);
        continue;
    }
    fs.mkdirSync(path.dirname(destAbs), { recursive: true });

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
        .resize({ width: widthFor(r.size), withoutEnlargement: true })
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
