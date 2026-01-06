import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useFavorites } from '../contexts/FavoritesContext';
import GlobalMixboardView from '../components/GlobalMixboardView';
import { Map, Search } from 'lucide-react';

const MyNeighborhoodPage: React.FC = () => {
    const { user } = useUser();
    const { favorites } = useFavorites();
    const navigate = useNavigate();

    // Check if user has context (Home Village or Favorites)
    const hasHome = user?.village && user?.township;
    const hasFavorites = favorites && favorites.length > 0;
    const hasContent = hasHome || hasFavorites;

    if (!hasContent) {
        // Empty State / Onboarding
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center pb-24">
                <div className="w-48 h-48 bg-emerald-50 rounded-full flex items-center justify-center mb-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-100/50 animate-pulse rounded-full"></div>
                    <Map className="w-20 h-20 text-emerald-600 relative z-10" />
                </div>

                <h1 className="text-3xl font-black text-slate-800 mb-4 font-serif-tc">
                    歡迎來到社區脈動
                </h1>
                <p className="text-slate-500 mb-8 max-w-xs leading-relaxed">
                    在這裡，您可以關注您居住的鄰里，或收藏感興趣的社區。目前還是一片空白，快去探索吧！
                </p>

                <div className="w-full max-w-sm space-y-4">
                    <button
                        onClick={() => navigate('/directory')}
                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <Search className="w-5 h-5" />
                        搜尋村里加入
                    </button>
                    <button
                        onClick={() => navigate('/map')}
                        className="w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold text-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <Map className="w-5 h-5" />
                        在地圖上探索
                    </button>
                </div>
            </div>
        );
    }

    // Render Dashboard
    return (
        <div className="min-h-screen bg-[#FDFCF8]">
            {/* Pass undefined community to trigger internal user-based logic */}
            <GlobalMixboardView />
        </div>
    );
};

export default MyNeighborhoodPage;
