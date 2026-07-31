import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/admin-client.ts';
import { getRequestUser } from '../_shared/auth-client.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const user = await getRequestUser(req);
        if (!user) return jsonResponse({ error: 'Non authentifié' }, 401);

        const admin = getAdminClient();
        const { data, error } = await admin
            .rpc('claim_all_quest_rewards', { p_uid: user.id })
            .single();

        if (error) return jsonResponse({ error: error.message }, 500);

        const result = data as { success: boolean; total_reward: number };
        return jsonResponse({ success: result.success, totalReward: result.total_reward });
    } catch (e) {
        return jsonResponse({ error: (e as Error).message }, 400);
    }
});
