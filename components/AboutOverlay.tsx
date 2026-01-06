import React from 'react';
import { X, Ban, Handshake, DollarSign, Smile } from 'lucide-react';

interface AboutOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

const AboutOverlay: React.FC<AboutOverlayProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const sections = [
        {
            icon: <Ban className="w-6 h-6 text-red-500" />,
            title: "非政治",
            desc: "不涉及政黨色彩，專注於社區公共事務與自發性的治理行動。"
        },
        {
            icon: <Handshake className="w-6 h-6 text-yellow-500" />,
            title: "非評比",
            desc: "不做排名與分數比較，鼓勵良性交流，讓每一個微小的改變都被看見。"
        },
        {
            icon: <DollarSign className="w-6 h-6 text-emerald-600" />,
            title: "非補助",
            desc: "本平台並非官方補助申請管道，僅作為行動紀錄與資源媒合的透明空間。"
        },
        {
            icon: <Smile className="w-6 h-6 text-orange-500" />,
            title: "高齡友善",
            desc: "介面簡單直覺，字體清晰，讓社區長輩也能輕鬆了解並參與社區動態。"
        }
    ];

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="bg-[#FAF9F6] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl relative z-10 flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-[#FAF9F6] px-6 py-4 border-b border-[#E7E5E4] flex items-center justify-between z-20 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-[#A8A29E] hover:text-[#78716C] transition-colors font-bold tracking-widest text-xs"
                    >
                        ← 返回
                    </button>
                    <h2 className="text-lg font-serif text-[#44403C] font-bold tracking-widest">關於本平台</h2>
                    <div className="w-12"></div> {/* Spacer for center alignment */}
                </div>

                {/* Content */}
                <div className="px-6 py-6 md:px-10 md:py-8 overflow-y-auto custom-scrollbar flex-1">

                    {/* Design Philosophy */}
                    <div className="bg-white rounded-[1.5rem] border border-[#E7E5E4] p-6 md:p-8 shadow-sm mb-6">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-serif text-[#44403C] font-bold mb-1">設計理念</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {sections.map((section, idx) => (
                                <div key={idx} className="flex flex-col items-center text-center">
                                    <div className="w-14 h-14 rounded-full bg-[#FAF9F6] flex items-center justify-center mb-4 shadow-inner border border-[#E7E5E4]">
                                        {section.icon}
                                    </div>
                                    <h4 className="text-lg font-serif text-[#44403C] font-bold mb-2">{section.title}</h4>
                                    <p className="text-[#78716C] leading-relaxed text-xs text-justify">
                                        {section.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mission Statement */}
                    <div className="bg-[#F5F5F4] rounded-[1.5rem] p-6 md:p-8 border border-[#E7E5E4]">
                        <h3 className="text-xl font-serif text-[#44403C] font-bold mb-4">為什麼建立這個平台？</h3>
                        <div className="space-y-4 text-[#57534E] leading-loose text-sm font-medium">
                            <p>
                                我們相信，社區的改變源自於對生活的關心。既有的評鑑制度往往流於形式，而許多的在地努力卻因為缺乏數位工具而被忽視。我們期許打造一個互相學習的場域，讓潛藏的社區需求被發掘，讓資源流向最需要的地方，共同成就一個真實互助的共好平台。
                            </p>
                            <p>
                                本平台希望透過 AI 輔助與地圖視覺化，將複雜的數據轉化為易懂的資訊，連結人與社區，推動由下而上的永續治理。
                            </p>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 text-center border-t border-[#E7E5E4] text-[#A8A29E] shrink-0">
                    <p className="font-bold tracking-widest text-xs">© 2026 社團法人台灣願景發展協會</p>
                </div>
            </div>
        </div>
    );
};

export default AboutOverlay;
