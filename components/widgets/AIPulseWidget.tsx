import React, { useState, useEffect } from 'react';
import { Sun, Quote, Loader2 } from 'lucide-react';
import { getAllPosts } from '../../services/interactionService';
import { generateVillagePulse } from '../../services/genAIService';
import { useUser } from '../../hooks/useUser';

interface PulseMessage {
    time: string;
    content: string;
}

const AIPulseWidget: React.FC = () => {
    const { user } = useUser();
    const [pulse, setPulse] = useState<PulseMessage | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPulse = async () => {
        setIsLoading(true);
        try {
            const posts = await getAllPosts();
            const result = await generateVillagePulse(posts, user?.interests);
            setPulse(result);
        } catch (error) {
            console.error('Failed to fetch pulse:', error);
            setPulse({
                time: "08:00 AM",
                content: "今日社區洋溢著溫暖的氣息，早晨在公園有長輩們自發組織的活動，展現了鄰里間的活力。"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPulse();
        const interval = setInterval(fetchPulse, 600000); // 10 minutes
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-[#FFF7ED] via-[#FFFAF5] to-[#FFFFFF] p-6 relative overflow-hidden group">
            {/* Background Decor - Subtle Circle */}
            <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-orange-100/50 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="bg-orange-100 p-1.5 rounded-lg">
                            <Sun className="w-4 h-4 text-orange-500 animate-pulse-slow" />
                        </div>
                        <h3 className="font-serif text-lg font-bold text-[#44403C]">社區脈動</h3>
                    </div>
                    {pulse && (
                        <span className="text-[10px] font-bold text-[#A8A29E] bg-[#F5F5F4] px-2 py-1 rounded-full border border-[#E7E5E4]">
                            {pulse.time}
                        </span>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col justify-center relative py-2">
                    <Quote className="absolute top-1 left-0 w-8 h-8 text-orange-100/50" />
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center space-y-2 py-4">
                            <Loader2 className="w-6 h-6 text-orange-300 animate-spin" />
                            <span className="text-[10px] text-orange-400 font-bold tracking-widest uppercase">AI 分析動態中...</span>
                        </div>
                    ) : (
                        <p className="font-serif text-[#57534E] text-base leading-relaxed tracking-wide text-justify pt-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="text-orange-300 mr-2">"</span>
                            {pulse?.content}
                            <span className="text-orange-300 ml-1">"</span>
                        </p>
                    )}
                </div>

                {/* Footer Info */}
                <div className="pt-3 border-t border-orange-100/50 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                        <span className="text-[10px] tracking-wider text-[#A8A29E] font-medium uppercase">Village AI Pulse</span>
                    </div>
                    <button
                        onClick={() => fetchPulse()}
                        disabled={isLoading}
                        className="text-[10px] font-bold text-orange-400 hover:text-orange-600 transition-colors"
                    >
                        {isLoading ? '解析中...' : '重新整理'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIPulseWidget;
