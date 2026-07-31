import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, resolveSide } from '../_shared/admin-client.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { gameId, token } = await req.json();
        if (!gameId || !token) return jsonResponse({ error: 'gameId et token requis' }, 400);

        const admin = getAdminClient();
        const side = await resolveSide(admin, gameId, token);
        if (!side) return jsonResponse({ error: 'Jeton invalide' }, 401);

        const { error } = await admin
            .from('games')
            .update({ status: 'finished', finished_at: new Date().toISOString() })
            .eq('id', gameId);
        if (error) return jsonResponse({ error: error.message }, 500);

        return jsonResponse({ ok: true });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
