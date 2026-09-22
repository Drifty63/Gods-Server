/**
 * Produit le tableur des MÉCANIQUES des unités restantes (créatures et serviteurs).
 *
 *     node scripts/generateUnitSheet.mjs unites-mecaniques.csv
 *
 * Même principe que les feuilles d'illustrations : ce n'est pas un script qui invente le
 * contenu, c'est l'auteur. Le rôle de la feuille est de rendre le remplissage MÉCANIQUE —
 * une ligne par sort, les valeurs déductibles déjà posées, et seulement les cases qui
 * demandent une décision laissées vides.
 *
 * Ce qui est pré-rempli : l'unité, son dieu, sa catégorie, ses PV et son coût en Duel, les
 * cinq rôles de sort et leurs coûts d'énergie habituels — parce que TOUTES les unités déjà
 * publiées suivent le même moule : exactement cinq sorts, dans le même ordre.
 *
 * Ce qui reste à remplir : l'élément, la faiblesse, le nom de chaque sort, et son effet en
 * français simple.
 *
 * ── VOCABULAIRE QUE LE MOTEUR SAIT EXÉCUTER ───────────────────────────────────────────────
 *
 * Effets      : damage (dégâts), heal (soin), shield (bouclier), status (état), energy,
 *               draw (piocher), discard (défausser), mill (meule).
 * États       : stun (étourdi), poison, provocation (force à être ciblé), regen, untargetable.
 * Cibles      : enemy_god (un ennemi), all_enemies, ally_god, all_allies, self, any_god,
 *               same (la même cible que l'effet précédent), dead_ally_god, enemy_hand.
 * Éléments    : fire, water, earth, air, lightning, light, darkness.
 *
 * Tout ce qui sort de cette liste est un effet « custom » : faisable, mais il demande du code
 * de moteur écrit à la main pour cette carte-là. À signaler dans la colonne Effet, pas à
 * éviter — 51 effets existants sont déjà de ce type.
 */
import fs from 'node:fs';
import path from 'node:path';
import { MISSING, ROLES, STATS, toCsv } from './_units.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const out = process.argv[2] ?? 'unites-mecaniques.csv';
const FORCE = process.argv.includes('--force');
const dest = path.join(ROOT, out);

/**
 * GARDE-FOU : ne jamais écraser un tableur déjà rempli.
 *
 * Ce script écrit un fichier que l'auteur remplit ensuite à la main, parfois sur plusieurs
 * jours. Le relancer par réflexe effacerait tout sans prévenir. On regarde donc si une seule
 * des colonnes à remplir porte déjà quelque chose ; si oui, on refuse et on explique.
 */
if (fs.existsSync(dest) && !FORCE) {
    const lines = fs.readFileSync(dest, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
    const filled = lines.slice(1).filter(line => {
        const c = line.split('";"').map(v => v.replace(/^"|"$/g, '').trim());
        // Élément, faiblesse, nom du sort, effet : les quatre colonnes de l'auteur.
        return [c[5], c[6], c[8], c[11]].some(Boolean);
    }).length;

    if (filled > 0) {
        console.error(`${out} contient déjà ${filled} ligne(s) remplie(s).`);
        console.error('Le régénérer les effacerait. Relancer avec --force si c\'est voulu.');
        process.exit(1);
    }
}

const rows = [];
for (const unit of MISSING) {
    const s = STATS[unit.category];
    for (const role of ROLES) {
        rows.push([
            unit.name, unit.god, s.label, s.hp, s.cost,
            '', '',              // élément, faiblesse — à remplir
            role.label, '',      // nom du sort — à remplir
            role.cost, role.gain,
            '',                  // effet — à remplir
            role.hint,
        ]);
    }
}

const header = [
    'Unité', 'Dieu', 'Catégorie', 'PV', 'Coût Duel',
    'Élément', 'Faiblesse',
    'Rôle du sort', 'Nom du sort', 'Coût énergie', 'Gain énergie',
    'Effet (en français simple)', 'Indication',
];

fs.writeFileSync(dest, toCsv([header, ...rows]), 'utf8');

console.log(`${MISSING.length} unités à créer, ${rows.length} sorts à décrire`);
console.log(`écrit dans ${out}`);
console.log('');
for (const u of MISSING) {
    console.log(`  ${u.god.padEnd(10)} ${u.name.padEnd(24)} ${STATS[u.category].label}`);
}
