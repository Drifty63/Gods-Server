/**
 * Produit le bloc `insert` de la table de référence `unit_catalog`, lue par les quêtes.
 *
 *     node scripts/generateUnitCatalogSql.mjs > /tmp/catalog.sql
 *
 * POURQUOI CETTE TABLE EXISTE. Les quêtes journalières sont calculées dans Postgres, à partir
 * des seuls identifiants d'unités que `report-match-result` transmet. Or « jouer avec une
 * créature » ou « jouer avec un dieu de feu » demande de savoir ce qu'EST un identifiant — une
 * information qui n'existe que dans `src/data`. Sans elle, les quêtes ne peuvent compter que
 * des parties et des victoires, ce qui donne dix quêtes qui se ressemblent toutes.
 *
 * La table est un MIROIR, jamais une source : elle se régénère à partir du code. Après tout
 * ajout ou retrait d'unité, relancer ce script et rejouer l'`insert` produit.
 *
 * Seules les cartes JOUABLES y figurent : une quête ne doit jamais demander une unité que le
 * joueur ne peut pas obtenir.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const TMP = path.join(ROOT, 'src', '__tests__', '_catalog_dump.test.ts');

/*
 * Le catalogue est extrait via Vitest plutôt qu'en important les modules directement : les
 * sources sont en TypeScript avec des alias `@/`, que Node ne sait pas résoudre seul. Vitest
 * porte déjà cette configuration, donc on s'appuie dessus au lieu d'en recréer une.
 */
fs.writeFileSync(TMP, [
    "import { it } from 'vitest';",
    "import { ALL_GODS } from '@/data/gods';",
    "it('dump', () => {",
    "    const rows = ALL_GODS.filter(g => !g.draft && !g.hidden)",
    "        .map(g => `('${g.id}','${g.category ?? 'god'}','${g.element}')`);",
    "    console.log('CATALOG_START' + rows.join(',') + 'CATALOG_END');",
    '});',
    '',
].join('\n'), 'utf8');

let out;
try {
    // `shell: true` est indispensable sous Windows : `npx.cmd` est un script de commandes, que
    // spawnSync refuse de lancer directement (EINVAL).
    out = execFileSync('npx.cmd', ['vitest', 'run', TMP.replace(ROOT + path.sep, '').replace(/\\/g, '/')], {
        cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: true,
    });
} finally {
    fs.unlinkSync(TMP);
}

const m = out.match(/CATALOG_START(.*)CATALOG_END/s);
if (!m) throw new Error('extraction du catalogue impossible');

const rows = m[1].trim().split('),(').map(r => r.replace(/^\(|\)$/g, ''));
console.log(`-- ${rows.length} cartes jouables, extraites de src/data par scripts/generateUnitCatalogSql.mjs`);
console.log('insert into public.unit_catalog (id, category, element) values');
console.log(rows.map(r => `    (${r})`).join(',\n'));
console.log('on conflict (id) do update set category = excluded.category, element = excluded.element;');
