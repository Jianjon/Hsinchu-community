import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { authService } from '../services/authService';

export type UserRole = 'resident' | 'admin' | 'guest';

export interface UserIdentity {
    organization: string;
    title: string;
}

export interface UserProfile {
    id: string;
    name: string;
    email?: string;
    identities: UserIdentity[]; // Structured identities
    township?: string;
    village?: string;
    avatar?: string;
    coverImage?: string;
    coverImagePosition?: { x: number; y: number };
    coverImageScale?: number;
    points: number;
    joinedDate: string;
    bio?: string;
    role: UserRole; // Now mandatory for RBAC
}

interface UserContextType {
    user: UserProfile | null;
    isLoggedIn: boolean;
    showLoginOverlay: boolean;
    setLoginOverlay: (open: boolean) => void;
    login: (name?: string) => void;
    logout: () => void;
    updateProfile: (updates: Partial<UserProfile>) => void;
    addPoints: (amount: number) => void;
    visualMode: 'standard' | 'senior';
    setVisualMode: (mode: 'standard' | 'senior') => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLoginOverlay, setShowLoginOverlay] = useState(false);
    const [visualMode, setVisualMode] = useState<'standard' | 'senior'>('standard');

    // Load initial visual mode from localStorage
    useEffect(() => {
        const savedMode = localStorage.getItem('village_visual_mode');
        if (savedMode === 'senior') {
            setVisualMode('senior');
        }
    }, []);

    // Apply font scaling
    useEffect(() => {
        const root = document.documentElement;
        if (visualMode === 'senior') {
            root.style.fontSize = '20px'; // 125% of 16px
        } else {
            root.style.fontSize = '16px'; // Standard
        }
        localStorage.setItem('village_visual_mode', visualMode);
    }, [visualMode]);

    // Load initial user from Firebase Auth
    useEffect(() => {
        if (!auth) return;

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // We allow login regardless of verification now.
                // Verification gating is handled at the feature level (e.g. AnalystTool).
                let userProfile: UserProfile | null = null;

                if (db) {
                    const docRef = doc(db, 'users', firebaseUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        userProfile = docSnap.data() as UserProfile;
                    } else {
                        // First time login (new user registration happened)
                        userProfile = {
                            id: firebaseUser.uid,
                            name: firebaseUser.displayName || '熱心鄰居',
                            email: firebaseUser.email || '',
                            identities: [],
                            points: 0,
                            joinedDate: new Date().toISOString().split('T')[0],
                            role: 'resident'
                        };
                        // Save to Firestore
                        await setDoc(docRef, userProfile);
                    }
                }

                if (userProfile) {
                    setUser(userProfile);
                    setIsLoggedIn(true);
                    localStorage.setItem('village_user', JSON.stringify(userProfile));
                    setShowLoginOverlay(false);
                }
            } else {
                // Not logged in, or logged in but NOT verified
                setUser(null);
                setIsLoggedIn(false);
                localStorage.removeItem('village_user');
            }
        });

        return () => unsubscribe();
    }, []);

    const login = (name?: string, township?: string, village?: string) => {
        setShowLoginOverlay(true);
    };

    const logout = async () => {
        if (auth) {
            try {
                const { signOut } = await import('firebase/auth');
                await signOut(auth);
            } catch (error) {
                console.error("Logout Error:", error);
            }
        }
        setUser(null);
        setIsLoggedIn(false);
        localStorage.removeItem('village_user');
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!user) return;
        const updated = { ...user, ...updates };
        setUser(updated);
        localStorage.setItem('village_user', JSON.stringify(updated));

        // Sync to Firestore
        try {
            if (db) {
                await setDoc(doc(db, 'users', user.id), updated, { merge: true });
            }
        } catch (error) {
            console.error("Firestore Profile Sync Error:", error);
        }
    };

    const addPoints = (amount: number) => {
        if (!user) return;
        const updated = { ...user, points: user.points + amount };
        setUser(updated);
        localStorage.setItem('village_user', JSON.stringify(updated));
    };

    const setLoginOverlay = (open: boolean) => setShowLoginOverlay(open);

    return (
        <UserContext.Provider value={{
            user,
            isLoggedIn,
            showLoginOverlay,
            setLoginOverlay,
            login,
            logout,
            updateProfile,
            addPoints,
            visualMode,
            setVisualMode
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
