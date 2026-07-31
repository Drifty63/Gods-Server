import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/admin-client.ts';
import { getRequestUser } from '../_shared/auth-client.ts';
import { STARTER_PACKS, StarterPackId, COFFRET_PRICE } from '../_shared/game-data.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const user = await getRequestUser(req);
        if (!user) return jsonResponse({ error: 'Non authentifié' }, 401);

        const { coffretId } = await req.json();
        const pack = STARTER_PACKS[coffretId as StarterPackId];
        if (!pack) return jsonResponse({ success: false, message: 'Coffret introuvable' });

        const admin = getAdminClient();
        const { data, error } = await admin
            .rpc('purchase_coffret', {
                p_uid: user.id,
                p_gods_in_pack: pack.godIds,
                p_price: COFFRET_PRICE,
            })
            .single();

        if (error) return jsonResponse({ error: error.message }, 500);

        const result = data as { success: boolean; message: string; gods_added: string[] };
        return jsonResponse({
            success: result.success,
            message: result.message,
            godsAdded: result.gods_added,
        });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
