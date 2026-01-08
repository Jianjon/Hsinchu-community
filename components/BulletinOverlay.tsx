import React from 'react';
import { X, Globe, Heart, Info, ArrowRight, ExternalLink } from 'lucide-react';

interface BulletinOverlayProps {
    onClose: () => void;
}

const BulletinOverlay: React.FC<BulletinOverlayProps> = ({ onClose }) => {
    return (
        <div className="absolute inset-0 z-[3000] flex items-center justify-center p-8 md:p-16 lg:p-24 animate-in fade-in duration-300 overflow-hidden">
            {/* Background Blur Overlay */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
                onClick={onClose}
            />

            {/* Modal Container: Higher vertical packing for a more letterbox look if needed, or just centered */}
            <div className="relative w-full max-w-5xl bg-[#FDFBF7] rounded-[48px] shadow-2xl flex flex-col overflow-hidden border border-white/20 pointer-events-auto animate-in zoom-in-95 duration-500 max-h-[85vh]">

                {/* Single Column Content Area */}
                <div className="w-full p-6 md:p-8 lg:p-10 flex flex-col relative overflow-y-auto custom-scrollbar">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all z-20"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Header */}
                    <div className="mb-6 md:mb-8 text-center">
                        <h3 className="text-2xl md:text-3xl font-black text-slate-800 font-serif-tc tracking-[0.2em]">設計理念</h3>
                    </div>

                    {/* Main Content: Design Philosophy */}
                    <div className="flex-1 flex flex-col items-center max-w-4xl mx-auto w-full px-4">
                        {/* Core Values Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8 md:mb-10 w-full">
                            {/* Value 1: 非政治 */}
                            <div className="flex flex-col items-center text-center">
                                <div className="w-14 h-14 md:w-16 md:h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-xl md:text-2xl shadow-sm border border-red-100/50 transform hover:scale-110 transition-all hover:shadow-md">
                                    🚫
                                </div>
                                <h4 className="font-black text-slate-800 mb-2 font-serif-tc text-base md:text-lg">非政治</h4>
                                <p className="text-[12px] md:text-[13px] text-slate-500 leading-relaxed font-sans-tc px-1">
                                    不涉及政黨色彩，<br className="hidden md:block" />專注於社區公共事<br className="hidden md:block" />務與自發性的治理<br className="hidden md:block" />行動。
                                </p>
                            </div>

                            {/* Value 2: 非評比 */}
                            <div className="flex flex-col items-center text-center">
                                <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-xl md:text-2xl shadow-sm border border-amber-100/50 transform hover:scale-110 transition-all hover:shadow-md">
                                    🤝
                                </div>
                                <h4 className="font-black text-slate-800 mb-2 font-serif-tc text-base md:text-lg">非評比</h4>
                                <p className="text-[12px] md:text-[13px] text-slate-500 leading-relaxed font-sans-tc px-1">
                                    不做排名與分數比<br className="hidden md:block" />較，鼓勵良性交<br className="hidden md:block" />流，讓每一個微小<br className="hidden md:block" />的改變都被看見。
                                </p>
                            </div>

                            {/* Value 3: 非補助 */}
                            <div className="flex flex-col items-center text-center">
                                <div className="w-14 h-14 md:w-16 md:h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4 text-xl md:text-2xl shadow-sm border border-yellow-100/50 transform hover:scale-110 transition-all hover:shadow-md">
                                    💰
                                </div>
                                <h4 className="font-black text-slate-800 mb-2 font-serif-tc text-base md:text-lg">非補助</h4>
                                <p className="text-[12px] md:text-[13px] text-slate-500 leading-relaxed font-sans-tc px-1">
                                    本平台並非官方補<br className="hidden md:block" />助申請管道，僅作<br className="hidden md:block" />為行動紀錄與資源<br className="hidden md:block" />媒合的透明空間。
                                </p>
                            </div>

                            {/* Value 4: 高齡友善 */}
                            <div className="flex flex-col items-center text-center">
                                <div className="w-14 h-14 md:w-16 md:h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-xl md:text-2xl shadow-sm border border-orange-100/50 transform hover:scale-110 transition-all hover:shadow-md">
                                    👵
                                </div>
                                <h4 className="font-black text-slate-800 mb-2 font-serif-tc text-base md:text-lg">高齡友善</h4>
                                <p className="text-[12px] md:text-[13px] text-slate-500 leading-relaxed font-sans-tc px-1">
                                    介面簡單直覺，字<br className="hidden md:block" />體清晰，讓社區長<br className="hidden md:block" />輩也能輕鬆了解並<br className="hidden md:block" />參與社區動態。
                                </p>
                            </div>
                        </div>

                        {/* Why Box */}
                        <div className="w-full bg-slate-50/80 rounded-[24px] md:rounded-[32px] p-5 md:p-7 text-left border border-slate-100 mb-4 shadow-sm">
                            <h4 className="text-lg md:text-xl font-black text-slate-800 mb-3 font-serif-tc">為什麼建立這個平台？</h4>
                            <p className="text-[12px] md:text-[13.5px] text-slate-600 leading-relaxed font-sans-tc mb-3 opacity-80 text-justify">
                                我們相信，社區的改變源自於對生活的關心，但許多在地行動與經驗，往往因缺乏整理與呈現而被忽略。本平台透過 AI 輔助與地圖視覺化，將分散各地的社區行動、知識與成果加以彙整，轉化為可理解、可交流的公共資訊，讓社區之間能彼此參考、學習，而不再孤立摸索。
                            </p>
                            <p className="text-[12px] md:text-[13.5px] text-slate-600 leading-relaxed font-sans-tc opacity-80 text-justify">
                                同時，平台也希望促進更公平的資源連結。透過呈現社區的實際需求與行動脈絡，讓資源提供者理解弱勢處境背後的真實情境，使各種支持能更貼近實際需要，逐步形成人與社區彼此支持、共同前進的共好關係。
                            </p>
                        </div>
                    </div>

                    {/* Footer: Simplified and Centered */}
                    <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col items-center justify-center gap-2 w-full">
                        <h4 className="text-lg font-black text-slate-800 font-serif-tc flex items-center gap-2 justify-center">
                            <Heart className="w-5 h-5 text-[#8DAA91]" />
                            社團法人台灣願景發展協會
                        </h4>
                        <p className="text-[10px] text-slate-400 font-sans-tc tracking-wider text-center">
                            © 2025 新竹社區共好平台
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                .font-serif-tc { font-family: 'Noto Serif TC', serif; }
                .font-sans-tc { font-family: 'Noto Sans TC', sans-serif; }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

export default BulletinOverlay;
