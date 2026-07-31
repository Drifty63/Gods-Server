import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Resolves the calling user from the request's Authorization header (the caller's own
 * anon-key + JWT, not the service role). Returns null if missing/invalid so callers can
 * respond 401 -- mirrors resolveSide()'s token-based auth for the multiplayer functions,
 * but backed by Supabase Auth instead of a game_tokens row.
 */
export async function getRequestUser(req: Request): Promise<{ id: string; email: string | undefined } | null> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return null;

    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const client = createClient(url, anonKey, {
        auth: { persistSession: false },
        global: { headers: { Authorization: authHeader } },
    });

    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email };
}
