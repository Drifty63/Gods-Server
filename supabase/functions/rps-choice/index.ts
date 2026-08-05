import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, resolveSide } from '../_shared/admin-client.ts';

type Choice = 'rock' | 'paper' | 'scissors';

function getRpsResult(hostChoice: Choice, guestChoice: Choice): 'draw' | 'host_wins' | 'guest_wins' {
    if (hostChoice === guestChoice) return 'draw';
    const hostBeatsGuest =
        (hostChoice === 'rock' && guestChoice === 'scissors') ||
        (hostChoice === 'paper' && guestChoice === 'rock') ||
        (hostChoice === 'scissors' && guestChoice === 'paper');
    return hostBeatsGuest ? 'host_wins' : 'guest_wins';
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { gameId, token, choice } = await req.json();
        if (!gameId || !token || !['rock', 'paper', 'scissors'].includes(choice)) {
            return jsonResponse({ error: 'gameId, token et choice (rock|paper|scissors) requis' }, 400);
        }

        const admin = getAdminClient();
        const side = await resolveSide(admin, gameId, token);
        if (!side) return jsonResponse({ error: 'Jeton invalide' }, 401);

        const { data: game, error: gameErr } = await admin
            .from('games')
            .select('status')
            .eq('id', gameId)
            .single();
        if (gameErr || !game) return jsonResponse({ error: 'Partie introuvable' }, 404);
        if (game.status !== 'rps') return jsonResponse({ error: "Ce n'est pas la phase de pierre-feuille-ciseaux" }, 400);

        const choiceColumn = side === 'host' ? 'rps_host_choice' : 'rps_guest_choice';
        const chosenFlag = side === 'host' ? 'rps_host_chosen' : 'rps_guest_chosen';

        const { error: choiceErr } = await admin.from('game_tokens').update({ [choiceColumn]: choice }).eq('game_id', gameId);
        if (choiceErr) console.error('rps-choice: game_tokens choice update failed:', choiceErr.message, gameId, side);
        const { error: chosenErr } = await admin.from('games').update({ [chosenFlag]: true }).eq('id', gameId);
        if (chosenErr) console.error('rps-choice: games chosen-flag update failed:', chosenErr.message, gameId, side);

        const { data: tokens } = await admin
            .from('game_tokens')
            .select('rps_host_choice, rps_guest_choice')
            .eq('game_id', gameId)
            .single();

        if (tokens?.rps_host_choice && tokens?.rps_guest_choice) {
            const result = getRpsResult(tokens.rps_host_choice as Choice, tokens.rps_guest_choice as Choice);
            if (result === 'draw') {
                // On garde une trace de l'égalité dans rps_result (rps_winner reste null) pour
                // que le client puisse afficher la révélation "égalité, on recommence" — reset
                // immédiat des choix côté serveur pour permettre un nouveau round tout de suite,
                // le client gère lui-même le délai d'affichage de la bannière.
                const { error: resetErr } = await admin
                    .from('game_tokens')
                    .update({ rps_host_choice: null, rps_guest_choice: null })
                    .eq('game_id', gameId);
                if (resetErr) console.error('rps-choice: draw reset (game_tokens) failed:', resetErr.message, gameId);
                const { error: drawErr } = await admin
                    .from('games')
                    .update({
                        rps_host_chosen: false,
                        rps_guest_chosen: false,
                        rps_result: {
                            hostChoice: tokens.rps_host_choice,
                            guestChoice: tokens.rps_guest_choice,
                            result,
                        },
                    })
                    .eq('id', gameId);
                if (drawErr) console.error('rps-choice: draw result (games) failed:', drawErr.message, gameId);
            } else {
                const winner = result === 'host_wins' ? 'host' : 'guest';
                const { error: winErr } = await admin
                    .from('games')
                    .update({
                        rps_result: {
                            hostChoice: tokens.rps_host_choice,
                            guestChoice: tokens.rps_guest_choice,
                            result,
                        },
                        rps_winner: winner,
                        status: 'rps_deciding',
                    })
                    .eq('id', gameId);
                if (winErr) console.error('rps-choice: winner result (games) failed:', winErr.message, gameId, winner);
            }
        }

        return jsonResponse({ ok: true });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
