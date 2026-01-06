import React, { useState, useEffect } from 'react';
import { ChevronRight, X, Globe, Heart, ShieldCheck, Sparkles } from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { getTotalUserCount } from '../services/firestoreService';

interface LandingOverlayProps {
    onEnter: () => void;
}

const LandingOverlay: React.FC<LandingOverlayProps> = ({ onEnter }) => {
    const { login, visualMode, setVisualMode } = useUser();
    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [userCount, setUserCount] = useState<number>(0);

    // Fetch real user count on mount
    useEffect(() => {
        getTotalUserCount().then(count => {
            // If count is very low (prototype stage), we can add a base number 
            // but the user said "don't use fake", so let's show real count.
            setUserCount(count);
        });
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        login();
        onEnter();
    };

    const handleGuestEntry = () => {
        onEnter();
    };

    const beliefs = [
        {
            icon: <Heart className="w-5 h-5" />,
            title: "在地連結",
            desc: "深入鄉鎮，挖掘那些被遺忘的故事與溫暖。"
        },
        {
            icon: <Sparkles className="w-5 h-5" />,
            title: "共好生活",
            desc: "我們相信，一個人的小事，是社區的大事。"
        },
        {
            icon: <ShieldCheck className="w-5 h-5" />,
            title: "溫暖共融",
            desc: "不分老幼，這裡是你我共築的溫暖港灣。"
        }
    ];

    return (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center p-4 md:p-12 overflow-y-auto">
            {/* Background Blur Overlay */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl pointer-events-auto" onClick={onEnter} />

            {/* Modal Container */}
            <div className="relative w-full max-w-6xl bg-[#FAFAF5] rounded-[48px] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/40 pointer-events-auto animate-in zoom-in-95 duration-700">

                {/* Close Button Mobile */}
                <button
                    onClick={onEnter}
                    className="absolute top-8 right-8 z-30 p-3 bg-white/80 backdrop-blur-md text-slate-400 hover:text-[#8DAA91] rounded-full shadow-lg md:hidden transition-all active:scale-90"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Left Side: Story & Beliefs (Wenqing Style) */}
                <div className="md:w-1/2 p-10 md:p-16 flex flex-col justify-between relative overflow-hidden shrink-0">
                    {/* Background Illustration */}
                    <div className="absolute inset-0 z-0">
                        <img
                            src="/Users/jon/.gemini/antigravity/brain/e81c3149-892e-4200-88ba-ec828a4a3721/wenqing_hsinchu_landscape_1767255961802.png"
                            alt="background"
                            className="w-full h-full object-cover opacity-30 mix-blend-multiply transition-transform duration-[20s] hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#FAFAF5]/80 via-transparent to-[#FAFAF5]/90" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-10 group cursor-default">
                            <div className="w-14 h-14 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-[#8DAA91]/10 group-hover:rotate-12 transition-transform duration-500">
                                <Globe className="w-7 h-7 text-[#8DAA91]" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-[#2D3436] font-serif-tc tracking-tight">
                                    新竹社區共好平台
                                </h1>
                                <p className="text-[10px] font-black text-[#8DAA91] tracking-[0.3em] uppercase">Hsinchu Community Pulse</p>
                            </div>
                        </div>

                        <div className="max-w-md mb-12">
                            <h2 className="text-4xl md:text-5xl font-black text-[#2D3436] mb-8 leading-[1.3] font-serif-tc">
                                在新竹的風中，<br />
                                吹響共好的號角。
                            </h2>
                            <p className="text-[#636E72] font-medium text-lg leading-relaxed font-sans-tc italic opacity-90">
                                「這裡是一個屬於你我的在地連結平台，讓每一顆想服務社區的心，都能找到發芽的土壤。」
                            </p>
                        </div>

                        {/* Beliefs Grid */}
                        <div className="space-y-8">
                            {beliefs.map((b, idx) => (
                                <div key={idx} className="flex gap-4 group">
                                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#8DAA91] shadow-md group-hover:bg-[#8DAA91] group-hover:text-white transition-all duration-300">
                                        {b.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-[#2D3436] mb-1 font-sans-tc text-sm tracking-wide">{b.title}</h4>
                                        <p className="text-xs text-[#636E72] font-medium leading-relaxed opacity-80">{b.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 mt-16 flex items-center gap-6">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-11 h-11 rounded-full border-4 border-[#FAFAF5] bg-white flex items-center justify-center overflow-hidden shadow-sm scale-100 hover:scale-110 transition-transform duration-300 cursor-pointer">
                                    <img src={`https://i.pravatar.cc/100?u=${i + 120}`} alt="user" />
                                </div>
                            ))}
                        </div>
                        <div>
                            <p className="text-sm font-black text-[#2D3436] mb-0.5">{userCount > 0 ? userCount.toLocaleString() : '...'} 居民已加入</p>
                            <p className="text-[10px] font-bold text-[#8DAA91]/60 tracking-widest uppercase">Community Members</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Interaction Form (Elegant White) */}
                <div className="md:w-1/2 p-10 md:p-20 bg-white relative flex flex-col justify-center border-l border-slate-100">
                    {/* PC Close Button */}
                    <button
                        onClick={onEnter}
                        className="absolute top-12 right-12 p-3 text-slate-300 hover:text-[#8DAA91] hover:bg-[#8DAA91]/5 rounded-full transition-all hidden md:block"
                    >
                        <X className="w-7 h-7" />
                    </button>

                    <div className="mb-12 max-w-sm">
                        <h3 className="text-3xl font-black text-[#2D3436] mb-4 font-serif-tc">開始你的冒險</h3>
                        <p className="text-[#636E72] font-bold text-sm leading-relaxed font-sans-tc opacity-70">
                            選擇你最舒適的瀏覽方式，然後進入這片溫暖的社區。
                        </p>
                    </div>

                    {/* Mode Selection with creative layout */}
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <button
                            type="button"
                            onClick={() => setVisualMode('standard')}
                            className={`group flex flex-col items-center justify-center p-6 rounded-[32px] border-2 transition-all duration-500 gap-3
                                ${visualMode === 'standard'
                                    ? 'border-[#8DAA91] bg-[#8DAA91]/5 text-[#8DAA91] shadow-2xl shadow-[#8DAA91]/10 px-8'
                                    : 'border-slate-50 bg-[#F8FAFC] text-slate-400 hover:bg-[#F1F5F9]'}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black transition-all duration-500 
                                ${visualMode === 'standard' ? 'bg-[#8DAA91] text-white scale-110' : 'bg-slate-200 text-slate-400'}`}>
                                A
                            </div>
                            <span className="text-xs font-black tracking-[0.2em] uppercase">標準清晰</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setVisualMode('senior')}
                            className={`group flex flex-col items-center justify-center p-6 rounded-[32px] border-2 transition-all duration-500 gap-3
                                ${visualMode === 'senior'
                                    ? 'border-[#8DAA91] bg-[#8DAA91]/5 text-[#8DAA91] shadow-2xl shadow-[#8DAA91]/10 px-8'
                                    : 'border-slate-50 bg-[#F8FAFC] text-slate-400 hover:bg-[#F1F5F9]'}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black transition-all duration-500 
                                ${visualMode === 'senior' ? 'bg-[#8DAA91] text-white scale-110' : 'bg-slate-200 text-slate-400'}`}>
                                A+
                            </div>
                            <span className="text-xs font-black tracking-[0.2em] uppercase">友善大字</span>
                        </button>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div className="flex flex-col gap-5 pt-4">
                            <button
                                type="submit"
                                className="w-full py-5 text-white rounded-[24px] font-black shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 group relative overflow-hidden"
                                style={{ backgroundColor: '#8DAA91', boxShadow: '0 20px 40px -10px rgba(141,170,145,0.4)' }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                                <span className="relative z-10 text-lg">登入 / 加入社區</span>
                                <ChevronRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                type="button"
                                onClick={handleGuestEntry}
                                className="w-full py-2 text-slate-400 font-bold text-sm hover:text-[#8DAA91] transition-all font-sans-tc text-center tracking-widest hover:tracking-[0.2em]"
                            >
                                先等等，我先隨便看看
                            </button>
                        </div>
                    </form>

                    {/* Decorative Symbol */}
                    <div className="absolute -bottom-12 -right-12 w-48 h-48 opacity-5 pointer-events-none">
                        <img
                            src="/Users/jon/.gemini/antigravity/brain/e81c3149-892e-4200-88ba-ec828a4a3721/community_warmth_symbol_1767255976593.png"
                            alt="symbol"
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>
            </div>

            {/* Custom Fonts (Mock Loading - assuming standard Serif is available in the environment) */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@700;900&display=swap');
                .font-serif-tc {
                    font-family: 'Noto Serif TC', serif;
                }
            `}</style>
        </div>
    );
};

export default LandingOverlay;
