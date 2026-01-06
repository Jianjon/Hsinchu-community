import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '../hooks/useUser';

interface FavoritesContextType {
  favorites: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const STORAGE_KEY = 'community_favorites';

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLoggedIn, updateProfile } = useUser();
  const [favorites, setFavorites] = useState<string[]>([]);

  // 1. Initial Load and Sync with User Profile
  useEffect(() => {
    const localStored = localStorage.getItem(STORAGE_KEY);
    const localFavs = localStored ? JSON.parse(localStored) : [];

    if (isLoggedIn && user) {
      // Combine cloud favorites with local ones
      const cloudFavs = user.favorites || [];
      const merged = Array.from(new Set([...cloudFavs, ...localFavs]));
      setFavorites(merged);

      // If local had data not in cloud, sync to cloud
      if (localFavs.length > 0 && merged.length > cloudFavs.length) {
        updateProfile({ favorites: merged });
      }
    } else {
      // For guest, use local storage
      setFavorites(localFavs);
    }
  }, [isLoggedIn, user?.id]);

  // 2. Persist to LocalStorage as fallback
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (id: string) => {
    setFavorites(prev => {
      const updated = prev.includes(id) ? prev : [...prev, id];
      if (isLoggedIn) {
        updateProfile({ favorites: updated });
      }
      return updated;
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites(prev => {
      const updated = prev.filter(f => f !== id);
      if (isLoggedIn) {
        updateProfile({ favorites: updated });
      }
      return updated;
    });
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export default FavoritesContext;
