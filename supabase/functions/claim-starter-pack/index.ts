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

        return jsonResponse({ success: true });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
