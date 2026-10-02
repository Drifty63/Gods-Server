import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, resolveSide, type Side } from '../_shared/admin-client.ts';

interface PlayerStateLite {
    id: string;
    energy: number;
    hasPlayedCard: boolean;
    hand: Array<{ id: string; energyCost: number }>;
}

interface GameStateLite {
    currentPlayerId: string;
    players: [PlayerStateLite, PlayerStateLite];
}

/**
 * Réplique la validation légère de l'ancien validateGameAction (server-online.js) : vérifie
 * les préconditions (tour, carte en main, énergie, une seule carte/tour) avant d'accepter
 * l'écrasement de l'état. Le CONTENU du nouvel état reste calculé et non-vérifié côté client,
 * exactement comme avant — seule cette précondition est reproduite ici, pas le moteur de jeu.
 */
function validateAction(
    storedState: GameStateLite,
    side: Side,
    action: { type: string; payload?: Record<string, unknown> }
): { valid: boolean; reason?: string } {
    const playerId = side === 'host' ? storedState.players[0].id : storedState.players[1].id;

    if (storedState.currentPlayerId !== playerId) {
        return { valid: false, reason: "Ce n'est pas votre tour" };
    }

    const player = storedState.players.find((p) => p.id === playerId);
    if (!player) return { valid: false, reason: 'Joueur introuvable' };

    switch (action.type) {
        case 'play_card': {
            const cardId = action.payload?.cardId;
            const card = player.hand.find((c) => c.id === cardId);
            if (!card) return { valid: false, reason: 'Carte introuvable dans votre main' };
            if (player.energy < card.energyCost) return { valid: false, reason: "Pas assez d'énergie" };
            if (player.hasPlayedCard) return { valid: false, reason: 'Vous avez déjà joué une carte ce tour' };
            return { valid: true };
        }
        case 'discard': {
            const cardId = action.payload?.cardId;
            const card = player.hand.find((c) => c.id === cardId);
            if (!card) return { valid: false, reason: 'Carte introuvable' };
            return { valid: true };
        }
        default:
            // end_turn, select_target, etc. : toujours acceptés si c'est bien votre tour
            // (même comportement que l'ancien serveur).
            return { valid: true };
    }
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { gameId, token, action, gameState } = await req.json();
        if (!gameId || !token || !gameState) {
            return jsonResponse({ error: 'gameId, token et gameState requis' }, 400);
        }

        const admin = getAdminClient();
        const side = await resolveSide(admin, gameId, token);
        if (!side) return jsonResponse({ error: 'Jeton invalide' }, 401);

        /*
         * UN SEUL ÉTAT DE DÉPART PAR PARTIE.
         *
         * `sync_initial_state` est envoyé par l'hôte quand il fabrique la partie. S'il le
         * renvoyait une seconde fois — page initialisée deux fois après des tapes répétées sur
         * Premier/Second — il écrasait le combat en cours par une partie toute neuve, avec un
         * autre identifiant, pour les deux joueurs. L'écran se protège désormais lui-même, mais
         * c'est ici que la règle doit être garantie : quoi que fasse un client, une partie qui a
         * déjà commencé ne peut plus être remplacée.
         */
        if (action?.type === 'sync_initial_state') {
            const { data: existing, error: existingErr } = await admin
                .from('games')
                .select('game_state')
                .eq('id', gameId)
                .single();
            if (existingErr) return jsonResponse({ error: existingErr.message }, 500);
            if (existing?.game_state) {
                // En 200 et non 409, volontairement : côté client, une réponse non-2xx est
                // traitée comme une erreur réseau et s'arrête là. Un 200 avec `ok: false`
                // déclenche au contraire le rechargement de la partie RÉELLE — exactement ce
                // qu'il faut à un client qui croyait en fabriquer une nouvelle.
                return jsonResponse({ ok: false, reason: 'La partie a déjà commencé' }, 200);
            }
        }

        // Pas d'action (ou sync initiale) : aucune précondition à vérifier, comme avant.
        const skipValidation = !action || action.type === 'sync_initial_state' || action.type === 'ask_initial_state';

        if (!skipValidation) {
            const { data: game, error: fetchErr } = await admin
                .from('games')
                .select('game_state')
                .eq('id', gameId)
                .single();
            if (fetchErr) return jsonResponse({ error: fetchErr.message }, 500);

            if (game?.game_state) {
                const check = validateAction(game.game_state as GameStateLite, side, action);
                if (!check.valid) return jsonResponse({ ok: false, reason: check.reason }, 409);
            }
        }

        /*
         * `last_actor` dit QUI vient d'agir, et c'est la seule chose qui rende une victoire par
         * abandon vérifiable : couplée à `updated_at`, elle permet au serveur de constater que
         * c'est à l'adversaire d'agir et qu'il n'agit plus. Voir claim_abandon_victory().
         */
        const { error: updateErr } = await admin
            .from('games')
            .update({ game_state: gameState, last_actor: side })
            .eq('id', gameId);
        if (updateErr) return jsonResponse({ error: updateErr.message }, 500);

        return jsonResponse({ ok: true });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
