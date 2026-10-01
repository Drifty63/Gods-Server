import { describe, it, expect } from 'vitest';
import { outcomeFromState } from '../../supabase/functions/_shared/outcome';

/**
 * Le vainqueur CONSTATÉ par le serveur.
 *
 * `report-match-result` croyait `didIWin` sur parole. Le jeton prouve qu'on participe à la
 * partie, pas qu'on l'a gagnée — et comme la garde anti-doublon retient le PREMIER appel, il
 * suffisait d'appeler la fonction au premier tour en se déclarant vainqueur pour remporter une
 * partie classée sans jouer une carte.
 *
 * Ces tests portent sur la fonction partagée qui tranche désormais. Ils tournent avec le reste de
 * la suite — ce code vit dans `supabase/functions`, qui n'avait aucun test alors que c'est la
 * seule partie du système où une erreur ne se rattrape pas côté client.
 */

const god = (hp: number, dead = false) => ({ currentHealth: hp, isDead: dead });
const state = (hostGods: unknown[], guestGods: unknown[]) => ({
    players: [{ gods: hostGods }, { gods: guestGods }],
});

describe('issue d’une partie, lue dans son état', () => {
    it('désigne l’hôte quand l’invité n’a plus un dieu debout', () => {
        expect(outcomeFromState(state([god(12)], [god(0)]))).toEqual({ kind: 'winner', side: 'host' });
    });

    it('désigne l’invité dans le cas symétrique', () => {
        expect(outcomeFromState(state([god(0)], [god(8)]))).toEqual({ kind: 'winner', side: 'guest' });
    });

    it('tient un dieu marqué mort pour mort, même avec des PV', () => {
        // L'incohérence existe en pratique : la résurrection et la pétrification manipulent les
        // deux champs, et un état synchronisé en plein effet peut porter les deux.
        expect(outcomeFromState(state([god(5)], [god(5, true)]))).toEqual({ kind: 'winner', side: 'host' });
    });

    it('ne tranche pas tant que les deux camps tiennent debout', () => {
        // LE cas qui compte : c'est exactement l'état d'une partie au premier tour, celui depuis
        // lequel un tricheur se déclarait vainqueur.
        expect(outcomeFromState(state([god(25), god(30)], [god(20), god(22)])))
            .toEqual({ kind: 'unknown' });
    });

    it('reconnaît un match nul quand les deux camps tombent', () => {
        expect(outcomeFromState(state([god(0)], [god(0)]))).toEqual({ kind: 'draw' });
    });
});

describe('états que le serveur ne sait pas lire', () => {
    /*
     * Volontairement tolérant. Un état illisible — ancienne version, forme inattendue — ne doit
     * pas bloquer la fin d'une partie honnête : l'appelant retombe alors sur la déclaration du
     * client. Mieux vaut ce risque résiduel, qui s'éteint tout seul à mesure que les anciennes
     * parties s'effacent, qu'un joueur incapable de terminer son match.
     */
    it('ne tranche pas sur un état absent ou vide', () => {
        for (const bad of [null, undefined, {}, { players: null }, 'texte', 42]) {
            expect(outcomeFromState(bad), String(bad)).toEqual({ kind: 'unknown' });
        }
    });

    it('ne tranche pas quand il n’y a pas exactement deux camps', () => {
        expect(outcomeFromState({ players: [{ gods: [god(1)] }] })).toEqual({ kind: 'unknown' });
        expect(outcomeFromState({ players: [{ gods: [] }, { gods: [] }, { gods: [] }] }))
            .toEqual({ kind: 'unknown' });
    });

    it('ne prend pas une équipe illisible pour une équipe vaincue', () => {
        // Un camp sans tableau `gods` n'a pas perdu : on ne sait simplement pas le lire. Le
        // confondre avec une défaite donnerait la victoire à l'autre sur une erreur de forme.
        expect(outcomeFromState({ players: [{ gods: [god(10)] }, {}] })).toEqual({ kind: 'unknown' });
    });

    it('traite un dieu sans PV déclarés comme vivant', () => {
        // Un champ manquant est une lacune de forme, pas une mort : sans cette règle, un état
        // partiellement sérialisé déclarerait un camp vaincu.
        expect(outcomeFromState({ players: [{ gods: [{}] }, { gods: [god(0)] }] }))
            .toEqual({ kind: 'winner', side: 'host' });
    });
});
