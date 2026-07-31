import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/admin-client.ts';
import { getRequestUser } from '../_shared/auth-client.ts';
import { GOD_PRICE, GOD_PROMO_PRICE } from '../_shared/game-data.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const user = await getRequestUser(req);
        if (!user) return jsonResponse({ error: 'Non authentifié' }, 401);

        const { godId, isPromo } = await req.json();
        if (!godId || typeof godId !== 'string') return jsonResponse({ error: 'godId requis' }, 400);

        const admin = getAdminClient();
        const { data: profile, error: fetchErr } = await admin
            .from('profiles')
            .select('gods_owned, ambroisie')
            .eq('id', user.id)
            .single();
        if (fetchErr || !profile) return jsonResponse({ success: false, message: 'Profil introuvable' });

        if (profile.gods_owned.includes(godId)) {
            return jsonResponse({ success: false, message: 'Vous possédez déjà ce dieu' });
        }

        const price = isPromo ? GOD_PROMO_PRICE : GOD_PRICE;
        if (profile.ambroisie < price) {
            return jsonResponse({ success: false, message: "Pas assez d'ambroisie" });
        }

        // Optimistic-lock guard on ambroisie: any concurrent purchase changes it, so a
        // racing request's WHERE fails to match and the update affects 0 rows.
        const { data: updated, error: updateErr } = await admin
            .from('profiles')
            .update({ gods_owned: [...profile.gods_owned, godId], ambroisie: profile.ambroisie - price })
            .eq('id', user.id)
            .eq('ambroisie', profile.ambroisie)
            .select('id');
        if (updateErr) return jsonResponse({ error: updateErr.message }, 500);
        if (!updated || updated.length === 0) {
            return jsonResponse({ success: false, message: 'Achat concurrent détecté, réessayez' });
        }

        return jsonResponse({ success: true, message: 'Dieu acheté avec succès !' });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
