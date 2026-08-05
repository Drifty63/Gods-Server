// Auth + player-data service backed by Supabase (Postgres + Auth + Edge Functions).
// Replaces src/services/firebase.ts (Firebase Auth + Firestore).

import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase-realtime';

// =====================================
// TYPES
// =====================================

export interface SavedDeck {
    id: string; // "deck_<slotIndex>" -- kept for UI compatibility, mapped to slot_index at the DB boundary
    name: string;
    godIds: string[];
}

export interface DailyQuest {
    id: string;
    name: string;
    description: string;
    progress: number;
    target: number;
    reward: number;
    claimed: boolean;
}

export interface DailyQuestsData {
    quests: DailyQuest[];
    lastResetDate: string;
}

export interface MailboxReward {
    id: string;
    title: string;
    description: string;
    ambroisie_reward: number;
    claimed: boolean;
    created_at: string;
}

export interface UserProfile {
    id: string;
    email: string;
    username: string;
    avatar: string;
    level: number;
    xp: number;
    ambroisie: number;
    rank: string;
    stats: {
        victories: number;
        defeats: number;
        totalGames: number;
        currentStreak: number;
        bestStreak: number;
    };
    favorite_god: string | null;
    gods_owned: string[];
    spells_owned: string[];
    achievements: string[];
    needs_setup: boolean;
    is_creator: boolean;
    starter_pack: string | null;
    daily_quests: DailyQuestsData | null;
    god_play_counts: Record<string, number>;
    ferveur: number;
    created_at: string;
    last_login_at: string;
    last_active_at: string;
    has_seen_welcome: boolean;
    savedDecks: SavedDeck[]; // fetched from the saved_decks table, attached client-side
}

export interface LeaderboardEntry {
    id: string;
    username: string;
    avatar: string;
    ferveur: number;
    victories: number;
}

export interface FriendEntry {
    friendship_id: string;
    id: string;
    username: string;
    avatar: string;
    ferveur: number;
    is_favorite: boolean;
    online: boolean;
    in_game: boolean;
}

export interface PendingRequestEntry {
    friendship_id: string;
    id: string;
    username: string;
    avatar: string;
    created_at: string;
}

export interface UserSearchResult {
    id: string;
    username: string;
    avatar: string;
    ferveur: number;
    relationship: 'none' | 'pending' | 'accepted' | 'blocked';
}

export interface PublicProfile {
    id: string;
    username: string;
    avatar: string;
    ferveur: number;
    level: number;
    stats: UserProfile['stats'];
}

export interface MatchHistoryEntry {
    id: string;
    game_id: string | null;
    opponent_id: string | null;
    opponent_name: string;
    result: 'victory' | 'defeat';
    ferveur_change: number;
    created_at: string;
}

// =====================================
// PACKS & PRIX
// =====================================

export const STARTER_PACKS = {
    poseidon: {
        id: 'poseidon',
        name: 'Coffret Poséidon',
        godIds: ['poseidon', 'artemis', 'athena', 'demeter'],
        color: '#3b82f6',
    },
    hades: {
        id: 'hades',
        name: 'Coffret Hadès',
        godIds: ['hades', 'nyx', 'apollon', 'ares'],
        color: '#ef4444',
    },
    zeus: {
        id: 'zeus',
        name: 'Coffret Zeus',
        godIds: ['zeus', 'hestia', 'aphrodite', 'dionysos'],
        color: '#fbbf24',
    },
} as const;

export type StarterPackId = keyof typeof STARTER_PACKS;

export const GOD_PRICE = 3000;
export const GOD_PROMO_PRICE = 2000;
export const COFFRET_PRICE = 10000;

// =====================================
// VÉRIFICATIONS
// =====================================

export async function isUsernameTaken(username: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('is_username_taken', { p_username: username });
    if (error) throw error;
    return Boolean(data);
}

// =====================================
// AUTHENTIFICATION
// =====================================

