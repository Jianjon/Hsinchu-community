import { auth, db } from './firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../contexts/UserContext';

export type UserRole = 'resident' | 'admin' | 'guest';

export const authService = {
    /**
     * Register a new user with email and password
     */
    register: async (email: string, pass: string, name: string, role: UserRole = 'resident', inviteCode?: string) => {
        if (!auth) throw new Error('auth-not-initialized');

        // 0. Validate Admin Invite Code
        if (role === 'admin' && inviteCode !== 'VILLAGE_2024') {
            throw new Error('invalid-invite-code');
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const firebaseUser = userCredential.user;

            // 1. Send Verification Email
            await sendEmailVerification(firebaseUser);
            console.log("Verification email sent to:", email);

            // 2. Create user profile in Firestore
            const newUser: UserProfile = {
                id: firebaseUser.uid,
                name: name,
                identities: [],
                points: 0,
                joinedDate: new Date().toISOString().split('T')[0],
                role: role,
                bio: role === 'admin' ? '社區管理員' : '社區居民'
            };

            if (db) {
                await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            }

            return newUser;
        } catch (error) {
            console.error("Registration Error:", error);
            throw error;
        }
    },

    /**
     * Login with email and password
     */
    login: async (email: string, pass: string) => {
        if (!auth) throw new Error('auth-not-initialized');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            const firebaseUser = userCredential.user;

            // REMOVED: Email verification check at login. 
            // We now handle verification gating per feature (e.g., AnalaystTool).

            // Fetch profile from Firestore
            if (db) {
                const docRef = doc(db, 'users', firebaseUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    return docSnap.data() as UserProfile;
                }
            }

            // Fallback for demo/existing users
            return {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || '使用者',
                identities: [],
                points: 0,
                joinedDate: new Date().toISOString().split('T')[0],
                role: 'resident'
            } as UserProfile;
        } catch (error) {
            console.error("Login Error:", error);
            throw error;
        }
    },

    /**
     * Resend verification email to the current user
     */
    resendVerification: async () => {
        if (!auth || !auth.currentUser) throw new Error('no-user-logged-in');
        try {
            await sendEmailVerification(auth.currentUser);
            return true;
        } catch (error) {
            console.error("Resend Verification Error:", error);
            throw error;
        }
    },




    /**
     * Sign out
     */
    logout: async () => {
        if (!auth) throw new Error('auth-not-initialized');
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout Error:", error);
            throw error;
        }
    }
};

