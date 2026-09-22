/*
 * Vérifie que l'analyseur encaisse ce qu'un tableur produit réellement.
 *
 * Les quatre cas qui cassaient le découpage naïf :
 *  - cellules SANS guillemets (le cas le plus courant en sortie d'OpenOffice) ;
 *  - guillemets seulement sur les cellules « à risque », les autres nues ;
 *  - un point-virgule DANS une cellule guillemetée ;
 *  - un guillemet doublé à l'intérieur d'une cellule.
 */
import { parseCsv, looksMisencoded } from './_csv.mjs';

let failed = 0;
const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) { failed++; console.log(`  ÉCHEC ${label}\n    obtenu ${JSON.stringify(got)}\n    attendu ${JSON.stringify(want)}`); }
    else console.log(`  ok  ${label}`);
};

check('tout guillemeté (nos générateurs)',
    parseCsv('"a";"b";"c"'), [['a', 'b', 'c']]);

check('rien guillemeté (OpenOffice par défaut)',
    parseCsv('a;b;c'), [['a', 'b', 'c']]);

check('guillemets partiels',
    parseCsv('a;"b";c'), [['a', 'b', 'c']]);

check('point-virgule dans une cellule guillemetée',
    parseCsv('a;"3 dégâts; puis étourdi";c'), [['a', '3 dégâts; puis étourdi', 'c']]);

check('guillemet doublé',
    parseCsv('a;"le sort ""Foudre""";c'), [['a', 'le sort "Foudre"', 'c']]);

check('cellules vides conservées',
    parseCsv('a;;c'), [['a', '', 'c']]);

check('deux lignes CRLF',
    parseCsv('a;b\r\nc;d'), [['a', 'b'], ['c', 'd']]);

check('ligne vide finale ignorée',
    parseCsv('a;b\r\n\r\n'), [['a', 'b']]);

check('BOM retiré',
    parseCsv('\ufeff"a";"b"'), [['a', 'b']]);

check('chemin Windows avec antislashs',
    parseCsv('C:\\Users\\beber\\img.png;/cards/gods/meduse.png'),
    [['C:\\Users\\beber\\img.png', '/cards/gods/meduse.png']]);

check('détection d\'un mauvais encodage', looksMisencoded('PÃ©trification'), true);
check('UTF-8 correct non signalé', looksMisencoded('Pétrification'), false);

console.log('');
console.log(failed === 0 ? 'TOUS LES CAS PASSENT' : `${failed} ÉCHEC(S)`);
process.exit(failed === 0 ? 0 : 1);
