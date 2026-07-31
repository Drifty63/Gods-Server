import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/admin-client.ts';

/**
 * Une fois le trigger de matchmaking a apparié deux entrées de file d'attente (visible côté
 * client via Realtime quand sa propre ligne matchmaking_queue voit matched_game_id se remplir),
 * chaque joueur appelle cette fonction avec l'id de SA ligne de file pour récupérer son jeton
 * de partie — l'équivalent, pour le chemin matchmaking, de ce que create/join-private-game
 * renvoient directement pour les parties privées.
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { queueId } = await req.json();
        if (!queueId) return jsonResponse({ error: 'queueId requis' }, 400);

        const admin = getAdminClient();
        const { data: queueRow, error: queueErr } = await admin
            .from('matchmaking_queue')
            .select('matched_game_id, is_host')
            .eq('id', queueId)
            .maybeSingle();
        if (queueErr) return jsonResponse({ error: queueErr.message }, 500);
        if (!queueRow?.matched_game_id) return jsonResponse({ error: 'Pas encore apparié' }, 404);

        const { data: tokens, error: tokenErr } = await admin
            .from('game_tokens')
            .select('host_token, guest_token')
            .eq('game_id', queueRow.matched_game_id)
            .single();
        if (tokenErr || !tokens) return jsonResponse({ error: tokenErr?.message ?? 'Jetons introuvables' }, 500);

        const { data: game, error: gameErr } = await admin
            .from('games')
            .select('host_name, guest_name')
            .eq('id', queueRow.matched_game_id)
            .single();
        if (gameErr || !game) return jsonResponse({ error: gameErr?.message ?? 'Partie introuvable' }, 500);

        return jsonResponse({
            gameId: queueRow.matched_game_id,
            isHost: queueRow.is_host,
            token: queueRow.is_host ? tokens.host_token : tokens.guest_token,
            hostName: game.host_name,
            guestName: game.guest_name,
        });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
