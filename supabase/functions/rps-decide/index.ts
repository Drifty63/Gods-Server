import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, resolveSide } from '../_shared/admin-client.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { gameId, token, goFirst } = await req.json();
        if (!gameId || !token || typeof goFirst !== 'boolean') {
            return jsonResponse({ error: 'gameId, token et goFirst (boolean) requis' }, 400);
        }

        const admin = getAdminClient();
        const side = await resolveSide(admin, gameId, token);
        if (!side) return jsonResponse({ error: 'Jeton invalide' }, 401);

        const { data: game, error: gameErr } = await admin
            .from('games')
            .select('status, rps_winner')
            .eq('id', gameId)
            .single();
        if (gameErr || !game) return jsonResponse({ error: 'Partie introuvable' }, 404);
        if (game.status !== 'rps_deciding') return jsonResponse({ error: "Ce n'est pas le moment de décider" }, 400);
        if (game.rps_winner !== side) return jsonResponse({ error: 'Seul le gagnant peut décider' }, 403);

        const otherSide = side === 'host' ? 'guest' : 'host';
        const firstPlayer = goFirst ? side : otherSide;

        // Effacer rps_result/rps_winner en même temps que le changement de statut : sinon la clé
        // de dédoublonnage côté client (`${status}:${JSON.stringify(rps_result)}`) change à cause
        // du statut même si rps_result est identique, ce qui refaisait croire à une nouvelle
        // révélation RPS et relançait un second écran "Tu as gagné" juste après la redirection.
        const { error: updateErr } = await admin
            .from('games')
            .update({ first_player: firstPlayer, status: 'playing', rps_result: null, rps_winner: null })
            .eq('id', gameId);
        if (updateErr) return jsonResponse({ error: updateErr.message }, 500);

        return jsonResponse({ ok: true });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
