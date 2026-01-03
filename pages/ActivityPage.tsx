import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, MapPin, Search, Clock } from 'lucide-react';
import { PublicCommunity, PublicEvent } from '../data/mock_public';
import { getPublicCommunities } from '../services/publicDataAdaptor';

interface ActivityItem extends PublicEvent {
    communityName: string;
    district: string;
    communityId: string;
}

const ActivityPage: React.FC = () => {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const load = async () => {
            const communities = await getPublicCommunities();
            const allEvents: ActivityItem[] = communities.flatMap(c =>
                c.events.map(e => ({
                    ...e,
                    communityName: c.name,
                    district: c.district,
                    communityId: c.id
                }))
            );

            // Sort by date (descending)
            const sorted = allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setActivities(sorted);
            setLoading(false);
        };
        load();
    }, []);

    const filteredActivities = activities.filter(a =>
        a.title.toLowerCase().includes(filter.toLowerCase()) ||
        a.communityName.toLowerCase().includes(filter.toLowerCase()) ||
        a.district.toLowerCase().includes(filter.toLowerCase()) ||
        a.type.toLowerCase().includes(filter.toLowerCase())
    );

    const getTagColor = (type: string) => {
        switch (type) {
            case '市集': return 'bg-orange-100 text-orange-700 border-orange-200';
            case '走讀': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case '輕旅行': return 'bg-blue-100 text-blue-700 border-blue-200';
            case '工作坊': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-1 text-slate-500 hover:text-emerald-600 font-bold">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">返回首頁</span>
                    </Link>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                        最新活動
                    </h1>
                    <div className="w-8"></div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Search Bar */}
                <div className="mb-8 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="搜尋活動、社區或類型..."
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="text-center py-20 text-slate-400">載入中...</div>
                ) : (
                    <div className="space-y-6">
                        {filteredActivities.length > 0 ? (
                            filteredActivities.map((activity) => (
                                <div key={activity.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTagColor(activity.type)}`}>
                                                {activity.type}
                                            </span>
                                            <div className="flex items-center text-slate-400 text-sm">
                                                <Clock className="w-4 h-4 mr-1" />
                                                {activity.date}
                                            </div>
                                        </div>

                                        <h2 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-emerald-600 transition-colors leading-tight">
                                            {activity.title}
                                        </h2>

                                        <p className="text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                                            {activity.description || "暫無活動描述。"}
                                        </p>

                                        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4 text-emerald-500" />
                                                <span>{activity.district} · {activity.location || "社區中心"}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Tag className="w-4 h-4 text-emerald-500" />
                                                <Link to={`/community/${activity.communityId}`} className="hover:text-emerald-600 underline">
                                                    {activity.communityName}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/community/${activity.communityId}`}
                                        className="h-fit bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-6 py-3 rounded-xl font-bold transition-all text-center border border-slate-200 hover:border-emerald-200"
                                    >
                                        進入社區
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                                <p className="text-slate-400">沒有找到符合條件的活動</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Disclaimer */}
            <div className="max-w-4xl mx-auto px-4 pb-20 mt-10 text-center text-slate-400 text-sm">
                <p>以上活動由各社區自主發起，純屬原型展示資料。</p>
            </div>
        </div>
    );
};

export default ActivityPage;
