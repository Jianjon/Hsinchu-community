import React from 'react';
import { Palette, Share2 } from 'lucide-react';
import AIPulseWidget from './widgets/AIPulseWidget';
import WeatherWidget from './widgets/WeatherWidget';
import VillageFeedsWidget from './widgets/VillageFeedsWidget';
import NeighborhoodCalendarWidget from './widgets/NeighborhoodCalendarWidget';
import TravelRecommendWidget from './widgets/TravelRecommendWidget';
import { useMixboardData } from '../hooks/useMixboardData';
import { PublicCommunity } from '../data/mock_public';

interface GlobalMixboardViewProps {
    community: PublicCommunity; // Make explicit
}

const GlobalMixboardView: React.FC<GlobalMixboardViewProps> = ({ community }) => {
    const { feeds, calendarEvents, travelSpots, currentLocation, loadMoreFeeds, loading } = useMixboardData();

    // Static Layout Definition
    // Grid: 3 columns on XL screen
    // Row 1: AI Pulse (Top Left, 2 cols) | Weather (Top Right, 1 col)
    // Row 2: Feeds (Bottom Left, 2 cols, 2 rows) | Calendar (Mid Right, 1 col)
    // Row 3: (Feeds continues) | Travel (Bottom Right, 1 col)
    // Result: Feeds and Travel align at the bottom.
    const widgets = [
        {
            id: 'w-ai-pulse',
            component: AIPulseWidget,
            colSpan: 2,
            rowSpan: 1,
            props: {}
        },
        {
            id: 'w-weather',
            component: WeatherWidget,
            colSpan: 1,
            rowSpan: 1,
            props: { location: currentLocation }
        },
        {
            id: 'w-feeds',
            component: VillageFeedsWidget,
            colSpan: 2,
            rowSpan: 2,
            props: {
                feeds,
                onLoadMore: loadMoreFeeds,
                loading
            }
        },
        {
            id: 'w-calendar',
            component: NeighborhoodCalendarWidget,
            colSpan: 1,
            rowSpan: 1,
            props: { events: calendarEvents }
        },
        {
            id: 'w-travel',
            component: TravelRecommendWidget,
            colSpan: 1,
            rowSpan: 1,
            props: { recommendations: travelSpots }
        },
    ];

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-[1440px] mx-auto min-h-screen bg-[#FDFCF8]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 px-8 bg-white/50 backdrop-blur-sm rounded-[2rem] border border-[#E7E5E4] transition-all hover:shadow-sm">
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
                        className="p-3 bg-[#FAF9F6] hover:bg-[#F5F5F4] text-[#A8A29E] hover:text-[#57534E] rounded-full transition-all border border-[#E7E5E4]"
                        title="分享我的佈局"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Content Layout - Two Columns Independent Scroll */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px] overflow-hidden">

                {/* LEFT: Feed Column (Main Scroll) - 8/12 width */}
                <div className="lg:col-span-8 h-full overflow-y-auto custom-scrollbar rounded-[2rem] bg-white border border-[#E7E5E4] shadow-sm">
                    <VillageFeedsWidget feeds={feeds} />
                </div>

                {/* RIGHT: Sidebar Tools (Independent Scroll) - 4/12 width */}
                <div className="lg:col-span-4 h-full overflow-y-auto custom-scrollbar space-y-4 pr-1">

                    {/* AI Pulse - Standardized Height */}
                    <div className="rounded-[2rem] overflow-hidden bg-white border border-[#E7E5E4] shadow-sm h-[280px] shrink-0">
                        <AIPulseWidget />
                    </div>

                    {/* Weather - Standardized Height */}
                    <div className="rounded-[2rem] overflow-hidden bg-white border border-[#E7E5E4] shadow-sm h-[280px] shrink-0">
                        <WeatherWidget location={currentLocation} />
                    </div>

                    {/* Calendar - Standardized Height */}
                    <div className="rounded-[2rem] overflow-hidden bg-white border border-[#E7E5E4] shadow-sm h-[280px] shrink-0">
                        <NeighborhoodCalendarWidget events={calendarEvents} />
                    </div>

                    {/* Travel - Standardized Height */}
                    <div className="rounded-[2rem] overflow-hidden bg-white border border-[#E7E5E4] shadow-sm h-[280px] shrink-0">
                        <TravelRecommendWidget recommendations={travelSpots} />
                    </div>

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
