import { Tent, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TravelSpotItem } from '../../hooks/useMixboardData';

interface TravelRecommendWidgetProps {
    recommendations?: TravelSpotItem[];
}

const TravelRecommendWidget: React.FC<TravelRecommendWidgetProps> = ({ recommendations = [] }) => {
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);

    // Default fallback spot
    const defaultSpot: TravelSpotItem = {
        id: 'default',
        imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop",
        name: "司馬庫斯神木群",
        rating: "4.8",
        reviewCount: "2,403",
        location: "尖石鄉",
        description: "週末輕旅行"
    };

    const hasRecommendations = recommendations.length > 0;
    const spot = hasRecommendations ? recommendations[currentIndex] : defaultSpot;

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!hasRecommendations) return;
        setCurrentIndex((prev) => (prev - 1 + recommendations.length) % recommendations.length);
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!hasRecommendations) return;
        setCurrentIndex((prev) => (prev + 1) % recommendations.length);
    };

    return (
        <div className="h-full flex flex-col p-6 bg-[#FAFAFA] relative overflow-hidden">

            {/* Header - Standardized */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Tent className="w-5 h-5 text-[#92400E]" />
                    <h3 className="font-serif text-lg font-bold text-[#78350F]">週末推薦</h3>
                </div>
                <span className="text-[10px] font-bold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                    輕旅行
                </span>
            </div>

            <div
                className="flex-1 relative rounded-xl overflow-hidden group mb-2 cursor-pointer"
                onClick={() => navigate(`/travel/${spot.id}`)}
            >
                <img
                    src={spot.imageUrl}
                    alt="Travel"
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />

                {/* Navigation Overlays */}
                {hasRecommendations && (
                    <>
                        <div
                            onClick={handlePrev}
                            className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/40 to-transparent flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-black/20"
                        >
                            <ChevronLeft className="w-6 h-6 text-white drop-shadow-md" />
                        </div>
                        <div
                            onClick={handleNext}
                            className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/40 to-transparent flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-black/20"
                        >
                            <ChevronRight className="w-6 h-6 text-white drop-shadow-md" />
                        </div>
                    </>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none flex flex-col justify-end p-3 z-10">
                    <span className="text-[10px] text-white/90 font-medium mb-0.5 tracking-wider">{spot.location}</span>
                    <h4 className="text-white font-bold text-sm tracking-wide">{spot.name}</h4>
                </div>
            </div>
        </div>
    );
};

export default TravelRecommendWidget;
