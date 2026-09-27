/**
 * Produit la feuille de REMPLACEMENT des illustrations déjà en jeu.
 *
 *     node scripts/generateArtReplacementSheet.mjs remplacements-illustrations.csv
 *
 * À ne pas confondre avec `generateUnitArtSheet.mjs`, qui commande les images d'unités qui
 * n'existent pas encore. Celle-ci sert à REMPLACER une illustration livrée par une meilleure :
 * la destination est donc déjà connue du code, et c'est la SOURCE qui reste à renseigner.
 *
 * Les cartes sont désignées par leur NOM, tel que l'auteur les nomme quand il valide une image —
 * personne ne retient `garde_celeste_generator_2`. La correspondance nom -> identifiant est
 * faite ici, contre les données réelles, plutôt qu'à la main : plusieurs noms se ressemblent
 * d'une unité à l'autre, et un homonyme non détecté ferait livrer l'image sur la mauvaise carte.
 *
 * Un nom introuvable ou porté par deux cartes ARRÊTE le script. Une ligne approximative dans
 * cette feuille se paie en illustration posée au mauvais endroit, ce qu'aucun test ne rattrape.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const out = process.argv[2] ?? 'remplacements-illustrations.csv';

/** Dossier où l'auteur range les versions validées. */
const VALIDATED = 'C:/Users/beber/.codex/generated_images/01a0881b-a5c4-72b1-abeb-547f48835e6d/Images ok pas en ligne';

/**
 * Les 18 cartes refaites. `unit` sert à lever l'ambiguïté quand deux cartes portent le même
 * nom ; il est comparé au nom de l'unité propriétaire, accents et casse ignorés.
 */
const WANTED = [
    ['Athéna', 'Serres acérées'],
    ['Chiron', 'Tir anatomique'],
    ['Harpie', 'Serres lacérantes'],
    ['Déméter', 'Moisson'],
    ['Oracle de Delphes', 'Destin contrarié'],
    ['Ulysse', 'Coup Étourdissant'],
    ['Oracle de Delphes', 'Tir prémonitoire'],
    ['Dragon de Thèbes', 'Morsure du Dragon'],
    ['Méduse', 'Regard perçant'],
    ['Occultiste de Nyx', 'Sceau du silence'],
    ['Cerbère', 'Triple morsure'],
    ['Oracle de Delphes', 'Braise sacrée'],
    ["Chevalier d'Athéna", 'Ralliement Divin'],
    ['Garde céleste', 'Pointe olympienne'],
    ['Artémis', "Flèche d'Exécution"],
    ['Feu follet', 'Danse des étincelles'],
    ['Achille', 'Revers du bouclier'],
    ["Serviteur d'Aphrodite", 'Étreinte envoûtante'],
];

/** Comparaison indulgente : accents, casse, apostrophes et espaces multiples ignorés. */
const norm = s => s
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, "'")
    .toLowerCase().replace(/\s+/g, ' ').trim();

/*
 * Les données sont en TypeScript avec des alias `@/` : Node ne sait pas les charger seul, mais
 * Vitest porte déjà cette configuration. On s'appuie dessus plutôt que d'en recréer une.
 */
const TMP = path.join(ROOT, 'src', '__tests__', '_art_dump.test.ts');
fs.writeFileSync(TMP, [
    "import { it } from 'vitest';",
    "import { ALL_SPELLS } from '@/data/spells';",
    "import { ALL_GODS } from '@/data/gods';",
    "it('dump', () => {",
    '    const rows = ALL_SPELLS.map(s => {',
    '        const owner = ALL_GODS.find(g => g.id === s.godId);',
    "        return [s.id, s.name, owner?.name ?? s.godId, s.imageUrl].join('\\u0001');",
    '    });',
    "    console.log('ART_START' + rows.join('\\u0002') + 'ART_END');",
    '});',
    '',
].join('\n'), 'utf8');

let raw;
try {
    raw = execFileSync('npx.cmd', ['vitest', 'run', 'src/__tests__/_art_dump.test.ts'], {
        cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: true,
    });
} finally {
    fs.unlinkSync(TMP);
}

const m = raw.match(/ART_START([\s\S]*)ART_END/);
if (!m) throw new Error('extraction des sorts impossible');

const SPELLS = m[1].split('\u0002').map(r => {
    const [id, name, owner, imageUrl] = r.split('\u0001');
    return { id, name, owner, imageUrl };
});

const problems = [];
const rows = WANTED.map(([unit, name]) => {
    let found = SPELLS.filter(s => norm(s.name) === norm(name));

    // Le nom seul suffit presque toujours ; l'unité ne sert qu'à départager les homonymes.
    if (found.length > 1) {
        const narrowed = found.filter(s => norm(s.owner).startsWith(norm(unit))
            || norm(s.owner).includes(norm(unit)));
        if (narrowed.length) found = narrowed;
    }

    if (found.length === 0) { problems.push(`INTROUVABLE : ${unit} — ${name}`); return null; }
    if (found.length > 1) {
        problems.push(`AMBIGU : ${unit} — ${name} → ${found.map(s => s.id).join(', ')}`);
        return null;
    }

    const s = found[0];
    const abs = path.join(ROOT, 'public', s.imageUrl.replace(/^\//, ''));
    return [
        s.owner,
        s.name,
        s.imageUrl,
        fs.existsSync(abs) ? 'oui' : 'NON — destination absente',
        '',
    ];
}).filter(Boolean);

if (problems.length) {
    console.error('Rien n’est écrit tant que ces lignes ne sont pas levées :');
    problems.forEach(p => console.error('  ' + p));
    process.exit(1);
}

const esc = v => `"${String(v).replace(/"/g, '""')}"`;
const header = [
    'Personnage', 'Nom de la carte', 'Image actuelle dans le projet',
    'Destination existante', 'NOUVELLE IMAGE (chemin complet, à remplir)',
];
fs.writeFileSync(
    path.join(ROOT, out),
    '\ufeff' + [header, ...rows].map(r => r.map(esc).join(';')).join('\r\n'),
    'utf8',
);

console.log(`${rows.length} cartes résolues, écrites dans ${out}`);
console.log('');
console.log('Dossier des versions validées :');
console.log('  ' + VALIDATED);
if (fs.existsSync(VALIDATED)) {
    console.log(`  ${fs.readdirSync(VALIDATED).filter(f => /\.png$/i.test(f)).length} fichiers PNG disponibles`);
} else {
    console.log('  (dossier introuvable depuis ici)');
}
