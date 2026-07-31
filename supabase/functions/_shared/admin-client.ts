import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function getAdminClient() {
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export type Side = 'host' | 'guest';

/** Matches a client-supplied token against a game's stored host/guest tokens. */
export async function resolveSide(
    admin: ReturnType<typeof getAdminClient>,
    gameId: string,
    token: string
): Promise<Side | null> {
    const { data, error } = await admin
        .from('game_tokens')
        .select('host_token, guest_token')
        .eq('game_id', gameId)
        .single();

    if (error || !data) return null;
    if (data.host_token === token) return 'host';
    if (data.guest_token === token) return 'guest';
    return null;
}

/** Generates a unique 6-char uppercase alphanumeric game code, retrying on collision. */
export async function generateUniqueGameId(admin: ReturnType<typeof getAdminClient>): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/I/1 to avoid ambiguity
    for (let attempt = 0; attempt < 10; attempt++) {
        let id = '';
        for (let i = 0; i < 6; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        const { data } = await admin.from('games').select('id').eq('id', id).maybeSingle();
        if (!data) return id;
    }
    throw new Error('Could not generate a unique game id');
}
