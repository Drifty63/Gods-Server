// Configuration Firebase côté client
// Ce fichier initialise Firebase Auth et Firestore pour l'application web

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, deleteUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

// Configuration Firebase (côté client - ces clés sont publiques)
const firebaseConfig = {
    apiKey: "AIzaSyBDDB6gGrZ077dTzUXbJ0RQ_O3K4M5v5Z0",
    authDomain: "godscardgame.firebaseapp.com",
    projectId: "godscardgame",
    storageBucket: "godscardgame.firebasestorage.app",
    messagingSenderId: "1015626988796",
    appId: "1:1015626988796:web:112ddeea5ce0b9468d6b79",
    measurementId: "G-QPS1YZDT3W"
};

// Initialiser Firebase (éviter de réinitialiser si déjà fait)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Types
export interface UserProfile {
    uid: string;
    email: string;
    username: string;
    usernameLower: string; // Pour recherche insensible à la casse
    avatar: string;
    level: number;
    xp: number;
    ambroisie: number; // Monnaie du jeu
    rank: string;
    stats: {
        victories: number;
        defeats: number;
        totalGames: number;
        currentStreak: number;
        bestStreak: number;
    };
    favoriteGod: string | null;
    collection: {
        godsOwned: string[];
        spellsOwned: string[];
    };
    achievements: string[];
    needsSetup?: boolean; // True si le profil nécessite une configuration initiale
    isCreator?: boolean; // True si l'utilisateur est un créateur (accès aux dieux cachés)
    dailyQuests?: DailyQuestsData; // Quêtes journalières
    createdAt: Date;
    lastLoginAt: Date;
}

// Types pour les quêtes journalières
export interface DailyQuest {
    id: string;
    name: string;
    description: string;
    progress: number;
    target: number;
    reward: number; // Ambroisie
    claimed: boolean;
}

export interface DailyQuestsData {
    quests: DailyQuest[];
    lastResetDate: string; // Format YYYY-MM-DD
}

// Définition des quêtes journalières par défaut
const DEFAULT_DAILY_QUESTS: Omit<DailyQuest, 'progress' | 'claimed'>[] = [
    { id: 'play_1', name: 'Jouer 1 partie', description: 'Participez à une partie', target: 1, reward: 50 },
    { id: 'play_3', name: 'Jouer 3 parties', description: 'Participez à 3 parties', target: 3, reward: 100 },
    { id: 'win_1', name: 'Gagner 1 partie', description: 'Remportez une victoire', target: 1, reward: 75 },
    { id: 'win_3', name: 'Gagner 3 parties', description: 'Remportez 3 victoires', target: 3, reward: 150 },
];

// Créer un profil utilisateur par défaut
function createDefaultProfile(uid: string, email: string, username: string): Omit<UserProfile, 'createdAt' | 'lastLoginAt'> {
    return {
        uid,
        email,
        username,
        usernameLower: username.toLowerCase(), // Pour recherche insensible à la casse
        avatar: '⚡',
        level: 1,
        xp: 0,
        ambroisie: 0, // Début à 0 Ambroisie
        rank: 'Novice',
        stats: {
            victories: 0,
            defeats: 0,
            totalGames: 0,
            currentStreak: 0,
            bestStreak: 0,
        },
        favoriteGod: null,
        collection: {
            godsOwned: ['poseidon', 'zeus', 'hestia'], // Dieux de départ
            spellsOwned: [],
        },
        achievements: [],
        isCreator: false,
    };
}

// =====================================
// VÉRIFICATIONS
// =====================================

