/**
 * Produit la feuille de correspondance des illustrations du mode Histoire.
 *
 *     node scripts/generateStoryArtSheet.mjs illustrations-histoire.csv
 *
 * Même principe que pour les cartes : ce n'est pas un script qui décide quelle image va où, mais
 * l'auteur. Le rôle de la feuille est de rendre ce choix DÉCIDABLE — pour les sorts, c'était
 * l'effet exact ; ici, c'est le contexte narratif. « L'image du chapitre 2, combat contre le
 * Dragon, écran de victoire » se reconnaît ; `ch2_dragon_victory.png` beaucoup moins.
 *
 * Trois sources, parce que les images de l'Histoire ne vivent pas au même endroit :
 *  - `campaign.ts` : les fonds de scène, portés par `backgroundImage` sur chaque événement ;
 *  - `story/battle/page.tsx` : les écrans de victoire et de défaite, choisis par identifiant de
 *    combat dans une cascade de `if` ;
 *  - les CSS de page : les fonds d'écran fixes (boutique, profil, accueil de l'Histoire).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const out = process.argv[2] ?? 'illustrations-histoire.csv';

/** Une ligne de la feuille. La première colonne reste vide : c'est celle qu'on remplit. */
const rows = [];
const seen = new Map();

function add(file, kind, context, details, size) {
    const existing = seen.get(file);
    if (existing !== undefined) {
        // Une même image sert parfois deux scènes voisines : on complète la ligne plutôt que
        // de la dupliquer, sinon l'auteur croit devoir fournir deux illustrations.
        if (!rows[existing][3].includes(context)) rows[existing][3] += ` + ${context}`;
        return;
    }
    seen.set(file, rows.length);
    rows.push(['', file, kind, context, details, size]);
}

/*
 * Ordre volontaire : les écrans de fin sont enregistrés AVANT les fonds de scène.
 *
 * Plusieurs images servent aux deux — l'illustration de victoire d'un combat est réutilisée
 * comme décor du dialogue qui suit. Une image n'occupant qu'une ligne, c'est le premier
 * enregistrement qui la nomme : « Écran de VICTOIRE — chapitre 2, Arachné » se reconnaît
 * beaucoup mieux que « Fond de scène (Dialogue) · ch2_apres_arachne ».
 */

// -- 2. Ecrans de victoire et de defaite ------------------------------------
/*
 * Table TRANSCRITE depuis `src/app/story/battle/page.tsx`, et non analysée.
 *
 * Ces images sont choisies par une cascade de `if` sur l'identifiant du combat. Lire du TSX à
 * l'expression régulière pour la reconstituer donnait des résultats faux — un libellé de bouton
 * se faisait prendre pour un chemin de fichier. Recopier huit lignes une fois vaut mieux qu'un
 * analyseur approximatif : si la cascade change, `checkCardArt` signalera l'écart.
 */
const OUTCOMES = [
    ['battle_athens_temple', 'Chapitre 2, combat 4 — Temple d’Athéna',
        '/story/chapter2/combat4_victory.png', '/story/chapter2/combat4_defeat.png'],
    ['battle_arachne', 'Chapitre 2, combat 3 — Arachné',
        '/assets/story/ch2_arachne_victory.png', '/assets/story/ch2_arachne_defeat.png'],
    ['battle_dragon_thebes', 'Chapitre 2, combat 2 — Le Dragon de Thèbes',
        '/assets/story/ch2_dragon_victory.png', '/assets/story/ch2_dragon_defeat.png'],
    ['battle_thebes_betrayal', 'Chapitre 2, combat 1 — La Trahison de Thèbes',
        '/assets/story/chapter2_battle1_victory.png', '/assets/story/ch2_battle1_defeat_v2.png'],
    ['battle_ambush_ares', 'Chapitre 1, combat 4 — Zeus + Déméter + Artémis contre Arès et ses soldats',
        '/assets/story/battle4_victory.png', '/assets/story/battle4_defeat_v2.png'],
    ['battle_test_of_valor', 'Chapitre 1, combat 3 — Zeus + Hestia contre Déméter et Artémis',
        '/assets/story/battle3_victory.png', '/assets/story/battle3_defeat.png'],
    ['battle_zeus_hestia_vs_ares', 'Chapitre 1, combat 2 — Zeus + Hestia contre Arès',
        '/assets/story/battle2_victory.png', '/assets/story/battle2_defeat.png'],
    ['battle_zeus_vs_hades', 'Chapitre 1, combat 1 — Zeus contre Hadès (cas par défaut)',
        '/assets/story/battle1_victory_v2.png', '/assets/story/battle1_defeat.png'],
];

for (const [, label, victory, defeat] of OUTCOMES) {
    add(victory, 'Écran de VICTOIRE', label, 'Affiché quand le joueur gagne ce combat', '941 x 1672 px (portrait)');
    add(defeat, 'Écran de DÉFAITE', label, 'Affiché quand le joueur perd ce combat', '941 x 1672 px (portrait)');
}

