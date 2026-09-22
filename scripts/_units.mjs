/**
 * Bestiaire cible de la v1.0 — source unique des deux feuilles.
 *
 * `generateUnitSheet.mjs` (mécaniques) et `generateUnitArtSheet.mjs` (illustrations) doivent
 * parler des MÊMES unités, avec les mêmes identifiants : c'est l'identifiant qui relie une
 * ligne de mécanique à son fichier image. Deux listes recopiées divergeraient au premier ajout.
 *
 * `servant` est l'unité de troupe — celle qui tire sa force du nombre ; `creature` est la bête
 * ou le héros nommé. C'est la répartition des six unités déjà publiées : Soldats d'Arès et
 * Chevaliers d'Athéna côté serviteurs, Dragon de Thèbes et Arachné côté créatures.
 *
 * L'identifiant est un décalque ASCII du nom français. Il sert de racine à TOUS les chemins de
 * la carte — portrait et cinq sorts — et ne doit donc jamais changer une fois les images
 * livrées.
 */

/** [dieu, nom affiché, identifiant, catégorie, déjà en jeu]. */
export const BESTIARY = [
    ['Arès', "Soldats d'Arès", 'soldier_ares_1', 'servant', true],
    ['Arès', 'Dragon de Thèbes', 'dragon_thebes', 'creature', true],
    ['Athéna', "Chevaliers d'Athéna", 'athena_knight', 'servant', true],
    ['Athéna', 'Arachné', 'arachne', 'creature', true],
    ['Hestia', 'Ulysse', 'ulysses', 'creature', true],
    ['Hestia', 'Feu follet', 'feu_follet', 'servant', false],
    ['Poséidon', 'Cyclopes', 'cyclopes', 'servant', false],
    ['Poséidon', 'Méduse', 'meduse', 'creature', false],
    ['Hadès', 'Démons du Tartare', 'demons_tartare', 'servant', false],
    ['Hadès', 'Cerbère', 'cerbere', 'creature', false],
    ['Aphrodite', "Serviteurs d'Aphrodite", 'serviteurs_aphrodite', 'servant', false],
    ['Aphrodite', 'Achille', 'achille', 'creature', false],
    ['Apollon', 'Oracle de Delphes', 'oracle_delphes', 'servant', false],
    ['Apollon', 'Python', 'python', 'creature', false],
    ['Dionysos', 'Satyres', 'satyres', 'servant', false],
    ['Dionysos', 'Chiron', 'chiron', 'creature', false],
    ['Zeus', 'Garde céleste', 'garde_celeste', 'servant', false],
    ['Zeus', 'Harpies', 'harpies', 'creature', false],
    ['Artémis', 'Chiens de chasse', 'chiens_chasse', 'servant', false],
    ['Artémis', 'Actéon', 'acteon', 'creature', false],
    ['Nyx', 'Occultiste', 'occultiste', 'servant', false],
    ['Nyx', 'Les Érinyes', 'erinyes', 'creature', false],
    ['Déméter', 'Sirènes', 'sirenes', 'servant', false],
    ['Déméter', 'Minotaure', 'minotaure', 'creature', false],
];

/** Les unités qui restent à créer, dans l'ordre du bestiaire. */
export const MISSING = BESTIARY.filter(([, , , , done]) => !done)
    .map(([god, name, id, category]) => ({ god, name, id, category }));

/**
 * Les cinq rôles de sort, dans l'ordre où toutes les unités existantes les déclarent.
 *
 * Les générateurs ne coûtent rien et rapportent l'énergie ; les compétences la dépensent ;
 * l'utilitaire protège ou manipule. Les coûts sont les plus fréquents, pas une règle.
 */
export const ROLES = [
    { slug: 'generator_1', label: 'Générateur 1', cost: 0, gain: 1, hint: 'Frappe faible et large — souvent 1 dégât à tous les ennemis' },
    { slug: 'generator_2', label: 'Générateur 2', cost: 0, gain: 1, hint: 'Frappe simple et ciblée — souvent 3 dégâts à un ennemi' },
    { slug: 'skill_1', label: 'Compétence 1', cost: 1, gain: 0, hint: 'Le coup signature, bon marché' },
    { slug: 'skill_2', label: 'Compétence 2', cost: 3, gain: 0, hint: 'Le coup lourd, celui qui coûte cher' },
    { slug: 'utility_1', label: 'Utilitaire', cost: 1, gain: 0, hint: "Bouclier, provocation, soin, état — ce qui n'est pas de l'attaque" },
];

/**
 * Valeurs de départ par catégorie, relevées sur les unités existantes.
 *
 * 16 PV / 2 points pour un serviteur : c'est exactement le Soldat d'Arès, le Chevalier
 * d'Athéna et l'Araignée Géante. Les créatures vont de 21 à 26 PV pour 3 points — le Dragon
 * de Thèbes est à 26, Arachné à 22. Un POINT DE DÉPART, à corriger carte par carte.
 */
export const STATS = {
    servant: { hp: 16, cost: 2, label: 'serviteur' },
    creature: { hp: 22, cost: 3, label: 'créature' },
};

/** Échappement CSV, séparateur point-virgule — le format qu'attend Excel en français. */
export const esc = v => `"${String(v).replace(/"/g, '""')}"`;
export const toCsv = rows => '﻿' + rows.map(r => r.map(esc).join(';')).join('\r\n');
