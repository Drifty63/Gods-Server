/**
 * Recadre les illustrations de sorts dont une marge (blanche ou noire) a été « cuite » dans
 * l'image à la génération.
 *
 * Pourquoi c'est nécessaire : le cadre de carte est en `aspect-ratio: 0.72` et l'image est
 * affichée en `object-fit: cover`. Une source carrée (toutes le sont, 1024×1024) est donc
 * rognée UNIQUEMENT sur les côtés — sa hauteur est conservée à 100 %. Résultat : une bande
 * parasite en haut ou en bas ne disparaît jamais et laisse un vide dans le cadre, alors
 * qu'une marge latérale, elle, serait masquée toute seule.
 *
 * Le cahier des charges l'interdisait pourtant (SPELL_IMAGE_PROMPTS.md : « No frame, no
 * border ») : ce script rattrape les images déjà produites.
 *
 * Usage :
 *   node scripts/trimSpellArt.js --check   → mesure et liste, sans rien modifier
 *   node scripts/trimSpellArt.js           → recadre les fichiers concernés
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SPELLS_DIR = path.join(__dirname, '..', 'public', 'cards', 'spells');

/** Au-dessus de cette luminance, un pixel est considéré comme du papier nu, pas du dessin. */
const NEAR_WHITE = 236;
/**
 * Part de pixels dessinés à partir de laquelle une ligne appartient au panneau illustré.
 *
 * On cherche le CONTOUR du panneau, et non des lignes « uniformément blanches » : les marges
 * de ces illustrations portent des éclaboussures d'encre qui débordent du cadre peint (cas de
 * Zone de Vide, peinte sur une feuille laissée nue). Un test d'uniformité les manquerait
 * entièrement, alors qu'un seuil sur la densité de dessin les traverse sans broncher.
 */
const PANEL_RATIO = 0.6;
/**
 * CE QUE CE SCRIPT NE DÉTECTE PAS : les filets sombres fins cuits dans l'illustration.
 *
 * L'analyse travaille sur un rééchantillonnage en 200×200 (voir SAMPLE), où un liseré de 5 px
 * dans une image de 1000 px est moyenné avec ses voisins et disparaît purement et simplement.
 * Mesuré : le cadre noir de Fertilisation, pourtant continu sur ses quatre côtés et à 97 % de
 * pixels noirs en pleine résolution, ne pesait plus que 31 % une fois sous-échantillonné.
 *
 * Ces cas se traitent à la main, après mesure en pleine résolution (Zone de Vide, Sécheresse et
 * Fertilisation l'ont été). Le vrai correctif est en amont : SPELL_IMAGE_PROMPTS.md interdit
 * déjà tout cadre et toute bordure à la génération.
 */
/** En dessous, on ne touche pas : le gain ne vaut pas le risque de mordre sur le dessin. */
const MIN_BAND_RATIO = 0.008;
/** Garde-fou : jamais plus de 15 % d'un côté, sinon c'est qu'on a mal détecté. */
const MAX_BAND_RATIO = 0.15;

/** Analyse normalisée sur 200×200 : assez fin pour mesurer, assez rapide pour 129 fichiers. */
const SAMPLE = 200;

async function measure(file) {
    const input = fs.readFileSync(file);
    const { data, info } = await sharp(input)
        .resize(SAMPLE, SAMPLE, { fit: 'fill' })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { width, channels } = info;

    /** Densité de pixels dessinés (non-blancs) sur une ligne ou une colonne. */
    const band = (get) => {
        let n = 0;
        for (let i = 0; i < SAMPLE; i++) {
            const o = get(i) * channels;
            const lum = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
            if (lum < NEAR_WHITE) n++;
        }
        return n / SAMPLE;
    };

    const rows = [], cols = [];
    for (let y = 0; y < SAMPLE; y++) rows.push(band(i => y * width + i));
    for (let x = 0; x < SAMPLE; x++) cols.push(band(i => i * width + x));

    const firstIn = (a) => a.findIndex(v => v >= PANEL_RATIO);
    const lastIn = (a) => a.length - 1 - [...a].reverse().findIndex(v => v >= PANEL_RATIO);

    // Panneau introuvable (illustration entièrement claire) : on ne touche à rien.
    if (firstIn(rows) === -1 || firstIn(cols) === -1) return { top: 0, bottom: 0, left: 0, right: 0 };

    return {
        top: firstIn(rows),
        bottom: SAMPLE - 1 - lastIn(rows),
        left: firstIn(cols),
        right: SAMPLE - 1 - lastIn(cols),
    };
}

