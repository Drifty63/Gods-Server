/**
 * Le camp, redéclaré ici plutôt qu'importé d'`admin-client.ts`.
 *
 * Ce module est le SEUL de `supabase/functions` qui soit testé depuis la suite du site, et
 * importer `admin-client.ts` ferait entrer le client Supabase et les globales Deno dans la
 * vérification de types de Next, qui ne les connaît pas. Deux mots dupliqués coûtent moins cher
 * qu'une configuration TypeScript à deux étages — et le compilateur ferait échouer le premier
 * désaccord, puisque les deux types se rencontrent à l'appel.
 */
type Side = 'host' | 'guest';

/**
 * Qui a RÉELLEMENT gagné, d'après l'état de partie stocké.
 *
 * `report-match-result` recevait `didIWin` du client et le croyait sur parole. Le jeton prouve
 * qu'on participe à la partie, pas qu'on l'a emportée — et comme la garde anti-doublon retient
 * le PREMIER appel, il suffisait d'appeler la fonction au premier tour en se déclarant vainqueur
 * pour remporter une partie classée sans jouer une carte.
 *
 * Le serveur a pourtant tout ce qu'il faut : `games.game_state` est réécrit à chaque action par
 * sync-game-state. Une partie est finie quand un camp n'a plus un seul dieu vivant, et c'est une
 * chose qui se CONSTATE au lieu de se déclarer.
 *
 * Volontairement tolérant sur la forme de l'état : il vient du client, il a changé de forme au
 * fil des versions, et un état illisible ne doit pas bloquer la fin d'une partie honnête — d'où
 * `unknown` plutôt que `null` dans ce cas, que l'appelant traite comme « je ne sais pas ».
 */

interface GodLite { currentHealth?: number; isDead?: boolean }
interface PlayerLite { id?: string; gods?: GodLite[] }
interface StateLite { players?: PlayerLite[]; status?: string; winnerId?: string }

/** Un dieu compte comme vivant tant qu'il n'est pas marqué mort ET qu'il lui reste des PV. */
function isAlive(g: GodLite): boolean {
    if (g.isDead === true) return false;
    return typeof g.currentHealth === 'number' ? g.currentHealth > 0 : true;
}

/**
 * `ongoing` et `unknown` étaient confondus, et c'était une faille.
 *
 * « Les deux camps ont encore des dieux debout » n'est PAS un état illisible : c'est un état
 * parfaitement lisible qui dit que la partie n'est pas finie. Le ranger avec les états illisibles
 * faisait retomber le serveur sur la déclaration du client — et c'est exactement ainsi qu'un
 * résultat périmé, envoyé par une page qui n'avait pas encore chargé la nouvelle partie, a pu
 * clore celle-ci avec le vainqueur de la précédente.
 */
export type Outcome =
    | { kind: 'winner'; side: Side }
    | { kind: 'draw' }
    | { kind: 'ongoing' }
    | { kind: 'unknown' };

export function outcomeFromState(raw: unknown): Outcome {
    const state = raw as StateLite | null | undefined;
    const players = state?.players;
    // Deux camps exactement : l'index 0 est l'hôte, le 1 l'invité, comme partout ailleurs.
    if (!Array.isArray(players) || players.length !== 2) return { kind: 'unknown' };

    /*
     * La partie s'est conclue elle-même : on lit son verdict.
     *
     * Toutes les fins ne passent pas par des points de vie à zéro. À la LIMITE DE TOURS, le
     * moteur termine la partie et désigne vainqueur le camp au plus fort total de PV — les deux
     * équipes sont alors encore debout. Ne regarder que les dieux vivants rendait ces parties
     * « en cours » à jamais, et leur résultat était refusé.
     */
    if (state?.status === 'finished') {
        if (!state.winnerId) return { kind: 'draw' };
        if (state.winnerId === players[0]?.id) return { kind: 'winner', side: 'host' };
        if (state.winnerId === players[1]?.id) return { kind: 'winner', side: 'guest' };
        return { kind: 'unknown' };   // un vainqueur qui ne désigne aucun des deux camps
    }

    const alive = players.map(p => (Array.isArray(p?.gods) ? p.gods.filter(isAlive).length : -1));
    // Une équipe vide au chargement n'est pas une défaite : c'est un état qu'on ne sait pas lire.
    if (alive.some(n => n < 0)) return { kind: 'unknown' };

    const [host, guest] = alive;
    if (host > 0 && guest > 0) return { kind: 'ongoing' };
    if (host === 0 && guest === 0) return { kind: 'draw' };
    return { kind: 'winner', side: host > 0 ? 'host' : 'guest' };
}
