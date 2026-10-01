/**
 * Convertit les illustrations du jeu en WebP, et réécrit les chemins qui les désignent.
 *
 *     node scripts/toWebp.mjs --dry-run
 *     node scripts/toWebp.mjs
 *
 * Mesuré sur les 403 images du projet : 60,2 Mo aujourd'hui, 43 Mo après. Le gain est plus
 * modeste qu'on pourrait le croire pour une raison qui mérite d'être dite — les fichiers nommés
 * `.png` contiennent en réalité du JPEG, écrit par importCardArt.mjs en qualité mozjpeg 86. On ne
 * compare donc pas WebP à du PNG brut mais à du JPEG déjà optimisé.
 *
 * DEUX DOSSIERS SONT ÉPARGNÉS, et ce n'est pas un oubli :
 *
 *  - `/icons/` : ce sont les icônes d'application déclarées dans le manifeste et l'icône Apple.
 *    Les systèmes qui les installent sur un écran d'accueil sont plus difficiles sur les formats
 *    que les navigateurs, et l'enjeu — une icône qui ne s'affiche pas après installation — est
 *    hors de proportion avec les quelques kilo-octets en jeu.
 *  - `/avatars/` : `profiles.avatar` contient des CHEMINS pour les comptes qui n'ont pas choisi
 *    un emoji. Renommer un fichier d'avatar casse la photo de profil de ces comptes-là, en base,
 *    sans aucun moyen de le rattraper depuis le code.
 *
 * Les portraits de dieux restent renommés, eux, parce qu'un compte peut aussi y pointer :
 * `resolveAvatarUrl()` dans src/lib/avatar.ts ramène ces anciens chemins vers le nouveau.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const DRY = process.argv.includes('--dry-run');
const QUALITY = 80;

/** Dossiers de `public/` dont les images sont converties. */
const CONVERT_DIRS = ['cards', 'story', 'assets', 'backgrounds', 'images'];
/** Fichiers texte dont les chemins sont réécrits. */
const SOURCE_EXT = /\.(ts|tsx|css|mjs|js|json|webmanifest)$/;

function walk(dir, test, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (['node_modules', '.next', '.git'].includes(e.name)) continue;
            walk(p, test, out);
        } else if (test(e.name)) out.push(p);
    }
    return out;
}

// ── 1. Conversion des fichiers ───────────────────────────────────────────────
const images = CONVERT_DIRS.flatMap(d =>
    walk(path.join(ROOT, 'public', d), n => /\.(png|jpe?g)$/i.test(n)),
);

let before = 0, after = 0, converted = 0;
const renames = new Map();

for (const file of images) {
    const target = file.replace(/\.(png|jpe?g)$/i, '.webp');
    const web = p => '/' + path.relative(path.join(ROOT, 'public'), p).split(path.sep).join('/');
    renames.set(web(file), web(target));

    const size = fs.statSync(file).size;
    before += size;

    const buf = await sharp(file).webp({ quality: QUALITY }).toBuffer();
    after += buf.length;
    converted++;

    if (!DRY) {
        fs.writeFileSync(target, buf);
        if (target !== file) fs.unlinkSync(file);
    }
}

// ── 2. Réécriture des chemins dans les sources ───────────────────────────────
const sources = [
    ...walk(path.join(ROOT, 'src'), n => SOURCE_EXT.test(n)),
    ...walk(path.join(ROOT, 'scripts'), n => SOURCE_EXT.test(n)),
    path.join(ROOT, 'public', 'sw.js'),
].filter(f => fs.existsSync(f) && fs.statSync(f).isFile());

let touched = 0, rewrites = 0;
for (const f of sources) {
    const text = fs.readFileSync(f, 'utf8');
    let next = text;
    for (const [from, to] of renames) {
        if (from === to || !next.includes(from)) continue;
        next = next.split(from).join(to);
        rewrites++;
    }
    /*
     * Les chemins COMPOSÉS à l'exécution — `/cards/gods/${id}.webp` dans builders.ts — n'ont pas
     * de forme littérale à remplacer. On traite les gabarits à part, et seulement pour les
     * dossiers convertis, pour ne pas toucher aux icônes ni aux avatars.
     */
    for (const dir of CONVERT_DIRS) {
        const tpl = new RegExp(`(/${dir}/[^\`'"]*\\$\\{[^}]+\\}[^\`'"]*)\\.png`, 'g');
        const replaced = next.replace(tpl, '$1.webp');
        if (replaced !== next) { next = replaced; rewrites++; }
    }
    if (next !== text) {
        touched++;
        if (!DRY) fs.writeFileSync(f, next);
    }
}

const mo = b => (b / 1024 / 1024).toFixed(1) + ' Mo';
console.log(`${converted} images converties en WebP (qualité ${QUALITY})`);
console.log(`  ${mo(before)}  ->  ${mo(after)}   (${Math.round(100 - after / before * 100)} % en moins)`);
console.log(`${rewrites} chemins réécrits dans ${touched} fichiers`);
console.log('épargnés : /icons/ (manifeste) et /avatars/ (chemins stockés en base)');
if (DRY) console.log('\nSimulation : aucun fichier modifié.');
