import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/admin-client.ts';
import { getRequestUser } from '../_shared/auth-client.ts';
import { STARTER_PACKS, StarterPackId } from '../_shared/game-data.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const user = await getRequestUser(req);
        if (!user) return jsonResponse({ error: 'Non authentifié' }, 401);

        const { packId } = await req.json();
        const pack = STARTER_PACKS[packId as StarterPackId];
        if (!pack) return jsonResponse({ error: 'Pack starter invalide' }, 400);

        const admin = getAdminClient();

        // Guarded update: only succeeds if gods_owned is still empty, closing the
        // double-claim race structurally (Postgres re-evaluates the WHERE per writer).
        const { data, error } = await admin
            .from('profiles')
            .update({ gods_owned: pack.godIds, starter_pack: pack.id })
            .eq('id', user.id)
            .filter('gods_owned', 'eq', '{}')
            .select('id');

        if (error) return jsonResponse({ error: error.message }, 500);
        if (!data || data.length === 0) {
            return jsonResponse({ success: false, message: 'Vous avez déjà reçu votre pack starter' });
        }

        /*
         * Le pack de départ est journalisé à PRIX NUL.
         *
         * Il ne rapporte rien, mais sans cette ligne il deviendrait impossible de distinguer un
         * dieu ACHETÉ d'un dieu OFFERT : les deux atterrissent dans le même `gods_owned`. Le
         * prix à zéro porte toute la différence.
         *
         * Après l'update gardé, donc une seule fois par joueur : la seconde tentative sort plus
         * haut sur « pack déjà reçu ».
         */
        const { error: logErr } = await admin.from('purchases').insert(
            pack.godIds.map((godId: string) => ({
                user_id: user.id,
                kind: 'starter_pack',
                item_id: godId,
                price: 0,
            })),
        );
        // Jamais bloquant : un pack de départ ne doit pas échouer pour une ligne de statistique.
        if (logErr) console.error('claim-starter-pack: purchases insert failed:', logErr.message, pack.id);

        return jsonResponse({ success: true });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
