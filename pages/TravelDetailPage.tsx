import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Tent, MapPin, Star, Share2 } from 'lucide-react';
import { MOCK_COMMUNITIES } from '../data/mock_public';

const TravelDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Helper to find spot by ID
    const spot = React.useMemo(() => {
        for (const community of MOCK_COMMUNITIES) {
            const found = community.travelSpots.find(s => s.id === id);
            if (found) return { ...found, communityName: community.name };
        }
        // Fallback for mock IDs if needed (or handle real API logic)
        return null;
    }, [id]);

    if (!spot) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">找不到景點</h2>
                    <p className="text-slate-600 mb-6">您查看的景點可能已被移除或資訊有誤。</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        返回上一頁
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header - Transparent overlay style for immersive feel */}
            <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                <div className="flex items-center justify-between pointer-events-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <button className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-colors">
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative h-[50vh] w-full bg-slate-200">
                <img
                    src={spot.imageUrl || spot.coverImage}
                    alt={spot.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                    <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-xs font-bold mb-2 inline-block">
                        {spot.communityName}
                    </span>
                    <h1 className="text-3xl font-bold mb-2">{spot.name}</h1>
                    <div className="flex items-center gap-4 text-sm font-medium opacity-90">
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> 新竹縣（模擬位置）</span>
                        <span className="flex items-center gap-1 text-yellow-400"><Star className="w-4 h-4 fill-current" /> 4.8 (2k+ 評論)</span>
                    </div>
                </div>
            </div>

            <main className="max-w-3xl mx-auto p-6 -mt-6 bg-white rounded-t-3xl relative z-10 min-h-[50vh]">
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6"></div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
                            <Tent className="w-5 h-5 text-orange-600" />
                            景點介紹
                        </h3>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {spot.description || "這是一個值得一去的好地方，擁有豐富的自然景觀與人文風情。歡迎來到這裡放鬆身心，體驗在地的美好。"}
                        </p>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                        <h4 className="font-bold text-orange-900 mb-2 text-sm">💡 旅遊小貼士</h4>
                        <ul className="text-sm text-orange-800/80 space-y-1 list-disc list-inside">
                            <li>建議穿著舒適的步行鞋。</li>
                            <li>週末人潮較多，建議提前規劃行程。</li>
                            <li>請愛護環境，隨手帶走垃圾。</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TravelDetailPage;
