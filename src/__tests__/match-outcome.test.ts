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

    it('dit « en cours » tant que les deux camps tiennent debout — pas « illisible »', () => {
        // LE cas qui compte, et deux fois. C'est l'état d'une partie au premier tour, d'où un
        // tricheur se déclarait vainqueur. Et c'est l'état d'une partie qui vient de commencer,
        // que le résultat PÉRIMÉ de la précédente venait clore. Le confondre avec un état
        // illisible faisait retomber le serveur sur la déclaration du client.
        expect(outcomeFromState(state([god(25), god(30)], [god(20), god(22)])))
            .toEqual({ kind: 'ongoing' });
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

describe('fins qui ne passent pas par des points de vie à zéro', () => {
    /*
     * À la limite de tours, le moteur termine la partie et désigne vainqueur le camp au plus fort
     * total de PV : les deux équipes sont encore debout. Sans lire le verdict de l'état, ces
     * parties paraissaient « en cours » à jamais et leur résultat était refusé par le serveur.
     */
    const finished = (winnerId?: string) => ({
        status: 'finished',
        winnerId,
        players: [
            { id: 'player1', gods: [god(12)] },
            { id: 'player2', gods: [god(4)] },
        ],
    });

    it('lit le vainqueur désigné à la limite de tours', () => {
        expect(outcomeFromState(finished('player1'))).toEqual({ kind: 'winner', side: 'host' });
        expect(outcomeFromState(finished('player2'))).toEqual({ kind: 'winner', side: 'guest' });
    });

    it('lit un nul à égalité de PV', () => {
        expect(outcomeFromState(finished(undefined))).toEqual({ kind: 'draw' });
    });

    it('refuse un vainqueur qui ne désigne aucun des deux camps', () => {
        expect(outcomeFromState(finished('quelqu-un-d-autre'))).toEqual({ kind: 'unknown' });
    });
});
