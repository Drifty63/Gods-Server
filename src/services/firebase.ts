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
    createdAt: Date;
    lastLoginAt: Date;
}

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
}

// Exports
export { auth, db, onAuthStateChanged };
export type { User };
