import React, { useState } from 'react';
import { Palette, Sparkles } from 'lucide-react';
import AIPulseWidget from './widgets/AIPulseWidget';
import WeatherWidget from './widgets/WeatherWidget';
import VillageFeedsWidget from './widgets/VillageFeedsWidget';
import NeighborhoodCalendarWidget from './widgets/NeighborhoodCalendarWidget';
import TravelRecommendWidget from './widgets/TravelRecommendWidget';
import SafetyGuardWidget from './widgets/SafetyGuardWidget';
import TransportWidget from './widgets/TransportWidget';
import SustainabilityStatsWidget from './widgets/SustainabilityStatsWidget';
import AISearchOverlay from './AISearchOverlay';
import { useMixboardData } from '../hooks/useMixboardData';
import { useUser } from '../hooks/useUser';
import { PublicCommunity } from '../data/mock_public';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface GlobalMixboardViewProps {
    community?: PublicCommunity;
    onNavigate?: (id: string) => void;
}

const GlobalMixboardView: React.FC<GlobalMixboardViewProps> = ({ community, onNavigate }) => {
    const { feeds, calendarEvents, travelSpots, safetyInfo, currentLocation } = useMixboardData();
    const { user, updateProfile } = useUser();
    const [showAISearch, setShowAISearch] = useState(false);

    // Widget Definitions
    const WIDGETS: Record<string, React.ReactNode> = {
        safety: <SafetyGuardWidget safety={safetyInfo} />,
        pulse: <AIPulseWidget />,
        weather: <WeatherWidget location={currentLocation} />,
        calendar: <NeighborhoodCalendarWidget events={calendarEvents} />,
        travel: <TravelRecommendWidget recommendations={travelSpots} />,
        transport: <TransportWidget data={community?.transportation} />,
        sustainability: <SustainabilityStatsWidget data={community?.sustainabilityStats} />
    };

    const DEFAULT_ORDER = ['safety', 'transport', 'sustainability', 'pulse', 'weather', 'calendar', 'travel'];
    const currentOrder = user?.widgetOrder || DEFAULT_ORDER;

    const moveWidget = (id: string, direction: 'up' | 'down') => {
        const index = currentOrder.indexOf(id);
        if (index === -1) return;

        const newOrder = [...currentOrder];
        const newIndex = direction === 'up' ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= newOrder.length) return;

        // Swap
        [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
        updateProfile({ widgetOrder: newOrder });
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-[1440px] mx-auto min-h-screen bg-[#FDFCF8] relative">
            {/* ... (keep header parts same) ... */}
            {/* AI Search Overlay */}
            {showAISearch && (
                <AISearchOverlay
                    onClose={() => setShowAISearch(false)}
                    currentLocation={`${currentLocation.city} ${currentLocation.district || ''}`}
                />
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 px-8 bg-white/50 backdrop-blur-sm rounded-[2rem] border border-[#E7E5E4] shadow-sm hover:shadow-md transition-all relative z-10">
                <div className="flex items-center gap-5">
                    <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#E7E5E4] shadow-sm">
                        <Palette className="w-7 h-7 text-[#78716C]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-serif text-[#44403C] tracking-tight font-bold flex items-center gap-2">
                            我的鄰里主頁
                        </h1>
                        <p className="text-[#A8A29E] text-sm font-medium tracking-wide">個人化的社區資訊中心 · 溫暖連結每一刻</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAISearch(!showAISearch)}
                        className={`p-3 rounded-full transition-all border shadow-sm flex items-center gap-2 ${showAISearch ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-[#FAF9F6] hover:bg-[#F5F5F4] text-[#A8A29E] hover:text-[#57534E] border-[#E7E5E4]'}`}
                        title="AI 智能社區助理"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-bold hidden md:inline">{showAISearch ? '關閉助理' : '智能助理'}</span>
                    </button>
                </div>
            </div>

            {/* Main Content Layout - Two Columns Independent Scroll */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px] overflow-hidden">

                {/* LEFT: Feed Column (Main Scroll) - 8/12 width */}
                <div className="lg:col-span-8 h-full overflow-y-auto custom-scrollbar rounded-[2rem] bg-white border border-[#E7E5E4] shadow-sm">
                    <VillageFeedsWidget feeds={feeds} onNavigate={onNavigate} />
                </div>

                {/* RIGHT: Sidebar Tools (Independent Scroll) - 4/12 width */}
                <div className="lg:col-span-4 h-full overflow-y-auto custom-scrollbar space-y-4 pr-1 relative">
                    {currentOrder.map((widgetId, idx) => (
                        <div key={widgetId} className="group relative rounded-[2rem] overflow-hidden bg-white border border-[#E7E5E4] shadow-sm h-[280px] shrink-0">
                            {/* Reorder Controls */}
                            <div className="absolute top-4 right-16 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => moveWidget(widgetId, 'up')}
                                    disabled={idx === 0}
                                    className="p-1.5 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200 text-slate-400 hover:text-emerald-600 disabled:opacity-30 shadow-sm transition-all"
                                >
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => moveWidget(widgetId, 'down')}
                                    disabled={idx === currentOrder.length - 1}
                                    className="p-1.5 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200 text-slate-400 hover:text-emerald-600 disabled:opacity-30 shadow-sm transition-all"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </div>
                            {WIDGETS[widgetId]}
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col md:flex-row items-center justify-between py-8 text-[#A8A29E] gap-4 border-t border-[#E7E5E4]/50 mt-12">
                <p className="text-xs tracking-wide font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E7E5E4]"></span>
                    © 2026 社區脈動 Community Pulse · 全球化地方治理平台
                </p>
                <div className="flex gap-6">
                    <button className="text-[10px] hover:text-[#78716C] transition-colors tracking-widest font-bold">使用說明</button>
                    <button className="text-[10px] hover:text-[#78716C] transition-colors tracking-widest font-bold">隱私權政策</button>
                    <button className="text-[10px] hover:text-[#78716C] transition-colors tracking-widest font-bold">幫助中心</button>
                </div>
            </div>
        </div>
    );
};

export default GlobalMixboardView;
