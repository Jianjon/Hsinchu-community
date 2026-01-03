import { Calendar as CalendarIcon, Clock, ChevronRight, Check } from 'lucide-react';
import { CalendarEventItem } from '../../hooks/useMixboardData';
import { useNavigate } from 'react-router-dom';

interface NeighborhoodCalendarWidgetProps {
    events?: CalendarEventItem[];
}

const NeighborhoodCalendarWidget: React.FC<NeighborhoodCalendarWidgetProps> = ({ events = [] }) => {
    const navigate = useNavigate();

    // Fallback if empty
    const displayEvents = events.length > 0 ? events : [
        { id: 'mock-1', day: '15', month: '10月', title: '暫無活動', time: '--:--', communityName: '系統', communityId: 'sys', isFollowed: false },
    ];

    return (
        <div className="h-full flex flex-col bg-[#FFFBEB] p-0 relative overflow-hidden group">
            {/* Decor line */}
            <div className="h-1.5 w-full bg-[#F59E0B]/20"></div>

            <div className="p-6 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-[#B45309]" />
                        <span className="font-serif text-lg font-bold text-[#78350F]">社區日曆</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-full border border-[#FDE68A]">關注活動</span>
                </div>

                <div className="space-y-3">
                    {displayEvents.map((evt, i) => (
                        <div
                            key={i}
                            onClick={() => navigate(`/events/${evt.id}`)}
                            className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#FDE68A]/50 shadow-sm hover:shadow-md transition-all cursor-pointer group/item relative"
                        >
                            <div className="flex flex-col items-center justify-center bg-[#FFF7ED] p-2 rounded-lg min-w-[3.5rem] border border-[#FFEDD5]">
                                <span className="text-[10px] font-bold text-[#EA580C] uppercase leading-none">{evt.month}</span>
                                <span className="text-xl font-serif font-bold text-[#9A3412] leading-none mt-1">{evt.day}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[#78350F] font-bold text-sm leading-tight group-hover/item:text-[#B45309] transition-colors truncate">{evt.title}</h4>
                                <div className="flex items-center gap-1 mt-1.5">
                                    <Clock className="w-3 h-3 text-[#D97706]" />
                                    <span className="text-xs text-[#B45309] font-medium">{evt.time}</span>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-[10px] text-[#92400E]/70 bg-[#FEF3C7] px-1.5 rounded-sm">{evt.communityName}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>


            </div>
        </div>
    );
};

export default NeighborhoodCalendarWidget;
