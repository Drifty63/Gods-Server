import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/admin-client.ts';
import { getRequestUser } from '../_shared/auth-client.ts';

/**
 * Clôture une ascension : met à jour le record d'étage et crédite l'ambroisie gagnée.
 *
 * Comme pour report-match-result, le combat se déroule côté client : on fait donc confiance à
 * l'étage annoncé, mais le RPC borne la récompense à ce que ces étages peuvent réellement
 * rapporter, et l'écriture reste réservée à la clé de service (aucun droit d'écriture client sur
 * ambroisie / ascension_best_floor).
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const user = await getRequestUser(req);
        if (!user) return jsonResponse({ error: 'Non authentifié' }, 401);

        const { floorReached, reward } = await req.json();
        if (typeof floorReached !== 'number' || !Number.isInteger(floorReached)) {
            return jsonResponse({ error: 'floorReached (entier) requis' }, 400);
        }

        const admin = getAdminClient();
        const { data, error } = await admin
            .rpc('report_ascension_run', {
                p_uid: user.id,
                p_floor_reached: floorReached,
                p_reward: typeof reward === 'number' ? Math.trunc(reward) : 0,
            })
            .single();

        if (error) return jsonResponse({ error: error.message }, 500);

        const result = data as { success: boolean; best_floor: number; ambroisie_granted: number };
        return jsonResponse({
            success: result.success,
            bestFloor: result.best_floor,
            ambroisieGranted: result.ambroisie_granted,
        });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