// Vérifier si un pseudo est déjà pris
export async function isUsernameTaken(username: string): Promise<boolean> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('usernameLower', '==', username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

// =====================================
// AUTHENTIFICATION
// =====================================

// Inscription avec email/mot de passe
export async function registerWithEmail(email: string, password: string, username: string): Promise<User> {
    // Vérifier d'abord si le pseudo est disponible
    const taken = await isUsernameTaken(username);
    if (taken) {
        throw new Error('auth/username-already-in-use');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    try {
        // Créer le profil dans Firestore
        const profileData = createDefaultProfile(user.uid, email, username);
        await setDoc(doc(db, 'users', user.uid), {
            ...profileData,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
        });

        // Réserver le pseudo dans une collection séparée pour éviter les duplications
        await setDoc(doc(db, 'usernames', username.toLowerCase()), {
            uid: user.uid,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        // Si la création du profil échoue, supprimer le compte Auth
        await deleteUser(user);
        throw error;
    }

    return user;
}

// Connexion avec email/mot de passe
export async function loginWithEmail(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Mettre à jour la date de dernière connexion
    await updateDoc(doc(db, 'users', userCredential.user.uid), {
        lastLoginAt: serverTimestamp(),
    });

    return userCredential.user;
}

// Connexion avec Google - Retourne l'utilisateur ET si c'est un nouveau compte
export async function loginWithGoogle(): Promise<{ user: User; isNewUser: boolean }> {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Vérifier si le profil existe déjà
    const profileDoc = await getDoc(doc(db, 'users', user.uid));
    const isNewUser = !profileDoc.exists();

    if (isNewUser) {
        // Générer un pseudo temporaire basé sur le nom Google
        let baseUsername = user.displayName || user.email?.split('@')[0] || 'Joueur';
        let username = baseUsername;
        let counter = 1;

        // Trouver un pseudo disponible
        while (await isUsernameTaken(username)) {
            username = `${baseUsername}${counter}`;
            counter++;
        }

        // Créer le profil avec un flag "needsSetup" pour indiquer que le profil n'est pas configuré
        const profileData = createDefaultProfile(user.uid, user.email || '', username);
        await setDoc(doc(db, 'users', user.uid), {
            ...profileData,
            avatar: user.photoURL || '⚡',
            needsSetup: true, // Flag pour indiquer qu'il faut passer par le setup
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
        });

        // Réserver le pseudo
        await setDoc(doc(db, 'usernames', username.toLowerCase()), {
            uid: user.uid,
            createdAt: serverTimestamp(),
        });
    } else {
        // Mettre à jour la date de dernière connexion
        await updateDoc(doc(db, 'users', user.uid), {
            lastLoginAt: serverTimestamp(),
        });
    }

    return { user, isNewUser };
}

// Déconnexion
export async function logout(): Promise<void> {
    await signOut(auth);
}

// =====================================
// PROFIL UTILISATEUR
// =====================================

// Récupérer le profil utilisateur
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const profileDoc = await getDoc(doc(db, 'users', uid));

    if (profileDoc.exists()) {
        return profileDoc.data() as UserProfile;
    }

    return null;
}

// Mettre à jour le profil utilisateur
export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    await updateDoc(doc(db, 'users', uid), data);
}

// Mettre à jour le nom d'utilisateur (avec vérification d'unicité)
export async function updateUsername(uid: string, newUsername: string): Promise<void> {
    // Récupérer l'ancien username
    const profile = await getUserProfile(uid);
    if (!profile) throw new Error('Profil introuvable');

    const oldUsername = profile.username;

    // Si c'est le même, ne rien faire
    if (oldUsername.toLowerCase() === newUsername.toLowerCase()) {
        // Juste mettre à jour la casse si différente
        if (oldUsername !== newUsername) {
            await updateDoc(doc(db, 'users', uid), {
                username: newUsername,
                usernameLower: newUsername.toLowerCase()
            });
        }
        return;
    }

    // Vérifier si le nouveau pseudo est disponible
    const taken = await isUsernameTaken(newUsername);
    if (taken) {
        throw new Error('auth/username-already-in-use');
    }

    // Mettre à jour le profil et marquer comme configuré
    await updateDoc(doc(db, 'users', uid), {
        username: newUsername,
        usernameLower: newUsername.toLowerCase(),
        needsSetup: false // Marquer le profil comme configuré
    });

    // Supprimer l'ancien pseudo de la collection usernames (libérer pour d'autres)
    if (oldUsername && oldUsername.length > 0) {
        try {
            await deleteDoc(doc(db, 'usernames', oldUsername.toLowerCase()));
        } catch (err) {
            console.warn('Impossible de supprimer l\'ancien username:', err);
        }
    }

    // Réserver le nouveau pseudo
    await setDoc(doc(db, 'usernames', newUsername.toLowerCase()), {
        uid: uid,
        createdAt: serverTimestamp(),
    });
}

// Mettre à jour l'avatar
export async function updateAvatar(uid: string, avatar: string): Promise<void> {
    await updateDoc(doc(db, 'users', uid), { avatar });
}

// =====================================
// STATISTIQUES
// =====================================

// Enregistrer une victoire
export async function recordVictory(uid: string): Promise<void> {
    const profile = await getUserProfile(uid);
    if (!profile) return;

    const newStreak = profile.stats.currentStreak + 1;
    const bestStreak = Math.max(newStreak, profile.stats.bestStreak);

    await updateDoc(doc(db, 'users', uid), {
        'stats.victories': profile.stats.victories + 1,
        'stats.totalGames': profile.stats.totalGames + 1,
        'stats.currentStreak': newStreak,
        'stats.bestStreak': bestStreak,
        xp: profile.xp + 100, // +100 XP par victoire
    });

    // Mettre à jour les quêtes journalières (une partie jouée + une victoire)
    await updateQuestProgress(uid, 'play');
    await updateQuestProgress(uid, 'win');
}

// Enregistrer une défaite
export async function recordDefeat(uid: string): Promise<void> {
    const profile = await getUserProfile(uid);
    if (!profile) return;

    await updateDoc(doc(db, 'users', uid), {
        'stats.defeats': profile.stats.defeats + 1,
        'stats.totalGames': profile.stats.totalGames + 1,
        'stats.currentStreak': 0,
        xp: profile.xp + 25, // +25 XP par défaite
    });

    // Mettre à jour les quêtes journalières (une partie jouée)
    await updateQuestProgress(uid, 'play');
}

// =====================================
// QUÊTES JOURNALIÈRES
// =====================================

// Obtenir la date du jour au format YYYY-MM-DD
function getTodayDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Initialiser ou réinitialiser les quêtes journalières
function createFreshDailyQuests(): DailyQuestsData {
    return {
        quests: DEFAULT_DAILY_QUESTS.map(q => ({
            ...q,
            progress: 0,
            claimed: false,
        })),
        lastResetDate: getTodayDateString(),
    };
}

// Récupérer les quêtes journalières (avec réinitialisation automatique si nouveau jour)
export async function getDailyQuests(uid: string): Promise<DailyQuestsData> {
    const profile = await getUserProfile(uid);
    if (!profile) {
        return createFreshDailyQuests();
    }

    const today = getTodayDateString();

    // Si pas de quêtes ou si c'est un nouveau jour, réinitialiser
    if (!profile.dailyQuests || profile.dailyQuests.lastResetDate !== today) {
        const freshQuests = createFreshDailyQuests();
        await updateDoc(doc(db, 'users', uid), {
            dailyQuests: freshQuests,
        });
        return freshQuests;
    }

    return profile.dailyQuests;
}

// Mettre à jour la progression des quêtes
export async function updateQuestProgress(uid: string, type: 'play' | 'win'): Promise<void> {
    const quests = await getDailyQuests(uid);

    // Mettre à jour les quêtes correspondantes
    const updatedQuests = quests.quests.map(quest => {
        if (type === 'play' && (quest.id === 'play_1' || quest.id === 'play_3')) {
            return { ...quest, progress: Math.min(quest.progress + 1, quest.target) };
        }
        if (type === 'win' && (quest.id === 'win_1' || quest.id === 'win_3')) {
            return { ...quest, progress: Math.min(quest.progress + 1, quest.target) };
        }
        return quest;
    });

    await updateDoc(doc(db, 'users', uid), {
        'dailyQuests.quests': updatedQuests,
    });
}

// Réclamer la récompense d'une quête
export async function claimQuestReward(uid: string, questId: string): Promise<{ success: boolean; reward: number }> {
    const profile = await getUserProfile(uid);
    if (!profile || !profile.dailyQuests) {
        return { success: false, reward: 0 };
    }

    const quest = profile.dailyQuests.quests.find(q => q.id === questId);
    if (!quest) {
        return { success: false, reward: 0 };
    }

    // Vérifier si la quête est complétée et non réclamée
    if (quest.progress < quest.target || quest.claimed) {
        return { success: false, reward: 0 };
    }

    // Marquer comme réclamée et ajouter l'ambroisie
    const updatedQuests = profile.dailyQuests.quests.map(q =>
        q.id === questId ? { ...q, claimed: true } : q
    );

    const newAmbroisie = (profile.ambroisie || 0) + quest.reward;

    await updateDoc(doc(db, 'users', uid), {
        'dailyQuests.quests': updatedQuests,
        ambroisie: newAmbroisie,
    });

    return { success: true, reward: quest.reward };
}

// Réclamer toutes les récompenses disponibles
export async function claimAllQuestRewards(uid: string): Promise<{ success: boolean; totalReward: number }> {
    const profile = await getUserProfile(uid);
    if (!profile || !profile.dailyQuests) {
        return { success: false, totalReward: 0 };
    }

    let totalReward = 0;
    const updatedQuests = profile.dailyQuests.quests.map(quest => {
        if (quest.progress >= quest.target && !quest.claimed) {
            totalReward += quest.reward;
            return { ...quest, claimed: true };
        }
        return quest;
    });

    if (totalReward === 0) {
        return { success: false, totalReward: 0 };
    }

    const newAmbroisie = (profile.ambroisie || 0) + totalReward;

    await updateDoc(doc(db, 'users', uid), {
        'dailyQuests.quests': updatedQuests,
        ambroisie: newAmbroisie,
    });

    return { success: true, totalReward };
}

// Exports
export { auth, db, onAuthStateChanged };
export type { User };
