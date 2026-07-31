import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/admin-client.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { gameId, playerName } = await req.json();
        if (!gameId || !playerName) return jsonResponse({ error: 'gameId et playerName requis' }, 400);

        const admin = getAdminClient();
        const { data: game, error: gameErr } = await admin
            .from('games')
            .select('id, status, host_name')
            .eq('id', gameId)
            .maybeSingle();

        if (gameErr) return jsonResponse({ error: gameErr.message }, 500);
        if (!game) return jsonResponse({ error: 'Partie introuvable' }, 404);
        if (game.status !== 'waiting') return jsonResponse({ error: 'Cette partie a déjà commencé' }, 400);

        const guestToken = crypto.randomUUID();

        const { error: tokenErr } = await admin
            .from('game_tokens')
            .update({ guest_token: guestToken })
            .eq('game_id', gameId);
        if (tokenErr) return jsonResponse({ error: tokenErr.message }, 500);

        const { error: updateErr } = await admin
            .from('games')
            .update({ guest_name: playerName, status: 'selecting' })
            .eq('id', gameId);
        if (updateErr) return jsonResponse({ error: updateErr.message }, 500);

        return jsonResponse({ guestToken, hostName: game.host_name });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
