import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { UserProfile, UserRole, UserIdentity } from '../types';

import { UserContext, UserContextType } from './UserContextInstance';

// Admin email whitelist - add your admin emails here
const ADMIN_EMAILS = [
    'jonchang@localexp.co',
    'admin@localexp.co',
    'jonchang1980@gmail.com',
    'jonchaung@gmail.com',
    'jianchaung@gmail.com',
    // Add more admin emails as needed
];

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

                // Determine if user should be admin based on email whitelist
                const isAdminEmail = ADMIN_EMAILS.includes(firebaseUser.email?.toLowerCase() || '');

                if (db) {
                    const docRef = doc(db, 'users', firebaseUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        userProfile = docSnap.data() as UserProfile;
                        // Update role if email is in admin whitelist but role isn't admin
                        if (isAdminEmail && userProfile.role !== 'admin') {
                            userProfile.role = 'admin';
                            await setDoc(docRef, { role: 'admin' }, { merge: true });
                            console.log('Admin role auto-assigned for:', firebaseUser.email);
                        }
                    } else {
                        // First time login (new user registration happened)
                        userProfile = {
                            id: firebaseUser.uid,
                            name: firebaseUser.displayName || '熱心鄰居',
                            email: firebaseUser.email || '',
                            identities: [],
                            points: 0,
                            joinedDate: new Date().toISOString().split('T')[0],
                            role: isAdminEmail ? 'admin' : 'resident'
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
                const { authService } = await import('../services/authService');
                await authService.logout();
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
        // Sync points to Firestore
        if (db) {
            setDoc(doc(db, 'users', user.id), { points: updated.points }, { merge: true });
        }
    };

    const recordVisit = async (villageId: string, cityName: string, villageName: string) => {
        if (!user || user.id === 'guest_user') return;

        const now = Date.now();
        const visitItem = { id: villageId, name: `${cityName}${villageName}`, time: now };

        // 1. Update Recently Viewed (Keep top 5 unique, most recent first)
        let recent = [...(user.recentlyViewed || [])];
        // Remove if already exists
        recent = recent.filter(item => item.id !== villageId);
        // Add to front
        recent.unshift(visitItem);
        // Limit to 5
        recent = recent.slice(0, 5);

        // 2. Check Achievements
        const achievements = [...(user.achievements || [])];
        if (recent.length >= 5 && !achievements.includes('explorer')) {
            achievements.push('explorer');
        }

        await updateProfile({
            recentlyViewed: recent,
            achievements: achievements
        });
    };

    // Auto-check achievement for favorites (run whenever user changed)
    useEffect(() => {
        if (user && user.id !== 'guest_user') {
            const achievements = [...(user.achievements || [])];
            if ((user.favorites || []).length >= 3 && !achievements.includes('pioneer')) {
                achievements.push('pioneer');
                updateProfile({ achievements });
            }
        }
    }, [user?.favorites?.length]);

    const setLoginOverlay = (open: boolean) => setShowLoginOverlay(open);

    // NEW: Allow manual login for Guest/Fallback scenarios
    // Also applies admin whitelist check
    const bypassLogin = (forcedUser: UserProfile) => {
        // Check admin whitelist
        const email = forcedUser.email?.toLowerCase() || '';
        const isAdminEmail = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email);

        if (isAdminEmail && forcedUser.role !== 'admin') {
            forcedUser.role = 'admin';
            console.log('[bypassLogin] Admin role auto-assigned for:', email);

            // Also update Firestore if we have the user ID
            if (db && forcedUser.id && forcedUser.id !== 'guest_user') {
                setDoc(doc(db, 'users', forcedUser.id), { role: 'admin' }, { merge: true })
                    .then(() => console.log('Firestore role updated to admin'))
                    .catch(err => console.error('Failed to update Firestore role:', err));
            }
        }

        setUser(forcedUser);
        setIsLoggedIn(true);
        localStorage.setItem('village_user', JSON.stringify(forcedUser));
        setShowLoginOverlay(false);
    };

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
            recordVisit,
            visualMode,
            setVisualMode,
            bypassLogin // Exposed
        }}>
            {children}
        </UserContext.Provider>
    );
};

export { useUser } from '../hooks/useUser';
