
import React from 'react';
import { Shield, AlertTriangle, PhoneCall } from 'lucide-react';

const SafetyGuardWidget: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-500/10 to-transparent p-4">
            <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-slate-400" />
                <h3 className="font-bold text-white tracking-wide">平安守護</h3>
            </div>

            <div className="flex-1 space-y-4">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                    <div>
                        <div className="text-[10px] font-black text-red-500 uppercase tracking-widest">在地提醒</div>
                        <div className="text-xs text-white/80 font-bold">今日中午預計有強陣風，請留意陽台盆栽。</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl text-xs">
                        <span className="text-white/40 font-medium">巡守隊動態</span>
                        <span className="text-emerald-400 font-bold tracking-tighter uppercase text-[10px]">執行巡邏中</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl text-xs">
                        <span className="text-white/40 font-medium">消防栓查核</span>
                        <span className="text-white/80 font-bold tracking-tighter uppercase text-[10px]">本週已完成</span>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex gap-2">
                <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                    <PhoneCall className="w-3 h-3" />
                    求助專線
                </button>
            </div>
        </div>
    );
};

export default SafetyGuardWidget;
