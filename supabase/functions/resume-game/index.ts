import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/admin-client.ts';
import { getRequestUser } from '../_shared/auth-client.ts';

/**
 * Hands a player back the session of a game they are still in.
 *
 * Why this exists: the client keeps `gameId` and `multiplayerToken` in sessionStorage, which the
 * browser wipes when the tab closes. Everything needed to carry on is still in the database --
 * the `games` row survives with its full `game_state` -- but `game_tokens` is RLS deny-all, so
 * there was NO way to re-obtain a write token. Closing the app mid-match meant losing it.
 *
 * The token is only ever handed to the authenticated user whose id is on that side of the game,
 * so this grants nothing a player did not already have.
 *
 * Thirty-minute window: `cleanup_stale_multiplayer_data` deletes `playing` games untouched for
 * 30 minutes (init_multiplayer.sql). Past that the row is gone and there is nothing to resume --
 * the banner in the client says so rather than letting the player hope.
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const user = await getRequestUser(req);
        if (!user) return jsonResponse({ error: 'Non authentifié' }, 401);

        const admin = getAdminClient();

        // `updated_at desc`: if several rows somehow linger, the most recent is the live one.
        const { data: games, error } = await admin
            .from('games')
            .select('id, host_user_id, guest_user_id, host_name, guest_name, mode, is_ranked, updated_at, host_gods, guest_gods, first_player')
            .eq('status', 'playing')
            .or(`host_user_id.eq.${user.id},guest_user_id.eq.${user.id}`)
            .order('updated_at', { ascending: false })
            .limit(1);
        if (error) return jsonResponse({ error: error.message }, 500);

        if (!games || games.length === 0) {
            return jsonResponse({ resumable: false });
        }

        const game = games[0];
        const isHost = game.host_user_id === user.id;

        const { data: tokens, error: tokenErr } = await admin
            .from('game_tokens')
            .select('host_token, guest_token')
            .eq('game_id', game.id)
            .maybeSingle();
        if (tokenErr) return jsonResponse({ error: tokenErr.message }, 500);

        const token = isHost ? tokens?.host_token : tokens?.guest_token;
        // No token means the row was cleaned up between the two queries, or the guest never
        // claimed one. Nothing to resume -- and inventing a token here would let the client
        // write to a game it cannot authenticate for.
        if (!token) return jsonResponse({ resumable: false });

        return jsonResponse({
            resumable: true,
            gameId: game.id,
            token,
            isHost,
            opponentName: isHost ? game.guest_name : game.host_name,
            mode: game.mode ?? 'ranked',
            isRanked: game.is_ranked,
            updatedAt: game.updated_at,
            // The client needs the same shape it stored as `multiplayerData` when the match
            // started: the board page refuses to mount without it, and after a tab close it is
            // gone from sessionStorage. It is rebuilt here from the row rather than asking the
            // client to remember anything.
            startData: {
                gameId: game.id,
                hostGods: game.host_gods,
                guestGods: game.guest_gods,
                firstPlayer: game.first_player,
            },
        });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
