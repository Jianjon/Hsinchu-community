import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock, ArrowRight } from 'lucide-react';
import { PublicCommunity, PublicEvent, CommunityAction } from '../data/mock_public';

interface CalendarSidebarProps {
    communities: PublicCommunity[];
    onBack: () => void;
    onNavigateToVillage: (villageId: string) => void;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
    communities,
    onBack,
    onNavigateToVillage
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Aggregate all events and actions
    const allActivities = useMemo(() => {
        const activities: Array<{
            id: string;
            title: string;
            date: string;
            villageId: string;
            villageName: string;
            type: 'event' | 'action';
            category: string;
        }> = [];

        communities.forEach(village => {
            // Events
            village.events?.forEach(e => {
                activities.push({
                    id: e.id,
                    title: e.title,
                    date: e.date,
                    villageId: village.id,
                    villageName: village.name,
                    type: 'event',
                    category: e.type
                });
            });

            // Care Actions
            village.careActions?.forEach(a => {
                activities.push({
                    id: a.id,
                    title: a.title,
                    date: a.date,
                    villageId: village.id,
                    villageName: village.name,
                    type: 'action',
                    category: a.type
                });
            });
        });

        return activities.sort((a, b) => a.date.localeCompare(b.date));
    }, [communities]);

    // Calendar logic
    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const numDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    const monthName = currentDate.toLocaleString('zh-TW', { month: 'long' });

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    // Group activities by date
    const activitiesByDate = useMemo(() => {
        const map: Record<string, typeof allActivities> = {};
        allActivities.forEach(act => {
            if (!map[act.date]) map[act.date] = [];
            map[act.date].push(act);
        });
        return map;
    }, [allActivities]);

    // Upcoming list (Today + 6 days)
    const upcomingActivities = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        return allActivities.filter(act => {
            const actDate = new Date(act.date);
            return actDate >= today && actDate < nextWeek;
        });
    }, [allActivities]);

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#FDFBF7]">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white">
                <button
                    onClick={onBack}
                    className="font-bold flex items-center gap-1 text-sm hover:underline"
                    style={{ color: '#8DAA91' }}
                >
                    <ChevronLeft className="w-4 h-4" /> 返回區域列表
                </button>
                <div className="flex items-center gap-1.5 text-slate-800 font-black">
                    <CalendarIcon className="w-4 h-4" />
                    <span>社區行事曆</span>
                </div>
            </div>

            {/* Monthly Calendar Grid */}
            <div className="p-4">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-800">{year}年 {monthName}</h3>
                    <div className="flex gap-1">
                        <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-md transition-colors">
                            <ChevronLeft className="w-5 h-5 text-slate-400" />
                        </button>
                        <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-md transition-colors">
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-lg overflow-hidden shadow-sm">
                    {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                        <div key={d} className="bg-slate-50 py-2 text-center text-[10px] font-bold text-slate-400 uppercase">
                            {d}
                        </div>
                    ))}
                    {Array.from({ length: 42 }).map((_, i) => {
                        const dayNum = i - startDay + 1;
                        const isCurrentMonth = dayNum > 0 && dayNum <= numDays;
                        const dateStr = isCurrentMonth ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}` : '';
                        const hasActivity = dateStr && activitiesByDate[dateStr];

                        return (
                            <div
                                key={i}
                                className={`h-10 bg-white relative flex items-center justify-center text-sm font-medium ${!isCurrentMonth ? 'bg-slate-50/50' : ''}`}
                            >
                                <span className={isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}>
                                    {isCurrentMonth ? dayNum : ''}
                                </span>
                                {hasActivity && (
                                    <div className="absolute bottom-1.5 w-1 h-1 rounded-full" style={{ backgroundColor: '#8DAA91' }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Upcoming Events List */}
            <div className="flex-1 overflow-y-auto px-4 pb-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ArrowRight className="w-3 h-3" /> 近日活動 (7 天內)
                </h4>

                <div className="space-y-3">
                    {upcomingActivities.length > 0 ? (
                        upcomingActivities.map(act => (
                            <button
                                key={`${act.type}-${act.id}`}
                                onClick={() => onNavigateToVillage(act.villageId)}
                                className="w-full text-left p-3 rounded-xl border border-slate-100 bg-white hover:shadow-md transition-all group"
                                style={{
                                    border: '1px solid #f1f5f9'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8DAA91'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#f1f5f9'}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${act.type === 'event' ? 'bg-purple-50 text-purple-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {act.type === 'event' ? '活動' : '行動'}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                                        {act.date.split('-').slice(1).join('/')}
                                    </span>
                                </div>
                                <h5 className="font-bold text-slate-800 text-sm mb-1 group-hover:opacity-80 transition-colors" style={{ transition: 'color 0.2s' }}>
                                    {act.title}
                                </h5>
                                <div className="flex items-center gap-3 text-slate-400 text-xs">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        <span>{act.villageName}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{act.category}</span>
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="py-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                            <CalendarIcon className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-xs text-slate-400">近日無排定活動</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarSidebar;
