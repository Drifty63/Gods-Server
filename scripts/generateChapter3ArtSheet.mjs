/**
 * Produit la feuille de correspondance des illustrations d'UN combat du mode Histoire.
 *
 *     node scripts/generateChapter3ArtSheet.mjs ch3-combat1.csv
 *     node scripts/generateChapter3ArtSheet.mjs ch3-combat2.csv --prefix=ch3_battle2
 *
 * `generateStoryArtSheet.mjs` sort les 60 illustrations de toute la campagne : demander à
 * quelqu'un de retrouver dix lignes là-dedans, c'est demander une erreur. Celle-ci ne sort que
 * les scènes d'un combat, dans l'ordre où le joueur les traverse.
 *
 * Comme pour les cartes, ce n'est pas un script qui décide quelle image va où mais l'auteur : le
 * rôle de la feuille est de rendre le choix DÉCIDABLE. Chaque ligne porte donc le RÉSUMÉ de la
 * scène et sa première réplique — « le quai du Pirée à l'aube » se reconnaît dans un dossier
 * d'images, `combat1_departure.png` beaucoup moins.
 *
 * Tout est lu dans campaign.ts et les dialogues : aucun nom de fichier, aucun ordre de scène
 * n'est recopié ici. Une feuille recopiée à la main finit toujours par décrire un état passé.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const out = process.argv[2] ?? 'ch3-combat1.csv';
const prefix = (process.argv.find(a => a.startsWith('--prefix=')) ?? '--prefix=ch3_battle1')
    .replace('--prefix=', '');

const campaign = fs.readFileSync(path.join(ROOT, 'src/data/story/campaign.ts'), 'utf8');

/*
 * Les événements du combat, dans l'ordre du fichier.
 *
 * Lus sur le texte source plutôt qu'en important le module : campaign.ts est du TypeScript avec
 * des alias `@/`, qu'un script Node ne résout pas sans outillage. Les trois champs cherchés sont
 * sur des lignes voisines et toujours dans le même ordre, ce qui suffit ici.
 */
const events = [];
const re = new RegExp(
    `id: '(${prefix}[a-z0-9_]*)',\\s*\\r?\\n`
    + `\\s*type: '(\\w+)',\\s*\\r?\\n`
    + `\\s*dialogues: ([A-Z0-9_]+|\\[\\]),\\s*\\r?\\n`
    + `\\s*backgroundImage: '([^']+)'`,
    'g',
);
for (const m of campaign.matchAll(re)) {
    events.push({ id: m[1], type: m[2], dialogues: m[3], image: m[4] });
}

if (events.length === 0) {
    console.error(`Aucun événement trouvé pour le préfixe « ${prefix} ».`);
    console.error("Vérifiez que chaque événement porte bien un `backgroundImage`.");
    process.exit(1);
}

/*
 * Première réplique de chaque scène, pour situer l'image.
 *
 * Extraite du texte source des dialogues, là encore : c'est la ligne que le joueur lit en voyant
 * le fond apparaître, donc la meilleure description possible de ce que l'image doit montrer.
 */
const dialogueSources = ['src/data/story/chapter3Dialogues.ts', 'src/data/story/dialogues.ts']
    .map(p => fs.readFileSync(path.join(ROOT, p), 'utf8'))
    .join('\n');

function firstLineOf(constName) {
    if (constName === '[]') return '';
    const block = dialogueSources.split(`export const ${constName}`)[1];
    if (!block) return '';
    const m = block.match(/text: "((?:[^"\\]|\\.)*)"/);
    if (!m) return '';
    // Les indications de jeu entre astérisques ne décrivent pas le décor : on garde la réplique.
    return m[1].replace(/\*[^*]*\*/g, '').replace(/\s+/g, ' ').trim();
}

/** Ce que chaque fichier doit montrer, tel que le décrit le commentaire de campaign.ts. */
const briefs = new Map();
for (const line of campaign.split(/\r?\n/)) {
    const m = line.match(/^\s*\*\s+(combat\d+_[a-z0-9_]+\.png)\s+—\s+(.*)$/);
    if (m) briefs.set(m[1], m[2].trim());
    else {
        // Les descriptions courent sur plusieurs lignes, alignées sous la première.
        const cont = line.match(/^\s*\*\s{20,}(\S.*)$/);
        if (cont && briefs.size > 0) {
            const last = [...briefs.keys()].pop();
            briefs.set(last, `${briefs.get(last)} ${cont[1].trim()}`);
        }
    }
}

/*
 * Une ligne par FICHIER, et non par événement.
 *
 * Plusieurs scènes voisines partagent parfois un fond — l'événement de combat reprend celui de
 * l'embuscade, puisque c'est la même scène qui continue. Sans ce regroupement, la feuille
 * réclamerait onze images pour dix fichiers, et laisserait croire qu'il en manque une.
 */
const rows = [];
const seen = new Map();
events.forEach((e, i) => {
    const file = path.basename(e.image);
    /*
     * La victoire et la défaite ne sont pas « les scènes 10 et 11 » : ce sont deux issues dont
     * le joueur n'en verra qu'une. Les numéroter à la suite laisserait croire qu'elles
     * s'enchaînent, et donc qu'on illustre une fin de séquence en deux temps.
     */
    const moment = e.id.endsWith('_win') ? 'écran de VICTOIRE'
        : e.id.endsWith('_lose') ? 'écran de DÉFAITE'
            : e.type === 'battle' ? 'le combat'
                : `scène ${i + 1}`;

    const at = seen.get(e.image);
    if (at !== undefined) { rows[at][2] += ` + ${moment}`; return; }

    seen.set(e.image, rows.length);
    rows.push([
        '',                                  // 0 — À REMPLIR : le nom du fichier fourni
        e.image,                             // 1 — destination lue dans le code
        moment,
        briefs.get(file) ?? '',              // 3 — ce que l'image doit montrer
        firstLineOf(e.dialogues),            // 4 — la première réplique de la scène
        '941 x 1672 px (portrait)',
    ]);
});

const esc = v => `"${String(v).replace(/"/g, '""')}"`;
const header = [
    'VOTRE FICHIER (nom actuel)', 'Fichier attendu', 'Moment',
    'Ce que l\'image doit montrer', 'Premiere replique de la scene', 'Taille conseillee',
];
const csv = [header, ...rows].map(r => r.map(esc).join(';')).join('\r\n');
fs.writeFileSync(path.join(ROOT, out), '﻿' + csv, 'utf8');

console.log(`${rows.length} illustrations → ${out}`);
for (const r of rows) {
    const present = fs.existsSync(path.join(ROOT, 'public', r[1]));
    console.log(`  ${present ? 'ok     ' : 'MANQUE '} ${r[1]}`);
}
