/**
 * Produit la feuille des ILLUSTRATIONS attendues pour les unités restantes.
 *
 *     node scripts/generateUnitArtSheet.mjs illustrations-unites.csv
 *
 * Six images par unité : un portrait et cinq sorts. Dix-neuf unités, donc 114 fichiers.
 *
 * La feuille se REMPLIT TOUTE SEULE à mesure que `unites-mecaniques.csv` se remplit : si le
 * nom et l'effet d'un sort y sont écrits, ils apparaissent ici comme consigne de dessin. Sinon
 * la ligne retombe sur le rôle du sort. Relancer le script après avoir avancé les mécaniques
 * donne donc une feuille plus précise, aux mêmes destinations.
 *
 * ── POURQUOI LES NOMS DE FICHIERS NE SUIVENT PAS L'ANCIENNE CONVENTION ────────────────────
 *
 * Les sorts déjà en jeu portent un nom tiré de leur titre : `spell_arachne_toile.png` pour
 * « Toile Mortelle ». C'est joli et c'est un piège — renommer un sort obligerait à renommer
 * son image, donc à la relivrer. Les nouveaux sorts prennent leur RÔLE :
 * `spell_meduse_skill_1.png`. Le nom du sort peut alors changer autant de fois qu'il le faut
 * sans qu'aucun fichier ne bouge.
 */
import fs from 'node:fs';
import path from 'node:path';
import { MISSING, ROLES, STATS, toCsv } from './_units.mjs';
import { readCsvRows, looksMisencoded } from './_csv.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const out = process.argv[2] ?? 'illustrations-unites.csv';
const MECA = path.join(ROOT, 'unites-mecaniques.csv');

/**
 * Relit la feuille des mécaniques, si elle existe, pour en tirer le nom et l'effet des sorts.
 *
 * Passe par `parseCsv`, qui suit la vraie grammaire CSV. La feuille est remplie à la main dans
 * un tableur, et au ré-enregistrement celui-ci décide seul de ce qu'il guillemette : un
 * découpage naïf se décalerait d'une colonne à la première cellule non guillemetée, sans rien
 * signaler.
 */
function readMechanics() {
    // Alerte d'encodage : un tableur ré-enregistré en Europe occidentale au lieu d'UTF-8 reste
    // parfaitement lisible, mais « Pétrification » y est devenu « PÃ©trification ». Rien
    // n'échoue — c'est le jeu qui affichera plus tard des noms abîmés. Mieux vaut le dire ici.
    if (fs.existsSync(MECA) && looksMisencoded(fs.readFileSync(MECA, 'utf8'))) {
        console.error('ATTENTION : unites-mecaniques.csv ne semble pas être en UTF-8 — les accents');
        console.error('sont abîmés. Rouvrez-le dans le tableur et ré-enregistrez en Unicode (UTF-8).');
        console.error('');
    }

    /*
     * Appariement par ORDRE, pas par nom.
     *
     * L'auteur renomme les unités en remplissant — « Cyclopes » est devenu « Cyclope »,
     * « Les Érinyes » « Érinye ». C'est son droit : la feuille fait foi pour les noms. Mais
     * une correspondance par nom aurait alors échoué en silence, et les consignes de dessin
     * seraient restées génériques sans que personne ne comprenne pourquoi.
     *
     * L'ordre, lui, ne bouge pas : cinq lignes par unité, les unités dans l'ordre du
     * bestiaire. C'est donc lui qui relie une ligne à son identifiant de fichier.
     */
    const groups = [];
    for (const c of readCsvRows(fs, MECA)) {
        const [unit, , , hp, cost, element, weakness, roleLabel, spellName, , , effect] = c;
        if (!unit || !roleLabel) continue;
        let group = groups[groups.length - 1];
        if (!group || group.name !== unit) {
            group = { name: unit, hp, cost, element, weakness, spells: new Map() };
            groups.push(group);
        }
        group.spells.set(roleLabel, { spellName, effect });
    }

    if (groups.length && groups.length !== MISSING.length) {
        console.error(`ATTENTION : ${groups.length} unités dans les mécaniques, ${MISSING.length} attendues.`);
        console.error("L'appariement se fait par ORDRE : une unité ajoutée ou retirée décale tout.");
        console.error('');
    }
    return groups;
}

const meca = readMechanics();
const rows = [];
let known = 0;

MISSING.forEach((unit, index) => {
    const stat = STATS[unit.category];
    const filled = meca[index];

    // La feuille fait foi : son nom, ses PV et son élément l'emportent sur les valeurs de
    // départ du bestiaire, qui n'étaient qu'un point de départ à corriger.
    const name = filled?.name || unit.name;
    const hp = filled?.hp || stat.hp;
    const cost = filled?.cost || stat.cost;
    const element = filled?.element ? `, élément ${filled.element}` : '';
    const weakness = filled?.weakness ? `, faible au ${filled.weakness}` : '';

    // Le portrait d'abord : c'est lui qui donne le visage de l'unité, et les cinq sorts
    // doivent ensuite lui ressembler.
    rows.push([
        '',
        `/cards/gods/${unit.id}.png`,
        'Portrait',
        `${name} — ${stat.label} de ${unit.god}`,
        `Le visage de l'unité. ${hp} PV, ${cost} points en Duel${element}${weakness}.`,
        '640 x 640 px',
    ]);

    for (const role of ROLES) {
        const m = filled?.spells.get(role.label);
        const named = m?.spellName ? ` « ${m.spellName} »` : '';
        if (m?.spellName) known++;
        rows.push([
            '',
            `/cards/spells/spell_${unit.id}_${role.slug}.png`,
            'Sort',
            `${name} · ${role.label}${named}`,
            m?.effect || role.hint,
            '640 x 640 px',
        ]);
    }
});

const header = [
    'VOTRE FICHIER (nom actuel)', 'Fichier attendu', 'Type',
    'Contexte', 'Ce que l\'image doit montrer', 'Taille conseillee',
];

fs.writeFileSync(path.join(ROOT, out), toCsv([header, ...rows]), 'utf8');

console.log(`${MISSING.length} unités · ${rows.length} images attendues`);
console.log(`  ${MISSING.length} portraits + ${MISSING.length * ROLES.length} sorts`);
console.log(`écrit dans ${out}`);

if (meca.length === 0) {
    console.log('');
    console.log('unites-mecaniques.csv absent : les consignes de dessin restent génériques.');
} else {
    console.log('');
    console.log(`sorts déjà nommés dans les mécaniques : ${known} / ${MISSING.length * ROLES.length}`);
    if (known < MISSING.length * ROLES.length) {
        console.log('Relancer ce script après avoir avancé les mécaniques enrichira les consignes.');
    }
}

// Contrôle : aucune destination en double. Deux unités qui partageraient un identifiant
// s'écraseraient l'une l'autre au moment de l'import, sans le moindre avertissement.
const dests = rows.map(r => r[1]);
const dupes = dests.filter((d, i) => dests.indexOf(d) !== i);
if (dupes.length) {
    console.error('');
    console.error('DESTINATIONS EN DOUBLE : ' + [...new Set(dupes)].join(', '));
    process.exit(1);
}
