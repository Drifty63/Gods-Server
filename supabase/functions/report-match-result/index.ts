import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, resolveSide } from '../_shared/admin-client.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { gameId, token, didIWin, godsUsed } = await req.json();
        if (!gameId || !token || typeof didIWin !== 'boolean') {
            return jsonResponse({ error: 'gameId, token et didIWin (boolean) requis' }, 400);
        }
        const myGodsUsed: string[] = Array.isArray(godsUsed) ? godsUsed.filter((g: unknown) => typeof g === 'string') : [];

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
            .select('id, host_user_id, guest_user_id, is_ranked, is_private');
        if (updateErr) return jsonResponse({ error: updateErr.message }, 500);

        if (!updated || updated.length === 0) {
            return jsonResponse({ ok: true, alreadyReported: true });
        }

        const game = updated[0];

        // Progression des quêtes journalières ("jouer une partie" / "gagner 3 parties" / "jouer
        // CE dieu 3 fois") : une partie qui arrive ICI (et pas via le forfait de leave-game)
        // s'est terminée normalement (PV à 0), donc compte pour les DEUX joueurs -- classée ou
        // non, mais seulement en matchmaking aléatoire (is_private=false), pas pour les parties
        // privées / défis entre amis, sur demande explicite.
        //
        // godsUsed (pour la quête "jouez ce dieu") ne vient QUE de la requête de CET appelant --
        // à cause de la garde anti-doublon ci-dessus, seul le premier des deux clients à arriver
        // ici exécute ce bloc, donc on ne connaît les dieux réellement joués que du côté de
        // l'appelant. On ne l'attribue donc qu'à son propre camp (side) ; l'autre joueur garde
        // sa progression générale ("jouer"/"gagner") mais pas le crédit spécifique au dieu pour
        // cette partie -- limitation acceptée plutôt que de complexifier la garde anti-doublon.
        if (!game.is_private) {
            if (game.host_user_id) {
                const { error } = await admin.rpc('bump_daily_quest_progress', {
                    p_user_id: game.host_user_id, p_won: winnerSide === 'host',
                    p_gods_used: side === 'host' ? myGodsUsed : [],
                });
                if (error) console.error('report-match-result: bump_daily_quest_progress (host) failed:', error.message, gameId, game.host_user_id);
            }
            if (game.guest_user_id) {
                const { error } = await admin.rpc('bump_daily_quest_progress', {
                    p_user_id: game.guest_user_id, p_won: winnerSide === 'guest',
                    p_gods_used: side === 'guest' ? myGodsUsed : [],
                });
                if (error) console.error('report-match-result: bump_daily_quest_progress (guest) failed:', error.message, gameId, game.guest_user_id);
            }
        }

        if (game.is_ranked && game.host_user_id && game.guest_user_id) {
            const winnerUserId = winnerSide === 'host' ? game.host_user_id : game.guest_user_id;
            const { error } = await admin.rpc('apply_match_result', { p_game_id: gameId, p_winner_user_id: winnerUserId });
            if (error) console.error('report-match-result: apply_match_result failed:', error.message, gameId, winnerUserId);
        }

        return jsonResponse({ ok: true });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
