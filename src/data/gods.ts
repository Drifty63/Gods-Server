// Données de tous les dieux du jeu GODS
// Mise à jour progressive avec les cartes fournies

import { GodCard } from '@/types/cards';
import { UNIT_CARDS } from './units';
export type { GodCard as God } from '@/types/cards';

/**
 * Les 20 dieux du roster, plus le bestiaire (serviteurs & créatures) défini dans `./units`.
 * Le roster est figé ; tout nouveau contenu passe par `src/data/units/`.
 *
 * Les helpers ci-dessous (getVisibleGods, getOwnedGods) filtrent sur `category === 'god'`, donc
 * ces unités n'apparaissent ni en boutique ni dans la construction de deck : elles servent
 * d'adversaires en Ascension et de cartes jouables en Duel.
 */
export const ALL_GODS: GodCard[] = [
    // =====================
    // DIEU 1: POSÉIDON (Eau 💧)
    // =====================
    {
        id: 'poseidon',
        name: 'Poséidon, Dieu des océans',
        element: 'water',
        weakness: 'lightning',
        maxHealth: 25,
        imageUrl: '/cards/gods/poseidon.png',
        carouselImage: '/cards/gods/poseidon.jpg',
        flavorText: "« Vos routes m'appartiennent. C'est moi qui décide de la marée. » — Noie la pioche adverse et appauvrit chaque tour : on ne le bat pas, on s'épuise contre lui.",
    },

    // =====================
    // DIEU 2: ZEUS (Foudre ⚡)
    // =====================
    {
        id: 'zeus',
        name: 'Zeus, Dieu du ciel',
        element: 'lightning',
        weakness: 'earth',
        maxHealth: 25,
        imageUrl: '/cards/gods/zeus.png',
        archetype: 'glass_cannon',
        carouselImage: '/cards/gods/zeus.jpg',
        flavorText: "« Je n'avertis jamais deux fois. » — Marque ses cibles, puis fait tout détoner d'un coup. Frappe très fort, encaisse très mal.",
    },

    // =====================
    // DIEU 3: NYX (Ténèbres 💀)
    // =====================
    {
        id: 'nyx',
        name: 'Nyx, Déesse de la nuit',
        element: 'darkness',
        weakness: 'light',
        maxHealth: 26,
        imageUrl: '/cards/gods/nyx.png',
        carouselImage: '/cards/gods/nyx.jpg',
        flavorText: "« Regarde bien ta main. Es-tu certain de savoir ce que tu tiens ? » — Glisse des cartes aveugles chez l'adversaire et transforme son tour en pari.",
    },

    // =====================
    // DIEU 4: HESTIA (Feu 🔥)
    // =====================
    {
        id: 'hestia',
        name: 'Hestia, Déesse du foyer',
        element: 'fire',
        weakness: 'water',
        maxHealth: 24,
        imageUrl: '/cards/gods/hestia.png',
        carouselImage: '/cards/gods/hestia.jpg',
        flavorText: "« Tant que le foyer brûle, personne ne tombe. » — Soigne, ravive, efface les faiblesses : elle ne gagne pas les échanges, elle les fait durer.",
    },

    // =====================
    // DIEU 5: ATHÉNA (Lumière ☀️)
    // =====================
    {
        id: 'athena',
        name: 'Athéna, Déesse de la sagesse',
        element: 'light',
        weakness: 'darkness',
        maxHealth: 30,
        imageUrl: '/cards/gods/athena.png',
        archetype: 'tank',
        carouselImage: '/cards/gods/athena.jpg',
        flavorText: "« Frappe-moi. C'est exactement ce que je veux. » — Le plus gros réservoir de points de vie du jeu ; sa provocation dicte à l'adversaire ce qu'il a le droit de viser.",
    },

    // =====================
    // DIEU 6: DEMETER (Terre 🌿)
    // =====================
    {
        id: 'demeter',
        name: 'Demeter, Déesse des récoltes',
        element: 'earth',
        weakness: 'air',
        maxHealth: 24,
        imageUrl: '/cards/gods/demeter.png',
        archetype: 'support',
        carouselImage: '/cards/gods/demeter.jpg',
        flavorText: "« Ce que l'on coupe, je le fais repousser. » — Soins répartis et renforts : elle rend l'échange de dégâts intenable pour l'adversaire.",
    },

    // =====================
    // DIEU 7: DIONYSOS (Terre 🌿)
    // =====================
    {
        id: 'dionysos',
        name: 'Dionysos, Dieu du vin',
        element: 'earth',
        weakness: 'air',
        maxHealth: 22,
        imageUrl: '/cards/gods/dionysos.png',
        carouselImage: '/cards/gods/dionysos.jpg',
        flavorText: "« Bois donc. Tu verras, tout devient beaucoup plus simple. » — Empoisonne et désorganise : chaque sort lancé en face finit par coûter cher.",
    },

    // =====================
    // DIEU 8: HADÈS (Feu 🔥)
    // =====================
    {
        id: 'hades',
        name: 'Hadès, Dieu des enfers',
        element: 'fire',
        weakness: 'water',
        maxHealth: 20,
        imageUrl: '/cards/gods/hades.png',
        archetype: 'glass_cannon',
        carouselImage: '/cards/gods/hades.jpg',
        flavorText: "« Tout ce qui meurt finit par m'appartenir. » — Peu de points de vie, mais il se soigne de ce qu'il détruit : le laisser conclure un échange, c'est le relancer.",
    },

    // =====================
    // DIEU 9: APOLLON (Air 💨)
    // =====================
    {
        id: 'apollon',
        name: 'Apollon, Dieu de la musique',
        element: 'air',
        weakness: 'fire',
        maxHealth: 22,
        imageUrl: '/cards/gods/apollon.png',
        carouselImage: '/cards/gods/apollon.jpg',
        flavorText: "« Je vois la flèche arriver avant même de l'avoir tirée. » — Assèche l'énergie adverse et étourdit : en face, on a les cartes, jamais le tour pour les jouer.",
    },

    // =====================
    // DIEU 10: ARÈS (Terre 🌿)
    // =====================
    {
        id: 'ares',
        name: 'Arès, Dieu de la guerre',
        element: 'earth',
        weakness: 'air',
        maxHealth: 28,
        imageUrl: '/cards/gods/ares.png',
        archetype: 'glass_cannon',
        carouselImage: '/cards/gods/ares.jpg',
        flavorText: "« La douleur ? C'est le prix, et je le paie d'avance. » — Ses sorts les plus violents lui coûtent ses propres points de vie : une réserve à dépenser comme des munitions.",
    },

    // =====================
    // DIEU 11: ARTÉMIS (Air 💨)
    // =====================
    {
        id: 'artemis',
        name: 'Artémis, Déesse de la chasse',
        element: 'air',
        weakness: 'fire',
        maxHealth: 20,
        imageUrl: '/cards/gods/artemis.png',
        archetype: 'glass_cannon',
        carouselImage: '/cards/gods/artemis.jpg',
        flavorText: "« Je ne rate pas. Je choisis simplement où ça fait le plus mal. » — Impose des faiblesses puis frappe plusieurs cibles à la fois : la reine du doublement de dégâts.",
    },

    // =====================
    // DIEU 12: APHRODITE (Lumière ☀️)
    // =====================
    {
        id: 'aphrodite',
        name: 'Aphrodite, Déesse de l\'amour',
        element: 'light',
        weakness: 'darkness',
        maxHealth: 25,
        imageUrl: '/cards/gods/aphrodite.png',
        archetype: 'support',
        carouselImage: '/cards/gods/aphrodite.jpg',
        flavorText: "« Personne ne se bat vraiment contre moi. » — Purifie son camp, charme et fige celui d'en face : la partie se joue à son rythme, pas au vôtre.",
    },

    // =====================================================
    // DIEUX CACHÉS - EXTENSION DEATH & GLORY
    // =====================================================

    // PERSÉPHONE (Ténèbres 💀) - CACHÉ
    {
        id: 'persephone',
        name: 'Perséphone, Reine des Enfers',
        element: 'darkness',
        weakness: 'light',
        maxHealth: 26,
        imageUrl: '/cards/gods/persephone.png',
        flavorText: '"Je suis celle qui règne sur les morts et guide les âmes. Mon royaume est éternel."',
        hidden: true,
    },

    // HÉPHAÏSTOS (Feu 🔥) - CACHÉ
    {
        id: 'hephaistos',
        name: 'Héphaïstos, Dieu de la forge',
        element: 'fire',
        weakness: 'water',
        maxHealth: 25,
        imageUrl: '/cards/gods/hephaistos.png',
        archetype: 'tank',
        flavorText: '"Dans ma forge brûlent les flammes de la création. Mes armures sont invincibles."',
        hidden: true,
    },

    // THANATOS (Ténèbres 💀) - CACHÉ
    {
        id: 'thanatos',
        name: 'Thanatos, Dieu de la mort',
        element: 'darkness',
        weakness: 'light',
        maxHealth: 26,
        imageUrl: '/cards/gods/thanatos.png',
        flavorText: '"Je suis la fin inévitable. Chaque mort me rend plus puissant."',
        hidden: true,
    },

    // HERMÈS (Foudre ⚡) - CACHÉ
    {
        id: 'hermes',
        name: 'Hermès, Messager des dieux',
        element: 'lightning',
        weakness: 'earth',
        maxHealth: 24,
        imageUrl: '/cards/gods/hermes.png',
        flavorText: '"Plus rapide que la pensée, je frappe avant même que tu ne me voies venir."',
        hidden: true,
    },

    // SÉLÉNÉ (Eau 💧) - CACHÉ
    {
        id: 'selene',
        name: 'Séléné, Déesse de la lune',
        element: 'water',
        weakness: 'lightning',
        maxHealth: 30,
        imageUrl: '/cards/gods/selene.png',
        archetype: 'support',
        flavorText: '"Ma lumière argentée apaise les blessures et ranime les âmes perdues."',
        hidden: true,
    },

    // ZÉPHYR (Air 🌀) - CACHÉ
    {
        id: 'zephyr',
        name: 'Zéphyr, Dieu du vent d\'ouest',
        element: 'air',
        weakness: 'fire',
        maxHealth: 24,
        imageUrl: '/cards/gods/zephyr.png',
        flavorText: '"Mon souffle disperse tes plans comme des feuilles dans la tempête."',
        hidden: true,
    },

    // NIKÉ (Lumière ✨) - CACHÉ
    {
        id: 'nike',
        name: 'Niké, Déesse de la victoire',
        element: 'light',
        weakness: 'darkness',
        maxHealth: 22,
        imageUrl: '/cards/gods/nike.png',
        flavorText: '"La victoire couronne ceux qui triomphent de leurs ennemis. Je suis leur récompense."',
        hidden: true,
    },

    // CHIONÉ (Eau 💧) - CACHÉ
    {
        id: 'chione',
        name: 'Chioné, Déesse de la neige',
        element: 'water',
        weakness: 'lightning',
        maxHealth: 22,
        imageUrl: '/cards/gods/chione.png',
        archetype: 'glass_cannon',
        flavorText: '"Mon froid gèle le temps lui-même. Tes actions seront figées dans la glace."',
        hidden: true,
    },

    // =====================================================
    // ENNEMIS SPÉCIAUX - MODE HISTOIRE
    // =====================================================

    // SOLDAT D'ARÈS 1 (Terre 🌿) - Serviteur
    {
        id: 'soldier_ares_1',
        name: 'Soldat d\'Arès',
        element: 'earth',
        weakness: 'air',
        maxHealth: 16,
        imageUrl: '/cards/gods/soldier_ares_1.png',
        archetype: 'glass_cannon',
        flavorText: "« Pour Arès ! Pour la gloire et la guerre ! » — 16 points de vie pour 5 dégâts d'un seul coup : une munition bon marché, qu'on dépense sans regret.",
        hidden: false,  // Disponible en mode Duel
        category: 'servant',
        duelCost: 2,
        affiliatedTo: 'ares',
    },

    // SOLDAT D'ARÈS 2 (Terre 🌿) - Serviteur (dupliqué pour l'histoire)
    {
        id: 'soldier_ares_2',
        name: 'Soldat d\'Arès',
        element: 'earth',
        weakness: 'air',
        maxHealth: 16,
        imageUrl: '/cards/gods/soldier_ares_2.png',
        archetype: 'glass_cannon',
        flavorText: '"Pour Arès ! Pour la gloire et la guerre !"',
        hidden: true,  // Dupliqué pour l'histoire uniquement
        category: 'servant',
        duelCost: 2,
        affiliatedTo: 'ares',
    },

    // SOLDAT D'ARÈS 3 (Terre 🌿) - Serviteur (dupliqué pour l'histoire)
    {
        id: 'soldier_ares_3',
        name: 'Soldat d\'Arès',
        element: 'earth',
        weakness: 'air',
        maxHealth: 16,
        imageUrl: '/cards/gods/soldier_ares_3.png',
        archetype: 'glass_cannon',
        flavorText: '"Pour Arès ! Pour la gloire et la guerre !"',
        hidden: true,  // Dupliqué pour l'histoire uniquement
        category: 'servant',
        duelCost: 2,
        affiliatedTo: 'ares',
    },

    // DRAGON DE THÈBES (Air 💨) - Créature mythique
    {
        id: 'dragon_thebes',
        name: 'Dragon de Thèbes',
        element: 'air',
        weakness: 'fire',
        maxHealth: 26,  // 26 PV en mode Duel, 75 PV override en mode Histoire
        imageUrl: '/cards/gods/dragon_thebes.png',
        archetype: 'tank',
        flavorText: "« Né du sang d'Arès lui-même, je suis la terreur des cieux. Plus grand, plus puissant que mon ancêtre, je règne sur les vents de la mort. » — Le plus résistant du bestiaire : sa provocation force l'adversaire à le viser pendant que son souffle ronge toute l'équipe d'en face.",
        hidden: false,  // Disponible en mode Duel
        category: 'creature',
        duelCost: 3,
        affiliatedTo: 'ares',
    },

    // ARACHNÉ (Ténèbres 💀) - Créature mythique
    {
        id: 'arachne',
        name: 'Arachné',
        element: 'darkness',
        weakness: 'light',
        maxHealth: 22,  // 22 PV en mode Duel, 50 PV override en mode Histoire
        imageUrl: '/cards/gods/arachne.png',
        flavorText: "« Athéna m'a maudite, mais ma vengeance sera tissée de leurs propres entrailles. Partout où rampe une araignée, je peux apparaître ! » — Ni bouclier ni soin : elle empoisonne l'équipe entière et fige deux cibles pendant deux tours. On ne la tue jamais assez vite.",
        hidden: false,  // Disponible en mode Duel
        category: 'creature',
        duelCost: 3,
        affiliatedTo: 'athena',
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // LES ARAIGNÉES D'ARACHNÉ — deux rôles distincts, ne pas les confondre
    //
    // La NUÉE (araignées 2 et 3) n'existe que pour le combat d'Arachné du mode Histoire :
    // des bestioles faibles dont l'intérêt est le nombre, pas la statistique. Ce sont donc
    // des SERVITEURS, dans le bas de leur bande de PV (12, pour une bande 10-18).
    //
    // L'araignée 1, elle, est la seule jouable hors Histoire (Duel, Ascension) : à ce titre
    // c'est une CRÉATURE à part entière, avec les PV et le coût de Duel correspondants.
    //
    // Ces rôles étaient exactement inversés : l'unité visible était un serviteur de 14 PV
    // tandis que les deux figurantes de la nuée étaient classées créatures à 12 PV — soit
    // des « créatures » plus faibles que n'importe quel serviteur du jeu.
    // ─────────────────────────────────────────────────────────────────────────────

    // ARAIGNÉE GÉANTE 1 (Ténèbres 💀) - Créature jouable : Duel + Ascension + Histoire
    {
        id: 'giant_spider_1',
        name: 'Araignée Géante',
        element: 'darkness',
        weakness: 'light',
        maxHealth: 21,
        imageUrl: '/cards/gods/giant_spider_1.png',
        flavorText: "« Nous sommes les enfants d'Arachné. Nous tissons la mort. » — Moins retorse que sa mère, plus brutale : elle plante quatre dégâts et un poison lourd sur une seule cible, puis se retranche derrière son bouclier.",
        category: 'creature',
        affiliatedTo: 'arachne',
        duelCost: 3,
    },

    // ARAIGNÉE GÉANTE 2 (Ténèbres 💀) - Nuée, exclusif Histoire
    {
        id: 'giant_spider_2',
        name: 'Araignée Géante',
        element: 'darkness',
        weakness: 'light',
        maxHealth: 12,
        imageUrl: '/cards/gods/giant_spider_2.png',
        flavorText: '"Nous sommes les enfants d\'Arachné. Nous tissons la mort."',
        hidden: true,  // Exclusif mode Histoire
        category: 'servant',
        affiliatedTo: 'arachne',
        duelCost: 2,
    },

    // ARAIGNÉE GÉANTE 3 (Ténèbres 💀) - Nuée, exclusif Histoire
    {
        id: 'giant_spider_3',
        name: 'Araignée Géante',
        element: 'darkness',
        weakness: 'light',
        maxHealth: 12,
        imageUrl: '/cards/gods/giant_spider_3.png',
        flavorText: '"Nous sommes les enfants d\'Arachné. Nous tissons la mort."',
        hidden: true,  // Exclusif mode Histoire
        category: 'servant',
        affiliatedTo: 'arachne',
        duelCost: 2,
    },

    // =====================
    // ULYSSE (Créature - Eau 💧) - Exclusif Histoire
    // =====================
    {
        id: 'ulysses',
        name: 'Ulysse, Roi d\'Ithaque',
        element: 'water',
        weakness: 'lightning',
        maxHealth: 20,
        imageUrl: '/cards/gods/card_ulysses.png',
        flavorText: "« Je suis Ulysse, le rusé, celui que tous les dieux connaissent pour ses ruses infinies. » — Vingt points de vie et aucune armure : il ne survit pas en encaissant, il devient impossible à cibler. Il frappe, disparaît, revient.",
        // Validé pour la v1.0 (illustration et sorts repris à la main) : jouable en Duel et
        // opposable en Ascension, plus seulement réservé au mode Histoire.
        category: 'creature',
        affiliatedTo: 'hestia',
        duelCost: 3,
    },

    // =====================
    // CHEVALIER D'ATHÉNA (Serviteur - Lumière ☀️) - Exclusif Histoire
    // =====================
    {
        id: 'athena_knight',
        name: 'Chevalier d\'Athéna',
        element: 'light',
        weakness: 'darkness',
        maxHealth: 16,
        imageUrl: '/cards/gods/card_athena_knight.png',
        archetype: 'tank',
        flavorText: "« Pour la gloire d'Athéna, nous ne fléchirons jamais ! » — Il ne tue personne : il provoque, il encaisse, et il couvre TOUT son camp de boucliers. Athéna en version deux points.",
        // Intégration au Duel effectuée : serviteur validé pour la v1.0.
        category: 'servant',
        affiliatedTo: 'athena',
        duelCost: 2,
    },

    // ── Bestiaire (2 serviteurs + 2 créatures par dieu du roster) ──
    ...UNIT_CARDS,
];

// Helper pour obtenir un dieu par son ID
export function getGodById(id: string): GodCard | undefined {
    return ALL_GODS.find(god => god.id === id);
}

// Helper pour obtenir tous les dieux d'un élément
export function getGodsByElement(element: GodCard['element']): GodCard[] {
    return ALL_GODS.filter(god => god.element === element);
}

// Helper pour obtenir les dieux visibles (SEULEMENT les dieux, pas créatures/serviteurs)
// Utilisé par: Boutique, Deck, Entraînement, Accueil
export function getVisibleGods(isCreator: boolean = false): GodCard[] {
    const onlyGods = ALL_GODS.filter(god => !god.category || god.category === 'god');
    if (isCreator) {
        return onlyGods; // Les créateurs voient tous les dieux
    }
    return onlyGods.filter(god => !god.hidden); // Les autres ne voient que les dieux non cachés
}

// Helper pour obtenir les dieux possédés par un joueur (SEULEMENT les dieux)
// Utilisé par: Ascension, Mode En Ligne
export function getOwnedGods(godsOwned: string[], isCreator: boolean = false): GodCard[] {
    const onlyGods = ALL_GODS.filter(god => !god.category || god.category === 'god');

    // Les créateurs ont accès à tous les dieux
    if (isCreator) {
        return onlyGods;
    }

    // Sinon, retourner seulement les dieux possédés
    return onlyGods.filter(god => godsOwned.includes(god.id));
}

/**
 * Créatures et serviteurs livrés avec le jeu : validés à la main (pas de `draft`) et non
 * réservés au mode Histoire (pas de `hidden`).
 *
 * Source unique partagée par le mode Duel et la Collection, pour qu'un ajout d'unité
 * apparaisse partout d'un coup.
 */
export function getReleasedUnits(): { creatures: GodCard[]; servants: GodCard[] } {
    return {
        creatures: ALL_GODS.filter(g => g.category === 'creature' && !g.hidden && !g.draft),
        servants: ALL_GODS.filter(g => g.category === 'servant' && !g.hidden && !g.draft),
    };
}

/**
 * Dieu dont dépend une unité, en remontant la chaîne d'affiliation.
 *
 * Une unité peut être rattachée à une AUTRE unité plutôt qu'à un dieu : les Araignées Géantes
 * sont la progéniture d'Arachné, elle-même liée à Athéna. Sans cette remontée, elles
 * n'appartiendraient à personne et resteraient à jamais inaccessibles.
 *
 * La boucle est bornée par `seen` : une affiliation circulaire introduite par erreur
 * bloquerait sinon le rendu.
 */
export function getOwnerGodId(card: GodCard): string | undefined {
    let current: GodCard | undefined = card;
    const seen = new Set<string>();

    while (current && current.affiliatedTo && !seen.has(current.id)) {
        seen.add(current.id);
        const parent: GodCard | undefined = ALL_GODS.find(g => g.id === current!.affiliatedTo);
        if (!parent) return current.affiliatedTo; // affilié à un id inconnu : on le renvoie tel quel
        if (!parent.category || parent.category === 'god') return parent.id;
        current = parent;
    }
    return undefined;
}

/**
 * Le joueur possède-t-il cette carte ?
 *
 * Un dieu s'achète en boutique. Une créature ou un serviteur ne s'achète PAS : il est acquis
 * en même temps que le dieu auquel il est rattaché — acheter Arès donne ses Soldats et le
 * Dragon de Thèbes. Rien à stocker en base : la possession se déduit de `gods_owned`, donc
 * aucune migration ni modification des fonctions d'achat n'est nécessaire.
 */
export function ownsCard(card: GodCard, godsOwned: string[], isCreator: boolean = false): boolean {
    if (isCreator) return true;
    if (!card.category || card.category === 'god') return godsOwned.includes(card.id);

    const ownerGod = getOwnerGodId(card);
    // Unité sans dieu de rattachement : personne ne peut l'obtenir, on ne l'accorde donc pas.
    return ownerGod ? godsOwned.includes(ownerGod) : false;
}

// Helper pour obtenir toutes les cartes disponibles pour le mode Duel
// Inclut: Dieux + Créatures + Serviteurs (possédés ou créateur)
export function getDuelCards(godsOwned: string[], isCreator: boolean = false): {
    gods: GodCard[];
    creatures: GodCard[];
    servants: GodCard[];
} {
    if (isCreator) {
        return {
            gods: ALL_GODS.filter(g => !g.hidden && (!g.category || g.category === 'god')),
            creatures: ALL_GODS.filter(g => !g.hidden && !g.draft && g.category === 'creature'),
            servants: ALL_GODS.filter(g => !g.hidden && !g.draft && g.category === 'servant'),
        };
    }

    const released = getReleasedUnits();
    return {
        gods: ALL_GODS.filter(g => (!g.category || g.category === 'god') && godsOwned.includes(g.id)),
        // Une créature ou un serviteur suit le sort de son dieu : acheter Arès débloque ses
        // Soldats et le Dragon de Thèbes, sans achat ni stockage supplémentaire.
        creatures: released.creatures.filter(c => ownsCard(c, godsOwned, false)),
        servants: released.servants.filter(s => ownsCard(s, godsOwned, false)),
    };
}