async function run() {
    const checkOnly = process.argv.includes('--check');
    const files = fs.readdirSync(SPELLS_DIR).filter(f => /\.(png|jpe?g)$/i.test(f));

    const affected = [];
    for (const name of files) {
        const file = path.join(SPELLS_DIR, name);
        const m = await measure(file);
        const max = Math.max(m.top, m.bottom, m.left, m.right) / SAMPLE;
        if (max >= MIN_BAND_RATIO) affected.push({ name, file, m, max });
    }

    if (affected.length === 0) {
        console.log('Aucune marge parasite détectée sur %d illustrations.', files.length);
        return;
    }

    console.log('%d illustration(s) avec marge parasite (sur %d) :\n', affected.length, files.length);
    for (const a of affected) {
        console.log(
            '  %s  haut %d  bas %d  gauche %d  droite %d  → %s %%',
            a.name.padEnd(38), a.m.top, a.m.bottom, a.m.left, a.m.right, (a.max * 100).toFixed(1),
        );
    }

    if (checkOnly) {
        console.log('\n(--check : aucun fichier modifié)');
        return;
    }

    console.log('');
    for (const a of affected) {
        if (a.max > MAX_BAND_RATIO) {
            console.log('  ! %s ignorée : bande de %s %%, trop large pour être sûre',
                a.name, (a.max * 100).toFixed(1));
            continue;
        }

        const input = fs.readFileSync(a.file);
        const meta = await sharp(input).metadata();
        const sx = meta.width / SAMPLE;
        const sy = meta.height / SAMPLE;

        // Pas de marge de sécurité : combinée au rééchantillonnage en 200×200, qui floute déjà
        // les transitions, elle laissait un filet de plusieurs pixels réels sur chaque bord —
        // filet parfaitement visible au zoom, où l'illustration est affichée en `contain`.
        const left = Math.max(0, Math.round(a.m.left * sx));
        const top = Math.max(0, Math.round(a.m.top * sy));
        const right = Math.max(0, Math.round(a.m.right * sx));
        const bottom = Math.max(0, Math.round(a.m.bottom * sy));
        const w = meta.width - left - right;
        const h = meta.height - top - bottom;

        // Recadrage en CARRÉ après rognage : toutes les illustrations partagent le même
        // gabarit 1:1, et `cover` s'appuie dessus pour rogner symétriquement les côtés.
        const side = Math.min(w, h);
        const buf = await sharp(input)
            .extract({ left, top, width: w, height: h })
            .resize(side, side, { fit: 'cover', position: 'centre' })
            .jpeg({ quality: 90, mozjpeg: true })
            .toBuffer();

        // Écriture via un fichier temporaire : sharp garde un descripteur ouvert sur la
        // source, et Windows refuse alors de la réécrire en place.
        const tmp = a.file + '.tmp';
        fs.writeFileSync(tmp, buf);
        fs.renameSync(tmp, a.file);

        console.log('  ✓ %s  rogné h%d b%d g%d d%d → %d×%d',
            a.name.padEnd(38), top, bottom, left, right, side, side);
    }

    console.log('\nRelancez avec --check pour vérifier qu\'il ne reste plus de marge.');
}

run().catch(err => { console.error(err); process.exit(1); });
