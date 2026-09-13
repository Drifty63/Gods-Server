/**
 * Vérifie la cohérence entre les illustrations référencées par le code et les fichiers de
 * `public/`. À lancer avant chaque déploiement touchant aux images :
 *
 *     node scripts/checkCardArt.mjs
 *
 * Deux défauts sont signalés, et le script sort en erreur si l'un des deux apparaît :
 *
 *  - MANQUANT  : le code affiche une image qui n'existe pas sur le disque. Le joueur voit un
 *                cadre vide. C'est arrivé pour `ulysses` et `athena_knight`, dont le chemin
 *                était fabriqué au lieu d'être lu dans `imageUrl`.
 *  - ORPHELIN  : un fichier que rien n'affiche. Sans ce contrôle, ces fichiers s'accumulent et
 *                deviennent des destinations crédibles où déposer une illustration par erreur.
 *
 * Les chemins construits dynamiquement (`/cards/units/${id}.png`) ne peuvent pas être résolus
 * par une lecture de texte : les dossiers concernés sont déclarés dans DYNAMIC_DIRS, et leur
 * contenu est considéré comme utilisé dès que le dossier est cité dans le code.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SEP = path.sep;
const IMG = /[.](png|jpe?g|svg|webp|gif)$/i;

/** Dossiers dont les fichiers sont atteints par un chemin construit à l'exécution. */
const DYNAMIC_DIRS = ['/cards/units/', '/cards/gods/'];

/**
 * Dossiers d'OUTILLAGE : leurs fichiers sont des entrées de scripts de génération, pas des
 * illustrations affichées par le jeu. Les compter comme orphelins ferait échouer le contrôle
 * en permanence, ce qui apprendrait vite à l'ignorer.
 */
const TOOL_DIRS = ['/cards/templates/'];

/** Largeur maximale acceptée pour une illustration de carte. */
const MAX_WIDTH = 640;

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (['node_modules', '.next', '.git', 'graphify-out'].includes(e.name)) continue;
            walk(p, out);
        } else out.push(p);
    }
    return out;
}

const rel = p => p.slice(ROOT.length + 1).split(SEP).join('/');
const web = p => '/' + rel(p).replace(/^public\//, '');

const sources = [
    ...walk(path.join(ROOT, 'src')),
    ...walk(path.join(ROOT, 'supabase')),
    // `scripts/` compte : un gabarit cite en exemple d'un outil de generation est utilise.
    ...walk(path.join(ROOT, 'scripts')),
    path.join(ROOT, 'public', 'manifest.webmanifest'),
    path.join(ROOT, 'public', 'sw.js'),
    path.join(ROOT, 'public', 'offline.html'),
].filter(f => fs.existsSync(f) && fs.statSync(f).isFile() && !IMG.test(f));

let corpus = '';
for (const f of sources) {
    try { corpus += fs.readFileSync(f, 'utf8') + String.fromCharCode(10); } catch { /* binaire */ }
}

// 1. Chemins littéraux référencés par le code.
const referenced = new Set();
for (const m of corpus.matchAll(/['"`(](\/[A-Za-z0-9_\-./]+[.](?:png|jpe?g|svg|webp|gif))/gi)) {
    referenced.add(m[1]);
}

const onDisk = walk(path.join(ROOT, 'public')).filter(f => IMG.test(f));
const onDiskWeb = new Set(onDisk.map(web));

const missing = [...referenced].filter(p => !onDiskWeb.has(p)).sort();

// 2. Fichiers que rien n'affiche.
const dynamicUsed = DYNAMIC_DIRS.filter(d => corpus.includes(d));
const orphans = onDisk
    .map(web)
    .filter(p => !referenced.has(p))
    .filter(p => !dynamicUsed.some(d => p.startsWith(d)))
    .filter(p => !TOOL_DIRS.some(d => p.startsWith(d)))
    .sort();

// 3. Illustrations trop lourdes (lecture de l'en-tête, sans dépendance externe).
function pngSize(buf) {
    if (buf.readUInt32BE(0) !== 0x89504e47) return null;
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}
function jpegSize(buf) {
    if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
    let i = 2;
    while (i < buf.length - 9) {
        if (buf[i] !== 0xff) { i++; continue; }
        const marker = buf[i + 1];
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
            return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
        }
        i += 2 + buf.readUInt16BE(i + 2);
    }
    return null;
}

const oversized = [];
for (const f of onDisk) {
    const p = web(f);
    if (!p.startsWith('/cards/')) continue;      // fonds et icônes : dimensions libres
    if (TOOL_DIRS.some(d => p.startsWith(d))) continue;
    let buf;
    try { buf = fs.readFileSync(f); } catch { continue; }
    const size = pngSize(buf) ?? jpegSize(buf);
    if (size && size.w > MAX_WIDTH) oversized.push({ p, ...size, ko: Math.round(buf.length / 1024) });
}

const say = (title, list, render) => {
    console.log('');
    console.log(title + ' : ' + list.length);
    for (const x of list) console.log('  ' + render(x));
};

console.log(referenced.size + ' chemins référencés, ' + onDisk.length + ' fichiers dans public/');
say('MANQUANTS (affichés mais absents du disque)', missing, x => x);
say('ORPHELINS (présents mais jamais affichés)', orphans, x => x);
say('TROP GRANDS (au-delà de ' + MAX_WIDTH + 'px de large)', oversized,
    x => x.p + '  ' + x.w + 'x' + x.h + '  ' + x.ko + ' Ko');

if (missing.length || orphans.length) {
    console.log('');
    console.log('Échec : ' + missing.length + ' manquant(s), ' + orphans.length + ' orphelin(s).');
    process.exit(1);
}
console.log('');
console.log('Aucun manquant, aucun orphelin.');
