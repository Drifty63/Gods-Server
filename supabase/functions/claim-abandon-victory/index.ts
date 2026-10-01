import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, resolveSide } from '../_shared/admin-client.ts';

/**
 * Réclame la victoire quand l'adversaire a quitté et n'est pas revenu.
 *
 * Le client DÉCLENCHE la réclamation — c'est lui qui voit, par la présence Realtime, que l'autre
 * a fermé l'onglet — mais il ne décide de rien. Toute la vérification est dans
 * `claim_abandon_victory` : le réclamant doit être celui qui a joué en dernier, et la partie ne
 * doit plus avoir bougé depuis quatre-vingt-dix secondes.
 *
 * Une réclamation refusée n'est pas une erreur : c'est le cas normal quand l'adversaire est
 * revenu entre-temps, ou quand c'est au réclamant d'agir. Le client doit pouvoir réessayer plus
 * tard sans que rien ne casse, d'où un 200 avec `success: false` plutôt qu'un code d'erreur.
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { gameId, token } = await req.json();
        if (!gameId || !token) {
            return jsonResponse({ error: 'gameId et token requis' }, 400);
        }

        const admin = getAdminClient();
        const side = await resolveSide(admin, gameId, token);
        if (!side) return jsonResponse({ error: 'Jeton invalide' }, 401);

        const { data, error } = await admin.rpc('claim_abandon_victory', {
            p_game_id: gameId,
            p_side: side,
        });
        if (error) return jsonResponse({ error: error.message }, 500);

        const result = (Array.isArray(data) ? data[0] : data) as { success: boolean; reason: string };
        return jsonResponse({ success: !!result?.success, reason: result?.reason ?? '' });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
