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
