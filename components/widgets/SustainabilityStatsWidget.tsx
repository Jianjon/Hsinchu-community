
import React from 'react';
import { BarChart3, Leaf } from 'lucide-react';

const SustainabilityStatsWidget: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-cyan-500/10 to-transparent p-4">
            <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white tracking-wide">永續生活</h3>
            </div>

            <div className="flex-1 space-y-4">
                <div>
                    <div className="flex justify-between text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">
                        <span>本月減碳量</span>
                        <span className="text-cyan-400">85% of target</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 w-[85%]" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                        <div className="text-[10px] text-white/30 uppercase font-bold mb-1 tracking-tighter">回收總量</div>
                        <div className="text-xl font-black text-white">420<span className="text-xs font-normal text-white/40 ml-1">kg</span></div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                        <div className="text-[10px] text-white/30 uppercase font-bold mb-1 tracking-tighter">節電效率</div>
                        <div className="text-xl font-black text-white">+12<span className="text-xs font-normal text-white/40 ml-1">%</span></div>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                <Leaf className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] text-cyan-300 font-bold tracking-tight">恭喜！本社區已連續 3 個月達成減碳目標</span>
            </div>
        </div>
    );
};

export default SustainabilityStatsWidget;