export async function registerWithEmail(email: string, password: string, username: string): Promise<User> {
    const taken = await isUsernameTaken(username);
    if (taken) throw new Error('auth/username-already-in-use');

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
    });
    if (error) throw error;
    if (!data.user) throw new Error("Erreur lors de la création du compte");
    return data.user;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
}

// Connexion Google -- redirige vers Google puis revient sur l'app (flux OAuth, pas de
// retour synchrone possible). RequireAuth gère déjà la redirection vers /profile/setup
// pour les nouveaux comptes (gods_owned vide), donc aucun signal isNewUser n'est requis ici.
export async function loginWithGoogle(): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) throw error;
}

export async function logout(): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

// =====================================
// PROFIL UTILISATEUR
// =====================================

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const supabase = getSupabaseClient();
    const [{ data: profile, error: profileErr }, { data: decks }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).single(),
        supabase.from('saved_decks').select('slot_index, name, god_ids').eq('user_id', uid).order('slot_index'),
    ]);

    if (profileErr || !profile) return null;

    const savedDecks: SavedDeck[] = (decks ?? []).map((d) => ({
        id: `deck_${d.slot_index}`,
        name: d.name,
        godIds: d.god_ids,
    }));

    return { ...profile, savedDecks } as UserProfile;
}

export async function updateUsername(uid: string, newUsername: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername, needs_setup: false })
        .eq('id', uid);
    if (error) throw error;
}

export async function updateAvatar(uid: string, avatar: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('profiles').update({ avatar }).eq('id', uid);
    if (error) throw error;
}

// =====================================
// PACK STARTER / ACHATS (Edge Functions -- prix et contenus résolus côté serveur)
// =====================================

async function invokeFn<T>(name: string, body: Record<string, unknown>): Promise<T> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) throw error;
    return data as T;
}

export async function claimStarterPack(packId: StarterPackId): Promise<void> {
    const result = await invokeFn<{ success: boolean; message?: string }>('claim-starter-pack', { packId });
    if (!result.success) throw new Error(result.message ?? 'Impossible de réclamer le pack starter');
}

export async function purchaseGod(
    godId: string,
    isPromo: boolean = false
): Promise<{ success: boolean; message: string }> {
    return invokeFn('purchase-god', { godId, isPromo });
}

export async function purchaseCoffret(
    coffretId: string
): Promise<{ success: boolean; message: string; godsAdded?: string[] }> {
    return invokeFn('purchase-coffret', { coffretId });
}

// =====================================
// DECKS SAUVEGARDÉS
// =====================================

export async function saveDecks(decks: SavedDeck[]): Promise<void> {
    const supabase = getSupabaseClient();
    const payload = decks.map((deck, index) => ({
        slot_index: Number(deck.id.replace('deck_', '')) || index,
        name: deck.name,
        god_ids: deck.godIds,
    }));
    const { error } = await supabase.rpc('replace_saved_decks', { p_decks: payload });
    if (error) throw error;
}

// =====================================
// QUÊTES JOURNALIÈRES
// =====================================

export async function getDailyQuests(): Promise<DailyQuestsData> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_daily_quests');
    if (error) throw error;
    return data as DailyQuestsData;
}

export async function claimQuestReward(questId: string): Promise<{ success: boolean; reward: number }> {
    return invokeFn('claim-quest-reward', { questId });
}

export async function claimAllQuestRewards(): Promise<{ success: boolean; totalReward: number }> {
    return invokeFn('claim-all-quest-rewards', {});
}

// =====================================
// STATISTIQUES DIEUX
// =====================================

export function getMostPlayedGod(
    godPlayCounts: Record<string, number> | undefined
): { godId: string; count: number } | null {
    if (!godPlayCounts || Object.keys(godPlayCounts).length === 0) {
        return null;
    }

    let maxGodId = '';
    let maxCount = 0;

    for (const [godId, count] of Object.entries(godPlayCounts)) {
        if (count > maxCount) {
            maxCount = count;
            maxGodId = godId;
        }
    }

    return maxGodId ? { godId: maxGodId, count: maxCount } : null;
}

