import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Client Supabase unique côté navigateur (auth anonyme désactivée, on n'utilise que
 * Postgres + Realtime + les Edge Functions). Remplace l'ancien singleton socket.io
 * (voir src/services/socket.ts, retiré) — même rôle, même pattern.
 */
export function getSupabaseClient(): SupabaseClient {
    if (client) return client;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY manquants');
    }

    client = createClient(url, anonKey, {
        auth: { persistSession: false },
    });

    return client;
}
