import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, generateUniqueGameId } from '../_shared/admin-client.ts';
import { getRequestUser } from '../_shared/auth-client.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { playerName } = await req.json();
        if (!playerName || typeof playerName !== 'string') {
            return jsonResponse({ error: 'playerName requis' }, 400);
        }

        // Rattache la partie au compte du créateur quand il est connecté (toujours vrai en
        // pratique : /online exige un compte) -- utilisé pour le statut "en partie" des amis.
        // Non bloquant si absent : une partie privée reste jouable sans lui.
        const caller = await getRequestUser(req);

        const admin = getAdminClient();
        const gameId = await generateUniqueGameId(admin);

        const { error: gameErr } = await admin.from('games').insert({
            id: gameId,
            status: 'waiting',
            is_private: true,
            is_ranked: false,
            host_name: playerName,
            host_user_id: caller?.id ?? null,
        });
        if (gameErr) return jsonResponse({ error: gameErr.message }, 500);

        const { data: tokenRow, error: tokenErr } = await admin
            .from('game_tokens')
            .insert({ game_id: gameId })
            .select('host_token')
            .single();
        if (tokenErr || !tokenRow) {
            await admin.from('games').delete().eq('id', gameId);
            return jsonResponse({ error: tokenErr?.message ?? 'Erreur de création du jeton' }, 500);
        }

        return jsonResponse({ gameId, hostToken: tokenRow.host_token });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
