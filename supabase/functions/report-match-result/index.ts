import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, resolveSide } from '../_shared/admin-client.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { gameId, token, didIWin } = await req.json();
        if (!gameId || !token || typeof didIWin !== 'boolean') {
            return jsonResponse({ error: 'gameId, token et didIWin (boolean) requis' }, 400);
        }

        const admin = getAdminClient();
        const side = await resolveSide(admin, gameId, token);
        if (!side) return jsonResponse({ error: 'Jeton invalide' }, 401);

        const winnerSide = didIWin ? side : (side === 'host' ? 'guest' : 'host');

        // Garde anti-doublon : les DEUX clients détectent la fin de partie indépendamment et
        // appellent cette fonction -- seul le premier à arriver ici doit écrire le résultat
        // (WHERE status <> 'finished' fait échouer silencieusement le second appel).
        const { data: updated, error: updateErr } = await admin
            .from('games')
            .update({ status: 'finished', winner_id: winnerSide, finished_at: new Date().toISOString() })
            .eq('id', gameId)
            .neq('status', 'finished')
            .select('id, host_user_id, guest_user_id, is_ranked');
        if (updateErr) return jsonResponse({ error: updateErr.message }, 500);

        if (!updated || updated.length === 0) {
            return jsonResponse({ ok: true, alreadyReported: true });
        }

        const game = updated[0];
        if (game.is_ranked && game.host_user_id && game.guest_user_id) {
            const winnerUserId = winnerSide === 'host' ? game.host_user_id : game.guest_user_id;
            await admin.rpc('apply_match_result', { p_game_id: gameId, p_winner_user_id: winnerUserId });
        }

        return jsonResponse({ ok: true });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
