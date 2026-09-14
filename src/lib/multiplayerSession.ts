/** Marque une session REPRISE, par opposition à une partie qui vient de commencer. */
export const RESUMED_KEY = 'multiplayerResumed';

/**
 * Session multijoueur rangée dans `sessionStorage`.
 *
 * Ces clés survivent à une navigation entre pages — c'est tout leur intérêt, le flux passant par
 * /online → /online/select → /online/rps → /online/game. Mais elles survivent AUSSI à la fin
 * d'une partie : si on ne les efface pas, la partie suivante se raccroche à l'ancienne
 * (`resumeGame` est appelé avec l'id périmé) et les deux joueurs se retrouvent désynchronisés —
 * l'un bloqué en composition d'équipe pendant que l'autre attend au pierre-feuille-ciseaux.
 *
 * Un seul endroit pour les connaître, sinon on en oublie toujours une.
 */
const SESSION_KEYS = [
    'gameId',
    'multiplayerToken',
    'multiplayerData',
    'isHost',
    'opponentName',
    'gameMode',
    'selectedGods',
    RESUMED_KEY,
] as const;

/**
 * Efface toute trace de la partie précédente.
 *
 * À appeler AVANT d'en commencer une nouvelle plutôt qu'après avoir quitté l'ancienne : on ne
 * maîtrise pas la façon dont le joueur est parti (bouton, retour arrière, fermeture d'onglet),
 * alors qu'on maîtrise toujours le moment où il en relance une.
 */
export function clearMultiplayerSession(): void {
    if (typeof window === 'undefined') return;
    for (const key of SESSION_KEYS) {
        sessionStorage.removeItem(key);
    }
}

/** Données rendues par l'Edge Function `resume-game`. */
export interface ResumePayload {
    gameId: string;
    token: string;
    isHost: boolean;
    opponentName: string | null;
    startData: unknown;
}

/**
 * Réinstalle la session d'une partie reprise, puis marque qu'il s'agit d'une REPRISE.
 *
 * Ce marqueur n'est pas cosmétique : sans lui, l'hôte qui revient reconstruirait une partie
 * neuve et l'écraserait dans Postgres, effaçant le combat en cours pour les DEUX joueurs. La
 * page de jeu s'en sert pour adopter l'état existant au lieu d'en fabriquer un.
 *
 * Efface d'abord : une session périmée laissée à côté raccrocherait la partie au mauvais id.
 */
export function restoreMultiplayerSession(p: ResumePayload): void {
    if (typeof window === 'undefined') return;
    clearMultiplayerSession();
    sessionStorage.setItem('gameId', p.gameId);
    sessionStorage.setItem('multiplayerToken', p.token);
    sessionStorage.setItem('isHost', String(p.isHost));
    sessionStorage.setItem('multiplayerData', JSON.stringify(p.startData));
    if (p.opponentName) sessionStorage.setItem('opponentName', p.opponentName);
    sessionStorage.setItem(RESUMED_KEY, 'true');
}
