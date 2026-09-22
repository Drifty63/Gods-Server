/**
 * Allège `public/` sans toucher à ce qui est déjà optimisé.
 *
 *     node scripts/slimAssets.mjs --dry-run
 *     node scripts/slimAssets.mjs
 *
 * Le poids compte double ici : Vercel conserve CHAQUE mise en ligne, donc chaque octet de
 * `public/` est stocké autant de fois qu'il y a eu de déploiements.
 *
 * Deux gisements, et un garde-fou.
 *
 * 1. LES IMAGES SERVIES BIEN PLUS GRANDES QU'ELLES NE S'AFFICHENT. Deux icônes de navigation
 *    en 682x1024 pour 32px à l'écran, la goutte d'ambroisie en 682x1024 pour 14 à 24px,
 *    l'avatar par défaut en 1024x1024 pour 60px au plus. On redescend à trois fois la taille
 *    d'affichage — la réserve des écrans à haute densité, et rien de plus.
 *
 * 2. LES IMAGES ENREGISTRÉES À UNE QUALITÉ EXCESSIVE. Certains fonds pèsent 800 Ko pour
 *    1024x1024, soit une qualité JPEG proche du maximum, invisible derrière le voile sombre
 *    que la page pose par-dessus.
 *
 * LE GARDE-FOU. 271 fichiers sur 280 sont DÉJÀ des JPEG — l'extension `.png` ment, c'est le
 * `importCardArt` qui les a convertis à qualité 86. Les réencoder ne ferait que dégrader une
 * image déjà compressée pour quelques octets. La règle : on ne garde le nouveau fichier que
 * s'il est plus léger d'au moins 35 %. En dessous, le gain ne paie pas la perte, et le fichier
 * d'origine reste. Ce seuil trie tout seul le sur-qualité du déjà-optimisé.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const DRY = process.argv.includes('--dry-run');

/** En dessous, aucun gain ne vaut le risque de toucher au fichier. */
const FLOOR = 40 * 1024;

/** Un réencodage n'est retenu que s'il fait gagner au moins cette part du poids. */
const MIN_GAIN = 0.35;

/** Qualité JPEG par défaut. Les fonds plein écran montent plus haut : voir QUALITY_FOR. */
const QUALITY = 84;

/**
 * Un fond plein écran est regardé, pas seulement traversé : il garde une qualité plus élevée.
 * Le gain reste massif — 800 Ko à 200 Ko — sans risquer un aplat sale sur un dégradé.
 */
const QUALITY_FOR = file => (/background|_bg\./i.test(file) ? 88 : QUALITY);

/**
 * Les icônes d'application doivent rester de VRAIS PNG.
 *
 * `manifest.webmanifest` et `layout.tsx` les déclarent en `image/png`. Leur glisser des octets
 * JPEG sous une extension `.png` casserait l'installation de l'application et l'icône sur
 * l'écran d'accueil — un défaut invisible dans un navigateur, et fatal une fois empaqueté.
 */
const KEEP_PNG = /^public\/icons\//;

/**
 * Images à REDIMENSIONNER, avec la largeur visée.
 *
 * Trois fois la plus grande taille d'affichage relevée dans le code : c'est ce que réclame un
 * écran à haute densité, et au-delà ce sont des pixels que personne ne verra jamais.
 */
const RESIZE = {
    'public/shop_icon.png': 96,        // affichée en 32px
    'public/deck_icon.png': 96,        // affichée en 32px
    'public/icons/ambroisie.png': 72,  // affichée de 14 à 24px
    'public/avatars/default.png': 192, // affichée de 35 à 60px
};

function walk(dir) {
    const out = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) out.push(...walk(p));
        else if (/\.(png|jpe?g)$/i.test(e.name)) out.push(p);
    }
    return out;
}

const rel = f => path.relative(ROOT, f).split(path.sep).join('/');

let before = 0;
let after = 0;
const changed = [];
const kept = [];

for (const file of walk(path.join(ROOT, 'public'))) {
    const size = fs.statSync(file).size;
    const key = rel(file);
    const target = RESIZE[key];

    if (size < FLOOR && target === undefined) continue;

    // Une icône d'application n'est réécrite que pour être REDIMENSIONNÉE. La recompresser
    // pour la recompresser la ferait passer par une palette de 256 couleurs, et un dégradé
    // d'icône y laisserait des bandes visibles — pour 38 Ko.
    if (KEEP_PNG.test(key) && target === undefined) continue;

    before += size;

    /*
     * Le fichier est lu ENTIÈREMENT en mémoire avant d'être traité.
     *
     * `sharp(chemin)` garde le fichier source ouvert en lecture paresseuse ; sous Windows, le
     * réécrire au même chemin échoue alors sur un verrou (`UNKNOWN: unknown error, open`).
     * Partir d'un tampon libère la main avant l'écriture. Ces images font au plus 900 Ko : le
     * coût mémoire est nul.
     */
    const input = fs.readFileSync(file);

    let meta;
    try {
        meta = await sharp(input).metadata();
    } catch {
        after += size;
        continue;
    }

    let pipeline = sharp(input);
    if (target && meta.width > target) {
        pipeline = pipeline.resize({ width: target, withoutEnlargement: true });
    }

    // La transparence impose le PNG ; tout le reste est photographique et gagne au JPEG.
    // L'extension ne bouge pas : c'est elle que le code référence, et le navigateur lit le
    // contenu, pas le nom.
    const out = meta.hasAlpha || KEEP_PNG.test(key)
        ? await pipeline.png({ compressionLevel: 9, palette: true }).toBuffer()
        : await pipeline.jpeg({ quality: QUALITY_FOR(key), mozjpeg: true }).toBuffer();

    // Un redimensionnement voulu est toujours retenu : c'est le but, pas un effet de bord.
    const gain = 1 - out.length / size;
    const worth = target !== undefined ? out.length < size : gain >= MIN_GAIN;

    if (!worth) {
        after += size;
        kept.push({ key, size, gain });
        continue;
    }

    after += out.length;
    changed.push({ key, size, next: out.length, dims: `${meta.width}x${meta.height}`, resized: Boolean(target) });
    if (!DRY) fs.writeFileSync(file, out);
}

const mo = n => (n / 1048576).toFixed(1);
console.log(`${changed.length} fichiers ${DRY ? 'à alléger' : 'allégés'}, ${kept.length} laissés intacts\n`);
for (const c of changed.sort((a, b) => (b.size - b.next) - (a.size - a.next)).slice(0, 20)) {
    console.log(
        `  ${((c.size - c.next) / 1024).toFixed(0).padStart(5)} Ko  ` +
        `${(c.size / 1024).toFixed(0)} -> ${(c.next / 1024).toFixed(0)} Ko  ` +
        `${c.resized ? 'redim.' : 'réenc.'}  ${c.dims.padEnd(10)} ${c.key}`,
    );
}
if (changed.length > 20) console.log(`  … et ${changed.length - 20} autres`);

console.log('');
console.log(`poids visé   : ${mo(before)} Mo  ->  ${mo(after)} Mo`);
console.log(`ÉCONOMIE     : ${mo(before - after)} Mo par mise en ligne`);
if (DRY) console.log('\nSimulation : aucun fichier modifié.');
