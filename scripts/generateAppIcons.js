/**
 * Génère les icônes d'application (PWA / favicon / iOS) en PNG, sans dépendance externe.
 *
 * Pourquoi un générateur plutôt que des fichiers déposés à la main : les icônes livrées étaient
 * des JPEG de 376 Ko renommés en `.png`. Un JPEG ne gère pas la transparence, pèse dix fois trop
 * lourd pour une icône, et un manifeste PWA qui annonce `image/png` sur un JPEG fait échouer
 * l'installation sur certains Android. Ici tout est rastérisé puis encodé en PNG via `zlib`
 * (module natif de Node) : aucune dépendance à installer, et on peut régénérer à volonté.
 *
 * Usage : node scripts/generateAppIcons.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ─────────────────────────────────────────────
// Encodeur PNG minimal (RGBA, non entrelacé)
// ─────────────────────────────────────────────

function crc32(buf) {
    let c;
    const table = crc32.table || (crc32.table = (() => {
        const t = new Int32Array(256);
        for (let n = 0; n < 256; n++) {
            c = n;
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            t[n] = c;
        }
        return t;
    })());

    let crc = -1;
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([len, typeAndData, crc]);
}

function encodePng(width, height, rgba) {
    const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;   // profondeur : 8 bits par canal
    ihdr[9] = 6;   // type couleur : RGBA
    ihdr[10] = 0;  // compression deflate
    ihdr[11] = 0;  // filtre standard
    ihdr[12] = 0;  // pas d'entrelacement

    // Chaque ligne est préfixée par son octet de filtre (0 = aucun).
    const raw = Buffer.alloc((width * 4 + 1) * height);
    for (let y = 0; y < height; y++) {
        const rowStart = y * (width * 4 + 1);
        raw[rowStart] = 0;
        rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
    }

    const idat = zlib.deflateSync(raw, { level: 9 });
    return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ─────────────────────────────────────────────
// Dessin de l'icône : éclair doré sur fond d'obsidienne
// ─────────────────────────────────────────────

/** Éclair stylisé, décrit en coordonnées normalisées (0..1) pour être rendu à n'importe quelle taille. */
const BOLT = [
    [0.56, 0.06], [0.26, 0.55], [0.45, 0.55], [0.36, 0.94],
    [0.74, 0.42], [0.53, 0.42], [0.66, 0.06],
];

function pointInPolygon(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i];
        const [xj, yj] = poly[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (edge0, edge1, x) => {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
};

/**
 * @param {number} size      côté de l'icône en pixels
 * @param {boolean} maskable icône « maskable » Android : le système peut rogner jusqu'à 20 % de
 *                           chaque bord, donc le motif est réduit et le fond couvre tout le carré.
 */
function drawIcon(size, maskable) {
    const rgba = Buffer.alloc(size * size * 4);
    // Suréchantillonnage 3×3 : sans lui, les diagonales de l'éclair sortent en escalier.
    const SS = 3;
    const cx = 0.5;
    const cy = 0.5;
    // Le disque de fond occupe tout le carré en mode maskable, sinon il laisse une marge.
    const discR = maskable ? 0.75 : 0.5;
    const contentScale = maskable ? 0.68 : 0.92;

    for (let py = 0; py < size; py++) {
        for (let px = 0; px < size; px++) {
            let r = 0, g = 0, b = 0, a = 0;

            for (let sy = 0; sy < SS; sy++) {
                for (let sx = 0; sx < SS; sx++) {
                    const u = (px + (sx + 0.5) / SS) / size;
                    const v = (py + (sy + 0.5) / SS) / size;

                    const dist = Math.hypot(u - cx, v - cy);
                    let pr = 0, pg = 0, pb = 0, pa = 0;

                    if (dist <= discR) {
                        // Fond : dégradé radial obsidienne → bleu nuit (palette --bg-olympus).
                        const t = Math.min(1, dist / discR);
                        pr = lerp(38, 10, t);
                        pg = lerp(30, 10, t);
                        pb = lerp(74, 26, t);
                        pa = 255;

                        // Anneau doré près du bord (sauf en maskable, où il serait rogné).
                        if (!maskable) {
                            const ring = smoothstep(0.44, 0.455, dist) * (1 - smoothstep(0.487, 0.5, dist));
                            pr = lerp(pr, 212, ring);
                            pg = lerp(pg, 175, ring);
                            pb = lerp(pb, 55, ring);
                        }

                        // Bord du disque adouci pour éviter l'aliasing sur fond transparent.
                        pa = 255 * (1 - smoothstep(discR - 1.5 / size, discR, dist));
                    }

                    // Éclair, recentré et mis à l'échelle selon le mode.
                    const bu = (u - cx) / contentScale + 0.5;
                    const bv = (v - cy) / contentScale + 0.5;
                    if (bu >= 0 && bu <= 1 && bv >= 0 && bv <= 1 && pointInPolygon(bu, bv, BOLT)) {
                        // Dégradé vertical or clair → bronze, pour ne pas avoir un aplat plat.
                        const t = Math.min(1, Math.max(0, bv));
                        pr = lerp(245, 205, t);
                        pg = lerp(215, 127, t);
                        pb = lerp(110, 50, t);
                        pa = 255;
                    }

                    r += pr * pa; g += pg * pa; b += pb * pa; a += pa;
                }
            }

            const samples = SS * SS;
            const alpha = a / samples;
            const idx = (py * size + px) * 4;
            // Moyenne pondérée par l'alpha : évite les halos sombres sur les bords transparents.
            rgba[idx] = a > 0 ? Math.round(r / a) : 0;
            rgba[idx + 1] = a > 0 ? Math.round(g / a) : 0;
            rgba[idx + 2] = a > 0 ? Math.round(b / a) : 0;
            rgba[idx + 3] = Math.round(alpha);
        }
    }

    return encodePng(size, size, rgba);
}

// ─────────────────────────────────────────────
// Sortie
// ─────────────────────────────────────────────

const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(OUT_DIR, { recursive: true });

const TARGETS = [
    { file: 'icon-192.png', size: 192, maskable: false },
    { file: 'icon-512.png', size: 512, maskable: false },
    { file: 'icon-maskable-192.png', size: 192, maskable: true },
    { file: 'icon-maskable-512.png', size: 512, maskable: true },
    { file: 'apple-touch-icon.png', size: 180, maskable: true },
    { file: 'favicon-32.png', size: 32, maskable: false },
];

for (const { file, size, maskable } of TARGETS) {
    const png = drawIcon(size, maskable);
    fs.writeFileSync(path.join(OUT_DIR, file), png);
    console.log(`${file.padEnd(26)} ${String(size).padStart(3)}px  ${(png.length / 1024).toFixed(1)} Ko`);
}

console.log(`\n✓ Icônes générées dans ${path.relative(process.cwd(), OUT_DIR)}`);
