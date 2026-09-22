/**
 * Que pèserait `public/` si chaque image était servie au bon format et à la bonne taille ?
 *
 *     node scripts/auditAssetWeight.mjs
 *
 * MESURE SEULEMENT : rien n'est écrit. Le script ré-encode en mémoire pour comparer, parce
 * qu'une estimation au doigt mouillé ne permet pas d'arbitrer.
 *
 * Deux gisements distincts :
 *  - un PNG OPAQUE est un JPEG qui s'ignore. Sans transparence à préserver, il pèse plusieurs
 *    fois son équivalent photographique pour un résultat identique à l'œil.
 *  - une image affichée à 32 px mais stockée en 1024 px fait télécharger mille fois les pixels
 *    nécessaires. La transparence oblige à rester en PNG, pas à rester énorme.
 *
 * Le poids compte double ici : Vercel conserve CHAQUE déploiement, donc chaque octet de
 * `public/` est stocké autant de fois qu'il y a eu de mises en ligne.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIR = path.join(ROOT, 'public');

/** En dessous, le gain ne vaut pas le risque de toucher au fichier. */
const FLOOR = 60 * 1024;

function walk(dir) {
    const out = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) out.push(...walk(p));
        else if (/\.(png|jpe?g)$/i.test(e.name)) out.push(p);
    }
    return out;
}

const files = walk(DIR).filter(f => fs.statSync(f).size >= FLOOR);
console.log(`${files.length} images de plus de ${(FLOOR / 1024).toFixed(0)} Ko\n`);

let before = 0;
let after = 0;
const wins = [];

for (const file of files) {
    const size = fs.statSync(file).size;
    before += size;

    let meta;
    try {
        meta = await sharp(file).metadata();
    } catch {
        after += size;
        continue;
    }

    // Une image opaque n'a aucune raison d'être un PNG. L'extension, elle, ne bouge pas : c'est
    // elle que le code référence, et le navigateur lit le contenu, pas le nom.
    const opaque = !meta.hasAlpha;
    let candidate = size;
    try {
        const buf = opaque
            ? await sharp(file).jpeg({ quality: 84, mozjpeg: true }).toBuffer()
            : await sharp(file).png({ compressionLevel: 9, palette: true }).toBuffer();
        candidate = buf.length;
    } catch {
        /* Format exotique : on le compte inchangé plutôt que de promettre un gain. */
    }

    after += Math.min(size, candidate);
    const saved = size - Math.min(size, candidate);
    if (saved > 40 * 1024) {
        wins.push({
            file: path.relative(ROOT, file).split(path.sep).join('/'),
            size, candidate, saved,
            dims: `${meta.width}x${meta.height}`,
            kind: opaque ? 'opaque' : 'alpha',
        });
    }
}

wins.sort((a, b) => b.saved - a.saved);

const mo = n => (n / 1048576).toFixed(1);
console.log(`poids actuel des images visées : ${mo(before)} Mo`);
console.log(`poids après ré-encodage        : ${mo(after)} Mo`);
console.log(`ÉCONOMIE                       : ${mo(before - after)} Mo (${Math.round((1 - after / before) * 100)} %)\n`);

console.log('Les 15 plus gros gains :');
for (const w of wins.slice(0, 15)) {
    console.log(
        `  ${(w.saved / 1024).toFixed(0).padStart(5)} Ko  ` +
        `${(w.size / 1024).toFixed(0)} -> ${(w.candidate / 1024).toFixed(0)} Ko  ` +
        `${w.dims.padEnd(10)} ${w.kind.padEnd(7)} ${w.file}`,
    );
}
