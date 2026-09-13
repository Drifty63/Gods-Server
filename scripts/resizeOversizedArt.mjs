/**
 * Réduit à 640px de large toute illustration de carte qui dépasse.
 *
 *     node scripts/resizeOversizedArt.mjs --dry-run
 *     node scripts/resizeOversizedArt.mjs
 *
 * Purement une optimisation de poids : les cartes s'affichent à 150-200px, les servir en 1024px
 * revient à faire télécharger plusieurs fois le nécessaire. À lancer sur les illustrations qui
 * n'ont pas transité par `importCardArt.mjs` — celles-ci sortent déjà en 640px.
 *
 * La transparence est préservée quand elle existe : un PNG à canal alpha reste un PNG. Le reste
 * part en JPEG, sous son extension d'origine — le navigateur lit le contenu, pas le nom, et
 * c'est l'extension que le code référence.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const TARGET_WIDTH = 640;
const QUALITY = 86;

/** Dossiers d'outillage : entrées de scripts de génération, pas des illustrations affichées. */
const SKIP = ['/cards/templates/'];

const DRY = process.argv.includes('--dry-run');

function walk(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out); else out.push(p);
    }
    return out;
}

const files = walk(path.join(ROOT, 'public', 'cards'))
    .filter(f => /[.](png|jpe?g)$/i.test(f));

let bytesIn = 0, bytesOut = 0, done = 0;
const rows = [];

for (const f of files) {
    const web = '/' + path.relative(path.join(ROOT, 'public'), f).split(path.sep).join('/');
    if (SKIP.some(s => web.startsWith(s))) continue;

    const buf = fs.readFileSync(f);
    const meta = await sharp(buf).metadata();
    if (!meta.width || meta.width <= TARGET_WIDTH) continue;

    const pipeline = sharp(buf).resize({ width: TARGET_WIDTH, withoutEnlargement: true });
    const out = meta.hasAlpha
        ? await pipeline.png({ compressionLevel: 9, palette: true }).toBuffer()
        : await pipeline.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer();

    bytesIn += buf.length;
    bytesOut += out.length;
    done++;
    rows.push({ web, from: meta.width, ko: Math.round(buf.length / 1024), koOut: Math.round(out.length / 1024), alpha: !!meta.hasAlpha });
    if (!DRY) fs.writeFileSync(f, out);
}

for (const r of rows) {
    console.log('  ' + r.web + '  ' + r.from + 'px ' + r.ko + ' Ko -> 640px ' + r.koOut + ' Ko' + (r.alpha ? '  (alpha conservé)' : ''));
}
console.log('');
console.log(done + ' images réduites : ' + (bytesIn / 1048576).toFixed(1) + ' Mo -> ' + (bytesOut / 1048576).toFixed(1) + ' Mo');
if (DRY) console.log('Simulation : aucun fichier modifié.');