// ── 1. Fonds de scène, depuis campaign.ts ────────────────────────────────────
const campaign = fs.readFileSync(path.join(ROOT, 'src/data/story/campaign.ts'), 'utf8').split(/\r?\n/);

let chapter = '?';
let comment = '';
let eventId = '';
let eventType = '';
let battleName = '';

for (const line of campaign) {
    const t = line.trim();

    // Le chapitre se lit dans l'IDENTIFIANT de l'événement (`ch1_`, `ch2_`), et non dans le nom
    // de la constante qui l'entoure : les événements d'un même chapitre sont répartis sur
    // plusieurs tableaux, et suivre les déclarations donnait de faux numéros de chapitre.
    const chap = t.match(/^id:\s*'ch(\d+)_/);
    if (chap) chapter = `Chapitre ${chap[1]}`;

    if (t.startsWith('//')) { comment = t.replace(/^\/+\s*/, ''); continue; }

    const id = t.match(/^id:\s*'([^']+)'/);
    if (id) { eventId = id[1]; battleName = ''; }

    const ty = t.match(/^type:\s*'([^']+)'/);
    if (ty) eventType = ty[1];

    const nm = t.match(/^name:\s*["']([^"']+)["']/);
    if (nm) battleName = nm[1];

    const img = t.match(/backgroundImage:\s*'([^']+)'/);
    if (img) {
        const kind = eventType === 'battle' ? 'Combat' : eventType === 'dialogue' ? 'Dialogue' : 'Scène';
        const details = [battleName, comment].filter(Boolean).join(' — ') || eventId;
        add(img[1], `Fond de scène (${kind})`, `${chapter} · ${eventId}`, details, '941 x 1672 px (portrait)');
    }
}

// ── 3. Portrait du narrateur ─────────────────────────────────────────────────
add('/cards/gods/narrator.png', 'Portrait', 'Narrateur',
    'Visage affiché quand le récit parle sans interlocuteur', '640 x 640 px');

// ── 4. Fonds de page demandés ────────────────────────────────────────────────
/*
 * Rôle de chaque fond, TRANSCRIT depuis les CSS.
 *
 * Une première version balayait chaque feuille de style et étiquetait tout ce qu'elle y trouvait
 * du nom de la page. C'était faux pour le mode Histoire : son CSS déclare trois images de rôles
 * très différents, et les trois se retrouvaient annoncées comme « fond de la page d'accueil ».
 * Or `olympus_storm` n'est pas un fond de page — c'est le DÉCOR PAR DÉFAUT des scènes qui n'ont
 * pas d'illustration dédiée, celui qu'on voit le plus souvent sans jamais l'avoir choisi.
 *
 * Une étiquette fausse est pire qu'une étiquette absente : elle fait fournir la mauvaise image.
 */
const PAGE_BACKGROUNDS = [
    ['/backgrounds/shop_bg.png', 'Fond de page',
        'Boutique', 'Fond plein écran de la boutique'],
    ['/assets/profile_background.png', 'Fond de page',
        'Profil', 'Fond plein écran de la page de profil'],
    ['/assets/story/library_background.png', 'Fond de page',
        'Accueil du mode Histoire', 'Fond plein écran de la page qui liste les chapitres'],
    ['/assets/story/olympus_storm.png', 'Décor PAR DÉFAUT',
        'Scènes sans illustration dédiée',
        'Affiché dès qu’une scène n’a pas d’image à elle — c’est le décor le plus vu du mode'],
    ['/assets/story/narrator_backdrop.png', 'Décor PAR DÉFAUT',
        'Scènes du narrateur sans illustration dédiée',
        'Affiché quand le récit parle et que la scène n’a pas d’image à elle'],
];

for (const [file, kind, context, details] of PAGE_BACKGROUNDS) {
    add(file, kind, context, details, '941 x 1672 px (portrait)');
}

// ── Écriture ─────────────────────────────────────────────────────────────────
const esc = v => `"${String(v).replace(/"/g, '""')}"`;
const header = ['VOTRE FICHIER (nom actuel)', 'Fichier attendu', 'Type', 'Contexte', 'Details', 'Taille conseillee'];
const csv = [header, ...rows].map(r => r.map(esc).join(';')).join('\r\n');
fs.writeFileSync(path.join(ROOT, out), '﻿' + csv, 'utf8');

const missing = rows.filter(r => !fs.existsSync(path.join(ROOT, 'public', r[1])));
console.log(`${rows.length} illustrations`);
for (const [kind, n] of Object.entries(
    rows.reduce((acc, r) => ({ ...acc, [r[2]]: (acc[r[2]] ?? 0) + 1 }), {}),
)) console.log(`  ${String(n).padStart(3)}  ${kind}`);
console.log(`  absentes du disque : ${missing.length}`);
for (const m of missing) console.log(`    MANQUE ${m[1]}`);
