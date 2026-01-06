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
import { UserProfile, UserRole } from '../types';



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

        // Admin email whitelist - must match UserContext.tsx
        const ADMIN_EMAILS = [
            'jonchang@localexp.co',
            'admin@localexp.co',
            'jonchang1980@gmail.com',
            'jonchaung@gmail.com',
            'jianchaung@gmail.com',
        ];

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            const firebaseUser = userCredential.user;

            // Check if user should be admin based on email whitelist
            const isAdminEmail = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(
                firebaseUser.email?.toLowerCase() || ''
            );

            // Fetch profile from Firestore
            if (db) {
                const docRef = doc(db, 'users', firebaseUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const userProfile = docSnap.data() as UserProfile;

                    // Auto-upgrade to admin if in whitelist but role is not admin
                    if (isAdminEmail && userProfile.role !== 'admin') {
                        userProfile.role = 'admin';
                        await setDoc(docRef, { role: 'admin' }, { merge: true });
                        console.log('[authService] Admin role auto-assigned for:', firebaseUser.email);
                    }

                    return userProfile;
                }
            }

            // Fallback for demo/existing users
            return {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || '使用者',
                identities: [],
                points: 0,
                joinedDate: new Date().toISOString().split('T')[0],
                role: isAdminEmail ? 'admin' : 'resident'
            } as UserProfile;
        } catch (error: any) {
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

