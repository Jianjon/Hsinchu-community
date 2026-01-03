import React from 'react';
import { Trash2, Clock, MapPin } from 'lucide-react';

const GarbageTruckWidget: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-5 bg-white relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#22C55E]"></div>

            <div className="flex items-center justify-between mb-4 pl-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#DCFCE7] rounded-lg text-[#15803D]">
                        <Trash2 className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[#166534]">垃圾清運</span>
                </div>
                <span className="text-[10px] font-bold text-[#22C55E] bg-[#F0FDF4] px-2 py-1 rounded-md">LIVE</span>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-4 pl-2">
                <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#86EFAC] mt-0.5" />
                    <div>
                        <span className="block text-2xl font-serif font-bold text-[#14532D]">19:30</span>
                        <span className="text-xs text-[#86EFAC] font-medium">預計抵達</span>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#86EFAC] mt-0.5" />
                    <div>
                        <span className="block text-sm font-bold text-[#14532D]">建功一路 58號</span>
                        <span className="text-xs text-[#86EFAC] font-medium">350公尺 • 2 站</span>
                    </div>
                </div>
            </div>

            <button className="mt-auto w-full py-2 bg-[#F0FDF4] text-[#15803D] text-xs font-bold rounded-lg hover:bg-[#DCFCE7] transition-colors">
                查看路線
            </button>
        </div>
    );
};

export default GarbageTruckWidget;
