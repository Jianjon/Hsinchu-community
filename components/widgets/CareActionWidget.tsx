
import React from 'react';
import { Heart, MapPin, Phone, Users } from 'lucide-react';
import { PublicCommunity } from '../data/mock_public';

interface CareActionWidgetProps {
    community?: PublicCommunity;
}

const CareActionWidget: React.FC<CareActionWidgetProps> = ({ community }) => {
    // In a real app, this would fetch from a 'care' collection
    // We'll use mock data if community.careActions is empty
    const careData = community?.careActions?.length ? community.careActions : [
        { title: "長輩共餐服務", location: "社區集會所", time: "每週二、四 11:30", type: "meal" },
        { title: "健康血壓量測", location: "活動中心", time: "每週三 09:00", type: "health" },
        { title: "關懷電話志工組", location: "線上/據點", time: "隨時", type: "vol" }
    ];

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-red-500/10 to-transparent p-4">
            <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-white tracking-wide">關懷行動</h3>
            </div>

            <div className="flex-1 space-y-3">
                {careData.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-red-500/20 transition-all">
                        <div className="text-sm font-semibold text-white/90 mb-1 flex items-center justify-between">
                            {item.title}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">
                                {item.type === 'meal' ? '供餐' : item.type === 'health' ? '健康' : '志工'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-white/40">
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {item.location}
                            </div>
                            <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {item.time}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex gap-4 text-[10px] text-white/30">
                <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    志工專線：03-XXX-XXXX
                </div>
            </div>
        </div>
    );
};

export default CareActionWidget;