// =====================================
// CLASSEMENT (Ferveur)
// =====================================

export async function getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_leaderboard', { p_limit: limit });
    if (error) throw error;
    return (data ?? []) as LeaderboardEntry[];
}

export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_public_profile', { p_user_id: userId });
    if (error) throw error;
    const rows = (data ?? []) as PublicProfile[];
    return rows[0] ?? null;
}

export async function getMatchHistory(limit: number = 20): Promise<MatchHistoryEntry[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('match_history')
        .select('id, game_id, opponent_id, opponent_name, result, ferveur_change, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw error;
    return (data ?? []) as MatchHistoryEntry[];
}

// Heartbeat de présence : appelé périodiquement pendant que l'app est ouverte pour que
// get_friends_list() puisse dériver un statut "En ligne" approximatif (activité < 2min).
export async function pingLastActive(uid: string): Promise<void> {
    const supabase = getSupabaseClient();
    await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', uid);
}

// Marque le modal de bienvenue comme vu, pour qu'il ne s'affiche plus jamais après la
// première connexion.
export async function markWelcomeSeen(uid: string): Promise<void> {
    const supabase = getSupabaseClient();
    await supabase.from('profiles').update({ has_seen_welcome: true }).eq('id', uid);
}

// =====================================
// AMIS
// =====================================

export async function getFriendsList(): Promise<FriendEntry[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_friends_list');
    if (error) throw error;
    return (data ?? []) as FriendEntry[];
}

export async function getPendingRequests(): Promise<PendingRequestEntry[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_pending_requests');
    if (error) throw error;
    return (data ?? []) as PendingRequestEntry[];
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('search_users', { p_query: query });
    if (error) throw error;
    return (data ?? []) as UserSearchResult[];
}

export async function sendFriendRequest(username: string): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('send_friend_request', { p_username: username });
    if (error) throw error;
    const rows = (data ?? []) as { success: boolean; message: string }[];
    return rows[0] ?? { success: false, message: 'Erreur inconnue' };
}

export async function respondFriendRequest(friendshipId: string, accept: boolean): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('respond_friend_request', { p_friendship_id: friendshipId, p_accept: accept });
    if (error) throw error;
}

export async function removeFriendship(friendshipId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('remove_friendship', { p_friendship_id: friendshipId });
    if (error) throw error;
}

export async function blockUser(friendshipId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('block_user', { p_friendship_id: friendshipId });
    if (error) throw error;
}

export async function toggleFavoriteFriend(friendshipId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('toggle_favorite_friend', { p_friendship_id: friendshipId });
    if (error) throw error;
}

// =====================================
// RÉCOMPENSES (boîte de cadeaux)
// =====================================

export async function getMailboxRewards(): Promise<MailboxReward[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('mailbox_rewards')
        .select('id, title, description, ambroisie_reward, claimed, created_at')
        .order('claimed', { ascending: true })
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as MailboxReward[];
}

export async function claimMailboxReward(rewardId: string): Promise<{ success: boolean; message: string; ambroisie_reward: number }> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('claim_mailbox_reward', { p_reward_id: rewardId });
    if (error) throw error;
    const rows = (data ?? []) as { success: boolean; message: string; ambroisie_reward: number }[];
    return rows[0] ?? { success: false, message: 'Erreur inconnue', ambroisie_reward: 0 };
}

export async function claimAllMailboxRewards(): Promise<{ success: boolean; total_ambroisie: number }> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('claim_all_mailbox_rewards');
    if (error) throw error;
    const rows = (data ?? []) as { success: boolean; total_ambroisie: number }[];
    return rows[0] ?? { success: false, total_ambroisie: 0 };
}

export type { User };
