import React, { useEffect, useState } from 'react';
import { Bus, Bike, Clock, AlertTriangle } from 'lucide-react';
import { TransportInfo } from '../../data/mock_public';

interface TransportWidgetProps {
    data?: TransportInfo;
}

const TransportWidget: React.FC<TransportWidgetProps> = ({ data }) => {
    // Local state to simulate real-time countdown updates
    const [busData, setBusData] = useState(data?.bus || []);

    useEffect(() => {
        if (data?.bus) {
            setBusData(data.bus);
        }
    }, [data]);

    // Simulate minute countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setBusData(prev => prev.map(bus => ({
                ...bus,
                estimateTime: Math.max(0, bus.estimateTime - 1)
            })));
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    if (!data) return (
        <div className="h-full flex items-center justify-center text-slate-400 bg-white">
            <span className="text-xs">尚無交通資訊</span>
        </div>
    );

    return (
        <div className="h-full flex flex-col p-5 bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-[#3B82F6]"></div>

            <div className="flex items-center justify-between mb-4 pr-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#EFF6FF] rounded-lg text-[#1D4ED8]">
                        <Bus className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[#1E3A8A]">大眾運輸</span>
                </div>
                {/* Live Indicator */}
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] text-green-600 font-bold uppercase">LIVE</span>
                </div>
            </div>

            <div className="flex-1 space-y-3 pr-2 overflow-y-auto no-scrollbar">
                {/* BUS LIST */}
                {busData.map((bus, idx) => (
                    <div key={`bus-${idx}`} className="p-3 rounded-xl bg-[#EFF6FF]/50 border border-[#DBEAFE] flex items-center justify-between group hover:bg-[#EFF6FF] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${bus.status === 'delay' ? 'bg-red-100 text-red-600' : 'bg-[#DBEAFE] text-[#1D4ED8]'}`}>
                                {bus.status === 'delay' ? <AlertTriangle className="w-4 h-4" /> : <Bus className="w-4 h-4" />}
                            </div>
                            <div>
                                <span className="text-xs font-bold text-[#1E3A8A] block line-clamp-1">往 {bus.destination}</span>
                                <span className="text-[10px] text-[#60A5FA]">{bus.stationName}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`text-lg font-bold block ${bus.estimateTime <= 3 ? 'text-red-500 animate-pulse' : 'text-[#1D4ED8]'}`}>
                                {bus.estimateTime === 0 ? '進站中' : bus.estimateTime}
                                {bus.estimateTime > 0 && <span className="text-xs font-normal ml-0.5">分</span>}
                            </span>
                        </div>
                    </div>
                ))}

                {/* UBIKE LIST */}
                {data.ubike.map((bike, idx) => (
                    <div key={`bike-${idx}`} className="p-3 rounded-xl bg-[#FFF7ED]/50 border border-[#FED7AA] flex items-center justify-between hover:bg-[#FFF7ED] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bike.availableBikes === 0 ? 'bg-gray-200 text-gray-400' : 'bg-[#FFEDD5] text-[#C2410C]'}`}>
                                <Bike className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-[#9A3412] block">YouBike</span>
                                <span className="text-[10px] text-[#FB923C]">{bike.stationName}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`text-lg font-bold block ${bike.availableBikes < 3 ? 'text-red-500' : 'text-[#C2410C]'}`}>
                                {bike.availableBikes}
                                <span className="text-xs font-normal ml-0.5">台</span>
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TransportWidget;
