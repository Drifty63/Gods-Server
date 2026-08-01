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

        // Si la partie n'était pas déjà terminée, quitter compte comme un forfait : l'autre
        // joueur est déclaré vainqueur. Même garde anti-doublon que report-match-result --
        // si la partie était déjà finie (résultat normal déjà rapporté), ce update est un no-op.
        const winnerSide = side === 'host' ? 'guest' : 'host';
        const { data: updated, error } = await admin
            .from('games')
            .update({ status: 'finished', winner_id: winnerSide, finished_at: new Date().toISOString() })
            .eq('id', gameId)
            .neq('status', 'finished')
            .select('id, host_user_id, guest_user_id, is_ranked, is_private');
        if (error) return jsonResponse({ error: error.message }, 500);

        if (updated && updated.length > 0) {
            const game = updated[0];

            // Quêtes journalières : un abandon ne doit PAS pouvoir servir à compléter une quête
            // -- seul le joueur resté (déclaré vainqueur par forfait) reçoit la progression,
            // jamais celui qui quitte. Comme pour un vrai résultat, uniquement en matchmaking
            // aléatoire (is_private=false), jamais en partie privée / défi entre amis.
            if (!game.is_private) {
                const winnerUserId = winnerSide === 'host' ? game.host_user_id : game.guest_user_id;
                if (winnerUserId) {
                    await admin.rpc('bump_daily_quest_progress', { p_user_id: winnerUserId, p_won: true });
                }
            }

            if (game.is_ranked && game.host_user_id && game.guest_user_id) {
                const winnerUserId = winnerSide === 'host' ? game.host_user_id : game.guest_user_id;
                await admin.rpc('apply_match_result', { p_game_id: gameId, p_winner_user_id: winnerUserId });
            }
        }

        return jsonResponse({ ok: true });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
