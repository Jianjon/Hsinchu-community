import { createContext } from 'react';
import { UserProfile } from '../types';

export interface UserContextType {
    user: UserProfile | null;
    isLoggedIn: boolean;
    showLoginOverlay: boolean;
    setLoginOverlay: (open: boolean) => void;
    login: (name?: string) => void;
    logout: () => void;
    updateProfile: (updates: Partial<UserProfile>) => void;
    addPoints: (amount: number) => void;
    recordVisit: (villageId: string, cityName: string, villageName: string) => Promise<void>;
    visualMode: 'standard' | 'senior';
    setVisualMode: (mode: 'standard' | 'senior') => void;
    bypassLogin: (user: UserProfile) => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);
