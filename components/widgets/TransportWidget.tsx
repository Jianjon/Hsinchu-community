import React from 'react';
import { Bus, Bike, Clock } from 'lucide-react';

const TransportWidget: React.FC = () => {
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
            </div>

            <div className="flex-1 space-y-3 pr-2">
                <div className="p-3 rounded-xl bg-[#EFF6FF]/50 border border-[#DBEAFE] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center text-[#1D4ED8] font-bold text-xs">81</div>
                        <div>
                            <span className="text-xs font-bold text-[#1E3A8A] block">往 新莊車站</span>
                            <span className="text-[10px] text-[#60A5FA]">公道五路站</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-lg font-bold text-[#1D4ED8] block">5<span className="text-xs font-normal ml-0.5">分</span></span>
                    </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FFF7ED]/50 border border-[#FED7AA] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#FFEDD5] flex items-center justify-center text-[#C2410C]">
                            <Bike className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-[#9A3412] block">YouBike</span>
                            <span className="text-[10px] text-[#FB923C]">圖書館站</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-lg font-bold text-[#C2410C] block">12<span className="text-xs font-normal ml-0.5">台</span></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransportWidget;
