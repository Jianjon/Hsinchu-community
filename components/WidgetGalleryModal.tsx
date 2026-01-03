
import React from 'react';
import { X, CloudSun, Trash2, Bus, Newspaper, Image as ImageIcon, BarChart3, Calendar, Repeat, Tent, Shield, Heart, Briefcase } from 'lucide-react';

interface WidgetGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (type: string) => void;
}

const WIDGET_TEMPLATES = [
    {
        category: '公眾數據',
        items: [
            { type: 'weather', name: '天氣預報', icon: <CloudSun className="w-6 h-6 text-blue-400" />, desc: '即時天氣與氣溫資訊' },
            { type: 'garbage', name: '垃圾清運', icon: <Trash2 className="w-6 h-6 text-green-400" />, desc: '垃圾車抵達時間與點位' },
            { type: 'transport', name: '大眾運輸', icon: <Bus className="w-6 h-6 text-orange-400" />, desc: 'YouBike 與公車動態' },
        ]
    },
    {
        category: '社區動態',
        items: [
            { type: 'feeds', name: '村里動態', icon: <Newspaper className="w-6 h-6 text-purple-400" />, desc: '在地新聞與公告' },
            { type: 'photo', name: '社區攝影', icon: <ImageIcon className="w-6 h-6 text-pink-400" />, desc: '精選在地生活影像' },
            // { type: 'stats', name: '永續指標', icon: <BarChart3 className="w-6 h-6 text-cyan-400" />, desc: '減碳數據與永續進度' },
            // { type: 'care', name: '關懷行動', icon: <Heart className="w-6 h-6 text-red-400" />, desc: '長輩共餐與照護據點' },
            // { type: 'projects', name: '提案進度', icon: <Briefcase className="w-6 h-6 text-indigo-400" />, desc: '社區營造與建設追蹤' },
        ]
    },
    {
        category: '實用工具',
        items: [
            { type: 'calendar', name: '鄰里日曆', icon: <Calendar className="w-6 h-6 text-yellow-400" />, desc: '活動日程與回收週期' },
            // { type: 'exchange', name: '好物流轉', icon: <Repeat className="w-6 h-6 text-emerald-400" />, desc: '二手物品分享與交換' },
            { type: 'travel', name: '輕旅行', icon: <Tent className="w-6 h-6 text-amber-400" />, desc: '在地秘境推薦' },
            // { type: 'safety', name: '平安守護', icon: <Shield className="w-6 h-6 text-slate-400" />, desc: '防災資訊與巡守動態' },
        ]
    }
];

const WidgetGalleryModal: React.FC<WidgetGalleryModalProps> = ({ isOpen, onClose, onAdd }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1a1c1e] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-transparent">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">組件庫</h2>
                        <p className="text-white/40 text-sm">點擊元件以將其新增至您的儀表板</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-8">
                        {WIDGET_TEMPLATES.map((cat, idx) => (
                            <div key={idx} className="space-y-4">
                                <h3 className="text-xs font-semibold text-white/30 tracking-wider uppercase pl-1">
                                    {cat.category}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {cat.items.map(item => (
                                        <button
                                            key={item.type}
                                            onClick={() => {
                                                onAdd(item.type);
                                                onClose();
                                            }}
                                            className="group flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all text-left"
                                        >
                                            <div className="p-3 bg-black/20 rounded-lg group-hover:scale-110 transition-transform">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <div className="text-white font-medium group-hover:text-blue-300 transition-colors uppercase text-sm tracking-wide">
                                                    {item.name}
                                                </div>
                                                <div className="text-white/40 text-xs mt-1 leading-relaxed">
                                                    {item.desc}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-black/20 text-center text-[10px] text-white/20">
                    提示：部分組件可以在放置後點擊齒輪圖標進行詳細設定。
                </div>
            </div>
        </div>
    );
};

export default WidgetGalleryModal;
