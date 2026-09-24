import type { GodCard, SpellCard, SpellEffect, StatusEffect } from '@/types/cards';

/**
 * Budget de puissance d'une unité — la façon dont on encode « un dieu > une créature > un
 * serviteur ».
 *
 * Les PV seuls ne suffisent pas : une créature peut être un mur de 26 PV qui tape faiblement,
 * tandis qu'une autre a 20 PV mais frappe fort. Comparer les PV classerait la première comme
 * « plus forte », ce qui est faux. On additionne donc l'encaisse ET la menace, et c'est ce
 * total qui doit respecter la hiérarchie (voir le test units-hierarchy).
 */

/** Combien vaut 1 pile de chaque statut, en « points de dégâts équivalents ». */
const STATUS_WEIGHT: Record<StatusEffect, number> = {
    poison: 1.5,
    bleed: 1.5,
    lightning: 1,
    shield: 0.8,
    provocation: 1,
    stun: 3,
    // La petrification vaut cher : elle etourdit un tour ET pese sur tous les coups suivants,
    // sans jamais expirer. La brulure vaut moins : elle n amplifie que les sorts de FEU, donc
    // sa valeur depend de l equipe qui la pose.
    petrify: 3.5,
    burn: 1.5,
    // L'effroi vaut moins que l'inciblable (2) dont il est une version partielle : il ne
    // ferme que le ciblage mono-cible, la zone passe, et il s'efface d'une marque par tour.
    fear: 1.5,
    // Le silence ne ferme que les 2 competences des 5 cartes d un dieu, la ou l etourdissement
    // (3) les ferme toutes les cinq pour le meme prix. Il vaut donc nettement moins, sans
    // tomber au niveau d une simple marque : ce sont les cartes offensives qu il coupe.
    silence: 2,
    // « Redoute » ne fait rien par lui-meme : c est la peur d en face qui travaille, et elle
    // est deja facturee. Le compter une seconde fois doublerait le prix de la meme mecanique.
    dreaded: 0,
    /*
     * Ces deux-la ne s'empilent JAMAIS : ils valent toujours une marque, et leur effet est une
     * constante du moteur (EMPOWERED_DAMAGE_BONUS, BLUNTED_DAMAGE_MALUS). Leur poids porte donc
     * l'effet ENTIER, pas une part par marque comme la petrification ou la brulure.
     *
     * Galvanise vaut ses 3 degats supplementaires PLUS l'etourdissement d'un tour qu'il ajoute
     * (poids 3), d'ou 6. Emousse ne retire que 2 degats, sans rien d'autre.
     *
     * Ce poids etait a 2,5 quand le bonus vivait dans le nombre de marques : la mesure lisait
     * alors 3 marques et tombait juste par accident. En passant a une constante, elle ne voyait
     * plus rien -- Chiron a perdu 2,5 de budget sans qu'aucune de ses cartes ne change.
     */
    empowered: 6,
    blunted: 2,
    weakness: 1.5,
    weakness_immunity: 1,
    regen: 1.2,
    untargetable: 2,
};

/** Une frappe de zone vaut plus cher qu'une frappe simple : elle touche jusqu'à 4 cibles. */
function targetMultiplier(effect: SpellEffect): number {
    switch (effect.target) {
        case 'all_enemies':
        case 'all_allies':
        case 'all_gods':
            return 2.5;
        case 'same':
            return 0.5;
        default:
            return 1;
    }
}

/**
 * Un statut qui dure deux tours vaut plus qu'un statut qui dure un tour.
 *
 * `statusDuration` n'etait lu NULLE PART dans cette mesure : un silence de 2 tours sur les
 * quatre dieux adverses pesait exactement autant qu'un silence d'un tour sur un seul. Le
 * bestiaire genere automatiquement ne s'appuyait guere sur le controle, donc l'angle mort ne se
 * voyait pas ; les unites ecrites a la main, elles, en vivent.
 *
 * Croissance VOLONTAIREMENT sous-lineaire : doubler la duree ne double pas la valeur. Un tour
 * supplementaire vaut moins que le premier, parce que la cible a d'autres dieux a jouer entre
 * temps -- consequence directe de la regle d'une carte par tour.
 *
 * Les marques permanentes (petrification, brulure, effroi) n'ont pas de duree : leur poids est
 * deja fixe en consequence dans STATUS_WEIGHT.
 */
function durationFactor(e: SpellEffect): number {
    const d = e.statusDuration ?? 1;
    return d <= 1 ? 1 : 1 + (d - 1) * 0.5;
}

function effectPower(e: SpellEffect): number {
    const m = targetMultiplier(e);
    const v = e.value ?? 0;
    switch (e.type) {
        case 'damage': return v * m;
        case 'heal': return v * 0.8 * m;
        case 'shield': return v * 0.8 * m;
        case 'status': return v * (e.status ? STATUS_WEIGHT[e.status] : 1) * m * durationFactor(e);
        case 'remove_status': return 1;
        case 'draw': return v * 1.5;
        case 'energy': return v * 1.5;
        case 'mill':
        case 'discard': return v * m;
        // Les effets `custom` sont propres à un dieu du roster et n'existent pas dans le
        // bestiaire ; on les compte forfaitairement plutôt que de renvoyer 0 silencieusement.
        case 'custom': return 3;
        default: return 0;
    }
}

/** Puissance nette d'un sort : ce qu'il fait, moins ce qu'il coûte, plus ce qu'il rapporte. */
export function spellPower(s: SpellCard): number {
    const raw = s.effects.reduce((sum, e) => sum + effectPower(e), 0);
    return raw - s.energyCost * 1.5 + s.energyGain * 1.5;
}

/** Budget total = encaisse (PV) + menace (somme des 5 sorts). */
export function unitPower(unit: GodCard, spells: SpellCard[]): number {
    const own = spells.filter(s => s.godId === unit.id);
    return unit.maxHealth + own.reduce((sum, s) => sum + spellPower(s), 0);
}

/**
 * Plafond de budget par catégorie. Un serviteur ne doit jamais atteindre le budget d'une
 * créature, quelle que soit la répartition entre PV et dégâts.
 */
export const POWER_CEILING = {
    servant: 40,
    creature: 62,
} as const;
