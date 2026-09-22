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
 * Ce qui est pré-rempli, et pourquoi :
 *  - l'unité, son dieu et sa catégorie, lus dans le bestiaire cible ;
 *  - les PV et le coût en Duel, standards par catégorie (voir STATS) ;
 *  - les cinq rôles de sort, parce que TOUTES les unités existantes en ont exactement cinq :
 *    deux générateurs, deux compétences, un utilitaire ;
 *  - les coûts et gains d'énergie habituels de chaque rôle.
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
 * éviter — plusieurs cartes existantes en vivent.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const out = process.argv[2] ?? 'unites-mecaniques.csv';

/**
 * Bestiaire cible, deux unités par dieu.
 *
 * `servant` est l'unité de troupe — celle qui tire sa force du nombre ; `creature` est la bête
 * ou le héros nommé. C'est la répartition qu'ont déjà les six unités publiées : Soldats d'Arès
 * et Chevaliers d'Athéna côté serviteurs, Dragon de Thèbes et Arachné côté créatures.
 *
 * `done: true` = déjà en jeu, la ligne n'est pas émise.
 */
const BESTIARY = [
    ['Arès', 'Soldats d\'Arès', 'servant', true],
    ['Arès', 'Dragon de Thèbes', 'creature', true],
    ['Athéna', 'Chevaliers d\'Athéna', 'servant', true],
    ['Athéna', 'Arachné', 'creature', true],
    ['Hestia', 'Ulysse', 'creature', true],
    ['Hestia', 'Feu follet', 'servant', false],
    ['Poséidon', 'Cyclopes', 'servant', false],
    ['Poséidon', 'Méduse', 'creature', false],
    ['Hadès', 'Démons du Tartare', 'servant', false],
    ['Hadès', 'Cerbère', 'creature', false],
    ['Aphrodite', 'Serviteurs d\'Aphrodite', 'servant', false],
    ['Aphrodite', 'Achille', 'creature', false],
    ['Apollon', 'Oracle de Delphes', 'servant', false],
    ['Apollon', 'Python', 'creature', false],
    ['Dionysos', 'Satyres', 'servant', false],
    ['Dionysos', 'Chiron', 'creature', false],
    ['Zeus', 'Garde céleste', 'servant', false],
    ['Zeus', 'Harpies', 'creature', false],
    ['Artémis', 'Chiens de chasse', 'servant', false],
    ['Artémis', 'Actéon', 'creature', false],
    ['Nyx', 'Occultiste', 'servant', false],
    ['Nyx', 'Les Érinyes', 'creature', false],
    ['Déméter', 'Sirènes', 'servant', false],
    ['Déméter', 'Minotaure', 'creature', false],
];

/**
 * Valeurs de départ par catégorie, relevées sur les unités existantes.
 *
 * 16 PV / 2 points pour un serviteur : c'est exactement le Soldat d'Arès, le Chevalier
 * d'Athéna et l'Araignée Géante. Les créatures vont de 21 à 26 PV pour 3 points — le Dragon
 * de Thèbes est à 26, Arachné à 22. La valeur posée ici est un POINT DE DÉPART à corriger.
 */
const STATS = {
    servant: { hp: 16, cost: 2 },
    creature: { hp: 22, cost: 3 },
};

/**
 * Les cinq rôles de sort, dans l'ordre où toutes les unités existantes les déclarent.
 *
 * Les générateurs ne coûtent rien et rapportent l'énergie ; les compétences la dépensent ;
 * l'utilitaire protège ou manipule. Les coûts posés ici sont les plus fréquents, pas une règle.
 */
const ROLES = [
    ['Générateur 1', 0, 1, 'Frappe faible et large — souvent 1 dégât à tous les ennemis'],
    ['Générateur 2', 0, 1, 'Frappe simple et ciblée — souvent 3 dégâts à un ennemi'],
    ['Compétence 1', 1, 0, 'Le coup signature, bon marché'],
    ['Compétence 2', 3, 0, 'Le coup lourd, celui qui coûte cher'],
    ['Utilitaire', 1, 0, 'Bouclier, provocation, soin, état — ce qui n\'est pas de l\'attaque'],
];

const rows = [];
for (const [god, unit, category, done] of BESTIARY) {
    if (done) continue;
    const s = STATS[category];
    const label = category === 'servant' ? 'serviteur' : 'créature';
    for (const [role, cost, gain, hint] of ROLES) {
        rows.push([
            unit, god, label, s.hp, s.cost,
            '', '',          // élément, faiblesse — à remplir
            role, '',        // nom du sort — à remplir
            cost, gain,
            '',              // effet — à remplir
            hint,
        ]);
    }
}

const header = [
    'Unité', 'Dieu', 'Catégorie', 'PV', 'Coût Duel',
    'Élément', 'Faiblesse',
    'Rôle du sort', 'Nom du sort', 'Coût énergie', 'Gain énergie',
    'Effet (en français simple)', 'Indication',
];

const esc = v => `"${String(v).replace(/"/g, '""')}"`;
const csv = [header, ...rows].map(r => r.map(esc).join(';')).join('\r\n');
fs.writeFileSync(path.join(ROOT, out), '﻿' + csv, 'utf8');

const units = new Set(rows.map(r => r[0]));
console.log(`${units.size} unités à créer, ${rows.length} sorts à décrire`);
console.log(`écrit dans ${out}`);
console.log('');
for (const [god, unit, category, done] of BESTIARY) {
    if (done) continue;
    console.log(`  ${god.padEnd(10)} ${unit.padEnd(24)} ${category === 'servant' ? 'serviteur' : 'créature'}`);
}
