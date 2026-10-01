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
            /*
             * LA TRANSITION NE SE FAIT QUE DEPUIS `selecting`.
             *
             * Elle était inconditionnelle, et elle est destructrice : elle remet le statut à
             * `rps`, efface le résultat ET le vainqueur du pierre-feuille-ciseaux, et vide les
             * deux choix. Un appel tardif ou répété de `select-gods` rembobinait donc une partie
             * déjà avancée — le vainqueur avait son écran « Premier / Second » sous les yeux, le
             * serveur venait de redevenir `rps`, et son clic se faisait répondre « Ce n'est pas
             * le moment de décider ». Sa partie ne démarrait jamais.
             *
             * Le `eq('status', 'selecting')` rend l'opération idempotente : une partie qui a
             * dépassé la sélection ne peut plus y être ramenée, quel que soit l'appelant.
             */
            const { data: transitioned, error: transitionErr } = await admin
                .from('games')
                .update({
                    status: 'rps',
                    rps_host_chosen: false,
                    rps_guest_chosen: false,
                    rps_result: null,
                    rps_winner: null,
                })
                .eq('id', gameId)
                .eq('status', 'selecting')
                .select('id');
            if (transitionErr) console.error('select-gods: rps transition (games) failed:', transitionErr.message, gameId);

            // Le vidage des choix suit la transition et ne s'en détache pas : effacé seul, il
            // empêcherait une manche déjà engagée de se résoudre, les deux joueurs attendant un
            // choix adverse que le serveur vient de jeter.
            if (transitioned && transitioned.length > 0) {
                const { error: resetErr } = await admin
                    .from('game_tokens')
                    .update({ rps_host_choice: null, rps_guest_choice: null })
                    .eq('game_id', gameId);
                if (resetErr) console.error('select-gods: rps choice reset (game_tokens) failed:', resetErr.message, gameId);
            }
        }

        return jsonResponse({ ok: true, bothSelected });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
