/**
 * Lecture de CSV tolérante, partagée par tous les scripts de feuille.
 *
 * POURQUOI CE FICHIER EXISTE. Les scripts découpaient chaque ligne sur la chaîne `";"`. Ça
 * marche tant que le fichier sort de MES générateurs, qui entourent toutes les cellules de
 * guillemets. Mais ces feuilles sont remplies à la main dans OpenOffice ou Excel, et au
 * ré-enregistrement le tableur décide lui-même de ce qu'il guillemette : souvent rien, sauf
 * les cellules contenant un point-virgule. Une seule cellule non guillemetée et tout le
 * découpage se décale d'une colonne — sans erreur, sans avertissement. Les valeurs
 * atterrissent dans la mauvaise colonne et l'auteur ne le voit qu'au résultat.
 *
 * L'analyseur ci-dessous suit la vraie grammaire CSV : champs guillemetés ou non, guillemets
 * doublés à l'intérieur, séparateurs et retours à la ligne admis dans un champ guillemeté.
 */

/**
 * Découpe un CSV complet en tableau de lignes, chacune tableau de cellules.
 *
 * @param {string} text  Contenu du fichier, BOM compris.
 * @param {string} sep   Séparateur de champ. Point-virgule par défaut — c'est ce qu'attend un
 *                       Excel en français, et ce que produisent nos générateurs.
 */
export function parseCsv(text, sep = ';') {
    const src = text.replace(/^﻿/, '');
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    let i = 0;

    while (i < src.length) {
        const ch = src[i];

        if (quoted) {
            if (ch === '"') {
                // Un guillemet doublé à l'intérieur d'un champ représente un guillemet réel.
                if (src[i + 1] === '"') { field += '"'; i += 2; continue; }
                quoted = false; i++; continue;
            }
            field += ch; i++; continue;
        }

        if (ch === '"') { quoted = true; i++; continue; }
        if (ch === sep) { row.push(field); field = ''; i++; continue; }

        if (ch === '\r' || ch === '\n') {
            // Fin de ligne, quel que soit le style : \r\n, \n seul ou \r seul.
            if (ch === '\r' && src[i + 1] === '\n') i++;
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
            i++;
            continue;
        }

        field += ch; i++;
    }

    // Dernier champ, s'il n'est pas suivi d'un retour à la ligne.
    if (field !== '' || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    // Les lignes entièrement vides ne portent rien : un tableur en laisse souvent à la fin.
    return rows.filter(r => r.some(c => c.trim() !== ''));
}

/**
 * Lit un CSV et renvoie ses lignes de DONNÉES, en-tête retiré, cellules détourées.
 *
 * Si le fichier n'existe pas, renvoie un tableau vide plutôt que de lever : les générateurs
 * doivent savoir fonctionner avant que l'auteur ait commencé à remplir.
 */
export function readCsvRows(fs, filePath, sep = ';') {
    if (!fs.existsSync(filePath)) return [];
    const rows = parseCsv(fs.readFileSync(filePath, 'utf8'), sep);
    return rows.slice(1).map(r => r.map(c => c.trim()));
}

/**
 * Détecte un fichier ré-enregistré dans un encodage autre qu'UTF-8.
 *
 * Le piège classique d'OpenOffice : ré-enregistrer en Europe occidentale (Windows-1252) au
 * lieu d'UTF-8. Les accents deviennent alors des paires de caractères -- « Pétrification »
 * s'écrit « PÃ©trification ». Le fichier reste lisible, donc rien n'échoue ; c'est le jeu qui
 * affichera plus tard des noms abîmés.
 */
export function looksMisencoded(text) {
    return /Ã[©¨ªè¢‰ -¿]|Â[°«»]|â€/.test(text);
}
