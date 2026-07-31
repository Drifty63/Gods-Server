import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, resolveSide } from '../_shared/admin-client.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { gameId, token, gods } = await req.json();
        if (!gameId || !token || !Array.isArray(gods)) {
            return jsonResponse({ error: 'gameId, token et gods requis' }, 400);
        }

        const admin = getAdminClient();
        const side = await resolveSide(admin, gameId, token);
        if (!side) return jsonResponse({ error: 'Jeton invalide' }, 401);

        const column = side === 'host' ? 'host_gods' : 'guest_gods';
        const { error: updateErr } = await admin.from('games').update({ [column]: gods }).eq('id', gameId);
        if (updateErr) return jsonResponse({ error: updateErr.message }, 500);

        const { data: game, error: fetchErr } = await admin
            .from('games')
            .select('host_gods, guest_gods')
            .eq('id', gameId)
            .single();
        if (fetchErr || !game) return jsonResponse({ error: fetchErr?.message ?? 'Partie introuvable' }, 500);

        const bothSelected = !!game.host_gods && !!game.guest_gods;
        if (bothSelected) {
            await admin
                .from('games')
                .update({
                    status: 'rps',
                    rps_host_chosen: false,
                    rps_guest_chosen: false,
                    rps_result: null,
                    rps_winner: null,
                })
                .eq('id', gameId);
            await admin
                .from('game_tokens')
                .update({ rps_host_choice: null, rps_guest_choice: null })
                .eq('game_id', gameId);
        }

        return jsonResponse({ ok: true, bothSelected });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
