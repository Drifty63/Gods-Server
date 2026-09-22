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

        /*
         * Journal d'achat, uniquement si le coffret est reellement parti.
         *
         * `purchase_coffret` renvoie `success: false` quand l'ambroisie manque ou que tout le
         * contenu est deja possede : dans ces cas rien n'a ete debite, et il n'y a pas d'achat
         * a enregistrer.
         */
        if (result.success) {
            const { error: logErr } = await admin.from('purchases').insert({
                user_id: user.id,
                kind: 'coffret',
                item_id: coffretId,
                price: COFFRET_PRICE,
            });
            if (logErr) console.error('purchase-coffret: purchases insert failed:', logErr.message, coffretId);
        }

        return jsonResponse({
            success: result.success,
            message: result.message,
            godsAdded: result.gods_added,
        });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
