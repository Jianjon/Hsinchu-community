
import React, { useEffect, useState } from 'react';
import { BarChart3, Leaf, Zap, Recycle } from 'lucide-react';
import { SustainabilityStats } from '../../data/mock_public';

interface SustainabilityStatsWidgetProps {
    data?: SustainabilityStats;
}

const SustainabilityStatsWidget: React.FC<SustainabilityStatsWidgetProps> = ({ data }) => {
    // Local state for live sensor jitter
    const [liveCarbon, setLiveCarbon] = useState(data?.carbonReduction.current || 0);

    useEffect(() => {
        if (data?.carbonReduction.current) {
            setLiveCarbon(data.carbonReduction.current);
        }
    }, [data]);

    // Simulate sensor fluctuations
    useEffect(() => {
        const interval = setInterval(() => {
            setLiveCarbon(prev => {
                const change = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
                return prev + change;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    if (!data) return (
        <div className="flex flex-col h-full bg-gradient-to-br from-cyan-500/10 to-transparent p-4 items-center justify-center">
            <span className="text-white/40 text-xs">尚無永續數據</span>
        </div>
    );

    const completionRate = Math.min(100, Math.round((liveCarbon / data.carbonReduction.target) * 100));

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-cyan-500/10 to-transparent p-4">
            <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white tracking-wide">永續生活</h3>
                <span className="ml-auto text-[10px] text-cyan-400/60 uppercase font-mono animate-pulse">SENSOR ACTIVE</span>
            </div>

            <div className="flex-1 space-y-4">
                {/* Carbon Reduction Progress */}
                <div>
                    <div className="flex justify-between text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">
                        <span>本月減碳量</span>
                        <span className="text-cyan-400">{completionRate}% of target</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-cyan-500 transition-all duration-1000 ease-out"
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                </div>

                {/* Grid Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Recycle className="w-3 h-3 text-green-400" />
                            <div className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">回收總量</div>
                        </div>
                        <div className="text-xl font-black text-white">
                            {data.recycling.total}
                            <span className="text-xs font-normal text-white/40 ml-1">{data.recycling.unit}</span>
                        </div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Zap className="w-3 h-3 text-yellow-400" />
                            <div className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">節電效率</div>
                        </div>
                        <div className="text-xl font-black text-white">
                            +{data.powerSaving.efficiency}
                            <span className="text-xs font-normal text-white/40 ml-1">%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                <Leaf className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] text-cyan-300 font-bold tracking-tight">
                    恭喜！本社區已連續 {data.streakMonths} 個月達成減碳目標
                </span>
            </div>
        </div>
    );
};

export default SustainabilityStatsWidget;
