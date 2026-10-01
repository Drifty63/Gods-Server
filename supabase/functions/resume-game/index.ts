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
        const { claim } = await req.json().catch(() => ({ claim: false }));

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

        /*
         * FENÊTRE DE QUATRE-VINGT-DIX SECONDES, alignée sur la règle d'abandon.
         *
         * Elle était de trente minutes, héritée du ménage automatique. C'était incohérent : au
         * bout de quatre-vingt-dix secondes l'adversaire resté a déjà remporté la partie, donc
         * la bannière promettait de reprendre quelque chose qui n'existait plus — et le joueur
         * qui cliquait attendait un chargement sans fin.
         *
         * Le filtre est ici et pas seulement dans le cron : celui-ci tourne toutes les deux
         * minutes, et une ligne encore présente ne veut pas dire une partie encore jouable.
         */
        const idleMs = Date.now() - new Date(game.updated_at).getTime();
        if (idleMs > 90_000) return jsonResponse({ resumable: false, reason: 'expired' });

        /*
         * DEUX MODES : regarder, ou revenir.
         *
         * L'accueil interroge cette fonction à chaque ouverture pour savoir s'il doit afficher la
         * bannière. Compter une reprise à ce moment-là reviendrait à faire perdre la partie à
         * quelqu'un qui passe trois fois par l'accueil sans jamais y toucher. Le jeton et le
         * décompte ne sont donc servis que si l'appelant dit explicitement qu'il revient.
         */
        if (!claim) {
            return jsonResponse({
                resumable: true,
                gameId: game.id,
                isHost,
                opponentName: isHost ? game.guest_name : game.host_name,
                mode: game.mode ?? 'ranked',
                isRanked: game.is_ranked,
                updatedAt: game.updated_at,
            });
        }

        /*
         * TROISIÈME RETOUR = FORFAIT.
         *
         * Le décompte d'abandon repart de quatre-vingt-dix secondes à chaque retour : sans
         * plafond, quelqu'un qui part et revient indéfiniment tient son adversaire en otage sans
         * jamais perdre. Seul le RETOUR est observable par le serveur — le partant n'est plus là
         * pour être compté, et laisser l'adversaire le compter offrirait un bouton « fais perdre
         * l'autre ».
         */
        const { data: resumeRows, error: resumeErr } = await admin.rpc('register_resume', {
            p_game_id: game.id,
            p_side: isHost ? 'host' : 'guest',
        });
        if (resumeErr) return jsonResponse({ error: resumeErr.message }, 500);

        const verdict = (Array.isArray(resumeRows) ? resumeRows[0] : resumeRows) as
            { allowed: boolean; used: number; forfeited: boolean } | null;
        if (!verdict?.allowed) {
            return jsonResponse({
                resumable: false,
                reason: verdict?.forfeited ? 'forfeited' : 'expired',
                resumesUsed: verdict?.used ?? 0,
            });
        }

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
