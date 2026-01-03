import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FavoritesContextType {
  favorites: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const STORAGE_KEY = 'community_favorites';

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites to localStorage', e);
    }
  }, [favorites]);

  const addFavorite = (id: string) => {
    setFavorites(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites(prev => prev.filter(f => f !== id));
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
