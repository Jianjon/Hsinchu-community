import React, { useState, useEffect } from 'react';
import { Sun, Quote } from 'lucide-react';

const PULSE_MESSAGES = [
    {
        time: "08:42 AM",
        content: <>今日社區洋溢著溫暖的氣息，早晨在公園有<span className="text-[#2C3333] font-semibold bg-orange-50 px-1 decoration-orange-200 underline decoration-2 underline-offset-2">12位長輩</span>自發組織的太極拳活動，展現了鄰里間的活力。午後，親子館傳來的歡笑聲是今日最美的旋律...</>
    },
    {
        time: "10:15 AM",
        content: <>社區圖書館今日舉辦了<span className="text-[#2C3333] font-semibold bg-blue-50 px-1 decoration-blue-200 underline decoration-2 underline-offset-2">親子共讀</span>活動，吸引了許多年輕家庭參與。午後的陽光灑落在閱覽室，充滿了書香與溫馨的氛圍...</>
    },
    {
        time: "02:30 PM",
        content: <>午後的社區花園裡，<span className="text-[#2C3333] font-semibold bg-green-50 px-1 decoration-green-200 underline decoration-2 underline-offset-2">綠手指志工隊</span>正在整理春季花卉，蝴蝶在花叢間飛舞，為社區增添了幾分生機與色彩...</>
    }
];

const AIPulseWidget: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % PULSE_MESSAGES.length);
        }, 600000); // 10 minutes
        return () => clearInterval(interval);
    }, []);

    const currentMessage = PULSE_MESSAGES[currentIndex];

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
                    <span className="text-[10px] font-bold text-[#A8A29E] bg-[#F5F5F4] px-2 py-1 rounded-full border border-[#E7E5E4]">
                        {currentMessage.time}
                    </span>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col justify-center relative py-2">
                    <Quote className="absolute top-1 left-0 w-8 h-8 text-orange-100/50" />
                    <p className="font-serif text-[#57534E] text-base leading-relaxed tracking-wide text-justify pt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 key={currentIndex}">
                        <span className="text-orange-300 mr-2">"</span>
                        {currentMessage.content}
                        <span className="text-orange-300 ml-1">"</span>
                    </p>
                </div>

                {/* Footer Info */}
                <div className="pt-3 border-t border-orange-100/50 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                        <span className="text-[10px] tracking-wider text-[#A8A29E] font-medium uppercase">Village AI Analysis</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIPulseWidget;
